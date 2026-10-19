// [tutorial-dashboard-siswa-v1] Merakit PDF "Tutorial Dashboard Siswa" bergambar
// → public/panduan/tutorial-dashboard-siswa.pdf
//
// Kembaran bergambar dari panduan teks 2 halaman (build-panduan-dashboard-siswa.mjs).
// Dikirim lewat WA ke siswa yang belum pernah login. Tangkapan layarnya ada di
// public/panduan/siswa/*.jpg, dipotret dari akun DUMMY siswa.contoh@linguo.id
// ("Siswa Contoh", tanpa data siswa asli) oleh scripts/tutorial-dashboard-siswa-shots.mjs.
//
// Jalankan: node scripts/build-tutorial-dashboard-siswa.mjs
// Butuh Google Chrome terpasang (dipakai headless untuk mencetak PDF).

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KELUAR = path.join(ROOT, "public/panduan/tutorial-dashboard-siswa.pdf");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HAL = 7;

const b64 = (rel) => readFileSync(path.join(ROOT, rel)).toString("base64");
const logo = b64("public/images/logo-linguo-white-full.png");
const img = (nama, lebar = 100) => `<img class="shot" style="width:${lebar}%" src="data:image/jpeg;base64,${b64(`public/panduan/siswa/${nama}.jpg`)}">`;

const kepala = (hal) => `
  <header>
    <img src="data:image/png;base64,${logo}" alt="Linguo.id">
    <div class="hal">Tutorial Dashboard Siswa · ${hal}/${HAL}</div>
  </header>`;
const kaki = `
  <footer>
    <span>linguo.id/akun</span>
    <span>CS WhatsApp 0821-1685-9493</span>
  </footer>`;
const halaman = (hal, isi) => `<section class="page">${kepala(hal)}${isi}${kaki}</section>`;
const poin = (...xs) => `<ul>${xs.map((x) => `<li>${x}</li>`).join("")}</ul>`;
const bagian = (no, judul, sub) => `<h2><span class="no">${no}</span>${judul}</h2>${sub ? `<p class="sub">${sub}</p>` : ""}`;
const tanya = (q, a) => `<div class="qa"><b>${q}</b><p>${a}</p></div>`;

