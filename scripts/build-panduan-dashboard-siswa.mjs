// [panduan-dashboard-siswa-v1] Merakit PDF "Panduan Singkat Dashboard Siswa"
// (2 halaman A4) → public/panduan/panduan-dashboard-siswa.pdf
//
// Pemicunya permintaan tim kurikulum: butuh penjelasan ringkas yang bisa
// langsung diteruskan tiap ada siswa bertanya soal dashboard. Nama menu di
// bawah WAJIB sama dengan sidebar `src/components/akun/StudentShell.tsx` —
// kalau menu di sana berubah, ubah di sini lalu rakit ulang.
//
// Jalankan: node scripts/build-panduan-dashboard-siswa.mjs
// Butuh Google Chrome terpasang (dipakai headless untuk mencetak PDF).

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const L = require("lucide-react");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KELUAR = path.join(ROOT, "public/panduan/panduan-dashboard-siswa.pdf");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const ikon = (nama, size = 18) => renderToStaticMarkup(React.createElement(L[nama], { size, strokeWidth: 2 }));
const logo = readFileSync(path.join(ROOT, "public/images/logo-linguo-white-full.png")).toString("base64");

const menu = (nama, judul, isi) => `
  <div class="menu">
    <div class="ik">${ikon(nama)}</div>
    <div><b>${judul}</b><p>${isi}</p></div>
  </div>`;

const tanya = (q, a) => `<div class="qa"><b>${q}</b><p>${a}</p></div>`;

const kepala = (hal) => `
  <header>
    <img src="data:image/png;base64,${logo}" alt="Linguo.id">
    <div class="hal">Panduan Dashboard Siswa · ${hal}/2</div>
  </header>`;

const kaki = `
  <footer>
    <span>linguo.id/akun</span>
    <span>CS WhatsApp 0821-1685-9493</span>
  </footer>`;

