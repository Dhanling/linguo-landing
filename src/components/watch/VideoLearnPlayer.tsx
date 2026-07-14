"use client";

// Player "belajar" Watch & Learn — versi web dari immersion player app mobile.
// Kiri: video YouTube (IFrame API) + baris fokus (kalimat aktif bisa di-tap +
// terjemahan emas + tombol Analisa). Kanan (separator di desktop): transkrip
// penuh yang tersinkron — klik baris buat loncat. Tap kata → tooltip arti /
// simpan / analisa / dengar. Semua best-effort; kalau transkrip tak ada, video
// tetap jalan dengan caption bawaan YouTube.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Gauge,
  Languages,
  Layers,
  ListChecks,
  ListVideo,
  Loader2,
  Maximize,
  Maximize2,
  Minimize,
  Palette,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Type,
  X,
} from "lucide-react";
import {
  BASE_LANGS,
  countSavedForVideo,
  getBaseLangDef,
  processTranscript,
  DEFAULT_BASE_LANG,
  getAlignment,
  type AlignGroup,
  getSentenceBreakdown,
  isNonLatin,
  isRtl,
  LearnCue,
  POS_COLOR,
  POS_LABEL_ID,
  prewarmTranscripts,
  requestTranscript,
  SentenceBreakdown,
  splitWords,
  translateCuesToBase,
  TranscriptReason,
  transliterateLines,
} from "@/lib/immersionLearn";
import {
  filterVideosByLanguage,
  formatDuration,
  getImmersionLang,
  ImmersionVideo,
  searchImmersionVideos,
  WATCH_REC_MAX_DURATION_SEC,
  youtubeThumb,
} from "@/lib/immersion";
import { WordTooltip } from "./WordTooltip";
import { RectFlag } from "@/components/RectFlag";

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
const CARD = "#161A1C";
const BORDER = "rgba(255,255,255,0.08)";

// [watch-word-align-v1] Penanda hover-sync antar baris (kata target ↔ arti ↔
// transliterasi). Dulu sorot LATAR teal — sekarang GARIS BAWAH: tak menutup teks,
// lebih halus, dan tetap rapi saat frasa multi-kata menyala menembus wrap baris.
const SYNC_UNDERLINE: React.CSSProperties = {
  textDecorationLine: "underline",
  textDecorationColor: TEAL,
  textDecorationThickness: 2,
  textUnderlineOffset: 3,
};
const SUB = "rgba(255,255,255,0.5)";

const SPEEDS = [1, 0.75, 0.5, 1.25];

// Ukuran teks subtitle/transkrip yang bisa dipilih siswa (disimpan lokal).
const FONT_LEVELS = [
  { label: "Kecil", scale: 0.85 },
  { label: "Sedang", scale: 1 },
  { label: "Besar", scale: 1.2 },
];
const FONT_KEY = "linguo:watch:fontsize:v1";

// Label ramah untuk string kualitas YouTube (dipakai pemilih kualitas kita).
const QUALITY_LABELS: Record<string, string> = {
  highres: "4320p",
  hd2160: "2160p",
  hd1440: "1440p",
  hd1080: "1080p",
  hd720: "720p",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
  auto: "Auto",
  default: "Auto",
};
const qualityLabel = (q: string) => QUALITY_LABELS[q] ?? q;

// Cache video terkait per (bahasa|video) — buka-tutup player tak mengulang
// pencarian YouTube (hemat kuota) selama halaman belum di-reload. `next` =
// nextPageToken YouTube, biar "Muat lainnya" bisa terus mengambil halaman baru.
type RelatedPage = { list: ImmersionVideo[]; next?: string };
const relatedCache = new Map<string, RelatedPage>();

