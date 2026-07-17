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
  Pause,
  Play,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Type,
  X,
} from "lucide-react";
import {
  BASE_LANGS,
  canLookupWord,
  cleanWord,
  countSavedForVideo,
  getBaseLangDef,
  isWatchPremium,
  processTranscript,
  recordWordLookup,
  DEFAULT_BASE_LANG,
  getAlignment,
  type AlignGroup,
  getCachedWordMeaning,
  getSentenceBreakdown,
  getStudyHistory,
  recordStudyHistory,
  clearStudyHistory,
  StudyHistoryItem,
  isFreshBreakdown,
  isNonLatin,
  isRtl,
  karaokeFrac,
  LearnCue,
  POS_COLOR,
  POS_LABEL_ID,
  prewarmBreakdowns,
  primeBreakdownCache,
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
import WatchSubscribeModal from "./WatchSubscribeModal";
import { RectFlag } from "@/components/RectFlag";
import { useOverlayLock } from "@/lib/overlayStore";

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
// Gold redup untuk arti per-kata di mode Analisa — se-keluarga dengan terjemahan
// kalimat (GOLD terang) tapi jelas subordinat, biar hierarki baca enak.
const GOLD_DIM = "rgba(244,183,64,0.72)";
const CARD = "#161A1C";
const BORDER = "rgba(255,255,255,0.08)";

// Label tombol header (Kosakata / bahasa) — tersembunyi (lebar 0) secara default
// sehingga tombol hanya menampilkan ikon; saat hover teksnya "keluar" dari kanan
// ke kiri (lebar & opasitas melebar, geser translate-x → 0).
const REVEAL_LABEL =
  "max-w-0 translate-x-1 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:ml-2 group-hover:max-w-[180px] group-hover:translate-x-0 group-hover:opacity-100";

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

// Jam pemutaran m:ss (atau h:mm:ss utk >1 jam) — untuk label waktu di slider seek.
// Beda dari formatDuration (yg kembalikan "" saat 0): di sini 0 → "0:00".
function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

const SPEEDS = [1, 0.75, 0.5, 1.25];

// [watch-rec-search-v1] Chip saran pencarian di panel Rekomendasi. `label` tampil
// ke pelajar; `q` kata kunci yang dikirim (digabung nama native bahasa saat cari,
// jadi "podcast" → "podcast Suomi" untuk pelajar Finlandia). Kata kunci sengaja
// generik/Inggris karena itu yang paling andal dikenali pencarian YouTube.
const REC_SUGGESTIONS: { label: string; q: string }[] = [
  { label: "Podcast", q: "podcast" },
  { label: "Berita", q: "news" },
  { label: "Musik", q: "music" },
  { label: "Vlog", q: "vlog" },
  { label: "Film", q: "movie" },
  { label: "Kartun", q: "cartoon" },
  { label: "Wawancara", q: "interview" },
  { label: "Memasak", q: "cooking" },
  { label: "Komedi", q: "comedy" },
  { label: "Olahraga", q: "sports" },
];

// Ukuran teks subtitle/transkrip yang bisa dipilih siswa (disimpan lokal).
const FONT_LEVELS = [
  { label: "Kecil", scale: 0.85 },
  { label: "Sedang", scale: 1 },
  { label: "Besar", scale: 1.2 },
];
const FONT_KEY = "linguo:watch:fontsize:v1";

// [watch-sync-offset-v1] Nudge manual sinkron subtitle↔audio. Timestamp dari ASR/
// caption YouTube kadang meleset maju/mundur untuk video tertentu, jadi sorotan &
// baris fokus terasa "ga sinkron". Tombol ± menggeser semua highlight; disimpan
// per-video di lokal. Positif = subtitle MAJU (muncul lebih awal dari audio).
const SYNC_STEP = 0.25; // detik per klik
const SYNC_MAX = 10; // batas geser (detik)
const syncKeyFor = (videoId: string, langCode: string) => `linguo:watch:sync:v1:${videoId}:${langCode}`;

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

// [watch-toolbar-iconify-v1] Tombol kontrol bar bawah: tampil ringkas sebagai
// glyph (ikon untuk aksi, atau teks nilai singkat seperti "1x"/"Auto"/"Besar"
// untuk tombol bernilai) tanpa outline. Saat hover, label meluncur masuk dari
// kanan ke kiri (kolom grid 0fr→1fr + translate/opacity). `active` menandai
// status nyala pakai warna teal + latar teal tipis, bukan garis tepi.
function ToolButton({
  glyph,
  label,
  onClick,
  active = false,
  disabled = false,
  title,
}: {
  glyph: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      className="group inline-flex shrink-0 items-center rounded-full px-2.5 py-2 transition-colors hover:bg-white/10 disabled:opacity-40"
      style={{
        color: active ? TEAL : "#fff",
        backgroundColor: active ? "rgba(26,158,158,0.16)" : "transparent",
      }}
    >
      <span className="grid h-5 min-w-5 place-items-center text-[13px] font-bold leading-none">
        {glyph}
      </span>
      {/* Wadah lebar 0 → auto (grid fr) supaya label mendorong keluar mulus. */}
      <span className="grid grid-cols-[0fr] overflow-hidden transition-[grid-template-columns] duration-300 ease-out group-hover:grid-cols-[1fr]">
        <span className="min-w-0 overflow-hidden">
          <span className="block translate-x-2 whitespace-nowrap pl-1.5 text-[13px] font-bold leading-none opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100">
            {label}
          </span>
        </span>
      </span>
    </button>
  );
}

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
  // Langsung buka drawer Analisa (dibuka ulang dari riwayat kata, bukan tap baru).
  autoStudy?: boolean;
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
  initialStart,
}: {
  video: ImmersionVideo;
  langCode: string;
  /** Bahasa terjemahan di bawah subtitle ("kamu bicara bahasa apa?"). */
  baseLang?: string;
  /** Detik awal pemutaran — dipakai saat dibuka dari "Cari Kata" (lompat ke
   *  momen kata diucapkan). */
  initialStart?: number;
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
  // Durasi total video (detik) dari YT API — untuk slider seek + label waktu.
  const [duration, setDuration] = useState(0);
  // Sedang menyeret slider seek → tampilkan posisi seret (bukan waktu play) supaya
  // handle tak "melompat balik" oleh loop interpolasi waktu saat jari masih menahan.
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubVal, setScrubVal] = useState(0);
  // Hover di slider → bekukan posisi lingkaran penanda (tak ikut jalan playback)
  // supaya mudah "dibidik" & di-drag, meski video terus jalan. `hoverSeek` menyimpan
  // detik saat mulai hover; null = tidak sedang hover.
  const [hoverSeek, setHoverSeek] = useState<number | null>(null);
  // [watch-video-idle-v1] Kursor aktif di atas video → tampilkan slider + tombol
  // "Video lainnya". Setelah kursor DIAM beberapa detik (meski masih di atas video),
  // kontrol auto-hide ala YouTube — beda dengan :hover CSS yang tetap "on" selama
  // kursor di dalam elemen walau tak bergerak. Reset tiap kali kursor bergerak.
  const [videoHot, setVideoHot] = useState(false);
  const videoIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeVideoControls = useCallback(() => {
    setVideoHot(true);
    if (videoIdleTimer.current) clearTimeout(videoIdleTimer.current);
    videoIdleTimer.current = setTimeout(() => setVideoHot(false), 2600);
  }, []);
  const sleepVideoControls = useCallback(() => {
    if (videoIdleTimer.current) clearTimeout(videoIdleTimer.current);
    setVideoHot(false);
  }, []);
  useEffect(() => () => {
    if (videoIdleTimer.current) clearTimeout(videoIdleTimer.current);
  }, []);
  // [watch-hide-sentence-tr-v1] Sembunyikan baris terjemahan kalimat (emas) di bawah
  // subtitle → fokus ke arti per-kata di mode Analisa. Default tampil.
  const [showSentenceTr, setShowSentenceTr] = useState(true);
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
  // [watch-sync-offset-v1] Geser sinkron subtitle (detik). + = subtitle lebih cepat.
  const [syncOffset, setSyncOffset] = useState(0);

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
  // Paywall langganan Watch & Learn (buka arti kata / Analisa saat cicip habis).
  const [subscribeOpen, setSubscribeOpen] = useState(false);

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

  // [linguo-patch:watch-hover-pause-v1] Hover-to-pause ala LingoPie. Asumsi: kalau
  // kursor mampir ke baris subtitle di bawah video, pengguna sedang MEMBACA teks →
  // otomatis pause biar tak kebablasan sebelum sempat lookup kata; keluar → lanjut.
  // Hanya via mouse (desktop) — di HP mouseenter tak terpicu, jadi tak ganggu tap.
  // `hoverPausedRef` menandai bahwa PAUSE itu dari kita, supaya kita hanya melanjutkan
  // kembali kalau memang kita yang mem-pause (bukan kalau user sengaja pause sendiri).
  const hoverPausedRef = useRef(false);
  // Cermin state dari hoverPausedRef untuk render: saat jeda ini datang dari hover
  // subtitle (bukan jeda sengaja), lapisan penutup pause TIDAK ditampilkan supaya
  // frame video tetap kelihatan sambil baca teks (tak berkedip hitam tiap hover).
  const [hoverPaused, setHoverPaused] = useState(false);
  const onSubtitleEnter = useCallback(() => {
    const p = playerRef.current;
    // 1 = playing. Cuma pause kalau memang lagi jalan.
    if (p?.getPlayerState?.() === 1) {
      p.pauseVideo?.();
      hoverPausedRef.current = true;
      setHoverPaused(true);
    }
  }, []);
  const onSubtitleLeave = useCallback(() => {
    if (!hoverPausedRef.current) return;
    hoverPausedRef.current = false;
    setHoverPaused(false);
    playerRef.current?.playVideo?.();
  }, []);

  // Play/jeda manual — dipakai tombol di strip kotak mini (iframe YT menelan klik,
  // jadi butuh tombol eksplisit; di mode penuh play/jeda cukup klik video).
  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.getPlayerState?.() === 1) p.pauseVideo?.();
    else p.playVideo?.();
  }, []);

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
  // Lebar kolom video (%) di desktop — sisanya untuk transkrip. Bisa diseret lewat
  // separator di antara keduanya, lalu diingat (localStorage) & diklem 35–80%.
  const [splitPct, setSplitPct] = useState(62);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem("watch:splitPct"));
      if (Number.isFinite(v) && v >= 35 && v <= 80) setSplitPct(v);
    } catch {
      /* localStorage tak tersedia — pakai default */
    }
  }, []);
  const splitRowRef = useRef<HTMLDivElement>(null);
  const draggingSplitRef = useRef(false);
  const onSplitDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    draggingSplitRef.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    const move = (ev: PointerEvent) => {
      const row = splitRowRef.current;
      if (!draggingSplitRef.current || !row) return;
      const r = row.getBoundingClientRect();
      const pct = ((ev.clientX - r.left) / r.width) * 100;
      setSplitPct(Math.min(80, Math.max(35, pct)));
    };
    const up = () => {
      draggingSplitRef.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setSplitPct((v) => {
        try {
          localStorage.setItem("watch:splitPct", String(Math.round(v)));
        } catch {
          /* abaikan */
        }
        return v;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, []);
  // Drawer Analisa kata (WordStudy) sedang terbuka? Ia panel kanan yang menimpa
  // kolom transkrip → auto-sembunyikan transkrip selama terbuka, lalu kembalikan ke
  // kondisi semula saat ditutup (menghormati toggle transkrip user sebelumnya).
  const [wordStudyOpen, setWordStudyOpen] = useState(false);
  const panelBeforeStudyRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (wordStudyOpen) {
      if (panelBeforeStudyRef.current === null) {
        panelBeforeStudyRef.current = showPanel;
        setShowPanel(false);
      }
    } else if (panelBeforeStudyRef.current !== null) {
      setShowPanel(panelBeforeStudyRef.current);
      panelBeforeStudyRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordStudyOpen]);

  // [watch-study-history-v1] Sembunyikan FAB CS global (ChatWidget) selama player
  // terbuka — pojok kanan-bawah kita pakai sendiri untuk tombol AI (riwayat kata).
  useOverlayLock(true);

  // Riwayat kata yang di-study — panel yang muncul dari tombol AI melayang. Dimuat
  // dari localStorage saat dibuka & disegarkan tiap kali sebuah kata di-study.
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<StudyHistoryItem[]>([]);
  const refreshHistory = useCallback(() => setHistory(getStudyHistory()), []);
  useEffect(() => {
    if (historyOpen) refreshHistory();
  }, [historyOpen, refreshHistory]);

  // Buka ulang sebuah kata dari riwayat → langsung ke drawer Analisa (autoStudy).
  const openFromHistory = useCallback((h: StudyHistoryItem) => {
    setHistoryOpen(false);
    playerRef.current?.pauseVideo?.();
    setAnchor({
      word: h.word,
      sentence: h.sentence,
      x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
      y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
      autoStudy: true,
    });
  }, []);

  // Lebar drawer analisa kata (px, desktop). Dishare ke WordStudy lewat CSS var
  // --drawer-w di root player → video kiri reflow otomatis (padding-right) & drawer
  // ikut selebar ini. Bisa diseret lewat separator di batas kiri drawer, diklem, diingat.
  const [drawerWidth, setDrawerWidth] = useState(440);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem("watch:drawerW"));
      if (Number.isFinite(v) && v >= 320) setDrawerWidth(v);
    } catch {
      /* localStorage tak tersedia — pakai default */
    }
  }, []);
  const draggingDrawerRef = useRef(false);
  const onDrawerDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    draggingDrawerRef.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    const move = (ev: PointerEvent) => {
      if (!draggingDrawerRef.current) return;
      const max = Math.min(720, window.innerWidth * 0.85);
      setDrawerWidth(Math.min(max, Math.max(320, window.innerWidth - ev.clientX)));
    };
    const up = () => {
      draggingDrawerRef.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDrawerWidth((w) => {
        try {
          localStorage.setItem("watch:drawerW", String(Math.round(w)));
        } catch {
          /* abaikan */
        }
        return w;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, []);
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
  // [watch-rec-search-v1] Cari video langsung dari panel Rekomendasi (mode mini),
  // tanpa keluar player. `recSearchList` null = belum mencari → tampilkan rekomendasi
  // biasa; non-null = tampilkan hasil pencarian (bisa array kosong = tidak ketemu).
  const [recQuery, setRecQuery] = useState("");
  const [recSearchList, setRecSearchList] = useState<ImmersionVideo[] | null>(null);
  const [recSearchState, setRecSearchState] = useState<"idle" | "loading" | "done" | "empty">("idle");
  // Panel saran pencarian (chip "podcast", "berita", …) yang muncul saat kolom
  // cari difokus — animasi turun dari atas.
  const [recFocused, setRecFocused] = useState(false);
  const recSearchReq = useRef(0);

  // Jalankan pencarian video (Enter / tombol / klik chip saran): pakai jalur
  // yt-search yang sama dengan katalog halaman, disaring ke bahasa target & durasi
  // rekomendasi. `override` dipakai saat klik chip (state recQuery belum ter-commit).
  const runRecSearch = useCallback(async (override?: string) => {
    const q = (override ?? recQuery).trim();
    if (!q) {
      recSearchReq.current++;
      setRecSearchList(null);
      setRecSearchState("idle");
      return;
    }
    const id = ++recSearchReq.current;
    setRecSearchState("loading");
    setRecFocused(false);
    const lang = getImmersionLang(langCode);
    // Jahitkan nama native bahasa ("Suomi", "日本語", …) ke query supaya YouTube
    // mengembalikan konten BAHASA TARGET, bukan Inggris — sama seperti buildQuery
    // di katalog. Tanpa ini "podcast" untuk pelajar Finlandia keluar podcast Inggris.
    const query = lang?.native ? `${q} ${lang.native}` : q;
    try {
      const page = await searchImmersionVideos({
        query,
        language: lang?.searchCode ?? langCode,
        max: 18,
        maxDurationSec: WATCH_REC_MAX_DURATION_SEC,
        regionCode: lang?.region,
      });
      if (id !== recSearchReq.current) return; // hasil basi — abaikan
      const results = filterVideosByLanguage(page.results, langCode).filter(
        (v) => v.videoId !== video.videoId && (!v.duration || v.duration <= WATCH_REC_MAX_DURATION_SEC)
      );
      setRecSearchList(results);
      setRecSearchState(results.length ? "done" : "empty");
    } catch {
      if (id !== recSearchReq.current) return;
      setRecSearchList([]);
      setRecSearchState("empty");
    }
  }, [recQuery, langCode, video.videoId]);

  const clearRecSearch = useCallback(() => {
    recSearchReq.current++;
    setRecQuery("");
    setRecSearchList(null);
    setRecSearchState("idle");
  }, []);

  // Ganti bahasa target → hasil pencarian lama (bahasa lain) tak relevan lagi.
  useEffect(() => {
    recSearchReq.current++;
    setRecQuery("");
    setRecSearchList(null);
    setRecSearchState("idle");
  }, [langCode]);

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
          // Dibuka dari "Cari Kata" → mulai di detik kata diucapkan.
          ...(initialStart && initialStart > 1 ? { start: Math.floor(initialStart) } : {}),
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
    // Jahitkan nama native bahasa ("Dansk", "Suomi", …) ke query. Tanpa ini,
    // channel multi-bahasa (mis. "Easy Languages") mengembalikan video Inggris/
    // Jerman — dan filter aksara Latin tak bisa menyaringnya untuk bahasa target
    // beraksara Latin, jadi rekomendasi bocor ke bahasa lain. Ref: buildQuery.
    const relBase = video.channel?.trim() || video.title;
    searchImmersionVideos({
      query: lang?.native ? `${relBase} ${lang.native}` : relBase,
      language: lang?.searchCode ?? langCode,
      max: 12,
      maxDurationSec: WATCH_REC_MAX_DURATION_SEC,
      regionCode: lang?.region,
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
    const relBase = video.channel?.trim() || video.title;
    searchImmersionVideos({
      query: lang?.native ? `${relBase} ${lang.native}` : relBase,
      language: lang?.searchCode ?? langCode,
      max: 12,
      pageToken: related.next,
      maxDurationSec: WATCH_REC_MAX_DURATION_SEC,
      regionCode: lang?.region,
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

  // Durasi video baru tersedia beberapa saat setelah player siap → poll pelan sampai
  // dapat (>0), lalu berhenti. Reset ke 0 tiap ganti video biar slider tak salah.
  useEffect(() => {
    setDuration(0);
    if (!ready) return;
    const id = window.setInterval(() => {
      const d = playerRef.current?.getDuration?.();
      if (typeof d === "number" && d > 0) {
        setDuration(d);
        window.clearInterval(id);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [ready, video.videoId]);

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

      // ── Precompute analisa (mode Analisa instan) ──────────────────────────
      // Peta target→indeks cue: satu kalimat bisa muncul di beberapa cue, dan
      // breakdown = fungsi murni kalimat, jadi hasil dipakai untuk semua indeks
      // yang cocok. Seed dulu dari breakdown yang sudah tersimpan bareng transkrip
      // (cache lintas-pengguna) → nol loading. Sisanya di-warm di latar belakang.
      const targetToIdx = new Map<string, number[]>();
      ordered.forEach((c, i) => {
        const arr = targetToIdx.get(c.target);
        if (arr) arr.push(i);
        else targetToIdx.set(c.target, [i]);
      });
      // Hanya seed dari breakdown versi terbaru; yang lawas (tanpa arti per-kata)
      // diabaikan supaya tak ditampilkan & ikut dihitung ulang di bawah.
      const seed: Record<number, SentenceBreakdown> = {};
      ordered.forEach((c, i) => {
        if (isFreshBreakdown(c.breakdown)) {
          seed[i] = c.breakdown!;
          // Tulis juga ke cache localStorage → tooltip (getCachedWordMeaning) bisa
          // memunculkan arti kata INSTAN, bukan cuma mode Analisa.
          primeBreakdownCache(c.target, langCode, c.breakdown!);
        }
      });
      if (Object.keys(seed).length) setBreakdowns((prev) => ({ ...prev, ...seed }));
      const needWarm = Array.from(
        new Set(ordered.filter((c) => !isFreshBreakdown(c.breakdown)).map((c) => c.target))
      );
      if (needWarm.length) {
        // Beri jeda kecil sebelum warm massal biar tak rebutan dgn render subtitle
        // + transliterasi awal (paint pertama tetap mulus). isCancelled dicek lagi
        // di dalam prewarm, jadi ganti video / unmount saat menunggu aman.
        window.setTimeout(() => {
          if (cancelled) return;
          void prewarmBreakdowns({
            videoId: video.videoId,
            langCode,
            sentences: needWarm,
            isCancelled: () => cancelled,
            onOne: (sentence, bd) => {
              const idxs = targetToIdx.get(sentence);
              if (!idxs) return;
              setBreakdowns((prev) => {
                const next = { ...prev };
                for (const i of idxs) if (typeof next[i] !== "object") next[i] = bd;
                return next;
              });
            },
          });
        }, 1200);
      }
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

  // [watch-sync-offset-v1] Waktu yang dipakai SEMUA sorotan (baris aktif, karaoke,
  // panel transkrip) — waktu player + geser sinkron manual. Dipusatkan di sini biar
  // baris fokus & panel selalu kompak.
  const syncedTime = time + syncOffset;

  // Indeks cue aktif berdasarkan waktu sekarang.
  const activeIdx = useMemo(() => {
    if (!cues.length) return -1;
    // Cari cue yang mencakup `syncedTime`; kalau di celah, pakai cue terakhir yang lewat.
    let lo = 0;
    let hi = cues.length - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (cues[mid].start <= syncedTime) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (ans === -1) return -1;
    // Kalau sudah lewat end cue ini dan belum masuk berikutnya, tetap sorot ini.
    return ans;
  }, [cues, syncedTime]);

  const activeCue = activeIdx >= 0 ? cues[activeIdx] : null;

  // [watch-gap-hide-v1] Cue yang benar-benar DITAYANGKAN di baris fokus. Beda dari
  // activeCue: saat waktu sudah lewat `end` cue ini dan jeda ke cue berikutnya PANJANG
  // (hening / musik / tak ada yang bicara), subtitle disembunyikan (visibleCue = null)
  // ketimbang menahan kalimat lama di layar. Jeda PENDEK (≤ GAP_HIDE) tetap menahan
  // kalimat sampai cue berikutnya mulai — biar jeda napas natural tak bikin flicker.
  const GAP_HIDE = 1.2;
  const visibleCue = useMemo(() => {
    if (activeIdx < 0) return null;
    const cur = cues[activeIdx];
    if (syncedTime <= cur.end) return cur; // masih di dalam window ucapan
    const next = cues[activeIdx + 1];
    const gapEnd = next ? next.start : Infinity; // Infinity = setelah cue terakhir
    return gapEnd - cur.end <= GAP_HIDE ? cur : null;
  }, [cues, activeIdx, syncedTime]);

  // Sedang dalam jeda hening (sudah lewat cue pertama tapi tak ada cue yang tayang) —
  // beda dari "belum mulai": yang pertama biarkan baris fokus KOSONG, bukan tampilkan
  // ajakan "Tekan play".
  const inGap = txState === "ready" && cues.length > 0 && syncedTime >= cues[0].start && visibleCue === null;

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

  // Dibuka dari "Cari Kata": lompat ke detik kata diucapkan begitu player siap.
  // `start` playerVar menangani mount pertama; efek ini menangani kasus kata baru
  // dipilih untuk video yang SAMA (video.videoId tak berubah → player tak dibuat
  // ulang), jadi seek harus dipicu manual saat initialStart berganti.
  useEffect(() => {
    if (!ready || !initialStart || initialStart <= 1) return;
    seekTo(initialStart);
  }, [ready, initialStart, seekTo]);

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

  // [watch-sync-offset-v1] Pulihkan geser sinkron tersimpan tiap ganti video/bahasa
  // (default 0 kalau belum pernah diatur untuk video ini).
  useEffect(() => {
    let v = 0;
    try {
      const s = window.localStorage.getItem(syncKeyFor(video.videoId, langCode));
      if (s != null) {
        const n = parseFloat(s);
        if (Number.isFinite(n)) v = Math.max(-SYNC_MAX, Math.min(SYNC_MAX, n));
      }
    } catch {
      /* abaikan */
    }
    setSyncOffset(v);
  }, [video.videoId, langCode]);

  const nudgeSync = useCallback(
    (delta: number) => {
      setSyncOffset((cur) => {
        const next = Math.max(-SYNC_MAX, Math.min(SYNC_MAX, Math.round((cur + delta) * 100) / 100));
        try {
          window.localStorage.setItem(syncKeyFor(video.videoId, langCode), String(next));
        } catch {
          /* abaikan */
        }
        return next;
      });
    },
    [video.videoId, langCode]
  );

  const resetSync = useCallback(() => {
    setSyncOffset(0);
    try {
      window.localStorage.removeItem(syncKeyFor(video.videoId, langCode));
    } catch {
      /* abaikan */
    }
  }, [video.videoId, langCode]);

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

  // Pintasan keyboard: Spasi/Enter = play-pause, panah = navigasi section
  // (abaikan saat mengetik atau saat fokus di tombol/link).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;

      // Spasi / Enter = play-pause. Kalau fokus di tombol/link, biarkan
      // aktivasi normalnya (jangan bajak) supaya kontrol UI tetap jalan.
      if (e.key === " " || e.code === "Space" || e.key === "Enter") {
        if (
          t &&
          (t.tagName === "BUTTON" ||
            t.tagName === "A" ||
            t.getAttribute("role") === "button")
        )
          return;
        e.preventDefault();
        togglePlay();
        return;
      }

      // Atas/Kiri = section sebelumnya (mundur), Bawah/Kanan = berikutnya (maju).
      const prev = e.key === "ArrowUp" || e.key === "ArrowLeft";
      const next = e.key === "ArrowDown" || e.key === "ArrowRight";
      if (!prev && !next) return;
      e.preventDefault();
      gotoCue(next ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gotoCue, togglePlay]);

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
      // Gate: buka arti kata butuh langganan setelah cicip gratis habis. Kata yang
      // sudah pernah dibuka boleh dilihat ulang (tak menghabiskan kuota).
      const key = cleanWord(word);
      if (!canLookupWord(key, langCode)) {
        // Jeda video juga saat gate bayar muncul — biar tak terus jalan di
        // belakang modal langganan saat siswa fokus baca penawaran.
        playerRef.current?.pauseVideo?.();
        setSubscribeOpen(true);
        return;
      }
      recordWordLookup(key, langCode);
      // Catat ke riwayat study (tombol AI melayang) — kata terakhir yang dipilih
      // naik ke depan; bisa dibuka ulang instan dari panel riwayat.
      setHistory(recordStudyHistory({ word: key, langCode, sentence, videoId: video.videoId }));
      // Jeda video otomatis saat membuka arti kata — biar tak terus jalan & ganggu
      // saat siswa fokus baca artinya.
      playerRef.current?.pauseVideo?.();
      setAnchor({ word, sentence, x: e.clientX, y: e.clientY, wordIdx });
    },
    [langCode, video.videoId]
  );

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-[90] flex flex-col ${fullscreen && chromeHidden ? "cursor-none" : ""}`}
      style={{ backgroundColor: "rgba(6,9,10,0.96)", "--drawer-w": `${drawerWidth}px` } as React.CSSProperties}
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

        {/* Jumlah kosakata yang disimpan di video ini → buka deck kosakata.
            Default icon saja (tanpa border); label "Kosakata" muncul dari kanan
            ke kiri saat hover. */}
        {onOpenVocab && (
          <button
            onClick={onOpenVocab}
            className="group inline-flex shrink-0 items-center rounded-full p-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
            title="Kosakata tersimpan dari video ini"
          >
            <Layers className="h-4 w-4 shrink-0" color={TEAL} />
            <span className={REVEAL_LABEL}>Kosakata</span>
            {savedCount > 0 && (
              <span
                className="ml-1.5 shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-extrabold leading-none"
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
              className="group inline-flex items-center rounded-full p-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
              title="Bahasa terjemahan di bawah subtitle"
            >
              <RectFlag code={getBaseLangDef(baseLang).country} h={16} />
              <span className={REVEAL_LABEL}>{getBaseLangDef(baseLang).label}</span>
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
                className="group inline-flex shrink-0 items-center rounded-full p-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
                title="Ganti bahasa yang dipelajari"
              >
                {wl ? <RectFlag code={wl.country} h={16} /> : <Languages className="h-4 w-4 shrink-0" color={TEAL} />}
                <span className={REVEAL_LABEL}>{wl?.name ?? langCode}</span>
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
      <div
        ref={splitRowRef}
        className={`flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row ${fullscreen ? "pt-14" : ""} ${
          wordStudyOpen ? "lg:pr-[var(--drawer-w)]" : ""
        }`}
        style={{ "--split-w": showPanel ? `${splitPct}%` : "100%" } as React.CSSProperties}
      >
        {/* Kiri: video + baris fokus + kontrol selalu terlihat (tak ikut scroll);
            HANYA daftar Rekomendasi di bawahnya yang punya area scroll sendiri —
            jadi tak ada scrollbar menimpa video. */}
        <div className={`flex min-h-0 flex-col ${fullscreen ? "relative " : ""}${showPanel ? "lg:w-[var(--split-w)]" : "lg:w-full"}`}>
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
              className="group/vid relative w-full"
              onPointerMove={wakeVideoControls}
              onPointerLeave={sleepVideoControls}
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
              {/* [watch-own-controls-v1] Lapisan kontrol kita sendiri di atas iframe
                  (mode penuh, bukan mini). Selain memberi play/jeda + slider seek, ini
                  MENELAN klik ke overlay bawaan YouTube (share / tonton-nanti / "video
                  lainnya" / logo) sehingga menonton tak pernah melompat keluar ke
                  youtube.com — "video lainnya" diganti tombol kita yang tetap di
                  Watch & Learn (mengecilkan video + memunculkan rekomendasi). */}
              {ready && !mini && (
                <>
                  {/* Seluruh area video = tombol play/jeda (menelan klik YouTube). */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? "Jeda" : "Putar"}
                    className="absolute inset-0 z-[4] cursor-pointer bg-transparent"
                  />
                  {/* [watch-pause-keep-frame-v1] Saat DIJEDA, tampilkan tombol putar
                      besar di tengah TAPI biarkan frame video tetap kelihatan (dulu
                      ditutup lapisan gelap solid → layar hitam saat pause). Cuma scrim
                      tipis + gradien tepi ringan biar tombol putar terbaca & UI bawaan
                      YouTube di sudut sedikit teredam, tanpa menutupi gambar video. */}
                  {!playing && !hoverPaused && (
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label="Putar"
                      className="absolute inset-0 z-[6] flex items-center justify-center bg-black/20 transition-colors"
                    >
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition-transform hover:scale-105">
                        <Play className="ml-0.5 h-7 w-7 text-white" fill="currentColor" />
                      </span>
                    </button>
                  )}
                  {/* Bar seek + durasi — muncul saat kursor aktif di atas video, atau
                      selalu saat dijeda. Auto-hide saat kursor DIAM (videoHot=false) ala
                      YouTube; tetap tampil selama menyeret / hover slider (hoverSeek) /
                      fokus keyboard. Gradien gelap menutupi kontrol/logo YouTube di tepi. */}
                  <div
                    className={`absolute inset-x-0 bottom-0 z-[7] flex items-center gap-2 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3 pb-2 pt-7 transition-opacity duration-150 focus-within:opacity-100 ${
                      !playing || videoHot || scrubbing || hoverSeek !== null
                        ? "opacity-100"
                        : "pointer-events-none opacity-0"
                    }`}
                  >
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-white/90">
                      {fmtClock(scrubbing ? scrubVal : hoverSeek ?? time)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step="any"
                      value={
                        duration
                          ? Math.min(scrubbing ? scrubVal : hoverSeek ?? time, duration)
                          : 0
                      }
                      disabled={!duration}
                      // Bekukan penanda saat kursor masuk (pakai waktu paling akurat dari
                      // player), lepas saat keluar — kecuali sedang menyeret.
                      onPointerEnter={() =>
                        setHoverSeek(playerRef.current?.getCurrentTime?.() ?? time)
                      }
                      onPointerLeave={() => {
                        if (!scrubbing) setHoverSeek(null);
                      }}
                      onPointerDown={() => setScrubbing(true)}
                      onChange={(e) => setScrubVal(parseFloat(e.target.value))}
                      onPointerUp={(e) => {
                        const v = parseFloat((e.target as HTMLInputElement).value);
                        seekTo(v);
                        setScrubbing(false);
                        // Masih hover setelah lepas seret → bekukan di posisi baru
                        // supaya penanda tak lompat balik ke waktu play lama.
                        setHoverSeek(v);
                      }}
                      onKeyUp={(e) => seekTo(parseFloat((e.target as HTMLInputElement).value))}
                      // Slider netral (tanpa warna aksen) — fill putih & penanda posisi
                      // berupa lingkaran; --pct menggerakkan panjang fill lewat CSS.
                      className="watch-seek flex-1 cursor-pointer disabled:cursor-default"
                      style={
                        {
                          "--pct": `${
                            duration
                              ? Math.min(
                                  ((scrubbing ? scrubVal : hoverSeek ?? time) / duration) * 100,
                                  100
                                )
                              : 0
                          }%`,
                        } as React.CSSProperties
                      }
                      aria-label="Geser posisi video"
                    />
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-white/70">
                      {fmtClock(duration)}
                    </span>
                    {onSelectVideo && (
                      <button
                        type="button"
                        onClick={enterMini}
                        title="Video lainnya — tetap di Watch & Learn"
                        className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-black/85"
                      >
                        <ListVideo className="h-3.5 w-3.5" /> Video lainnya
                      </button>
                    )}
                  </div>
                </>
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
                className="absolute inset-x-0 top-0 z-10 flex cursor-move touch-none items-center gap-1.5 bg-gradient-to-b from-black/70 to-transparent p-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              >
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={togglePlay}
                  className="mr-auto rounded-full bg-black/60 p-2 transition-colors hover:bg-black/85"
                  aria-label={playing ? "Jeda" : "Putar"}
                  title={playing ? "Jeda" : "Putar"}
                >
                  {playing ? (
                    <Pause className="h-4 w-4 text-white" />
                  ) : (
                    <Play className="h-4 w-4 text-white" />
                  )}
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setMini(false)}
                  className="rounded-full bg-black/60 p-2 transition-colors hover:bg-black/85"
                  aria-label="Kembalikan ukuran video"
                  title="Kembalikan"
                >
                  <Maximize2 className="h-4 w-4 text-white" />
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
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
              fullscreen ? "shrink-0 bg-black px-4 pb-20 pt-2 sm:px-6" : "min-h-0 flex-1 py-2"
            }`}
          >
            {/* Subtitle nempel di bawah video (mb-auto dorong sisa ruang ke bawah)
                supaya baris kontrol terpisah jelas di dasar & tak menutupi
                terjemahan. Tetap bisa discroll kalau analisa bikin baris tinggi.
                Hover-pause TIDAK dipasang di pembungkus lebar-penuh ini — dioper ke
                FocusLine supaya hanya blok teks subtitle/terjemahan yang memicu jeda,
                bukan ruang kosong di kiri-kanannya. */}
            <div className="mb-auto mt-2 w-full">
              <FocusLine
                onHoverPause={onSubtitleEnter}
                onHoverResume={onSubtitleLeave}
                cue={visibleCue}
                inGap={inGap}
                time={syncedTime}
                langCode={langCode}
                baseLang={baseLang}
                baseTranslating={baseTranslating}
                showTranslation={showSentenceTr}
                // Tombol Analisa di bawah menggantikan subtitle di baris fokus ini
                // dengan breakdown grammar (arti + kelas kata per token) — inline,
                // bukan drawer. Drawer disisakan hanya untuk analisa per-kata (WordStudy).
                analyze={analyze}
                breakdown={activeIdx >= 0 ? breakdowns[activeIdx] : undefined}
                onWordTap={onWordTap}
                onRetryAnalyze={() => activeIdx >= 0 && requestBreakdown(activeIdx)}
                txState={txState}
                asrRunning={asrRunning}
                scale={fscale}
                // Sinkron hover kata↔terjemahan (sama seperti panel transkrip) supaya
                // di bar subtitle bawah / fullscreen, hover kata target juga menyorot
                // arti-nya di baris emas — dan sebaliknya.
                alignEnabled={alignEnabled}
                alignMap={activeIdx >= 0 ? alignMaps[activeIdx] : undefined}
                hot={activeIdx >= 0 ? hotSets(activeIdx) : undefined}
                hoveredK={hoverWord?.i === activeIdx ? hoverWord.k : null}
                onHoverWord={(k) => {
                  if (k == null) setHoverWord(null);
                  else if (activeIdx >= 0) {
                    setHoverWord({ i: activeIdx, k });
                    ensureAlign(activeIdx);
                  }
                }}
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
            <ToolButton
              glyph={<Palette className="h-4 w-4" />}
              label="Analisa"
              active={analyze}
              disabled={txState !== "ready"}
              title={analyze ? "Matikan analisa grammar" : "Analisa grammar kalimat"}
              onClick={() => {
                // Gate: Analisa grammar ikut paywall belajar (cicip bersama arti kata).
                // Mematikan mode selalu boleh; menyalakan butuh premium/cicip tersisa.
                if (!analyze && !isWatchPremium() && !canLookupWord()) {
                  // Jeda video juga saat gate bayar muncul (sama seperti tap kata).
                  playerRef.current?.pauseVideo?.();
                  setSubscribeOpen(true);
                  return;
                }
                // Jeda video saat mode Analisa dinyalakan biar tak lanjut jalan
                // sementara siswa membaca breakdown kalimat.
                if (!analyze) playerRef.current?.pauseVideo?.();
                setAnalyze((v) => !v);
              }}
            />

            {/* Kecepatan — nilai jadi glyph, label "Kecepatan" muncul saat hover */}
            <ToolButton
              glyph={`${SPEEDS[speedIdx]}x`}
              label="Kecepatan"
              onClick={() => applySpeed((speedIdx + 1) % SPEEDS.length)}
            />

            {/* Kualitas video — kontrol bawaan YouTube dimatikan, jadi ini jalan
                sendiri untuk turunkan resolusi (hemat paket data). Best-effort. */}
            <div className="relative shrink-0">
              <ToolButton
                glyph={<Gauge className="h-4 w-4" />}
                label={`Kualitas: ${qualityLabel(quality)}`}
                title="Kualitas video (hemat paket data)"
                active={qualityMenuOpen || quality !== "auto"}
                onClick={() => {
                  refreshQualityLevels();
                  setQualityMenuOpen((v) => !v);
                }}
              />
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

            {/* CC bawaan YouTube — HANYA muncul sebagai fallback saat transkrip kita
                tak tersedia. Kalau transkrip + terjemahan sudah ada, tombol ini
                redundan (malah bikin caption dobel) jadi disembunyikan. */}
            {txState === "none" && (
              <ToolButton
                glyph="CC"
                label={showCC ? "Sembunyikan CC" : "Tampilkan CC"}
                active={showCC}
                onClick={() => setShowCC((v) => !v)}
              />
            )}

            {/* Ukuran teks subtitle & transkrip — Kecil / Sedang / Besar */}
            <ToolButton
              glyph={<Type className="h-4 w-4" />}
              label={`Teks: ${FONT_LEVELS[fontIdx].label}`}
              title="Ukuran teks subtitle"
              onClick={cycleFont}
            />

            {/* [watch-sync-offset-v1] Sinkron subtitle — geser kalau highlight
                mendahului / ketinggalan dari audio. − mundur, + maju; angka =
                geser sekarang (detik). Ketuk angka utk reset ke 0. Hanya tampil
                saat transkrip interaktif sudah siap. */}
            {txState === "ready" && (
              <div
                className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1 py-1 text-[13px] font-bold"
                style={{
                  backgroundColor: syncOffset !== 0 ? "rgba(26,158,158,0.16)" : "transparent",
                  color: "#fff",
                }}
                title="Sinkron subtitle dengan audio (− mundur / + maju)"
              >
                <button
                  onClick={() => nudgeSync(-SYNC_STEP)}
                  className="rounded-full px-2 py-1 leading-none transition-colors hover:bg-white/10"
                  title="Subtitle lebih lambat (mundur)"
                  aria-label="Subtitle lebih lambat"
                >
                  −
                </button>
                <button
                  onClick={resetSync}
                  className="min-w-[3.25rem] rounded-full px-1 py-1 text-center leading-none transition-colors hover:bg-white/10"
                  style={{ color: syncOffset !== 0 ? TEAL : "#fff" }}
                  title="Reset sinkron ke 0"
                  aria-label="Reset sinkron"
                >
                  {syncOffset > 0 ? `+${syncOffset.toFixed(2)}` : syncOffset.toFixed(2)}s
                </button>
                <button
                  onClick={() => nudgeSync(SYNC_STEP)}
                  className="rounded-full px-2 py-1 leading-none transition-colors hover:bg-white/10"
                  title="Subtitle lebih cepat (maju)"
                  aria-label="Subtitle lebih cepat"
                >
                  +
                </button>
              </div>
            )}

            {/* [watch-hide-sentence-tr-v1] Sembunyikan/tampilkan baris terjemahan
                kalimat (emas) di bawah subtitle → fokus ke arti per-kata. */}
            <ToolButton
              glyph={<Languages className="h-4 w-4" />}
              label="Terjemahan"
              active={showSentenceTr}
              title={showSentenceTr ? "Sembunyikan terjemahan kalimat" : "Tampilkan terjemahan kalimat"}
              onClick={() => setShowSentenceTr((v) => !v)}
            />

            {/* Tampil/sembunyikan panel transkrip di kanan — berguna di fullscreen
                buat memberi video ruang lebih atau memunculkan transkrip per-baris. */}
            <ToolButton
              glyph={showPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              label="Transkrip"
              active={showPanel}
              title={showPanel ? "Sembunyikan transkrip" : "Tampilkan transkrip"}
              onClick={() => setShowPanel((v) => !v)}
            />

            {/* Rekomendasi — video mengecil melayang di pojok (miniplayer) sehingga
                daftar rekomendasi muncul mengisi kolom kiri & bisa discroll. */}
            <ToolButton
              glyph={<ListVideo className="h-4 w-4" />}
              label="Rekomendasi"
              title="Kecilkan video & tampilkan rekomendasi"
              onClick={enterMini}
            />

            {/* Fullscreen player kita (bukan iframe) — subtitle & transkrip tetap ada. */}
            <ToolButton
              glyph={fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              label={fullscreen ? "Keluar" : "Layar penuh"}
              active={fullscreen}
              title={fullscreen ? "Keluar layar penuh" : "Layar penuh"}
              onClick={toggleFullscreen}
            />
          </div>
          )}

          {/* Rekomendasi video — HANYA muncul saat miniplayer (video mengecil).
              Klik untuk langsung memutar video lain tanpa keluar player.
              Saat mini, daftar ini yang mengisi seluruh kolom kiri; saat menonton
              penuh sengaja disembunyikan agar subtitle + kontrol lebih lega. */}
          {mini && onSelectVideo && (
            <div
              className="flex min-h-0 flex-1 flex-col border-t"
              style={{ borderColor: BORDER }}
            >
              {/* [watch-rec-search-v1] Cari video tanpa keluar player. Fokus kolom →
                  panel saran (chip "Podcast"/"Berita"/…) turun beranimasi dari atas. */}
              <div className="px-4 pt-3 sm:px-6">
                <div
                  className="flex items-center gap-2.5 rounded-xl px-3"
                  style={{ backgroundColor: CARD, border: `1px solid ${recQuery || recFocused ? TEAL : BORDER}` }}
                >
                  <Search className="h-4 w-4 shrink-0" color={SUB} />
                  <input
                    value={recQuery}
                    onChange={(e) => setRecQuery(e.target.value)}
                    onFocus={() => setRecFocused(true)}
                    onBlur={() => setRecFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") runRecSearch();
                      else if (e.key === "Escape") setRecFocused(false);
                    }}
                    placeholder={`Cari video ${getImmersionLang(langCode)?.name ?? ""}…`}
                    className="flex-1 bg-transparent py-2.5 text-[14px] text-white outline-none placeholder:text-white/35"
                  />
                  {recQuery && (
                    <button
                      onClick={clearRecSearch}
                      className="shrink-0 transition-opacity hover:opacity-70"
                      aria-label="Hapus pencarian"
                    >
                      <X className="h-4 w-4" color={SUB} />
                    </button>
                  )}
                </div>
                {/* Panel saran — animasi tinggi 0fr→1fr (mulus, tanpa lompatan). */}
                <div
                  className={`grid overflow-hidden transition-all duration-300 ease-out ${
                    recFocused ? "mt-2.5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: SUB }}>
                      Saran pencarian
                    </p>
                    <div className="flex flex-wrap gap-2 pb-0.5">
                      {REC_SUGGESTIONS.map((s) => (
                        <button
                          key={s.q}
                          // mousedown preventDefault → input tak kehilangan fokus
                          // sebelum onClick chip sempat jalan.
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setRecQuery(s.q);
                            runRecSearch(s.q);
                          }}
                          className="rounded-full px-3 py-1.5 text-[12.5px] font-bold text-white/85 transition-colors hover:bg-white/10"
                          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-4 pb-1 pt-3 sm:px-6">
                <p className="text-[13px] font-extrabold text-white">
                  {recSearchList !== null ? "Hasil pencarian" : "Rekomendasi"}
                </p>
                {/* Kembali ke mode nonton penuh (keluar dari miniplayer + rekomendasi). */}
                <button
                  onClick={() => setMini(false)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold text-white transition-colors hover:bg-white/10"
                  title="Kembali menonton"
                  aria-label="Tutup rekomendasi & kembali menonton"
                >
                  <X className="h-4 w-4" /> Tutup
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 sm:px-4 [scrollbar-width:thin]">
                {recSearchState === "loading" ? (
                  <div
                    className="flex items-center justify-center gap-2 py-10 text-[13px]"
                    style={{ color: SUB }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" /> Mencari…
                  </div>
                ) : recSearchState === "empty" ? (
                  <p className="px-2 py-10 text-center text-[13px]" style={{ color: SUB }}>
                    Tidak ada video ketemu untuk “{recQuery.trim()}”. Coba kata kunci lain.
                  </p>
                ) : (recSearchList ?? recList).length === 0 ? null : (
                <>
                {(recSearchList !== null ? recSearchList : recList.slice(0, recShown)).map((v) => (
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
                {recSearchList === null && (recList.length > recShown || related?.next) && (
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
                </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separator draggable (desktop) — seret untuk mengatur lebar video vs
            transkrip. Sembunyi di mobile (kolom menumpuk vertikal). */}
        {showPanel && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Atur lebar transkrip"
            onPointerDown={onSplitDragStart}
            onDoubleClick={() => {
              setSplitPct(62);
              try {
                localStorage.setItem("watch:splitPct", "62");
              } catch {
                /* abaikan */
              }
            }}
            className="group hidden shrink-0 cursor-col-resize touch-none items-center justify-center lg:flex lg:w-2"
            title="Seret untuk atur lebar · klik ganda untuk reset"
          >
            <div
              className="h-10 w-1 rounded-full bg-white/15 transition-colors group-hover:bg-white/40"
            />
          </div>
        )}

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
                        time={syncedTime}
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

      {/* Separator drawer analisa kata (desktop) — nempel di batas kiri drawer,
          seret untuk atur lebar drawer; video kiri reflow otomatis (var --drawer-w).
          z di atas drawer (z-97) supaya bisa digenggam. */}
      {wordStudyOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Atur lebar panel analisa"
          onPointerDown={onDrawerDragStart}
          onDoubleClick={() => {
            setDrawerWidth(440);
            try {
              localStorage.setItem("watch:drawerW", "440");
            } catch {
              /* abaikan */
            }
          }}
          className="group fixed inset-y-0 z-[98] hidden w-2 cursor-col-resize touch-none items-center justify-center lg:flex"
          style={{ right: "var(--drawer-w)" }}
          title="Seret untuk atur lebar · klik ganda untuk reset"
        >
          <div className="h-12 w-1 rounded-full bg-white/25 transition-colors group-hover:bg-white/50" />
        </div>
      )}

      {/* [watch-study-history-v1] Tombol AI melayang (menggantikan FAB CS global
          yang disembunyikan) — buka panel "riwayat kata" yang tadi dipilih; klik
          salah satu untuk membuka ulang drawer Analisa-nya. Sembunyi saat
          miniplayer (pojok itu dipakai kotak video) atau saat drawer sudah buka. */}
      {!mini && !wordStudyOpen && (
        <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end sm:bottom-6 sm:right-6">
          {historyOpen && (
            <div
              className="mb-3 flex max-h-[min(60vh,26rem)] w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl shadow-2xl"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              <div
                className="flex items-center justify-between gap-2 border-b px-4 py-3"
                style={{ borderColor: BORDER }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" color={TEAL} />
                  <span className="text-[13px] font-extrabold text-white">Riwayat kata</span>
                </div>
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      clearStudyHistory();
                      setHistory([]);
                    }}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition-colors hover:bg-white/10"
                    style={{ color: SUB }}
                    title="Kosongkan riwayat"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto py-1 [scrollbar-width:thin]">
                {history.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[12.5px]" style={{ color: SUB }}>
                    Belum ada kata yang dibuka. Ketuk kata mana pun di subtitle untuk
                    melihat artinya — kata itu muncul di sini.
                  </p>
                ) : (
                  history.map((h) => {
                    const m = getCachedWordMeaning({
                      word: h.word,
                      sentence: h.sentence,
                      langCode: h.langCode,
                    });
                    return (
                      <button
                        key={`${h.langCode}::${h.word}::${h.ts}`}
                        onClick={() => openFromHistory(h)}
                        className="flex w-full flex-col gap-0.5 px-4 py-2 text-left transition-colors hover:bg-white/5"
                        title="Buka analisa kata ini"
                      >
                        <span className="text-[14px] font-bold text-white" dir={isRtl(h.langCode) ? "rtl" : undefined}>
                          {h.word}
                        </span>
                        {m?.meaning && (
                          <span className="line-clamp-1 text-[12px] font-semibold" style={{ color: GOLD_DIM }}>
                            {m.meaning}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            aria-label={historyOpen ? "Tutup riwayat kata" : "Riwayat kata (AI)"}
            title={historyOpen ? "Tutup riwayat" : "Riwayat kata"}
            className="flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-transform active:scale-95"
            style={{ backgroundColor: TEAL }}
          >
            {historyOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Sparkles className="h-6 w-6 text-white" />
            )}
          </button>
        </div>
      )}

      {anchor && (
        <WordTooltip
          word={anchor.word}
          sentence={anchor.sentence}
          wordIdx={anchor.wordIdx}
          langCode={langCode}
          videoId={video.videoId}
          x={anchor.x}
          y={anchor.y}
          autoStudy={anchor.autoStudy}
          onClose={() => setAnchor(null)}
          onSavedChange={handleSaved}
          onStudyOpenChange={setWordStudyOpen}
        />
      )}

      {subscribeOpen && <WatchSubscribeModal onClose={() => setSubscribeOpen(false)} />}
    </div>
  );
}

// ── Baris fokus (kalimat aktif di bawah video) ────────────────────────────────
function FocusLine({
  cue,
  inGap,
  time,
  langCode,
  baseLang,
  baseTranslating,
  showTranslation = true,
  analyze,
  breakdown,
  onWordTap,
  onRetryAnalyze,
  txState,
  asrRunning,
  scale,
  alignEnabled,
  alignMap,
  hot,
  hoveredK,
  onHoverWord,
  onHoverPause,
  onHoverResume,
}: {
  cue: LearnCue | null;
  inGap?: boolean;
  time: number;
  langCode?: string;
  baseLang?: string;
  baseTranslating?: boolean;
  showTranslation?: boolean;
  analyze: boolean;
  breakdown: SentenceBreakdown | "loading" | "error" | undefined;
  onWordTap: (e: React.MouseEvent, word: string, sentence: string, wordIdx?: number) => void;
  onRetryAnalyze: () => void;
  txState: "loading" | "ready" | "none";
  asrRunning: boolean;
  scale: number;
  // Sinkron hover kata↔terjemahan di bar subtitle bawah (setara panel transkrip).
  alignEnabled?: boolean;
  alignMap?: { tGroup: number[]; bGroup: number[]; firstT: number[] };
  hot?: { t: Set<number>; b: Set<number> };
  hoveredK?: number | null;
  onHoverWord?: (k: number | null) => void;
  // Hover-to-pause: dipasang di blok teks yang menyusut sesuai isi (bukan
  // pembungkus lebar-penuh) supaya jeda cuma terpicu saat kursor benar-benar
  // di atas subtitle/terjemahan — bukan di ruang kosong sekitarnya.
  onHoverPause?: () => void;
  onHoverResume?: () => void;
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
    // Sedang hening / musik / tak ada yang bicara di tengah pemutaran → biarkan KOSONG
    // (jangan tahan kalimat lama, jangan pula tampilkan ajakan "Tekan play").
    if (inGap) return <div className="min-h-[92px]" aria-hidden />;
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
          <div
            className="inline-block max-w-full"
            onMouseEnter={onHoverPause}
            onMouseLeave={onHoverResume}
          >
            <div
              className="flex flex-wrap items-end justify-center gap-x-2 gap-y-2"
              dir={isRtl(langCode ?? "") ? "rtl" : undefined}
            >
              {breakdown.tokens.map((t, i) => (
                <span
                  key={i}
                  onClick={(e) => onWordTap(e, t.word, cue.target)}
                  className="flex cursor-pointer flex-col items-center text-center"
                >
                  {/* Arti per kata (di ATAS kata) — gold redup: se-keluarga dgn
                      terjemahan kalimat tapi subordinat, beda dari kelas kata (abu) */}
                  {t.gloss && (
                    <span
                      className="block font-semibold leading-tight"
                      style={{ color: GOLD_DIM, fontSize: 11 * scale }}
                    >
                      {t.gloss}
                    </span>
                  )}
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
            {/* Terjemahan kalimat penuh di mode Analisa IKUT tombol "Terjemahan"
                (default tampil) — bisa disembunyikan kalau gloss per-kata dirasa
                cukup, tapi jangan hilang total supaya tombolnya tetap berefek. */}
            {!showTranslation ? null : cue.base ? (
              <p
                className="mt-2 font-bold"
                style={{ color: GOLD, fontSize: 15 * scale }}
                dir={isRtl(baseLang ?? "") ? "rtl" : undefined}
              >
                {cue.base}
              </p>
            ) : baseTranslating && baseLang !== DEFAULT_BASE_LANG ? (
              <p
                className="mt-2 font-semibold italic opacity-70"
                style={{ color: GOLD, fontSize: 13 * scale }}
              >
                Menerjemahkan…
              </p>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  // Mode normal: kalimat target besar (bisa di-tap) + translit + terjemahan emas.
  // Kata yang sedang diucapkan disorot ala karaoke (tersapu teal kiri→kanan).
  // Blok inline-block menyusut selebar teks → hover-pause hanya aktif tepat di
  // atas subtitle/translit/terjemahan, bukan di sisa lebar baris.
  return (
    <div className="min-h-[92px] px-5 py-4 text-center sm:px-6">
      <div
        className="inline-block max-w-full"
        onMouseEnter={onHoverPause}
        onMouseLeave={onHoverResume}
      >
      <KaraokeText
        cue={cue}
        time={time}
        langCode={langCode}
        onWordTap={onWordTap}
        hoveredK={hoveredK}
        hotKeys={hot?.t}
        onHoverWord={onHoverWord}
        className="font-extrabold leading-snug"
        fontSize={22 * scale}
        center
      />
      {cue.translit && (
        <KaraokeTranslit
          cue={cue}
          time={time}
          langCode={langCode}
          className="mt-1 italic"
          style={{ fontSize: 13 * scale }}
        />
      )}
      {!showTranslation ? null : cue.base ? (
        alignEnabled ? (
          <p
            className="mt-1.5 font-bold"
            style={{ color: GOLD, fontSize: 16 * scale }}
            dir={isRtl(baseLang ?? "") ? "rtl" : undefined}
          >
            {(() => {
              // Kata terjemahan bisa di-hover → menyorot kata/frasa target-nya
              // (dan sebaliknya) lewat peta penjajaran — sama seperti panel transkrip.
              let bk = -1;
              return splitWords(cue.base, baseLang).map((w, j) => {
                if (!w.isWord) return <span key={j}>{w.text}</span>;
                const wk = ++bk;
                const isHot = hot?.b.has(wk);
                const gi = alignMap?.bGroup[wk];
                const linked = alignMap && gi != null && gi >= 0 && alignMap.firstT[gi] >= 0;
                return (
                  <span
                    key={j}
                    onMouseEnter={() => {
                      if (linked) onHoverWord?.(alignMap!.firstT[gi!]);
                    }}
                    onMouseLeave={() => onHoverWord?.(null)}
                    className="transition-colors"
                    style={{
                      ...(isHot ? SYNC_UNDERLINE : null),
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
            className="mt-1.5 font-bold"
            style={{ color: GOLD, fontSize: 16 * scale }}
            dir={isRtl(baseLang ?? "") ? "rtl" : undefined}
          >
            {cue.base}
          </p>
        )
      ) : baseTranslating && baseLang !== DEFAULT_BASE_LANG ? (
        <p className="mt-1.5 font-semibold italic opacity-70" style={{ color: GOLD, fontSize: 13 * scale }}>
          Menerjemahkan…
        </p>
      ) : null}
      </div>
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

function karaokeTokens(
  cue: LearnCue,
  time: number,
  langCode?: string
): { text: string; isWord: boolean; state: KaraokeState; progress: number }[] {
  const toks = splitWords(cue.target, langCode);
  const total = cue.target.length || 1;
  // Sapuan dibentang SEPENUH window caption/ASR (start→end) — sengaja TIDAK direm ke
  // perkiraan tempo bicara. Dulu ada cap ke estimasi × faktor; hasilnya sapuan sering
  // "kecepeten" (selesai sebelum kalimat habis diucap). Sekarang sapuan tak pernah
  // rampung sebelum barisnya hilang. Hening panjang bukan lagi masalah di sini: jeda
  // ANTAR-cue kini disembunyikan (lihat visibleCue), jadi window yang tersisa ≈ ucapan.
  // [watch-karaoke-anchor-v2] Cue gabungan beberapa window caption bawa anchor batas
  // window ASLI → karaokeFrac menyandarkan sapuan ke timing sebenarnya video (seirama
  // audio & caption bawaan), bukan rata linear yang melenceng saat tempo tak rata (lagu).
  const frac = karaokeFrac(cue, time);
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

// ── Karaoke pada baris transliterasi ────────────────────────────────────────────
// [linguo-patch:watch-translit-karaoke-v1] Baris bacaan Latin (romaji/pinyin/dsb)
// ikut tersapu teal BARENG aksara asli di atasnya — pelajar bahasa non-Latin jadi
// tahu sedang di suku kata mana. Transliterasi selalu Latin → sapuan kiri→kanan.
//   • Kalau token translit selaras 1:1 dgn kata target (alignTranslitTokens) →
//     sapuan PER-KATA pakai state/progress kata target padanannya, jadi word-locked
//     (Rusia/Yunani/Georgia dsb yang romanisasinya memisah kata pakai spasi).
//   • Kalau tak selaras (Jepang/Mandarin: segmenter kata beda jumlah dgn token
//     romaji) → sapuan berbasis KARAKTER sepanjang baris pakai frac waktu yang sama;
//     kelar di cue.end bareng target. Dipecah per token biar tetap membungkus rapi.
function translitSweepTokens(text: string, frac: number) {
  const toks = splitWords(text); // Latin → pecah spasi/tanda baca
  const total = text.length || 1;
  const played = frac * total;
  let acc = 0;
  return toks.map((t) => {
    const startC = acc;
    const endC = acc + t.text.length;
    acc = endC;
    let pct = 0;
    if (endC <= played) pct = 100;
    else if (startC < played)
      pct = Math.round(((played - startC) / Math.max(1, t.text.length)) * 100);
    return { text: t.text, isWord: t.isWord, pct };
  });
}

function KaraokeTranslit({
  cue,
  time,
  langCode,
  className,
  style,
}: {
  cue: LearnCue;
  time: number;
  langCode?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const translit = cue.translit ?? "";
  const aligned = useMemo(
    () => alignTranslitTokens(cue.target, translit, langCode),
    [cue.target, translit, langCode]
  );
  const wordStates = useMemo(
    () => karaokeTokens(cue, time, langCode).filter((t) => t.isWord),
    [cue, time, langCode]
  );
  // [watch-karaoke-anchor-v2] Ikuti anchor window caption asli (sama dgn karaokeTokens)
  // biar sapuan translit tetap seirama audio pada cue gabungan beberapa window.
  const frac = karaokeFrac(cue, time);
  const charToks = useMemo(() => translitSweepTokens(translit, frac), [translit, frac]);
  if (!translit) return null;

  // Sapuan per-kata hanya bila token translit benar-benar selaras 1:1 dgn kata target.
  const wordSync = aligned && aligned.filter((t) => t.k >= 0).length === wordStates.length;
  const chunks = wordSync
    ? aligned!.map((t) => ({
        text: t.text,
        isWord: t.k >= 0,
        pct:
          t.k < 0
            ? 0
            : wordStates[t.k].state === "sung"
              ? 100
              : wordStates[t.k].state === "active"
                ? Math.round(wordStates[t.k].progress * 100)
                : 0,
      }))
    : charToks;

  return (
    <p className={className} style={{ color: "#fff", ...style }}>
      {chunks.map((c, idx) =>
        c.isWord ? (
          <TranslitSweepChunk key={idx} text={c.text} pct={c.pct} />
        ) : (
          <span key={idx} className="whitespace-pre">
            {c.text}
          </span>
        )
      )}
    </p>
  );
}

// Satu potongan translit dgn overlay teal dipangkas mengikuti `pct` (0..100). Latin →
// pangkas dari kanan (inset kanan). Overlay lebar 100% biar glyph selalu sejajar.
function TranslitSweepChunk({ text, pct }: { text: string; pct: number }) {
  const clip = `inset(0 ${100 - pct}% 0 0)`;
  return (
    <span className="relative inline-block align-baseline">
      <span style={{ color: "inherit" }}>{text}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 w-full overflow-hidden whitespace-nowrap"
        style={{
          color: TEAL,
          clipPath: clip,
          WebkitClipPath: clip,
          transition: "clip-path 220ms linear, -webkit-clip-path 220ms linear",
        }}
      >
        {text}
      </span>
    </span>
  );
}

