// Supabase Edge Function: detect-duplicates (Deterministic logic - no LLM needed)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransactionItem {
  id: string;
  amount: number;
  kind: string;
  txn_date: string;
  merchant: string;
  fingerprint?: string;
  created_at: string;
}

function levenshteinDistance(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateSimilarity(s1: string, s2: string): number {
  const a = (s1 || '').toLowerCase().trim();
  const b = (s2 || '').toLowerCase().trim();
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;
  if (a === b) return 1.0;
  if (a.includes(b) || b.includes(a)) return 0.95;

  const tokensA = new Set(a.split(/\s+/).filter(Boolean));
  const tokensB = new Set(b.split(/\s+/).filter(Boolean));
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  const tokenSim = union > 0 ? intersection / union : 0;

  if (tokenSim >= 0.3) {
    return Math.max(0.85, tokenSim);
  }

  const maxLen = Math.max(a.length, b.length);
  const dist = levenshteinDistance(a, b);
  const levSim = 1 - dist / maxLen;

  return Math.max(tokenSim, levSim);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { transactions = [], windowDays = 60 } = body;

    const duplicates: Array<{
      a_id: string; // older
      b_id: string; // newer
      reason: string;
      similarity: number;
    }> = [];

    // Compare each pair in the window
    const list: TransactionItem[] = [...transactions].sort(
      (a, b) => new Date(a.txn_date).getTime() - new Date(b.txn_date).getTime()
    );

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const itemA = list[i]; // older by txn_date
        const itemB = list[j]; // newer

        // Check date difference
        const dateA = new Date(itemA.txn_date).getTime();
        const dateB = new Date(itemB.txn_date).getTime();
        const diffDays = Math.abs(dateB - dateA) / (1000 * 60 * 60 * 24);

        if (diffDays > windowDays) continue;

        // Check fingerprint exact match
        if (itemA.fingerprint && itemB.fingerprint && itemA.fingerprint === itemB.fingerprint) {
          duplicates.push({
            a_id: itemA.id,
            b_id: itemB.id,
            reason: "Identical transaction fingerprint detected",
            similarity: 1.0,
          });
          continue;
        }

        // Check amount match + date within 2 days + merchant similarity >= 0.8
        if (Number(itemA.amount) === Number(itemB.amount) && itemA.kind === itemB.kind) {
          if (diffDays <= 2) {
            const sim = calculateSimilarity(itemA.merchant, itemB.merchant);
            if (sim >= 0.75) {
              duplicates.push({
                a_id: itemA.id,
                b_id: itemB.id,
                reason: `Same amount (${itemA.amount}) and merchant within ${Math.round(diffDays)} day(s)`,
                similarity: sim,
              });
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ duplicates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in detect-duplicates edge function:", error);
    return new Response(JSON.stringify({ error: error.message, duplicates: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
