import { readFileSync } from 'fs';

const files = ['src/app/page.tsx', 'src/app/layout.tsx'];

for (const f of files) {
  try {
    const content = readFileSync(f, 'utf-8');
    const lines = content.split('\n');
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 ${f} — first 150 lines`);
    console.log('='.repeat(60));
    for (let i = 0; i < Math.min(150, lines.length); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  } catch (e) {
    console.log(`❌ ${f} not found`);
  }
}
