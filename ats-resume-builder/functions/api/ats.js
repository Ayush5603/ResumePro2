export async function onRequest(context) {
  const request = context.request;
  const env = context.env;

  // 🔒 Explicit method gate
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { "Allow": "POST" }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const resumeText = body.resumeText;

  if (!resumeText || resumeText.length < 100) {
    return new Response(
      JSON.stringify({ error: "Resume text too short" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const prompt = `
Return ONLY JSON:
{
  "ats_score": number,
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[]
}

Resume:
${resumeText}
`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const geminiJson = await geminiRes.json();
  const output =
    geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!output) {
    return new Response(
      JSON.stringify({ error: "Empty AI response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(output, {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
