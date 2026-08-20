// Supabase Edge Function: parse-transaction
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLLM } from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Category {
  id: string;
  name: string;
  kind: "expense" | "income";
}

interface Wallet {
  id: string;
  name: string;
}

interface ParseRequest {
  text: string;
  today?: string;
  currency?: string;
  categories: Category[];
  wallets: Wallet[];
  category_rules?: Array<{ match_text: string; category_id: string }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: ParseRequest = await req.json();
    const { text, today = new Date().toISOString().split("T")[0], currency = "INR", categories = [], wallets = [], category_rules = [] } = body;

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lowerText = text.toLowerCase();

    // Step 1: Check category_rules first (free + instant rule learning)
    let matchedRuleCategory: Category | undefined;
    if (category_rules && category_rules.length > 0) {
      for (const rule of category_rules) {
        if (rule.match_text && lowerText.includes(rule.match_text.toLowerCase())) {
          matchedRuleCategory = categories.find((c) => c.id === rule.category_id);
          if (matchedRuleCategory) break;
        }
      }
    }

    // Step 2: Extract amount & details via LLM or deterministic fallback
    const systemPrompt = `You convert one line of informal Indian expense text into structured JSON.
Today is ${today}. Currency is ${currency}.
Available categories: ${JSON.stringify(categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind })))}.
Available wallets: ${JSON.stringify(wallets.map((w) => ({ id: w.id, name: w.name })))}.

Rules:
1. amount is ALWAYS a positive number.
2. kind is 'expense' unless the text clearly indicates money received (salary, refund, credited, received, cashback).
3. Interpret Indian shorthand: '2k' = 2000, '1.5k' = 1500, '50k' = 50000, '1L' = 100000, 'rs'/'₹'/'inr' are currency markers.
4. Resolve relative dates ('yesterday', 'last friday', 'day before yesterday', 'today') against today (${today}).
5. A credit card bill payment or transfer between own accounts is an EXPENSE of kind 'expense' with category 'Other' or 'Bills & Utilities' — it is NEVER income.
6. Pick the most matching category_id from Available categories.
7. Return ONLY valid JSON, no markdown, no prose:
{
  "amount": number,
  "kind": "expense" | "income",
  "merchant": string,
  "category_id": string,
  "category_confidence": number, // 0.0 to 1.0
  "wallet_id": string | null,
  "txn_date": "YYYY-MM-DD",
  "note": string
}`;

    let parsedResult: any = null;

    try {
      const llmOutput = await callLLM(systemPrompt, `Parse this transaction: "${text}"`);
      parsedResult = JSON.parse(llmOutput);
    } catch (llmErr) {
      console.warn("LLM call failed or produced invalid JSON, falling back to deterministic regex parser:", llmErr);
    }

    // If Rule matched, override category with rule match and high confidence
    if (matchedRuleCategory) {
      if (!parsedResult) {
        parsedResult = {};
      }
      parsedResult.category_id = matchedRuleCategory.id;
      parsedResult.category_confidence = 0.95;
    }

    // Step 3: Validate & sanitize or fallback
    let degraded = false;
    let amount = Number(parsedResult?.amount);

    if (isNaN(amount) || amount <= 0) {
      // Regex fallback: find numbers like 2000, 2k, 1.5k, 500
      degraded = true;
      const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
      const lMatch = text.match(/(\d+(?:\.\d+)?)\s*l\b/i);
      const numMatch = text.match(/(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)/i);

      if (kMatch) {
        amount = Math.round(parseFloat(kMatch[1]) * 1000);
      } else if (lMatch) {
        amount = Math.round(parseFloat(lMatch[1]) * 100000);
      } else if (numMatch) {
        amount = parseFloat(numMatch[1]);
      } else {
        amount = 100;
      }
    }

    const isIncome =
      parsedResult?.kind === "income" ||
      /\b(salary|credited|received|refund|cashback|bonus|stipend)\b/i.test(text);
    const kind = isIncome ? "expense" === "income" ? "expense" : "income" : "expense";

    // Date validation
    let txn_date = parsedResult?.txn_date;
    if (!txn_date || !/^\d{4}-\d{2}-\d{2}$/.test(txn_date)) {
      if (/\byesterday\b/i.test(text)) {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        txn_date = d.toISOString().split("T")[0];
      } else {
        txn_date = today;
      }
    }

    // Category matching validation
    let category_id = parsedResult?.category_id;
    let category_confidence = parsedResult?.category_confidence ?? (matchedRuleCategory ? 0.95 : 0.75);

    const validCategory = categories.find((c) => c.id === category_id);
    if (!validCategory) {
      // Fallback to name match or "Other"
      const matchedByName = categories.find((c) =>
        lowerText.includes(c.name.toLowerCase())
      );
      if (matchedByName) {
        category_id = matchedByName.id;
        category_confidence = 0.85;
      } else {
        const otherCategory = categories.find((c) => c.name.toLowerCase() === "other") || categories[0];
        category_id = otherCategory ? otherCategory.id : null;
        category_confidence = 0.3;
        degraded = true;
      }
    }

    // Merchant / Note extraction
    let merchant = parsedResult?.merchant || "";
    if (!merchant) {
      // Extract words after numbers or clean text
      const cleanWords = text.replace(/(\d+(?:\.\d+)?\s*(k|l)?|rs\.?|inr|₹|today|yesterday)/gi, "").trim();
      merchant = cleanWords.slice(0, 30) || "Expense";
    }

    const note = parsedResult?.note || text;
    const wallet_id = parsedResult?.wallet_id || (wallets[0] ? wallets[0].id : null);

    return new Response(
      JSON.stringify({
        amount: Math.abs(amount),
        kind,
        merchant,
        category_id,
        category_confidence: Math.min(Math.max(Number(category_confidence) || 0.5, 0.1), 0.99),
        txn_date,
        wallet_id,
        note,
        degraded,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in parse-transaction edge function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to parse transaction",
        degraded: true,
        amount: 0,
        kind: "expense",
        merchant: "Unknown",
        txn_date: new Date().toISOString().split("T")[0],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
