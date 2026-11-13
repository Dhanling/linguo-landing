// [ai-kanal-v1] Pengenal sumber AI. Dua jenis:
//  1. aiSourceFromVisit — pengunjung web yang datang dari jawaban AI (klik link).
//     ChatGPT menempelkan utm_source=chatgpt.com; yang lain terbaca dari referrer.
//  2. mcpClientLabel — aplikasi yang memanggil MCP server (ChatGPT, Claude, …),
//     dari clientInfo.name saat initialize, cadangannya User-Agent.
// Cermin SQL: public.ai_source_label() di supabase/sql/002_ai_kanal.sql —
// kalau menambah sumber di sini, tambahkan juga di sana.

const VISIT_RULES: [RegExp, string][] = [
  [/chatgpt|openai/, "ChatGPT"],
  [/perplexity/, "Perplexity"],
  [/claude|anthropic/, "Claude"],
  [/gemini|bard\.google/, "Gemini"],
  [/copilot|bing\.com\/chat/, "Copilot"],
  [/deepseek/, "DeepSeek"],
  [/grok|x\.ai/, "Grok"],
  [/meta\.ai/, "Meta AI"],
  [/you\.com|phind|kagi/, "AI lain"],
];

export function aiSourceFromVisit(utmSource?: unknown, referrer?: unknown): string | null {
  const s = `${typeof utmSource === "string" ? utmSource : ""} ${typeof referrer === "string" ? referrer : ""}`.toLowerCase();
  if (!s.trim()) return null;
  for (const [re, label] of VISIT_RULES) if (re.test(s)) return label;
  return null;
}

const CLIENT_RULES: [RegExp, string][] = [
  [/openai|chatgpt/, "ChatGPT"],
  [/claude|anthropic/, "Claude"],
  [/inspector/, "MCP Inspector"],
  [/cursor/, "Cursor"],
  [/vscode|visual studio code|copilot/, "VS Code"],
  [/windsurf|codeium/, "Windsurf"],
  [/perplexity/, "Perplexity"],
  [/gemini|google/, "Gemini"],
  [/mistral|le ?chat/, "Mistral"],
];

/** Label klien MCP yang konsisten (dipakai juga sebagai bagian Mcp-Session-Id). */
export function mcpClientLabel(clientName?: string | null, userAgent?: string | null): string {
  const s = `${clientName || ""} ${userAgent || ""}`.toLowerCase();
  for (const [re, label] of CLIENT_RULES) if (re.test(s)) return label;
  return clientName ? "Lainnya" : "Tidak diketahui";
}

export const MCP_CLIENT_LABELS = [
  "ChatGPT", "Claude", "MCP Inspector", "Cursor", "VS Code", "Windsurf", "Perplexity", "Gemini", "Mistral", "Lainnya", "Tidak diketahui",
];
