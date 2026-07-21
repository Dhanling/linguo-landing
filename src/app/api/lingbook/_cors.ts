// [lingbook-cms] CORS untuk endpoint yang dipanggil dari admin dashboard
// (dashboard.linguo.id) — beda origin dari linguo.id. Hanya origin tepercaya.
const ALLOWED = new Set([
  "https://dashboard.linguo.id",
  "https://linguo.id",
  "http://localhost:3000",
  "http://localhost:5173",
]);

export function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED.has(origin) ? origin : "https://dashboard.linguo.id";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization",
    Vary: "Origin",
  };
}
