export default {
  async fetch(request, env) {
    // Allow only POST requests
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      // Read request body
      const body = await request.json();
      const resumeText = body.resumeText;

      if (!resumeText || resumeText.trim().length < 100) {
        return new Response(
          JSON.stringify({ error: "Resume text is too short or empty" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Prompt for Gemini
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
- Give suggestions ONLY if score < 90
- Do NOT add any explanation text
- Do NOT wrap JSON in markdown

Resume:
${resumeText}
`;

      // Call Gemini API
      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
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

      const geminiData = await geminiResponse.json();

      const rawText =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      // Return Gemini response directly
      return new Response(rawText, {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
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
};