const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<title>Tutorial Dashboard Siswa Linguo</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #12172B; font-size: 10.2pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; padding: 0 14mm; position: relative; page-break-after: always; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
  header { background: #1A9E9E; margin: 0 -14mm; padding: 6mm 14mm; display: flex; align-items: center; justify-content: space-between; color: #fff; }
  header img { height: 8mm; }
  .hal { font-size: 9pt; font-weight: 600; opacity: .9; }
  h1 { font-size: 23pt; line-height: 1.15; letter-spacing: -.02em; margin: 7mm 0 2mm; }
  .lead { font-size: 10.8pt; color: #4A5468; }
  h2 { font-size: 13pt; margin: 6mm 0 1.5mm; display: flex; align-items: center; gap: 2.5mm; }
  .no { flex: none; width: 7mm; height: 7mm; border-radius: 50%; background: #1A9E9E; color: #fff; font-size: 9.5pt; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .sub { color: #4A5468; margin-bottom: 2.5mm; }
  .shot { margin: 0 auto; border-radius: 3mm; border: .3mm solid #DDE3EA; box-shadow: 0 1.5mm 5mm rgba(18,23,43,.08); display: block; }
  ul { margin: 2.5mm 0 0 5mm; color: #2E3648; }
  li { margin: .8mm 0; }
  .dua { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; align-items: start; }
  .catatan { margin-top: 3mm; background: #E8F6F6; border-radius: 3mm; padding: 3mm 4mm; font-size: 9.6pt; color: #0F5E5E; }
  .hp { display: grid; grid-template-columns: 52mm 1fr; gap: 6mm; align-items: start; }
  .hp .shot { border-radius: 5mm; }
  .qa { border-bottom: .3mm solid #E6EAEF; padding: 2.4mm 0; }
  .qa:last-child { border-bottom: 0; }
  .qa p { color: #4A5468; margin-top: .5mm; }
  footer { position: absolute; left: 14mm; right: 14mm; bottom: 7mm; display: flex; justify-content: space-between; font-size: 8.6pt; color: #7A8496; border-top: .3mm solid #E6EAEF; padding-top: 2.2mm; }
  a { color: #1A9E9E; text-decoration: none; font-weight: 700; }
</style></head><body>

${halaman(1, `
  <h1>Tutorial Dashboard Siswa Linguo</h1>
  <p class="lead">Jadwal, rekaman kelas, materi, rapor, sampai sertifikat, semuanya ada di satu tempat: <a href="https://linguo.id/akun">linguo.id/akun</a>. Bisa dibuka dari HP maupun laptop, tanpa pasang aplikasi.</p>
  ${bagian(1, "Masuk ke dashboard")}
  ${img("login")}
  ${poin(
    "Buka <b>linguo.id/akun</b> di browser (Chrome, Safari, dll).",
    "Tekan <b>Masuk dengan Google</b> kalau emailmu Gmail, atau isi email + password.",
    "Belum punya / lupa password? Isi email lalu tekan <b>Kirim link login</b>. Buka email dari Linguo, klik link-nya, dan kamu langsung masuk.",
  )}
  <div class="catatan"><b>Penting:</b> pakai email yang <b>sama</b> dengan yang kamu daftarkan ke Linguo. Kalau sudah masuk tapi kelasnya kosong, biasanya emailnya berbeda. Kabari CS supaya disesuaikan.</div>
`)}

${halaman(2, `
  ${bagian(2, "Pertama kali masuk: lengkapi nomor WhatsApp", "Muncul sekali saja. Nomor ini dipakai tim Linguo untuk mengabari jadwal dan kelasmu.")}
  ${img("gate-wa", 58)}
  ${bagian(3, "Beranda", "Halaman pertama setelah masuk: ringkasan semua kelasmu.")}
  ${img("beranda", 94)}
  ${poin(
    "<b>Kelas Kamu</b>: kartu tiap kelas aktif, lengkap dengan progres dan sisa sesi (mis. <b>Sesi 5/18</b>).",
    "<b>Sesi Mendatang</b>: jadwal terdekat. Saat kelas live dimulai, tombol masuk kelas muncul di sini.",
    "<b>Produk Digital</b>: e-book yang kamu miliki, tinggal tekan <b>Baca sekarang</b>.",
  )}
`)}

${halaman(3, `
  ${bagian(4, "Jadwal", "Menu <b>Aktivitas → Jadwal</b>. Kalender semua sesi kelasmu.")}
  ${img("jadwal")}
  ${poin(
    "Ganti tampilan <b>Hari / Minggu / Bulan</b>, geser dengan tombol panah.",
    "Tiap kotak menunjukkan bahasa, jam, nomor sesi, dan topik pertemuannya.",
  )}
  ${bagian(5, "Kelas &amp; Materi", "Menu <b>Belajar → Kelas &amp; Materi</b>. Pusat tiap kelasmu.")}
  ${img("materi", 92)}
`)}

${halaman(4, `
  <h2 style="margin-top:7mm">Empat tab di setiap kelas</h2>
  ${img("materi-tab", 82)}
  ${poin(
    "<b>Sesi &amp; Rekaman</b>: daftar semua pertemuan. Rekaman kelas muncul di sini setelah sesi selesai.",
    "<b>Materi</b>: slide, berkas, dan PR dari pengajar untuk tiap sesi.",
    "<b>Kuis</b>: latihan soal dan nilai kuismu.",
    "<b>Rapor</b>: penilaian dari pengajar, terbit tiap 4 sesi dan di akhir program.",
  )}
  ${bagian(6, "Sertifikat &amp; Rapor", "Menu <b>Aktivitas → Sertifikat</b>.")}
  ${img("sertifikat", 82)}
  ${poin(
    "Lihat progres menuju sertifikat dan sisa sesi untuk membukanya.",
    "Sertifikat terbit otomatis setelah satu sublevel selesai, siap diunduh sebagai PDF bersama rapornya.",
  )}
`)}

${halaman(5, `
  ${bagian(7, "Perpustakaan", "Menu <b>Aktivitas → Perpustakaan</b>. E-book (Lingbook) dan E-Learning milikmu.")}
  ${img("pustaka")}
  ${bagian(8, "Lingnote", "Menu <b>Belajar → Lingnote</b>. Buku catatan belajarmu: materi, kosakata, berkas, dan PR tersimpan rapi, tidak hilang seperti di chat.")}
  ${img("catatan")}
`)}

${halaman(6, `
  ${bagian(9, "Latihan Menulis", "Menu <b>Belajar → Latihan Menulis</b>. Latih tulisan aksara non-Latin: Jepang, Mandarin, Korea, Thai, Arab, Rusia, dan lainnya, lengkap dengan urutan goresan dan suara.")}
  ${img("menulis", 86)}
  ${bagian(10, "Simulasi Tes", "Menu <b>Belajar → Simulasi Tes</b>. Latihan TOEFL &amp; IELTS 4 skill dengan penilaian AI.")}
  ${img("simulasi", 86)}
  ${poin(
    "<b>Watch &amp; Learn</b>: belajar dari video YouTube dengan subtitle interaktif dan terjemahan.",
    "<b>Kosakata Saya</b>: kata yang kamu simpan, bisa diulang sebagai flashcard.",
  )}
`)}

${halaman(7, `
  ${bagian(11, "Pengaturan &amp; versi HP")}
  <div class="hp">
    ${img("hp", 100)}
    <div>
      ${poin(
        "Di HP, menu utama ada di bilah bawah: <b>Beranda, Jadwal, Materi, Watch, Akun</b>.",
        "Menu <b>Pengaturan / Akun</b>: ganti foto atau avatar, nama panggilan, kota, zona waktu, password, notifikasi, serta riwayat tagihan &amp; saldo.",
        "Tombol <b>Mode gelap</b> dan pilihan bahasa menu (Indonesia / English) ada di menu samping.",
        "Ada kendala? Tekan ikon <b>Lapor Bug</b>, ceritakan singkat masalahnya.",
      )}
    </div>
  </div>
  <h2>Pertanyaan yang sering muncul</h2>
  ${tanya("Sudah login tapi kelas saya tidak muncul.", "Kemungkinan kamu masuk dengan email lain. Keluar, lalu masuk lagi dengan email yang didaftarkan ke Linguo, atau kabari CS.")}
  ${tanya("Di mana rekaman kelas?", "<b>Kelas &amp; Materi</b> → pilih kelas → tab <b>Sesi &amp; Rekaman</b>.")}
  ${tanya("Berapa sisa sesi saya?", "Lihat angka sesi di kartu kelas pada <b>Beranda</b>, mis. 5/16 berarti 5 dari 16 sesi sudah berjalan.")}
  ${tanya("Saya lupa password.", "Di halaman masuk, isi email lalu tekan <b>Kirim link login</b>.")}
  <div class="catatan" style="margin-top:4mm"><b>Butuh bantuan?</b> Hubungi CS Linguo lewat WhatsApp <a href="https://wa.me/6282116859493">0821-1685-9493</a>.</div>
`)}
</body></html>`;

const tmp = path.join(tmpdir(), `tutorial-dashboard-siswa-${process.pid}.html`);
writeFileSync(tmp, html);
mkdirSync(path.dirname(KELUAR), { recursive: true });
execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${KELUAR}`, `file://${tmp}`], { stdio: "ignore" });
if (process.env.KEEP_HTML) console.log("HTML:", tmp); else rmSync(tmp);
console.log("PDF dirakit →", path.relative(ROOT, KELUAR));
