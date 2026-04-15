import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const PROJECT = process.cwd();
console.log('📁 Project:', PROJECT);

// Step 1: Find navbar file
console.log('\n🔍 Searching for navbar file...');
try {
  const grep = execSync(
    `grep -rn "Corporate\\|Jadi Pengajar\\|FAQ\\|navbar\\|Navbar" src/ --include="*.tsx" -l`,
    { cwd: PROJECT, encoding: 'utf-8' }
  );
  console.log('Found files:\n' + grep);
} catch (e) {
  console.log('grep output:', e.stdout || 'nothing found');
}

// Also check for nav-related files
console.log('\n🔍 Searching for nav component files...');
try {
  const find = execSync(
    `find src/ -iname "*nav*" -o -iname "*header*" | grep -i ".tsx"`,
    { cwd: PROJECT, encoding: 'utf-8' }
  );
  console.log('Nav/Header files:\n' + find);
} catch (e) {
  console.log('find output:', e.stdout || 'nothing found');
}

// Try common locations
const candidates = [
  'src/components/Navbar.tsx',
  'src/components/navbar.tsx',
  'src/components/Header.tsx',
  'src/components/header.tsx',
  'src/components/layout/Navbar.tsx',
  'src/components/layout/Header.tsx',
  'src/app/components/Navbar.tsx',
  'src/components/Navigation.tsx',
];

let navFile = null;
for (const f of candidates) {
  try {
    readFileSync(`${PROJECT}/${f}`, 'utf-8');
    navFile = f;
    console.log(`\n✅ Found navbar at: ${f}`);
    break;
  } catch {}
}

if (!navFile) {
  // Broader search
  try {
    const allTsx = execSync(
      `grep -rl "Mulai Belajar\\|Kelas Reguler\\|Kelas Private\\|Corporate\\|Jadi Pengajar" src/ --include="*.tsx"`,
      { cwd: PROJECT, encoding: 'utf-8' }
    ).trim().split('\n');
    console.log('\n🔍 Files with nav menu items:', allTsx);
    if (allTsx.length > 0) navFile = allTsx[0];
  } catch (e) {
    console.log('Broader search:', e.stdout || 'nothing');
  }
}

if (!navFile) {
  console.log('\n❌ Could not find navbar file. Please share the navbar file path.');
  process.exit(1);
}

// Step 2: Read the file and show relevant section
const content = readFileSync(`${PROJECT}/${navFile}`, 'utf-8');
console.log(`\n📄 File: ${navFile} (${content.length} chars)`);

// Find where nav links are defined
const lines = content.split('\n');
const relevantLines = [];
lines.forEach((line, i) => {
  if (/FAQ|Corporate|Jadi Pengajar|pengajar|faq/i.test(line)) {
    relevantLines.push({ num: i + 1, line: line.trim() });
  }
});
console.log('\n📌 Relevant lines:');
relevantLines.forEach(r => console.log(`  L${r.num}: ${r.line}`));

// Step 3: Add Blog link after FAQ or after the last nav item
// Look for FAQ link pattern and add Blog after it
let updated = false;

// Pattern 1: Array of nav items like { label: "FAQ", href: "#faq" }
const arrayPattern = /(\{\s*label:\s*["']FAQ["'].*?\})([\s,]*)/;
if (arrayPattern.test(content)) {
  const newContent = content.replace(arrayPattern, (match, faqItem, trailing) => {
    return `${faqItem},\n    { label: "Blog", href: "/blog" }${trailing}`;
  });
  writeFileSync(`${PROJECT}/${navFile}`, newContent, 'utf-8');
  updated = true;
  console.log('\n✅ Added Blog after FAQ in nav array!');
}

// Pattern 2: JSX links like <Link href="/faq">FAQ</Link> or <a href="#faq">FAQ</a>
if (!updated) {
  // Look for FAQ in JSX
  const faqJsxPattern = /(.*(?:FAQ|faq).*(?:<\/(?:Link|a|button)>|<\/[A-Za-z]+>))/;
  if (faqJsxPattern.test(content)) {
    const newContent = content.replace(faqJsxPattern, (match, faqLine) => {
      // Get indentation
      const indent = faqLine.match(/^(\s*)/)[1];
      // Create blog link with same structure
      const blogLine = faqLine
        .replace(/FAQ/g, 'Blog')
        .replace(/faq/g, 'blog')
        .replace(/#blog/, '/blog');
      return `${faqLine}\n${blogLine}`;
    });
    writeFileSync(`${PROJECT}/${navFile}`, newContent, 'utf-8');
    updated = true;
    console.log('\n✅ Added Blog link after FAQ in JSX!');
  }
}

// Pattern 3: href="#faq" ... FAQ text pattern
if (!updated) {
  const hrefPattern = /(["']#?faq["'])/i;
  if (hrefPattern.test(content)) {
    console.log('\n⚠️ Found FAQ reference but pattern is complex.');
    console.log('Showing context around FAQ:');
    lines.forEach((line, i) => {
      if (/faq/i.test(line)) {
        const start = Math.max(0, i - 3);
        const end = Math.min(lines.length, i + 4);
        for (let j = start; j < end; j++) {
          console.log(`  ${j + 1}: ${lines[j]}`);
        }
        console.log('  ---');
      }
    });
    console.log('\n❌ Could not auto-insert. Copy the output above and share with Claude.');
  }
}

if (updated) {
  console.log('\n🎉 Done! Now run:');
  console.log('  git add -A && git commit -m "add Blog to navbar" && git push');
} else if (!updated && !content.includes('Blog')) {
  console.log('\n⚠️ Auto-insert failed. Showing full nav area for manual review...');
  // Show 30 lines around the nav items
  const faqIdx = lines.findIndex(l => /faq/i.test(l));
  if (faqIdx >= 0) {
    const start = Math.max(0, faqIdx - 15);
    const end = Math.min(lines.length, faqIdx + 15);
    console.log(`\nLines ${start+1}-${end}:`);
    for (let j = start; j < end; j++) {
      console.log(`  ${j + 1}: ${lines[j]}`);
    }
  }
}
