import fs from 'fs';

const f = "src/app/blog/[slug]/ArticleContent.tsx";
let s = fs.readFileSync(f, 'utf8');

// 1. Tambah myRowIdRef setelah writeTimerRef
const anchorRef = `  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);`;
if (!s.includes(anchorRef)) {
  console.error("❌ anchorRef tidak ditemukan"); process.exit(1);
}
s = s.replace(anchorRef, anchorRef + `\n  const myRowIdRef = useRef<string | null>(null);`);

// 2. Di useEffect clap loader, simpan row ID kalau ada
const oldFind = `      const myRow = rows.find((c: any) => c.visitor_hash === hash);
      if (myRow?.clap_count) {
        myClapsRef.current = myRow.clap_count;
        setMyClaps(myRow.clap_count);
      }`;
const newFind = `      const myRow = rows.find((c: any) => c.visitor_hash === hash);
      if (myRow?.clap_count) {
        myClapsRef.current = myRow.clap_count;
        myRowIdRef.current = myRow.id ?? null;
        setMyClaps(myRow.clap_count);
      }`;
if (!s.includes(oldFind)) {
  console.error("❌ oldFind tidak ditemukan — cek apakah fix sebelumnya sudah apply");
  process.exit(1);
}
s = s.replace(oldFind, newFind);

// 3. Pastikan fetch juga select id
const oldSelect = `select=clap_count,visitor_hash`;
const newSelect = `select=id,clap_count,visitor_hash`;
if (!s.includes(oldSelect)) {
  console.error("❌ select tidak ditemukan"); process.exit(1);
}
s = s.replace(oldSelect, newSelect);

// 4. Ganti upsert logic di doClap: PATCH kalau row ada, POST kalau baru
const oldUpsert = `        const hash = getVisitorHash();
        await fetch(SUPABASE_URL + "/rest/v1/blog_claps", {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({ post_id: postId, visitor_hash: hash, clap_count: myClapsRef.current }),
        });`;
const newUpsert = `        const hash = getVisitorHash();
        if (myRowIdRef.current) {
          // Row sudah ada → PATCH (update in-place, tidak perlu conflict resolution)
          await fetch(\`\${SUPABASE_URL}/rest/v1/blog_claps?id=eq.\${myRowIdRef.current}\`, {
            method: "PATCH",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: "Bearer " + SUPABASE_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ clap_count: myClapsRef.current }),
          });
        } else {
          // Row belum ada → POST baru, simpan ID untuk update berikutnya
          const res = await fetch(SUPABASE_URL + "/rest/v1/blog_claps", {
            method: "POST",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: "Bearer " + SUPABASE_KEY,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({ post_id: postId, visitor_hash: hash, clap_count: myClapsRef.current }),
          });
          const rows = await res.json().catch(() => []);
          if (rows?.[0]?.id) myRowIdRef.current = rows[0].id;
        }`;
if (!s.includes(oldUpsert)) {
  console.error("❌ oldUpsert tidak ditemukan");
  // show current doClap area
  const lines = s.split('\n');
  const idx = lines.findIndex(l => l.includes('getVisitorHash') && l.includes('hash'));
  if (idx >= 0) console.log('Found at line', idx+1, ':\n', lines.slice(idx-1, idx+15).join('\n'));
  process.exit(1);
}
s = s.replace(oldUpsert, newUpsert);

fs.writeFileSync(f, s);
console.log("✅ Clap upsert fix: PATCH untuk existing row, POST untuk row baru");
console.log("   myRowIdRef:", s.includes('myRowIdRef') ? '✅' : '❌');
console.log("   select id:", s.includes('select=id,clap_count') ? '✅' : '❌');
console.log("   PATCH logic:", s.includes('method: "PATCH"') ? '✅' : '❌');
