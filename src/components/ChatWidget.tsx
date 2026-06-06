"use client";
// linguo-patch:chat-widget-ai-wa-v1
// linguo-patch:ling-polish-v2  — Plus Jakarta Sans (panel-only), follow-up chips, render markdown ringan
import { useState, useRef, useEffect } from "react";

const TEAL = "#1A9E9E";
const WA_NUMBER = "6282116859493"; // admin handoff
const FONT = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
const GREETING =
  "Halo! 👋 Aku Ling, asisten Linguo.id. Mau tanya soal kelas bahasa, harga, jadwal, atau cara daftar? Tanya aja di sini 😊";
const CHIPS = ["Lihat harga kelas", "Jadwal kelas reguler", "Coba trial gratis"];

type Msg = { role: "user" | "assistant"; content: string };

// Render ringan: **tebal** -> <strong>, dan buang sisa tanda '*' (bullet/italic) biar ga muncul mentah
function renderRich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part);
    if (m) return <strong key={i}>{m[1]}</strong>;
    return <span key={i}>{part.replace(/\*/g, "")}</span>;
  });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Task C: muat Plus Jakarta Sans sekali aja (khusus panel chat; ga ngubah font situs)
  useEffect(() => {
    const id = "linguo-chat-font-pjs";
    if (typeof document === "undefined" || document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  function waHandoff() {
    const transcript = messages
      .filter((m) => m.role === "user")
      .slice(-3)
      .map((m) => m.content)
      .join(" | ");
    const text =
      "Halo Admin Linguo, saya dari chat website." +
      (transcript ? ` Pertanyaan saya: ${transcript}` : "");
    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  async function send(forced?: string) {
    const text = (forced ?? input).trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply =
        (data && data.reply) ||
        "Maaf, lagi ada gangguan. Coba klik tombol WhatsApp di atas untuk ngobrol langsung sama admin ya 🙏";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Maaf, lagi ada gangguan koneksi. Klik tombol WhatsApp di atas untuk ngobrol sama admin ya 🙏",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const lastIsAssistant = messages[messages.length - 1]?.role === "assistant";

  return (
    <>
      {!open && (
        <button
          aria-label="Buka chat Linguo"
          onClick={() => setOpen(true)}
          style={{ backgroundColor: TEAL }}
          className="fixed bottom-5 right-5 z-[9998] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      )}

      {open && (
        <div style={{ fontFamily: FONT }} className="fixed bottom-5 right-5 z-[9999] flex h-[70vh] max-h-[560px] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <div style={{ backgroundColor: TEAL }} className="flex items-center justify-between px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-bold">L</div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Ling • Linguo.id</div>
                <div className="text-[11px] opacity-90">Asisten kursus bahasa</div>
              </div>
            </div>
            <button aria-label="Tutup chat" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <button onClick={waHandoff} className="flex items-center justify-center gap-1.5 border-b border-slate-100 bg-slate-50 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z" /></svg>
            Ngobrol langsung sama admin (WhatsApp)
          </button>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  style={m.role === "user" ? { backgroundColor: TEAL } : {}}
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "text-white" : "bg-slate-100 text-slate-800"}`}
                >
                  {m.role === "assistant" ? renderRich(m.content) : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-400">Ling lagi ngetik…</div>
              </div>
            )}
            {!loading && lastIsAssistant && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    onClick={() => send(c)}
                    style={{ borderColor: TEAL, color: TEAL }}
                    className="rounded-full border bg-white px-3 py-1 text-xs font-medium transition-colors hover:bg-teal-50"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Tulis pertanyaan…"
              style={{ fontFamily: FONT }}
              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-300"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Kirim"
              style={{ backgroundColor: TEAL }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7z" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
