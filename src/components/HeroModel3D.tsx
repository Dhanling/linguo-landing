"use client";
// [hero-3d-v3] Karakter hero 3D: kepala menoleh mengikuti cursor, jari mengetik.
// GLB dari Tripo diberi rig lewat script Blender headless: root + head (bobot dari
// tinggi — di atas leher cuma ada kepala/headphone, jadi kabel ikut melengkung)
// + 2 tangan × 4 jari (bobot dari posisi, bukan sambungan mesh: vertex kembar di
// jahitan UV harus dapat bobot identik, kalau tidak mesh retak). Klip "mengetik"
// 3 detik dipanggang di Blender; kepala tetap dikendalikan kode di atasnya.
// Dikompres ke ~1,8 MB (tekstur WebP + mesh terkuantisasi, tanpa decoder).
// PNG lama tetap jadi lapisan awal & LCP — three.js baru diunduh saat browser
// idle, hanya di desktop, dilewati kalau hemat data. Begitu frame pertama
// dirender, PNG memudar keluar. Render berhenti saat hero tak terlihat.
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

const MODEL_SRC = "/models/hero-character.glb";
// Sudut kamera disamakan dengan PNG lama supaya pergantiannya tidak melompat.
const ORBIT_THETA = -35, ORBIT_PHI = 80, FOV = 30;
const YAW_MAX = 26, PITCH_MAX = 12, BODY_YAW_MAX = 6; // derajat
const DIAM_SETELAH_MS = 2500;
const MELAYANG = 0.014;                                   // amplitudo naik-turun (satuan model; tinggi karakter ≈ 1)
const BAYANGAN_JARAK = 0.12, BAYANGAN_OPASITAS = 0.32;    // celah kaki→lantai khayal

const rad = (d: number) => (d * Math.PI) / 180;

export default function HeroModel3D({ alt }: { alt: string }) {
  const wadahRef = useRef<HTMLDivElement>(null);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    const wadah = wadahRef.current;
    if (!wadah) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const diam = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let batal = false;
    let bersihkan: (() => void) | undefined;

    const mulai = async () => {
      const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (batal) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0x000000, 0);
      const kanvas = renderer.domElement;
      Object.assign(kanvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", opacity: "0", transition: "opacity .45s ease .25s" });
      // Transisi berurutan (PNG pudar dulu 0,3 dtk, baru 3D muncul): sudut render PNG
      // sedikit beda dengan model, jadi kalau saling silang karakternya tampak dobel.
      kanvas.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 20);

      const gltf = await new GLTFLoader().loadAsync(MODEL_SRC).catch(() => null);
      if (batal || !gltf) { renderer.dispose(); pmrem.dispose(); envTex.dispose(); return; }

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

      // Bayangan melayang: elips lembut (gradien radial di kanvas) di lantai khayal
      // di bawah kaki. Tak ikut grup badan — ia yang bereaksi pada naik-turunnya karakter.
      const tekstur = (() => {
        const c = document.createElement("canvas"); c.width = c.height = 128;
        const g = c.getContext("2d")!;
        const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.45, "rgba(0,0,0,.55)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
      })();
      const matBayangan = new THREE.MeshBasicMaterial({ map: tekstur, transparent: true, depthWrite: false, toneMapped: false, opacity: BAYANGAN_OPASITAS });
      const bayangan = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matBayangan);
      bayangan.rotation.x = -Math.PI / 2;
      const ukuranKotak = kotak.getSize(new THREE.Vector3());
      bayangan.scale.set(ukuranKotak.x * 0.95, ukuranKotak.z * 1.3, 1);
      bayangan.position.set(pusat.x, kotak.min.y - BAYANGAN_JARAK, (kotak.min.z + kotak.max.z) / 2);
      bayangan.renderOrder = -1;
      scene.add(bayangan);
      const skalaBayangan = bayangan.scale.clone();

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

      const pose = (t: number) => {
        const idle = t - terakhirGerak > DIAM_SETELAH_MS;
        const gx = idle ? Math.sin(t / 1400) * 0.12 : tx;
        const gy = idle ? 0 : ty;
        const k = 0.06; // redaman — makin kecil makin malas
        cx += (gx - cx) * k;
        cy += (gy - cy) * k;
        badan.rotation.y = rad(cx * BODY_YAW_MAX);
        // Melayang naik-turun; bayangan mengecil & memudar saat karakter naik.
        const naik = diam ? 0 : Math.sin(t / 650); // -1..1
        badan.position.y = naik * MELAYANG;
        const k01 = (naik + 1) / 2;
        bayangan.scale.set(skalaBayangan.x * (1 - 0.14 * k01), skalaBayangan.y * (1 - 0.14 * k01), 1);
        matBayangan.opacity = BAYANGAN_OPASITAS * (1 - 0.35 * k01);
        if (kepala && q0) {
          qYaw.setFromAxisAngle(sumbuYaw, rad(cx * YAW_MAX));
          qPitch.setFromAxisAngle(sumbuPitch, rad(-cy * PITCH_MAX));
          qTmp.copy(pInv).multiply(qYaw).multiply(qPitch).multiply(p).multiply(q0);
          kepala.quaternion.copy(qTmp);
        }
      };

      let raf = 0, terlihat = true, pertama = true;
      const frame = (t: number) => {
        raf = 0;
        mixer.update(tSebelum ? Math.min((t - tSebelum) / 1000, 0.1) : 0);
        tSebelum = t;
        pose(t);
        renderer.render(scene, camera);
        if (pertama) { pertama = false; kanvas.style.opacity = "1"; setSiap(true); }
        if (!diam && terlihat && !document.hidden) raf = requestAnimationFrame(frame);
      };
      const lanjut = () => { if (!raf && !diam && terlihat && !document.hidden) raf = requestAnimationFrame(frame); };

      const io = new IntersectionObserver(([en]) => { terlihat = en.isIntersecting; lanjut(); });
      io.observe(wadah);
      const ro = new ResizeObserver(() => { ukur(); if (diam) renderer.render(scene, camera); });
      ro.observe(wadah);
      document.addEventListener("visibilitychange", lanjut);
      if (!diam) window.addEventListener("pointermove", onPointer, { passive: true });
      raf = requestAnimationFrame(frame);

      bersihkan = () => {
        cancelAnimationFrame(raf);
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
        bayangan.geometry.dispose(); matBayangan.dispose(); tekstur.dispose();
        envTex.dispose(); pmrem.dispose(); renderer.dispose();
        kanvas.remove();
      };
    };

    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const jalan = () => { mulai().catch(() => {}); };
    const id = w.requestIdleCallback ? w.requestIdleCallback(jalan, { timeout: 3000 }) : window.setTimeout(jalan, 1500);
    return () => {
      batal = true;
      if (w.cancelIdleCallback) w.cancelIdleCallback(id); else clearTimeout(id);
      bersihkan?.();
    };
  }, []);

  return (
    <div ref={wadahRef} className="relative w-full h-full">
      <Image
        src="/images/hero-character.png" alt={siap ? "" : alt} aria-hidden={siap || undefined}
        width={810} height={656} priority sizes="(min-width: 1024px) 810px, 0px"
        className={`w-full h-full object-contain drop-shadow-2xl transition-opacity duration-300 ${siap ? "opacity-0" : "opacity-100"}`}
      />
      {siap && <span className="sr-only">{alt}</span>}
    </div>
  );
}
