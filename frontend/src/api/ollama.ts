// src/api/ollama.ts
export async function chatOllama(prompt: string, model = 'dolphin-phi:latest') {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  const json = await res.json();
  return json.response as string;
}
