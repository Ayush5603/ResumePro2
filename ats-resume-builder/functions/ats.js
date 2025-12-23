export async function onRequestPost({ request, env }) {
  try {
    // Read request body
    const body = await request.json();
    const resumeText = body.resumeText;

    if (!resumeText || resumeText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Resume text is empty" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Gemini API Key from Cloudflare Environment Variable
    const apiKey = env.GEMINI_API_KEY;

    const prompt = `
You are an ATS (Applicant Tracking System) resume analyzer.

Analyze the resume text below and respond ONLY with valid JSON in this format:

{
  "ats_score": number,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}

Rules:
- ats_score must be between 0 and 100
- strengths, weaknesses, suggestions must be arrays
- If score >= 90, suggestions array can be empty

Resume Text:
${resumeText}
`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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

    const geminiData = await geminiResponse.json();

    // Extract text response safely
    let text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Remove markdown if Gemini adds it
    text = text.replace(/```json|```/g, "").trim();

    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Server error",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
