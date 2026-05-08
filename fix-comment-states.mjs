import fs from 'fs';

const f = "src/app/blog/[slug]/ArticleContent.tsx";
let s = fs.readFileSync(f, 'utf8');

// 1. Hapus 5 baris useState comment form dari posisi aslinya (sekitar baris 263-267)
//    Cari blok yang ada keduanya dalam satu chunk
const commentStatesBlock = `  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);`;

if (!s.includes(commentStatesBlock)) {
  console.error("❌ Blok comment states tidak ditemukan — cek manual");
  process.exit(1);
}

// 2. Anchor: setelah baris showCount (baris 156 sebelum ini)
const anchor = `  const [showCount, setShowCount] = useState(false);`;
if (!s.includes(anchor)) {
  console.error("❌ Anchor tidak ditemukan");
  process.exit(1);
}

// Hapus dari posisi aslinya (beserta newline setelahnya)
s = s.replace('\n' + commentStatesBlock, '');

// Sisipkan setelah anchor
s = s.replace(anchor, anchor + '\n' + commentStatesBlock);

fs.writeFileSync(f, s);
console.log("✅ useState comment states dipindahkan ke sebelum submit()");

// Verifikasi: cek urutan baris
const lines = s.split('\n');
let commentIdx = -1, submitIdx = -1;
lines.forEach((l, i) => {
  if (l.includes('const [comments, setComments]')) commentIdx = i + 1;
  if (l.includes('const submit = async')) submitIdx = i + 1;
});
console.log(`   comments state di baris: ${commentIdx}`);
console.log(`   submit() di baris: ${submitIdx}`);
if (commentIdx < submitIdx) {
  console.log("✅ Urutan benar — state sebelum submit");
} else {
  console.log("⚠️  Masih salah urutan, cek manual");
}
