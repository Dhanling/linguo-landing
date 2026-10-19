// [tutorial-dashboard-siswa-v1] Memotret dashboard siswa (linguo.id/akun) dari akun DUMMY
// siswa.contoh@linguo.id ("Siswa Contoh", students …0202) untuk PDF tutorial.
//
//   DEMO_EMAIL=siswa.contoh@linguo.id DEMO_PASSWORD=… PUPPETEER_FROM=~/linguo-ig-post \
//     node scripts/tutorial-dashboard-siswa-shots.mjs
//   lalu kecilkan ke public/panduan/siswa/*.jpg (lebar 1400) dan jalankan
//   node scripts/build-tutorial-dashboard-siswa.mjs
//
// Data dummy sengaja tanpa nomor WA (supaya bot tak mengirim apa pun) → dashboard menahan di
// layar "lengkapi nomor WhatsApp". Nomor diisi HANYA di respons yang diterima browser ini;
// tidak ada yang ditulis ke database.
import { createRequire } from "node:module";
const require = createRequire((process.env.PUPPETEER_FROM || process.env.HOME + "/linguo-ig-post") + "/");
const puppeteer = require("puppeteer-core");
const OUT = process.env.SHOTS_OUT || "/tmp/tutorial-dashboard-siswa"; (await import("node:fs")).mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r=>setTimeout(r,ms));
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--window-size=1366,820","--lang=id-ID"] });
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1.5 });
// Data dummy tak punya nomor WA → gerbang "lengkapi profil". Nomor diisi HANYA di respons
// yang diterima browser ini (tidak menulis ke DB) supaya menu lain bisa dipotret.
await page.setRequestInterception(true);
page.on("request", async (req) => {
  if (!/\/rest\/v1\/students/.test(req.url()) || req.method() !== "GET") return req.continue();
  try {
    const r = await fetch(req.url(), { headers: req.headers() });
    let body = await r.text();
    try { const j = JSON.parse(body); const fix = (o) => { if (o && typeof o === "object" && "whatsapp" in o && !o.whatsapp) o.whatsapp = "6281200000000"; return o; }; body = JSON.stringify(Array.isArray(j) ? j.map(fix) : fix(j)); } catch {}
    const h = Object.fromEntries(r.headers.entries()); delete h["content-encoding"]; delete h["content-length"];
    req.respond({ status: r.status, headers: h, body });
  } catch { req.continue(); }
});
await page.goto("https://linguo.id/akun", { waitUntil: "networkidle2", timeout: 60000 }); await sleep(2000);
await page.type('input[type=email]', process.env.DEMO_EMAIL);
await page.type('input[type=password]', process.env.DEMO_PASSWORD);
await page.evaluate(() => [...document.querySelectorAll("button")].find(b => (b.innerText||"").trim()==="Masuk")?.click());
await sleep(8000);
console.log("after login", page.url());
const dismiss = async () => { for (let i=0;i<5;i++) { const hit = await page.evaluate(() => {
  const els=[...document.querySelectorAll("button, a, [role=button]")].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height;});
  const t = els.find(e=>/^(Nanti saja|Tutup|Lewati|Oke|Mengerti|Nanti)$/i.test((e.innerText||"").trim()));
  if (t) { t.click(); return true; } return false; }); if (!hit) break; await sleep(900); } };
const clickText = (re) => page.evaluate((re) => { const r=new RegExp(re); const e=[...document.querySelectorAll("button, a, [role=button], [role=tab]")].find(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&r.test((e.innerText||"").trim());}); if (e) { e.click(); return true; } return false; }, re);
const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82 }); console.log(name, page.url()); };
for (const m of ["beranda","jadwal","materi","pustaka","sertifikat","catatan","menulis","simulasi","grup","akun"]) {
  await page.goto(`https://linguo.id/akun?menu=${m}`, { waitUntil: "networkidle2", timeout: 60000 }).catch(e=>console.log("goto",m,e.message));
  await sleep(4000); await dismiss(); await sleep(1200);
  await shot(m);
  if (m === "materi") { await clickText("^Materi$"); await sleep(2500); await shot("materi-tab"); await clickText("^Rapor$"); await sleep(2500); await shot("rapor-tab"); }
}
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto("https://linguo.id/akun", { waitUntil: "networkidle2" }); await sleep(4000); await dismiss(); await sleep(1000);
await shot("beranda-hp");
await browser.close();
