import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/app/blog/[slug]/ArticleContent.tsx';
let content = readFileSync(FILE, 'utf-8');

// Fix: remove Facebook, Twitter from import
content = content.replace(
  'import { Clock, ArrowLeft, MessageCircle, Share2, Facebook, Twitter } from "lucide-react";',
  'import { Clock, ArrowLeft, MessageCircle, Share2 } from "lucide-react";'
);

writeFileSync(FILE, content, 'utf-8');
console.log('✅ Fixed lucide-react import');
console.log('Run: git add -A && git commit -m "fix: remove invalid lucide imports" && git push');
