const MODEL = 'gemini-2.0-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function* streamChat(
  message: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  _mode: 'standard' | 'code' | 'art' | 'research' = 'standard',
  attachedFile?: { name: string, type: string, data: string } | null
) {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) throw new Error('API key not configured. Set VITE_API_KEY.');

  const userParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
    { text: message },
  ];
  if (attachedFile) {
    userParts.push({ inlineData: { mimeType: attachedFile.type, data: attachedFile.data } });
  }

  const contents = [...history, { role: 'user', parts: userParts }];

  const response = await fetch(
    `${BASE_URL}/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    }
  );

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
