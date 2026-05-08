import fs from 'fs';

const f = "src/app/blog/[slug]/ArticleContent.tsx";
let s = fs.readFileSync(f, 'utf8');

// Blok yang salah masuk ke ClapButton — hapus dari sana
const wrongPlace = `  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
`;

// Target: sisipkan di awal CommentsSection, tepat setelah opening brace
const commentsHeader = `function CommentsSection({ postId }: { postId: string }) {`;

if (!s.includes(wrongPlace)) {
  console.error("❌ wrongPlace pattern tidak ditemukan — cek file manual");
  console.log("Grep hint:");
  console.log(s.split('\n').slice(158,172).map((l,i) => `${159+i}: ${l}`).join('\n'));
  process.exit(1);
}

if (!s.includes(commentsHeader)) {
  console.error("❌ CommentsSection header tidak ditemukan");
  process.exit(1);
}

// 1. Hapus dari ClapButton
s = s.replace(wrongPlace, '');

// 2. Sisipkan di awal CommentsSection
const insertion = `function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
`;
s = s.replace(commentsHeader + '\n', insertion);

fs.writeFileSync(f, s);
console.log("✅ Comment states dipindahkan ke CommentsSection");

// Verifikasi
const lines = s.split('\n');
let stateIdx = -1, commentsSectionIdx = -1, submitIdx = -1;
lines.forEach((l, i) => {
  if (l.includes('function CommentsSection')) commentsSectionIdx = i + 1;
  if (l.includes('const [comments, setComments]') && commentsSectionIdx > 0 && stateIdx < 0) stateIdx = i + 1;
  if (l.includes('const submit = async') && stateIdx > 0 && submitIdx < 0) submitIdx = i + 1;
});
console.log(`   CommentsSection mulai di baris: ${commentsSectionIdx}`);
console.log(`   comments state di baris: ${stateIdx}`);
console.log(`   submit() di baris: ${submitIdx}`);

if (commentsSectionIdx < stateIdx && stateIdx < submitIdx) {
  console.log("✅ Urutan benar: CommentsSection → states → submit");
} else {
  console.log("⚠️  Urutan masih salah, cek manual");
}
