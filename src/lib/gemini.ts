import { GoogleGenAI } from "@google/genai";

// Frontend service for interacting with the server-side AI proxy or directly with the Gemini API
export async function* streamChat(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  mode: 'standard' | 'code' | 'art' | 'research' = 'standard',
  attachedFile?: { name: string, type: string, data: string } | null
) {
  const isStaticHosting = typeof window !== 'undefined' && 
    (window.location.hostname.endsWith('github.io') || 
     (window.location.hostname.includes('localhost') === false && window.location.protocol === 'file:'));

  const customKey = typeof window !== 'undefined' ? localStorage.getItem('WORP_GEMINI_API_KEY') : null;
  const buildKey = import.meta.env.VITE_API_KEY;
  const clientKey = customKey || buildKey;

  // On static hosting (GitHub Pages), use direct client-side requests to Gemini API
  if (isStaticHosting) {
    if (!clientKey || clientKey === "YOUR_API_KEY_HERE" || clientKey.startsWith("MY_GE")) {
      throw new Error(
        "Gemini API Key missing! On static hosting (GitHub Pages), you must configure your own Gemini API Key in Settings > Control Center to chat."
      );
    }
    
    try {
      const ai = new GoogleGenAI({ apiKey: clientKey });
      const model = "gemini-3-flash-preview";

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
      return;
    } catch (err: any) {
      console.error("Client-Side Gemini Error:", err);
      throw new Error(`Direct connection failed: ${err?.message || err}`);
    }
  }

  // Fallback to our secure server-side proxy
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
    if (clientKey && clientKey !== "YOUR_API_KEY_HERE" && !clientKey.startsWith("MY_GE")) {
      error = "__FALLBACK__";
    } else {
      error = "Neural link failed. Connection closed. (To run Worp AI on static hosting like GitHub Pages, set your API key in Settings)";
    }
    eventSource.close();
  };

  while (!isDone || messageQueue.length > 0) {
    if (error === "__FALLBACK__") {
      try {
        const ai = new GoogleGenAI({ apiKey: clientKey! });
        const model = "gemini-3-flash-preview";
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

