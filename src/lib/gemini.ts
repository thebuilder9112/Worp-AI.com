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

export async function* streamChat(
  message: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  mode: 'standard' | 'code' | 'art' | 'research' = 'standard',
  attachedFile?: { name: string, type: string, data: string } | null,
  aiModel: string = 'gemini-2.0-flash'
) {
  const PROXY_URL = (import.meta.env.VITE_PROXY_URL || '').trim();
  console.log('[gemini] PROXY_URL:', PROXY_URL || '(none)', '| API_KEY set:', !!import.meta.env.VITE_API_KEY, '| Model:', aiModel);

  // Synaptic Compression: Prune history to keep only the last 15 exchanges (30 messages)
  // This keeps the context focused and prevents token bloat.
  const prunedHistory = history.length > 30 ? history.slice(-30) : history;

  let response: Response;

  if (PROXY_URL) {
    response = await fetch(`${PROXY_URL}/api/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: prunedHistory, mode, attachedFile, model: aiModel }),
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

    const contents = [...prunedHistory, { role: 'user', parts: userParts }];

    response = await fetch(
      `${BASE_URL}/${aiModel}:streamGenerateContent?alt=sse&key=${apiKey}`,
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
