import { readFileSync } from 'fs';

const files = ['src/app/layout.tsx', 'src/app/page.tsx'];

for (const f of files) {
  try {
    const content = readFileSync(f, 'utf-8');
    const lines = content.split('\n');
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 ${f} (${lines.length} lines)`);
    console.log('='.repeat(60));

    // Find nav-related lines
    lines.forEach((line, i) => {
      if (/nav|Nav|menu|Menu|href.*#|FAQ|faq|Corporate|corporate|Blog|blog|Pengajar|pengajar|Kelas|kelas|Mulai Belajar/i.test(line)) {
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 3);
        console.log(`\n--- Around line ${i + 1} ---`);
        for (let j = start; j < end; j++) {
          const marker = j === i ? '>>>' : '   ';
          console.log(`${marker} ${j + 1}: ${lines[j]}`);
        }
      }
    });
  } catch (e) {
    console.log(`\n❌ ${f} not found`);
  }
}
