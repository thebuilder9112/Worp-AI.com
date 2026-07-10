import { GoogleGenAI } from "@google/genai";

async function testRoute() {
  const dataStr = '{"messages":[{"role":"user","content":"hello"}]}';
  try {
    const { messages, chatMode, attachedFile } = JSON.parse(dataStr);
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key missing.");
      return;
    }

    const genAI = new GoogleGenAI({ apiKey });
    
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.response || msg.content || '' }],
    }));

    const lastMessage = messages[messages.length - 1];
    const model = "gemini-3-flash-preview";

    console.log("Calling generateContentStream...");
    const result = await genAI.models.generateContentStream({
      model,
      contents: [...history, { role: "user", parts: [{ text: lastMessage.command || lastMessage.content }] }]
    });

    for await (const chunk of result) {
      console.log("Chunk:", chunk.text);
    }
    console.log("Done");
  } catch (error) {
    console.error("CAUGHT ROUTE ERROR:", error);
  }
}

testRoute();
