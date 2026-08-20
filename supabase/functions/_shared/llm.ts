// Model-agnostic LLM caller for Supabase Edge Functions
// Reads LLM_API_KEY and LLM_PROVIDER ("gemini" | "openai") from Deno environment

export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const provider = Deno.env.get("LLM_PROVIDER") || "gemini";
  const apiKey = Deno.env.get("LLM_API_KEY");

  if (!apiKey) {
    throw new Error("LLM_API_KEY secret is not configured in Supabase environment.");
  }

  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "{}";
  } else {
    // Default: Gemini (using gemini-2.5-flash or gemini-1.5-flash with JSON mode)
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.1,
        }
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  }
}
