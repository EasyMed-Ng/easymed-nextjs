export async function POST(request) {
  try {
    const { patientName, doseLogs, symptomLogs, reason } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Missing Gemini API key on server." }, { status: 500 });
    }

    const prompt = `You are a clinical summarization assistant for a Nigerian chronic-care app called EasyMed.
Generate a SHORT (3-4 sentences max), clinically-toned escalation summary for a pharmacist and physician,
based on the patient data below. Do not diagnose. Do not invent facts not present in the data.
Focus on: adherence pattern, any reported symptoms and severity, and a plain recommendation for next steps.

Patient: ${patientName}
Escalation reason: ${reason}
Recent dose logs (last 14 days): ${JSON.stringify(doseLogs)}
Recent symptom logs: ${JSON.stringify(symptomLogs)}

Return only the summary text, no headers, no markdown.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return Response.json({ error: "Gemini request failed." }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const summary =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "AI HealthWatch detected a risk pattern, but a summary could not be generated. A pharmacist should review this patient's recent logs manually.";

    return Response.json({ summary });
  } catch (err) {
    console.error("analyze-adherence route error:", err);
    return Response.json({ error: "Unexpected server error." }, { status: 500 });
  }
                      }
