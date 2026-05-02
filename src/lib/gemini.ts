import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Neural link failed: Missing GEMINI_API_KEY. Please ensure the API key is set in your environment.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function* streamChat(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  mode: 'standard' | 'code' | 'art' | 'research' = 'standard',
  attachedFile?: { name: string, type: string, data: string } | null
) {
  const instructions = {
    standard: "You are Worp AI, a high-end AI terminal assistant. You are concise, powerful, and helpful. You format your output using markdown. You use technical but approachable language.",
    code: "You are Worp Code Architect. You specialize in software engineering, debugging, and system design. Provide deep technical insights, clean code examples, and performance-focused advice. Use a clinical, efficient tone.",
    art: "You are Worp Creative. You specialize in visual design, art history, and creative writing. Use a poetic, inspiring, and expressive tone. Focus on aesthetics, composition, and metaphorical depth.",
    research: "You are Worp Research Analyst. You prioritize accuracy and real-time data using search."
  };

  const ai = getAI();
  let systemInstruction = instructions[mode] + " RESPONSE_PROTOCOL: Be helpful and detailed. Use markdown formatting. If you need real-time data, use the search tool.";

  const userParts: any[] = [{ text: message }];

  if (attachedFile) {
    if (attachedFile.type.startsWith('image/')) {
      userParts.push({
        inlineData: {
          mimeType: attachedFile.type,
          data: attachedFile.data
        }
      });
      systemInstruction += " ANNALYZE_IMAGE: The user has provided an image. Incorporate your analysis of this visual data into your response.";
    } else {
      // It's likely text context
      systemInstruction += `\n\nCONTEXT_FILE_${attachedFile.name.toUpperCase()}:\n${attachedFile.data}\n\nThe user provided a file for context. Reference this data in your response if relevant.`;
    }
  }

  // Enable search grounding for all modes
  const tools: any[] = [{ googleSearch: {} }];

  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: [...history, { role: "user", parts: userParts }],
    config: {
      systemInstruction,
      tools,
    }
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) yield text;
  }
}
