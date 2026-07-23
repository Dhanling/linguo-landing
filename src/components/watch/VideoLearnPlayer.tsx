"use client";

// Player "belajar" Watch & Learn — versi web dari immersion player app mobile.
// Kiri: video YouTube (IFrame API) + baris fokus (kalimat aktif bisa di-tap +
// terjemahan emas + tombol Analisa). Kanan (separator di desktop): transkrip
// penuh yang tersinkron — klik baris buat loncat. Tap kata → tooltip arti /
// simpan / analisa / dengar. Semua best-effort; kalau transkrip tak ada, video
// tetap jalan dengan caption bawaan YouTube.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Gauge,
  GripHorizontal,
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
  type AlignResult,
  getCachedWordMeaning,
  getSentenceBreakdown,
  getStudyHistory,
  recordStudyHistory,
  clearStudyHistory,
  StudyHistoryItem,
  isFreshBreakdown,
  isExplanationCue,
  cueIsExplanation,
  cueAnalysisLang,
  isNonLatin,
  isRtl,
  karaokeFrac,
  computeCueChunks,
  CueChunks,
  LearnCue,
  POS_COLOR,
  POS_LABEL_ID,
  prewarmBreakdowns,
  primeBreakdownCache,
  prewarmTranscripts,
  requestTranscript,
  SentenceBreakdown,
  splitWords,
  baseAltFromCues,
  translateCuesToBase,
  TranscriptReason,
  transliterateLines,
  fetchReadyVideos,
  fetchReadyCounts,
} from "@/lib/immersionLearn";
import { CEFR_STYLE, type CefrLevel } from "@/lib/cefr";
import {
  filterVideosByLanguage,
  formatDuration,
  getImmersionLang,
  ImmersionVideo,
  searchImmersionVideos,
  WATCH_REC_MAX_DURATION_SEC,
  youtubeThumb,
  youtubeThumbMax,
} from "@/lib/immersion";
import { WordTooltip } from "./WordTooltip";
import SentenceStudy from "./SentenceStudy";
import WatchSubscribeModal from "./WatchSubscribeModal";
import { RectFlag } from "@/components/RectFlag";
import { LangPickerPanel } from "./LangPickerPanel";
import { useOverlayLock } from "@/lib/overlayStore";

const TEAL = "#1A9E9E";
// [watch-karaoke-number-sync-v1] Token yang isinya HANYA angka (mis. "1", "2024",
// "２"). Dipakai untuk menyorot angka seirama satuannya walau Intl.Segmenter browser
// tak menandainya word-like (jadi ter-render sebagai pemisah, bukan kata).
const isDigitToken = (s: string) => /^\p{N}+$/u.test(s);
const GOLD = "#F4B740";
// Gold redup untuk arti per-kata di mode Analisa — se-keluarga dengan terjemahan
// kalimat (GOLD terang) tapi jelas subordinat, biar hierarki baca enak.
const GOLD_DIM = "rgba(244,183,64,0.72)";
const CARD = "#161A1C";
const BORDER = "rgba(255,255,255,0.08)";
// [watch-cue-block-v1] Latar BLOK PENUH baris transkrip yang sedang diputar (ala
// Lingopie) — solid, bukan tint tembus 14% seperti dulu, supaya batas section tegas.
// Abu-abu netral (bukan teal): sorotan karaoke per-kata & pita penanda kiri JUGA
// teal, jadi blok berwarna malah menelan keduanya. Dengan abu gelap, teal karaoke,
// putih target, dan emas terjemahan semuanya tetap kontras.
const CUE_ON_BG = "#282B2D";

// [watch-endscreen-recs-v1] Layar akhir ala Netflix: saat video habis, tampilkan
// rekomendasi video berikutnya dari tab "Siap" (transkrip sudah siap → buka instan)
// yang levelnya SESUAI video yang baru ditonton (belajar A1 → rekomendasi A1). Kartu
// utama punya hitung-mundur auto-play. Cache katalog "Siap" per-bahasa module-level
// biar tak fetch ulang tiap ganti video; TTL longgar karena katalog jarang berubah.
const READY_REC_CACHE = new Map<string, { videos: ImmersionVideo[]; at: number }>();
const READY_REC_TTL_MS = 5 * 60 * 1000;
// Detik hitung-mundur sebelum kartu utama diputar otomatis (ala Netflix).
const AUTOPLAY_SECS = 5;

// Sembunyikan baris terjemahan kalau ia sekadar menduplikasi teks target — terjadi
// saat cue memang berbahasa penjelas (mis. Inggris di video Ukraina) DAN bahasa
// terjemahan pengguna kebetulan sama, sehingga target == terjemahan. Baris target
// sudah menampilkan teksnya, jadi baris kedua yang identik cuma bising.
const isDuplicateBase = (cue: LearnCue, langCode: string): boolean =>
  cueIsExplanation(cue, langCode) &&
  cue.base.trim().toLowerCase() === cue.target.trim().toLowerCase();

// [watch-icon-tab-v1] Tombol ikon header & bar bawah TAK lagi memunculkan label
// yang meluncur saat hover. Sebagai gantinya: (1) "tab" latar (pill) muncul
// beranimasi di belakang ikon, dan (2) tooltip kecil menampilkan namanya.
//
// TabBg — latar pill di belakang ikon. Saat aktif tetap tampil (teal); saat
// tidak, transparan lalu skala+fade masuk ketika induk (group) di-hover.
function TabBg({ active = false }: { active?: boolean }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-full transition-all duration-200 ease-out ${
        active
          ? "scale-100 opacity-100"
          : "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100"
      }`}
      style={{ backgroundColor: active ? "rgba(26,158,158,0.16)" : "rgba(255,255,255,0.12)" }}
    />
  );
}

// IconTooltip — label kecil yang muncul saat hover (ganti animasi label lama).
// `side` = posisi relatif tombol: "bottom" utk tombol header (di atas layar),
// "top" utk tombol bar bawah.
function IconTooltip({
  children,
  side = "bottom",
  align = "center",
}: {
  children: React.ReactNode;
  side?: "top" | "bottom";
  // `align` = titik jangkar horizontal. Tombol yang nempel tepi kanan panel
  // (mis. toggle terjemahan) wajib "right" — kalau center, balonnya kepotong
  // `overflow-hidden` panel.
  align?: "center" | "right";
}) {
  const pos = side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5";
  const alignPos = align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute z-30 ${alignPos} ${pos} whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100`}
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
    >
      {children}
    </span>
  );
}

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

// [watch-karaoke-solid-shadow-v2] Garis tepi hitam SOLID tebal ala subtitle
// "brainrot"/TikTok (referensi user) — outline pekat 8 arah + PENEBALAN ke
// KANAN-BAWAH (offset stiker) supaya teks terasa nempel & timbul di atas video
// apa pun. Dipakai baris fokus, subtitle overlay, dan transliterasi.
const KARAOKE_SHADOW =
  // outline solid ~2px keliling
  "2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000, " +
  "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, " +
  // kedalaman/stiker condong ke kanan-bawah + drop shadow halus
  "3px 3px 0 #000, 4px 4px 0 rgba(0,0,0,0.9), 5px 6px 6px rgba(0,0,0,0.5)";

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
// untuk tombol bernilai) — ikon polos tanpa "tab" latar biar rapi & compact.
// Status nyala ditandai warna teal; saat hover ikon zoom-in (membesar), label
// tampil lewat tooltip kecil (IconTooltip).
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
      aria-label={label}
      className="group relative inline-flex shrink-0 items-center justify-center rounded-full p-2 transition-transform duration-150 ease-out hover:scale-125 active:scale-90 disabled:opacity-40 disabled:hover:scale-100"
      style={{ color: active ? TEAL : "#fff" }}
    >
      <span className="relative grid h-5 min-w-5 place-items-center text-[13px] font-bold leading-none">
        {glyph}
      </span>
      <IconTooltip side="top">{title ?? label}</IconTooltip>
    </button>
  );
}

// Sakelar geser kecil ala iOS — dipakai di panel subtitle. Nyala = teal brand.
function MiniSwitch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className="relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors duration-200"
      style={{ backgroundColor: on ? TEAL : "rgba(255,255,255,0.18)" }}
    >
      <span
        className="absolute h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: `translateX(${on ? 18 : 2}px)` }}
      />
    </span>
  );
}

// [watch-subtitle-toggle-v2] Tombol subtitle di bar kontrol kini membuka panel
// bergaya pemutar imersi: SATU BARIS PER BAHASA (bendera rounded rectangle +
// nama bahasa + sakelar geser) — baris atas subtitle bahasa yang dipelajari,
// baris bawah terjemahan. Keduanya mandiri; kalau dua-duanya dimatikan blok
// subtitle hilang total (= "sembunyikan semua subtitle" versi lama).
// Hover buka; klik trigger juga toggle (perangkat sentuh). Menu = anak dari
// pembungkus supaya hover-nya ikut menahan menu tetap terbuka; timer kecil
// menjembatani celah antara tombol & panel saat kursor menyeberang.
function SubtitleMenuButton({
  showSentenceTr,
  onToggleSentenceTr,
  showTargetSub,
  onToggleTargetSub,
  hideSubtitle,
  targetLabel,
  targetFlag,
  baseLabel,
  baseFlag,
}: {
  showSentenceTr: boolean;
  onToggleSentenceTr: () => void;
  showTargetSub: boolean;
  onToggleTargetSub: () => void;
  hideSubtitle: boolean;
  targetLabel: string;
  targetFlag?: string;
  baseLabel: string;
  baseFlag?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };
  useEffect(() => () => cancelClose(), []);
  // Nyala teal saat masih ada teks tampil (subtitle & terjemahan aktif).
  const active = showSentenceTr && !hideSubtitle;
  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-label="Opsi subtitle & terjemahan"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex shrink-0 items-center justify-center rounded-full p-2 transition-transform duration-150 ease-out hover:scale-125 active:scale-90"
        style={{ color: active ? TEAL : "#fff" }}
      >
        <span className="relative grid h-5 min-w-5 place-items-center">
          <Languages className="h-4 w-4" />
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 overflow-hidden rounded-2xl shadow-2xl"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
        >
          <p className="px-3.5 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-wide text-white/45">
            Subtitle
          </p>
          {(
            [
              {
                key: "target",
                label: targetLabel,
                flag: targetFlag,
                hint: "Bahasa yang dipelajari",
                on: showTargetSub,
                toggle: onToggleTargetSub,
              },
              {
                key: "base",
                label: baseLabel,
                flag: baseFlag,
                hint: "Terjemahan",
                on: showSentenceTr,
                toggle: onToggleSentenceTr,
              },
            ] as const
          ).map((row) => (
            <button
              key={row.key}
              type="button"
              role="menuitemcheckbox"
              aria-checked={row.on}
              onClick={row.toggle}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-white/5"
            >
              <RectFlag code={row.flag} h={18} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-white">{row.label}</span>
                <span className="block text-[11px] font-medium text-white/45">{row.hint}</span>
              </span>
              <MiniSwitch on={row.on} />
            </button>
          ))}
          {/* Dua-duanya mati = nonton bersih tanpa teks; kasih tahu cara baliknya. */}
          {hideSubtitle && (
            <p className="border-t px-3.5 py-2 text-[11px] font-medium leading-snug text-white/45" style={{ borderColor: BORDER }}>
              Semua subtitle mati — nyalakan salah satu untuk menampilkannya lagi.
            </p>
          )}
        </div>
      )}
    </div>
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
  // Id unik tiap tap — dipakai WordTooltip (prop tapId) untuk MERESET state
  // internalnya tiap kata baru (buka/tutup drawer, riwayat Tanya AI) TANPA remount.
  // Kenapa bukan React key (remount): remount bikin drawer Analisa main animasi
  // masuk lagi + transkrip reflow tiap tap → kedipan. Dengan reset via prop,
  // drawer tetap terpasang & cuma memuat ulang isinya (mulus, tanpa kedipan).
  id: number;
  word: string;
  sentence: string;
  x: number;
  y: number;
  // Indeks token kata dalam splitWords(sentence) — dipakai tooltip untuk memperluas
  // pilihan ke frasa (mis. "la compañía"). Undefined = jatuh ke pencarian pertama.
  wordIdx?: number;
  // [watch-phrase-chunk-v1] Indeks token AKHIR frasa saat yang di-tap adalah unit
  // frasa karaoke (mis. "the king"): tooltip memilih rentang wordIdx..wordEndIdx
  // penuh → arti frasa ("raja"), lalu siswa bisa turun ke per-kata lewat chip.
  wordEndIdx?: number;
  // Langsung buka drawer Analisa (dibuka ulang dari riwayat kata, bukan tap baru).
  autoStudy?: boolean;
  // Bahasa untuk MENGANALISIS kata ini — beda dari bahasa target video kalau
  // katanya ada di baris penjelas (mis. kata Inggris di video Ukraina). Undefined
  // = pakai bahasa target.
  lang?: string;
}

