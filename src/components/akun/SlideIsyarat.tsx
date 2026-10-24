'use client';

// [isyarat-3d-v1] Slide Bahasa Isyarat 3D: avatar ber-rig (dibuat & dianimasikan
// di Blender — lihat ~/linguo-isyarat-work) memperagakan isyarat per kata
// (mode kamus), mengeja jari, atau dua tokoh bercakap per baris (mode dialog).
//
// ⚠️ Kembarannya ada di linguo-admin-dashboard/src/components/materi/SlideIsyarat.tsx —
// salin apa adanya (beda hanya jalur impor materiSlides & 'use client').
//
// Aset di /public/models/isyarat/<bahasa>/ KEDUA repo:
//   isyarat-pria.glb / isyarat-wanita.glb — mesh + rig Blender (kerangka identik)
//   isyarat-pria.vrm / isyarat-wanita.vrm — avatar VRoid (VRM 1.0, jari 3 ruas),
//                        dipakai kalau visual `avatar: "vrm"`
//   isyarat-gerak.json — semua klip (kuaternion int16 per tulang rig Blender),
//                        kamus, dan `rangka` (kerangka rig Blender saat diam)
// Rig Blender: klip diikat langsung lewat nama tulang di kedua tokoh.
// [isyarat-vrm-v1] VRM: klip tetap dipanggang di rig Blender, lalu diputar di
// "rangka bayangan" (Object3D tak terlihat, dibangun dari `rangka`), lalu tiap
// bingkai rotasi dunia tiap tulang dipindah ke tulang humanoid VRM (retarget):
//   Dt = (Ws · Ws_diam⁻¹) · Fs_diam · Ft_diam⁻¹ — lihat class Retarget. Beda pose
//   diam (A-pose Blender vs T-pose VRoid) dikoreksi per tulang lewat bingkai
//   arah-tulang + normal telapak (F).
// Ekspresi wajah VRM memakai expression VRM (rig Blender: klip WAJAH_*).
//
// three.js dimuat dinamis saat slide ini tampil — slide lain tak ikut berat.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Repeat, Turtle, Rotate3d, SkipForward, Eye, EyeOff, Hand, Type } from "lucide-react";
import type { SlideVisual as Visual } from "@/lib/materiSlides";

type VisualIsyarat = Extract<Visual, { kind: "isyarat" }>;

type KlipData = { d: number; n: number; c: Record<string, number[]>; v: Record<string, string | number[]> };
type MetaIsyarat = { kode: string; arti: string; kat: string; cara: string; gloss: string; dur: number; wajah?: string | null; eja?: boolean };
/** [nama, indeks induk (-1 = akar), tx, ty, tz, qx, qy, qz, qw] — urut induk dulu */
type TulangRangka = [string, number, number, number, number, number, number, number, number];
type Gerak = { v: 1; fps: number; tulang: string[]; isyarat: MetaIsyarat[]; wajah: string[]; klip: Record<string, KlipData>; rangka: TulangRangka[] };

const TEAL = "#0E7C7B";
const NAMA_AWAL: [string, string] = ["Rio", "Mia"];

const gerakCache = new Map<string, Promise<Gerak>>();
function muatGerak(base: string): Promise<Gerak> {
  let p = gerakCache.get(base);
  if (!p) {
    p = fetch(`${base}isyarat-gerak.json`).then((r) => {
      if (!r.ok) throw new Error(`gerak ${r.status}`);
      return r.json();
    });
    p.catch(() => gerakCache.delete(base));
    gerakCache.set(base, p);
  }
  return p;
}

/** "#RIO" / "ASL" (dieja) → kode klip huruf. */
function uraikan(token: string, meta: Map<string, MetaIsyarat>): string[] {
  if (token.startsWith("#")) return token.slice(1).toUpperCase().replace(/[^A-Z]/g, "").split("").map((h) => `HURUF_${h}`);
  const m = meta.get(token);
  if (m?.eja) return token.replace(/[^A-Z]/g, "").split("").map((h) => `HURUF_${h}`);
  return [token];
}

function b64Int16(s: string): Float32Array {
  const bin = atob(s);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const i16 = new Int16Array(u8.buffer);
  const out = new Float32Array(i16.length);
  for (let i = 0; i < i16.length; i++) out[i] = i16[i] / 32767;
  return out;
}

type Three = typeof import("three");

function bangunKlip(THREE: Three, g: Gerak, nama: string) {
  const k = g.klip[nama];
  const tracks: import("three").KeyframeTrack[] = [];
  const dur = Math.max(k.d, 0.05);
  const times = new Float32Array(k.n);
  for (let i = 0; i < k.n; i++) times[i] = Math.min(dur, i / g.fps);
  const tetap = [0, dur];
  const jalur: Record<string, string> = { rotation: "quaternion", translation: "position", scale: "scale" };
  const tambah = (bone: string, path: string, val: number[] | Float32Array, konstan: boolean) => {
    const name = `${bone}.${path}`;
    const t = konstan ? tetap : times;
    const v = konstan ? [...val, ...val] : val;
    tracks.push(path === "quaternion" ? new THREE.QuaternionKeyframeTrack(name, t, v as number[]) : new THREE.VectorKeyframeTrack(name, t, v as number[]));
  };
  if (nama.startsWith("WAJAH_")) {
    for (const [key, val] of Object.entries(k.c)) { const [b, p] = key.split("."); tambah(b, jalur[p], val, true); }
    for (const [key, val] of Object.entries(k.v)) { const [b, p] = key.split("."); tambah(b, jalur[p], val as number[], false); }
  } else {
    g.tulang.forEach((bone, i) => {
      const c = k.c[String(i)];
      const v = k.v[String(i)];
      if (c) tambah(bone, "quaternion", c, true);
      else if (typeof v === "string") tambah(bone, "quaternion", b64Int16(v), false);
    });
  }
  return new THREE.AnimationClip(nama, dur, tracks);
}

