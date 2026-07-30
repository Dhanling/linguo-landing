"use client";

/**
 * StudentGroupChat — [student-group-chat-v1] menu "Grup Kelas" di dashboard
 * siswa: baca & tulis ke GRUP WhatsApp kelasnya sendiri langsung dari LMS.
 * Cerminan menu Grup Kelas dashboard pengajar (linguo-admin-dashboard
 * src/components/teacher/TeacherGroupChat.tsx) dari sisi siswa.
 *
 * Kenapa menempel ke grup WhatsApp yang sudah ada, bukan chat in-app baru:
 * pengajar sudah membaca & membalas grup itu dari dashboard-nya, dan anggota
 * lain (admin, siswa semi-private) ikut dari WhatsApp biasa. Satu percakapan,
 * tiga pintu — bukan tiga percakapan.
 *
 * Yang siswa TIDAK punya (beda dari pengajar), disengaja:
 *   * kirim media/lampiran, jadwalkan kirim, edit & hapus-untuk-semua;
 *   * INSERT langsung ke wa_outbound. Mengirim lewat RPC student_group_send()
 *     supaya penanda nama penulis ("*Ara:*" di baris pertama) dipasang server —
 *     kalau klien yang memasang, siswa bisa mengaku-ngaku sebagai pengajar.
 * Semua pagarnya ada di admin-dashboard sql/20260730_student_group_chat.sql.
 *
 * Catatan gaya: mode gelap LMS itu lembar override global di StudentShell yang
 * mengunci nama-nama utility tertentu (bg-white, bg-gray-50, text-gray-900,
 * border-gray-200, …). Jadi warna di sini memakai utility itu — hex bebas tidak
 * ikut gelap. Yang sengaja hex: teal gelembung sendiri (aksen, sama di dua mode).
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Check, ChevronDown, ChevronLeft, FileText, Loader2, MessagesSquare, Reply,
  RotateCw, Search, Send, Smile, Users, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

/* ── Bentuk data ─────────────────────────────────────────────────────────── */

interface GroupRow {
  jid: string;
  sender: string;
  subject: string | null;
  participants: number | null;
  last_seen_at: string | null;
}

interface Msg {
  id: string;
  direction: "in" | "out" | "system";
  body: string | null;
  contact_name: string | null;
  participant: string | null;
  created_at: string;
  media_path: string | null;
  media_type: string | null;
  media_mime: string | null;
  deleted_at: string | null;
  edited_at: string | null;
  participant_jid: string | null;
  reaction: string | null;
  reaction_by: string | null;
}

/** Baris antrean kirim yang belum diproses bot (RLS: hanya milik siswa ini). */
interface Pending {
  id: string;
  body: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

/** Identitas siswa yang login — dari RPC student_group_identity(). */
interface Identity {
  student_id: string;
  display_name: string | null;
  /** Penanda nama yang dipasang server di pesan keluar ("Ara Kusuma"). */
  name_prefix: string | null;
  /** Nomor WA tanpa awalan 62/0 — untuk mengenali pesan yang dia tulis dari HP. */
  phone_key: string | null;
}

interface LastMsg {
  at: string;
  body: string | null;
  media_type: string | null;
  direction: string;
  contact_name: string | null;
}

/** Baris ringkas untuk pratinjau & badge di daftar grup. */
interface RecentRow {
  phone: string;
  created_at: string;
  body: string | null;
  media_type: string | null;
  direction: string;
  contact_name: string | null;
}

const MSG_COLS =
  "id, direction, body, contact_name, participant, created_at, media_path, media_type, media_mime, deleted_at, edited_at, participant_jid, reaction, reaction_by";

/** Transkrip grup itu query berat (300 pesan × 14 kolom) — beri napas 25 detik. */
const MSG_FETCH_TIMEOUT_MS = 25_000;

/** Batas tinggi kotak tulis (± 12 baris) sebelum isinya mulai di-scroll. */
const COMPOSER_MAX_H = 240;

/** Peta "grup → terakhir dibaca" ala WhatsApp: status baca tinggal di perangkat. */
const READ_KEY = "linguo-grup-read-v1";
const BASELINE_KEY = "linguo-grup-read-baseline";

/** Placeholder teks yang ditulis bot untuk media — disembunyikan kalau medianya kerender. */
const MEDIA_PLACEHOLDER_RE = /^(📷|🎨|🎥|🎞️|🎤|🎵|📄|📍|👤|📊)\s*\[[^\]]+\]$/u;

/**
 * Penanda penulis di baris pertama pesan keluar, dipasang student_group_send():
 * "*Ara Kusuma:*\nhalo". Dipakai dua arah — melepasnya dari isi pesan sendiri,
 * dan memakainya sebagai nama penulis untuk pesan siswa LAIN di grup yang sama.
 */
const AUTHOR_PREFIX_RE = /^\*([^*\n]{1,60}):\*\n?/;

const EMOJIS = [
  "😊", "🙏", "😀", "😃", "😄", "😁", "😉", "👍",
  "👌", "👏", "🙌", "👋", "💪", "🔥", "✨", "⭐",
  "🎉", "🎊", "❤️", "💯", "✅", "❌", "⏳", "🕐",
  "📚", "📝", "🗓️", "📌", "🤔", "😅", "🥺", "🙆‍♀️",
];

