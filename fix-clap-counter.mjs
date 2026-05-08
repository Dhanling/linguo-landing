import fs from 'fs';

const f = "src/app/blog/[slug]/ArticleContent.tsx";
let s = fs.readFileSync(f, 'utf8');

// Find the clap useEffect (flexible match)
const lines = s.split('\n');
const startIdx = lines.findIndex(l => l.includes('blog_claps') && l.includes('select=clap_count'));

if (startIdx < 0) {
  console.error("❌ Clap useEffect tidak ditemukan");
  process.exit(1);
}

// Find the full useEffect block
let blockStart = startIdx;
while (blockStart > 0 && !lines[blockStart].includes('useEffect')) blockStart--;

let depth = 0, blockEnd = blockStart;
for (let i = blockStart; i < lines.length; i++) {
  depth += (lines[i].match(/\{/g) || []).length;
  depth -= (lines[i].match(/\}/g) || []).length;
  if (i > blockStart && depth <= 0) { blockEnd = i; break; }
}

const oldBlock = lines.slice(blockStart, blockEnd + 1).join('\n');
console.log("Found old block (lines", blockStart+1, "-", blockEnd+1, "):");
console.log(oldBlock.slice(0, 200), '...');

const newBlock = `  useEffect(() => {
    const hash = getVisitorHash();
    fetch(\`\${SUPABASE_URL}/rest/v1/blog_claps?post_id=eq.\${postId}&select=clap_count,visitor_hash\`, {
      headers: { apikey: SUPABASE_KEY }
    }).then(r => r.json()).then((data: any[]) => {
      const rows = data || [];
      const total = rows.reduce((sum: number, c: any) => sum + (c.clap_count || 0), 0);
      setClaps(total);
      // Restore clap count dari kunjungan sebelumnya agar upsert tidak overwrite ke nilai kecil
      const myRow = rows.find((c: any) => c.visitor_hash === hash);
      if (myRow?.clap_count) {
        myClapsRef.current = myRow.clap_count;
        setMyClaps(myRow.clap_count);
      }
    }).catch(() => {});
  }, [postId]);`;

s = s.replace(oldBlock, newBlock);
fs.writeFileSync(f, s);
console.log('\n✅ Clap fix applied — visitor previous count restored on mount');

// Verify
const verify = s.includes('visitor_hash === hash');
console.log('   Verify contains fix:', verify ? '✅' : '❌');
