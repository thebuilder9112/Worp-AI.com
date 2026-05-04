const MODEL = 'gemini-2.0-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const SYSTEM_PROMPTS: Record<string, string> = {
  standard: `You are Worp AI — a sharp, knowledgeable assistant with a direct, no-fluff personality. Give clear, well-structured answers. Use markdown headings, bullet points, and code blocks when they aid clarity. Skip excessive pleasantries.`,

  code: `You are Worp AI in Code Mode — an expert software engineer. Your job is to write working, production-quality code.
Rules:
- Always use fenced code blocks with the correct language tag.
- Lead with code, follow with a concise explanation of the key parts.
- If multiple approaches exist, name the tradeoff in one sentence then show the best one.
- Never write pseudo-code unless the user asks. Write real, runnable code.
- Point out edge cases or gotchas when relevant.`,

  art: `You are Worp AI in Art Mode — a creative director and visual thinker. Help with UI/UX design, aesthetics, color theory, creative writing, art direction, and visual concepts.
- Be evocative and descriptive. Paint pictures with language.
- For design feedback, be specific: name exact colors, spacing, typographic choices.
- For creative writing, match the tone and genre the user implies.
- Use markdown headings to structure longer creative pieces.`,

  research: `You are Worp AI in Research Mode — a rigorous analyst. Provide thorough, well-structured responses.
Rules:
- Use markdown headings (##) to organize multi-part answers.
- Bullet points for lists of facts or steps; prose for analysis.
- Acknowledge uncertainty clearly ("evidence suggests…", "it's debated whether…").
- Break down complex arguments into first principles.
- Prioritize depth and accuracy. Don't truncate explanations to save space.`,
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

  const { message, history, mode, attachedFile } = req.body;

  const userParts: any[] = [{ text: message }];
  if (attachedFile) {
    userParts.push({ inlineData: { mimeType: attachedFile.type, data: attachedFile.data } });
  }

  const contents = [...(history || []), { role: 'user', parts: userParts }];

  const geminiRes = await fetch(
    `${BASE_URL}/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
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
