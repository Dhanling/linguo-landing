// [panduan-simulasi-tes-v1] Merakit PDF "Panduan Simulasi Tes TOEFL & IELTS" bergambar
// → public/panduan/panduan-simulasi-tes.pdf (linguo.id/panduan/panduan-simulasi-tes.pdf)
//
// Dikirim OTOMATIS lewat WA + email begitu pembelian Simulasi Tes lunas
// (linguo-app xendit-webhook/panduanSimulasi.ts). PDF-nya dirakit SEKALI lalu dipakai
// ulang untuk semua pembeli: webhook menyalinnya ke bucket wa-media
// (panduan/panduan-simulasi-tes.pdf) saat pertama dipakai. Habis merakit ulang, hapus
// salinan di wa-media supaya webhook mengambil versi baru:
//   npx supabase storage rm --experimental --linked ss:///wa-media/panduan/panduan-simulasi-tes.pdf
//
// Tangkapan layar: public/panduan/siswa/{login,simulasi}.jpg (akun dummy siswa.contoh@linguo.id,
// lihat tutorial-dashboard-siswa-shots.mjs) + public/panduan/simulasi/*.jpg dari
// scripts/panduan-simulasi-tes-shots.mjs. Gambar yang belum ada dilewati (langkahnya tetap
// tertulis), jadi PDF bisa dirakit ulang begitu tangkapan layarnya lengkap.
//
// Jalankan: node scripts/build-panduan-simulasi-tes.mjs   (butuh Google Chrome terpasang)

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KELUAR = path.join(ROOT, "public/panduan/panduan-simulasi-tes.pdf");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HAL = 3;

const b64 = (rel) => readFileSync(path.join(ROOT, rel)).toString("base64");
const logo = b64("public/images/logo-linguo-white-full.png");
const img = (rel, lebar = 100) => {
  const file = `public/panduan/${rel}.jpg`;
  if (!existsSync(path.join(ROOT, file))) return "";
  return `<img class="shot" style="width:${lebar}%" src="data:image/jpeg;base64,${b64(file)}">`;
};

const kepala = (hal) => `
  <header>
    <img src="data:image/png;base64,${logo}" alt="Linguo.id">
    <div class="hal">Panduan Simulasi Tes · ${hal}/${HAL}</div>
  </header>`;
const kaki = `
  <footer>
    <span>linguo.id/akun → Simulasi Tes</span>
    <span>CS WhatsApp 0821-1685-9493</span>
  </footer>`;
const halaman = (hal, isi) => `<section class="page">${kepala(hal)}${isi}${kaki}</section>`;
const poin = (...xs) => `<ul>${xs.map((x) => `<li>${x}</li>`).join("")}</ul>`;
const bagian = (no, judul, sub) => `<h2><span class="no">${no}</span>${judul}</h2>${sub ? `<p class="sub">${sub}</p>` : ""}`;
const tanya = (q, a) => `<div class="qa"><b>${q}</b><p>${a}</p></div>`;

