import { useState, useCallback } from "react";

const OLLAMA_BASE = "http://localhost:11434";

export function useOllama(model = "llama3") {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prompt = useCallback(
    async (input: string, onChunk?: (chunk: string) => void) => {
      setLoading(true);
      setError(null);
      setResponse("");

      try {
        const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt: input, stream: true }),
        });

        if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value).split("\n").filter(Boolean);
          for (const line of lines) {
            const data = JSON.parse(line);
            if (data.response) {
              setResponse((prev) => prev + data.response);
              onChunk?.(data.response);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [model]
  );

  const reset = useCallback(() => {
    setResponse("");
    setError(null);
  }, []);

  return { prompt, response, loading, error, reset };
}
