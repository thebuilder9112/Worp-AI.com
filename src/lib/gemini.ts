import { GoogleGenAI } from "@google/genai";
import { getWorpSystemInstruction } from "./systemPrompt";

// Default fallback API Key if server connection is unavailable or for static exports
const DEFAULT_VITE_API_KEY = (import.meta.env && import.meta.env.VITE_API_KEY) || "";

export async function* streamChat(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  mode: 'standard' | 'code' | 'art' | 'research' = 'standard',
  attachedFile?: { name: string, type: string, data: string } | null
) {
  const isStaticHosting = typeof window !== 'undefined' && 
    (window.location.hostname.endsWith('github.io') || 
     (window.location.hostname.includes('localhost') === false && window.location.protocol === 'file:'));

  const clientKey = DEFAULT_VITE_API_KEY;

  // If on static hosting, directly use client-side streaming
  if (isStaticHosting) {
    try {
      yield* streamDirectClient(message, history, clientKey, attachedFile, mode);
      return;
    } catch (err) {
      console.error("Direct connection failed:", err);
      throw err;
    }
  }

  // Use POST with SSE streaming for reliable large multimodal payload delivery
  const messages = [...history, { role: 'user', content: message }];
  const payload = {
    messages,
    mode,
    chatMode: mode,
    attachedFile
  };

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errText}`);
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported on this response");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.replace(/^data:\s*/, "");
        if (dataStr === "[DONE]") {
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            yield parsed.text;
          }
        } catch (jsonErr: any) {
          if (jsonErr.message && !jsonErr.message.includes("Unexpected token")) {
            throw jsonErr;
          }
        }
      }
    }
  } catch (err: any) {
    console.warn("Server streaming encountered error, attempting direct client fallback:", err);
    try {
      yield* streamDirectClient(message, history, clientKey, attachedFile, mode);
    } catch (fallbackErr: any) {
      throw new Error(fallbackErr?.message || err?.message || "Neural link failure");
    }
  }
}

// Client-side direct stream helper (for static hosting or emergency fallback)
async function* streamDirectClient(
  message: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  apiKey: string,
  attachedFile?: { name: string, type: string, data: string } | null,
  mode: 'standard' | 'code' | 'art' | 'research' = 'standard'
) {
  if (!apiKey || apiKey === "AIzaSyBIrHLPgdDBdmeny7zvSY-EyPZo21T2uAw" || apiKey === "YOUR_API_KEY_HERE") {
    throw new Error("API Key is missing or invalid. Please configure your custom API Key in the Settings menu (Secrets panel) of AI Studio.");
  }
  const ai = new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
  const model = "gemini-3.6-flash";

  const mappedHistory = history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: msg.parts.map(p => ({ text: p.text }))
  })).filter(m => m.parts.some(p => p.text.trim().length > 0));

  let contents: any[] = [...mappedHistory];
  let lastParts: any[] = [];

  if (attachedFile && attachedFile.data) {
    let mimeType = attachedFile.type || "image/jpeg";
    if (!mimeType.includes('/')) {
      mimeType = `image/${mimeType}`;
    }
    if (mimeType.includes('svg') || mimeType.includes('icon')) {
      mimeType = 'image/png';
    }

    let base64Data = attachedFile.data;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    base64Data = base64Data.trim();

    if (base64Data) {
      lastParts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }
  }

  const promptText = message || (attachedFile ? "Please inspect and describe this attached image or file." : "Hello Worp");
  lastParts.push({ text: promptText });
  contents.push({ role: "user", parts: lastParts });

  const systemInstruction = getWorpSystemInstruction({ mode });

  const responseStream = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction
    }
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