/* ── Retarget rig Blender → humanoid VRM ─────────────────────────────────── */

type VRM = import("@pixiv/three-vrm").VRM;
type NamaTulangVRM = import("@pixiv/three-vrm").VRMHumanBoneName;

// [tulang rig Blender, tulang humanoid VRM]
const PETA: [string, NamaTulangVRM][] = [["neck", "neck"], ["head", "head"]];
for (const [s, h] of [["R", "right"], ["L", "left"]] as const) {
  PETA.push([`upperarm_${s}`, `${h}UpperArm`], [`forearm_${s}`, `${h}LowerArm`], [`hand_${s}`, `${h}Hand`],
    [`thumb1_${s}`, `${h}ThumbMetacarpal`], [`thumb2_${s}`, `${h}ThumbProximal`], [`thumb3_${s}`, `${h}ThumbDistal`]);
  for (const [f, F] of [["index", "Index"], ["middle", "Middle"], ["ring", "Ring"], ["pinky", "Little"]] as const) {
    PETA.push([`${f}1_${s}`, `${h}${F}Proximal`], [`${f}2_${s}`, `${h}${F}Intermediate`], [`${f}3_${s}`, `${h}${F}Distal`]);
  }
}
/** Tulang berikut di rantai (untuk arah tulang); tanpa anak = arah dari induknya. */
function anakDari(b: string): string | null {
  const m = b.match(/^(upperarm|forearm|hand|thumb|index|middle|ring|pinky)(\d?)_([RL])$/);
  if (b === "neck") return "head";
  if (!m) return null;
  const [, j, n, s] = m;
  if (j === "upperarm") return `forearm_${s}`;
  if (j === "forearm") return `hand_${s}`;
  if (j === "hand") return `middle1_${s}`;
  return n === "3" ? null : `${j}${+n + 1}_${s}`;
}
function indukDari(b: string): string | null {
  const m = b.match(/^(forearm|hand|thumb|index|middle|ring|pinky)(\d?)_([RL])$/);
  if (b === "head") return "neck";
  if (!m) return null;
  const [, j, n, s] = m;
  if (j === "forearm") return `upperarm_${s}`;
  if (j === "hand") return `forearm_${s}`;
  return n === "1" ? `hand_${s}` : `${j}${+n - 1}_${s}`;
}

/** Rangka bayangan rig Blender (tak dirender) — target AnimationMixer. */
function bangunRangka(THREE: Three, g: Gerak) {
  const akar = new THREE.Object3D();
  const tulang = new Map<string, import("three").Object3D>();
  const urut: import("three").Object3D[] = [];
  for (const [nama, induk, tx, ty, tz, qx, qy, qz, qw] of g.rangka) {
    const o = new THREE.Object3D();
    o.name = nama;
    o.position.set(tx, ty, tz);
    o.quaternion.set(qx, qy, qz, qw);
    (induk >= 0 ? urut[induk] : akar).add(o);
    urut.push(o);
    tulang.set(nama, o);
  }
  akar.updateMatrixWorld(true);
  return { akar, tulang };
}

