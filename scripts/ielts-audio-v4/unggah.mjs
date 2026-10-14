// node unggah.mjs <no-unit> <berkas.mp3> — cadangkan unit-NN.mp3 yang tayang ke lama-20261014-v2/
// (sekali saja, cadangan yang sudah ada tidak ditimpa), lalu timpa dengan berkas v4.
import { readFileSync } from "node:fs";
const env = readFileSync("/Users/muhamadlutfiramadhani/linguo-landing/.env.local", "utf8");
const ambil = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))[1].trim().replace(/^["']|["']$/g, "");
const URL = ambil("NEXT_PUBLIC_SUPABASE_URL"), KEY = ambil("SUPABASE_SERVICE_ROLE_KEY");
const h = { Authorization: `Bearer ${KEY}`, apikey: KEY };
const B = "lms-audio", D = "ebook/ielts-prep", nn = process.argv[2].padStart(2, "0");
const pub = (p) => `${URL}/storage/v1/object/public/${B}/${D}/${p}`;
if (!(await fetch(pub(`lama-20261014-v2/unit-${nn}.mp3`), { method: "HEAD" })).ok) {
  const lama = Buffer.from(await (await fetch(pub(`unit-${nn}.mp3`), { cache: "no-store" })).arrayBuffer());
  const cad = await fetch(`${URL}/storage/v1/object/${B}/${D}/lama-20261014-v2/unit-${nn}.mp3`, {
    method: "POST", headers: { ...h, "Content-Type": "audio/mpeg", "x-upsert": "false" }, body: lama });
  console.log(`unit ${nn} cadangan: ${cad.status} ${lama.length} byte`);
  if (!cad.ok) process.exit(1);
}
const baru = readFileSync(process.argv[3]);
const up = await fetch(`${URL}/storage/v1/object/${B}/${D}/unit-${nn}.mp3`, {
  method: "PUT", headers: { ...h, "Content-Type": "audio/mpeg", "x-upsert": "true", "cache-control": "max-age=300" }, body: baru });
console.log(`unit ${nn} timpa: ${up.status} ${baru.length} byte ${up.ok ? "" : (await up.text()).slice(0, 160)}`);
