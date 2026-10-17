"use client";
// [hero-3d-v3] Karakter hero 3D: kepala menoleh mengikuti cursor, jari mengetik.
// GLB dari Tripo diberi rig lewat script Blender headless: root + head (bobot dari
// tinggi — di atas leher cuma ada kepala/headphone, jadi kabel ikut melengkung)
// + 2 tangan × 4 jari (bobot dari posisi, bukan sambungan mesh: vertex kembar di
// jahitan UV harus dapat bobot identik, kalau tidak mesh retak). Klip "mengetik"
// 3 detik dipanggang di Blender; kepala tetap dikendalikan kode di atasnya.
// Dikompres ke ~1,8 MB (tekstur WebP + mesh terkuantisasi, tanpa decoder).
// PNG lama tetap jadi lapisan awal & LCP — three.js baru diunduh saat browser
// idle, hanya di desktop, dilewati kalau hemat data. Render berhenti saat hero tak terlihat.
// [hero-3d-tanpa-jeda-v1] Lapisan awal desktop = hero-character-3d.png, yaitu frame
// pertama model ini sendiri (kamera, pose t=0, TANPA bayangan, 1620×1620) — dulu PNG lama
// beda sudut, jadi PNG harus pudar dulu baru 3D muncul (ada celah kosong ±0,7 dtk).
// Sekarang kanvas memudar MASUK di atas gambar yang identik, gambar baru disembunyikan
// sesudahnya. Kalau model/kamera/pencahayaan diubah, render ulang gambarnya.
// [hero-bayangan-css-v1] Bayangan BUKAN bagian gambar maupun scene 3D: satu <div>
// gradien radial yang sama sejak HTML pertama, digerakkan loop render (skala &
// opasitas ikut melayang). Dulu bayangan ada di gambar (terkompres AVIF, diam) lalu
// diganti bayangan WebGL yang bernapas & terpotong tepi kanvas — kelihatan "ganti".
// Posisi/ukuran = proyeksi bidang bayangan lama lewat kamera ini (hitung ulang kalau
// kamera/model berubah).
// [hero-3d-cadangan-v1] Kalau WebGL gagal (Chrome dgn akselerasi hardware mati / GPU
// diblokir, model gagal dimuat) dulu karakter diam total tanpa pesan. Sekarang konteks
// dicoba ulang dgn opsi lebih longgar, dan bila tetap gagal gambar awal sendiri yang
// melayang (CSS) & miring mengikuti cursor — tetap hidup walau tanpa 3D.
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

const MODEL_SRC = "/models/hero-character.glb";
// Sudut kamera disamakan dengan PNG lama supaya pergantiannya tidak melompat.
const ORBIT_THETA = -35, ORBIT_PHI = 80, FOV = 30;
const YAW_MAX = 26, PITCH_MAX = 12, BODY_YAW_MAX = 6; // derajat
const DIAM_SETELAH_MS = 2500;
const MELAYANG = 0.014;                                   // amplitudo naik-turun (satuan model; tinggi karakter ≈ 1)
const BAYANGAN_OPASITAS = 0.32;
// Elips bayangan dalam % kotak (skala 1 = karakter di titik terendah).
const BAYANGAN = { x: 50, y: 92.92, w: 45.8, h: 18.39 };
const skalaBayangan = (k01: number) => 1 - 0.14 * k01;   // k01: 0 = terendah, 1 = tertinggi
const opasitasBayangan = (k01: number) => 1 - 0.35 * k01;

const rad = (d: number) => (d * Math.PI) / 180;