const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<title>Panduan Singkat Dashboard Siswa Linguo</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #12172B; font-size: 10.4pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; padding: 0 15mm; position: relative; page-break-after: always; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
  header { background: #1A9E9E; margin: 0 -15mm; padding: 7mm 15mm; display: flex; align-items: center; justify-content: space-between; color: #fff; }
  header img { height: 9mm; }
  .hal { font-size: 9pt; font-weight: 600; opacity: .9; }
  h1 { font-size: 22pt; line-height: 1.15; letter-spacing: -.02em; margin: 8mm 0 2mm; }
  .lead { font-size: 11pt; color: #4A5468; max-width: 150mm; }
  h2 { font-size: 12.5pt; margin: 7mm 0 3mm; display: flex; align-items: center; gap: 2.5mm; }
  h2::before { content: ""; width: 1.4mm; height: 5mm; border-radius: 1mm; background: #1A9E9E; }
  .langkah { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
  .langkah > div { border: .3mm solid #DDE3EA; border-radius: 4mm; padding: 4mm; }
  .no { width: 7mm; height: 7mm; border-radius: 50%; background: #1A9E9E; color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-bottom: 2mm; font-size: 10pt; }
  .langkah p, .menu p, .qa p { color: #4A5468; font-size: 9.6pt; margin-top: .6mm; }
  .catatan { margin-top: 4mm; background: #E8F6F6; border-radius: 3.5mm; padding: 3.2mm 4mm; font-size: 9.6pt; color: #0F5E5E; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3.2mm 6mm; }
  .menu { display: flex; gap: 3mm; align-items: flex-start; break-inside: avoid; }
  .ik { flex: none; width: 9mm; height: 9mm; border-radius: 2.6mm; background: #E8F6F6; color: #1A9E9E; display: flex; align-items: center; justify-content: center; }
  .qa { border-bottom: .3mm solid #E6EAEF; padding: 2.6mm 0; break-inside: avoid; }
  .qa:last-child { border-bottom: 0; }
  footer { position: absolute; left: 15mm; right: 15mm; bottom: 8mm; display: flex; justify-content: space-between; font-size: 8.6pt; color: #7A8496; border-top: .3mm solid #E6EAEF; padding-top: 2.5mm; }
  a { color: #1A9E9E; text-decoration: none; font-weight: 700; }
</style></head><body>

<section class="page">
  ${kepala(1)}
  <h1>Panduan Singkat<br>Dashboard Siswa Linguo</h1>
  <p class="lead">Semua urusan belajarmu ada di satu tempat: jadwal, kelas live, rekaman, materi, kuis, rapor, sampai sertifikat. Alamatnya <a href="https://linguo.id/akun">linguo.id/akun</a>, bisa dibuka dari HP maupun laptop.</p>

  <h2>Cara masuk</h2>
  <div class="langkah">
    <div><div class="no">1</div><b>Buka linguo.id/akun</b><p>Lewat browser apa saja (Chrome, Safari), tanpa perlu memasang aplikasi.</p></div>
    <div><div class="no">2</div><b>Masuk dengan emailmu</b><p>Pilih <b>Masuk dengan Google</b>, atau isi email + password. Belum punya password? Minta <b>link login</b> yang dikirim ke emailmu.</p></div>
    <div><div class="no">3</div><b>Kelasmu langsung tampil</b><p>Kelas aktif, sisa sesi, dan jadwal terdekat muncul di halaman Beranda.</p></div>
  </div>
  <div class="catatan"><b>Penting:</b> pakai email yang sama dengan yang kamu daftarkan ke Linguo. Kalau sudah masuk tetapi kelasnya kosong, biasanya emailnya berbeda. Kabari CS supaya disesuaikan.</div>

  <h2>Menu sehari-hari</h2>
  <div class="grid">
    ${menu("LayoutGrid", "Beranda", "Ringkasan belajarmu: kelas aktif, progres sesi, dan kartu <b>Sesi Mendatang</b>.")}
    ${menu("CalendarDays", "Jadwal", "Kalender semua sesi kelasmu, lengkap dengan hari, jam, dan pengajarnya.")}
    ${menu("MessagesSquare", "Grup Kelas", "Ruang obrolan dengan pengajar dan teman sekelas.")}
    ${menu("Library", "Perpustakaan", "E-book dan modul yang kamu miliki, bisa dibaca langsung di dashboard.")}
    ${menu("Star", "Sertifikat", "Sertifikat kelas yang sudah kamu selesaikan, siap diunduh.")}
    ${menu("Settings", "Pengaturan", "Ubah foto profil, data diri, dan password.")}
  </div>

  <h2>Masuk kelas live</h2>
  <div class="grid">
    ${menu("Video", "Dari kartu Sesi Mendatang", "Buka <b>Beranda</b>, cari sesi hari ini, lalu tekan <b>Join kelas live</b>. Tombolnya aktif 10 menit sebelum jam kelas.")}
    ${menu("Smartphone", "Di HP", "Menu utama ada di bilah bawah layar: Beranda, Jadwal, Materi, Watch, dan Akun.")}
  </div>
  ${kaki}
</section>

<section class="page">
  ${kepala(2)}
  <h2 style="margin-top:8mm">Menu belajar</h2>
  <div class="grid">
    ${menu("BookOpen", "Kelas &amp; Materi", "Pusat tiap kelasmu, berisi empat tab: <b>Sesi &amp; Rekaman</b>, <b>Materi</b>, <b>Kuis</b>, dan <b>Rapor</b>.")}
    ${menu("NotebookPen", "Lingnote", "Catatan pribadimu: tulis catatan, simpan berkas, catat PR, plus mode fokus Pomodoro.")}
    ${menu("PenLine", "Latihan Menulis", "Latihan menulis aksara non-Latin seperti kana, Hanzi, Thai, dan Arab.")}
    ${menu("ClipboardCheck", "Simulasi Tes", "Latihan soal bergaya tes kemampuan bahasa, dengan hasil dan pembahasan.")}
    ${menu("Clapperboard", "Watch &amp; Learn", "Belajar dari video dengan subtitle interaktif dan kuis.")}
    ${menu("Layers", "Kosakata Saya", "Kumpulan kata yang kamu simpan, bisa diulang dalam bentuk kartu (flashcard).")}
  </div>

  <h2>Pertanyaan yang sering muncul</h2>
  ${tanya("Di mana saya menonton rekaman kelas?", "Buka <b>Kelas &amp; Materi</b>, pilih kelasnya, lalu tab <b>Sesi &amp; Rekaman</b>. Rekaman muncul setelah sesi selesai.")}
  ${tanya("Di mana materi dan PR dari pengajar?", "Di <b>Kelas &amp; Materi</b>, tab <b>Materi</b>. Topik dan catatan tiap pertemuan juga tercantum di tab Sesi &amp; Rekaman.")}
  ${tanya("Bagaimana melihat nilai kuis dan perkembangan saya?", "Nilai kuis ada di tab <b>Kuis</b>, sedangkan penilaian dari pengajar ada di tab <b>Rapor</b>.")}
  ${tanya("Berapa sisa sesi saya?", "Lihat angka sesi di kartu kelas pada <b>Beranda</b> atau <b>Kelas &amp; Materi</b>, misalnya 5/16 berarti 5 dari 16 sesi sudah terpakai.")}
  ${tanya("Saya lupa password.", "Di halaman masuk, isi emailmu lalu minta <b>link login</b>. Buka email dari Linguo dan klik link-nya, kamu langsung masuk.")}
  ${tanya("Tampilannya terlalu terang, atau saya mau ganti bahasa menu.", "Di menu samping ada tombol <b>Mode gelap</b> dan pilihan bahasa antarmuka (Indonesia / English).")}
  ${tanya("Ada yang error atau tidak sesuai.", "Tekan <b>Lapor Bug</b> di menu samping dan ceritakan singkat masalahnya. Tim kami menerima laporannya langsung.")}

  <div class="catatan" style="margin-top:6mm"><b>Butuh bantuan?</b> Hubungi CS Linguo lewat WhatsApp <a href="https://wa.me/6282116859493">0821-1685-9493</a> atau tanyakan ke pengajarmu di Grup Kelas.</div>
  ${kaki}
</section>
</body></html>`;

const tmp = path.join(tmpdir(), `panduan-dashboard-siswa-${process.pid}.html`);
writeFileSync(tmp, html);
mkdirSync(path.dirname(KELUAR), { recursive: true });
execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${KELUAR}`, `file://${tmp}`], { stdio: "ignore" });
rmSync(tmp);
console.log("PDF dirakit →", path.relative(ROOT, KELUAR));
