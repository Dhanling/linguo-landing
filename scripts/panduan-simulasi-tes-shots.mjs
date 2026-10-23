// [panduan-simulasi-tes-v1] Memotret alur Simulasi Tes dari akun DUMMY untuk
// build-panduan-simulasi-tes.mjs → public/panduan/simulasi/{katalog,petunjuk,soal,hasil}.jpg
//
//   DEMO_EMAIL=siswa.contoh@linguo.id DEMO_PASSWORD=… PUPPETEER_FROM=<folder berisi node_modules/puppeteer-core> \
//     node scripts/panduan-simulasi-tes-shots.mjs
//
// Akun dummy harus punya baris simulation_entitlements aktif (test_type toefl) supaya kartu
// tidak bergembok. "hasil" diambil dari pengerjaan terakhir di Riwayat Skor, jadi akun
// dummy perlu pernah mengumpulkan satu simulasi. Tidak ada jawaban yang dikirim skrip ini.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire((process.env.PUPPETEER_FROM || process.env.HOME + "/linguo-ig-post") + "/");
const puppeteer = require("puppeteer-core");
const OUT = process.env.SHOTS_OUT || new URL("../public/panduan/simulasi/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--window-size=1366,820", "--lang=id-ID"] });
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 });
await page.goto("https://linguo.id/akun", { waitUntil: "networkidle2", timeout: 60000 }); await sleep(2000);
await page.type("input[type=email]", process.env.DEMO_EMAIL);
await page.type("input[type=password]", process.env.DEMO_PASSWORD);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => (b.innerText || "").trim() === "Masuk")?.click());
await sleep(8000);
const dismiss = async () => { for (let i = 0; i < 5; i++) { const hit = await page.evaluate(() => {
  const t = [...document.querySelectorAll("button, a, [role=button]")].find((e) => { const b = e.getBoundingClientRect(); return b.width && b.height && /^(Nanti saja|Tutup|Lewati|Oke|Mengerti|Nanti)$/i.test((e.innerText || "").trim()); });
  if (t) { t.click(); return true; } return false; }); if (!hit) break; await sleep(900); } };
const clickText = (re) => page.evaluate((re) => { const r = new RegExp(re); const e = [...document.querySelectorAll("button, a, [role=button], [role=tab]")].find((e) => { const b = e.getBoundingClientRect(); return b.width && b.height && r.test((e.innerText || "").trim()); }); if (e) { e.click(); return true; } return false; }, re);
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82 }); console.log(name, page.url()); };

await page.goto("https://linguo.id/akun?menu=simulasi", { waitUntil: "networkidle2", timeout: 60000 }); await sleep(4000); await dismiss();
await shot("katalog");
// Layar petunjuk = halaman simulasi sebelum "Saya Mengerti, Mulai Simulasi" (belum memulai sesi).
if (await clickText("^(Mulai|Lanjutkan)$")) { await sleep(5000); await dismiss(); await shot("petunjuk"); }
// Hasil terakhir dari Riwayat Skor (kalau ada).
await page.goto("https://linguo.id/akun?menu=simulasi", { waitUntil: "networkidle2" }); await sleep(4000); await dismiss();
if (await clickText("Riwayat Skor")) { await sleep(2500); if (await clickText("^(Lihat|Lihat hasil|Detail)")) { await sleep(5000); await shot("hasil"); } }
console.log("Tangkapan 'soal' diambil manual: mulai simulasi di akun dummy lalu potret layar soal Reading.");
await browser.close();