class Retarget {
  private item: { src: import("three").Object3D; restInv: import("three").Quaternion; A: import("three").Quaternion; node: import("three").Object3D; induk: number }[] = [];
  private Dt: import("three").Quaternion[] = [];
  private q: import("three").Quaternion;
  private qi: import("three").Quaternion;
  constructor(THREE: Three, rangka: ReturnType<typeof bangunRangka>, vrm: VRM) {
    this.q = new THREE.Quaternion(); this.qi = new THREE.Quaternion();
    const hum = vrm.humanoid;
    vrm.scene.updateMatrixWorld(true);
    const posS = (b: string) => rangka.tulang.get(b)!.getWorldPosition(new THREE.Vector3());
    const posT = (b: string) => hum.getNormalizedBoneNode(PETA.find((p) => p[0] === b)![1])!.getWorldPosition(new THREE.Vector3());
    const arah = (pos: (b: string) => import("three").Vector3, b: string) => {
      const a = anakDari(b);
      if (a) return pos(a).sub(pos(b)).normalize();
      const i = indukDari(b);
      return i ? pos(b).sub(pos(i)).normalize() : new THREE.Vector3(0, 1, 0);
    };
    // Normal telapak (urutan silang sama di kedua rig → arah anatomis sama)
    const telapak = (pos: (b: string) => import("three").Vector3, s: string) => {
      const h = pos(`hand_${s}`);
      return pos(`index1_${s}`).sub(h).cross(pos(`pinky1_${s}`).sub(h)).normalize();
    };
    const bingkai = (p: import("three").Vector3, sek: import("three").Vector3) => {
      const s2 = sek.clone().addScaledVector(p, -sek.dot(p)).normalize();
      const t = new THREE.Vector3().crossVectors(p, s2);
      return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(p, s2, t));
    };
    const depan = new THREE.Vector3(0, 0, 1);
    PETA.forEach(([b, h]) => {
      const node = hum.getNormalizedBoneNode(h);
      const src = rangka.tulang.get(b);
      if (!node || !src) return;
      const sisi = b.match(/_([RL])$/)?.[1];
      const Fs = bingkai(arah(posS, b), sisi ? telapak(posS, sisi) : depan);
      const Ft = bingkai(arah(posT, b), sisi ? telapak(posT, sisi) : depan);
      const ib = indukDari(b);
      this.item.push({
        src, node,
        restInv: src.getWorldQuaternion(new THREE.Quaternion()).invert(),
        A: Fs.multiply(Ft.invert()),
        induk: ib ? this.item.findIndex((x) => x.src.name === ib) : -1,
      });
      this.Dt.push(new THREE.Quaternion());
    });
  }
  /** Rangka bayangan (sudah dianimasikan) → rotasi lokal tulang ternormalisasi VRM. */
  terapkan(akar: import("three").Object3D) {
    akar.updateMatrixWorld(true);
    this.item.forEach((it, i) => {
      // Dt = (rotasi dunia sekarang · rotasi dunia diam⁻¹) · A
      this.Dt[i].copy(it.src.getWorldQuaternion(this.q)).multiply(it.restInv).multiply(it.A);
    });
    this.item.forEach((it, i) => {
      if (it.induk < 0) it.node.quaternion.copy(this.Dt[i]);
      else it.node.quaternion.copy(this.qi.copy(this.Dt[it.induk]).invert().multiply(this.Dt[i]));
    });
  }
}

/* ── Wajah: expression VRM ───────────────────────────────────────────────── */

const WAJAH_VRM: Record<string, Partial<Record<string, number>>> = {
  netral: {},
  senang: { relaxed: 0.55, happy: 0.15 },
  ya_tidak: { surprised: 0.45 },   // alis naik: pertanyaan ya/tidak
  wh: { angry: 0.35 },             // alis turun: pertanyaan apa/siapa/di mana
  sedih: { sad: 0.7 },
  tidur: { blink: 1 },
};
const EKSPRESI = ["happy", "relaxed", "surprised", "angry", "sad", "blink"];

/* ── Pemain satu tokoh: lapis badan (antrean klip) + lapis wajah ─────────── */

type Item = { klip: string; skala: number; onMulai?: () => void };

class Pemain {
  mixer: import("three").AnimationMixer;
  klip: (n: string) => import("three").AnimationClip | null;
  badan: import("three").AnimationAction | null = null;
  wajah: import("three").AnimationAction | null = null;
  antre: Item[] = [];
  sekarang: Item | null = null;
  tahan = 0;
  selesai: (() => void) | null = null;
  // Mode VRM saja (null = rig Blender, klip langsung di model)
  private vrm: VRM | null = null;
  private rangka: ReturnType<typeof bangunRangka> | null = null;
  private retarget: Retarget | null = null;
  private wajahTuju: Partial<Record<string, number>> = {};
  private wajahNow: Record<string, number> = {};
  private wajahLaju = 4;
  private kedip = 2.5;
  constructor(THREE: Three, tokoh: VRM | import("three").Object3D, g: Gerak, klip: (n: string) => import("three").AnimationClip | null) {
    if ("humanoid" in tokoh) {
      this.vrm = tokoh;
      this.rangka = bangunRangka(THREE, g);
      this.retarget = new Retarget(THREE, this.rangka, tokoh);
    }
    this.mixer = new THREE.AnimationMixer(this.rangka ? this.rangka.akar : tokoh as import("three").Object3D);
    this.klip = klip;
    EKSPRESI.forEach((e) => { this.wajahNow[e] = 0; });
    this.keDiam(0);
    this.setWajah("netral", 0);
  }
  private aksi(nama: string) {
    const c = this.klip(nama);
    return c ? this.mixer.clipAction(c) : null;
  }
  private ganti(next: import("three").AnimationAction, fade: number) {
    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.play();
    if (this.badan && this.badan !== next) this.badan.crossFadeTo(next, fade, false);
    else if (fade > 0) next.fadeIn(fade);
    this.badan = next;
  }
  keDiam(fade = 0.35) {
    const a = this.aksi("IDLE");
    if (!a) return;
    a.setLoop(2201 /* LoopRepeat */, Infinity);
    a.timeScale = 1;
    this.ganti(a, fade);
  }
  setWajah(nama: string, fade = 0.25) {
    if (this.vrm) {
      this.wajahTuju = WAJAH_VRM[nama] || {};
      this.wajahLaju = 1 / Math.max(0.05, fade);
      return;
    }
    const a = this.aksi(`WAJAH_${nama.toUpperCase()}`) || this.aksi("WAJAH_NETRAL");
    if (!a || a === this.wajah) return;
    a.reset(); a.setLoop(2201, Infinity); a.play();
    if (this.wajah) this.wajah.crossFadeTo(a, fade, false); else a.fadeIn(fade);
    this.wajah = a;
  }
  /** Putar urutan klip; resolve saat selesai (atau dibatalkan putaran baru). */
  mainkan(items: Item[]): Promise<void> {
    this.selesai?.();
    this.antre = items.filter((it) => this.klip(it.klip));
    this.sekarang = null;
    this.tahan = 0;
    return new Promise((ok) => {
      this.selesai = ok;
      if (!this.antre.length) { this.selesai = null; ok(); return; }
      this.mulaiBerikut(0.22);
    });
  }
  hentikan() {
    this.antre = [];
    this.sekarang = null;
    const s = this.selesai; this.selesai = null; s?.();
    this.keDiam(0.3);
  }
  private mulaiBerikut(fade: number) {
    const it = this.antre.shift();
    if (!it) return;
    const a = this.aksi(it.klip)!;
    a.setLoop(2200 /* LoopOnce */, 1);
    a.clampWhenFinished = true;
    a.timeScale = it.skala;
    this.ganti(a, fade);
    this.sekarang = it;
    it.onMulai?.();
  }
  private updateWajah(dt: number) {
    const em = this.vrm?.expressionManager;
    if (!em) return;
    // Kedip otomatis (kecuali ekspresi sudah memejam)
    this.kedip -= dt;
    let blinkAuto = 0;
    if (this.kedip < 0.14) blinkAuto = Math.sin(Math.max(0, this.kedip) / 0.14 * Math.PI);
    if (this.kedip <= 0) this.kedip = 2.4 + Math.random() * 2.2;
    const k = Math.min(1, dt * this.wajahLaju);
    for (const e of EKSPRESI) {
      this.wajahNow[e] += ((this.wajahTuju[e] || 0) - this.wajahNow[e]) * k;
      em.setValue(e, e === "blink" ? Math.max(this.wajahNow[e], blinkAuto * (1 - this.wajahNow.happy)) : this.wajahNow[e]);
    }
  }
  update(dt: number) {
    this.mixer.update(dt);
    if (this.vrm && this.retarget && this.rangka) {
      this.retarget.terapkan(this.rangka.akar);
      this.updateWajah(dt);
      this.vrm.update(dt);
    }
    const it = this.sekarang;
    const a = this.badan;
    if (!it || !a) return;
    const sisa = (a.getClip().duration - a.time) / Math.max(0.05, it.skala);
    const fade = it.klip.startsWith("HURUF_") ? 0.12 : 0.18;
    if (this.antre.length) {
      if (sisa <= fade) this.mulaiBerikut(fade);
      return;
    }
    if (sisa <= 0.001) {
      this.tahan += dt;
      if (this.tahan > 0.35) {
        this.sekarang = null;
        this.keDiam(0.4);
        const s = this.selesai; this.selesai = null; s?.();
      }
    }
  }
}