/** Emoji reaksi cepat — urutan sama dengan panel bawaan WhatsApp + 🔥. */
const QUICK_REACTIONS: { emoji: string; label: string }[] = [
  { emoji: "👍", label: "Oke" },
  { emoji: "❤️", label: "Suka" },
  { emoji: "😂", label: "Lucu" },
  { emoji: "😮", label: "Wow" },
  { emoji: "😢", label: "Sedih" },
  { emoji: "🙏", label: "Terima kasih" },
  { emoji: "🔥", label: "Mantap" },
];

/* ── Pembantu kecil ──────────────────────────────────────────────────────── */

/**
 * Abort bukan kegagalan yang perlu diadukan ke siswa: penyebabnya timeout
 * jaringan atau request yang sengaja dibatalkan (pindah grup, halaman ditutup,
 * pemicu beruntun). postgrest-js membungkusnya jadi "AbortError: Fetch is aborted".
 */
function isAbortError(err: { message?: string; hint?: string | null } | null | undefined): boolean {
  const text = `${err?.message ?? ""} ${err?.hint ?? ""}`.toLowerCase();
  return text.includes("abort");
}

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getHours())}.${pad2(d.getMinutes())}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function isToday(d: Date): boolean {
  return sameDay(d, new Date());
}

function isYesterday(d: Date): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return sameDay(d, y);
}

/** Pemisah tanggal di transkrip. */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Hari ini";
  if (isYesterday(d)) return "Kemarin";
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** Jam untuk daftar grup: hari ini → 09.15, kemarin → "Kemarin", lalu tanggal. */
function listStamp(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return hhmm(d.toISOString());
  if (isYesterday(d)) return "Kemarin";
  return `${d.getDate()} ${BULAN_SINGKAT[d.getMonth()]}`;
}

/** Samakan nomor dengan teacher_norm_phone() di SQL: buang non-digit & awalan 62/0. */
function phoneKey(raw: string | null | undefined): string {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.replace(/^(62|0)/, "");
}

/** Nama grup untuk judul; JID mentah tak layak dibaca siswa. */
function groupName(g: GroupRow): string {
  return (g.subject || "").trim() || `Grup kelas ${g.jid.split("@")[0].slice(-4)}`;
}

/** Pisahkan penanda penulis dari isi pesan: ["Ara", "halo"] atau [null, body]. */
function splitAuthor(body: string | null): [string | null, string] {
  const text = body ?? "";
  const m = text.match(AUTHOR_PREFIX_RE);
  if (!m) return [null, text];
  return [m[1].trim(), text.slice(m[0].length)];
}

const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

/** Tanda baca penutup kalimat sering ikut terserap URL_RE ("…/edit)." atau "…doc,"). */
function splitTrailingPunct(url: string): [string, string] {
  const m = url.match(/[.,!?;:)\]]+$/);
  if (!m) return [url, ""];
  const tail = m[0];
  const head = url.slice(0, url.length - tail.length);
  if (tail === ")" && (head.match(/\(/g)?.length ?? 0) > (head.match(/\)/g)?.length ?? 0)) {
    return [url, ""];
  }
  return [head, tail];
}

/**
 * Teks pesan dengan URL yang bisa diklik — di grup kelas, link materi & link
 * kelas sering dikirim pengajar, dan teks mati memaksa siswa menyalin manual.
 */
function renderWithLinks(text: string): ReactNode {
  if (!text) return text;
  // split() dengan satu capture group → indeks GANJIL selalu potongan URL.
  const parts = text.split(URL_RE);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (!part) return null;
    if (i % 2 === 0) return part;
    const [href, tail] = splitTrailingPunct(part);
    return (
      <span key={i}>
        <a
          href={href.startsWith("http") ? href : `https://${href}`}
          target="_blank"
          rel="noreferrer"
          // Klik tautan tidak boleh ikut memicu "klik bubble = salin".
          onClick={(e) => e.stopPropagation()}
          className="underline underline-offset-2"
        >
          {href}
        </a>
        {tail}
      </span>
    );
  });
}

/** Ringkasan pesan untuk pratinjau kutipan "Membalas …". */
function snippetOf(m: Msg): string {
  const body = splitAuthor(m.body)[1].trim();
  if (body) return body.length > 120 ? `${body.slice(0, 120)}…` : body;
  return m.media_type ? `[${m.media_type}]` : "pesan";
}

/** Nama penulis pesan orang lain. Nomor anggota lain TIDAK ditampilkan. */
function authorLabel(m: Msg): string {
  if (m.direction === "out") {
    // Ada penanda = siswa lain menulis dari LMS; tanpa penanda = pengajar/admin.
    return splitAuthor(m.body)[0] || "Linguo";
  }
  return (m.contact_name || "").trim() || "Anggota grup";
}

function loadReadMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Waktu baca untuk grup yang belum pernah dibuka = saat fitur pertama dipakai,
 * supaya siswa tidak disambut ratusan pesan lama sebagai "belum dibaca".
 */
function getBaseline(): string {
  try {
    let b = localStorage.getItem(BASELINE_KEY);
    if (!b) {
      b = new Date().toISOString();
      localStorage.setItem(BASELINE_KEY, b);
    }
    return b;
  } catch {
    return new Date().toISOString();
  }
}

