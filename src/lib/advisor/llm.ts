// [ai-funnel-v1] Klien LLM berformat OpenAI (chat/completions) — provider-agnostic.
// Env: LLM_BASE_URL, LLM_API_KEY, LLM_MODEL. Kalau kosong jatuh ke DeepSeek
// (DEEPSEEK_API_KEY yang sudah ada di Vercel), jadi tak perlu env baru untuk jalan.

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

export function llmConfig() {
  const apiKey = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY || "";
  const baseUrl = (process.env.LLM_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
  const model = process.env.LLM_MODEL || process.env.DEEPSEEK_MODEL || "deepseek-chat";
  return { apiKey, baseUrl, model };
}

/**
 * Satu putaran streaming. Teks diteruskan ke onText sepotong-sepotong;
 * tool call dikumpulkan dan dikembalikan utuh di akhir.
 */
export async function streamCompletion(opts: {
  messages: ChatMessage[];
  tools?: unknown[];
  onText: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<{ text: string; toolCalls: ToolCall[] }> {
  const { apiKey, baseUrl, model } = llmConfig();
  if (!apiKey) throw new Error("LLM_API_KEY / DEEPSEEK_API_KEY belum diset");

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      ...(opts.tools?.length ? { tools: opts.tools, tool_choice: "auto" } : {}),
      temperature: 0.4,
      max_tokens: 900,
      stream: true,
    }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`LLM ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  const calls: { id: string; name: string; args: string }[] = [];

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      let j: {
        choices?: {
          delta?: {
            content?: string | null;
            tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[];
          };
        }[];
      };
      try {
        j = JSON.parse(data);
      } catch {
        continue;
      }
      const d = j.choices?.[0]?.delta;
      if (!d) continue;
      if (d.content) {
        text += d.content;
        opts.onText(d.content);
      }
      for (const tc of d.tool_calls || []) {
        const c = (calls[tc.index] ||= { id: "", name: "", args: "" });
        if (tc.id) c.id = tc.id;
        if (tc.function?.name) c.name += tc.function.name;
        if (tc.function?.arguments) c.args += tc.function.arguments;
      }
    }
  }

  return {
    text,
    toolCalls: calls
      .filter((c) => c && c.name)
      .map((c, i) => ({
        id: c.id || `call_${i}`,
        type: "function" as const,
        function: { name: c.name, arguments: c.args || "{}" },
      })),
  };
}
