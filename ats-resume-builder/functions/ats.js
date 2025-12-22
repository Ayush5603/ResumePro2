export default {
  async fetch(request, env) {
    try {
      // Read incoming JSON
      const body = await request.json();
      const resumeText = body.resumeText || "";

      if (!resumeText.trim()) {
        return new Response(
          JSON.stringify({ error: "No resume text received" }),
          { status: 400 }
        );
      }

      // Gemini API key from Cloudflare Environment Variable
      const apiKey = env.GEMINI_API_KEY;

      const url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
        apiKey;

      // AI Prompt
      const prompt = `
You are an ATS (Applicant Tracking System) resume analyzer.

Analyze the following resume text and return only valid JSON in this format:

{
  "ats_score": number,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}

Resume:
${resumeText}
`;

      // Call Gemini API
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      const result = await response.json();

      // Extract text returned by Gemini
      const textResponse =
        result?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      // Clean JSON (sometimes Gemini adds ```json)
      const cleaned = textResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return new Response(cleaned, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "Server error",
          message: err.message,
        }),
        { status: 500 }
      );
    }
  },
};
