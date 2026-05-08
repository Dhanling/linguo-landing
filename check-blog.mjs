const SUPABASE_URL = 'https://jbtgciepdmqxxcjflrxz.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs';
const H = { apikey: ANON, Authorization: 'Bearer ' + ANON };

// 1. Cek H2/H3 di 10 artikel
const r1 = await fetch(SUPABASE_URL + '/rest/v1/blog_posts?select=slug,content&limit=10', { headers: H });
const posts = await r1.json();

console.log('\n=== H2/H3 per artikel (10 pertama) ===');
let anyHasHeadings = false;
for (const p of (posts || [])) {
  const h2 = (p.content?.match(/<h2/gi) || []).length;
  const h3 = (p.content?.match(/<h3/gi) || []).length;
  const flag = (h2 + h3) > 0 ? '✅' : '❌';
  if (h2 + h3 > 0) anyHasHeadings = true;
  console.log(flag, p.slug?.slice(0, 50).padEnd(50), '| h2:', h2, '| h3:', h3);
}
console.log(anyHasHeadings ? '\n→ Ada artikel dengan heading, TOC harusnya muncul di sana' : '\n→ SEMUA artikel 0 heading — konten perlu di-regenerate dengan H2/H3');

// 2. Cek blog_claps table
const r2 = await fetch(SUPABASE_URL + '/rest/v1/blog_claps?limit=5', { headers: H });
const claps = await r2.json();
console.log('\n=== blog_claps sample rows ===');
console.log(JSON.stringify(claps, null, 2));

// 3. Cek apakah ada duplicate (visitor_hash + post_id sama)
const r3 = await fetch(SUPABASE_URL + '/rest/v1/blog_claps?select=post_id,visitor_hash&limit=100', { headers: H });
const all = await r3.json();
if (Array.isArray(all)) {
  const keys = all.map(r => r.post_id + '|' + r.visitor_hash);
  const unique = new Set(keys);
  console.log('\n=== Clap constraint check ===');
  console.log('Total rows:', all.length, '| Unique (post_id+visitor_hash):', unique.size);
  if (all.length > unique.size) {
    console.log('⚠️  ADA DUPLICATE! Unique constraint TIDAK ada di DB → ini root cause clap counter kacau');
  } else {
    console.log('✅ Tidak ada duplicate, constraint kemungkinan sudah ada atau data masih sedikit');
  }
}
