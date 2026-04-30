import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = import.meta.env.VITE_API_KEY || (import.meta.env as any).GEMINI_API_KEY;

    if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
      throw new Error("Neural link failed: Missing API Key. Please add VITE_API_KEY to your secrets.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function* streamChat(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  mode: 'standard' | 'code' | 'art' | 'research' = 'standard'
) {
  const instructions = {
    standard: "You are Worp AI, a high-end AI terminal assistant. You are concise, powerful, and helpful. You format your output using markdown. You use technical but approachable language.",
    code: "You are Worp Code Architect. You specialize in software engineering, debugging, and system design. Provide deep technical insights, clean code examples, and performance-focused advice. Use a clinical, efficient tone.",
    art: "You are Worp Creative. You specialize in visual design, art history, and creative writing. Use a poetic, inspiring, and expressive tone. Focus on aesthetics, composition, and metaphorical depth.",
    research: "You are Worp Research Analyst. You specialize in data analysis, scientific exploration, and critical thinking. Use a formal, objective, and evidence-based tone. Prioritize accuracy, nuance, and structural logic."
  };

  const ai = getAI();
  const systemInstruction = instructions[mode] + " RESPONSE_PROTOCOL: Be helpful and detailed. Use markdown formatting. If you are creative mode, be descriptive. If you are code mode, provide complete snippets.";

  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: [...history, { role: "user", parts: [{ text: message }] }],
    config: {
      systemInstruction
    }
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) yield text;
  }
}
