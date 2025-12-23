export async function onRequestPost({ request, env }) {
  try {
    const { resumeText } = await request.json();

    if (!resumeText || resumeText.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: "Resume text is too short or empty" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const prompt = `
You are an Applicant Tracking System (ATS).

Analyze the resume text below and return ONLY valid JSON
(no markdown, no explanation, no extra text).

JSON format:
{
  "ats_score": number,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}

Rules:
- Score must be 0–100
- Suggestions ONLY if score < 90

Resume:
${resumeText}
`;

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: "Gemini API error", details: err }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();

    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "Empty response from Gemini" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(rawText, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "ATS analysis failed",
        details: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
