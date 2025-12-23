// Cloudflare Pages Function: /api/ats

export async function onRequest(context) {
  const { request, env } = context;

  /* ================= CORS ================= */
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Allow ONLY POST
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    /* ================= READ BODY ================= */
    const body = await request.json();
    const resumeText = body.resumeText;

    if (!resumeText || resumeText.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: "Resume text is too short or empty" }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* ================= PROMPT ================= */
    const prompt = `
You are an Applicant Tracking System (ATS).

Analyze the resume and return ONLY valid JSON in this format:

{
  "ats_score": number,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}

Rules:
- Score from 0 to 100
- Suggestions ONLY if score < 90
- No explanations
- No markdown
- Return raw JSON only

Resume:
${resumeText}
`;

    /* ================= GEMINI API ================= */
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
        env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const geminiData = await geminiRes.json();

    const resultText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("Empty Gemini response");
    }

    /* ================= SUCCESS ================= */
    return new Response(resultText, {
      status: 200,
      headers: corsHeaders
    });

  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "ATS analysis failed",
        details: err.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