export default function HeroModel3D({ alt }: { alt: string }) {
  const wadahRef = useRef<HTMLDivElement>(null);
  const bayanganRef = useRef<HTMLDivElement>(null);
  const miringRef = useRef<HTMLDivElement>(null);
  const [siap, setSiap] = useState(false);
  const [cadangan, setCadangan] = useState(false);

  useEffect(() => {
    const wadah = wadahRef.current;
    if (!wadah) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const diam = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let batal = false;
    let bersihkan: (() => void) | undefined;

    // Cadangan tanpa WebGL: gambar dimiringkan ke arah cursor (transisi CSS = redaman).
    const pakaiCadangan = () => {
      if (batal || diam) return;
      setCadangan(true);
      let tDiam = 0;
      const onPointer = (e: PointerEvent) => {
        const el = miringRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const kx = r.left + r.width * 0.62, ky = r.top + r.height * 0.28;
        const sisi = (d: number, ke0: number, ke1: number) => Math.max(-1, Math.min(1, d / Math.max(d < 0 ? ke0 : ke1, 120)));
        const x = sisi(e.clientX - kx, kx, window.innerWidth - kx);
        const y = sisi(e.clientY - ky, ky, window.innerHeight - ky);
        el.style.transform = `perspective(1400px) rotateY(${x * 10}deg) rotateX(${-y * 6}deg)`;
        clearTimeout(tDiam);
        tDiam = window.setTimeout(() => { el.style.transform = ""; }, DIAM_SETELAH_MS);
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      bersihkan = () => { clearTimeout(tDiam); window.removeEventListener("pointermove", onPointer); };
    };

    const mulai = async () => {
      // Model diunduh BERBARENGAN dengan three.js, bukan sesudahnya.
      const bufModel = fetch(MODEL_SRC).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
      const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (batal) return;

      // Opsi pertama paling hemat; kalau Chrome menolak, coba tanpa low-power/MSAA.
      let rr: import("three").WebGLRenderer | null = null;
      for (const opsi of [
        { antialias: true, alpha: true, powerPreference: "low-power" as const },
        { antialias: false, alpha: true },
      ]) {
        try { rr = new THREE.WebGLRenderer(opsi); break; } catch { /* coba opsi berikutnya */ }
      }
      if (!rr) { pakaiCadangan(); return; }
      const renderer = rr;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // [scroll-perf-v1] 2× = 1620² + MSAA tiap frame, berat di Mac Retina
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0x000000, 0);
      const kanvas = renderer.domElement;
      Object.assign(kanvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", opacity: "0", transition: "opacity .3s ease" });
      kanvas.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 20);

      const buf = await bufModel;
      const gltf = buf ? await new GLTFLoader().parseAsync(buf, "/models/").catch(() => null) : null;
      if (batal || !gltf) { renderer.dispose(); pmrem.dispose(); envTex.dispose(); if (!gltf) pakaiCadangan(); return; }

      const model = gltf.scene;
      const badan = new THREE.Group(); // pembungkus untuk condong badan & napas
      badan.add(model);
      scene.add(badan);

      // Bingkai kamera: pusat bounding box, jarak pas memuat bola pembatas.
      // JANGAN digeser demi bayangan — bingkai harus sama dengan PNG, kalau tidak
      // saat PNG memudar ke 3D karakternya terlihat dobel. Ruang di bawah kaki cukup.
      const kotak = new THREE.Box3().setFromObject(model);
      const pusat = kotak.getCenter(new THREE.Vector3());
      const radius = kotak.getBoundingSphere(new THREE.Sphere()).radius;
      const jarak = radius / Math.sin(rad(FOV) / 2);
      const th = rad(ORBIT_THETA), ph = rad(ORBIT_PHI);
      camera.position.set(
        pusat.x + jarak * Math.sin(ph) * Math.sin(th),
        pusat.y + jarak * Math.cos(ph),
        pusat.z + jarak * Math.sin(ph) * Math.cos(th),
      );
      camera.lookAt(pusat);


      // Rotasi kepala dihitung di ruang model lalu dikonversi ke ruang lokal tulang:
      // lokal = pInv · delta · p · q0 — tak bergantung orientasi sumbu tulang hasil ekspor.
      const kepala = model.getObjectByName("head") as import("three").Bone | undefined;
      const q0 = kepala ? kepala.quaternion.clone() : null;
      const p = new THREE.Quaternion();
      if (kepala?.parent) { model.updateMatrixWorld(true); kepala.parent.getWorldQuaternion(p); }
      const pInv = p.clone().invert();
      const sumbuYaw = new THREE.Vector3(0, 1, 0);
      const sumbuPitch = new THREE.Vector3(0, 0, 1);
      const qYaw = new THREE.Quaternion(), qPitch = new THREE.Quaternion(), qTmp = new THREE.Quaternion();

      const ukur = () => {
        const { width, height } = wadah.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      ukur();
      wadah.appendChild(kanvas);

      // Target dari posisi cursor relatif ke kepala karakter, dinormalkan PER SISI:
      // karakter ada di kanan layar, jadi jarak ke tepi kanan/atas jauh lebih pendek
      // — tanpa ini cursor di pojok kanan-atas cuma menghasilkan setengah sudut.
      let tx = 0, ty = 0, cx = 0, cy = 0, terakhirGerak = 0;
      const sisi = (d: number, ke0: number, ke1: number) =>
        Math.max(-1, Math.min(1, d < 0 ? d / Math.max(ke0, 120) : d / Math.max(ke1, 120)));
      const onPointer = (e: PointerEvent) => {
        const r = kanvas.getBoundingClientRect();
        const kx = r.left + r.width * 0.62, ky = r.top + r.height * 0.28; // kira-kira posisi kepala
        tx = sisi(e.clientX - kx, kx, window.innerWidth - kx);
        ty = sisi(e.clientY - ky, ky, window.innerHeight - ky);
        terakhirGerak = performance.now();
      };

      // Klip "mengetik" hanya untuk tangan & jari — trek kepala dibuang supaya
      // tidak bertabrakan dengan rotasi kepala dari cursor.
      const mixer = new THREE.AnimationMixer(model);
      const klip = gltf.animations.find((a) => a.name === "mengetik");
      if (klip && !diam) {
        klip.tracks = klip.tracks.filter((tr) => /^(tangan_|jari_)/.test(tr.name));
        mixer.clipAction(klip).play();
      }
      let tSebelum = 0;

      // `fase` = waktu sejak frame pertama: osilasi mulai dari 0 supaya frame pertama
      // sama persis dengan gambar awal (melayang & menoleh-idle = sin(0)).
      const pose = (t: number, fase: number) => {
        const idle = t - terakhirGerak > DIAM_SETELAH_MS;
        const gx = idle ? Math.sin(fase / 1400) * 0.12 : tx;
        const gy = idle ? 0 : ty;
        const k = 0.06; // redaman — makin kecil makin malas
        cx += (gx - cx) * k;
        cy += (gy - cy) * k;
        badan.rotation.y = rad(cx * BODY_YAW_MAX);
        // Melayang naik-turun; bayangan mengecil & memudar saat karakter naik.
        const naik = diam ? 0 : Math.sin(fase / 650); // -1..1
        badan.position.y = naik * MELAYANG;
        const k01 = (naik + 1) / 2;
        const el = bayanganRef.current;
        if (el) {
          el.style.transform = `translate(-50%, -50%) scale(${skalaBayangan(k01)})`;
          el.style.opacity = String(opasitasBayangan(k01));
        }
        if (kepala && q0) {
          qYaw.setFromAxisAngle(sumbuYaw, rad(cx * YAW_MAX));
          qPitch.setFromAxisAngle(sumbuPitch, rad(-cy * PITCH_MAX));
          qTmp.copy(pInv).multiply(qYaw).multiply(qPitch).multiply(p).multiply(q0);
          kepala.quaternion.copy(qTmp);
        }
      };

      let raf = 0, terlihat = true, pertama = true, t0 = 0, tSiap = 0;
      const frame = (t: number) => {
        raf = 0;
        if (pertama) t0 = t;
        mixer.update(tSebelum ? Math.min((t - tSebelum) / 1000, 0.1) : 0);
        tSebelum = t;
        pose(t, t - t0);
        renderer.render(scene, camera);
        if (pertama) {
          pertama = false;
          kanvas.style.opacity = "1";
          // Gambar awal disembunyikan SESUDAH kanvas penuh, bukan berbarengan.
          tSiap = window.setTimeout(() => setSiap(true), 350);
        }
        if (!diam && terlihat && !gulir && !document.hidden) raf = requestAnimationFrame(frame);
      };
      const lanjut = () => { if (!raf && !diam && terlihat && !gulir && !document.hidden) raf = requestAnimationFrame(frame); };

      // [scroll-perf-v1] Selama halaman di-scroll, render WebGL dijeda (karakter
      // diam sejenak) supaya GPU/main thread dipakai untuk scroll; lanjut 150 ms
      // sesudah scroll berhenti. Dulu ia terus merender 60–120 fps sambil scroll.
      let gulir = false, tGulir = 0;
      const onGulir = () => {
        gulir = true;
        clearTimeout(tGulir);
        tGulir = window.setTimeout(() => { gulir = false; tSebelum = 0; lanjut(); }, 150);
      };
      if (!diam) window.addEventListener("scroll", onGulir, { passive: true });

      const io = new IntersectionObserver(([en]) => { terlihat = en.isIntersecting; lanjut(); });
      io.observe(wadah);
      const ro = new ResizeObserver(() => { ukur(); if (diam) renderer.render(scene, camera); });
      ro.observe(wadah);
      document.addEventListener("visibilitychange", lanjut);
      if (!diam) window.addEventListener("pointermove", onPointer, { passive: true });
      raf = requestAnimationFrame(frame);

      bersihkan = () => {
        cancelAnimationFrame(raf);
        clearTimeout(tSiap);
        clearTimeout(tGulir);
        window.removeEventListener("scroll", onGulir);
        mixer.stopAllAction();
        io.disconnect(); ro.disconnect();
        document.removeEventListener("visibilitychange", lanjut);
        window.removeEventListener("pointermove", onPointer);
        model.traverse((o) => {
          const m = o as import("three").Mesh;
          if (!m.isMesh) return;
          m.geometry.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            Object.values(mat).forEach((v) => { if (v && (v as import("three").Texture).isTexture) (v as import("three").Texture).dispose(); });
            mat.dispose();
          });
        });
        envTex.dispose(); pmrem.dispose(); renderer.dispose();
        kanvas.remove();
      };
    };

    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const jalan = () => { mulai().catch(() => { if (!bersihkan) pakaiCadangan(); }); };
    // Ditunda sampai idle (maks 1 dtk, dulu 3 dtk): cukup untuk tidak berebut dgn LCP.
    const id = w.requestIdleCallback ? w.requestIdleCallback(jalan, { timeout: 1000 }) : window.setTimeout(jalan, 600);
    return () => {
      batal = true;
      if (w.cancelIdleCallback) w.cancelIdleCallback(id); else clearTimeout(id);
      bersihkan?.();
    };
  }, []);

  return (
    <div ref={wadahRef} className="relative w-full h-full">
      {/* [hero-bayangan-css-v1] Keadaan awal = fase 0 (k01 0,5), sama dgn frame pertama. */}
      <div
        ref={bayanganRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          left: `${BAYANGAN.x}%`, top: `${BAYANGAN.y}%`, width: `${BAYANGAN.w}%`, height: `${BAYANGAN.h}%`,
          transform: `translate(-50%, -50%) scale(${skalaBayangan(0.5)})`,
          opacity: opasitasBayangan(0.5),
          background: `radial-gradient(closest-side, rgba(0,0,0,${BAYANGAN_OPASITAS}) 0%, rgba(0,0,0,${BAYANGAN_OPASITAS * 0.55}) 45%, rgba(0,0,0,0) 100%)`,
        }}
      />
      <div
        ref={miringRef}
        className="relative w-full h-full"
        style={cadangan ? { transition: "transform .9s cubic-bezier(.2,.7,.3,1)", transformOrigin: "60% 45%" } : undefined}
      >
        <Image
          src="/images/hero-character-3d.png" alt={siap ? "" : alt} aria-hidden={siap || undefined}
          width={1620} height={1620} priority sizes="(min-width: 1024px) 810px, 0px"
          className={`relative w-full h-full object-contain ${siap ? "invisible" : ""} ${cadangan ? "melayang" : ""}`}
          style={cadangan ? ({ "--amp": "-12px", animationDuration: "4s" } as React.CSSProperties) : undefined}
        />
      </div>
      {siap && <span className="sr-only">{alt}</span>}
    </div>
  );
}