/* ── Panggung three.js ───────────────────────────────────────────────────── */

type Panggung = {
  pemain: Pemain[];
  setSudut: (az: number) => void;
  dispose: () => void;
};

// Tinggi leher rig Blender lama — acuan bingkai kamera (target & jarak diskalakan)
const LEHER_ACUAN = 1.43;

async function bangunPanggung(
  kanvas: HTMLCanvasElement, wadah: HTMLElement, base: string, dialog: boolean, tokoh: "A" | "B", pakaiVrm: boolean,
  onSiap: (g: Gerak) => void, onGagal: (e: unknown) => void,
): Promise<Panggung | null> {
  const [THREE, { GLTFLoader }, threeVrm, gerak] = await Promise.all([
    import("three"),
    import("three/examples/jsm/loaders/GLTFLoader.js"),
    pakaiVrm ? import("@pixiv/three-vrm") : null,
    muatGerak(base),
  ]);
  let renderer: import("three").WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: kanvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch (e) { onGagal(e); return null; }
  // [isyarat-jia-v1] Minimal 2× (supersampling) supaya jari & wajah tetap tajam di layar 1×
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 2), 3));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  if (pakaiVrm) {
    // MToon, tanpa tone mapping. [isyarat-jia-v1] Cahaya diredam (dulu kulit & wajah
    // nyaris putih) + kunci dari samping supaya bayangan jari/wajah terbaca.
    scene.add(new THREE.HemisphereLight(0xffffff, 0xa89c90, 0.55));
    const kunci = new THREE.DirectionalLight(0xffffff, 1.15); kunci.position.set(-2, 2.2, 2.4); scene.add(kunci);
    const isi = new THREE.DirectionalLight(0xfff4ea, 0.3); isi.position.set(2, 1.2, 2); scene.add(isi);
  } else {
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8aa9c, 1.5));
    const kunci = new THREE.DirectionalLight(0xffffff, 2.1); kunci.position.set(-1.6, 3, 3); scene.add(kunci);
    const isi = new THREE.DirectionalLight(0xfff4ea, 0.7); isi.position.set(2, 1.5, 2); scene.add(isi);
    const tepi = new THREE.DirectionalLight(0xdff7f6, 1.0); tepi.position.set(0, 2.5, -2.5); scene.add(tepi);
  }

  const loader = new GLTFLoader();
  if (threeVrm) loader.register((p) => new threeVrm.VRMLoaderPlugin(p));
  const muat = async (f: string): Promise<{ root: import("three").Object3D; vrm: VRM | null }> => {
    const g = await loader.loadAsync(`${base}${f}`);
    const vrm = threeVrm ? (g.userData.vrm as VRM) : null;
    if (vrm && threeVrm) {
      threeVrm.VRMUtils.removeUnnecessaryVertices(vrm.scene);
      threeVrm.VRMUtils.combineSkeletons(vrm.scene);
    }
    const root = vrm ? vrm.scene : g.scene;
    root.traverse((o) => { o.frustumCulled = false; });
    return { root, vrm };
  };
  const ext = pakaiVrm ? "vrm" : "glb";
  const daftar = dialog ? [`isyarat-pria.${ext}`, `isyarat-wanita.${ext}`] : [`isyarat-${tokoh === "B" ? "wanita" : "pria"}.${ext}`];
  let tokohs: Awaited<ReturnType<typeof muat>>[];
  try { tokohs = await Promise.all(daftar.map(muat)); } catch (e) { renderer.dispose(); onGagal(e); return null; }

  const klipCache = new Map<string, import("three").AnimationClip | null>();
  const klip = (n: string) => {
    if (!klipCache.has(n)) klipCache.set(n, gerak.klip[n] ? bangunKlip(THREE, gerak, n) : null);
    return klipCache.get(n)!;
  };

  // Bingkai kamera mengikuti tinggi avatar (VRoid lebih pendek dari rig Blender)
  const leher = tokohs.map(({ vrm }) => vrm ? vrm.humanoid.getNormalizedBoneNode("neck")!.getWorldPosition(new THREE.Vector3()).y : LEHER_ACUAN);
  const k = leher.reduce((a, b) => a + b, 0) / leher.length / LEHER_ACUAN;
  const pemain = tokohs.map(({ root, vrm }, i) => {
    const p = new Pemain(THREE, vrm || root, gerak, klip);
    if (dialog) {
      root.position.x = (i === 0 ? -0.42 : 0.42) * k;
      root.rotation.y = i === 0 ? 0.55 : -0.55;
    }
    scene.add(root);
    return p;
  });

  const camera = new THREE.PerspectiveCamera(dialog ? 30 : 27, 1, 0.1, 20);
  // VRoid berkepala besar & berbadan ramping: dialog boleh lebih dekat
  const target = new THREE.Vector3(0, (dialog ? (pakaiVrm ? 1.24 : 1.27) : 1.31) * k, 0);
  const jarak = (dialog ? (pakaiVrm ? 2.45 : 3.05) : 2.15) * k;
  let az = 0;
  const pasangKamera = () => {
    camera.position.set(target.x + Math.sin(az) * jarak, target.y + 0.06 * k, target.z + Math.cos(az) * jarak);
    camera.lookAt(target);
  };
  pasangKamera();

  const ukur = () => {
    const w = wadah.clientWidth || 1, h = wadah.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Kanvas sempit: mundurkan kamera supaya dua tokoh tetap muat
    camera.fov = (dialog ? 30 : 27) * Math.max(1, (dialog ? 1.25 : 0.8) / camera.aspect);
    camera.updateProjectionMatrix();
  };
  ukur();
  const ro = new ResizeObserver(ukur); ro.observe(wadah);

  let tampak = true;
  const io = new IntersectionObserver((e) => { tampak = e[0]?.isIntersecting ?? true; });
  io.observe(wadah);
  const jam = new THREE.Clock();
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(jam.getDelta(), 0.1);
    if (!tampak || document.hidden) return;
    pemain.forEach((p) => p.update(dt));
    renderer.render(scene, camera);
  };
  loop();
  onSiap(gerak);

  return {
    pemain,
    setSudut: (a) => { az = a; pasangKamera(); },
    dispose: () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      pemain.forEach((p) => p.mixer.stopAllAction());
      if (threeVrm) tokohs.forEach(({ root }) => threeVrm.VRMUtils.deepDispose(root));
      else scene.traverse((o) => {
        const m = o as import("three").Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as import("three").Material | import("three").Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* diam */ }
    },
  };
}