const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<title>Panduan Simulasi Tes Linguo</title>
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
  .shot { margin: 2mm auto 0; border-radius: 3mm; border: .3mm solid #DDE3EA; box-shadow: 0 1.5mm 5mm rgba(18,23,43,.08); display: block; }
  ul { margin: 2.5mm 0 0 5mm; color: #2E3648; }
  li { margin: .8mm 0; }
  .catatan { margin-top: 3mm; background: #E8F6F6; border-radius: 3mm; padding: 3mm 4mm; font-size: 9.6pt; color: #0F5E5E; }
  .awas { margin-top: 3mm; background: #FFF6E5; border-radius: 3mm; padding: 3mm 4mm; font-size: 9.6pt; color: #7A4B00; }
  .qa { border-bottom: .3mm solid #E6EAEF; padding: 2.4mm 0; }
  .qa:last-child { border-bottom: 0; }
  .qa p { color: #4A5468; margin-top: .5mm; }
  footer { position: absolute; left: 14mm; right: 14mm; bottom: 7mm; display: flex; justify-content: space-between; font-size: 8.6pt; color: #7A8496; border-top: .3mm solid #E6EAEF; padding-top: 2.2mm; }
  a { color: #1A9E9E; text-decoration: none; font-weight: 700; }
</style></head><body>

${halaman(1, `
  <h1>Panduan Simulasi Tes TOEFL &amp; IELTS</h1>
  <p class="lead">Terima kasih sudah membeli Simulasi Tes Linguo! Aksesnya berlaku <b>selamanya</b> dan terhubung ke <b>email yang kamu pakai saat membeli</b>. Ikuti langkah di bawah untuk mulai mengerjakan.</p>
  ${bagian(1, "Masuk ke linguo.id/akun")}
  ${img("siswa/login", 88)}
  ${poin(
    "Buka <b>linguo.id/akun</b> di laptop atau HP (Chrome / Safari).",
    "Tekan <b>Masuk dengan Google</b> kalau email pembelianmu Gmail, atau isi email + password.",
    "Belum punya / lupa password? Isi email lalu tekan <b>Kirim link login</b>, buka email dari Linguo, dan klik link-nya.",
  )}
  <div class="catatan"><b>Penting:</b> masuk dengan email yang <b>sama persis</b> dengan email saat membeli. Akses simulasi menempel ke email itu, bukan ke nomor WhatsApp.</div>
  ${bagian(2, "Buka menu Simulasi Tes", "Menu <b>Belajar → Simulasi Tes</b> (di HP: lewat menu bawah / menu samping).")}
  ${img("simulasi/katalog", 88) || img("siswa/simulasi", 88)}
  ${poin(
    (img("simulasi/katalog") ? "" : "Gambar di atas tampilan <b>sebelum</b> membeli. ") +
      "Kartu tes yang sudah kamu beli <b>tidak bergembok</b> lagi dan tombol <b>Beli Paket</b> berubah jadi <b>Mulai</b>.",
    "Pilih simulasi TOEFL atau IELTS sesuai paket yang kamu beli.",
  )}
`)}

${halaman(2, `
  ${bagian(3, "Baca petunjuk, lalu mulai", "Sebelum tes dimulai kamu akan melihat rincian bagian, jumlah soal, dan durasinya.")}
  ${img("simulasi/petunjuk", 84)}
  ${poin(
    "Isi <b>nama lengkap</b>; nama ini tampil di hasil &amp; sertifikat simulasimu.",
    "Ada bagian Speaking? Tekan <b>Tes mikrofon</b> dan izinkan akses mikrofon di browser.",
    "Tekan <b>Saya Mengerti, Mulai Simulasi</b>. Tes berjalan dalam <b>layar penuh</b>, seperti ujian aslinya.",
  )}
  ${bagian(4, "Kerjakan tiap subtes berurutan")}
  ${img("simulasi/soal", 84)}
  ${poin(
    "Tiap subtes (Listening, Reading, Writing, Speaking / Structure) punya <b>batas waktu sendiri</b>; sisa waktunya terlihat di atas.",
    "Jawaban &amp; sisa waktu <b>tersimpan otomatis</b>. Kalau koneksi putus, buka lagi simulasinya dan tekan <b>Lanjutkan</b>.",
    "Selesai satu subtes? Tekan <b>Selesaikan Subtes</b>. Subtes yang sudah diselesaikan tidak bisa dibuka lagi.",
    "Writing: ketik esai di kotak jawaban. Speaking: tekan <b>Mulai rekam</b>, bicara, lalu simpan.",
  )}
  <div class="awas"><b>Jangan pindah tab / aplikasi</b> dan jangan keluar dari layar penuh selama tes. Sistem mencatatnya sebagai pelanggaran, dan kalau terlalu sering jawabanmu otomatis dikumpulkan.</div>
`)}

${halaman(3, `
  ${bagian(5, "Lihat skor, pembahasan &amp; sertifikat", "Begitu subtes terakhir selesai, jawabanmu dinilai otomatis (Writing &amp; Speaking dinilai AI).")}
  ${img("simulasi/hasil", 84)}
  ${poin(
    "<b>Perkiraan skor</b> TOEFL / band IELTS, plus <b>nilai per subtes</b>.",
    "<b>Pembahasan jawaban</b>: kunci jawaban, jawabanmu, dan catatan penilai untuk tiap soal.",
    "Tekan <b>Unduh Laporan Skor</b> atau <b>Unduh Sertifikat hasil simulasi (PDF)</b>.",
    "Semua hasil tersimpan di <b>Riwayat Skor</b> (tab Simulasi Tes), jadi kamu bisa membandingkan progres dari waktu ke waktu.",
  )}
  <h2>Tips supaya hasilnya akurat</h2>
  ${poin(
    "Kerjakan di <b>laptop</b> dengan koneksi stabil, sisihkan waktu ±2–3 jam tanpa gangguan.",
    "Pakai <b>headset</b> untuk Listening &amp; Speaking, di ruangan yang tenang.",
    "Perlakukan seperti ujian sungguhan: jangan buka kamus atau tab lain.",
  )}
  <h2>Pertanyaan yang sering muncul</h2>
  ${tanya("Simulasinya masih bergembok / diminta Beli Paket lagi.", "Kamu kemungkinan masuk dengan email lain. Lihat tulisan kecil di bawah kartu (&ldquo;kamu login sebagai …&rdquo;). Keluar, lalu masuk lagi dengan email saat membeli. Kalau tetap terkunci, kabari CS beserta email pembeliannya.")}
  ${tanya("Waktu habis atau saya keluar di tengah tes.", "Buka lagi simulasinya. Jawaban yang sudah tersimpan bisa dilanjutkan atau dikumpulkan untuk dinilai.")}
  ${tanya("Mikrofon tidak terdeteksi.", "Izinkan akses mikrofon untuk linguo.id di pengaturan browser, lalu tekan Tes mikrofon lagi.")}
  ${tanya("Bisa diulang?", "Bisa. Aksesnya selamanya, dan setiap pengerjaan tercatat di Riwayat Skor.")}
  <div class="catatan" style="margin-top:4mm"><b>Butuh bantuan?</b> Hubungi CS Linguo lewat WhatsApp <a href="https://wa.me/6282116859493">0821-1685-9493</a>.</div>
`)}
</body></html>`;

const tmp = path.join(tmpdir(), `panduan-simulasi-tes-${process.pid}.html`);
writeFileSync(tmp, html);
mkdirSync(path.dirname(KELUAR), { recursive: true });
execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${KELUAR}`, `file://${tmp}`], { stdio: "ignore" });
if (process.env.KEEP_HTML) console.log("HTML:", tmp); else rmSync(tmp);
console.log("PDF dirakit →", path.relative(ROOT, KELUAR));