// ── YouTube IFrame API loader (singleton) ────────────────────────────────────
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>((resolve) => {
    const prev = (window as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady;
    (window as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

interface Anchor {
  word: string;
  sentence: string;
  x: number;
  y: number;
  // Indeks token kata dalam splitWords(sentence) — dipakai tooltip untuk memperluas
  // pilihan ke frasa (mis. "la compañía"). Undefined = jatuh ke pencarian pertama.
  wordIdx?: number;
}

export default function VideoLearnPlayer({
  video,
  langCode,
  baseLang = DEFAULT_BASE_LANG,
  onClose,
  onChangeLang,
  onChangeBaseLang,
  onOpenVocab,
  onSavedChange,
  recommendations = [],
  onSelectVideo,
}: {
  video: ImmersionVideo;
  langCode: string;
  /** Bahasa terjemahan di bawah subtitle ("kamu bicara bahasa apa?"). */
  baseLang?: string;
  onClose: () => void;
  /** Ganti bahasa yang dipelajari saat menonton → balik ke beranda Watch & Learn. */
  onChangeLang?: () => void;
  /** Ganti bahasa terjemahan (tombol di header) — baris terjemahan diterjemah ulang. */
  onChangeBaseLang?: (code: string) => void;
  /** Buka deck kosakata (tombol jumlah kosakata di header). */
  onOpenVocab?: () => void;
  onSavedChange?: () => void;
  recommendations?: ImmersionVideo[];
  onSelectVideo?: (v: ImmersionVideo) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [showCC, setShowCC] = useState(false); // CC bawaan YouTube (fallback)
  // Kualitas video — kontrol bawaan YouTube dimatikan (controls:0), jadi kita sediakan
  // pemilih kualitas sendiri (mis. turunkan resolusi untuk hemat paket data).
  // Catatan: setPlaybackQuality/suggestedQuality sudah DEPRECATED YouTube & sering
  // diabaikan player modern — jadi ini best-effort, tak dijamin selalu berefek.
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<string[]>([]);
  const [quality, setQuality] = useState("auto"); // "auto" | level string YT
  const [fontIdx, setFontIdx] = useState(1); // ukuran teks subtitle (default Sedang)
  const fscale = FONT_LEVELS[fontIdx].scale;

  const [cues, setCues] = useState<LearnCue[]>([]);
  const [txState, setTxState] = useState<"loading" | "ready" | "none">("loading");
  // Alasan transkrip kosong (dari fetchTranscript) — buat pesan fallback lebih spesifik.
  const [txReason, setTxReason] = useState<TranscriptReason>("ok");
  // Dinaikkan tombol "Coba lagi": memicu ulang effect muat transkrip. Kegagalan di
  // jalur ini sering transient (ASR timeout / rate-limit / IP blok sesaat), dan
  // prewarm bisa sudah menghangatkan cache sementara ini — jadi retry sering langsung jadi.
  const [retryTick, setRetryTick] = useState(0);
  // True saat transkrip jatuh ke jalur AI (yt-asr) yang lambat — buat pesan loading.
  const [asrRunning, setAsrRunning] = useState(false);
  // True selagi bacaan Latin (romaji/pinyin/dll) diisi di background utk bahasa non-Latin.
  const [translitLoading, setTranslitLoading] = useState(false);
  // True selagi baris terjemahan diterjemah ulang ke bahasa pengguna (selain Indonesia).
  const [baseTranslating, setBaseTranslating] = useState(false);
  // Terjemahan Indonesia asli (dari cache) — disimpan supaya bisa dipulihkan saat
  // pengguna kembali memilih Indonesia setelah sempat ganti bahasa terjemahan.
  const idBaseRef = useRef<string[]>([]);
  // Cue terbaru (dibaca di dalam effect terjemahan tanpa jadi dependency, biar isi
  // translit di background tak memicu terjemah ulang).
  const cuesRef = useRef<LearnCue[]>([]);
  cuesRef.current = cues;
  // Kenapa auto-generate gagal — paritas dgn app mobile: transkrip yang belum ada
  // di cache langsung diantre otomatis (tanpa tombol "Minta"), lalu di-poll sampai
  // siap. Nilai ini hanya terisi kalau jalur otomatis itu mentok.
  const [genFail, setGenFail] = useState<null | "cap" | "error" | "timeout">(null);

  const [analyze, setAnalyze] = useState(false);
  const [breakdowns, setBreakdowns] = useState<Record<number, SentenceBreakdown | "loading" | "error">>({});

  const [anchor, setAnchor] = useState<Anchor | null>(null);

  // Dropdown pilih bahasa terjemahan (tombol di header). Dirender di DALAM player
  // karena picker milik katalog (z-85) tenggelam di bawah overlay player (z-90).
  const [baseMenuOpen, setBaseMenuOpen] = useState(false);
  // Jumlah kosakata yang disimpan sewaktu menonton video ini (badge di header).
  const [savedCount, setSavedCount] = useState(0);
  const refreshSaved = useCallback(() => {
    setSavedCount(countSavedForVideo(video.videoId, langCode));
  }, [video.videoId, langCode]);
  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);
  // Simpan kata → perbarui badge lokal + teruskan ke induk (refresh deck/badge katalog).
  const handleSaved = useCallback(() => {
    refreshSaved();
    onSavedChange?.();
  }, [refreshSaved, onSavedChange]);

  // [linguo-patch:watch-translit-hover-sync-v1] Kata target yang sedang di-hover di
  // panel transkrip. `i` = indeks cue, `k` = indeks-urut kata (di antara token kata)
  // dalam baris itu. Dipakai agar hover kata non-Latin (Georgia/China/dll) IKUT
  // menyorot token transliterasi yang bersesuaian — dan sebaliknya. Selaras hanya
  // saat jumlah kata target === jumlah token translit (lihat alignTranslitTokens).
  const [hoverWord, setHoverWord] = useState<{ i: number; k: number } | null>(null);

  // [watch-word-align-v1] Penjajaran frasa target↔terjemahan per baris (indeks cue
  // → grup). Dipakai agar hover satu kata IKUT menyorot arti-nya di baris terjemahan
  // (dan sebaliknya), dengan frasa multi-kata ("el entrenamiento de fuerza" ↔
  // "strength training") menyala sebagai SATU unit. Hanya untuk pasangan bahasa
  // beraksara Latin (target & terjemahan) — non-Latin tetap pakai sinkron translit.
  const [aligns, setAligns] = useState<Record<number, AlignGroup[]>>({});
  const alignReqRef = useRef<Set<string>>(new Set());

  // Fullscreen player kita sendiri (bukan iframe) + tampil/sembunyi panel transkrip.
  const [fullscreen, setFullscreen] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  // Di layar penuh: sembunyikan header + baris kontrol saat kursor diam (immersive
  // ala YouTube). Subtitle + terjemahan TETAP tampil. Gerakkan kursor → muncul lagi.
  const [chromeHidden, setChromeHidden] = useState(false);
  // [linguo-patch:watch-miniplayer-v1] Miniplayer ala YouTube: TETAP di halaman
  // player, tapi video menyusut jadi kotak melayang di pojok kanan-bawah; baris
  // subtitle + kontrol auto-hide sehingga daftar Rekomendasi di kolom kiri
  // melebar mengisi ruangnya (leluasa discroll). Elemen host iframe TIDAK
  // di-unmount (cuma ganti class/style), jadi video terus berputar tanpa reload.
  const [mini, setMini] = useState(false);
  // Posisi kotak mini hasil drag (koordinat kiri-atas); null = default pojok
  // kanan-bawah. Bisa diseret dari strip atas (muncul saat hover) & bar subtitle.
  const [miniPos, setMiniPos] = useState<{ x: number; y: number } | null>(null);
  const miniBoxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  const onMiniDragStart = useCallback((e: React.PointerEvent) => {
    // Jangan mulai drag dari tombol (Kembalikan/Tutup tetap berfungsi normal).
    if ((e.target as HTMLElement).closest("button")) return;
    const box = miniBoxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    // Capture: pointermove tetap ke handle walau kursor melintasi iframe/keluar box.
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);
  const onMiniDragMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    const box = miniBoxRef.current;
    if (!d || !box) return;
    // Jepit ke dalam viewport (margin 8px) biar kotak tak hilang keluar layar.
    const x = Math.min(Math.max(8, e.clientX - d.dx), window.innerWidth - box.offsetWidth - 8);
    const y = Math.min(Math.max(8, e.clientY - d.dy), window.innerHeight - box.offsetHeight - 8);
    setMiniPos({ x, y });
  }, []);
  const onMiniDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Keluar dari mode mini → posisi drag kembali ke default (pojok kanan-bawah).
  useEffect(() => {
    if (!mini) setMiniPos(null);
  }, [mini]);
  // Rekomendasi: tampil 5 dulu, "Muat lainnya" menambah — reset tiap ganti video.
  const [recShown, setRecShown] = useState(5);
  // Video terkait hasil pencarian (channel/topik sama) — fallback ke katalog halaman.
  const [related, setRelated] = useState<RelatedPage | null>(null);
  // True selagi "Muat lainnya" mengambil halaman rekomendasi berikutnya dari server.
  const [recLoading, setRecLoading] = useState(false);
  // Kunci (bahasa|video) yang sedang aktif — buang hasil fetch basi saat ganti video.
  const relKeyRef = useRef("");

  // ── Fullscreen: sinkronkan state dengan API (termasuk exit lewat Esc) ─────────
  useEffect(() => {
    const onChange = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = document as any;
      const fsEl = document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
      setFullscreen(fsEl === rootRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // ── Auto-hide header + kontrol saat kursor diam (hanya di layar penuh) ────────
  useEffect(() => {
    if (!fullscreen) {
      setChromeHidden(false);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      setChromeHidden(false);
      clearTimeout(t);
      t = setTimeout(() => setChromeHidden(true), 2600);
    };
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("mousedown", wake);
    window.addEventListener("touchstart", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("mousedown", wake);
      window.removeEventListener("touchstart", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [fullscreen]);

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = document as any;
    const active = document.fullscreenElement ?? d.webkitFullscreenElement;
    try {
      if (active) {
        (document.exitFullscreen ?? d.webkitExitFullscreen)?.call(document);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = el as any;
        (el.requestFullscreen ?? e.webkitRequestFullscreen)?.call(el);
      }
    } catch {
      /* abaikan — sebagian browser (iOS) tak izinkan fullscreen elemen */
    }
  }, []);

  // ── Muat YouTube player ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      playerRef.current = new (window as any).YT.Player(hostRef.current, {
        videoId: video.videoId,
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 0,
          playsinline: 1,
          // Sembunyikan SEMUA kontrol bawaan YouTube (progress bar, tombol share/
          // watch-later/logo, setting/CC/volume, judul). Chrome YT menutupi sudut
          // yang kita pakai untuk header sendiri (judul kiri-atas + language selector
          // kanan-atas). Play/jeda tetap bisa dengan klik video (perilaku default YT
          // saat controls=0); seek lewat klik kalimat transkrip; kualitas via tombol
          // "Kualitas" kita sendiri.
          controls: 0,
          // Matikan fullscreen bawaan YouTube — fullscreen iframe menutupi overlay
          // kita (subtitle + transkrip). Kita pakai tombol fullscreen sendiri yang
          // men-fullscreen-kan seluruh player biar overlay tetap tampil.
          fs: 0,
          // Matikan kontrol keyboard bawaan YouTube (panah = seek/volume) supaya
          // panah kiri/kanan/atas/bawah kita pakai untuk navigasi section.
          disablekb: 1,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            setReady(true);
            // Paksa caption CC YouTube mati — kita sudah punya subtitle + arti
            // sendiri di overlay/transkrip. cc_load_policy:0 saja tak cukup
            // karena YouTube mengingat preferensi CC user; unload modul-nya.
            try {
              playerRef.current?.unloadModule("captions");
              playerRef.current?.unloadModule("cc");
            } catch {
              /* abaikan */
            }
            try {
              playerRef.current?.playVideo();
            } catch {
              /* abaikan */
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) => {
            // 1 = playing, 2 = paused, 0 = ended
            setPlaying(e.data === 1);
            // Modul caption kadang baru dimuat setelah playback mulai —
            // matikan lagi begitu video benar-benar jalan agar CC tak muncul.
            if (e.data === 1) {
              try {
                playerRef.current?.unloadModule("captions");
                playerRef.current?.unloadModule("cc");
              } catch {
                /* abaikan */
              }
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* abaikan */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.videoId]);

  // Ganti video → daftar rekomendasi kembali ke 5 teratas + keluar dari miniplayer
  // (klik video lain saat mini = buka penuh lagi, sama seperti YouTube).
  useEffect(() => {
    setRecShown(5);
    setMini(false);
  }, [video.videoId]);

  // [linguo-patch:watch-miniplayer-v1] Masuk miniplayer; kalau sedang fullscreen,
  // keluar dulu (fixed pojok tak ada artinya di dalam elemen fullscreen).
  const enterMini = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = document as any;
    if (document.fullscreenElement ?? d.webkitFullscreenElement) {
      try {
        (document.exitFullscreen ?? d.webkitExitFullscreen)?.call(document);
      } catch {
        /* abaikan */
      }
    }
    setMini(true);
  }, []);

  // Cari video TERKAIT dengan yang sedang dibuka (bias nama channel → video dari
  // channel yang sama atau bertopik mirip), bukan sekadar isi katalog halaman.
  useEffect(() => {
    const key = `${langCode}|${video.videoId}`;
    relKeyRef.current = key;
    setRecLoading(false);
    const hit = relatedCache.get(key);
    if (hit) {
      setRelated(hit);
      return;
    }
    setRelated(null);
    let alive = true;
    const lang = getImmersionLang(langCode);
    searchImmersionVideos({
      query: video.channel?.trim() || video.title,
      language: lang?.searchCode ?? langCode,
      max: 12,
      maxDurationSec: WATCH_REC_MAX_DURATION_SEC,
    })
      .then((page) => {
        if (!alive) return;
        const list = filterVideosByLanguage(page.results, langCode).filter(
          (v) =>
            v.videoId !== video.videoId &&
            (!v.duration || v.duration <= WATCH_REC_MAX_DURATION_SEC)
        );
        if (list.length) {
          const data: RelatedPage = { list, next: page.nextPageToken };
          relatedCache.set(key, data);
          setRelated(data);
        }
      })
      .catch(() => {
        /* best-effort — fallback ke katalog halaman */
      });
    return () => {
      alive = false;
    };
  }, [video.videoId, video.channel, video.title, langCode]);

  // Daftar rekomendasi yang dirender: hasil terkait kalau sudah ada, selain itu
  // katalog dari halaman (prop) — keduanya tanpa video yang sedang diputar.
  // Relevansi: video dari CHANNEL yang sama diangkat ke atas (paling nyambung),
  // sisanya (bertopik mirip dari channel lain) menyusul — mirip "Selanjutnya" YT.
  const recList = useMemo(() => {
    const base = related?.list.length ? related.list : recommendations;
    const rest = base.filter((v) => v.videoId !== video.videoId);
    const chan = video.channel?.trim().toLowerCase();
    if (!chan) return rest;
    const same = rest.filter((v) => v.channel?.trim().toLowerCase() === chan);
    const other = rest.filter((v) => v.channel?.trim().toLowerCase() !== chan);
    return [...same, ...other];
  }, [related, recommendations, video.videoId, video.channel]);

  // "Muat lainnya" rekomendasi: buka 5 lagi dari stok lokal; kalau stok menipis
  // dan server masih punya halaman (nextPageToken), ambil halaman berikutnya —
  // tombol tak mentok setelah 1–2 klik.
  const loadMoreRecs = useCallback(() => {
    setRecShown((n) => n + 5);
    if (!related?.next || recLoading) return;
    if (related.list.length > recShown + 5) return; // stok lokal masih cukup
    const key = `${langCode}|${video.videoId}`;
    setRecLoading(true);
    const lang = getImmersionLang(langCode);
    searchImmersionVideos({
      query: video.channel?.trim() || video.title,
      language: lang?.searchCode ?? langCode,
      max: 12,
      pageToken: related.next,
      maxDurationSec: WATCH_REC_MAX_DURATION_SEC,
    })
      .then((page) => {
        if (relKeyRef.current !== key) return; // sudah ganti video — hasil basi
        const more = filterVideosByLanguage(page.results, langCode).filter(
          (v) =>
            v.videoId !== video.videoId &&
            (!v.duration || v.duration <= WATCH_REC_MAX_DURATION_SEC)
        );
        setRelated((prev) => {
          if (!prev) return prev;
          const seen = new Set(prev.list.map((v) => v.videoId));
          const merged: RelatedPage = {
            list: [...prev.list, ...more.filter((v) => !seen.has(v.videoId))],
            next: page.nextPageToken,
          };
          relatedCache.set(key, merged);
          return merged;
        });
      })
      .catch(() => {
        /* biarkan — token masih tersimpan, klik berikutnya mencoba lagi */
      })
      .finally(() => {
        if (relKeyRef.current === key) setRecLoading(false);
      });
  }, [related, recShown, recLoading, langCode, video.videoId, video.channel, video.title]);

  // Polling waktu tiap 200ms untuk sinkronisasi subtitle.
  // Lacak waktu video untuk sorotan karaoke. Sekadar sampling getCurrentTime tiap
  // 200ms bikin sorotan tersendat & tertinggal dari audio (lag hingga 200ms) —
  // terasa "ga sinkron". Jadi: ANCHOR ke waktu asli player secara berkala, lalu
  // INTERPOLASI dengan jam dinding × kecepatan putar di antara anchor. Sorotan jadi
  // mengalir mulus dan menempel ke audio; re-anchor tiap 400ms mengoreksi drift &
  // lompatan (seek/scrub, termasuk saat dijeda).
  useEffect(() => {
    if (!ready) return;
    const rate = SPEEDS[speedIdx] || 1;
    let raf = 0;
    let anchorT = playerRef.current?.getCurrentTime?.() ?? 0;
    let anchorPerf = performance.now();
    let lastResync = anchorPerf;
    let lastSet = 0;
    let emitted = -1;
    const tick = () => {
      const now = performance.now();
      if (now - lastResync > 400) {
        try {
          const real = playerRef.current?.getCurrentTime?.();
          if (typeof real === "number") {
            anchorT = real;
            anchorPerf = now;
          }
        } catch {
          /* abaikan */
        }
        lastResync = now;
      }
      const est = playing ? anchorT + ((now - anchorPerf) / 1000) * rate : anchorT;
      // Throttle ~50ms (20fps): mulus untuk sapuan karaoke, jauh lebih ringan dari
      // 60fps untuk panel transkrip; lewati kalau nilainya tak berubah (saat jeda).
      if (now - lastSet > 50 && Math.abs(est - emitted) > 0.015) {
        lastSet = now;
        emitted = est;
        setTime(est);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, playing, speedIdx]);

  // ── Muat transkrip ──────────────────────────────────────────────────────────
  // Paritas dgn app mobile: buka video = subtitle DIBUAT OTOMATIS bila belum ada.
  // Di mobile itu murah (caption YouTube di-fetch on-device, gratis); di web
  // browser tak bisa fetch caption (Origin diblokir) & IP server diblokir, jadi
  // jalurnya ASR server (antrian + cap harian sbg rem biaya). Bedanya sekarang
  // rem itu TAK terlihat siswa: cache miss → auto-enqueue → poll sampai siap.
  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;
    setTxState("loading");
    setTxReason("ok");
    setAsrRunning(false);
    setTranslitLoading(false);
    setGenFail(null);
    setCues([]);
    setBreakdowns({});
    // Sambil transkrip interaktif disiapkan (jalur AI bisa ~1 menit), tampilkan CC
    // bawaan YouTube DALAM bahasa target biar siswa tak menonton tanpa subtitle.
    setShowCC(true);

    const meta = { title: video.title, channel: video.channel, duration: video.duration };

    // Pasang cues ke UI (urut menaik by `start`: pencarian biner activeIdx & efek
    // karaoke mengandalkan cue terurut) + isi bacaan Latin di background untuk
    // bahasa non-Latin yang cache-nya belum bawa translit (baris lama).
    const applyCues = (list: LearnCue[]) => {
      const ordered = [...list].sort((a, b) => a.start - b.start);
      // Simpan base Indonesia asli (cache selalu Indonesia) untuk bisa dipulihkan
      // kalau pengguna balik memilih Indonesia; effect terjemahan menimpa `base`.
      idBaseRef.current = ordered.map((c) => c.base);
      setCues(ordered);
      setTxState("ready");
      setAsrRunning(false);
      if (isNonLatin(langCode) && ordered.some((c) => !c.translit)) {
        setTranslitLoading(true);
        transliterateLines(ordered.map((c) => c.target), langCode)
          .then((tr) => {
            if (cancelled || tr.length !== ordered.length) return;
            setCues((prev) =>
              prev.length === tr.length
                ? prev.map((c, i) => (c.translit || !tr[i] ? c : { ...c, translit: tr[i] }))
                : prev
            );
          })
          .finally(() => !cancelled && setTranslitLoading(false));
      }
    };

    const giveUp = (reason: TranscriptReason, fail: null | "cap" | "error" | "timeout") => {
      setAsrRunning(false);
      setGenFail(fail);
      setTxReason(reason);
      setTxState("none");
      setShowCC(true); // fallback ke caption bawaan YouTube
    };

    // Worker (pg_cron tiap menit) biasanya kelar ±1 menit; beri ruang antre +
    // video panjang sebelum menyerah.
    const POLL_MS = 8000;
    const deadline = Date.now() + 6 * 60_000;
    const poll = () => {
      if (cancelled) return;
      processTranscript(video.videoId, langCode, { cacheOnly: true, meta }).then((p) => {
        if (cancelled) return;
        if (p.cues.length) return applyCues(p.cues);
        if (Date.now() > deadline) return giveUp("not_ready", "timeout");
        pollTimer = window.setTimeout(poll, POLL_MS);
      });
    };

    processTranscript(video.videoId, langCode, { cacheOnly: true, meta }).then((r) => {
      if (cancelled) return;
      if (r.cues.length) return applyCues(r.cues);
      if (r.reason !== "not_ready") return giveUp(r.reason, null);
      // Belum ada di cache → antre otomatis (idempoten; job failed di-reset ke
      // pending oleh route enqueue) lalu tunggu hasil worker.
      setAsrRunning(true); // pesan "Membuat subtitle dengan AI…"
      requestTranscript(video.videoId, langCode).then((status) => {
        if (cancelled) return;
        if (status === "ready") return poll(); // ternyata sudah ada → muat
        if (status === "cap") return giveUp("not_ready", "cap");
        if (status === "error") return giveUp("not_ready", "error");
        // queued | exists | processing → poll cache sampai worker selesai.
        pollTimer = window.setTimeout(poll, POLL_MS);
      });
    });
    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
    };
  }, [video.videoId, langCode, retryTick]);

  // ── Terjemahan di bawah subtitle mengikuti "kamu bicara bahasa apa?" ──────────
  // Cache server menyimpan `base` dalam Indonesia. Kalau pengguna memilih bahasa
  // lain, terjemahkan ulang baris `target` ke bahasa itu (hasil di-cache lokal).
  // Kunci by JUMLAH cue (bukan identitas array) supaya pengisian translit di
  // background — yang cuma menambah field `translit` — tak memicu terjemah ulang.
  const cuesReadyKey = cues.length ? `${video.videoId}|${langCode}|${cues.length}` : "";
  useEffect(() => {
    if (!cuesReadyKey) return;
    // Indonesia = base bawaan cache → pulihkan terjemahan asli, tak perlu AI.
    if (baseLang === DEFAULT_BASE_LANG) {
      setBaseTranslating(false);
      setCues((prev) =>
        prev.map((c, i) => ({ ...c, base: idBaseRef.current[i] ?? c.base }))
      );
      return;
    }
    let cancelled = false;
    setBaseTranslating(true);
    // Sembunyikan terjemahan Indonesia selagi diterjemah ulang — jangan tampilkan
    // bahasa yang tak dimengerti penutur lain.
    setCues((prev) => prev.map((c) => ({ ...c, base: "" })));
    translateCuesToBase(video.videoId, langCode, baseLang, cuesRef.current)
      .then((bases) => {
        if (cancelled || !bases) return;
        setCues((prev) =>
          prev.length === bases.length
            ? prev.map((c, i) => ({ ...c, base: bases[i] ?? "" }))
            : prev
        );
      })
      .finally(() => {
        if (!cancelled) setBaseTranslating(false);
      });
    return () => {
      cancelled = true;
    };
    // idBaseRef/cuesRef sengaja bukan dependency (ref); cuesReadyKey mewakili cue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuesReadyKey, baseLang]);

  // Hangatkan cache transkrip untuk video rekomendasi di background biar saat
  // penonton loncat ke video berikutnya, subtitle + terjemahannya sudah siap
  // (tak menunggu ASR ~1 menit). Best-effort & terdedup per sesi.
  useEffect(() => {
    if (!recList.length) return;
    prewarmTranscripts(recList, langCode);
  }, [recList, langCode]);

  // Terapkan CC bawaan + SINKRONKAN bahasanya ke bahasa yang sedang dipelajari.
  // Tanpa ini, track CC "lengket" ke bahasa video sebelumnya (mis. buka video
  // Inggris tapi CC-nya masih Italia dari video sebelumnya). setOption("track")
  // memilih track bahasa target sekaligus memaksanya tampil. Modul bisa bernama
  // "captions" (player AS3) atau "cc" (HTML5) — set keduanya, yang tak aktif no-op.
  useEffect(() => {
    if (!ready) return;
    const p = playerRef.current;
    if (!p) return;
    const base = (langCode || "").split("-")[0];
    const applyLang = () => {
      for (const mod of ["captions", "cc"]) {
        try {
          p.setOption?.(mod, "track", { languageCode: base });
        } catch {
          /* modul lain / belum siap — abaikan */
        }
      }
    };
    try {
      if (showCC) {
        p.loadModule?.("captions");
        p.loadModule?.("cc");
        // setOption sering diabaikan tepat setelah loadModule (modul belum siap),
        // jadi ulang beberapa kali sampai track bahasa target terpasang.
        applyLang();
        const t1 = window.setTimeout(applyLang, 400);
        const t2 = window.setTimeout(applyLang, 1200);
        return () => {
          window.clearTimeout(t1);
          window.clearTimeout(t2);
        };
      }
      p.unloadModule?.("captions");
      p.unloadModule?.("cc");
    } catch {
      /* abaikan */
    }
  }, [showCC, ready, langCode]);

  // Indeks cue aktif berdasarkan waktu sekarang.
  const activeIdx = useMemo(() => {
    if (!cues.length) return -1;
    // Cari cue yang mencakup `time`; kalau di celah, pakai cue terakhir yang lewat.
    let lo = 0;
    let hi = cues.length - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (cues[mid].start <= time) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (ans === -1) return -1;
    // Kalau sudah lewat end cue ini dan belum masuk berikutnya, tetap sorot ini.
    return ans;
  }, [cues, time]);

  const activeCue = activeIdx >= 0 ? cues[activeIdx] : null;

  // [watch-word-align-v1] Penjajaran hanya berlaku saat target & terjemahan sama-sama
  // beraksara Latin (hover-sync kata↔arti). Non-Latin dilewati (pakai translit).
  const alignEnabled = !isNonLatin(langCode) && !isNonLatin(baseLang);

  // Reset penjajaran saat ganti video/bahasa (cue di-reset ke []).
  useEffect(() => {
    setAligns({});
    alignReqRef.current = new Set();
  }, [video.videoId, langCode, baseLang]);

  // Ambil penjajaran satu baris (lazy, dedup via ref + cache localStorage di lib).
  const ensureAlign = useCallback(
    (i: number) => {
      if (!alignEnabled) return;
      const c = cuesRef.current[i];
      if (!c || !c.base?.trim()) return;
      const key = `${i}::${c.target}`;
      if (alignReqRef.current.has(key)) return;
      alignReqRef.current.add(key);
      getAlignment({ target: c.target, base: c.base, langCode, baseCode: baseLang })
        .then((g) => setAligns((prev) => ({ ...prev, [i]: g })))
        .catch(() => alignReqRef.current.delete(key));
    },
    [alignEnabled, langCode, baseLang]
  );

  // Prefetch penjajaran baris aktif (yang paling mungkin dibaca/hover pengguna).
  useEffect(() => {
    if (activeIdx >= 0) ensureAlign(activeIdx);
  }, [activeIdx, ensureAlign]);

  // Peta bantu per baris: ordinal kata target → grup, ordinal kata terjemahan →
  // grup, dan ordinal target pertama tiap grup (buat hover dari sisi terjemahan).
  const alignMaps = useMemo(() => {
    const out: Record<number, { tGroup: number[]; bGroup: number[]; firstT: number[] }> = {};
    for (const key of Object.keys(aligns)) {
      const i = Number(key);
      const groups = aligns[i];
      if (!groups || !groups.length) continue;
      const tGroup: number[] = [];
      const bGroup: number[] = [];
      const firstT: number[] = [];
      groups.forEach((g, gi) => {
        firstT[gi] = g.t.length ? Math.min(...g.t) : -1;
        g.t.forEach((t) => (tGroup[t] = gi));
        g.b.forEach((b) => (bGroup[b] = gi));
      });
      out[i] = { tGroup, bGroup, firstT };
    }
    return out;
  }, [aligns]);

  // Kumpulan ordinal yang harus menyala saat ini untuk baris `i` — mengikuti grup
  // penjajaran kalau ada (frasa menyala utuh), kalau tidak cuma kata yang di-hover.
  const hotSets = useCallback(
    (i: number): { t: Set<number>; b: Set<number> } => {
      const t = new Set<number>();
      const b = new Set<number>();
      if (!hoverWord || hoverWord.i !== i) return { t, b };
      t.add(hoverWord.k);
      const m = alignMaps[i];
      const g = m?.tGroup[hoverWord.k];
      if (m && g != null && g >= 0) {
        m.tGroup.forEach((gg, k) => gg === g && t.add(k));
        m.bGroup.forEach((gg, bj) => gg === g && b.add(bj));
      }
      return { t, b };
    },
    [hoverWord, alignMaps]
  );

  // Auto-scroll baris aktif ke tengah panel transkrip.
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-cue="${activeIdx}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  const seekTo = useCallback((sec: number) => {
    try {
      playerRef.current?.seekTo?.(Math.max(0, sec), true);
      playerRef.current?.playVideo?.();
    } catch {
      /* abaikan */
    }
  }, []);

  const applySpeed = useCallback((idx: number) => {
    setSpeedIdx(idx);
    try {
      playerRef.current?.setPlaybackRate?.(SPEEDS[idx]);
    } catch {
      /* abaikan */
    }
  }, []);

  // Pilih kualitas video (best-effort — API sudah deprecated). "auto" = biar YouTube
  // yang menentukan sesuai koneksi. Refresh daftar level tiap dibuka karena level
  // yang tersedia baru terisi setelah playback mulai.
  const refreshQualityLevels = useCallback(() => {
    try {
      const levels: string[] = playerRef.current?.getAvailableQualityLevels?.() ?? [];
      // Buang "auto"/"default" dari daftar — kita tambahkan opsi "Auto" sendiri di atas.
      setQualityLevels(levels.filter((l) => l !== "auto" && l !== "default"));
      const cur = playerRef.current?.getPlaybackQuality?.();
      if (cur) setQuality(cur);
    } catch {
      /* abaikan */
    }
  }, []);

  const applyQuality = useCallback((level: string) => {
    setQuality(level);
    setQualityMenuOpen(false);
    try {
      if (level === "auto") playerRef.current?.setPlaybackQuality?.("default");
      else playerRef.current?.setPlaybackQuality?.(level);
    } catch {
      /* abaikan */
    }
  }, []);

  // Pulihkan ukuran teks pilihan siswa; siklus Kecil → Sedang → Besar.
  useEffect(() => {
    try {
      const s = window.localStorage.getItem(FONT_KEY);
      if (s != null) {
        const n = parseInt(s, 10);
        if (n >= 0 && n < FONT_LEVELS.length) setFontIdx(n);
      }
    } catch {
      /* abaikan */
    }
  }, []);
  const cycleFont = useCallback(() => {
    setFontIdx((i) => {
      const n = (i + 1) % FONT_LEVELS.length;
      try {
        window.localStorage.setItem(FONT_KEY, String(n));
      } catch {
        /* abaikan */
      }
      return n;
    });
  }, []);

  const gotoCue = useCallback(
    (dir: -1 | 1) => {
      if (cues.length === 0) return;
      // Kalau belum ada cue aktif, panah kiri/kanan mulai dari cue pertama.
      const base = activeIdx < 0 ? (dir === 1 ? -1 : 0) : activeIdx;
      const next = base + dir;
      if (next >= 0 && next < cues.length) seekTo(cues[next].start);
    },
    [activeIdx, cues, seekTo]
  );

  // Navigasi section pakai panah keyboard (abaikan saat mengetik).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Kiri/Bawah = section sebelumnya (mundur), Kanan/Atas = section berikutnya (maju).
      const prev = e.key === "ArrowLeft" || e.key === "ArrowDown";
      const next = e.key === "ArrowRight" || e.key === "ArrowUp";
      if (!prev && !next) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      e.preventDefault();
      gotoCue(next ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gotoCue]);

  // Penjaga fokus: begitu user klik video, fokus pindah ke IFRAME YouTube
  // (cross-origin) sehingga event keydown di window tak lagi terpicu — panah pun
  // "mati". Kembalikan fokus ke dokumen supaya navigasi section tetap jalan.
  // Hanya aktif saat player penuh (bukan mini) biar tak mengganggu scroll halaman.
  useEffect(() => {
    if (mini) return;
    const onBlur = () => {
      // Tunggu satu frame supaya document.activeElement sudah ter-update ke iframe.
      requestAnimationFrame(() => {
        const el = document.activeElement as HTMLElement | null;
        if (el && el.tagName === "IFRAME") el.blur();
      });
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [mini]);

  // Minta analisa kalimat (breakdown) untuk sebuah cue — lazy + dedup.
  const requestBreakdown = useCallback(
    (idx: number) => {
      const cue = cues[idx];
      if (!cue) return;
      setBreakdowns((prev) => {
        if (prev[idx] !== undefined) return prev;
        return { ...prev, [idx]: "loading" };
      });
      getSentenceBreakdown({ sentence: cue.target, langCode })
        .then((b) => setBreakdowns((prev) => ({ ...prev, [idx]: b })))
        .catch(() => setBreakdowns((prev) => ({ ...prev, [idx]: "error" })));
    },
    [cues, langCode]
  );

  // Saat mode Analisa aktif, ambil breakdown untuk cue yang sedang tayang.
  useEffect(() => {
    if (analyze && activeIdx >= 0 && breakdowns[activeIdx] === undefined) {
      requestBreakdown(activeIdx);
    }
  }, [analyze, activeIdx, breakdowns, requestBreakdown]);

  const onWordTap = useCallback(
    (e: React.MouseEvent, word: string, sentence: string, wordIdx?: number) => {
      e.stopPropagation();
      setAnchor({ word, sentence, x: e.clientX, y: e.clientY, wordIdx });
    },
    []
  );

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-[90] flex flex-col ${fullscreen && chromeHidden ? "cursor-none" : ""}`}
      style={{ backgroundColor: "rgba(6,9,10,0.96)" }}
    >
      {/* Header — judul + tombol kosakata + bahasa terjemahan + bahasa dipelajari + tutup.
          Di layar penuh: header lepas dari flow (absolute) di tepi ATAS & auto-hide —
          geser naik keluar layar saat chrome disembunyikan (kursor diam), muncul lagi
          saat kursor bergerak. Kontrol YouTube sudah dimatikan (controls:0) jadi header
          kita bebas menempati sudut atas: judul kiri, language selector kanan. */}
      <div className={fullscreen ? "absolute inset-x-0 top-0 z-40" : "shrink-0"}>
        <div
          className={`flex items-center gap-2 px-4 py-2.5 sm:px-6 ${
            fullscreen
              ? `bg-gradient-to-b from-black/80 to-transparent transition-all duration-300 ${
                  chromeHidden ? "pointer-events-none -translate-y-full opacity-0" : "translate-y-0 opacity-100"
                }`
              : ""
          }`}
        >
        {/* Judul dihapus — YouTube sudah menampilkan judul + channel-nya sendiri
            (kartu saat dijeda / sudut kiri-atas video), jadi judul kita redundan.
            Spacer ini menggantikan mr-auto agar kontrol tetap terdorong ke kanan. */}
        <div className="mr-auto" />

        {/* Jumlah kosakata yang disimpan di video ini → buka deck kosakata. */}
        {onOpenVocab && (
          <button
            onClick={onOpenVocab}
            className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            style={{ border: `1px solid ${BORDER}` }}
            title="Kosakata tersimpan dari video ini"
          >
            <Layers className="h-4 w-4" color={TEAL} />
            <span className="hidden sm:inline">Kosakata</span>
            {savedCount > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[11px] font-extrabold leading-none"
                style={{ backgroundColor: "rgba(26,158,158,0.2)", color: "#7FE0E0" }}
              >
                {savedCount}
              </span>
            )}
          </button>
        )}

        {/* Bahasa terjemahan (baris di bawah subtitle) — dropdown ganti cepat. */}
        {onChangeBaseLang && (
          <div className="relative shrink-0">
            <button
              onClick={() => setBaseMenuOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
              style={{ border: `1px solid ${BORDER}` }}
              title="Bahasa terjemahan di bawah subtitle"
            >
              <Languages className="h-4 w-4" color={GOLD} />
              <RectFlag code={getBaseLangDef(baseLang).country} h={16} />
              <span className="hidden sm:inline">{getBaseLangDef(baseLang).label}</span>
            </button>
            {baseMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBaseMenuOpen(false)} />
                <div
                  className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl py-1.5 shadow-2xl"
                  style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                >
                  {BASE_LANGS.map((b) => {
                    const on = b.code === baseLang;
                    return (
                      <button
                        key={b.code}
                        onClick={() => {
                          setBaseMenuOpen(false);
                          if (!on) onChangeBaseLang(b.code);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
                      >
                        <RectFlag code={b.country} h={16} />
                        <span className="flex-1 font-semibold text-white">{b.label}</span>
                        {on && <Check className="h-4 w-4" color={TEAL} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {onChangeLang &&
          (() => {
            const wl = getImmersionLang(langCode);
            return (
              <button
                onClick={onChangeLang}
                className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                style={{ border: `1px solid ${BORDER}` }}
                title="Ganti bahasa yang dipelajari"
              >
                {wl ? <RectFlag code={wl.country} h={16} /> : <Languages className="h-4 w-4" color={TEAL} />}
                <span className="hidden sm:inline">{wl?.name ?? langCode}</span>
              </button>
            );
          })()}
        <button
          onClick={onClose}
          className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
          aria-label="Tutup player"
        >
          <X className="h-5 w-5 text-white" />
        </button>
        </div>
      </div>

      {/* Isi — split view. Di layar penuh beri ruang atas (pt) supaya video +
          subtitle turun & tak tertutup baris header (judul kiri / tombol kanan). */}
      <div className={`flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row ${fullscreen ? "pt-14" : ""}`}>
        {/* Kiri: video + baris fokus + kontrol selalu terlihat (tak ikut scroll);
            HANYA daftar Rekomendasi di bawahnya yang punya area scroll sendiri —
            jadi tak ada scrollbar menimpa video. */}
        <div className={`flex min-h-0 flex-col ${fullscreen ? "relative " : ""}${showPanel ? "lg:w-[62%]" : "lg:w-full"}`}>
          {/* Container video: letterbox aman. Lebar penuh dibatasi tinggi (maxWidth
              dari 70vh) supaya saat panel disembunyikan/fullscreen video tak menutup
              layar & masih menyisakan ruang untuk subtitle + kontrol.
              [linguo-patch:watch-miniplayer-v1] Mode mini: elemen yang SAMA lepas
              dari flow jadi kotak melayang pojok kanan-bawah (iframe tak remount) —
              ruang yang ditinggalkan diisi daftar Rekomendasi. */}
          <div
            ref={miniBoxRef}
            className={
              mini
                ? "group fixed bottom-4 right-4 z-20 flex w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-black shadow-2xl"
                : fullscreen
                  ? "group relative flex min-h-0 w-full flex-1 items-center justify-center bg-black"
                  : "group relative flex w-full shrink-0 items-center justify-center bg-black"
            }
            style={
              mini
                ? miniPos
                  ? { left: miniPos.x, top: miniPos.y, right: "auto", bottom: "auto" }
                  : undefined
                : fullscreen
                  ? undefined
                  : { maxHeight: "70vh" }
            }
          >
            <div
              className="relative w-full"
              style={
                mini
                  ? { aspectRatio: "16 / 9" }
                  : fullscreen
                    ? { height: "100%", width: "100%" }
                    : { aspectRatio: "16 / 9", maxWidth: "calc(70vh * 16 / 9)" }
              }
            >
              <div ref={hostRef} className="absolute inset-0 h-full w-full" />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin" color={SUB} />
                </div>
              )}
              {/* Overlay drag SELURUH area video saat mini — iframe YouTube menelan
                  pointer, jadi tanpa lapisan ini video tak bisa diseret. Tombol strip
                  (z-10) tetap di atas overlay ini, jadi Kembalikan/Tutup tak terhalang. */}
              {mini && (
                <div
                  onPointerDown={onMiniDragStart}
                  onPointerMove={onMiniDragMove}
                  onPointerUp={onMiniDragEnd}
                  onPointerCancel={onMiniDragEnd}
                  className="absolute inset-0 z-[5] cursor-move touch-none"
                  aria-hidden
                />
              )}
            </div>
            {/* Kontrol mini — muncul saat hover: kembalikan ukuran / tutup player.
                Strip ini juga PEGANGAN DRAG: seret untuk memindah kotak mini. */}
            {mini && (
              <div
                onPointerDown={onMiniDragStart}
                onPointerMove={onMiniDragMove}
                onPointerUp={onMiniDragEnd}
                onPointerCancel={onMiniDragEnd}
                className="absolute inset-x-0 top-0 z-10 flex cursor-move touch-none items-center justify-end gap-1.5 bg-gradient-to-b from-black/70 to-transparent p-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              >
                <button
                  onClick={() => setMini(false)}
                  className="rounded-full bg-black/60 p-2 transition-colors hover:bg-black/85"
                  aria-label="Kembalikan ukuran video"
                  title="Kembalikan"
                >
                  <Maximize2 className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full bg-black/60 p-2 transition-colors hover:bg-black/85"
                  aria-label="Tutup player"
                  title="Tutup"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            )}
            {/* Subtitle ringkas di kotak mini — tetap bisa belajar sambil scroll.
                Bar ini juga bisa dipakai menyeret kotak mini. */}
            {mini && activeCue && (
              <div
                onPointerDown={onMiniDragStart}
                onPointerMove={onMiniDragMove}
                onPointerUp={onMiniDragEnd}
                onPointerCancel={onMiniDragEnd}
                className="cursor-move touch-none px-3 pb-2.5 pt-2 text-center"
                style={{ backgroundColor: "#0B0E0F" }}
              >
                {/* Mode mini: HANYA subtitle bahasa target — terjemahan disembunyikan
                    biar kotak ringkas & fokus (lihat penuh lagi setelah dikembalikan). */}
                <p className="line-clamp-2 text-[13px] font-bold text-white" dir={isRtl(langCode) ? "rtl" : undefined}>{activeCue.target}</p>
              </div>
            )}
          </div>

          {/* Baris fokus — kalimat aktif. Kini rekomendasi disembunyikan saat
              menonton penuh, jadi baris ini tumbuh (flex-1) & terpusat di ruang
              kosong antara video dan kontrol → subtitle turun & lebih lega. */}
          {!mini && (
          <div
            className={`flex flex-col overflow-y-auto ${
              fullscreen ? "shrink-0 bg-black px-4 pb-32 pt-3 sm:px-6" : "min-h-0 flex-1 py-2"
            }`}
          >
            {/* Subtitle nempel di bawah video (mb-auto dorong sisa ruang ke bawah)
                supaya baris kontrol terpisah jelas di dasar & tak menutupi
                terjemahan. Tetap bisa discroll kalau analisa bikin baris tinggi. */}
            <div className="mb-auto mt-2 w-full">
              <FocusLine
                cue={activeCue}
                time={time}
                langCode={langCode}
                baseLang={baseLang}
                baseTranslating={baseTranslating}
                analyze={analyze}
                breakdown={activeIdx >= 0 ? breakdowns[activeIdx] : undefined}
                onWordTap={onWordTap}
                onRetryAnalyze={() => activeIdx >= 0 && requestBreakdown(activeIdx)}
                txState={txState}
                asrRunning={asrRunning}
                scale={fscale}
              />
            </div>
          </div>
          )}

          {/* Kontrol — di mobile jadi SATU baris yang bisa digeser mendatar (tak
              lagi membungkus jadi 3 baris berantakan); di ≥sm kembali membungkus. */}
          {!mini && (
          <div
            className={`flex items-center gap-2 overflow-x-auto border-t px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-6 [&::-webkit-scrollbar]:hidden ${
              fullscreen
                ? `absolute inset-x-0 bottom-0 z-40 justify-center bg-black transition-all duration-300 ${
                    chromeHidden ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
                  }`
                : "shrink-0"
            }`}
            style={{ borderColor: BORDER }}
          >
            {/* Kontrol putar/jeda/loncat & ulang kalimat DIHAPUS — pakai kontrol
                bawaan YouTube di video; navigasi section tetap bisa via panah
                keyboard. Sisakan hanya tombol belajar. */}
            {/* Analisa */}
            <button
              onClick={() => setAnalyze((v) => !v)}
              disabled={txState !== "ready"}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors disabled:opacity-40"
              style={{
                backgroundColor: analyze ? TEAL : CARD,
                border: `1px solid ${analyze ? TEAL : BORDER}`,
                color: "#fff",
              }}
            >
              <Palette className="h-4 w-4" /> Analisa
            </button>

            {/* Kecepatan */}
            <button
              onClick={() => applySpeed((speedIdx + 1) % SPEEDS.length)}
              className="shrink-0 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: "#fff" }}
            >
              {SPEEDS[speedIdx]}x
            </button>

            {/* Kualitas video — kontrol bawaan YouTube dimatikan, jadi ini jalan
                sendiri untuk turunkan resolusi (hemat paket data). Best-effort. */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  refreshQualityLevels();
                  setQualityMenuOpen((v) => !v);
                }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: "#fff" }}
                title="Kualitas video (hemat paket data)"
              >
                <Gauge className="h-4 w-4" /> {qualityLabel(quality)}
              </button>
              {qualityMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setQualityMenuOpen(false)} />
                  <div
                    className="absolute bottom-full left-0 z-20 mb-2 max-h-64 w-40 overflow-y-auto rounded-2xl py-1.5 shadow-2xl"
                    style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                  >
                    {["auto", ...qualityLevels].map((lv) => {
                      const on = lv === quality;
                      return (
                        <button
                          key={lv}
                          onClick={() => applyQuality(lv)}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
                        >
                          <span className="flex-1 font-semibold text-white">{qualityLabel(lv)}</span>
                          {on && <Check className="h-4 w-4" color={TEAL} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* CC bawaan YouTube — berguna saat transkrip kita tak ada */}
            <button
              onClick={() => setShowCC((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
              style={{
                backgroundColor: showCC ? "rgba(26,158,158,0.16)" : CARD,
                border: `1px solid ${showCC ? TEAL : BORDER}`,
                color: showCC ? TEAL : "#fff",
              }}
            >
              CC
            </button>

            {/* Ukuran teks subtitle & transkrip — Kecil / Sedang / Besar */}
            <button
              onClick={cycleFont}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: "#fff" }}
              title="Ukuran teks subtitle"
            >
              <Type className="h-4 w-4" /> {FONT_LEVELS[fontIdx].label}
            </button>

            {/* Tampil/sembunyikan panel transkrip di kanan — berguna di fullscreen
                buat memberi video ruang lebih atau memunculkan transkrip per-baris. */}
            <button
              onClick={() => setShowPanel((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
              style={{
                backgroundColor: showPanel ? "rgba(26,158,158,0.16)" : CARD,
                border: `1px solid ${showPanel ? TEAL : BORDER}`,
                color: showPanel ? TEAL : "#fff",
              }}
              title={showPanel ? "Sembunyikan transkrip" : "Tampilkan transkrip"}
            >
              {showPanel ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
              Transkrip
            </button>

            {/* Rekomendasi — video mengecil melayang di pojok (miniplayer) sehingga
                daftar rekomendasi muncul mengisi kolom kiri & bisa discroll. */}
            <button
              onClick={enterMini}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: "#fff" }}
              title="Kecilkan video & tampilkan rekomendasi"
            >
              <ListVideo className="h-4 w-4" /> Rekomendasi
            </button>

            {/* Fullscreen player kita (bukan iframe) — subtitle & transkrip tetap ada. */}
            <button
              onClick={toggleFullscreen}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: "#fff" }}
              title={fullscreen ? "Keluar layar penuh" : "Layar penuh"}
            >
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              {fullscreen ? "Keluar" : "Layar penuh"}
            </button>
          </div>
          )}

          {/* Rekomendasi video — HANYA muncul saat miniplayer (video mengecil).
              Klik untuk langsung memutar video lain tanpa keluar player.
              Saat mini, daftar ini yang mengisi seluruh kolom kiri; saat menonton
              penuh sengaja disembunyikan agar subtitle + kontrol lebih lega. */}
          {mini && recList.length > 0 && onSelectVideo && (
            <div
              className="min-h-0 flex-1 overflow-y-auto border-t [scrollbar-width:thin]"
              style={{ borderColor: BORDER }}
            >
              <p className="px-4 pb-1 pt-3 text-[13px] font-extrabold text-white sm:px-6">
                Rekomendasi
              </p>
              <div className="px-2 pb-4 sm:px-4">
                {recList.slice(0, recShown).map((v) => (
                  <button
                    key={v.videoId}
                    onClick={() => onSelectVideo(v)}
                    className="flex w-full gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/5"
                  >
                    <div
                      className={`relative aspect-video shrink-0 self-start overflow-hidden rounded-lg bg-black ${
                        mini ? "w-44 sm:w-56" : "w-40"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={v.thumbnail ?? youtubeThumb(v.videoId)}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      {formatDuration(v.duration) && (
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                          {formatDuration(v.duration)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-bold leading-snug text-white">
                        {v.title}
                      </p>
                      {v.channel && (
                        <p className="mt-1 line-clamp-1 text-[11.5px]" style={{ color: SUB }}>
                          {v.channel}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
                {(recList.length > recShown || related?.next) && (
                  <div className="mt-2 flex justify-center pb-2">
                    <button
                      onClick={loadMoreRecs}
                      disabled={recLoading}
                      className="rounded-full px-5 py-2.5 text-[13px] font-bold transition-transform active:scale-95 disabled:opacity-60"
                      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: "#fff" }}
                    >
                      {recLoading ? "Memuat…" : "Muat lainnya"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Kanan: transkrip penuh — bisa disembunyikan lewat tombol Transkrip. */}
        {showPanel && (
        <div
          className="flex min-h-0 flex-1 flex-col border-t lg:border-l lg:border-t-0"
          style={{ borderColor: BORDER }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 sm:px-5"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <ListChecks className="h-4 w-4" color={TEAL} />
            <p className="text-[13px] font-extrabold text-white">Transkrip</p>
            <span className="text-[11.5px]" style={{ color: SUB }}>
              {txState === "ready" ? `${cues.length} baris` : ""}
            </span>
            {translitLoading && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: SUB }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Menyiapkan bacaan Latin…
              </span>
            )}
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 [scrollbar-width:thin]"
          >
            {txState === "loading" && (
              <div className="flex items-start gap-2 px-2 py-6" style={{ color: SUB }}>
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                <span className="text-[13px] leading-relaxed">
                  {asrRunning
                    ? "Membuat subtitle dengan AI… ini bisa memakan waktu sekitar 1 menit. Kamu bisa tetap menonton dulu."
                    : "Memuat transkrip…"}
                </span>
              </div>
            )}
            {txState === "none" && (
              <div className="flex flex-col items-start gap-3 px-2 py-6 text-[13px] leading-relaxed" style={{ color: SUB }}>
                {txReason === "not_ready" ? (
                  <>
                    <span>
                      {genFail === "cap"
                        ? "Kuota pembuatan subtitle AI hari ini sudah penuh — coba lagi besok ya. Sementara itu subtitle bawaan YouTube (CC) sudah dinyalakan supaya kamu tetap bisa belajar."
                        : genFail === "timeout"
                          ? "Subtitle AI-nya masih diproses lebih lama dari biasanya. Subtitle bawaan YouTube (CC) sudah dinyalakan — coba muat ulang sebentar lagi."
                          : "Gagal memulai pembuatan subtitle AI (bisa jadi sesaat). Subtitle bawaan YouTube (CC) sudah dinyalakan — coba lagi ya."}
                    </span>
                    {genFail !== "cap" && (
                      <button
                        type="button"
                        onClick={() => setRetryTick((n) => n + 1)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
                        style={{ backgroundColor: "rgba(26,158,158,0.14)", color: TEAL, border: "1px solid rgba(26,158,158,0.4)" }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Coba lagi
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span>
                      {txReason === "no_captions"
                        ? "Transkrip interaktif belum bisa disiapkan untuk video ini. Subtitle bawaan YouTube (CC) sudah dinyalakan supaya kamu tetap bisa belajar sambil menonton."
                        : "Pembuatan transkrip sempat gagal (bisa jadi sesaat). Subtitle bawaan YouTube (CC) sudah dinyalakan — kamu bisa coba siapkan transkrip interaktif lagi."}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRetryTick((n) => n + 1)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
                      style={{ backgroundColor: "rgba(26,158,158,0.14)", color: TEAL, border: "1px solid rgba(26,158,158,0.4)" }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Coba lagi
                    </button>
                  </>
                )}
              </div>
            )}
            {txState === "ready" &&
              cues.map((c, i) => {
                const on = i === activeIdx;
                // [watch-word-align-v1] ordinal kata target/terjemahan yang menyala.
                const hs = hotSets(i);
                const am = alignMaps[i];
                return (
                  <div
                    key={i}
                    data-cue={i}
                    onClick={() => seekTo(c.start)}
                    className="cursor-pointer rounded-xl px-3 py-2.5 transition-colors"
                    style={{
                      backgroundColor: on ? "rgba(26,158,158,0.14)" : "transparent",
                    }}
                  >
                    {on ? (
                      <KaraokeText
                        cue={c}
                        time={time}
                        langCode={langCode}
                        onWordTap={onWordTap}
                        hoveredK={hoverWord?.i === i ? hoverWord.k : null}
                        hotKeys={hs.t}
                        onHoverWord={(k) => {
                          if (k == null) setHoverWord(null);
                          else {
                            setHoverWord({ i, k });
                            ensureAlign(i);
                          }
                        }}
                        className="font-semibold leading-snug"
                        fontSize={14 * fscale}
                      />
                    ) : (
                      <p
                        className="font-semibold leading-snug text-white"
                        dir={isRtl(langCode) ? "rtl" : undefined}
                        // Aksara RTL tetap dir="rtl" (bidi & posisi "…" benar) tapi
                        // rata KIRI biar sejajar dgn transliterasi & terjemahan di
                        // bawahnya — satu tepi kiri, rapi.
                        style={{ fontSize: 14 * fscale, textAlign: isRtl(langCode) ? "left" : undefined }}
                      >
                        {(() => {
                          // k = indeks-urut kata (di antara token kata) → kunci sinkron
                          // hover dengan token transliterasi / terjemahan di baris ini.
                          let k = -1;
                          return splitWords(c.target, langCode).map((w, j) => {
                            if (!w.isWord) return <span key={j}>{w.text}</span>;
                            const wk = ++k;
                            const hot = hs.t.has(wk);
                            return (
                              <span
                                key={j}
                                onClick={(e) => onWordTap(e, w.text, c.target, j)}
                                onMouseEnter={() => {
                                  setHoverWord({ i, k: wk });
                                  ensureAlign(i);
                                }}
                                onMouseLeave={() => setHoverWord(null)}
                                className="cursor-pointer transition-colors"
                                style={hot ? SYNC_UNDERLINE : undefined}
                              >
                                {w.text}
                              </span>
                            );
                          });
                        })()}
                      </p>
                    )}
                    {c.translit && (
                      <TranslitLine
                        target={c.target}
                        translit={c.translit}
                        langCode={langCode}
                        hoveredK={hoverWord?.i === i ? hoverWord.k : null}
                        onHover={(k) => setHoverWord(k == null ? null : { i, k })}
                        className="mt-0.5 italic"
                        style={{ color: "#fff", fontSize: 12 * fscale }}
                      />
                    )}
                    {c.base &&
                      (alignEnabled ? (
                        <p
                          className="mt-0.5 font-semibold"
                          style={{ color: GOLD, fontSize: 12.5 * fscale }}
                          dir={isRtl(baseLang) ? "rtl" : undefined}
                        >
                          {(() => {
                            // Kata terjemahan bisa di-hover → menyorot kata/frasa
                            // target-nya (dan sebaliknya) lewat peta penjajaran.
                            let bk = -1;
                            return splitWords(c.base, baseLang).map((w, j) => {
                              if (!w.isWord) return <span key={j}>{w.text}</span>;
                              const wk = ++bk;
                              const hot = hs.b.has(wk);
                              const gi = am?.bGroup[wk];
                              const linked = am && gi != null && gi >= 0 && am.firstT[gi] >= 0;
                              return (
                                <span
                                  key={j}
                                  onMouseEnter={() => {
                                    ensureAlign(i);
                                    if (linked) setHoverWord({ i, k: am!.firstT[gi!] });
                                  }}
                                  onMouseLeave={() => setHoverWord(null)}
                                  className="transition-colors"
                                  style={{
                                    ...(hot ? SYNC_UNDERLINE : null),
                                    cursor: linked ? "pointer" : undefined,
                                  }}
                                >
                                  {w.text}
                                </span>
                              );
                            });
                          })()}
                        </p>
                      ) : (
                        <p
                          className="mt-0.5 font-semibold"
                          style={{ color: GOLD, fontSize: 12.5 * fscale }}
                          dir={isRtl(baseLang) ? "rtl" : undefined}
                        >
                          {c.base}
                        </p>
                      ))}
                  </div>
                );
              })}
          </div>
        </div>
        )}
      </div>

      {anchor && (
        <WordTooltip
          word={anchor.word}
          sentence={anchor.sentence}
          wordIdx={anchor.wordIdx}
          langCode={langCode}
          videoId={video.videoId}
          x={anchor.x}
          y={anchor.y}
          onClose={() => setAnchor(null)}
          onSavedChange={handleSaved}
        />
      )}
    </div>
  );
}

// ── Baris fokus (kalimat aktif di bawah video) ────────────────────────────────
function FocusLine({
  cue,
  time,
  langCode,
  baseLang,
  baseTranslating,
  analyze,
  breakdown,
  onWordTap,
  onRetryAnalyze,
  txState,
  asrRunning,
  scale,
}: {
  cue: LearnCue | null;
  time: number;
  langCode?: string;
  baseLang?: string;
  baseTranslating?: boolean;
  analyze: boolean;
  breakdown: SentenceBreakdown | "loading" | "error" | undefined;
  onWordTap: (e: React.MouseEvent, word: string, sentence: string, wordIdx?: number) => void;
  onRetryAnalyze: () => void;
  txState: "loading" | "ready" | "none";
  asrRunning: boolean;
  scale: number;
}) {
  if (txState !== "ready") {
    return (
      <div className="flex min-h-[92px] items-center justify-center px-6 py-4 text-center">
        <p className="text-[13px]" style={{ color: SUB }}>
          {txState === "loading"
            ? asrRunning
              ? "Membuat subtitle dengan AI… (~1 menit)"
              : "Menyiapkan subtitle…"
            : "Menonton dengan subtitle bawaan YouTube."}
        </p>
      </div>
    );
  }
  if (!cue) {
    return (
      <div className="flex min-h-[92px] items-center justify-center px-6 py-4 text-center">
        <p className="text-[13px]" style={{ color: SUB }}>
          Tekan play — subtitle akan muncul mengikuti audio. Ketuk kata mana pun untuk artinya.
        </p>
      </div>
    );
  }

  // Mode Analisa: tampilkan token berwarna + terjemahan akurat (rata tengah,
  // konsisten dengan mode normal).
  if (analyze) {
    return (
      <div className="min-h-[92px] px-5 py-4 text-center sm:px-6">
        {breakdown === "loading" || breakdown === undefined ? (
          <div className="flex items-center justify-center gap-2" style={{ color: SUB }}>
            <Loader2 className="h-4 w-4 animate-spin" /> Menganalisa kalimat…
          </div>
        ) : breakdown === "error" ? (
          <button onClick={onRetryAnalyze} className="text-[13px] font-bold" style={{ color: TEAL }}>
            Gagal menganalisa — ketuk untuk coba lagi
          </button>
        ) : (
          <>
            <div
              className="flex flex-wrap items-end justify-center gap-x-2 gap-y-2"
              dir={isRtl(langCode ?? "") ? "rtl" : undefined}
            >
              {breakdown.tokens.map((t, i) => (
                <span
                  key={i}
                  onClick={(e) => onWordTap(e, t.word, cue.target)}
                  className="cursor-pointer text-center"
                >
                  <span
                    className="block font-extrabold leading-tight"
                    style={{ color: POS_COLOR[t.cat], fontSize: 21 * scale }}
                  >
                    {t.word}
                  </span>
                  {t.translit && (
                    <span
                      className="block italic leading-tight"
                      style={{ color: "#fff", fontSize: 11 * scale }}
                    >
                      {t.translit}
                    </span>
                  )}
                  <span className="block text-[10px] font-semibold" style={{ color: SUB }}>
                    {POS_LABEL_ID[t.cat]}
                  </span>
                </span>
              ))}
            </div>
            {breakdown.translation && (
              <p className="mt-2.5 font-bold" style={{ color: GOLD, fontSize: 14 * scale }}>
                {breakdown.translation}
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  // Mode normal: kalimat target besar (bisa di-tap) + translit + terjemahan emas.
  // Kata yang sedang diucapkan disorot ala karaoke (tersapu teal kiri→kanan).
  return (
    <div className="min-h-[92px] px-5 py-4 text-center sm:px-6">
      <KaraokeText
        cue={cue}
        time={time}
        langCode={langCode}
        onWordTap={onWordTap}
        className="font-extrabold leading-snug"
        fontSize={22 * scale}
        center
      />
      {cue.translit && (
        <p className="mt-1 italic" style={{ color: "#fff", fontSize: 13 * scale }}>
          {cue.translit}
        </p>
      )}
      {cue.base ? (
        <p
          className="mt-1.5 font-bold"
          style={{ color: GOLD, fontSize: 16 * scale }}
          dir={isRtl(baseLang ?? "") ? "rtl" : undefined}
        >
          {cue.base}
        </p>
      ) : baseTranslating && baseLang !== DEFAULT_BASE_LANG ? (
        <p className="mt-1.5 font-semibold italic opacity-70" style={{ color: GOLD, fontSize: 13 * scale }}>
          Menerjemahkan…
        </p>
      ) : null}
    </div>
  );
}

// ── Sinkron hover transliterasi ────────────────────────────────────────────────
// [linguo-patch:watch-translit-hover-sync-v1] Bacaan Latin (translit) disimpan per
// BARIS (satu string), bukan per kata. Untuk menyorot token translit yang pas saat
// kata target di-hover, kita selaraskan BERDASARKAN URUTAN: kata ke-k pada target ↔
// token translit ke-k. Ini bersih untuk bahasa yang translit-nya memisah kata pakai
// spasi (Georgia, Rusia, Yunani, dll). Kalau jumlah tak sama (mis. sebagian pinyin
// China menggabung suku kata), kita TAK menyorot apa pun daripada salah sorot →
// kembalikan null dan translit dirender polos seperti sebelumnya.

function alignTranslitTokens(
  target: string,
  translit: string,
  langCode?: string
): { text: string; k: number }[] | null {
  const wordCount = splitWords(target, langCode).filter((w) => w.isWord).length;
  // Pertahankan pemisah (spasi) sebagai token sendiri biar spasi asli translit utuh.
  const pieces = translit.split(/(\s+)/).filter((p) => p.length);
  const wordPieces = pieces.filter((p) => p.trim().length);
  if (!wordCount || wordCount !== wordPieces.length) return null;
  let k = -1;
  return pieces.map((p) => (p.trim().length ? { text: p, k: ++k } : { text: p, k: -1 }));
}

// Baris transliterasi dengan token yang bisa disorot sinkron dengan kata target.
// `hoveredK` = indeks-urut kata yang sedang di-hover (dari kata target ATAU dari
// token translit ini sendiri); `onHover` mengabarkan balik ke induk supaya kata
// target ikut menyala. Kalau translit tak bisa diselaraskan, render polos.
function TranslitLine({
  target,
  translit,
  langCode,
  hoveredK,
  onHover,
  className,
  style,
}: {
  target: string;
  translit: string;
  langCode?: string;
  hoveredK: number | null;
  onHover: (k: number | null) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const toks = useMemo(
    () => alignTranslitTokens(target, translit, langCode),
    [target, translit, langCode]
  );
  if (!toks) {
    return (
      <p className={className} style={style}>
        {translit}
      </p>
    );
  }
  return (
    <p className={className} style={style}>
      {toks.map((t, idx) =>
        t.k < 0 ? (
          <span key={idx}>{t.text}</span>
        ) : (
          <span
            key={idx}
            onMouseEnter={() => onHover(t.k)}
            onMouseLeave={() => onHover(null)}
            className="transition-colors"
            style={hoveredK === t.k ? SYNC_UNDERLINE : undefined}
          >
            {t.text}
          </span>
        )
      )}
    </p>
  );
}

// ── Efek karaoke ──────────────────────────────────────────────────────────────
// Cue transkrip hanya punya timing per-baris (start/end), tak ada per kata. Jadi
// durasi baris didistribusikan ke tiap token proporsional dengan panjang
// karakter — perkiraan tempo bicara yang cukup baik. Tiap token dapat status:
// "sung" (sudah lewat), "active" (sedang diucapkan, dengan progress 0..1), atau
// "future" (belum).
type KaraokeState = "sung" | "active" | "future";

// Perkiraan detik-per-karakter untuk kecepatan bicara natural. Dipakai membatasi
// durasi sapuan karaoke: caption & transkrip AI (yt-asr) kadang MENAHAN satu baris
// di layar lebih lama dari durasi ucapan sebenarnya (jeda/hening di akhir, segmen
// ASR yang kelewat panjang). Tapi ini cuma pengaman untuk window yang JELAS
// kepanjangan — tempo utama tetap dari durasi window caption/ASR (lihat SPEECH_CAP_FACTOR).
const CJK_RE = /[぀-ヿ㐀-鿿가-힯]/;
function estSpeechDur(text: string): number {
  const chars = text.length || 1;
  // Aksara CJK jauh lebih padat (sedikit karakter per detik) dari Latin.
  const secPerChar = CJK_RE.test(text) ? 0.2 : 0.075;
  return chars * secPerChar;
}

// Ambang toleransi cap: window caption/ASR baru "direm" ke perkiraan bicara kalau
// panjangnya > FACTOR × perkiraan. Longgar (1.8×) supaya konten yang diucap PELAN
// (mis. berita "langsam gesprochen") — yang window-nya wajar lebih panjang dari
// perkiraan tempo normal — TIDAK tersapu lebih cepat dari audio ("kecepeten").
// Cap tetap menangkap baris yang benar-benar kepanjangan (hening panjang di akhir).
const SPEECH_CAP_FACTOR = 1.8;

function karaokeTokens(
  cue: LearnCue,
  time: number,
  langCode?: string
): { text: string; isWord: boolean; state: KaraokeState; progress: number }[] {
  const toks = splitWords(cue.target, langCode);
  const total = cue.target.length || 1;
  const windowDur = Math.max(0.001, cue.end - cue.start);
  // Durasi efektif = window caption/ASR SEBENARNYA (tempo paling akurat), kecuali
  // window itu jauh lebih panjang dari perkiraan bicara (hening/segmen kepanjangan)
  // — baru saat itu direm ke perkiraan × FACTOR. Ambang longgar ini bikin baris yang
  // diucap pelan tetap tersapu sepanjang audio-nya, tak mendahului ("kecepeten").
  const cap = estSpeechDur(cue.target) * SPEECH_CAP_FACTOR;
  const dur = Math.max(0.4, windowDur > cap ? cap : windowDur);
  const frac = Math.min(1, Math.max(0, (time - cue.start) / dur));
  const played = frac * total; // jumlah karakter yang "sudah" terucap
  let acc = 0;
  return toks.map((t) => {
    const startC = acc;
    const endC = acc + t.text.length;
    acc = endC;
    let state: KaraokeState = "future";
    let progress = 0;
    if (endC <= played) state = "sung";
    else if (startC < played) {
      state = "active";
      progress = (played - startC) / Math.max(1, t.text.length);
    }
    return { text: t.text, isWord: t.isWord, state, progress };
  });
}

function KaraokeWord({
  text,
  state,
  progress,
  rtl,
  onClick,
  hovered,
  onHover,
}: {
  text: string;
  state: KaraokeState;
  progress: number;
  rtl?: boolean;
  onClick: (e: React.MouseEvent) => void;
  // [linguo-patch:watch-translit-hover-sync-v1] hover jarak-jauh: token translit
  // yang bersesuaian di-hover → kata ini ikut menyala (dan sebaliknya via onHover).
  hovered?: boolean;
  onHover?: (h: boolean) => void;
}) {
  const active = state === "active";
  const pct = state === "sung" ? 100 : active ? Math.round(progress * 100) : 0;
  // Lapisan teal ditumpuk PAS di atas lapisan dasar (lebar 100%, posisi sama) lalu
  // dipangkas pakai clip-path — jadi glyph selalu sejajar (tak melenceng seperti
  // kalau lebar overlay dikecilkan). Aksara RTL disapu dari KANAN (awal kata Arab)
  // → pangkas dari kiri; Latin disapu dari kiri → pangkas dari kanan.
  const hide = 100 - pct;
  const clip = rtl ? `inset(0 0 0 ${hide}%)` : `inset(0 ${hide}% 0 0)`;
  return (
    <span
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className="relative mx-[1px] inline-block cursor-pointer align-baseline transition-transform duration-200 hover:[text-decoration-line:underline] hover:[text-decoration-color:#1A9E9E] hover:[text-decoration-thickness:2px] hover:[text-underline-offset:3px]"
      style={{
        transform: active ? "translateY(-1px) scale(1.05)" : "none",
        ...(hovered ? SYNC_UNDERLINE : null),
      }}
    >
      {/* lapisan dasar — belum diucapkan (putih) */}
      <span style={{ color: "#fff" }}>{text}</span>
      {/* lapisan terisi — sudah diucapkan (teal), dipangkas mengikuti progres */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 w-full overflow-hidden whitespace-nowrap"
        style={{
          color: TEAL,
          clipPath: clip,
          WebkitClipPath: clip,
          transition: "clip-path 220ms linear, -webkit-clip-path 220ms linear",
          textShadow: active ? "0 0 16px rgba(26,158,158,0.55)" : "none",
        }}
      >
        {text}
      </span>
    </span>
  );
}

function KaraokeText({
  cue,
  time,
  langCode,
  onWordTap,
  hoveredK,
  hotKeys,
  onHoverWord,
  className,
  fontSize,
  center,
}: {
  cue: LearnCue;
  time: number;
  langCode?: string;
  onWordTap: (e: React.MouseEvent, word: string, sentence: string, wordIdx?: number) => void;
  // [linguo-patch:watch-translit-hover-sync-v1] sinkron hover dengan baris translit
  // (opsional — bar subtitle di bawah tak mengoper ini, jatuh ke hover CSS biasa).
  hoveredK?: number | null;
  // [watch-word-align-v1] ordinal kata yang harus menyala (frasa penjajaran utuh).
  hotKeys?: Set<number> | null;
  onHoverWord?: (k: number | null) => void;
  className?: string;
  fontSize?: number;
  center?: boolean;
}) {
  const toks = useMemo(() => karaokeTokens(cue, time, langCode), [cue, time, langCode]);
  const rtl = isRtl(langCode ?? "");
  // Indeks-urut kata (di antara token kata) untuk menyelaraskan hover dengan token
  // transliterasi. Dihitung sekali; `wordK[j]` = k untuk token ke-j (−1 kalau bukan kata).
  const wordK = useMemo(() => {
    let k = -1;
    return toks.map((t) => (t.isWord ? ++k : -1));
  }, [toks]);
  // Tiap kata dibungkus inline-block (butuh position:relative buat overlay karaoke).
  // Urutan antar-kata TIDAK boleh mengandalkan algoritma bidi atas kotak inline-block:
  // Chrome & Safari menyusunnya BERBEDA (bikin baris karaoke kebalik di Safari). Jadi
  // pakai FLEXBOX + `direction` — urutan flex item ditentukan spec (deterministik lintas
  // browser): rtl → kata pertama di kanan. justify-content atur perataan (tengah utk
  // baris fokus, awal/kanan utk baris transkrip).
  return (
    <p
      className={className}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        direction: rtl ? "rtl" : "ltr",
        // Baris fokus di panel harus rata KIRI (sejajar translit & terjemahan).
        // Pada flex direction:rtl, main-start ada di KANAN — jadi "flex-end" yang
        // justru merapatkan ke KIRI. Overlay bawah tetap center (tak berubah).
        justifyContent: center ? "center" : rtl ? "flex-end" : "flex-start",
        ...(fontSize ? { fontSize } : {}),
      }}
    >
      {toks.map((t, j) =>
        t.isWord ? (
          <KaraokeWord
            key={j}
            text={t.text}
            state={t.state}
            progress={t.progress}
            rtl={rtl}
            onClick={(e) => onWordTap(e, t.text, cue.target, j)}
            hovered={(hotKeys?.has(wordK[j]) ?? false) || (hoveredK != null && hoveredK === wordK[j])}
            onHover={(h) => onHoverWord?.(h ? wordK[j] : null)}
          />
        ) : (
          <span
            key={j}
            className="whitespace-pre"
            style={{
              color: t.state === "future" ? "#fff" : TEAL,
              transition: "color 220ms linear",
            }}
          >
            {t.text}
          </span>
        )
      )}
    </p>
  );
}

