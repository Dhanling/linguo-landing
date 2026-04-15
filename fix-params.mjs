import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/app/blog/[slug]/page.tsx';
let content = readFileSync(FILE, 'utf-8');

// Fix 1: Change type from Promise to direct params
content = content.replace(
  "type Props = { params: Promise<{ slug: string }> };",
  "type Props = { params: { slug: string } };"
);

// Fix 2: Remove await from params in generateMetadata
content = content.replace(
  "export async function generateMetadata({ params }: Props): Promise<Metadata> {\n  const { slug } = await params;",
  "export async function generateMetadata({ params }: Props): Promise<Metadata> {\n  const { slug } = params;"
);

// Fix 3: Remove await from params in the page component
content = content.replace(
  "export default async function ArticlePage({ params }: Props) {\n  const { slug } = await params;",
  "export default async function ArticlePage({ params }: Props) {\n  const { slug } = params;"
);

writeFileSync(FILE, content, 'utf-8');
console.log('✅ Fixed params type for Next.js 16');
console.log('Run: git add -A && git commit -m "fix: params type for Next.js 16" && git push');
