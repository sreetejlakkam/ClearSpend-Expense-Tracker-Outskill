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
    const { message, householdContext, language = "en" } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("LLM_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ reply: null, fallback: true, message: "No server-side Gemini key configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langInstruction =
      language === "te"
        ? "IMPORTANT: Respond fluently in Telugu (తెలుగు లిపి) with clear arithmetic and bold numbers."
        : language === "hi"
        ? "IMPORTANT: Respond fluently in Hindi (हिन्दी लिपि) with clear arithmetic and bold numbers."
        : "Respond in English with clear arithmetic, bullet points, and bold numbers.";

    const systemPrompt = `You are Family Finance AI, an empathetic, highly analytical joint money planning assistant in ClearSpend.
${langInstruction}
CRITICAL PRINCIPLES:
1. Always show the exact arithmetic behind your conclusions. Never give a point estimate without explaining the formula.
2. If asked "Can we afford a vacation / purchase?", evaluate:
   - Impact on liquid savings
   - 3-month emergency buffer check (do not allow liquid funds to drop below 3 months of expenses)
   - Impact on competing joint goals
3. If asked about joint investing, show the power of compounding with dual contributions and yearly milestone projections.
4. Privacy is paramount: never invent private line items. Rely strictly on the aggregated figures and shared items provided in the context below.`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\n${householdContext || ""}\n\nUSER QUESTION: ${message}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: "Gemini API error", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate family response.";

    return new Response(
      JSON.stringify({ reply: replyText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
