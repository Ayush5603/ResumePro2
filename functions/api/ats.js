export async function onRequestPost({ request, env }) {
  try {
    // 1️⃣ Parse request body
    const body = await request.json();
    const resumeText = body.resumeText;

    if (!resumeText || resumeText.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: "Resume text is too short or empty" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 2️⃣ Build ATS prompt
    const prompt = `
You are an Applicant Tracking System (ATS).

Analyze the resume and return ONLY valid JSON in this exact format:

{
  "ats_score": number,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}

Rules:
- Score from 0 to 100
- If score >= 90, suggestions array must be empty
- Do NOT add explanation text
- Do NOT wrap JSON in markdown

Resume:
${resumeText}
`;

    // 3️⃣ Call Gemini API
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + // [!code --]
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
        JSON.stringify({ error: "Gemini API failed", details: err }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const geminiData = await geminiResponse.json();

    // 4️⃣ Extract Gemini text safely
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "Empty response from Gemini" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 5️⃣ Return JSON directly (frontend parses it)
    return new Response(rawText, {
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

