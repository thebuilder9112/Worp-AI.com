import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Diagnostic route for environment checking
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      mode: process.env.NODE_ENV || 'development',
      time: new Date().toISOString()
    });
  });

  app.get("/api/debug-paths", (req, res) => {
    const distPath = path.resolve(__dirname, "dist");
    res.json({
      cwd: process.cwd(),
      dirname: __dirname,
      distPath,
      distExists: fs.existsSync(distPath),
      nodeEnv: process.env.NODE_ENV
    });
  });

  // API Route for Gemini Proxy (Streaming)
  app.get("/api/chat/stream", async (req, res) => {
    try {
      if (!req.query.data) {
        throw new Error("Missing query data");
      }
      
      const { messages, chatMode, attachedFile } = JSON.parse(req.query.data as string);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let apiKey = process.env.GEMINI_API_KEY;
      const isPlaceholder = !apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey.startsWith("MY_GE");
      
      if (isPlaceholder) {
        throw new Error("GEMINI_API_KEY is missing or invalid. Please configure your custom API Key in the Settings menu of AI Studio.");
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
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      res.write(`data: ${JSON.stringify({ error: error?.message || "Neural link failure" })}\n\n`);
      res.end();
    }
  });

  // Older non-streaming route for backwards compatibility if needed
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      
      let apiKey = process.env.GEMINI_API_KEY;
      const isPlaceholder = !apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey.startsWith("MY_GE");
      
      if (isPlaceholder) {
        throw new Error("GEMINI_API_KEY is missing or invalid. Please configure your custom API Key in the Settings menu of AI Studio.");
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

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Current working directory: ${process.cwd()}`);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite middleware");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Determine the dist path relative to this file
    const distPath = path.resolve(__dirname, "dist");
    const rootDist = path.resolve(process.cwd(), "dist");
    
    // Choose the best candidate for dist
    let effectiveDist = distPath;
    if (!fs.existsSync(distPath) && fs.existsSync(rootDist)) {
      effectiveDist = rootDist;
    }

    if (fs.existsSync(effectiveDist)) {
      console.log(`Serving static files from: ${effectiveDist}`);
      app.use(express.static(effectiveDist, {
        maxAge: '1d',
        etag: true
      }));
    } else {
      console.error(`ERROR: Static directory not found at ${distPath} or ${rootDist}`);
    }

    app.get("*all", (req, res) => {
      // Send index.html for any non-API routes (SPA fallback)
      const indexPath = path.join(effectiveDist, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Front-end build artifacts not found. Deployment may be incomplete.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
