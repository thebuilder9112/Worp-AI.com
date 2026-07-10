import { GoogleGenAI } from "@google/genai";

// Default fallback API Key if server connection is unavailable or for static exports
const DEFAULT_GEMINI_API_KEY = "AIzaSyBIrHLPgdDBdmeny7zvSY-EyPZo21T2uAw";

export async function* streamChat(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  mode: 'standard' | 'code' | 'art' | 'research' = 'standard',
  attachedFile?: { name: string, type: string, data: string } | null
) {
  const isStaticHosting = typeof window !== 'undefined' && 
    (window.location.hostname.endsWith('github.io') || 
     (window.location.hostname.includes('localhost') === false && window.location.protocol === 'file:'));

  const clientKey = DEFAULT_GEMINI_API_KEY;

  // If on static hosting, directly use client-side streaming
  if (isStaticHosting) {
    try {
      yield* streamDirectClient(message, history, clientKey, attachedFile);
      return;
    } catch (err) {
      console.error("Direct connection failed:", err);
      throw err;
    }
  }

  // Otherwise, use the standard secure server-side proxy
  const messages = [...history, { role: 'user', content: message }];
  const queryData = encodeURIComponent(JSON.stringify({ messages, mode, attachedFile }));
  const eventSource = new EventSource(`/api/chat/stream?data=${queryData}`);

  const messageQueue: string[] = [];
  let isDone = false;
  let error: string | null = null;

  eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
      isDone = true;
      eventSource.close();
      return;
    }

    try {
      const data = JSON.parse(event.data);
      if (data.error) {
        error = data.error;
        eventSource.close();
      } else if (data.text) {
        messageQueue.push(data.text);
      }
    } catch (e) {
      console.error("Failed to parse SSE data", e);
    }
  };

  eventSource.onerror = () => {
    // If server stream disconnects or fails, trigger client-side fallback seamlessly
    error = "__FALLBACK__";
    eventSource.close();
  };

  while (!isDone || messageQueue.length > 0) {
    if (error === "__FALLBACK__") {
      try {
        yield* streamDirectClient(message, history, clientKey, attachedFile);
        return;
      } catch (err: any) {
        throw new Error(`Direct connection failed: ${err?.message || err}`);
      }
    } else if (error) {
      throw new Error(error);
    }

    if (messageQueue.length > 0) {
      yield messageQueue.shift()!;
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

// Client-side direct stream helper
async function* streamDirectClient(
  message: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  apiKey: string,
  attachedFile?: { name: string, type: string, data: string } | null
) {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3.5-flash";

  const mappedHistory = history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: msg.parts.map(p => ({ text: p.text }))
  }));

  let contents: any[] = [...mappedHistory];
  let lastParts: any[] = [];

  if (attachedFile && attachedFile.data) {
    const mimeType = attachedFile.type || "image/jpeg";
    const base64Data = attachedFile.data.split(',')[1] || attachedFile.data;
    lastParts.push({
      inlineData: {
        mimeType,
        data: base64Data
      }
    });
  }

  lastParts.push({ text: message });
  contents.push({ role: "user", parts: lastParts });

  const responseStream = await ai.models.generateContentStream({
    model,
    contents
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