/* ── Komponen utama ──────────────────────────────────────────────────────── */

export default function StudentGroupChat() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [identityReady, setIdentityReady] = useState(false);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [active, setActive] = useState<GroupRow | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [lastMsgs, setLastMsgs] = useState<Record<string, LastMsg>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<Pending[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [groupQuery, setGroupQuery] = useState("");
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; type: string | null } | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const stickToBottom = useRef(true);

  const activeJid = active?.jid ?? null;

  // ── Identitas siswa ───────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    void supabase.rpc("student_group_identity").then(({ data, error }) => {
      if (!alive) return;
      if (!error) setIdentity(((data as Identity[]) ?? [])[0] ?? null);
      setIdentityReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // ── Daftar grup ───────────────────────────────────────────────────────────
  // RLS (wa_groups_student_select) sudah menyaring ke grup kelas siswa ini —
  // tak ada filter siapa-pun di klien yang bisa dilewati.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("wa_groups")
        .select("jid, sender, subject, participants, last_seen_at")
        .eq("hidden", false)
        .order("last_seen_at", { ascending: false, nullsFirst: false });
      if (!alive) return;
      if (error) {
        // Timeout/pembatalan cukup ditunggu poll berikutnya — daftar lama tetap
        // terpampang, jauh lebih berguna daripada toast merah.
        if (!isAbortError(error)) toast.error(`Gagal memuat grup: ${error.message}`);
        setLoadingGroups(false);
        return;
      }
      const rows = (data as GroupRow[]) ?? [];
      setGroups(rows);
      setLoadingGroups(false);
      if (rows.length === 0) {
        setLastMsgs({});
        setUnread({});
        return;
      }
      /* Urutan daftar & badge "belum dibaca" mengikuti pesan TERBARU, bukan
         wa_groups.last_seen_at (itu cuma diperbarui bot saat menyegarkan
         metadata grup). Satu query untuk semua grup: siswa paling banyak
         punya beberapa grup, jadi 400 baris terakhir sudah lebih dari cukup. */
      const { data: recent } = await supabase
        .from("wa_messages")
        .select("phone, created_at, body, media_type, direction, contact_name")
        .in("phone", rows.map((g) => g.jid))
        .order("created_at", { ascending: false })
        .limit(400);
      if (!alive || !recent) return;
      const readMap = loadReadMap();
      const baseline = getBaseline();
      const nextLast: Record<string, LastMsg> = {};
      const nextUnread: Record<string, number> = {};
      // Sudah urut menurun, jadi baris pertama per grup = pesan terbarunya.
      for (const r of recent as RecentRow[]) {
        if (!nextLast[r.phone]) {
          nextLast[r.phone] = {
            at: r.created_at,
            body: r.body,
            media_type: r.media_type,
            direction: r.direction,
            contact_name: r.contact_name,
          };
        }
        // Belum dibaca = pesan MASUK yang lebih baru dari waktu baca grup itu.
        if (r.direction === "in" && r.created_at > (readMap[r.phone] || baseline)) {
          nextUnread[r.phone] = (nextUnread[r.phone] ?? 0) + 1;
        }
      }
      setLastMsgs(nextLast);
      setUnread(nextUnread);
    };
    void load();
    // Tab tersembunyi tidak di-poll: request yang menggantung selagi perangkat
    // tidur cuma jadi tumpukan abort begitu tab dibuka lagi.
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 20_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const filteredGroups = useMemo(() => {
    const q = groupQuery.trim().toLowerCase();
    const rows = groups.slice().sort((a, b) => {
      const at = lastMsgs[a.jid]?.at || a.last_seen_at || "";
      const bt = lastMsgs[b.jid]?.at || b.last_seen_at || "";
      return bt.localeCompare(at);
    });
    if (!q) return rows;
    return rows.filter((g) => groupName(g).toLowerCase().includes(q));
  }, [groups, groupQuery, lastMsgs]);

  // Satu grup saja → langsung dibuka; tak ada gunanya menyuruh memilih.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (autoOpened.current || active || groups.length !== 1) return;
    autoOpened.current = true;
    setActive(groups[0]);
  }, [groups, active]);

  /** Tandai grup terbaca sampai detik ini (badge lokal, seperti WhatsApp). */
  const markRead = useCallback((jid: string) => {
    try {
      const map = loadReadMap();
      map[jid] = new Date().toISOString();
      localStorage.setItem(READ_KEY, JSON.stringify(map));
    } catch {
      /* localStorage penuh/diblokir — badge saja yang meleset, chat tetap jalan */
    }
    setUnread((prev) => (prev[jid] ? { ...prev, [jid]: 0 } : prev));
  }, []);

  // ── Transkrip grup aktif ──────────────────────────────────────────────────
  /* Pemuatan transkrip dipicu dari beberapa arah sekaligus (poll 8 detik, dua
     kanal realtime, dan tiap aksi kirim/reaksi). Tanpa penjaga, request baru
     lahir lebih cepat daripada yang lama selesai. Tiga lapis penawarnya:
     1. tiap request punya AbortController sendiri, dibatalkan saat pindah grup;
     2. hanya satu pemuatan jalan sekaligus — pemicu yang datang saat sibuk
        dilebur jadi SATU pemuatan susulan;
     3. abort tidak ditoast (poll berikutnya yang mengejar). */
  const msgAbort = useRef<AbortController | null>(null);
  const msgBusy = useRef(false);
  const msgQueued = useRef<{ jid: string; sender: string } | null>(null);
  /** Grup yang sedang dibuka — penjaga supaya hasil grup lama tak nyasar. */
  const msgKey = useRef<string | null>(null);

  const loadMsgs = useCallback(
    async function run(jid: string, sender: string, opts?: { silent?: boolean }): Promise<void> {
      if (msgBusy.current) {
        msgQueued.current = { jid, sender };
        return;
      }
      msgBusy.current = true;
      if (!opts?.silent) setLoadingMsgs(true);
      const controller = new AbortController();
      msgAbort.current = controller;
      const timer = setTimeout(() => controller.abort(), MSG_FETCH_TIMEOUT_MS);
      try {
        /* Sengaja TANPA .eq("sender", …): satu grup kelas sering diikuti lebih
           dari satu nomor Linguo dan tiap sesi mencatat barisnya sendiri, jadi
           menyaring per sender bikin transkrip bolong-bolong padahal di WhatsApp
           utuh. Policy-nya sudah per-JID (student_group_jid_access). */
        const [msgRes, outRes] = await Promise.all([
          supabase
            .from("wa_messages")
            .select(MSG_COLS)
            .eq("phone", jid)
            .order("created_at", { ascending: false })
            .limit(300)
            .abortSignal(controller.signal),
          supabase
            .from("wa_outbound")
            .select("id, body, status, error, created_at")
            .eq("phone", jid)
            .eq("sender", sender)
            .in("status", ["pending", "failed"])
            .order("created_at", { ascending: true })
            .abortSignal(controller.signal),
        ]);
        // Hasil grup yang SUDAH ditinggalkan dibuang — tanpa ini transkrip grup
        // lama sempat berkelebat di jendela grup baru.
        if (msgKey.current !== `${jid}|${sender}`) return;
        if (msgRes.error) {
          if (!isAbortError(msgRes.error)) {
            toast.error(`Gagal memuat pesan: ${msgRes.error.message}`);
          }
        } else {
          // Query mengambil 300 TERBARU (descending), tampilnya kronologis.
          const rows = ((msgRes.data as unknown as Msg[]) ?? []).slice().reverse();
          setMsgs(rows);
          const newest = rows[rows.length - 1];
          if (newest) {
            setLastMsgs((prev) =>
              prev[jid]?.at === newest.created_at
                ? prev
                : {
                    ...prev,
                    [jid]: {
                      at: newest.created_at,
                      body: newest.body,
                      media_type: newest.media_type,
                      direction: newest.direction,
                      contact_name: newest.contact_name,
                    },
                  },
            );
          }
          // Grup yang sedang terbuka selalu terbaca.
          markRead(jid);
        }
        if (!outRes.error) setPending((outRes.data as Pending[]) ?? []);
      } finally {
        clearTimeout(timer);
        if (msgAbort.current === controller) msgAbort.current = null;
        msgBusy.current = false;
        if (!opts?.silent) setLoadingMsgs(false);
        const queued = msgQueued.current;
        msgQueued.current = null;
        if (queued && msgKey.current === `${queued.jid}|${queued.sender}`) {
          void run(queued.jid, queued.sender, { silent: true });
        }
      }
    },
    [markRead],
  );

  useEffect(() => {
    if (!active) {
      setMsgs([]);
      setPending([]);
      return;
    }
    const { jid, sender } = active;
    let alive = true;
    msgKey.current = `${jid}|${sender}`;
    void loadMsgs(jid, sender);
    const timer = setInterval(() => {
      if (alive && !document.hidden) void loadMsgs(jid, sender, { silent: true });
    }, 8000);
    const onVisible = () => {
      if (alive && !document.hidden) void loadMsgs(jid, sender, { silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    // Ledakan event realtime (bot menulis beberapa pesan sekaligus) dilebur dulu
    // 400 ms — satu pemuatan, bukan sepuluh yang saling berebut jalur.
    let burst: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (!alive) return;
      if (burst) clearTimeout(burst);
      burst = setTimeout(() => {
        burst = null;
        if (alive) void loadMsgs(jid, sender, { silent: true });
      }, 400);
    };
    const channel = supabase
      .channel(`student-group-${jid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wa_messages", filter: `phone=eq.${jid}` },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wa_outbound", filter: `phone=eq.${jid}` },
        refresh,
      )
      .subscribe();
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (burst) clearTimeout(burst);
      // Pindah grup: request yang menggantung dibatalkan & antrean dibuang.
      msgKey.current = null;
      msgQueued.current = null;
      msgAbort.current?.abort();
      void supabase.removeChannel(channel);
    };
  }, [active, loadMsgs]);

  // Ganti grup → buang state composer supaya draf/kutipan tak nyasar.
  useEffect(() => {
    setReplyTo(null);
    setEmojiOpen(false);
    setDraft("");
  }, [activeJid]);

  // Signed URL media — hanya untuk path yang belum punya URL, supaya poll 8 dtk
  // tidak terus-menerus membuat URL baru.
  useEffect(() => {
    const need = msgs.map((m) => m.media_path).filter((p): p is string => !!p && !mediaUrls[p]);
    if (need.length === 0) return;
    let alive = true;
    void supabase.storage
      .from("wa-media")
      .createSignedUrls(need, 3600)
      .then(({ data }) => {
        if (!alive || !data) return;
        setMediaUrls((prev) => {
          const next = { ...prev };
          for (const row of data) {
            if (row.path && row.signedUrl) next[row.path] = row.signedUrl;
          }
          return next;
        });
      });
    return () => {
      alive = false;
    };
  }, [msgs, mediaUrls]);

  /**
   * Gelembung kanan = pesan siswa ini sendiri. Dua jalurnya:
   *   * dia menulis dari LMS  → direction='out' (nomor tim) + penanda namanya;
   *   * dia menulis dari HP   → participant/participant_jid = nomornya.
   * Pesan 'out' TANPA penanda namanya = pengajar/admin → tetap kiri.
   */
  const isMine = useCallback(
    (m: Msg) => {
      if (m.direction === "out") {
        const author = splitAuthor(m.body)[0];
        const prefix = identity?.name_prefix;
        return !!author && !!prefix && author.toLowerCase() === prefix.toLowerCase();
      }
      const key = identity?.phone_key;
      return !!key && !!m.participant && phoneKey(m.participant) === key;
    },
    [identity],
  );

  const scrollToBottom = useCallback((smooth?: boolean) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    stickToBottom.current = true;
    setShowScrollDown(false);
  }, []);

  // Pesan baru menempel ke bawah HANYA kalau siswa memang sedang di bawah —
  // kalau dia sedang membaca riwayat, posisinya tak direbut.
  useLayoutEffect(() => {
    if (stickToBottom.current) scrollToBottom();
  }, [msgs, pending, scrollToBottom]);

  useEffect(() => {
    stickToBottom.current = true;
    setShowScrollDown(false);
  }, [activeJid]);

  // Kotak tulis tumbuh mengikuti isi sampai batas COMPOSER_MAX_H.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_H)}px`;
  }, [draft, activeJid, replyTo]);

  // Esc: tutup lightbox dulu, lalu batal membalas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (lightbox) setLightbox(null);
      else if (replyTo) setReplyTo(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, replyTo]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || !active || sending) return;
    // Kutipan dikirim sebagai blockquote WhatsApp (baris diawali "> ") — bot
    // mengirim body apa adanya, jadi kutipan cukup di teks.
    const body = replyTo ? `> ${snippetOf(replyTo).slice(0, 160)}\n${text}` : text;
    setSending(true);
    const { error } = await supabase.rpc("student_group_send", { p_jid: active.jid, p_body: body });
    setSending(false);
    if (error) {
      toast.error(error.message || "Gagal mengirim pesan");
      return;
    }
    setDraft("");
    setReplyTo(null);
    stickToBottom.current = true;
    void loadMsgs(active.jid, active.sender, { silent: true });
  }, [draft, active, sending, replyTo, loadMsgs]);

  /** Pasang/lepas reaksi. Emoji yang sama = lepas (persis WhatsApp). */
  const toggleReaction = useCallback(
    async (m: Msg, emoji: string) => {
      const next = m.reaction === emoji ? "" : emoji;
      // Optimistis: reaksi terasa instan, poll/realtime yang mengoreksi.
      setMsgs((prev) =>
        prev.map((x) =>
          x.id === m.id ? { ...x, reaction: next || null, reaction_by: next ? "user" : null } : x,
        ),
      );
      const { error } = await supabase.rpc("student_group_react", { p_msg_id: m.id, p_emoji: next });
      if (error) {
        toast.error("Gagal mengirim reaksi");
        if (active) void loadMsgs(active.jid, active.sender, { silent: true });
      }
    },
    [active, loadMsgs],
  );

  /** Batalkan kiriman yang masih mengantre / gagal. */
  const cancelQueued = useCallback(
    async (p: Pending) => {
      const { error } = await supabase.from("wa_outbound").delete().eq("id", p.id);
      if (error) {
        toast.error("Gagal membatalkan");
        return;
      }
      setPending((prev) => prev.filter((x) => x.id !== p.id));
    },
    [],
  );

  // Pesan dikelompokkan per hari untuk pemisah tanggal ala WhatsApp.
  const dayGroups = useMemo(() => {
    const out: { key: string; label: string; items: Msg[] }[] = [];
    for (const m of msgs) {
      const last = out[out.length - 1];
      if (last && sameDay(new Date(last.items[0].created_at), new Date(m.created_at))) {
        last.items.push(m);
      } else {
        out.push({ key: m.id, label: dayLabel(m.created_at), items: [m] });
      }
    }
    return out;
  }, [msgs]);

  /* ── Render ────────────────────────────────────────────────────────────── */

  if (!identityReady || loadingGroups) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-gray-200 bg-white py-24">
        <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
          <MessagesSquare className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-base font-bold text-gray-900">Grup kelasmu belum tersambung</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
          Kalau kamu sudah punya grup WhatsApp kelas bersama pengajar, minta tim Linguo
          menyambungkannya ke akun ini — setelah itu percakapannya bisa dibaca & dibalas dari
          halaman ini.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
      <div className="flex min-h-[34rem] flex-col lg:h-[calc(100vh-11rem)] lg:flex-row">
        {/* ── Daftar grup ── */}
        <aside
          className={`flex w-full shrink-0 flex-col border-gray-200 lg:w-[19rem] lg:border-r ${
            active ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="border-b border-gray-200 px-4 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <MessagesSquare className="h-4 w-4 text-teal-700" /> Grup Kelas
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              Percakapan ini grup WhatsApp kelasmu. Pesanmu tetap masuk ke grupnya, jadi pengajar
              & teman kelas tetap bisa membacanya dari WhatsApp.
            </p>
            {groups.length > 3 && (
              <div className="relative mt-2.5">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  value={groupQuery}
                  onChange={(e) => setGroupQuery(e.target.value)}
                  placeholder="Cari grup kelas…"
                  className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-8 text-xs text-gray-900 outline-none focus:border-teal-300"
                />
                {groupQuery && (
                  <button
                    onClick={() => setGroupQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-gray-400 hover:bg-gray-100"
                    aria-label="Bersihkan pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {filteredGroups.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-gray-500">
                Tidak ada grup yang cocok dengan “{groupQuery.trim()}”.
              </p>
            ) : (
              filteredGroups.map((g) => {
                const on = g.jid === activeJid;
                const n = on ? 0 : (unread[g.jid] ?? 0);
                const last = lastMsgs[g.jid];
                const preview = last
                  ? `${
                      isMineLike(last, identity)
                        ? "Kamu: "
                        : last.direction === "out"
                          ? ""
                          : last.contact_name
                            ? `${last.contact_name}: `
                            : ""
                    }${splitAuthor(last.body)[1].trim() || (last.media_type ? `[${last.media_type}]` : "")}`
                  : g.participants
                    ? `${g.participants} anggota`
                    : "grup WhatsApp";
                const stampAt = last?.at || g.last_seen_at;
                return (
                  <button
                    key={g.jid}
                    onClick={() => {
                      setActive(g);
                      markRead(g.jid);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors ${
                      on ? "bg-teal-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                      <Users className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span
                          className={`min-w-0 flex-1 truncate text-sm text-gray-900 ${
                            n > 0 ? "font-bold" : "font-semibold"
                          }`}
                        >
                          {groupName(g)}
                        </span>
                        {stampAt && (
                          <span
                            className={`shrink-0 text-[10px] ${
                              n > 0 ? "font-semibold text-teal-700" : "text-gray-400"
                            }`}
                          >
                            {listStamp(stampAt)}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span
                          className={`min-w-0 flex-1 truncate text-[11px] ${
                            n > 0 ? "font-semibold text-gray-700" : "text-gray-500"
                          }`}
                        >
                          {preview}
                        </span>
                        {n > 0 && (
                          <span
                            className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[11px] font-bold leading-none text-white"
                            aria-label={`${n} pesan belum dibaca`}
                          >
                            {n > 99 ? "99+" : n}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Transkrip ── */}
        <section className={`flex min-h-0 flex-1 flex-col ${active ? "flex" : "hidden lg:flex"}`}>
          {!active ? (
            <div className="flex flex-1 items-center justify-center px-6 py-16 text-center text-sm text-gray-500">
              Pilih grup kelas di sebelah kiri untuk membuka percakapan.
            </div>
          ) : (
            <>
              <header className="flex items-center gap-2 border-b border-gray-200 px-3 py-3">
                <button
                  onClick={() => setActive(null)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
                  aria-label="Kembali ke daftar grup"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <Users className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">{groupName(active)}</p>
                  <p className="truncate text-[11px] text-gray-500">
                    {active.participants ? `${active.participants} anggota` : "grup WhatsApp kelas"}
                  </p>
                </div>
                <button
                  onClick={() => void loadMsgs(active.jid, active.sender)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                  aria-label="Muat ulang"
                >
                  <RotateCw className={`h-4 w-4 ${loadingMsgs ? "animate-spin" : ""}`} />
                </button>
              </header>

              <div
                ref={scrollRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const distToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                  stickToBottom.current = distToBottom < 80;
                  setShowScrollDown(distToBottom > 240);
                }}
                className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-gray-50 px-3 py-4"
              >
                {loadingMsgs && msgs.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-500">Memuat percakapan…</p>
                ) : dayGroups.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-500">
                    Belum ada pesan di grup ini. Sapa pengajarmu duluan boleh, kok.
                  </p>
                ) : (
                  dayGroups.map((g) => (
                    <div key={g.key} className="space-y-1.5">
                      <div className="sticky top-0 z-10 flex justify-center py-1">
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-[11px] font-medium text-gray-600">
                          {g.label}
                        </span>
                      </div>
                      {g.items.map((m) => (
                        <Bubble
                          key={m.id}
                          m={m}
                          mine={isMine(m)}
                          mediaUrls={mediaUrls}
                          onReply={() => {
                            setReplyTo(m);
                            textareaRef.current?.focus();
                          }}
                          onReact={(emoji) => void toggleReaction(m, emoji)}
                          onOpenMedia={(url, type) => setLightbox({ url, type })}
                        />
                      ))}
                    </div>
                  ))
                )}

                {/* Antrean yang belum dieksekusi bot: sedang dikirim / gagal. */}
                {pending.map((p) => (
                  <div key={p.id} className="flex justify-end">
                    <div
                      className={`max-w-[80%] rounded-2xl rounded-br-md px-3 py-2 text-sm ${
                        p.status === "failed" ? "bg-red-50 text-red-700" : "bg-[#16796E]/60 text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {splitAuthor(p.body)[1]}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] opacity-90">
                        <span>
                          {p.status === "failed"
                            ? `Gagal terkirim${p.error ? `: ${p.error}` : ""}`
                            : "Mengirim…"}
                        </span>
                        {p.status === "failed" && (
                          <button
                            onClick={() => void cancelQueued(p)}
                            className="font-semibold underline underline-offset-2"
                          >
                            Buang
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Tombol "turun ke pesan terbaru" — wadah setinggi 0 supaya
                  mengambang di atas composer tanpa mendorong tata letak. */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => scrollToBottom(true)}
                  aria-label="Turun ke pesan terbaru"
                  className={`absolute bottom-2 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-lg transition-all hover:bg-gray-50 ${
                    showScrollDown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
                  }`}
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>

              {/* ── Kotak tulis ── */}
              <div className="border-t border-gray-200">
                {replyTo && (
                  <div className="flex items-start gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
                    <Reply className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-teal-700">
                        Membalas {isMine(replyTo) ? "pesanmu" : authorLabel(replyTo)}
                      </p>
                      <p className="truncate text-[11px] text-gray-500">{snippetOf(replyTo)}</p>
                    </div>
                    <button
                      onClick={() => setReplyTo(null)}
                      className="rounded p-0.5 text-gray-400 hover:bg-gray-100"
                      aria-label="Batal membalas"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {emojiOpen && (
                  <div className="flex flex-wrap gap-0.5 border-b border-gray-200 px-3 py-2">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => {
                          setDraft((prev) => prev + e);
                          textareaRef.current?.focus();
                        }}
                        className="rounded-lg px-1.5 py-1 text-lg hover:bg-gray-100"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2 px-3 py-3">
                  <button
                    onClick={() => setEmojiOpen((v) => !v)}
                    className={`h-[42px] shrink-0 rounded-xl px-2.5 transition-colors ${
                      emojiOpen ? "bg-teal-50 text-teal-700" : "text-gray-400 hover:bg-gray-100"
                    }`}
                    aria-label="Emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter kirim, Shift+Enter baris baru (kebiasaan WhatsApp Web).
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={1}
                    placeholder="Tulis pesan ke grup kelas…"
                    className="max-h-[240px] min-h-[42px] flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-teal-300"
                  />
                  <button
                    onClick={() => void send()}
                    disabled={!draft.trim() || sending}
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#16796E] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    aria-label="Kirim"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="px-3 pb-3 text-[10.5px] leading-relaxed text-gray-400">
                  Pesanmu muncul di grup atas nama nomor Linguo dengan namamu di baris pertama, jadi
                  pengajar tahu ini dari kamu.
                </p>
              </div>
            </>
          )}
        </section>
      </div>

      {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/**
 * Pratinjau di daftar grup cuma punya ringkasan pesan terakhir (tanpa
 * participant_jid), jadi "Kamu:" dihitung dari penanda nama saja.
 */
function isMineLike(last: LastMsg, identity: Identity | null): boolean {
  if (last.direction !== "out") return false;
  const author = splitAuthor(last.body)[0];
  const prefix = identity?.name_prefix;
  return !!author && !!prefix && author.toLowerCase() === prefix.toLowerCase();
}

/** Satu gelembung pesan + bar reaksi (hover) + tombol balas. */
function Bubble({
  m,
  mine,
  mediaUrls,
  onReply,
  onReact,
  onOpenMedia,
}: {
  m: Msg;
  mine: boolean;
  mediaUrls: Record<string, string>;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onOpenMedia: (url: string, type: string | null) => void;
}) {
  /* Bar reaksi hanya muncul saat kursor benar-benar di atas BUBBLE-nya. Sengaja
     state sendiri, bukan group-hover: baris pesan selebar transkrip, jadi
     group-hover bikin bar meletup walau kursor cuma lewat ruang kosong. */
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const [author, rest] = splitAuthor(m.body);
  const url = m.media_path ? mediaUrls[m.media_path] : undefined;
  const trimmed = rest.trim();
  const hideBody = !!url && MEDIA_PLACEHOLDER_RE.test(trimmed);
  // Di grup, siapa yang bicara baru jelas dari nama penulisnya.
  const showName = !mine;

  /* Klik bubble = salin (pola WA Inbox). Klik di elemen interaktif (tautan,
     tombol media, kontrol video/audio) dan klik saat menyeleksi teks TIDAK
     dihitung, supaya tautan tetap bisa dibuka & teks tetap bisa diblok. */
  const canCopy = !hideBody && !!trimmed;
  const copyOnClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!canCopy) return;
    if ((e.target as HTMLElement).closest("a,button,video,audio,input,textarea")) return;
    if (window.getSelection()?.toString()) return;
    void navigator.clipboard
      .writeText(trimmed)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => toast.error("Gagal menyalin"));
  };

  if (m.deleted_at) {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[80%] rounded-2xl bg-gray-100 px-3 py-2 text-xs italic text-gray-500">
          Pesan ini dihapus
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
      {mine && (
        <div className="flex opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          <button
            onClick={onReply}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
            title="Balas"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Wadah `relative` sebatas lebar bubble: bar reaksi & emoji yang menempel
          bersandar ke sini, dan hover-nya tak ikut kepancing ruang kosong baris. */}
      <div
        className="relative max-w-[80%]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 6, transition: { duration: 0.12 } }}
              transition={{ type: "spring", stiffness: 500, damping: 26 }}
              style={{ transformOrigin: mine ? "bottom right" : "bottom left" }}
              // `before:` = jembatan transparan penutup celah mb-1, biar kursor
              // dari bubble ke emoji tak sempat keluar area hover.
              className={`absolute bottom-full z-30 mb-1 flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-lg before:absolute before:inset-x-0 before:top-full before:h-1.5 before:content-[''] ${
                mine ? "right-0" : "left-0"
              }`}
            >
              {QUICK_REACTIONS.map(({ emoji, label }, i) => {
                const isActive = m.reaction === emoji;
                return (
                  <motion.button
                    key={emoji}
                    type="button"
                    title={isActive ? `Lepas reaksi ${label.toLowerCase()}` : label}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReact(emoji);
                    }}
                    initial={{ opacity: 0, scale: 0.3, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 600, damping: 20, delay: 0.02 * i }}
                    whileHover={{ scale: 1.45, y: -4 }}
                    whileTap={{ scale: 0.85 }}
                    className={`rounded-full px-1 text-lg leading-none ${
                      isActive ? "bg-teal-50 ring-1 ring-teal-300" : ""
                    }`}
                  >
                    {emoji}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          onClick={copyOnClick}
          title={canCopy ? "Klik untuk salin pesan" : undefined}
          className={`rounded-2xl px-3 py-2 text-sm ${canCopy ? "cursor-pointer" : ""} ${
            mine
              ? "rounded-br-md bg-[#16796E] text-white"
              : "rounded-bl-md border border-gray-200 bg-white text-gray-900"
          }`}
        >
          {showName && (
            <p className={`mb-0.5 text-[11px] font-semibold ${mine ? "text-white/85" : "text-teal-700"}`}>
              {author || authorLabel(m)}
            </p>
          )}
          {url && (
            <MediaView url={url} type={m.media_type} mime={m.media_mime} onOpen={() => onOpenMedia(url, m.media_type)} />
          )}
          {!hideBody && trimmed && (
            <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{renderWithLinks(trimmed)}</p>
          )}
          <p className={`mt-1 flex items-center gap-1.5 text-[10px] ${mine ? "text-white/70" : "text-gray-400"}`}>
            {hhmm(m.created_at)}
            {m.edited_at && <span>· diedit</span>}
            {copied && (
              <span className="inline-flex items-center gap-0.5 font-medium">
                <Check className="h-3 w-3" /> Tersalin
              </span>
            )}
          </p>
        </div>

        {/* Emoji reaksi nempel di sudut bawah bubble (ala WhatsApp). Reaksi yang
            siswa ini kirim bisa dilepas dengan mengkliknya. */}
        {m.reaction && (
          <motion.span
            initial={{ scale: 0, y: 4 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 18 }}
            onClick={() => {
              if (m.reaction_by === "user") onReact(m.reaction!);
            }}
            title={m.reaction_by === "user" ? "Klik untuk melepas reaksi" : "Reaksi dari anggota grup"}
            className={`absolute -bottom-2 z-10 rounded-full border border-gray-200 bg-white px-1 py-px text-xs shadow-sm ${
              m.reaction_by === "user" ? "cursor-pointer" : ""
            } ${mine ? "left-1" : "right-1"}`}
          >
            {m.reaction}
          </motion.span>
        )}
      </div>

      {!mine && (
        <div className="flex opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          <button
            onClick={onReply}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
            title="Balas"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function MediaView({
  url,
  type,
  mime,
  onOpen,
}: {
  url: string;
  type: string | null;
  mime: string | null;
  onOpen: () => void;
}) {
  const kind = type || "";
  if (kind === "image" || kind === "sticker") {
    return (
      <button onClick={onOpen} className="mb-1 block" title="Buka gambar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" loading="lazy" className="max-h-80 rounded-xl object-contain" />
      </button>
    );
  }
  if (kind === "video" || kind === "gif") {
    return (
      <button onClick={onOpen} className="mb-1 block" title="Putar video">
        <video src={url} className="max-h-80 rounded-xl" />
      </button>
    );
  }
  if (kind === "audio" || kind === "voice") {
    return <audio src={url} controls className="mb-1 w-56" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mb-1 inline-flex items-center gap-1.5 underline underline-offset-2"
    >
      <FileText className="h-3.5 w-3.5" /> Buka lampiran{mime ? ` (${mime})` : ""}
    </a>
  );
}

/** Gambar/video layar penuh. Klik latar atau Esc untuk menutup. */
function Lightbox({
  url,
  type,
  onClose,
}: {
  url: string;
  type: string | null;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Tutup"
      >
        <X className="h-5 w-5" />
      </button>
      {type === "video" || type === "gif" ? (
        <video
          src={url}
          controls
          autoPlay
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-xl"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-xl object-contain"
        />
      )}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
      >
        Buka di tab baru
      </a>
    </div>
  );
}
