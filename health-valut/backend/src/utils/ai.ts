// Thin wrapper around the Anthropic API for the app's AI features.
// If ANTHROPIC_API_KEY is not set, every function returns a clearly-labeled
// demo response so the app is fully runnable without any external key.

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-5";

export const AI_DEMO_MODE = !API_KEY;

async function callClaude(system: string, userContent: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("AI_DEMO_MODE");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${text}`);
  }

  const data: any = await res.json();
  const textBlock = data.content?.find((c: any) => c.type === "text");
  return textBlock?.text ?? "";
}

const ASSISTANT_SYSTEM = `You are the Health Valut AI Assistant, a general health information helper embedded in a patient's health app.
You provide general health information, basic first-aid guidance, and clear explanations of medical terms.
You are NOT a doctor and must never provide a diagnosis or replace professional care.
Always include a short, natural note encouraging the user to seek professional medical attention for anything serious, urgent, or outside general information.
Keep answers concise, plain-language, and practical.`;

export async function aiAssistantReply(userMessage: string, history: { role: string; content: string }[]) {
  try {
    const context = history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
    const prompt = context ? `${context}\nUSER: ${userMessage}` : userMessage;
    return { reply: await callClaude(ASSISTANT_SYSTEM, prompt), demo: false };
  } catch {
    return {
      reply:
        "[Demo mode — set ANTHROPIC_API_KEY on the backend for real AI responses]\n\n" +
        "Thanks for your question. In general: rest, stay hydrated, monitor your symptoms, and keep the affected area clean if it's a wound. " +
        "Seek professional medical care promptly if you notice worsening pain, fever, spreading redness, difficulty breathing, or any symptom that feels severe or unusual. " +
        "This assistant provides general information only and is not a substitute for a qualified doctor.",
      demo: true,
    };
  }
}

export async function aiExplainReport(reportText: string) {
  const system = `You explain medical reports and lab results in simple, plain language for patients.
Define medical terms, explain what each test generally measures, and describe what the reported values mean in general terms.
Never provide a diagnosis. Encourage the reader to discuss results with their doctor for interpretation specific to them.`;
  try {
    return { explanation: await callClaude(system, reportText), demo: false };
  } catch {
    return {
      explanation:
        "[Demo mode — set ANTHROPIC_API_KEY on the backend for real AI responses]\n\n" +
        "This looks like a routine medical report. In general, lab reports list a test name, your measured value, and a reference range — " +
        "values outside the reference range aren't automatically a problem, but they're worth discussing with your doctor for context specific to your health. " +
        "Ask your doctor to walk through any values you're unsure about.",
      demo: true,
    };
  }
}

export async function aiAnalyzePrescription(prescriptionText: string) {
  const system = `You extract and organize structured information from a prescription's text: medicine names, dosages, frequency, duration, and instructions.
Return a clear, organized plain-text summary grouped by medicine. Never invent medicines that are not present in the text. Note that this is assistive only and the original prescription is the source of truth.`;
  try {
    return { analysis: await callClaude(system, prescriptionText), demo: false };
  } catch {
    return {
      analysis:
        "[Demo mode — set ANTHROPIC_API_KEY on the backend for real AI responses]\n\n" +
        "Once connected, this feature will read the prescription text and list each medicine with its dosage, frequency, duration, " +
        "and instructions in an organized, easy-to-scan format. The original prescription always remains available for verification.",
      demo: true,
    };
  }
}

export async function aiHealthSummary(profileSummary: string) {
  const system = `You generate a concise assistive health summary for a patient from their profile, medical history, records, and prescriptions.
Summarize recent medical events, relevant history, current medications, recent investigations, follow-up items, and notable observations.
Do not invent a numeric "health score". This is an assistive summary, not a diagnosis.`;
  try {
    return { summary: await callClaude(system, profileSummary), demo: false };
  } catch {
    return {
      summary:
        "[Demo mode — set ANTHROPIC_API_KEY on the backend for real AI responses]\n\n" +
        "Once connected, this feature will read the patient's authorized health profile, history, records, and prescriptions " +
        "and generate a short summary covering recent events, current medications, and follow-up items — as an assistive overview, not a diagnosis.",
      demo: true,
    };
  }
}
