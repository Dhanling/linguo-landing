import { readFileSync } from "node:fs";
const env = readFileSync("/Users/muhamadlutfiramadhani/linguo-landing/.env.local", "utf8");
const ambil = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))[1].trim().replace(/^["']|["']$/g, "");
const URL = ambil("NEXT_PUBLIC_SUPABASE_URL"), KEY = ambil("SUPABASE_SERVICE_ROLE_KEY");
const peta = JSON.parse(readFileSync("peta.json", "utf8"));
let ok = 0;
for (const f of Object.values(peta)) {
  const r = await fetch(`${URL}/storage/v1/object/lms-audio/slide-audio/zh-v4/${f}`, { method: "PUT",
    headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, "Content-Type": "audio/mpeg", "x-upsert": "true", "cache-control": "max-age=31536000" },
    body: readFileSync(`out/${f}`) });
  if (r.ok) ok++; else console.log(f, r.status, (await r.text()).slice(0, 120));
}
console.log(ok, "terunggah;", `${URL}/storage/v1/object/public/lms-audio/slide-audio/zh-v4/`);
