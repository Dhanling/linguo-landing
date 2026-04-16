import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/app/produk/page.tsx';
let content = readFileSync(FILE, 'utf-8');

// Replace buy function to open WA directly
const oldBuy = `const buy = (id: string, nm: string, price: number) => { setProd({id,name:nm,price}); setOpen(true); setError(""); };`;
const newBuy = `const buy = (id: string, nm: string, price: number) => {
    const msg = \`Halo Linguo.id! Saya tertarik membeli:\\n\\n📦 Produk: \${nm}\\n💰 Harga: \${formatRp(price)}\\n\\nMohon info pembayaran. Terima kasih!\`;
    window.open(\`https://wa.me/6282116859493?text=\${encodeURIComponent(msg)}\`, '_blank');
  };`;

if (content.includes(oldBuy)) {
  content = content.replace(oldBuy, newBuy);
  console.log('✅ Replaced buy function — now opens WhatsApp directly');
} else {
  console.log('❌ Could not find buy function. Manual edit needed.');
  process.exit(1);
}

writeFileSync(FILE, content, 'utf-8');
console.log('\n🎉 Done! Customer akan langsung diarahkan ke WhatsApp admin (+62 821-1685-9493)');
console.log('Modal checkout masih ada di code tapi tidak terpanggil (aman, tidak conflict)');
console.log('\nRun: git add -A && git commit -m "fix: produk buy button → direct WhatsApp (Xendit not ready)" && git push');
