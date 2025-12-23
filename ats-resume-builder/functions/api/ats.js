export async function onRequest(context) {
  const { request, env } = context;

  // ✅ Handle CORS preflight (THIS WAS MISSING)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  // ✅ Allow ONLY POST after preflight
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { resumeText } = await request.json();

    if (!resumeText || resumeText.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: "Resume text too short" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = `
Return ONLY valid JSON.
No markdown. No explanation.

{
  "ats_score": number,
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[]
}

Resume:
${resumeText}
`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const aiData = await aiResponse.json();
    const text =
      aiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "ATS failure", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
