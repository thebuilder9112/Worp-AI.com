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

export async function* streamChat(
  message: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  mode: 'standard' | 'code' | 'art' | 'research' = 'standard',
  attachedFile?: { name: string, type: string, data: string } | null
) {
  const PROXY_URL = (import.meta.env.VITE_PROXY_URL || '').trim();
  console.log('[gemini] PROXY_URL:', PROXY_URL || '(none)', '| API_KEY set:', !!import.meta.env.VITE_API_KEY);

  let response: Response;

  if (PROXY_URL) {
    response = await fetch(`${PROXY_URL}/api/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, mode, attachedFile }),
    });
  } else {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) throw new Error('API key not configured. Set VITE_API_KEY or VITE_PROXY_URL.');

    const userParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
      { text: message },
    ];
    if (attachedFile) {
      userParts.push({ inlineData: { mimeType: attachedFile.type, data: attachedFile.data } });
    }

    const contents = [...history, { role: 'user', parts: userParts }];

    response = await fetch(
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
  }

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Neural link failed. ${response.status}: ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {
        // skip malformed SSE chunks
      }
    }
  }
}
