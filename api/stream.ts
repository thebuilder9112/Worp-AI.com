const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

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

export const config = { supportsResponseStreaming: true };

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || '';
  const allowed = [
    'https://thebuilder9112.github.io',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const apiKey = process.env.VITE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'VITE_API_KEY not configured on server.' });
    return;
  }

  const { message, history, mode, attachedFile, model = 'gemini-2.0-flash' } = req.body;

  const userParts: any[] = [{ text: message }];
  if (attachedFile) {
    userParts.push({ inlineData: { mimeType: attachedFile.type, data: attachedFile.data } });
  }

  const contents = [...(history || []), { role: 'user', parts: userParts }];

  const geminiRes = await fetch(
    `${BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.standard }] },
        contents,
      }),
    }
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.text().catch(() => geminiRes.statusText);
    res.status(geminiRes.status).json({ error: err });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const reader = (geminiRes.body as any).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}