export default function VideoLearnPlayer({
  video,
  langCode,
  baseLang = DEFAULT_BASE_LANG,
  onClose,
  onChangeLang,
  onPickLang,
  recentLangCodes = [],
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
  /** Ganti bahasa yang dipelajari saat menonton → balik ke beranda Watch & Learn.
   *  Fallback untuk perangkat sentuh (klik trigger dropdown saat hover tak ada). */
  onChangeLang?: () => void;
  /** Pilih bahasa yang dipelajari langsung dari dropdown hover di header. */
  onPickLang?: (code: string) => void;
  /** Bahasa dipelajari yang terakhir dipilih (chip "terakhir dipilih" di dropdown). */
  recentLangCodes?: string[];
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
  // [watch-subtitle-toggle-v2] Subtitle bahasa target (+ translit) punya sakelar
  // SENDIRI, sejajar dengan sakelar terjemahan — persis pola pemutar imersi lain:
  // satu baris per bahasa, masing-masing bisa dimatikan. Kalau KEDUANYA mati,
  // blok subtitle hilang total (setara "sembunyikan semua subtitle" yang lama).
  const [showTargetSub, setShowTargetSub] = useState(true);
  const hideSubtitle = !showTargetSub && !showSentenceTr;
  // [watch-panel-hide-tr-v1] Sakelar terjemahan KHUSUS panel transkrip — terpisah dari
  // sakelar subtitle di atas video, supaya bisa "tutup contekan" di transkrip (latihan
  // baca bahasa target) tanpa mematikan terjemahan di layar video. Diingat lokal.
  const [showPanelTr, setShowPanelTr] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem("watch:panelTr") === "0") setShowPanelTr(false);
    } catch {
      /* localStorage tak tersedia — pakai default */
    }
  }, []);
  const togglePanelTr = useCallback(() => {
    setShowPanelTr((v) => {
      try {
        localStorage.setItem("watch:panelTr", v ? "0" : "1");
      } catch {
        /* abaikan */
      }
      return !v;
    });
  }, []);
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
  // [watch-responsive-subtitle-v1] Ukuran layar dilacak supaya subtitle di HP &
  // tablet menyesuaikan diri: di layar sempit/pendek, teks target+translit+
  // terjemahan bisa lebih tinggi dari ruang tersisa → kepotong. Faktor ini
  // mengecilkan skala teks pilihan siswa hanya di layar kecil (tak mengubah
  // pilihannya di desktop) & jadi acuan pembatas tinggi video di bawah.
  const [vp, setVp] = useState({ w: 1280, h: 800 });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);
  // Faktor responsif: mengecil di layar sempit ATAU pendek (landscape HP/tablet),
  // supaya blok subtitle muat tanpa terpotong. Di layar normal → 1 (tanpa efek).
  const vpFactor = useMemo(() => {
    let f = 1;
    if (vp.w < 400) f = 0.72;
    else if (vp.w < 640) f = 0.82;
    else if (vp.w < 900) f = 0.92;
    // Layar pendek (mis. HP/tablet landscape) — ruang vertikal ekstra sempit.
    if (vp.h < 520) f = Math.min(f, 0.8);
    else if (vp.h < 680) f = Math.min(f, 0.9);
    return f;
  }, [vp.w, vp.h]);
  const fscale = FONT_LEVELS[fontIdx].scale * vpFactor;

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
  // Penghitung id anchor — tiap tap kata dapat id baru → WordTooltip remount bersih.
  const anchorSeq = useRef(0);
  // [watch-tip-persist-v1] Balon arti kata hanya muncul saat video DIJEDA. Begitu
  // video jalan lagi, balon otomatis hilang (tak menghalangi tontonan). Drawer Analisa
  // (studyOpen) dikecualikan — panel dalam itu tetap tampil biar analisa tak terputus.
  // Paywall langganan Watch & Learn (buka arti kata / Analisa saat cicip habis).
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  // Dropdown bahasa GABUNGAN di header (bahasa saya + bahasa target) — muncul saat
  // hover. Dirender di DALAM player karena picker milik katalog (z-85) tenggelam di
  // bawah overlay player (z-90).
  const [learnMenuOpen, setLearnMenuOpen] = useState(false);
  // Jumlah video "Siap" per bahasa → badge di pemilih bahasa target.
  const [readyCounts, setReadyCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    let alive = true;
    fetchReadyCounts().then((c) => {
      if (alive) setReadyCounts(c);
    });
    return () => {
      alive = false;
    };
  }, []);
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
  // [watch-idle-thumb-v1] Layar diam ala Netflix: kalau video DIJEDA (sengaja, bukan
  // hover-baca) lebih dari 10 detik & kursor sudah diam, tampilkan thumbnail besar + gradien + judul.
  // Dimatikan saat diputar lagi / jeda-hover / sedang buka tooltip kata.
  const [idlePaused, setIdlePaused] = useState(false);
  // [watch-endscreen-recs-v1] Video habis (state YT = 0) → tampilkan layar akhir
  // Netflix. `endReady` = katalog "Siap" bahasa ini (sumber rekomendasi + level).
  // `autoCount` = sisa detik hitung-mundur auto-play kartu utama (null = tak jalan).
  const [ended, setEnded] = useState(false);
  const [endReady, setEndReady] = useState<ImmersionVideo[]>([]);
  const [autoCount, setAutoCount] = useState<number | null>(null);
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
    // [watch-drawer-autoclose-v1] Klik video / Spasi / Enter = kembali menonton →
    // tutup drawer Analisa (kata & kalimat) di kanan biar layar kembali lega.
    // Drawer kata hidup di dalam WordTooltip (dikendalikan `anchor`), jadi tutup
    // via setAnchor(null); drawer kalimat via setSentenceCue(null). Setter state
    // stabil → deps tetap kosong. Aman dipanggil walau drawer sudah tertutup (no-op).
    setAnchor(null);
    setWordStudyOpen(false);
    setSentenceCue(null);
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
  const [aligns, setAligns] = useState<Record<number, AlignResult>>({});
  const alignReqRef = useRef<Set<string>>(new Set());

  // Fullscreen player kita sendiri (bukan iframe) + tampil/sembunyi panel transkrip.
  const [fullscreen, setFullscreen] = useState(false);
  // Default MATI ala YouTube: buka video → video langsung lega/fullscreen tanpa panel.
  // Transkrip baru muncul (dgn latar thumbnail blur gelap) saat tombol Transkrip ditekan.
  const [showPanel, setShowPanel] = useState(false);
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
  // Cermin ref utk dibaca di onWordTap (callback stabil) — tap kata saat drawer
  // terbuka langsung muat ulang drawer di tempat, bukan balik ke popup.
  const wordStudyOpenRef = useRef(false);
  wordStudyOpenRef.current = wordStudyOpen;
  // [watch-sentence-study-v1] Drawer "Analisa Kalimat" — dibuka dari tombol AI
  // melayang untuk kalimat yang sedang tayang. null = tertutup. Berbagi lebar
  // & pergeseran layout dengan drawer kata (var --drawer-w) lewat anyDrawerOpen.
  const [sentenceCue, setSentenceCue] = useState<
    { sentence: string; translit?: string; translation?: string; lang: string } | null
  >(null);
  const anyDrawerOpen = wordStudyOpen || sentenceCue !== null;
  // [watch-tip-persist-v1] Video jalan lagi → tutup balon arti kata (biar tak
  // menghalangi tontonan). Drawer Analisa (wordStudyOpen) dikecualikan: panel dalam
  // itu memang dibuka untuk dibaca berlama-lama, tak ikut tertutup saat video jalan.
  useEffect(() => {
    if (playing && !wordStudyOpenRef.current) setAnchor(null);
    // [watch-idle-rearm-v1] Sembuhkan hoverPaused yang bisa NYANGKUT true bila
    // subtitle ke-unmount saat kursor masih di atasnya (onSubtitleLeave tak pernah
    // terpanggil). Kalau nyangkut, jeda BERIKUTNYA dikira hover-baca → layar diam
    // ala Netflix tak pernah muncul lagi (bug "pause kedua"). Begitu video jalan,
    // status hover PASTI sudah tak relevan → reset ref & state.
    if (playing) {
      hoverPausedRef.current = false;
      if (hoverPaused) setHoverPaused(false);
    }
  }, [playing, hoverPaused]);
  // [watch-idle-thumb-v1] Timer 10 detik untuk memunculkan layar diam ala Netflix.
  // Hanya berjalan saat jeda DISENGAJA (bukan hover-baca subtitle); begitu diputar
  // lagi atau hover-pause, layar diam langsung disembunyikan & timer direset.
  useEffect(() => {
    // [watch-idle-hold-tooltip-v1] Saat balon arti kata (anchor) atau drawer Analisa
    // terbuka, JANGAN masuk layar diam — siswa sedang belajar & subtitle harus tetap
    // tampil (bukan ketutup thumbnail besar). Selaras dgn guard overlay tengah yang
    // juga `!anchor && !anyDrawerOpen`. Tutup tooltip/drawer → efek re-run, timer 10 dtk
    // arm lagi (layar diam muncul normal kalau jeda diteruskan).
    // [watch-idle-cursor-active-v1] Selagi kursor MASIH BERGERAK di atas video
    // (videoHot true), JANGAN dianggap diam — timer 10 dtk baru mulai berhitung
    // setelah kursor benar-benar berhenti (videoHot mati sendiri ~2.6 dtk kemudian).
    // Tiap gerakan pointer men-set videoHot true → efek re-run → timer di-reset.
    if (playing || hoverPaused || anchor || anyDrawerOpen || videoHot) {
      setIdlePaused(false);
      return;
    }
    const t = window.setTimeout(() => setIdlePaused(true), 10000);
    return () => window.clearTimeout(t);
  }, [playing, hoverPaused, anchor, anyDrawerOpen, videoHot]);
  const panelBeforeStudyRef = useRef<boolean | null>(null);
  // useLayoutEffect (bukan useEffect) supaya sembunyi/tampil transkrip terjadi SEBELUM
  // browser melukis. Kalau useEffect: render pembuka drawer sudah memasang padding
  // `lg:pr-[var(--drawer-w)]` ke baris split TAPI transkrip baru disembunyikan setelah
  // paint → ada satu frame transkrip kepencet ke ruang yang menyempit = kedipan. Dengan
  // layout-effect, padding & transkrip-tersembunyi mendarat di paint yang sama (mulus).
  useLayoutEffect(() => {
    if (anyDrawerOpen) {
      if (panelBeforeStudyRef.current === null) {
        panelBeforeStudyRef.current = showPanel;
        setShowPanel(false);
      }
    } else if (panelBeforeStudyRef.current !== null) {
      setShowPanel(panelBeforeStudyRef.current);
      panelBeforeStudyRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyDrawerOpen]);

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
      id: ++anchorSeq.current,
      word: h.word,
      sentence: h.sentence,
      x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
      y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
      autoStudy: true,
      // Riwayat tak menyimpan bahasa cue → tebak dari aksara kalimatnya (kata di
      // baris penjelas Inggris tetap dianalisis sebagai Inggris saat dibuka ulang).
      lang: isExplanationCue(h.sentence, h.langCode) ? "en" : h.langCode,
    });
  }, []);

  // [watch-sentence-study-v1] Buka drawer Analisa Kalimat untuk sebuah cue —
  // dipakai tombol AI melayang atas kalimat yang sedang tayang. Tutup dulu balon
  // arti kata & panel riwayat biar tak dobel drawer, jeda video, lalu buka.
  const openSentenceStudy = useCallback(
    (cue: LearnCue) => {
      setAnchor(null);
      setHistoryOpen(false);
      playerRef.current?.pauseVideo?.();
      setSentenceCue({
        sentence: cue.target,
        translit: cue.translit,
        translation: cue.base,
        // Bahasa analisa ikut cue (baris penjelas campur-bahasa dianalisis sbg-nya).
        lang: cueAnalysisLang(cue, langCode),
      });
    },
    [langCode]
  );

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

  // [watch-subtitle-drag-v1] Geser blok subtitle (target + translit + terjemahan) naik/
  // turun saat MELAYANG di atas video (layar penuh). Berguna kalau video aslinya sudah
  // punya subtitle/terjemahan bawaan — pindahkan subtitle Linguo ke atas/bawah biar tak
  // tumpang-tindih. Offset vertikal (px, negatif = naik) disimpan lokal → tahan refresh
  // & pindah video. Grip drag hanya muncul saat overlay melayang (fullscreen).
  const [subtitleDY, setSubtitleDY] = useState(0);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem("wl-subtitle-dy-v1"));
      if (Number.isFinite(v) && v !== 0) setSubtitleDY(v);
    } catch {}
  }, []);
  const subDragRef = useRef<{ y: number; cur: number } | null>(null);
  const persistSubtitleDY = useCallback((v: number) => {
    try {
      if (v === 0) localStorage.removeItem("wl-subtitle-dy-v1");
      else localStorage.setItem("wl-subtitle-dy-v1", String(Math.round(v)));
    } catch {}
  }, []);
  const onSubDragStart = useCallback(
    (e: React.PointerEvent) => {
      subDragRef.current = { y: e.clientY, cur: subtitleDY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
      // [watch-subtitle-drag-v1] Bersihkan seleksi teks yang mungkin terlanjur
      // terbentuk — kalau tidak, sorotan ::selection (teal brand) tampak seperti
      // "pita hijau" melintang di atas video.
      try {
        window.getSelection()?.removeAllRanges();
      } catch {}
    },
    [subtitleDY],
  );
  const onSubDragMove = useCallback((e: React.PointerEvent) => {
    const d = subDragRef.current;
    if (!d) return;
    // Boleh naik hampir sampai atas layar; turun dibatasi sedikit (subtitle sudah
    // menempel dekat dasar video).
    const next = Math.min(
      40,
      Math.max(-window.innerHeight * 0.72, d.cur + (e.clientY - d.y)),
    );
    subDragRef.current = { y: e.clientY, cur: next };
    setSubtitleDY(next);
  }, []);
  const onSubDragEnd = useCallback(() => {
    const d = subDragRef.current;
    subDragRef.current = null;
    if (d) persistSubtitleDY(d.cur);
  }, [persistSubtitleDY]);
  const resetSubtitleDY = useCallback(() => {
    setSubtitleDY(0);
    persistSubtitleDY(0);
  }, [persistSubtitleDY]);
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

  // ── Auto-fullscreen saat video dibuka ────────────────────────────────────────
  // Buka video = langsung layar penuh, jadi tab & chrome browser (Safari) tersembunyi
  // dan fokus penuh ke tontonan. Dipanggil di mount effect: klik kartu video barusan
  // masih dalam jendela "transient activation" (~5 dtk), jadi requestFullscreen diizinkan.
  // Di iOS (fullscreen elemen tak didukung) call gagal diam-diam — user tetap bisa
  // pakai tombol fullscreen manual. Hanya sekali per pembukaan player.
  const autoFsTriedRef = useRef(false);
  useEffect(() => {
    if (autoFsTriedRef.current) return;
    autoFsTriedRef.current = true;
    const el = rootRef.current;
    if (!el) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = el as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = document as any;
    // Sudah fullscreen (mis. balik dari miniplayer) → jangan panggil lagi.
    if (document.fullscreenElement ?? d.webkitFullscreenElement) return;
    try {
      const p = (el.requestFullscreen ?? e.webkitRequestFullscreen)?.call(el);
      // requestFullscreen mengembalikan Promise yang bisa reject (mis. tanpa gesture);
      // telan penolakannya supaya tak ada unhandled rejection di console.
      if (p && typeof p.catch === "function") p.catch(() => {});
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
          // Video ber-"auto-dub": YouTube memilih audio track default sesuai
          // bahasa player (hl), yang kalau tak diset ikut locale browser dan
          // sering jatuh ke dub Inggris — video Korea keluar suara Inggris.
          // Set hl = bahasa target belajar (= bahasa asli video) supaya player
          // memilih audio track ORIGINAL, bukan dub.
          hl: langCode,
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
            // [watch-endscreen-recs-v1] Habis → layar akhir; putar lagi → tutup.
            if (e.data === 0) setEnded(true);
            else if (e.data === 1) setEnded(false);
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
    setEnded(false);
    setAutoCount(null);
  }, [video.videoId]);

  // [watch-endscreen-recs-v1] Muat katalog tab "Siap" bahasa ini (video ber-transkrip
  // → buka instan) sebagai sumber rekomendasi layar akhir. Cache module-level per
  // bahasa; jalan sekali di background begitu player dibuka, siap saat video habis.
  useEffect(() => {
    let cancelled = false;
    const hit = READY_REC_CACHE.get(langCode);
    if (hit && Date.now() - hit.at < READY_REC_TTL_MS) {
      setEndReady(hit.videos);
      return;
    }
    fetchReadyVideos(langCode)
      .then((vids) => {
        if (cancelled) return;
        READY_REC_CACHE.set(langCode, { videos: vids, at: Date.now() });
        setEndReady(vids);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [langCode]);

  // Rekomendasi layar akhir: utamakan video yang levelnya PERSIS sama dengan video
  // yang baru ditonton (belajar A1 → rekomendasi A1). Kalau yang se-level < 3, lengkapi
  // dengan level lain supaya layar tak sepi. Selalu buang video yang sedang diputar.
  const endRecs = useMemo(() => {
    const pool = endReady.filter((v) => v.videoId !== video.videoId);
    const lvl = video.level ?? null;
    if (!lvl) return pool.slice(0, 6);
    const matched = pool.filter((v) => v.level === lvl);
    if (matched.length >= 3) return matched.slice(0, 6);
    const rest = pool.filter((v) => v.level !== lvl);
    return [...matched, ...rest].slice(0, 6);
  }, [endReady, video.videoId, video.level]);
  const primaryRec = endRecs[0] ?? null;

  // Hitung-mundur auto-play kartu utama (ala Netflix "next episode in Ns"). Dibatalkan
  // lewat `autoCancelRef` — dipakai tombol "Batal" agar interval berhenti tapi layar
  // rekomendasi tetap terbuka untuk dipilih manual.
  const autoCancelRef = useRef(false);
  const cancelAutoplay = useCallback(() => {
    autoCancelRef.current = true;
    setAutoCount(null);
  }, []);
  useEffect(() => {
    if (!ended || mini || !primaryRec || !onSelectVideo) {
      setAutoCount(null);
      return;
    }
    autoCancelRef.current = false;
    let n = AUTOPLAY_SECS;
    setAutoCount(n);
    const id = setInterval(() => {
      if (autoCancelRef.current) {
        clearInterval(id);
        return;
      }
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setAutoCount(null);
        onSelectVideo(primaryRec);
      } else {
        setAutoCount(n);
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended, mini, primaryRec?.videoId, onSelectVideo]);

  // Tonton lagi dari awal (tombol di layar akhir) — tutup layar + putar ulang.
  const replayVideo = useCallback(() => {
    setEnded(false);
    setAutoCount(null);
    const p = playerRef.current;
    try {
      p?.seekTo?.(0, true);
      p?.playVideo?.();
    } catch {
      /* abaikan */
    }
  }, []);

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

  // [watch-back-mini-v1] Tombol "kembali" di kiri-atas: kecilkan player jadi kotak
  // melayang pojok kanan-bawah SEKALIGUS jeda video — pengguna berhenti fokus
  // menonton (mau menjelajah katalog di belakang), jadi audio ikut berhenti.
  const backToMini = useCallback(() => {
    enterMini();
    playerRef.current?.pauseVideo?.();
  }, [enterMini]);

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
      // Transkrip + subtitle kita sudah siap → matikan CC bawaan YouTube yang tadi
      // dinyalakan sbagai fallback saat loading. Kalau tidak, caption dobel (CC
      // YouTube + subtitle kita) menumpuk di atas video.
      setShowCC(false);

      // Cue berbahasa penjelas (mis. penutur Ukraina menjelaskan pakai Inggris)
      // sudah beraksara Latin — JANGAN diromanisasi (hasilnya duplikat/ngawur) &
      // jangan buang kuota Gemini untuknya: kirim "" sebagai gantinya.
      if (
        isNonLatin(langCode) &&
        ordered.some((c) => !c.translit && !cueIsExplanation(c, langCode))
      ) {
        setTranslitLoading(true);
        transliterateLines(
          ordered.map((c) => (cueIsExplanation(c, langCode) ? "" : c.target)),
          langCode
        )
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
    // Terjemahan bahasa ini SUDAH tersimpan bareng transkrip (cue.baseAlt) → pasang
    // langsung, tanpa kedip "Menerjemahkan…" maupun panggilan jaringan. Inilah yang
    // bikin pindah ke Inggris (dst.) instan begitu video pernah diterjemahkan.
    const preloaded = baseAltFromCues(cuesRef.current, baseLang);
    if (preloaded) {
      setBaseTranslating(false);
      setCues((prev) =>
        prev.length === preloaded.length
          ? prev.map((c, i) => ({ ...c, base: preloaded[i] ?? c.base }))
          : prev
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
        // Tempel juga ke cue.baseAlt di memori → balik-balik antar bahasa terjemahan
        // dalam sesi ini pun instan (baseAltFromCues langsung kena, tanpa kedip).
        setCues((prev) =>
          prev.length === bases.length
            ? prev.map((c, i) => ({
                ...c,
                base: bases[i] ?? "",
                baseAlt: { ...(c.baseAlt ?? {}), [baseLang]: bases[i] ?? "" },
              }))
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

  // ── Precompute analisa (mode Analisa instan) — IKUT bahasa terjemahan ─────────
  // Peta target→indeks cue: satu kalimat bisa muncul di beberapa cue, dan breakdown
  // = fungsi murni kalimat, jadi hasil dipakai untuk semua indeks yang cocok.
  // Di-key juga oleh baseLang: ganti bahasa terjemahan → arti per-kata dihitung
  // ulang dalam bahasa itu (dulu selalu Indonesia walau pengguna pilih Inggris).
  useEffect(() => {
    if (!cuesReadyKey) return;
    let cancelled = false;
    setBreakdowns({});
    const ordered = cuesRef.current;
    const targetToIdx = new Map<string, number[]>();
    ordered.forEach((c, i) => {
      const arr = targetToIdx.get(c.target);
      if (arr) arr.push(i);
      else targetToIdx.set(c.target, [i]);
    });
    // Breakdown bawaan transkrip (cache lintas-pengguna di server) selalu Indonesia
    // → hanya di-seed saat bahasa terjemahan Indonesia; bahasa lain di-warm ulang.
    // Hanya seed versi terbaru; yang lawas (tanpa arti per-kata) ikut dihitung ulang.
    const canSeed = baseLang === DEFAULT_BASE_LANG;
    if (canSeed) {
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
    }
    const needWarm = Array.from(
      new Set(
        ordered
          .filter((c) => !(canSeed && isFreshBreakdown(c.breakdown)))
          .map((c) => c.target)
      )
    );
    if (!needWarm.length) return;
    // Beri jeda kecil sebelum warm massal biar tak rebutan dgn render subtitle
    // + transliterasi awal (paint pertama tetap mulus). isCancelled dicek lagi
    // di dalam prewarm, jadi ganti video/bahasa/unmount saat menunggu aman.
    const warmTimer = window.setTimeout(() => {
      if (cancelled) return;
      void prewarmBreakdowns({
        videoId: video.videoId,
        langCode,
        baseCode: baseLang,
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
    return () => {
      cancelled = true;
      window.clearTimeout(warmTimer);
    };
    // cuesRef sengaja bukan dependency (ref); cuesReadyKey sudah mewakili cue siap
    // (termasuk videoId + langCode).
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

  // Waktu yang dipakai SEMUA sorotan (baris aktif, karaoke, panel transkrip) —
  // langsung waktu player. Dipusatkan di sini biar baris fokus & panel selalu kompak.
  const syncedTime = time;

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
  // Ambang diketatkan 1.2→0.6s: saat adegan cuma gerak tanpa dialog, subtitle cepat
  // hilang (tak menggantung membingungkan); jeda napas ≤0.6s tetap ditahan.
  const GAP_HIDE = 0.6;
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
        .then((r) => setAligns((prev) => ({ ...prev, [i]: r })))
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
    const out: Record<
      number,
      { tGroup: number[]; bGroup: number[]; firstT: number[]; expr: number[][] }
    > = {};
    for (const key of Object.keys(aligns)) {
      const i = Number(key);
      const a = aligns[i];
      const groups = a?.groups;
      const expr = a?.expr ?? [];
      // Simpan entri kalau ada penjajaran ATAU ada ekspresi (chunking bisa pakai salah satu).
      if ((!groups || !groups.length) && !expr.length) continue;
      // [watch-context-phrase-v1] Gabungkan grup yang berbagi indeks kata TARGET yang
      // sama. Model kadang menyerakkan padanan satu kata ke beberapa grup (mis. "Let's"
      // → grup {b:ayo} DAN {b:kita}); tanpa penggabungan, `tGroup[t]` yang last-write-wins
      // cuma menyimpan padanan TERAKHIR ("kita") & "ayo" hilang. Union-find atas indeks
      // grup, disatukan bila berbagi indeks target → satu kata menyala di SEMUA artinya.
      const raw = groups ?? [];
      const parent = raw.map((_, gi) => gi);
      const find = (x: number): number => {
        while (parent[x] !== x) {
          parent[x] = parent[parent[x]];
          x = parent[x];
        }
        return x;
      };
      const seenT = new Map<number, number>();
      raw.forEach((g, gi) => {
        g.t.forEach((t) => {
          const prev = seenT.get(t);
          if (prev == null) seenT.set(t, gi);
          else parent[find(prev)] = find(gi);
        });
      });
      // Kumpulkan tiap komponen → himpunan indeks target & terjemahannya.
      const compT = new Map<number, Set<number>>();
      const compB = new Map<number, Set<number>>();
      raw.forEach((g, gi) => {
        const r = find(gi);
        if (!compT.has(r)) {
          compT.set(r, new Set());
          compB.set(r, new Set());
        }
        g.t.forEach((t) => compT.get(r)!.add(t));
        g.b.forEach((b) => compB.get(r)!.add(b));
      });
      // Beri id grup baru urut indeks target terkecil (stabil untuk firstT).
      const comps = [...compT.keys()]
        .map((r) => ({ t: compT.get(r)!, b: compB.get(r)! }))
        .filter((c) => c.t.size > 0)
        .sort((a, b) => Math.min(...a.t) - Math.min(...b.t));
      const tGroup: number[] = [];
      const bGroup: number[] = [];
      const firstT: number[] = [];
      comps.forEach((c, gi) => {
        firstT[gi] = Math.min(...c.t);
        c.t.forEach((t) => (tGroup[t] = gi));
        c.b.forEach((b) => (bGroup[b] = gi));
      });
      out[i] = { tGroup, bGroup, firstT, expr };
    }
    return out;
  }, [aligns]);

  // Kumpulan ordinal yang harus menyala saat ini untuk baris `i` — mengikuti grup
  // penjajaran kalau ada (frasa menyala utuh), kalau tidak cuma kata yang di-hover.
  // [watch-context-phrase-v1] Kalau kata yang di-hover jatuh dalam SATU rentang
  // ekspresi (`expr`, mis. "you're in" → [3,4]), sorot SELURUH rentang di sisi target
  // DAN gabungan semua arti kata-katanya di sisi terjemahan ("kamu ikut") — biar frasa
  // & padanannya menyala sewarna satu unit, bukan cuma kata yang disentuh.
  const hotSets = useCallback(
    (i: number): { t: Set<number>; b: Set<number> } => {
      const t = new Set<number>();
      const b = new Set<number>();
      if (!hoverWord || hoverWord.i !== i) return { t, b };
      const m = alignMaps[i];
      // Ordinal target yang menyala: kata yang di-hover + anggota grup penjajarannya +
      // (kalau ada) seluruh rentang ekspresi yang memuatnya.
      const lightT = new Set<number>([hoverWord.k]);
      if (m) {
        const g = m.tGroup[hoverWord.k];
        if (g != null && g >= 0) m.tGroup.forEach((gg, k) => gg === g && lightT.add(k));
        const span = (m.expr ?? []).find((sp) => sp.includes(hoverWord.k));
        if (span) span.forEach((k) => lightT.add(k));
      }
      lightT.forEach((k) => t.add(k));
      // Sisi terjemahan: gabungan arti tiap kata target yang menyala (via grupnya).
      if (m)
        lightT.forEach((k) => {
          const g = m.tGroup[k];
          if (g != null && g >= 0) m.bGroup.forEach((gg, bj) => gg === g && b.add(bj));
        });
      return { t, b };
    },
    [hoverWord, alignMaps]
  );

  // [watch-phrase-chunk-v1] Pengelompokan frasa per baris cue ("the king" → 1 unit).
  // Sinyal: kelas kata (breakdown, di-prewarm semua baris) untuk frasa benda +
  // penjajaran AI (alignMaps, ada di baris aktif/hover) untuk idiom/phrasal verb.
  // Dihitung hanya untuk baris yang breakdown/penjajarannya sudah termuat (baris lain
  // → null = sorot per-kata, terisi otomatis begitu breakdown-nya hangat). Di-memo
  // per (breakdowns/aligns/cues) — BUKAN per tick karaoke — supaya tak dihitung ulang
  // tiap frame saat daftar transkrip re-render.
  const cueChunks = useMemo(() => {
    const out: Record<number, CueChunks | null> = {};
    cues.forEach((c, i) => {
      const bd = breakdowns[i];
      const breakdown = bd && typeof bd === "object" ? bd : null;
      const alignTGroup = alignMaps[i]?.tGroup ?? null;
      const exprSpans = alignMaps[i]?.expr ?? null;
      out[i] = breakdown || alignTGroup || exprSpans
        ? computeCueChunks({ target: c.target, langCode, breakdown, alignTGroup, exprSpans })
        : null;
    });
    return out;
  }, [cues, breakdowns, alignMaps, langCode]);

  // Auto-scroll baris aktif ke tengah panel transkrip.
  // Kita hitung scrollTop container sendiri (bukan scrollIntoView) supaya HANYA
  // panel transkrip yang bergerak — scrollIntoView merambat ke semua leluhur yang
  // bisa discroll (window/overlay) sehingga saat pindah baris terasa "mantul"
  // menyentak ke atas. Dengan scrollTo terarah, geser antar-section jadi mulus.
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const container = listRef.current;
    const el = container.querySelector<HTMLElement>(`[data-cue="${activeIdx}"]`);
    if (!el) return;
    const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
    const max = container.scrollHeight - container.clientHeight;
    container.scrollTo({ top: Math.min(Math.max(0, target), Math.max(0, max)), behavior: "smooth" });
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
      getSentenceBreakdown({ sentence: cue.target, langCode, baseCode: baseLang })
        .then((b) => setBreakdowns((prev) => ({ ...prev, [idx]: b })))
        .catch(() => setBreakdowns((prev) => ({ ...prev, [idx]: "error" })));
    },
    [cues, langCode, baseLang]
  );

  // Saat mode Analisa aktif, ambil breakdown untuk cue yang sedang tayang.
  useEffect(() => {
    if (analyze && activeIdx >= 0 && breakdowns[activeIdx] === undefined) {
      requestBreakdown(activeIdx);
    }
  }, [analyze, activeIdx, breakdowns, requestBreakdown]);

  const onWordTap = useCallback(
    (e: React.MouseEvent, word: string, sentence: string, wordIdx?: number, wordEndIdx?: number) => {
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
      // [watch-tap-deliberate-pause-v1] Tap kata = jeda DISENGAJA: lepas tanda
      // hover-pause supaya kursor yang keluar dari baris subtitle (mis. naik ke
      // tooltip untuk dijelajahi) TAK melanjutkan video otomatis. Siswa harus tekan
      // play/space/enter sendiri saat sudah selesai.
      playerRef.current?.pauseVideo?.();
      hoverPausedRef.current = false;
      setHoverPaused(false);
      // Bahasa analisa mengikuti bahasa cue: kata di baris penjelas (mis. kalimat
      // Inggris di video Ukraina) dianalisis sebagai bahasa itu, bukan bahasa target.
      const cue = cues.find((c) => c.target === sentence);
      const lang = cue
        ? cueAnalysisLang(cue, langCode)
        : isExplanationCue(sentence, langCode)
        ? "en"
        : langCode;
      // Tap kata saat drawer Analisa Kalimat terbuka → beralih ke arti kata (tutup
      // drawer kalimat biar tak dobel panel).
      setSentenceCue(null);
      setAnchor({
        id: ++anchorSeq.current,
        word,
        sentence,
        x: e.clientX,
        y: e.clientY,
        wordIdx,
        wordEndIdx,
        lang,
        // Drawer Analisa sudah terbuka → langsung muat ulang drawer di tempat (bukan
        // balik ke popup) supaya mulus tanpa kedipan. Belum ada drawer → popup dulu.
        autoStudy: wordStudyOpenRef.current,
      });
    },
    [langCode, video.videoId, cues]
  );

  // [watch-hover-open-removed] Hover kata TIDAK lagi membuka balon arti — pengguna
  // WAJIB klik kata dulu (permintaan: hover cuma menyorot/sinkron, pop-up hanya via
  // klik). Handler hover-open dijadikan undefined supaya KaraokeWord/Phrase tak
  // menjadwalkan tap otomatis; sorot-sinkron kata↔arti (onHover) tetap jalan.
  const onWordHoverOpen = undefined;
  const clearHoverOpen = undefined;

  // [watch-seek-shared-v1] Isi bar seek (label waktu berjalan + slider + durasi total)
  // dipakai di DUA tempat: melayang di dasar video (mode normal) DAN di baris kontrol
  // bawah saat layar penuh — supaya slider + durasi ikut auto-hide bareng tombol.
  const seekControls = (
    <>
      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-white/90">
        {fmtClock(scrubbing ? scrubVal : hoverSeek ?? time)}
      </span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step="any"
        value={
          duration ? Math.min(scrubbing ? scrubVal : hoverSeek ?? time, duration) : 0
        }
        disabled={!duration}
        // Bekukan penanda saat kursor masuk (pakai waktu paling akurat dari player),
        // lepas saat keluar — kecuali sedang menyeret.
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
          // Masih hover setelah lepas seret → bekukan di posisi baru supaya penanda
          // tak lompat balik ke waktu play lama.
          setHoverSeek(v);
        }}
        onKeyUp={(e) => seekTo(parseFloat((e.target as HTMLInputElement).value))}
        // Slider netral (tanpa warna aksen) — fill putih & penanda posisi berupa
        // lingkaran; --pct menggerakkan panjang fill lewat CSS.
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
    </>
  );

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-[90] flex flex-col ${
        // [watch-back-mini-v1] Mode mini = PiP ala YouTube: overlay jadi TEMBUS
        // (transparan + click-through) supaya beranda Watch & Learn di belakang
        // tampil & bisa diklik/di-scroll; hanya kotak video melayang yang aktif.
        mini ? "pointer-events-none" : ""
      } ${fullscreen && chromeHidden ? "cursor-none" : ""}`}
      style={{
        backgroundColor: mini ? "transparent" : "rgba(6,9,10,0.96)",
        "--drawer-w": `${drawerWidth}px`,
      } as React.CSSProperties}
    >
      {/* Header — judul + tombol kosakata + bahasa terjemahan + bahasa dipelajari + tutup.
          Di layar penuh: header lepas dari flow (absolute) di tepi ATAS & auto-hide —
          geser naik keluar layar saat chrome disembunyikan (kursor diam), muncul lagi
          saat kursor bergerak. Kontrol YouTube sudah dimatikan (controls:0) jadi header
          kita bebas menempati sudut atas: judul kiri, language selector kanan.
          [watch-back-mini-v1] Disembunyikan di mode mini — kotak melayang punya
          strip kontrolnya sendiri & beranda di belakang yang jadi fokus. */}
      {!mini && (
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
        {/* [watch-back-mini-v1] Tombol kembali di kiri-atas → kecilkan jadi kotak
            melayang pojok kanan-bawah + jeda video. Hanya tampil di mode penuh
            (di mode mini sudah ada kontrol sendiri). mr-auto mendorong kontrol
            bahasa/tutup tetap ke kanan. */}
        {!mini ? (
          <button
            onClick={backToMini}
            className="group relative mr-auto inline-flex shrink-0 items-center justify-center rounded-full p-2 text-white"
            aria-label="Kembali (kecilkan video)"
          >
            <TabBg />
            <span className="relative inline-flex">
              <ArrowLeft className="h-5 w-5 text-white" />
            </span>
            <IconTooltip side="bottom">Kembali</IconTooltip>
          </button>
        ) : (
          <div className="mr-auto" />
        )}

        {/* Jumlah kosakata yang disimpan di video ini → buka deck kosakata.
            Ikon saja + badge jumlah; tab latar & tooltip muncul saat hover. */}
        {onOpenVocab && (
          <button
            onClick={onOpenVocab}
            className="group relative inline-flex shrink-0 items-center justify-center rounded-full p-2 text-white"
            aria-label="Kosakata tersimpan dari video ini"
          >
            <TabBg />
            <span className="relative inline-flex items-center">
              <Layers className="h-4 w-4 shrink-0" color={TEAL} />
              {savedCount > 0 && (
                <span
                  className="ml-1.5 shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-extrabold leading-none"
                  style={{ backgroundColor: "rgba(26,158,158,0.2)", color: "#7FE0E0" }}
                >
                  {savedCount}
                </span>
              )}
            </span>
            <IconTooltip side="bottom">Kosakata</IconTooltip>
          </button>
        )}

        {/* Pemilih bahasa GABUNGAN — satu tombol menampilkan dua bendera dipisah
            "/": kiri = bahasa saya (terjemahan), kanan = bahasa yang dipelajari.
            Hover → satu dropdown dengan dua section ("Bahasa saya" + "Bahasa
            target"), seragam dengan katalog Watch & Learn (WatchAndLearn.tsx).
            Bridge `pt-2` menutup celah trigger↔panel supaya kursor tak jatuh
            keluar & menutup dropdown saat mengarah ke pilihan. */}
        {(onPickLang || onChangeLang || onChangeBaseLang) &&
          (() => {
            const wl = getImmersionLang(langCode);
            const pick = (code: string) => {
              setLearnMenuOpen(false);
              if (code !== langCode) (onPickLang ?? (() => onChangeLang?.()))(code);
            };
            return (
              <div
                className="relative shrink-0"
                onMouseEnter={() => setLearnMenuOpen(true)}
                onMouseLeave={() => setLearnMenuOpen(false)}
              >
                <button
                  onClick={() => setLearnMenuOpen((v) => !v)}
                  title={`${getBaseLangDef(baseLang).label} → ${wl?.name ?? langCode}`}
                  aria-label={`Bahasa saya ${getBaseLangDef(baseLang).label}, bahasa yang dipelajari ${wl?.name ?? langCode}`}
                  className="group relative inline-flex items-center justify-center rounded-full p-2 text-white"
                  aria-expanded={learnMenuOpen}
                >
                  <TabBg active={learnMenuOpen} />
                  <span className="relative inline-flex items-center gap-1.5">
                    <RectFlag code={getBaseLangDef(baseLang).country} h={16} />
                    <span className="text-white/35">/</span>
                    {wl ? <RectFlag code={wl.country} h={16} /> : <Languages className="h-4 w-4 shrink-0" color={TEAL} />}
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${learnMenuOpen ? "rotate-180" : ""}`}
                      color={TEAL}
                    />
                  </span>
                  {!learnMenuOpen && (
                    <IconTooltip side="bottom">
                      {getBaseLangDef(baseLang).label} → {wl?.name ?? langCode}
                    </IconTooltip>
                  )}
                </button>
                <div
                  className={`absolute right-0 top-full z-30 pt-2 transition-all duration-150 ease-out ${
                    learnMenuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
                  }`}
                >
                  <LangPickerPanel
                    open={learnMenuOpen}
                    langCode={langCode}
                    onPick={pick}
                    recentCodes={recentLangCodes}
                    readyCounts={readyCounts}
                    title="Bahasa target (yang mau dipelajari)"
                    baseLangs={onChangeBaseLang ? BASE_LANGS.filter((b) => b.code !== langCode) : undefined}
                    baseLangCode={baseLang}
                    onPickBase={
                      onChangeBaseLang
                        ? (code) => {
                            if (code !== baseLang) onChangeBaseLang(code);
                          }
                        : undefined
                    }
                  />
                </div>
              </div>
            );
          })()}
        <button
          onClick={onClose}
          className="group relative inline-flex shrink-0 items-center justify-center rounded-full p-2 text-white"
          aria-label="Tutup player"
        >
          <TabBg />
          <span className="relative inline-flex">
            <X className="h-5 w-5 text-white" />
          </span>
          <IconTooltip side="bottom">Tutup</IconTooltip>
        </button>
        </div>
      </div>
      )}

      {/* Isi — split view. Di layar penuh beri ruang atas (pt) supaya video +
          subtitle turun & tak tertutup baris header (judul kiri / tombol kanan). */}
      <div
        ref={splitRowRef}
        className={`flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row ${fullscreen ? "pt-14" : ""} ${
          anyDrawerOpen ? "lg:pr-[var(--drawer-w)]" : ""
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
                ? "group pointer-events-auto fixed bottom-4 right-4 z-20 flex w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-black shadow-2xl"
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
                  : // [watch-responsive-subtitle-v1] Batasi tinggi video agar SELALU
                    // sisa ruang untuk subtitle + kontrol di bawahnya. Di layar
                    // pendek (HP/tablet landscape) 70vh menelan hampir seluruh layar
                    // → subtitle kepotong; sisihkan ~200px utk header+subtitle+kontrol.
                    { maxHeight: "min(70vh, calc(100dvh - 200px))" }
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
                  {/* [watch-yt-title-v1] Judul + channel di sudut KIRI-ATAS ala YouTube —
                      muncul saat dijeda / kursor aktif, meredup mulus saat menonton
                      lancar. pointer-events-none supaya klik tetap menembus ke tombol
                      play/jeda di bawahnya. Disembunyikan saat layar-diam Netflix aktif
                      (judulnya sudah tampil besar di sana). */}
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 z-[6] select-none bg-gradient-to-b from-black/75 via-black/25 to-transparent px-4 pb-8 pt-3 transition-opacity duration-300 ${
                      (!playing || videoHot) && !idlePaused ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <p className="line-clamp-2 text-[15px] font-bold leading-snug text-white drop-shadow sm:text-[17px]">
                      {video.title}
                    </p>
                    {video.channel && (
                      <p className="mt-0.5 text-[12px] font-medium text-white/70">{video.channel}</p>
                    )}
                  </div>
                  {/* [watch-idle-thumb-v1] Layar diam ala Netflix: jeda disengaja > 10 dtk
                      → thumbnail besar object-cover + gradien kiri/bawah + judul & tombol
                      lanjut. Tidak muncul saat menganalisis kata (tooltip/drawer terbuka)
                      supaya frame tetap terlihat. Klik di mana pun = lanjut menonton. */}
                  {idlePaused && !anchor && !anyDrawerOpen ? (
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label="Lanjut menonton"
                      className="group/idle wl-idle-in absolute inset-0 z-[6] cursor-pointer overflow-hidden text-left"
                    >
                      {/* [watch-idle-thumb-hires-v1] Layar besar → pakai maxresdefault
                          (1280×720) biar tajam saat di-stretch fullscreen; hqdefault
                          (480×360) bikin buram. maxres kadang 404 → fallback bertingkat
                          maxres → hqdefault (jangan balik ke video.thumbnail yang malah
                          lebih kecil).
                          [watch-idle-thumb-placeholder-fix] GOTCHA: utk banyak video
                          (spt podcast ini) maxresdefault TIDAK 404 saat tak ada —
                          YouTube malah balas placeholder abu-abu 120×90 dgn status 200,
                          jadi onError tak pernah jalan & yg tampil kotak abu buram saat
                          dijeda. Deteksi lewat onLoad: kalau naturalWidth ≤ 120 (ciri
                          placeholder), jatuh ke hqdefault yg pasti gambar asli. */}
                      <img
                        src={youtubeThumbMax(video.videoId)}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 h-full w-full scale-105 object-cover"
                        onLoad={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          const hq = youtubeThumb(video.videoId);
                          // Placeholder abu-abu maxres = 120×90 → ganti ke hqdefault.
                          if (img.naturalWidth > 0 && img.naturalWidth <= 120 && img.src !== hq) {
                            img.src = hq;
                          }
                        }}
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          const hq = youtubeThumb(video.videoId);
                          if (img.src !== hq) img.src = hq;
                        }}
                      />
                      {/* Gradien Netflix: gelap dari kiri + dari bawah supaya teks terbaca */}
                      <span className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />
                      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:p-8">
                        <span className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                            Dijeda
                          </span>
                          <span className="line-clamp-2 max-w-[70%] text-[20px] font-extrabold leading-tight text-white drop-shadow sm:text-[26px]">
                            {video.title}
                          </span>
                          {video.channel && (
                            <span className="text-[13px] font-semibold text-white/75">{video.channel}</span>
                          )}
                        </span>
                        <span className="relative inline-flex w-fit items-center gap-2 overflow-hidden rounded-full bg-white px-5 py-2 text-[14px] font-bold text-black transition-transform group-hover/idle:scale-105">
                          <Play className="relative z-10 h-4 w-4" fill="currentColor" />
                          <span className="relative z-10">Lanjut menonton</span>
                          {/* Bar progres looping kiri→kanan (indeterminate) — garis teal
                              tipis di dasar pill yang tumbuh berulang biar tombol "hidup". */}
                          <span
                            aria-hidden
                            className="wl-idle-bar absolute inset-x-0 bottom-0 h-[3px] rounded-full"
                            style={{ backgroundColor: TEAL }}
                          />
                        </span>
                      </span>
                    </button>
                  ) : (
                    /* [watch-pause-keep-frame-v1] Saat DIJEDA (belum 5 dtk), tampilkan
                        tombol putar besar di tengah TAPI biarkan frame video tetap
                        kelihatan. Cuma scrim tipis biar tombol terbaca. */
                    !playing && !hoverPaused && (
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
                    )
                  )}
                  {/* Bar seek + durasi melayang di dasar video — HANYA mode normal (bukan
                      layar penuh). Muncul saat kursor aktif di atas video, atau selalu
                      saat dijeda; auto-hide saat kursor DIAM (videoHot=false) ala YouTube;
                      tetap tampil selama menyeret / hover slider / fokus keyboard. Di layar
                      penuh slider dipindah ke atas baris kontrol (ikut auto-hide bareng
                      tombol) — lihat "bottom chrome" di bawah. */}
                  {!fullscreen && (
                    <div
                      className={`absolute inset-x-0 bottom-0 z-[7] flex items-center gap-2 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3 pb-2 pt-7 transition-opacity duration-150 focus-within:opacity-100 ${
                        !playing || videoHot || scrubbing || hoverSeek !== null
                          ? "opacity-100"
                          : "pointer-events-none opacity-0"
                      }`}
                    >
                      {seekControls}
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
                  )}
                </>
              )}
              {/* [watch-endscreen-recs-v1] Layar akhir ala Netflix — video habis →
                  overlay rekomendasi "berikutnya" dari tab "Siap" yang levelnya sesuai
                  video ini. Kartu utama auto-play dengan hitung-mundur; sisanya bisa
                  dipilih manual. Menutupi layar-akhir bawaan YouTube (z di atas kontrol). */}
              {ended && !mini && (
                <div className="wl-idle-in absolute inset-0 z-[8] overflow-y-auto bg-black/92 backdrop-blur-sm">
                  <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8">
                    {/* Header + tombol tutup layar akhir (kembali lihat frame terakhir). */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                          Selesai ditonton
                        </p>
                        <h3 className="mt-1 text-[18px] font-extrabold leading-tight text-white sm:text-[22px]">
                          {video.level ? (
                            <>
                              Lanjut belajar{" "}
                              <span
                                className="inline-flex items-center rounded-md px-1.5 py-0.5 align-middle text-[13px] font-black sm:text-[15px]"
                                style={{
                                  backgroundColor: CEFR_STYLE[video.level as CefrLevel].bg,
                                  color: CEFR_STYLE[video.level as CefrLevel].fg,
                                }}
                              >
                                {video.level}
                              </span>
                            </>
                          ) : (
                            "Tonton berikutnya"
                          )}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          cancelAutoplay();
                          setEnded(false);
                        }}
                        title="Tutup"
                        className="shrink-0 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {primaryRec && onSelectVideo ? (
                      <>
                        {/* Kartu utama: thumbnail besar + judul + level + hitung-mundur. */}
                        <button
                          type="button"
                          onClick={() => {
                            cancelAutoplay();
                            onSelectVideo(primaryRec);
                          }}
                          className="group/next flex flex-col overflow-hidden rounded-2xl bg-white/[0.06] text-left ring-1 ring-white/10 transition-all hover:bg-white/[0.1] hover:ring-white/25 sm:flex-row"
                        >
                          <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-black sm:w-[46%]">
                            <img
                              src={primaryRec.thumbnail ?? youtubeThumb(primaryRec.videoId)}
                              alt=""
                              aria-hidden
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/next:scale-105"
                            />
                            <span className="absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition-opacity group-hover/next:opacity-100">
                              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95">
                                <Play className="ml-0.5 h-6 w-6 text-black" fill="currentColor" />
                              </span>
                            </span>
                            {primaryRec.duration ? (
                              <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold text-white">
                                {formatDuration(primaryRec.duration)}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 sm:p-5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                                Berikutnya
                              </span>
                              {primaryRec.level && (
                                <span
                                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-black"
                                  style={{
                                    backgroundColor: CEFR_STYLE[primaryRec.level as CefrLevel].bg,
                                    color: CEFR_STYLE[primaryRec.level as CefrLevel].fg,
                                  }}
                                >
                                  {primaryRec.level}
                                </span>
                              )}
                            </div>
                            <p className="line-clamp-2 text-[16px] font-extrabold leading-snug text-white sm:text-[18px]">
                              {primaryRec.title}
                            </p>
                            {primaryRec.channel && (
                              <p className="truncate text-[12px] font-medium text-white/55">
                                {primaryRec.channel}
                              </p>
                            )}
                            <span
                              className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2 text-[14px] font-bold text-black transition-transform group-hover/next:scale-[1.03]"
                            >
                              <Play className="h-4 w-4" fill="currentColor" />
                              {autoCount !== null ? `Putar dalam ${autoCount}s` : "Putar"}
                            </span>
                          </div>
                        </button>

                        <div className="flex flex-wrap items-center gap-3">
                          {autoCount !== null && (
                            <button
                              type="button"
                              onClick={cancelAutoplay}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold text-white/85 transition-colors hover:bg-white/20"
                            >
                              <X className="h-3.5 w-3.5" /> Batal auto-play
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={replayVideo}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold text-white/85 transition-colors hover:bg-white/20"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Tonton lagi
                          </button>
                        </div>

                        {/* Rekomendasi lain se-level (kalau ada). */}
                        {endRecs.length > 1 && (
                          <div className="mt-1">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
                              Lainnya untukmu
                            </p>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {endRecs.slice(1).map((v) => (
                                <button
                                  key={v.videoId}
                                  type="button"
                                  onClick={() => {
                                    cancelAutoplay();
                                    onSelectVideo(v);
                                  }}
                                  className="group/rec text-left"
                                >
                                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10 transition-all group-hover/rec:ring-white/30">
                                    <img
                                      src={v.thumbnail ?? youtubeThumb(v.videoId)}
                                      alt=""
                                      aria-hidden
                                      loading="lazy"
                                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/rec:scale-105"
                                    />
                                    {v.level && (
                                      <span
                                        className="absolute left-1.5 top-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black"
                                        style={{
                                          backgroundColor: CEFR_STYLE[v.level as CefrLevel].bg,
                                          color: CEFR_STYLE[v.level as CefrLevel].fg,
                                        }}
                                      >
                                        {v.level}
                                      </span>
                                    )}
                                    {v.duration ? (
                                      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1 py-0.5 text-[10px] font-bold text-white">
                                        {formatDuration(v.duration)}
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1.5 line-clamp-2 text-[12px] font-bold leading-snug text-white/90">
                                    {v.title}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Tak ada video "Siap" se-bahasa → cukup tawarkan tonton lagi. */
                      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
                        <p className="max-w-sm text-[14px] font-medium text-white/60">
                          Belum ada rekomendasi siap untuk bahasa ini. Tonton lagi atau cari
                          video lain lewat menu.
                        </p>
                        <button
                          type="button"
                          onClick={replayVideo}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-bold text-black transition-transform hover:scale-105"
                        >
                          <RotateCcw className="h-4 w-4" /> Tonton lagi
                        </button>
                      </div>
                    )}
                  </div>
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
              kosong antara video dan kontrol → subtitle turun & lebih lega.
              Saat panel Transkrip dibuka (mode transkrip, bukan layar penuh),
              subtitle di bawah video otomatis disembunyikan — kalimat aktif sudah
              tampil & tersorot di panel transkrip, jadi tak perlu diduplikasi. */}
          {/* [watch-idle-hide-subtitle-v1] Saat layar diam ala Netflix aktif (jeda
              disengaja > 5 dtk), sembunyikan subtitle+terjemahan biar tak menimpa
              thumbnail besar & judul. Begitu diputar/di-hover lagi idlePaused mati →
              subtitle balik. Tetap tampil saat jeda-hover baca (bukan idlePaused). */}
          {!mini && !(showPanel && !fullscreen) && !idlePaused && !hideSubtitle && (
          <div
            className={`flex flex-col ${
              fullscreen
                ? // Layar penuh: subtitle + terjemahan MELAYANG di atas video (video jadi
                  // latar, penuh sampai bawah — bukan lagi kotak hitam di bawah video).
                  // [watch-subtitle-drag-v1] Scrim gradien DIHAPUS biar rapi (tak ada
                  // "kotak" gelap menimpa video) — keterbacaan tetap terjaga oleh garis
                  // tepi hitam solid di teks ([watch-karaoke-solid-shadow]).
                  // pointer-events-none di pembungkus supaya area kosong tetap meneruskan
                  // klik ke video (play/jeda); hanya blok teks yang menangkap pointer.
                  // select-none: cegah blok teks ini keseleksi saat digeser/di-tap
                  // (sorotan ::selection teal bikin "pita hijau" menimpa video).
                  "pointer-events-none absolute inset-x-0 bottom-0 z-30 select-none justify-end px-4 pb-24 pt-12 sm:px-6"
                : "min-h-0 flex-1 overflow-y-auto py-2"
            }`}
          >
            {/* Subtitle nempel di bawah video (mb-auto dorong sisa ruang ke bawah)
                supaya baris kontrol terpisah jelas di dasar & tak menutupi
                terjemahan. Tetap bisa discroll kalau analisa bikin baris tinggi.
                Hover-pause TIDAK dipasang di pembungkus lebar-penuh ini — dioper ke
                FocusLine supaya hanya blok teks subtitle/terjemahan yang memicu jeda,
                bukan ruang kosong di kiri-kanannya. */}
            <div
              className={
                fullscreen
                  ? "group/subdrag pointer-events-auto relative w-full"
                  : "mb-auto mt-2 w-full"
              }
              style={
                fullscreen && subtitleDY !== 0
                  ? { transform: `translateY(${subtitleDY}px)` }
                  : undefined
              }
            >
              {/* [watch-subtitle-drag-v1] Grip untuk menyeret subtitle naik/turun.
                  Hanya di layar penuh (saat subtitle melayang di atas video). Klik-ganda
                  = kembalikan ke posisi bawaan. */}
              {fullscreen && (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Geser posisi subtitle (klik-ganda untuk reset)"
                  title="Seret untuk memindahkan subtitle • klik-ganda untuk reset"
                  onPointerDown={onSubDragStart}
                  onPointerMove={onSubDragMove}
                  onPointerUp={onSubDragEnd}
                  onPointerCancel={onSubDragEnd}
                  onDoubleClick={resetSubtitleDY}
                  className={`pointer-events-auto absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-[calc(100%+6px)] cursor-grab touch-none select-none items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm transition-opacity duration-150 active:cursor-grabbing ${
                    subtitleDY !== 0
                      ? "opacity-80"
                      : "opacity-0 group-hover/subdrag:opacity-80 focus:opacity-80"
                  }`}
                >
                  <GripHorizontal className="h-4 w-4" />
                </div>
              )}
              <div
                className={
                  fullscreen ? "max-h-[42vh] w-full overflow-y-auto text-center" : "w-full"
                }
              >
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
                showTarget={showTargetSub}
                // Tombol Analisa di bawah menggantikan subtitle di baris fokus ini
                // dengan breakdown grammar (arti + kelas kata per token) — inline,
                // bukan drawer. Drawer disisakan hanya untuk analisa per-kata (WordStudy).
                analyze={analyze}
                breakdown={activeIdx >= 0 ? breakdowns[activeIdx] : undefined}
                onWordTap={onWordTap}
                onWordHoverOpen={onWordHoverOpen}
                onWordHoverClose={clearHoverOpen}
                // [watch-tap-colored-v1] Kata/frasa yang barusan di-tap (balon arti
                // terbuka) tetap MENYALA teal — bukan cuma garis-bawah hover — biar
                // jelas kata mana yang lagi dibuka artinya. Cocok dengan cue aktif saja.
                tapped={
                  anchor && visibleCue && anchor.sentence === visibleCue.target && anchor.wordIdx != null
                    ? { lo: anchor.wordIdx, hi: anchor.wordEndIdx ?? anchor.wordIdx }
                    : null
                }
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
          </div>
          )}

          {/* Bottom chrome — di layar penuh, slider seek + durasi DAN baris kontrol
              dibungkus jadi satu blok yang melayang di dasar & auto-hide BARENG (ala
              YouTube). Di mode normal, pembungkus display:contents jadi tak berpengaruh
              (baris kontrol tetap mengalir di bawah video seperti semula). */}
          {!mini && (
          <div
            className={
              fullscreen
                ? `absolute inset-x-0 bottom-0 z-40 flex flex-col transition-all duration-300 ${
                    chromeHidden ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
                  }`
                : "contents"
            }
          >
            {/* Slider seek + durasi (khusus layar penuh) — tepat di atas baris tombol. */}
            {fullscreen && (
              <div className="flex items-center gap-2 bg-gradient-to-t from-black via-black/85 to-transparent px-4 pb-1 pt-6 focus-within:opacity-100 sm:px-6">
                {seekControls}
              </div>
            )}
          {/* Kontrol — di mobile jadi SATU baris yang bisa digeser mendatar (tak
              lagi membungkus jadi 3 baris berantakan); di ≥sm kembali membungkus. */}
          <div
            className={`flex items-center gap-2 overflow-x-auto border-t px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-6 [&::-webkit-scrollbar]:hidden ${
              fullscreen ? "justify-center bg-black" : "shrink-0"
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

            {/* [watch-subtitle-toggle-v2] Panel sakelar per bahasa: baris subtitle
                bahasa target & baris terjemahan, masing-masing bisa dimatikan. */}
            <SubtitleMenuButton
              showSentenceTr={showSentenceTr}
              onToggleSentenceTr={() => setShowSentenceTr((v) => !v)}
              showTargetSub={showTargetSub}
              onToggleTargetSub={() => setShowTargetSub((v) => !v)}
              hideSubtitle={hideSubtitle}
              targetLabel={getImmersionLang(langCode)?.name ?? langCode}
              targetFlag={getImmersionLang(langCode)?.country}
              baseLabel={getBaseLangDef(baseLang).label}
              baseFlag={getBaseLangDef(baseLang).country}
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

            {/* [watch-sentence-study-v1] Analisa kalimat/riwayat — dipindah dari FAB
                melayang ke baris kontrol, tepat di kiri tombol layar penuh. Aksi
                utama: analisa KALIMAT yang sedang tayang; fallback ke kata terakhir /
                panel riwayat kalau tak ada kalimat tayang. */}
            <ToolButton
              glyph={<Sparkles className="h-4 w-4" />}
              label="Analisa kalimat"
              active={historyOpen}
              title={historyOpen ? "Tutup riwayat" : "Analisa kalimat tayang (AI)"}
              onClick={() => {
                if (historyOpen) return setHistoryOpen(false);
                const cue = visibleCue ?? activeCue;
                if (cue && cue.target.trim()) return openSentenceStudy(cue);
                const last = getStudyHistory()[0];
                if (last) openFromHistory(last);
                else setHistoryOpen(true);
              }}
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
          </div>
          )}

        </div>

        {/* Separator draggable (desktop) — seret untuk mengatur lebar video vs
            transkrip. Sembunyi di mobile (kolom menumpuk vertikal). */}
        {showPanel && !mini && (
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

        {/* Kanan: transkrip penuh — bisa disembunyikan lewat tombol Transkrip.
            Disembunyikan di mode mini (PiP tembus ke beranda). */}
        {showPanel && !mini && (
        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-t lg:border-l lg:border-t-0"
          style={{ borderColor: BORDER }}
        >
          {/* Latar thumbnail video di-blur pekat + gelap ala YouTube — memberi
              panel transkrip kesan "menyatu" dgn video, bukan kotak hitam datar. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <img
              src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full scale-125 object-cover opacity-35 blur-2xl"
            />
            <div className="absolute inset-0 bg-black/75" />
          </div>

          <div
            className="relative z-10 flex items-center gap-2 px-4 py-3 sm:px-5"
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
            {/* [watch-panel-hide-tr-v1] Tutup/buka baris terjemahan di transkrip —
                buat latihan baca tanpa contekan. Hanya berpengaruh di panel ini. */}
            {txState === "ready" && (
              <button
                type="button"
                onClick={togglePanelTr}
                aria-label={showPanelTr ? "Sembunyikan terjemahan" : "Tampilkan terjemahan"}
                aria-pressed={showPanelTr}
                className="group relative ml-auto inline-flex shrink-0 items-center justify-center rounded-full p-1 transition-colors hover:text-white"
                style={{ color: showPanelTr ? GOLD : SUB }}
              >
                {showPanelTr ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <IconTooltip side="bottom" align="right">
                  {showPanelTr ? "Sembunyikan terjemahan" : "Tampilkan terjemahan"}
                </IconTooltip>
              </button>
            )}
          </div>

          <div
            ref={listRef}
            // [watch-cue-block-v1] TANPA padding kiri/kanan: blok baris aktif harus
            // membentang penuh sampai nempel ke batas video di kiri (rapi & compact).
            // Padding pindah ke tiap baris; status loading/gagal bawa padding sendiri.
            className="relative z-10 min-h-0 flex-1 overflow-y-auto py-2 [scrollbar-width:thin]"
          >
            {txState === "loading" && (
              <div className="flex items-start gap-2 px-4 py-6" style={{ color: SUB }}>
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                <span className="text-[13px] leading-relaxed">
                  {asrRunning
                    ? "Membuat subtitle dengan AI… ini bisa memakan waktu sekitar 1 menit. Kamu bisa tetap menonton dulu."
                    : "Memuat transkrip…"}
                </span>
              </div>
            )}
            {txState === "none" && (
              <div className="flex flex-col items-start gap-3 px-4 py-6 text-[13px] leading-relaxed" style={{ color: SUB }}>
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
                // [watch-phrase-chunk-v1] frasa ("the king" → 1 unit) baris ini.
                const ck = cueChunks[i] ?? null;
                return (
                  <div
                    key={i}
                    data-cue={i}
                    onClick={() => seekTo(c.start)}
                    // [watch-cue-block-v1] Baris aktif = BLOK PENUH ala Lingopie: latar
                    // abu solid membentang sampai tepi video, TANPA garis aksen apa pun
                    // (permintaan user) — bloknya sendiri sudah jadi penanda. Perpindahan
                    // antar-baris dianimasikan (.wl-cue / .wl-cue-on di globals.css)
                    // supaya mulus, bukan blok yang kedip pindah.
                    // Section non-aktif diredupkan (opacity) jadi terkesan abu-abu
                    // supaya fokus jatuh ke baris yang sedang diputar; hover meredakan
                    // redup itu biar tetap enak ditarget/dibaca.
                    // [watch-panel-hide-tr-v1] Tanpa baris terjemahan tiap section
                    // cuma 1 baris teks → kalau padding-nya tetap, daftarnya mepet
                    // dan susah dipisah mata. Beri napas ekstra saat mode itu aktif.
                    className={`wl-cue group relative cursor-pointer pl-4 pr-11 ${
                      showPanelTr ? "py-2" : "py-3"
                    } ${on ? "wl-cue-on opacity-100" : "opacity-40 hover:opacity-80"}`}
                    style={{
                      backgroundColor: on ? CUE_ON_BG : "transparent",
                      boxShadow: on ? "0 6px 16px rgba(0,0,0,0.3)" : undefined,
                      // [watch-panel-plain-v1] Panel transkrip TIDAK pernah pakai
                      // outline/shadow teks (itu cuma buat subtitle di atas video).
                      // text-shadow itu properti WARISAN — dimatikan di blok baris
                      // supaya baris non-aktif & baris terjemahan emas tak bisa
                      // mewarisi outline dari leluhur mana pun.
                      textShadow: "none",
                    }}
                  >
                    {/* [watch-cue-explain-v1] Tombol Analisa per-section (ala tombol
                        "Explain" Lingopie) — buka drawer Analisa Kalimat untuk baris
                        INI, tanpa menunggu kalimatnya tayang. Klik tak boleh menular ke
                        baris (yang tugasnya loncat waktu). */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSentenceStudy(c);
                      }}
                      aria-label="Analisa kalimat ini dengan AI"
                      className={`group/ex absolute right-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full transition-all hover:bg-white/10 ${
                        showPanelTr ? "top-1.5" : "top-2.5"
                      } ${on ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`}
                      style={{ color: TEAL }}
                    >
                      <Sparkles className="h-4 w-4" />
                      {/* Tooltip muncul saat hover ikon — label "Analisa" tak lagi
                          dicetak permanen biar barisnya lega & compact. */}
                      <span
                        className="pointer-events-none absolute right-full top-1/2 mr-1.5 -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10.5px] font-bold text-white opacity-0 transition-opacity group-hover/ex:opacity-100 group-focus-visible/ex:opacity-100"
                        style={{ backgroundColor: "rgba(0,0,0,0.85)", border: `1px solid ${BORDER}` }}
                      >
                        Analisa
                      </span>
                    </button>
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
                        chunks={ck}
                        // [watch-panel-plain-v1] Di panel transkrip teksnya putih polos
                        // — outline hitam tebal cuma perlu saat menumpang di atas video.
                        plain
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
                          // [watch-phrase-chunk-v1] Token yang jatuh di chunk multi-kata
                          // dibungkus satu span frasa (garis putus-putus + tap arti frasa),
                          // konsisten dgn baris karaoke aktif.
                          const toks = splitWords(c.target, langCode);
                          const wordOrd: number[] = [];
                          { let k = -1; toks.forEach((w) => wordOrd.push(w.isWord ? ++k : -1)); }
                          const wordSpan = (j: number, inPhrase: boolean) => {
                            const w = toks[j];
                            const wk = wordOrd[j];
                            const hot = hs.t.has(wk);
                            return (
                              <span
                                key={j}
                                onClick={inPhrase ? undefined : (e) => onWordTap(e, w.text, c.target, j)}
                                onMouseEnter={inPhrase ? undefined : () => { setHoverWord({ i, k: wk }); ensureAlign(i); }}
                                onMouseLeave={inPhrase ? undefined : () => setHoverWord(null)}
                                className={inPhrase ? "transition-colors" : "cursor-pointer transition-colors"}
                                style={hot && !inPhrase ? SYNC_UNDERLINE : undefined}
                              >
                                {w.text}
                              </span>
                            );
                          };
                          const out: React.ReactNode[] = [];
                          for (let j = 0; j < toks.length; ) {
                            const cid = ck?.tokenChunk[j] ?? -1;
                            const chunk = cid >= 0 ? ck!.chunks[cid] : null;
                            if (chunk && chunk.words > 1) {
                              const inner: React.ReactNode[] = [];
                              let jj = j;
                              for (; jj <= chunk.lastTok && jj < toks.length; jj++) {
                                inner.push(toks[jj].isWord ? wordSpan(jj, true) : <span key={jj}>{toks[jj].text}</span>);
                              }
                              out.push(
                                <span
                                  key={`p${cid}-${j}`}
                                  onClick={(e) => onWordTap(e, chunk.text, c.target, chunk.firstTok, chunk.lastTok)}
                                  className="cursor-pointer"
                                >
                                  {inner}
                                </span>
                              );
                              j = jj;
                            } else if (toks[j].isWord) {
                              out.push(wordSpan(j, false));
                              j++;
                            } else {
                              out.push(<span key={j}>{toks[j].text}</span>);
                              j++;
                            }
                          }
                          return out;
                        })()}
                      </p>
                    )}
                    {c.translit && !cueIsExplanation(c, langCode) && (
                      <TranslitLine
                        target={c.target}
                        translit={c.translit}
                        langCode={langCode}
                        hoveredK={hoverWord?.i === i ? hoverWord.k : null}
                        onHover={(k) => setHoverWord(k == null ? null : { i, k })}
                        className="wl-cue-line mt-0.5 italic"
                        style={{ color: "#fff", textShadow: "none", fontSize: 12 * fscale }}
                      />
                    )}
                    {c.base &&
                      showPanelTr &&
                      !isDuplicateBase(c, langCode) &&
                      (alignEnabled ? (
                        <p
                          className="wl-cue-line mt-0.5 font-semibold"
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
                          className="wl-cue-line mt-0.5 font-semibold"
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
      {anyDrawerOpen && (
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

      {/* [watch-sentence-study-v1] Panel riwayat kata melayang — dibuka dari tombol
          ✨ di baris kontrol (tombol FAB melayang lama sudah dihapus; aksinya pindah
          ke sebelah kiri tombol layar penuh). Muncul di kanan bawah, tepat di atas
          baris kontrol. Sembunyi saat miniplayer / drawer analisa sudah buka. */}
      {!mini && !anyDrawerOpen && historyOpen && (
        <div className="fixed bottom-20 right-4 z-[70] flex flex-col items-end sm:right-6">
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
                      baseCode: baseLang,
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
        </div>
      )}

      {anchor && (
        <WordTooltip
          // Id tap → tooltip reset state (buka/tutup drawer) tiap kata baru tanpa
          // remount → tak ada kedipan animasi/reflow.
          tapId={anchor.id}
          word={anchor.word}
          sentence={anchor.sentence}
          wordIdx={anchor.wordIdx}
          wordEndIdx={anchor.wordEndIdx}
          // Kata di baris penjelas (mis. kalimat Inggris di video Ukraina)
          // dianalisis sebagai bahasa cue-nya (dari anchor.lang), BUKAN dipaksa
          // bahasa target — biar arti & pecahan katanya benar. Artinya tetap
          // dijelaskan ke bahasa terjemahan pilihan pengguna (prop baseLang).
          langCode={anchor.lang ?? langCode}
          baseLang={baseLang}
          videoId={video.videoId}
          x={anchor.x}
          y={anchor.y}
          autoStudy={anchor.autoStudy}
          onClose={() => setAnchor(null)}
          onSavedChange={handleSaved}
          onStudyOpenChange={setWordStudyOpen}
        />
      )}

      {/* [watch-sentence-study-v1] Drawer Analisa Kalimat — kalimat yang sedang
          tayang, dibuka dari tombol AI melayang. Key = kalimat supaya ganti cue
          (mis. tap kalimat lain nanti) memuat ulang konten dengan bersih. */}
      {sentenceCue && (
        <SentenceStudy
          key={sentenceCue.sentence}
          sentence={sentenceCue.sentence}
          translit={sentenceCue.translit}
          translation={sentenceCue.translation}
          langCode={sentenceCue.lang}
          baseCode={baseLang}
          onClose={() => setSentenceCue(null)}
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
  showTarget = true,
  analyze,
  breakdown,
  onWordTap,
  onWordHoverOpen,
  onWordHoverClose,
  tapped,
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
  // [watch-subtitle-toggle-v2] Sakelar baris subtitle bahasa target (+ translit).
  // Mati → yang tersisa hanya terjemahan (kalau sakelarnya masih nyala).
  showTarget?: boolean;
  analyze: boolean;
  breakdown: SentenceBreakdown | "loading" | "error" | undefined;
  onWordTap: (e: React.MouseEvent, word: string, sentence: string, wordIdx?: number, wordEndIdx?: number) => void;
  // [watch-hover-open-v1] Hover = tap di bar subtitle bawah (debounce di player).
  onWordHoverOpen?: (e: React.MouseEvent, word: string, sentence: string, wordIdx?: number, wordEndIdx?: number) => void;
  onWordHoverClose?: () => void;
  // [watch-tap-colored-v1] Rentang token (indeks splitWords) yang barusan di-tap →
  // tetap menyala teal selama balon artinya terbuka. null = tak ada.
  tapped?: { lo: number; hi: number } | null;
  onRetryAnalyze: () => void;
  txState: "loading" | "ready" | "none";
  asrRunning: boolean;
  scale: number;
  // Sinkron hover kata↔terjemahan di bar subtitle bawah (setara panel transkrip).
  alignEnabled?: boolean;
  alignMap?: { tGroup: number[]; bGroup: number[]; firstT: number[]; expr?: number[][] };
  hot?: { t: Set<number>; b: Set<number> };
  hoveredK?: number | null;
  onHoverWord?: (k: number | null) => void;
  // Hover-to-pause: dipasang di blok teks yang menyusut sesuai isi (bukan
  // pembungkus lebar-penuh) supaya jeda cuma terpicu saat kursor benar-benar
  // di atas subtitle/terjemahan — bukan di ruang kosong sekitarnya.
  onHoverPause?: () => void;
  onHoverResume?: () => void;
}) {
  // [watch-phrase-chunk-v1] Frasa ("the king" → 1 unit) untuk bar subtitle fokus —
  // dari kelas kata (breakdown) + penjajaran AI (alignMap) baris aktif.
  const chunks = useMemo(
    () =>
      cue
        ? computeCueChunks({
            target: cue.target,
            langCode: langCode ?? "",
            breakdown: breakdown && typeof breakdown === "object" ? breakdown : null,
            alignTGroup: alignMap?.tGroup ?? null,
            exprSpans: alignMap?.expr ?? null,
          })
        : null,
    [cue, langCode, breakdown, alignMap]
  );
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
      <div className="min-h-[64px] px-3 py-2 text-center sm:min-h-[92px] sm:px-6 sm:py-4">
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
            {!showTranslation ? null : cue.base && !isDuplicateBase(cue, langCode ?? "") ? (
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
    <div className="min-h-[64px] px-3 py-2 text-center sm:min-h-[92px] sm:px-6 sm:py-4">
      <div
        className="inline-block max-w-full"
        onMouseEnter={onHoverPause}
        onMouseLeave={onHoverResume}
      >
      {showTarget && (
        <>
          <KaraokeText
            cue={cue}
            time={time}
            langCode={langCode}
            onWordTap={onWordTap}
            onWordHoverOpen={onWordHoverOpen}
            onWordHoverClose={onWordHoverClose}
            tapped={tapped}
            hoveredK={hoveredK}
            hotKeys={hot?.t}
            onHoverWord={onHoverWord}
            chunks={chunks}
            className="font-extrabold leading-snug"
            fontSize={22 * scale}
            center
          />
          {cue.translit && !cueIsExplanation(cue, langCode ?? "") && (
            <KaraokeTranslit
              cue={cue}
              time={time}
              langCode={langCode}
              tapped={tapped}
              className="mt-1 italic"
              style={{ fontSize: 13 * scale }}
            />
          )}
        </>
      )}
      {!showTranslation ? null : cue.base && !isDuplicateBase(cue, langCode ?? "") ? (
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
// kata target di-hover / di-tap, kita selaraskan token translit ke kata target.
// Tiap token translit dapat `k` = indeks-urut kata target yang bersesuaian (−1 utk
// pemisah). Konsumen (hover-sync & tap-berwarna) menyorot token yang k-nya cocok.
//
// Dua jalur:
//   1. CEPAT (bahasa beraksara alfabet: Rusia, Yunani, Georgia, Arab, Ibrani…):
//      translit memisah kata pakai spasi 1:1 dengan kata target → kata ke-k ↔ token
//      ke-k. Dipakai bila jumlah token == jumlah kata.
//   2. SUKU-KATA (aksara silabis TANPA spasi: Mandarin/pinyin, Korea, kana Jepang):
//      1 karakter target ≈ 1 suku kata, dan tiap token pinyin/romaji punya jumlah
//      suku kata = jumlah gugus vokalnya. Kalau TOTAL suku kata translit == TOTAL
//      karakter target, kita petakan berurutan (karakter→suku kata) lalu tiap token
//      ambil ordinal kata mayoritas. Ini yang bikin "měi zhōu" ikut menyala saat
//      "每周" di-tap walau segmentasi pinyin tak seragam ("Yóuyǒng" digabung tapi
//      "měi zhōu" dipisah). Kalau jumlah tak pas → null (render polos, tanpa regresi).

// Karakter target yang dihitung 1 suku kata: Han (CJK), Hangul, Hiragana, Katakana.
const SYLLABIC_CHAR_RE =
  /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FA\u30FF\uAC00-\uD7A3]/u;

// Jumlah suku kata sebuah token Latin = jumlah gugus vokal (a e i o u, termasuk yang
// bertanda nada/diakritik lewat normalisasi NFD). "y" dianggap konsonan/glide.
function countTranslitSyllables(token: string): number {
  const norm = token.normalize("NFD");
  let n = 0;
  let inVowel = false;
  for (const ch of norm) {
    if (/[aeiou]/i.test(ch)) {
      if (!inVowel) { n++; inVowel = true; }
    } else if (/[a-z]/i.test(ch)) {
      inVowel = false; // konsonan memutus gugus vokal
    }
    // tanda diakritik gabung (hasil NFD) & lainnya: abaikan, tak memutus gugus
  }
  return n;
}

function alignTranslitTokens(
  target: string,
  translit: string,
  langCode?: string
): { text: string; k: number }[] | null {
  const words = splitWords(target, langCode);
  const wordCount = words.filter((w) => w.isWord).length;
  // Pertahankan pemisah (spasi) sebagai token sendiri biar spasi asli translit utuh.
  const pieces = translit.split(/(\s+)/).filter((p) => p.length);
  const wordPieces = pieces.filter((p) => p.trim().length);
  if (!wordCount) return null;

  // Jalur CEPAT: token translit 1:1 dengan kata target.
  if (wordCount === wordPieces.length) {
    let k = -1;
    return pieces.map((p) => (p.trim().length ? { text: p, k: ++k } : { text: p, k: -1 }));
  }

  // Jalur SUKU-KATA: hanya untuk aksara silabis (tiap karakter kata = 1 suku kata).
  const charK: number[] = [];
  let k = -1;
  for (const w of words) {
    if (!w.isWord) continue;
    k++;
    for (const ch of Array.from(w.text)) {
      if (!SYLLABIC_CHAR_RE.test(ch)) return null; // ada aksara non-silabis → batal
      charK.push(k);
    }
  }
  if (!charK.length) return null;
  const sylCounts = wordPieces.map(countTranslitSyllables);
  if (sylCounts.some((n) => n === 0)) return null; // token tanpa vokal → tak bisa dipetakan
  if (sylCounts.reduce((a, b) => a + b, 0) !== charK.length) return null; // jumlah tak pas
  // Tiap token translit ambil ordinal kata MAYORITAS dari suku kata yang dicakupnya.
  let ci = 0;
  const pieceK = sylCounts.map((n) => {
    const slice = charK.slice(ci, ci + n);
    ci += n;
    const counts = new Map<number, number>();
    for (const kk of slice) counts.set(kk, (counts.get(kk) ?? 0) + 1);
    let best = slice[0];
    let bestN = 0;
    for (const [kk, cc] of counts) if (cc > bestN) { bestN = cc; best = kk; }
    return best;
  });
  let wi = -1;
  return pieces.map((p) => (p.trim().length ? { text: p, k: pieceK[++wi] } : { text: p, k: -1 }));
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

// [watch-karaoke-lag-v1] Lag sapuan karaoke terhadap audio (detik). Timing per-baris
// dari ASR/estimasi proporsional (cue tanpa anchor) dulu cenderung MEMIMPIN ucapan,
// jadi sapuan sengaja ditunda 0.5s. TAPI sejak [watch-karaoke-anchor-v2] sapuan sudah
// disandarkan ke anchor timing asli video — penundaan 0.5s jadi over-koreksi dan bikin
// sorotan kata malah TELAT ~0.5s di hampir semua video (dulu ditambal manual dgn geser
// sinkron +0.50s tiap video). Sempat dinolkan, tapi sapuan masih terasa NGEKOR audio.
// [watch-karaoke-lag-v3] Dimajukan (lag negatif → evaluasi frac di time+|lag|s) supaya
// sapuan kata memimpin/pas audio secara global untuk semua video & bahasa. -0.5s masih
// terasa ngekor (getCurrentTime YouTube sendiri sedikit telat dari audio nyata), jadi
// dinaikkan ke -0.8s. Hanya menggeser sapuan KATA di dalam baris; pemilihan baris aktif
// tetap pakai syncedTime.
const KARAOKE_LAG_SEC = -0.8;

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
  const frac = karaokeFrac(cue, time - KARAOKE_LAG_SEC);
  const played = frac * total; // jumlah karakter yang "sudah" terucap
  let acc = 0;
  const out = toks.map((t) => {
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
  // [watch-karaoke-number-sync-v1] Angka + satuannya (mis. Jepang "1つ" = hitotsu,
  // "2024年") tersegmentasi jadi token TERPISAH ("1" dan "つ") sehingga dapat window
  // karaoke sendiri-sendiri: saat "つ" menyala teal, "1" sudah "sung" (putih) — angka
  // seolah tak pernah ikut disorot. Padahal keduanya satu bunyi. Solusi: token angka
  // murni berbagi window sorot dengan satuan yang menempel langsung (tanpa pemisah di
  // antara → berarti token kata bersebelahan di array). Bila salah satunya "active",
  // keduanya di-set "active" → menyala teal BERSAMAAN selama satuan itu diucapkan.
  //
  // PENTING: JANGAN gerbang dengan `isWord`. Intl.Segmenter di sebagian browser (ICU
  // beda versi dari Node) menandai token angka telanjang sebagai BUKAN word-like →
  // angka jadi token "pemisah" (renderSep, selalu putih) dan lolos dari merge ini.
  // Deteksi angka murni via teks saja; pasangannya (satuan) cukup token kata mana pun.
  for (let i = 0; i < out.length; i++) {
    if (!isDigitToken(out[i].text)) continue;
    // Ikat angka ke SATU token kata yang menempel: prioritas satuan sesudahnya
    // (mis. "つ"/"年"), lalu token kata sebelumnya (mis. "第" pada "第1").
    let partner = -1;
    if (out[i + 1]?.isWord) partner = i + 1;
    else if (out[i - 1]?.isWord) partner = i - 1;
    if (partner === -1) continue;
    if (out[i].state === "active" || out[partner].state === "active") {
      out[i].state = "active";
      out[partner].state = "active";
    }
  }
  return out;
}

function KaraokeWord({
  text,
  state,
  progress,
  rtl,
  onClick,
  hovered,
  onHover,
  inPhrase,
  phraseActive,
  tapped,
  lineTapped,
  onHoverOpen,
  onHoverClose,
  plain,
}: {
  text: string;
  state: KaraokeState;
  // [watch-panel-plain-v1] Matikan outline hitam (dipakai di panel transkrip).
  plain?: boolean;
  progress: number;
  rtl?: boolean;
  onClick: (e: React.MouseEvent) => void;
  // [watch-tap-colored-v1] Kata ini lagi dibuka artinya (balon terbuka) → tetap teal.
  tapped?: boolean;
  // Ada kata LAIN di baris ini yang di-tap → tahan sorot karaoke kata ini supaya HANYA
  // kata yang di-tap yang berwarna (permintaan user: cuma yang diklik yang menyala).
  lineTapped?: boolean;
  // [linguo-patch:watch-translit-hover-sync-v1] hover jarak-jauh: token translit
  // yang bersesuaian di-hover → kata ini ikut menyala (dan sebaliknya via onHover).
  hovered?: boolean;
  onHover?: (h: boolean) => void;
  // [watch-hover-open-v1] Hover = tap: masuk kata → buka tooltip (debounce di player),
  // keluar → batalkan yang tertunda. Membawa event utk koordinat balon.
  onHoverOpen?: (e: React.MouseEvent) => void;
  onHoverClose?: () => void;
  // [watch-phrase-chunk-v1] Kata ini bagian dari unit frasa (mis. "the king"):
  // klik/hover ditangani pembungkus frasa, bukan per-kata. Warna & "pop" mengikuti
  // FRASA (phraseActive) — jadi "the king" menyala teal BERSAMAAN saat sinkron audio,
  // lalu balik putih; bukan per-kata. Itu penanda kontekstual frasanya (tanpa blok).
  inPhrase?: boolean;
  // Frasa sedang diucapkan (playhead di dalam rentang frasa) → semua katanya teal.
  phraseActive?: boolean;
}) {
  // [watch-karaoke-solid-shadow-v1] Sorotan PER-KATA ala Lingopie: hanya kata yang
  // SEDANG diucapkan yang menyala teal + "pop" naik; kata lain putih. Sapuan
  // per-karakter (clip-path) diganti pewarnaan kata utuh — lebih tegas & jelas
  // "kata mana yang lagi dibaca". `rtl`/`progress` tak lagi dipakai di sini.
  void rtl;
  void progress;
  // Di dalam frasa: warna/pop ikut phraseActive (satu kesatuan); di luar: state kata.
  const active = inPhrase ? !!phraseActive : state === "active";
  // [watch-tap-colored-v1] Aturan warna:
  //  • kata yang di-tap → SELALU teal (menyala tenang selama balon arti terbuka);
  //  • kalau ada kata lain yang di-tap di baris ini (lineTapped) → kata ini DIPADAMKAN
  //    (putih) walau kebetulan jadi kata karaoke aktif → hanya yang diklik yang menyala;
  //  • selain itu → ikut karaoke (aktif = teal).
  const colored = tapped ? true : lineTapped ? false : active;
  const cls = inPhrase
    ? "relative mx-[1px] inline-block align-baseline transition-all duration-200 ease-out"
    : "relative mx-[1px] inline-block cursor-pointer align-baseline transition-all duration-200 ease-out hover:[text-decoration-line:underline] hover:[text-decoration-color:#1A9E9E] hover:[text-decoration-thickness:2px] hover:[text-underline-offset:3px]";
  return (
    <span
      onClick={inPhrase ? undefined : onClick}
      onMouseEnter={inPhrase ? undefined : (e) => { onHover?.(true); onHoverOpen?.(e); }}
      onMouseLeave={inPhrase ? undefined : () => { onHover?.(false); onHoverClose?.(); }}
      className={cls}
      style={{
        // [watch-karaoke-color-only-v1] Sorotan karaoke CUKUP WARNA (teal) — TANPA
        // zoom/scale/pop. Efek membesar dulu bikin kata aktif menimpa kata di
        // sebelahnya (permintaan user), jadi dibuang; kini hanya ganti warna.
        color: colored ? TEAL : "#fff",
        // [watch-panel-plain-v1] Outline hitam tebal itu buat teks DI ATAS video;
        // di panel transkrip (latar rata) ia cuma bikin huruf kotor → `plain`.
        textShadow: plain ? "none" : KARAOKE_SHADOW,
        ...(hovered && !inPhrase ? SYNC_UNDERLINE : null),
      }}
    >
      {text}
    </span>
  );
}

// [watch-phrase-chunk-v1] Pembungkus satu unit frasa karaoke (mis. "the king",
// "the press conference"). TANPA blok/garis — penanda frasa muncul KONTEKSTUAL lewat
// warna font: saat sinkron audio, seluruh katanya menyala teal BERSAMAAN (via
// phraseActive di tiap kata), lalu balik putih. Klik → buka arti FRASA (bukan per-kata).
// [watch-karaoke-color-only-v1] Tanpa zoom/scale/pop (dulu bikin frasa menimpa kata
// tetangga) — `active` sekarang cuma dipakai anak-katanya utk warna, bukan transform.
function KaraokePhrase({
  children,
  onClick,
  onHoverOpen,
  onHoverClose,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  // [watch-hover-open-v1] Hover frasa = tap frasa (buka arti utuh).
  onHoverOpen?: (e: React.MouseEvent) => void;
  onHoverClose?: () => void;
}) {
  return (
    <span
      onClick={onClick}
      onMouseEnter={onHoverOpen}
      onMouseLeave={onHoverClose}
      className="relative inline-flex cursor-pointer items-baseline align-baseline"
    >
      {children}
    </span>
  );
}

function KaraokeText({
  cue,
  time,
  langCode,
  onWordTap,
  onWordHoverOpen,
  onWordHoverClose,
  tapped,
  hoveredK,
  hotKeys,
  onHoverWord,
  chunks,
  className,
  fontSize,
  center,
  plain,
}: {
  cue: LearnCue;
  time: number;
  // [watch-panel-plain-v1] Tanpa outline hitam — teks putih polos (panel transkrip).
  plain?: boolean;
  langCode?: string;
  onWordTap: (e: React.MouseEvent, word: string, sentence: string, wordIdx?: number, wordEndIdx?: number) => void;
  // [watch-hover-open-v1] Hover = tap (debounce di player). Opsional — hanya bar
  // subtitle bawah yang mengoper ini; panel transkrip tetap butuh klik.
  onWordHoverOpen?: (e: React.MouseEvent, word: string, sentence: string, wordIdx?: number, wordEndIdx?: number) => void;
  onWordHoverClose?: () => void;
  // [watch-tap-colored-v1] Rentang token yang barusan di-tap → tetap menyala teal.
  tapped?: { lo: number; hi: number } | null;
  // [linguo-patch:watch-translit-hover-sync-v1] sinkron hover dengan baris translit
  // (opsional — bar subtitle di bawah tak mengoper ini, jatuh ke hover CSS biasa).
  hoveredK?: number | null;
  // [watch-word-align-v1] ordinal kata yang harus menyala (frasa penjajaran utuh).
  hotKeys?: Set<number> | null;
  onHoverWord?: (k: number | null) => void;
  // [watch-phrase-chunk-v1] Pengelompokan frasa ("the king" → 1 unit). Kalau null →
  // sorot per-kata seperti biasa.
  chunks?: CueChunks | null;
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

  // Satu token kata → elemen KaraokeWord. `inPhrase` mematikan klik/hover per-kata
  // (pembungkus frasa yang urus); `phraseActive` mewarnai kata teal saat frasanya
  // sedang diucapkan (semua kata frasa nyala bareng).
  // [watch-tap-colored-v1] Apakah token ke-j termasuk kata/frasa yang lagi dibuka artinya.
  const isTapped = (j: number) => !!tapped && j >= tapped.lo && j <= tapped.hi;
  // Ada kata di baris ini yang lagi dibuka artinya → padamkan karaoke kata lain.
  const anyTapped = !!tapped;
  const renderWord = (j: number, inPhrase: boolean, phraseActive?: boolean, tappedOn?: boolean) => {
    const t = toks[j];
    return (
      <KaraokeWord
        key={j}
        text={t.text}
        state={t.state}
        progress={t.progress}
        rtl={rtl}
        inPhrase={inPhrase}
        phraseActive={phraseActive}
        tapped={tappedOn}
        lineTapped={anyTapped}
        onClick={(e) => onWordTap(e, t.text, cue.target, j)}
        onHoverOpen={onWordHoverOpen ? (e) => onWordHoverOpen(e, t.text, cue.target, j) : undefined}
        onHoverClose={onWordHoverClose}
        hovered={(hotKeys?.has(wordK[j]) ?? false) || (hoveredK != null && hoveredK === wordK[j])}
        onHover={(h) => onHoverWord?.(h ? wordK[j] : null)}
        plain={plain}
      />
    );
  };
  const renderSep = (j: number) => {
    const t = toks[j];
    // [watch-karaoke-number-sync-v1] Token angka yang JATUH ke jalur pemisah (browser
    // tak menandainya word-like) tetap ikut menyala teal saat window karaoke gabungan
    // dengan satuannya aktif — biar angka & satuan sewarna. Pemisah lain (spasi, tanda
    // baca) tetap putih. Padam saat ada kata lain di baris ini yang dibuka artinya.
    const colored = isDigitToken(t.text) && t.state === "active" && !anyTapped;
    return (
      <span key={j} className="whitespace-pre" style={{ color: colored ? TEAL : "#fff", textShadow: plain ? "none" : KARAOKE_SHADOW }}>
        {t.text}
      </span>
    );
  };

  // Susun elemen render: token yang jatuh di chunk multi-kata dibungkus KaraokePhrase
  // (satu tap → arti frasa); sisanya render per-token biasa. Frasa dianggap "sedang
  // diucapkan" saat playhead di dalam rentangnya — kata pertama sudah lewat "future"
  // & kata terakhir belum "sung" → seluruh frasa menyala teal tanpa kedip antar-kata.
  const nodes: React.ReactNode[] = [];
  for (let j = 0; j < toks.length; ) {
    const cid = chunks?.tokenChunk[j] ?? -1;
    const chunk = cid >= 0 ? chunks!.chunks[cid] : null;
    if (chunk && chunk.words > 1) {
      let firstState: KaraokeState | undefined;
      let lastState: KaraokeState | undefined;
      for (let jj = j; jj <= chunk.lastTok && jj < toks.length; jj++) {
        if (toks[jj].isWord) {
          if (firstState === undefined) firstState = toks[jj].state;
          lastState = toks[jj].state;
        }
      }
      const phraseActiveRaw = firstState !== undefined && firstState !== "future" && lastState !== "sung";
      // Frasa yang di-tap sebagai satu unit → semua katanya menyala teal.
      const phraseTapped = isTapped(j) || isTapped(chunk.lastTok);
      // Saat ada kata/frasa yang di-tap di baris ini, karaoke frasa lain dipadamkan →
      // frasa hanya menyala kalau dia yang di-tap.
      const phraseActive = anyTapped ? phraseTapped : phraseActiveRaw;
      const inner: React.ReactNode[] = [];
      let jj = j;
      for (; jj <= chunk.lastTok && jj < toks.length; jj++) {
        inner.push(toks[jj].isWord ? renderWord(jj, true, phraseActive, phraseTapped) : renderSep(jj));
      }
      nodes.push(
        <KaraokePhrase
          key={`p${cid}-${j}`}
          active={phraseActive}
          onClick={(e) => onWordTap(e, chunk.text, cue.target, chunk.firstTok, chunk.lastTok)}
          onHoverOpen={onWordHoverOpen ? (e) => onWordHoverOpen(e, chunk.text, cue.target, chunk.firstTok, chunk.lastTok) : undefined}
          onHoverClose={onWordHoverClose}
        >
          {inner}
        </KaraokePhrase>
      );
      j = jj;
    } else {
      nodes.push(toks[j].isWord ? renderWord(j, false, undefined, isTapped(j)) : renderSep(j));
      j++;
    }
  }

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
      {nodes}
    </p>
  );
}

// ── Karaoke pada baris transliterasi ────────────────────────────────────────────
// [linguo-patch:watch-translit-karaoke-v2] Baris bacaan Latin (romaji/pinyin/dsb)
// disorot PERSIS seperti subtitle di atasnya: PER-KATA warna — hanya token yang
// SEDANG diucapkan yang menyala teal, sisanya putih (bukan lagi sapuan clip-path
// bertahap). Jadi pelajar bahasa non-Latin lihat suku kata mana yang aktif, dan
// warnanya berganti bareng kata target.
//   • Kalau token translit selaras 1:1 dgn kata target (alignTranslitTokens) →
//     state IKUT kata target padanannya, jadi word-locked persis (Rusia/Yunani/
//     Georgia dsb yang romanisasinya memisah kata pakai spasi).
//   • Kalau tak selaras (Jepang/Mandarin: segmenter kata beda jumlah dgn token
//     romaji) → state per-token berbasis KARAKTER pakai frac waktu yang sama →
//     token yang playhead-nya sedang lewati → teal. frac identik dgn subtitle jadi
//     posisi aktifnya proporsional sama (tetap sinkron dgn aksara asli di atas).
function translitStateTokens(text: string, frac: number) {
  const toks = splitWords(text); // Latin → pecah spasi/tanda baca
  const total = text.length || 1;
  const played = frac * total;
  let acc = 0;
  return toks.map((t) => {
    const startC = acc;
    const endC = acc + t.text.length;
    acc = endC;
    let state: KaraokeState = "future";
    if (endC <= played) state = "sung";
    else if (startC < played) state = "active";
    return { text: t.text, isWord: t.isWord, state };
  });
}

function KaraokeTranslit({
  cue,
  time,
  langCode,
  tapped,
  className,
  style,
}: {
  cue: LearnCue;
  time: number;
  langCode?: string;
  // [watch-tap-colored-v1] Rentang token (indeks splitWords) yang lagi dibuka artinya →
  // token translit yang bersesuaian ikut menyala teal, dan HANYA itu (karaoke dipadamkan).
  tapped?: { lo: number; hi: number } | null;
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
  // Ordinal kata (0-based di antara kata target) yang termasuk rentang yang di-tap —
  // dipetakan dari indeks token splitWords ke urutan kata, sejajar dengan `t.k` translit.
  const tappedKs = useMemo(() => {
    if (!tapped) return null;
    const s = new Set<number>();
    let k = -1;
    splitWords(cue.target, langCode).forEach((t, i) => {
      if (!t.isWord) return;
      k++;
      if (i >= tapped.lo && i <= tapped.hi) s.add(k);
    });
    return s;
  }, [tapped, cue.target, langCode]);
  // [watch-karaoke-anchor-v2] Ikuti anchor window caption asli (sama dgn karaokeTokens)
  // biar sorotan translit tetap seirama audio pada cue gabungan beberapa window.
  // [watch-karaoke-lag-v1] Lag sama dgn karaokeTokens supaya sorotan translit sejajar.
  const frac = karaokeFrac(cue, time - KARAOKE_LAG_SEC);
  const charToks = useMemo(() => translitStateTokens(translit, frac), [translit, frac]);
  if (!translit) return null;

  // Sorot per-kata (ikut state target) bila translit bisa diselaraskan ke kata target
  // (jalur cepat 1:1 ATAU jalur suku-kata utk aksara silabis). Tiap `k` sudah dijamin
  // ordinal kata yang valid. Kalau tidak selaras: state berbasis karakter pakai frac.
  const wordSync = !!aligned && aligned.every((t) => t.k < wordStates.length);
  const toks: { text: string; isWord: boolean; state: KaraokeState; k: number }[] = wordSync
    ? aligned!.map((t) => ({
        text: t.text,
        isWord: t.k >= 0,
        state: t.k < 0 ? ("future" as KaraokeState) : wordStates[t.k].state,
        k: t.k,
      }))
    : charToks.map((c) => ({ ...c, k: -1 }));

  return (
    <p className={className} style={{ color: "#fff", textShadow: KARAOKE_SHADOW, ...style }}>
      {toks.map((c, idx) =>
        c.isWord ? (
          <span
            key={idx}
            className="transition-colors duration-200 ease-out"
            // [watch-tap-colored-v1] Saat ada kata di-tap: HANYA token translit-nya teal
            // (karaoke dipadamkan). Tanpa tap: ikut karaoke (kata aktif = teal).
            style={{
              color: tappedKs
                ? c.k >= 0 && tappedKs.has(c.k)
                  ? TEAL
                  : "#fff"
                : c.state === "active"
                ? TEAL
                : "#fff",
            }}
          >
            {c.text}
          </span>
        ) : (
          <span key={idx} className="whitespace-pre">
            {c.text}
          </span>
        )
      )}
    </p>
  );
}

