import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, context, language = "en" } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("LLM_API_KEY");

    // Graceful fallback if key is not configured in Supabase secrets
    if (!apiKey) {
      return new Response(
        JSON.stringify({ text: null, fallback: true, message: "No server-side Gemini key configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langInstruction =
      language === "te"
        ? "IMPORTANT: Respond fluently in Telugu (తెలుగు లిపి) with bold numbers and bullet points."
        : language === "hi"
        ? "IMPORTANT: Respond fluently in Hindi (हिन्दी देवनागरी लिपि) with bold numbers and bullet points."
        : "Respond in English with bold numbers and bullet points.";

    const systemInstruction = `You are FinAI, an expert, encouraging, and data-driven personal financial copilot in the ClearSpend app.
${langInstruction}
CRITICAL INSTRUCTION:
- You have access to the user's REAL financial ledger transactions provided below.
- ALWAYS answer the user's SPECIFIC question with exact figures, dates, and names from the ledger.
- If asked about a specific merchant (e.g. Zomato, Swiggy, Uber), find and list all occurrences, sum them up, and calculate their % of spend.
- If asked about compounding, SIP, or opportunity cost (e.g. investing ₹2,000 monthly over 5, 10, 20 years at 12% CAGR), perform exact compounding math.
- Format responses cleanly with bold numbers, bullet points, and actionable advice.`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemInstruction}\n\n=== USER LIVE FINANCIAL LEDGER DATA ===\n${context || ""}\n\n=== USER SPECIFIC QUERY ===\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1200,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Fallback model
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const fallbackResp = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (fallbackResp.ok) {
        const data = await fallbackResp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return new Response(
          JSON.stringify({ text, model: "Google Gemini 1.5 Flash" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return new Response(
      JSON.stringify({ text, model: "Google Gemini 2.5 Flash" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ text: null, fallback: true, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
