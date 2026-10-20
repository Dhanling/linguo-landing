// [lingwords-v1] Catat "kartu direview hari ini" ke student_word_activity (bahan
// heatmap & hari beruntun Lingwords). Dipanggil dari gradeSavedWord; review beruntun
// dikumpulkan dulu lalu dikirim sekali (debounce) supaya satu sesi flashcard tak
// memicu puluhan RPC. Best-effort: tanpa login / tabel belum ada → diam saja.

import { peekSessionUser, supabase } from "@/lib/supabase-client";

const pending = new Map<string, number>();
let timer: ReturnType<typeof setTimeout> | null = null;
let off = false;

function flush() {
  timer = null;
  const batch = Array.from(pending.entries());
  pending.clear();
  batch.forEach(([lang, n]) => {
    supabase.rpc("lingwords_tick", { p_lang: lang, p_n: n }).then(({ error }) => {
      if (error && /does not exist|schema cache|PGRST202|42883/i.test(`${error.code} ${error.message}`)) off = true;
    }, () => {});
  });
}

export function tickLingwords(lang: string, n = 1): void {
  if (off || typeof window === "undefined" || !lang) return;
  if (!peekSessionUser()) return;
  pending.set(lang.toLowerCase(), (pending.get(lang.toLowerCase()) || 0) + n);
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 4000);
  if (pending.size && !(window as unknown as { __lwUnload?: boolean }).__lwUnload) {
    (window as unknown as { __lwUnload?: boolean }).__lwUnload = true;
    window.addEventListener("pagehide", () => { if (pending.size) flush(); });
  }
}
