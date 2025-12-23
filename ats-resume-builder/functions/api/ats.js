export async function onRequestPost({ request, env }) {
  try {
    // Parse request body
    const body = await request.json();
    const resumeText = body.resumeText;

    // Basic validation
    if (!resumeText || resumeText.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: "Resume text is too short or empty" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Prompt for Gemini
    const prompt = `
You are an Applicant Tracking System (ATS).

Return ONLY valid JSON in this exact format:
{
  "ats_score": number,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}

Rules:
- ats_score must be between 0 and 100
- Do NOT include explanations
- Do NOT wrap JSON in markdown

Resume:
${resumeText}
`;

    // Call Gemini API (SUPPORTED MODEL)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
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
      const errText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: "Gemini API failed", details: errText }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const geminiData = await geminiResponse.json();

    // Extract model text
    const resultText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return new Response(
        JSON.stringify({ error: "Empty response from Gemini" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Return ATS JSON directly
    return new Response(resultText, {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "ATS processing failed",
        details: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