/* ── Komponen ────────────────────────────────────────────────────────────── */

const tombol = (aktif: boolean, aksen: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: "0.35em", borderRadius: 999, padding: "0.3em 0.75em",
  fontSize: "0.82em", fontWeight: 700, border: `1px solid ${aktif ? aksen : "#d1d5db"}`,
  background: aktif ? aksen : "#fff", color: aktif ? "#fff" : "#374151", cursor: "pointer", whiteSpace: "nowrap",
});

export default function SlideIsyarat({ v, aksen = TEAL }: { v: VisualIsyarat; aksen?: string }) {
  const dialog = !!v.baris?.length;
  const pakaiVrm = v.avatar === "vrm";
  const base = `/models/isyarat/${v.bahasa || "asl"}/`;
  const kanvas = useRef<HTMLCanvasElement>(null);
  const wadah = useRef<HTMLDivElement>(null);
  const panggung = useRef<Panggung | null>(null);
  const [status, setStatus] = useState<"muat" | "siap" | "gagal">("muat");
  const [gerak, setGerak] = useState<Gerak | null>(null);
  const [aktif, setAktif] = useState<number>(-1);
  const [token, setToken] = useState<number>(-1);
  const [main, setMain] = useState(false);
  const [pelan, setPelan] = useState(false);
  const [samping, setSamping] = useState(false);
  const [tutupArti, setTutupArti] = useState(false);
  const [teksEja, setTeksEja] = useState("");
  const [ejaAktif, setEjaAktif] = useState<{ teks: string; i: number } | null>(null);
  const urutPutar = useRef(0);
  const az = useRef(0);
  const seret = useRef<{ x: number; az: number } | null>(null);
  const nama = (v.nama && v.nama.length === 2 ? v.nama : NAMA_AWAL) as [string, string];

  useEffect(() => {
    let batal = false;
    const el = kanvas.current, w = wadah.current;
    if (!el || !w) return;
    void bangunPanggung(el, w, base, dialog, v.tokoh === "B" ? "B" : "A", pakaiVrm,
      (g) => { if (!batal) { setGerak(g); setStatus("siap"); } },
      () => { if (!batal) setStatus("gagal"); },
    ).then((p) => {
      if (batal) { p?.dispose(); return; }
      panggung.current = p;
    }).catch(() => { if (!batal) setStatus("gagal"); });
    return () => { batal = true; urutPutar.current++; panggung.current?.dispose(); panggung.current = null; };
  }, [base, dialog, v.tokoh, pakaiVrm]);

  const meta = useMemo(() => new Map((gerak?.isyarat || []).map((m) => [m.kode, m])), [gerak]);
  const skala = pelan ? 0.3 : 1; // [isyarat-jia-v1] dulu 0,5× — masih terlalu cepat untuk ditiru

  const sudut = useCallback((a: number) => { az.current = a; panggung.current?.setSudut(a); }, []);
  useEffect(() => { sudut(samping ? (dialog ? 0.0 : -0.75) : 0); }, [samping, dialog, sudut]);

  /** Putar satu baris/isyarat di tokoh ke-`siapa`; wajah ikut. */
  const putarUrut = useCallback(async (siapa: number, tokens: string[], wajah: string | null | undefined, onToken?: (i: number) => void) => {
    const p = panggung.current?.pemain[siapa];
    if (!p) return;
    const items: Item[] = [];
    tokens.forEach((tk, ti) => {
      const kode = uraikan(tk, meta);
      kode.forEach((k, ki) => items.push({
        klip: k, skala: k.startsWith("HURUF_") ? skala * 1.25 : skala,
        onMulai: ki === 0 ? () => onToken?.(ti) : undefined,
      }));
    });
    const w = wajah || meta.get(tokens[0])?.wajah || "netral";
    p.setWajah(w);
    await p.mainkan(items);
    p.setWajah("netral", 0.4);
  }, [meta, skala]);

  const putarTanda = useCallback(async (i: number) => {
    const t = v.tanda?.[i];
    if (!t) return;
    const id = ++urutPutar.current;
    setAktif(i); setMain(true); setEjaAktif(null);
    await putarUrut(0, [t.kode], meta.get(t.kode)?.wajah);
    if (id === urutPutar.current) setMain(false);
  }, [v.tanda, putarUrut, meta]);

  const putarSemuaTanda = useCallback(async () => {
    const id = ++urutPutar.current;
    setMain(true); setEjaAktif(null);
    for (let i = 0; i < (v.tanda?.length || 0); i++) {
      if (id !== urutPutar.current) return;
      setAktif(i);
      await putarUrut(0, [v.tanda![i].kode], meta.get(v.tanda![i].kode)?.wajah);
      await new Promise((r) => setTimeout(r, 250));
    }
    if (id === urutPutar.current) setMain(false);
  }, [v.tanda, putarUrut, meta]);

  const putarBaris = useCallback(async (i: number) => {
    const b = v.baris?.[i];
    if (!b) return;
    const id = ++urutPutar.current;
    setAktif(i); setMain(true); setToken(-1);
    // Lawan bicara menyimak: kembali diam
    panggung.current?.pemain.forEach((p, k) => { if (k !== (b.siapa === "B" ? 1 : 0)) p.hentikan(); });
    await putarUrut(b.siapa === "B" ? 1 : 0, b.urut, b.wajah, (t) => { if (id === urutPutar.current) setToken(t); });
    if (id === urutPutar.current) { setMain(false); setToken(-1); }
  }, [v.baris, putarUrut]);

  const putarDialog = useCallback(async (mulai = 0) => {
    const id = ++urutPutar.current;
    for (let i = mulai; i < (v.baris?.length || 0); i++) {
      if (id !== urutPutar.current) return;
      const b = v.baris![i];
      setAktif(i); setMain(true); setToken(-1);
      await putarUrut(b.siapa === "B" ? 1 : 0, b.urut, b.wajah, (t) => { if (id === urutPutar.current) setToken(t); });
      if (id !== urutPutar.current) return;
      await new Promise((r) => setTimeout(r, 450));
    }
    setMain(false); setToken(-1);
  }, [v.baris, putarUrut]);

  const hentikan = useCallback(() => {
    urutPutar.current++;
    panggung.current?.pemain.forEach((p) => p.hentikan());
    setMain(false); setToken(-1); setEjaAktif(null);
  }, []);

  // Sorot huruf yang sedang dieja
  const putarEjaHuruf = useCallback(async () => {
    const teks = teksEja.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 14);
    if (!teks) return;
    const id = ++urutPutar.current;
    setAktif(-1); setMain(true); setEjaAktif({ teks, i: 0 });
    const p = panggung.current?.pemain[0];
    if (!p) return;
    p.setWajah("netral");
    await p.mainkan(teks.split("").map((h, i) => ({
      klip: `HURUF_${h}`, skala: skala * 1.1,
      onMulai: () => { if (id === urutPutar.current) setEjaAktif({ teks, i }); },
    })));
    if (id === urutPutar.current) { setMain(false); setEjaAktif(null); }
  }, [teksEja, skala]);

  // Seret kanvas = putar sudut pandang (±70°)
  const onDown = (e: React.PointerEvent) => { seret.current = { x: e.clientX, az: az.current }; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); };
  const onMove = (e: React.PointerEvent) => {
    if (!seret.current || !wadah.current) return;
    const d = (e.clientX - seret.current.x) / wadah.current.clientWidth;
    sudut(Math.max(-1.2, Math.min(1.2, seret.current.az - d * 2.4)));
  };
  const onUp = () => { seret.current = null; };

  const poster = `${base}${pakaiVrm ? "vrm-" : ""}${dialog ? "poster-dialog.png" : v.tokoh === "B" ? "poster-wanita.png" : "poster-pria.png"}`;
  const tAktif = !dialog && aktif >= 0 ? v.tanda?.[aktif] : null;
  const mAktif = tAktif ? meta.get(tAktif.kode) : null;
  const bAktif = dialog && aktif >= 0 ? v.baris?.[aktif] : null;

  return (
    <div style={{ display: "flex", height: "100%", gap: "1.6cqw", minHeight: 0 }}>
      {/* Panggung 3D */}
      <div ref={wadah} style={{
        position: "relative", flex: dialog ? "1.25 1 0" : "1 1 0", minWidth: 0, borderRadius: "1.2cqw", overflow: "hidden",
        background: "radial-gradient(120% 90% at 50% 35%, #EEF6F5 0%, #D3E9E7 55%, #B3D6D3 100%)",
        border: "1px solid #CDEBE9", touchAction: "pan-y", cursor: "grab",
      }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {status !== "siap" && (
          <img src={poster} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: status === "gagal" ? 1 : 0.55, filter: status === "muat" ? "blur(1px)" : undefined }} />
        )}
        <canvas ref={kanvas} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
        {status === "muat" && (
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: "rgba(255,255,255,0.92)", borderRadius: 999, padding: "0.35em 0.9em", fontSize: "0.8em", fontWeight: 700, color: TEAL }}>
            Menyiapkan avatar 3D…
          </div>
        )}
        {status === "gagal" && (
          <div style={{ position: "absolute", left: "4%", right: "4%", bottom: "4%", background: "rgba(255,255,255,0.95)", borderRadius: 12, padding: "0.5em 0.8em", fontSize: "0.78em", color: "#92400e" }}>
            3D tidak bisa dimuat di perangkat ini. Daftar isyarat & caranya tetap bisa dibaca di samping.
          </div>
        )}
        {/* Teks bawah: gloss (token aktif ditebalkan) + arti */}
        {status === "siap" && (bAktif || mAktif || ejaAktif) && (
          <div style={{ position: "absolute", left: "3%", right: "3%", bottom: "3%", background: "rgba(255,255,255,0.94)", borderRadius: "1cqw", padding: "0.45em 0.8em", boxShadow: "0 2px 10px rgba(14,124,123,0.15)" }}>
            {ejaAktif ? (
              <div style={{ fontWeight: 800, letterSpacing: "0.25em", fontSize: "1.15em", color: "#111827" }}>
                {ejaAktif.teks.split("").map((h, i) => <span key={i} style={{ color: i === ejaAktif.i ? aksen : i < ejaAktif.i ? "#111827" : "#9ca3af" }}>{h}</span>)}
              </div>
            ) : bAktif ? (<>
              <div style={{ fontSize: "0.72em", fontWeight: 800, color: bAktif.siapa === "B" ? "#DB2777" : "#B45309", textTransform: "uppercase", letterSpacing: "0.08em" }}>{bAktif.siapa === "B" ? nama[1] : nama[0]}</div>
              <div style={{ fontWeight: 800, color: "#111827" }}>
                {bAktif.urut.map((tk, i) => (
                  <span key={i} style={{ marginRight: "0.4em", color: token === i ? aksen : token > i || token < 0 ? "#111827" : "#9ca3af" }}>
                    {tk.startsWith("#") ? tk.slice(1).split("").join("-") : meta.get(tk)?.gloss || tk}
                  </span>
                ))}
              </div>
              {!tutupArti && <div style={{ fontSize: "0.85em", color: "#4b5563" }}>“{bAktif.arti}”</div>}
            </>) : mAktif && (<>
              <div style={{ fontWeight: 800, color: "#111827" }}>{tAktif?.gloss || mAktif.gloss} <span style={{ fontWeight: 600, color: aksen }}>· {tAktif?.arti || mAktif.arti}</span></div>
              {mAktif.cara && <div style={{ fontSize: "0.8em", color: "#4b5563", marginTop: "0.15em" }}>{mAktif.cara}</div>}
            </>)}
          </div>
        )}
        {status === "siap" && (
          <div style={{ position: "absolute", top: "3%", right: "3%", display: "flex", gap: "0.4em" }}>
            <button type="button" onClick={() => setPelan((x) => !x)} title="Putar pelan (0,3×)" style={tombol(pelan, aksen)}><Turtle size="1.1em" /> Pelan</button>
            <button type="button" onClick={() => setSamping((x) => !x)} title="Ganti sudut pandang (atau seret avatar)" style={tombol(samping, aksen)}><Rotate3d size="1.1em" /> Sudut</button>
          </div>
        )}
      </div>

      {/* Panel kanan */}
      <div style={{ flex: dialog ? "1 1 0" : "1.05 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: "0.6em", minHeight: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4em", alignItems: "center" }}>
          {dialog ? (<>
            <button type="button" disabled={status !== "siap"} onClick={() => (main ? hentikan() : void putarDialog(0))} style={tombol(true, aksen)}>
              {main ? <Pause size="1.1em" /> : <Play size="1.1em" />} {main ? "Berhenti" : "Putar semua"}
            </button>
            <button type="button" disabled={status !== "siap"} onClick={() => void putarBaris(Math.min((v.baris?.length || 1) - 1, aktif + 1))} style={tombol(false, aksen)}>
              <SkipForward size="1.1em" /> Baris berikutnya
            </button>
            <button type="button" onClick={() => setTutupArti((x) => !x)} title="Latihan: tebak arti sebelum dibuka" style={tombol(tutupArti, aksen)}>
              {tutupArti ? <EyeOff size="1.1em" /> : <Eye size="1.1em" />} {tutupArti ? "Arti disembunyikan" : "Tebak arti"}
            </button>
          </>) : (<>
            <button type="button" disabled={status !== "siap" || !v.tanda?.length} onClick={() => (main ? hentikan() : void putarSemuaTanda())} style={tombol(true, aksen)}>
              {main ? <Pause size="1.1em" /> : <Play size="1.1em" />} {main ? "Berhenti" : "Putar semua"}
            </button>
            {aktif >= 0 && <button type="button" disabled={status !== "siap"} onClick={() => void putarTanda(aktif)} style={tombol(false, aksen)}><Repeat size="1.1em" /> Ulangi</button>}
          </>)}
        </div>

        <div style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto", scrollbarWidth: "thin", paddingRight: "0.3em" }}>
          {dialog ? (
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.45em" }}>
              {v.baris!.map((b, i) => {
                const on = i === aktif;
                const kiri = b.siapa !== "B";
                return (
                  <li key={i}>
                    <button type="button" disabled={status !== "siap"} onClick={() => void putarBaris(i)}
                      style={{
                        width: "100%", textAlign: "left", display: "flex", gap: "0.6em", alignItems: "flex-start",
                        borderRadius: "0.8cqw", padding: "0.45em 0.7em", cursor: "pointer",
                        background: on ? "#ECFDF5" : "#fff", border: `1.5px solid ${on ? aksen : "#e5e7eb"}`,
                      }}>
                      <span style={{ flexShrink: 0, borderRadius: 999, padding: "0.1em 0.55em", fontSize: "0.72em", fontWeight: 800, color: "#fff", background: kiri ? "#B45309" : "#DB2777" }}>
                        {kiri ? nama[0] : nama[1]}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontWeight: 800, color: "#111827", fontSize: "0.92em" }}>
                          <Hand size="0.9em" style={{ display: "inline", verticalAlign: "-0.1em", marginRight: "0.3em", color: aksen }} />
                          {b.gloss}
                        </span>
                        <span style={{ display: "block", fontSize: "0.82em", color: "#4b5563", filter: tutupArti && !(on && !main) ? "blur(5px)" : undefined, transition: "filter .2s" }}>{b.arti}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(8.5em, 1fr))", gap: "0.45em" }}>
              {(v.tanda || []).map((t, i) => {
                const m = meta.get(t.kode);
                const on = i === aktif;
                return (
                  <button key={i} type="button" disabled={status !== "siap"} onClick={() => void putarTanda(i)}
                    style={{
                      textAlign: "left", borderRadius: "0.8cqw", padding: "0.4em 0.6em", cursor: "pointer",
                      background: on ? aksen : "#fff", color: on ? "#fff" : "#111827",
                      border: `1.5px solid ${on ? aksen : "#e5e7eb"}`, boxShadow: on ? "0 2px 8px rgba(14,124,123,0.25)" : undefined,
                    }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35em", fontWeight: 800, fontSize: "0.9em" }}>
                      <Play size="0.85em" style={{ flexShrink: 0, opacity: 0.8 }} />{t.gloss || m?.gloss || t.kode}
                    </span>
                    <span style={{ display: "block", fontSize: "0.78em", opacity: 0.85 }}>{t.arti || m?.arti || ""}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!dialog && v.eja && (
          <form onSubmit={(e) => { e.preventDefault(); void putarEjaHuruf(); }} style={{ display: "flex", gap: "0.4em", alignItems: "center" }}>
            <Type size="1.1em" style={{ color: aksen, flexShrink: 0 }} />
            <input value={teksEja} onChange={(e) => setTeksEja(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 14))}
              placeholder="Ketik nama, mis. RIO" aria-label="Kata untuk dieja jari"
              style={{ flex: 1, minWidth: 0, borderRadius: 999, border: "1.5px solid #d1d5db", padding: "0.3em 0.8em", fontSize: "0.9em", color: "#111827", background: "#fff", textTransform: "uppercase" }} />
            <button type="submit" disabled={status !== "siap" || !teksEja} style={tombol(true, aksen)}><Hand size="1.1em" /> Eja</button>
          </form>
        )}
      </div>
    </div>
  );
}
