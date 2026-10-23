// [isyarat-3d-v1] Kemas hasil Blender untuk web.
//   node kemas.mjs <dir hasil tanda.py> <dir keluaran>
// - Animasi glTF dari Blender (134 klip × 144 kanal → JSON 2,7 MB) dipindah ke
//   isyarat-gerak.json: hanya kanal rotasi tulang lengan/kepala (klip isyarat)
//   atau alis/mata/mulut (klip WAJAH_*), kuaternion int16 base64, kanal diam = 1 nilai.
// - GLB tinggal mesh + rig, dikuantisasi (KHR_mesh_quantization, tanpa dekoder).
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, quantize, dedup } from "@gltf-transform/functions";
import fs from "node:fs";

const [IN, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const FPS = 30;
const SISI = ["R", "L"];
const JARI = ["thumb", "index", "middle", "ring", "pinky"];
const TULANG = [
  ...SISI.flatMap((s) => ["upperarm", "forearm", "hand", ...JARI.flatMap((f) => [1, 2, 3].map((i) => `${f}${i}`))].map((b) => `${b}_${s}`)),
  "neck", "head",
];
const WAJAH = ["brow_R", "brow_L", "eye_R", "eye_L", "mouth"];

function sampel(t, v, k, n, dur) {
  // ulang-sampel ke grid seragam 30 fps (ekspor bisa membuang kunci kembar)
  const out = new Float32Array(n * k);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const tau = Math.min(dur, i / FPS);
    while (j < t.length - 2 && t[j + 1] < tau) j++;
    const t0 = t[j], t1 = t[Math.min(j + 1, t.length - 1)];
    const u = t1 > t0 ? Math.max(0, Math.min(1, (tau - t0) / (t1 - t0))) : 0;
    let dot = 0;
    for (let c = 0; c < k; c++) dot += v[j * k + c] * v[Math.min(j + 1, t.length - 1) * k + c];
    const sg = k === 4 && dot < 0 ? -1 : 1;
    for (let c = 0; c < k; c++) out[i * k + c] = v[j * k + c] * (1 - u) + sg * v[Math.min(j + 1, t.length - 1) * k + c] * u;
    if (k === 4) {
      const L = Math.hypot(out[i * 4], out[i * 4 + 1], out[i * 4 + 2], out[i * 4 + 3]) || 1;
      for (let c = 0; c < 4; c++) out[i * 4 + c] /= L;
    }
  }
  // kontinuitas belahan kuaternion
  if (k === 4) for (let i = 1; i < n; i++) {
    let d = 0; for (let c = 0; c < 4; c++) d += out[i * 4 + c] * out[(i - 1) * 4 + c];
    if (d < 0) for (let c = 0; c < 4; c++) out[i * 4 + c] *= -1;
  }
  return out;
}

const b64 = (arr) => Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString("base64");

const doc = await io.read(`${IN}/isyarat-pria.glb`);
const klip = {};
for (const anim of doc.getRoot().listAnimations()) {
  const nama = anim.getName();
  const wajah = nama.startsWith("WAJAH_");
  let dur = 0;
  for (const ch of anim.listChannels()) dur = Math.max(dur, ...ch.getSampler().getInput().getArray().slice(-1));
  const n = Math.max(2, Math.round(dur * FPS) + 1);
  const c = {}, v = {};
  for (const ch of anim.listChannels()) {
    const bn = ch.getTargetNode().getName();
    const path = ch.getTargetPath();
    if (wajah ? !WAJAH.includes(bn) : !(TULANG.includes(bn) && path === "rotation")) continue;
    const s = ch.getSampler();
    const t = s.getInput().getArray(), val = s.getOutput().getArray();
    const k = path === "rotation" ? 4 : 3;
    const key = wajah ? `${bn}.${path}` : String(TULANG.indexOf(bn));
    let tetap = true;
    for (let i = 1; i < t.length && tetap; i++) for (let cc = 0; cc < k; cc++) if (Math.abs(val[i * k + cc] - val[cc]) > 2e-4) { tetap = false; break; }
    if (tetap) { c[key] = Array.from(val.slice(0, k), (x) => +x.toFixed(5)); continue; }
    const arr = sampel(t, val, k, n, dur);
    if (k === 4) v[key] = b64(Int16Array.from(arr, (x) => Math.round(x * 32767)));
    else v[key] = Array.from(arr, (x) => +x.toFixed(5));
  }
  klip[nama] = { d: +dur.toFixed(3), n, c, v };
}
for (const a of doc.getRoot().listAnimations()) {
  for (const s of a.listSamplers()) { s.getInput()?.dispose(); s.getOutput()?.dispose(); s.dispose(); }
  for (const c of a.listChannels()) c.dispose();
  a.dispose();
}
await doc.transform(prune(), dedup(), quantize());
await io.write(`${OUT}/isyarat-pria.glb`, doc);

const docW = await io.read(`${IN}/isyarat-wanita.glb`);
await docW.transform(prune(), dedup(), quantize());
await io.write(`${OUT}/isyarat-wanita.glb`, docW);

const kamus = JSON.parse(fs.readFileSync(`${IN}/kamus.json`, "utf8"));
const out = { v: 1, fps: FPS, tulang: TULANG, isyarat: kamus.isyarat, wajah: kamus.wajah, klip };
fs.writeFileSync(`${OUT}/isyarat-gerak.json`, JSON.stringify(out));
for (const f of ["isyarat-pria.glb", "isyarat-wanita.glb", "isyarat-gerak.json"]) console.log(f, fs.statSync(`${OUT}/${f}`).size);
