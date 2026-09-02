// Penomoran seri dikunci di "101" untuk SEMUA tingkat — sampul rancangan
// desainer selalu bertuliskan 101 dan tingkatnya dibedakan lewat badge LEVEL,
// jadi judul "Danish 102 - A2" bikin kartu tak cocok dengan sampulnya.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const kering = !process.argv.includes("--terapkan");

const { data, error } = await sb.from("digital_products")
  .select("slug,title,level").eq("type", "ebook").in("level", ["A2", "B1", "B2"]).order("title");
if (error) { console.error(error.message); process.exit(1); }

let ubah = 0;
for (const p of data) {
  const baru = p.title.replace(/\b10[234]\b/, "101");
  if (baru === p.title) { console.log(`· lewat  ${p.slug}: ${p.title}`); continue; }
  ubah++;
  if (kering) { console.log(`~ ${p.slug}: ${p.title}  →  ${baru}`); continue; }
  const { error: e } = await sb.from("digital_products").update({ title: baru }).eq("slug", p.slug);
  console.log(e ? `GAGAL ${p.slug}: ${e.message}` : `OK ${p.slug}: ${baru}`);
}
console.log(`${kering ? "SIMULASI" : "selesai"} — ${ubah} judul`);
