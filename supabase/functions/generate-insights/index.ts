// Supabase Edge Function: generate-insights
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLLM } from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InsightPayload {
  month: string; // "2026-08"
  currency: string; // "INR"
  stats: {
    totalSpendThisMonth: number;
    totalSpendLastMonth: number;
    daysElapsed: number;
    daysInMonth: number;
    projectedEndOfMonthSpend: number;
    categoryMoMChanges: Array<{ category: string; thisMonth: number; lastMonth: number; changePct: number }>;
    topMovers: Array<{ category: string; increase: number; changePct: number }>;
    detectedSubscriptions: Array<{ merchant: string; amount: number; monthsCount: number }>;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: InsightPayload = await req.json();
    const { currency = "INR", stats } = body;

    if (!stats) {
      return new Response(JSON.stringify({ error: "Stats payload is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a blunt, warm personal finance coach.
Currency is ${currency}.
Given these monthly aggregated spending figures, write 3 insight cards.
Each card must have:
- 'type': 'forecast' | 'top_mover' | 'subscription' | 'streak' | 'anomaly'
- 'title': under 8 words, bold and clear
- 'body': under 25 words, blunt, warm, highly specific with numbers.
One card MUST be the end-of-month forecast and whether they are on track.
Rules: No generic advice, no moralising, no emoji, no markdown fences.
Return ONLY a valid JSON array:
[
  { "type": "forecast", "title": "...", "body": "..." },
  { "type": "top_mover", "title": "...", "body": "..." },
  { "type": "subscription", "title": "...", "body": "..." }
]`;

    const userPrompt = `Here are the user's spending numbers:
- Total spend so far this month: ${currency} ${stats.totalSpendThisMonth} (Day ${stats.daysElapsed} of ${stats.daysInMonth})
- Total spend last month: ${currency} ${stats.totalSpendLastMonth}
- Projected end-of-month spend: ${currency} ${stats.projectedEndOfMonthSpend}
- Top category increases: ${JSON.stringify(stats.topMovers)}
- Recurring subscription charges: ${JSON.stringify(stats.detectedSubscriptions)}
Write 3 actionable, high-impact insight cards.`;

    let cards = [];
    try {
      const llmOutput = await callLLM(systemPrompt, userPrompt);
      cards = JSON.parse(llmOutput);
    } catch (err) {
      console.warn("LLM call failed for insights, using deterministic rule-based insights:", err);
      // Deterministic fallback
      cards = [
        {
          type: "forecast",
          title: `Projected spend: ${currency} ${Math.round(stats.projectedEndOfMonthSpend).toLocaleString()}`,
          body: `At your current pace of ${currency} ${Math.round(stats.totalSpendThisMonth / (stats.daysElapsed || 1))}/day, you will spend ${currency} ${Math.round(stats.projectedEndOfMonthSpend).toLocaleString()} this month.`
        },
        {
          type: "top_mover",
          title: stats.topMovers[0] ? `${stats.topMovers[0].category} up by ${Math.round(stats.topMovers[0].changePct)}%` : "Spending pace stable",
          body: stats.topMovers[0]
            ? `${stats.topMovers[0].category} increased by ${currency} ${Math.round(stats.topMovers[0].increase)} compared to last month.`
            : "Your overall category expenses are tracking consistently."
        },
        {
          type: "subscription",
          title: stats.detectedSubscriptions[0]
            ? `Recurring: ${stats.detectedSubscriptions[0].merchant}`
            : "No hidden subscription creep",
          body: stats.detectedSubscriptions[0]
            ? `Detected regular ${currency} ${stats.detectedSubscriptions[0].amount} recurring charge across consecutive months.`
            : "No unexpected repeating charges identified in your recent history."
        }
      ];
    }

    return new Response(JSON.stringify({ insights: cards }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-insights edge function:", error);
    return new Response(
      JSON.stringify({ error: error.message, insights: [] }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
