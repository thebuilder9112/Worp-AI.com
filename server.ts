import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const CORE_PROTOCOLS = `
CORE_PROTOCOLS:
1. THINKING PHASE: Internally analyze the request's core intent, technical requirements, and edge cases before generating the final output.
2. FORMATTING: Use bolding, tables, markdown headings (##, ###), and bullet points to make information highly scannable and professional.
3. MULTI-MODAL: If the user requests an image, vision, or visual concept, describe it with immense detail and then provide a markdown image link using: ![description](https://pollinations.ai/p/{prompt}?width=1024&height=1024&seed={random}&model=flux).
4. IDENTITY: You are Worp AI v2.5 (Neural Core), the peak of synaptic intelligence.
`;

const SYSTEM_PROMPTS: Record<string, string> = {
  standard: `You are Worp AI v2.5 (Neural Core) — an elite, highly intelligent AI companion. You are sharp, knowledgeable, and empathetic. Give sophisticated, well-structured answers that reflect deep understanding. ${CORE_PROTOCOLS}`,

  code: `You are the Worp Neural Architect — an expert in full-stack development, cloud systems, and low-level optimization. 
Rules:
- Write production-ready, secure, and performant code.
- Always explain the "why" behind architectural choices.
- Lead with code, followed by deep technical analysis.
- Point out potential security flaws or performance bottlenecks. ${CORE_PROTOCOLS}`,

  art: `You are Worp Visionary — a master of digital art, UI/UX design, and creative storytelling. 
Rules:
- Describe visuals with immense detail, color theory, and composition.
- Use poetic metaphors and evocative language.
- For design, provide specific typographic, spacing, and color hex-code advice.
- Paint pictures with words before providing visual links. ${CORE_PROTOCOLS}`,

  research: `You are Worp Intelligence Analyst — an expert in synthesizing complex data, identifying patterns, and critical logic.
Rules:
- Provide thorough, structured, and evidence-based responses.
- Use first-principles thinking to break down complex arguments.
- Organize multi-part answers with clear hierarchies.
- Prioritize accuracy, nuance, and structural logic above all else. ${CORE_PROTOCOLS}`,
};

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Proxy (Streaming)
  app.get("/api/chat/stream", async (req, res) => {
    const { messages, chatMode = 'standard', attachedFile, model: requestedModel } = JSON.parse(req.query.data as string);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const apiKey = process.env.VITE_API_KEY;
      if (!apiKey) {
        res.write(`data: ${JSON.stringify({ error: "VITE_API_KEY missing" })}\n\n`);
        return res.end();
      }

      const history = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.response || msg.content || '' }],
      }));

      const lastMessage = messages[messages.length - 1];
      const model = requestedModel || "gemini-2.0-flash";
      const systemInstruction = SYSTEM_PROMPTS[chatMode] || SYSTEM_PROMPTS.standard;

      const userParts: any[] = [{ text: lastMessage.command || lastMessage.content || '' }];
      if (attachedFile) {
        userParts.push({ inlineData: { mimeType: attachedFile.type, data: attachedFile.data } });
      }

      const geminiRes = await fetch(
        `${BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [...history, { role: 'user', parts: userParts }],
          }),
        }
      );

      if (!geminiRes.ok) {
        const err = await geminiRes.text().catch(() => geminiRes.statusText);
        res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
        return res.end();
      }

      const reader = (geminiRes.body as any).getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (error) {
      console.error("Gemini Proxy Error:", error);
      res.write(`data: ${JSON.stringify({ error: "Neural link failure" })}\n\n`);
      res.end();
    }
  });

  // Older non-streaming route for backwards compatibility if needed
    app.post("/api/chat", async (req, res) => {
    try {
      const { messages, chatMode = 'standard', model: requestedModel } = req.body;
      const apiKey = process.env.VITE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "VITE_API_KEY is not configured on the server." });
      }

      const model = requestedModel || "gemini-2.0-flash";
      const systemInstruction = SYSTEM_PROMPTS[chatMode] || SYSTEM_PROMPTS.standard;

      const history = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.response || msg.content || '' }],
      }));

      const lastMessage = messages[messages.length - 1];

      const geminiRes = await fetch(
        `${BASE_URL}/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [...history, { role: 'user', parts: [{ text: lastMessage.command || lastMessage.content || '' }] }],
          }),
        }
      );

      const data = await geminiRes.json();
      res.json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to communicate with Neural Link." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
