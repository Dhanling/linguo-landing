import { readFileSync, writeFileSync } from "fs";

const file = "src/app/page.tsx";
let code = readFileSync(file, "utf8");

// 1. Replace handleFinal function
const oldHandleFinal = `  const handleFinal = async () => {
    setSaving(true);
    const fullNum = countryCode.replace("+","") + formWa;
    await saveLead({ wa_number: fullNum, language: selLang, name: formName, email: formEmail, program: selProgram, level: selLevel });
    const msg = \`Halo, saya \${formName}. Saya tertarik \${selProgram} bahasa \${selLang} level \${selLevel}.\\nEmail: \${formEmail}\\nWA: \${countryCode}\${formWa}\`;
    window.open(\`https://wa.me/6282116859493?text=\${encodeURIComponent(msg)}\`, '_blank');
    setSaving(false);
    handleClose();
  };`;

const newHandleFinal = `  const handleFinal = async () => {
    setSaving(true);
    try {
      const fullNum = countryCode.replace("+","") + formWa;
      let productKey = "";
      if(selProgram==="Kelas Private") productKey = "private-" + selLevel.toLowerCase();
      else if(selProgram==="Kelas Reguler") productKey = "reguler-" + selLevel.toLowerCase();
      else if(selProgram==="IELTS/TOEFL Prep") productKey = "ielts-toefl";

      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, wa_number: fullNum, language: selLang, program: productKey.split("-")[0], level: selLevel, productKey }),
      });
      const data = await res.json();
      if(data.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        alert("Gagal membuat invoice: " + (data.error || "Silakan coba lagi"));
        setSaving(false);
      }
    } catch(e) {
      console.error("Payment error:", e);
      alert("Terjadi kesalahan. Silakan coba lagi.");
      setSaving(false);
    }
  };`;

if (code.includes(oldHandleFinal)) {
  code = code.replace(oldHandleFinal, newHandleFinal);
  console.log("✅ handleFinal updated for Xendit payment");
} else {
  console.log("❌ Could not find handleFinal to replace. Manual edit needed.");
  process.exit(1);
}

// 2. Update button text from "Daftar Sekarang" to "Bayar Sekarang"
code = code.replace(
  '{saving ? "Menyimpan..." : "Daftar Sekarang →"}',
  '{saving ? "Memproses pembayaran..." : "Bayar Sekarang →"}'
);
console.log("✅ Button text updated to 'Bayar Sekarang'");

// 3. Update bottom text
code = code.replace(
  'Data akan disimpan & tim kami akan menghubungi via WhatsApp',
  'Kamu akan diarahkan ke halaman pembayaran Xendit'
);
console.log("✅ Footer text updated");

writeFileSync(file, code);
console.log("✅ page.tsx saved!");
