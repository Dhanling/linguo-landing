#!/usr/bin/env node
/**
 * patch-wizard-save-to-db.mjs
 *
 * Fix: Wizard "Tambah Kelas" skrg INSERT ke database Supabase (bukan cuma mock state).
 * Efek: Registrasi baru punya UUID valid → upload bukti transfer ga error "pending" lagi.
 *
 * Cara pakai:
 *   1. Drag file ini ke ~/linguo-landing/ (pake Finder)
 *   2. Di terminal: cd ~/linguo-landing && node patch-wizard-save-to-db.mjs
 *   3. Script auto: backup, patch, validate, push ke GitHub, self-delete
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

const FILE = "src/app/akun/page.tsx";

if (!fs.existsSync(FILE)) {
  console.error(`❌ File tidak ketemu: ${FILE}`);
  console.error("   Pastikan script ini di-run dari ~/linguo-landing");
  process.exit(1);
}

const original = fs.readFileSync(FILE, "utf8");
const backup = `${FILE}.backup-${Date.now()}`;
fs.writeFileSync(backup, original);
console.log(`📦 Backup: ${backup}`);

// ============================================================================
// PATCH: handleConfirm di EnrollWizard — tambah INSERT ke Supabase
// ============================================================================

const oldBlock = `    const pendingReg = {
      id: \`pending-\${Date.now()}\`,
      product: enrollProgram,
      language: isTestPrep ? "IELTS/TOEFL" : enrollLang,
      level: "A1",
      status: "Menunggu Pembayaran",
      sessions_total: 0,
      sessions_used: 0,
      duration: enrollDuration,
      total_amount: price * 8,
      payment_status: "Belum Bayar",
      registration_date: new Date().toISOString(),
      teachers: null,
    };
    setStudent((s: any) => s ? { ...s, registrations: [...s.registrations, pendingReg] } : s);
    setShowEnroll(false);
    setEnrollStep(0);
  };`;

const newBlock = `    // ── FIX: Save registrasi ke Supabase biar punya UUID valid ──
    let studentId: string | null =
      student?.id && student.id !== "pending" ? student.id : null;

    // 1. Pastikan student record ada (upsert by email)
    if (!studentId) {
      try {
        const { data: upserted, error: studentErr } = await supabase
          .from("students")
          .upsert(
            {
              email: user?.email || "",
              name: displayName,
              avatar_url: user?.user_metadata?.avatar_url,
            },
            { onConflict: "email" }
          )
          .select("id")
          .single();
        if (studentErr) throw studentErr;
        studentId = upserted?.id ?? null;
      } catch (e) {
        console.error("Upsert student gagal:", e);
      }
    }

    // 2. Insert registrasi ke DB + return row lengkap
    let newReg: any = null;
    if (studentId) {
      try {
        const { data: inserted, error: regErr } = await supabase
          .from("registrations")
          .insert({
            student_id: studentId,
            product: enrollProgram,
            language: isTestPrep ? "IELTS/TOEFL" : enrollLang,
            level: "A1.1",
            status: "Menunggu Pembayaran",
            sessions_total: 0,
            sessions_used: 0,
            duration: enrollDuration,
            total_amount: price * 8,
            payment_status: "Belum Bayar",
            registration_date: new Date().toISOString(),
          })
          .select(
            "id, product, language, level, status, sessions_total, sessions_used, duration, total_amount, payment_status, registration_date, teacher_id, payment_proof_url, payment_proof_uploaded_at, payment_verified_at, payment_rejection_reason, teachers(name, whatsapp)"
          )
          .single();
        if (regErr) throw regErr;
        newReg = inserted;
      } catch (e: any) {
        console.error("Insert registrasi gagal:", e);
        alert(
          "Maaf, gagal menyimpan pendaftaran. Silakan hubungi admin via WhatsApp untuk bantuan."
        );
        setShowEnroll(false);
        setEnrollStep(0);
        return;
      }
    }

    // 3. Update state — kalau DB save sukses pake row real, kalau gagal fallback mock
    const pendingReg = newReg || {
      id: \`pending-\${Date.now()}\`,
      product: enrollProgram,
      language: isTestPrep ? "IELTS/TOEFL" : enrollLang,
      level: "A1.1",
      status: "Menunggu Pembayaran",
      sessions_total: 0,
      sessions_used: 0,
      duration: enrollDuration,
      total_amount: price * 8,
      payment_status: "Belum Bayar",
      registration_date: new Date().toISOString(),
      teachers: null,
    };

    // 4. Kalau student state-nya mock/belum ada, reload biar fetch fresh
    if (!student || student.id === "pending" || !student.id) {
      try {
        localStorage.removeItem(\`linguo_wizard_\${user?.id || user?.email}\`);
      } catch {}
      window.location.reload();
      return;
    }

    setStudent((s: any) =>
      s ? { ...s, registrations: [...s.registrations, pendingReg] } : s
    );
    setShowEnroll(false);
    setEnrollStep(0);
  };`;

if (!original.includes(oldBlock)) {
  console.error(
    "❌ Kode lama ga ketemu di handleConfirm. File mungkin udah di-edit manual."
  );
  fs.unlinkSync(backup);
  process.exit(1);
}

let updated = original.replace(oldBlock, newBlock);
console.log("✅ handleConfirm di-patch: INSERT ke Supabase");

// ============================================================================
// VALIDATE: Brace/paren balance
// ============================================================================
const countChar = (s, c) => (s.match(new RegExp(`\\${c}`, "g")) || []).length;
const openBrace = countChar(updated, "{");
const closeBrace = countChar(updated, "}");
const openParen = countChar(updated, "(");
const closeParen = countChar(updated, ")");

if (openBrace !== closeBrace) {
  console.error(
    `❌ Brace ga seimbang: ${openBrace} { vs ${closeBrace} }. Rollback.`
  );
  fs.writeFileSync(FILE, original);
  fs.unlinkSync(backup);
  process.exit(1);
}
if (openParen !== closeParen) {
  console.error(
    `❌ Paren ga seimbang: ${openParen} ( vs ${closeParen} ). Rollback.`
  );
  fs.writeFileSync(FILE, original);
  fs.unlinkSync(backup);
  process.exit(1);
}
console.log(
  `✅ Balance OK: ${openBrace} braces, ${openParen} parens`
);

// ============================================================================
// WRITE
// ============================================================================
fs.writeFileSync(FILE, updated);
console.log(
  `✅ Wrote ${FILE} (${original.length} → ${updated.length} chars)`
);

// ============================================================================
// GIT PUSH
// ============================================================================
try {
  execSync("git add -A", { stdio: "inherit" });
  execSync(
    'git commit -m "fix(akun): wizard Tambah Kelas skrg INSERT ke Supabase (fix upload pending UUID)"',
    { stdio: "inherit" }
  );
  execSync("git push", { stdio: "inherit" });
  console.log("✅ Pushed to GitHub");
} catch (e) {
  console.error("⚠️  Git push gagal (tapi file udah ke-patch):", e.message);
}

// ============================================================================
// CLEANUP
// ============================================================================
try {
  fs.unlinkSync(backup);
  console.log("🧹 Backup deleted");
} catch {}

try {
  fs.unlinkSync(process.argv[1]);
  console.log("🗑️  Script self-deleted");
} catch {}

console.log(`
✨ DONE! Setelah Vercel deploy (1-2 menit):

1. Login ke linguo.id/akun (akun mana aja)
2. Klik "+ Tambah Kelas"
3. Isi wizard sampe selesai (pilih program, bahasa, durasi, jadwal)
4. Klik "Selesai & Konfirmasi"
5. Card baru muncul dengan status "Menunggu Pembayaran"
6. Klik "Upload Bukti Transfer" → pilih file
7. Seharusnya SUKSES ✅ (ga ada error "pending" UUID)

Di admin dashboard (dashboard.linguo.id/Verifikasi Bayar):
→ Registrasi baru harus muncul sebagai item pending

⚠️  Kalau alert "Gagal menyimpan pendaftaran" muncul:
   → Berarti ada masalah RLS/permission di tabel "students" atau "registrations"
   → Check Supabase Auth settings + RLS policies
`);
