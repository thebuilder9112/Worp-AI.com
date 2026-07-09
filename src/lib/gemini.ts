// Frontend service for interacting with the server-side AI proxy
export async function* streamChat(
  message: string, 
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  mode: 'standard' | 'code' | 'art' | 'research' = 'standard',
  attachedFile?: { name: string, type: string, data: string } | null
) {
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
    error = "Neural link failed. Connection closed.";
    eventSource.close();
  };

  while (!isDone || messageQueue.length > 0) {
    if (error) throw new Error(error);
    if (messageQueue.length > 0) {
      yield messageQueue.shift()!;
    } else {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}
