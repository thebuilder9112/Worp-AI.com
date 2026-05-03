import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Proxy (Streaming)
  app.get("/api/chat/stream", async (req, res) => {
    const { messages, chatMode, attachedFile } = JSON.parse(req.query.data as string);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const apiKey = process.env.VITE_API_KEY;
      if (!apiKey) {
        res.write(`data: ${JSON.stringify({ error: "VITE_API_KEY missing" })}\n\n`);
        return res.end();
      }

      const genAI = new GoogleGenAI({ apiKey });
      
      const history = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.response || msg.content || '' }],
      }));

      const lastMessage = messages[messages.length - 1];
      const model = "gemini-3-flash-preview";

      const result = await genAI.models.generateContentStream({
        model,
        contents: [...history, { role: "user", parts: [{ text: lastMessage.command || lastMessage.content }] }]
      });

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
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
      const { messages } = req.body;
      const apiKey = process.env.VITE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "VITE_API_KEY is not configured on the server." });
      }

      const genAI = new GoogleGenAI({ apiKey });
      
      const model = "gemini-3-flash-preview";

      const history = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.response || msg.content || '' }],
      }));

      const lastMessage = messages[messages.length - 1];

      const result = await genAI.models.generateContent({
        model,
        contents: [...history, { role: "user", parts: [{ text: lastMessage.command || lastMessage.content }] }]
      });

      res.json({ text: result.text });
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
