"use client";
// linguo-patch:chat-widget-ai-wa-v1
// linguo-patch:ling-polish-v2
// linguo-patch:ling-chat-v3  — session id + nomor tiket + polling balasan admin (live take-over)
// linguo-patch:ling-chat-v4-redesign  — drawer UI: gradient header, avatar spin, WA strip, typing dots, composer pill, scrim blur. Semua wiring fungsional dipertahanin.
// linguo-patch:ling-lesson-reposition-v2  — angkat launcher bubble di /akun/belajar biar ga nutupin tombol Selesaikan/Lanjut (panel drawer samping ga diutak-atik)
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

const WA_NUMBER = "6282116859493"; // admin handoff
const GREETING =
  "Halo! 👋 Aku Ling, asisten Linguo.id. Mau tanya soal kelas bahasa, harga, jadwal, atau cara daftar? Tanya aja di sini 😊";
const CHIPS = [
  "Lihat harga kelas",
  "Jadwal kelas reguler",
  "Coba trial gratis",
  "Bahasa apa aja?",
];

type Msg = { role: "user" | "assistant" | "admin"; content: string };

// Render ringan: **tebal** -> <strong>, dan buang sisa tanda '*' (bullet/italic)
function renderRich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part);
    if (m) return <strong key={i}>{m[1]}</strong>;
    return <span key={i}>{part.replace(/\*/g, "")}</span>;
  });
}

// ---- icons ----
const IcChat = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z" /></svg>
);
const IcClose = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
const IcSend = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
);
const IcWa = (
  <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.2-1.4A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.3.6 1 1.3 1.6.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.5.3.1.2.1.7-.1 1.2z" /></svg>
);
const IcSpark = (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z" /></svg>
);

const CSS = `
.lingw{
  --teal:#16A398; --teal-deep:#0C7C71; --teal-soft:#E7F4F2; --teal-line:#D2E9E5;
  --yellow:#F8C53D; --yellow-deep:#EAB223; --ink:#0E2A27; --muted:#5C7A75; --panel-w:460px;
  font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;
}
.lingw *{box-sizing:border-box;}

.lingw-launcher{
  position:fixed;right:20px;bottom:20px;z-index:9990;width:64px;height:64px;border-radius:50%;
  border:none;cursor:pointer;color:#fff;display:grid;place-items:center;
  background:linear-gradient(135deg,var(--teal) 0%,var(--teal-deep) 100%);
  box-shadow:0 14px 34px -10px rgba(8,51,46,.6);
  transition:transform .35s cubic-bezier(.34,1.56,.64,1),opacity .3s ease;
}
.lingw-launcher:hover{transform:scale(1.08) rotate(-4deg);}
.lingw-launcher svg{width:28px;height:28px;}
.lingw-launcher .ping{position:absolute;inset:0;border-radius:50%;border:2px solid var(--teal);animation:lingw-ping 2.2s ease-out infinite;}
.lingw-launcher.hidden{opacity:0;pointer-events:none;transform:scale(.6);}
@keyframes lingw-ping{0%{transform:scale(1);opacity:.6;}100%{transform:scale(1.5);opacity:0;}}

.lingw-scrim{
  position:fixed;inset:0;z-index:9998;background:rgba(6,38,34,.28);
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
  opacity:0;pointer-events:none;transition:opacity .4s ease;
}
.lingw-scrim.open{opacity:1;pointer-events:auto;}

.lingw-panel{
  position:fixed;top:0;right:0;bottom:0;z-index:9999;width:var(--panel-w);max-width:100vw;
  background:#fff;display:flex;flex-direction:column;color:var(--ink);overflow:hidden;
  box-shadow:-30px 0 70px -30px rgba(6,38,34,.5);
  transform:translateX(105%);transition:transform .5s cubic-bezier(.5,0,.18,1);
}
.lingw-panel.open{transform:translateX(0);}

.lingw-head{position:relative;padding:18px 18px 16px;color:#fff;flex:0 0 auto;overflow:hidden;background:linear-gradient(135deg,#17A89C 0%,#0E8276 100%);}
.lingw-head .deco{position:absolute;right:-40px;top:-60px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.07);}
.lingw-head .deco2{position:absolute;left:-30px;bottom:-70px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.05);}
.lingw-htop{position:relative;z-index:2;display:flex;align-items:center;gap:13px;}
.lingw-avatar{position:relative;width:50px;height:50px;border-radius:50%;flex:0 0 auto;animation:lingw-spin 9s linear infinite;
  background:conic-gradient(from 0deg,#FFD36B,#FF8AB3,#9B7BFF,#5BE0C9,#FFD36B);
  box-shadow:0 0 0 3px rgba(255,255,255,.55),0 6px 16px -4px rgba(0,0,0,.4);}
.lingw-avatar:after{content:"";position:absolute;inset:7px;border-radius:50%;background:rgba(255,255,255,.18);}
@keyframes lingw-spin{to{transform:rotate(360deg);}}
.lingw-on{position:absolute;right:-1px;bottom:-1px;width:14px;height:14px;border-radius:50%;background:#36D399;border:2.5px solid #0E8276;z-index:3;}
.lingw-nm{font-family:'Baloo 2','Plus Jakarta Sans',sans-serif;font-weight:700;font-size:18.5px;line-height:1.1;display:flex;align-items:center;gap:6px;}
.lingw-nm .d{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.6);}
.lingw-role{font-size:12.5px;opacity:.85;font-weight:500;margin-top:1px;}
.lingw-iconbtn{margin-left:auto;width:36px;height:36px;border-radius:50%;border:none;cursor:pointer;color:#fff;display:grid;place-items:center;background:rgba(255,255,255,.16);transition:background .2s;}
.lingw-iconbtn:hover{background:rgba(255,255,255,.28);}
.lingw-iconbtn svg{width:18px;height:18px;}
.lingw-wa{position:relative;z-index:2;margin-top:14px;width:100%;display:flex;align-items:center;justify-content:center;gap:9px;color:#fff;cursor:pointer;font-size:13.5px;font-weight:600;border-radius:12px;padding:9px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);transition:background .2s;}
.lingw-wa:hover{background:rgba(255,255,255,.22);}
.lingw-wa .ic{width:20px;height:20px;border-radius:50%;background:#25D366;display:grid;place-items:center;flex:0 0 auto;}
.lingw-wa .ic svg{width:13px;height:13px;}

.lingw-human{flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:7px;background:#ECFDF5;color:#047857;padding:7px;font-size:11.5px;font-weight:600;}
.lingw-human .pulse{width:8px;height:8px;border-radius:50%;background:#10B981;}

.lingw-body{flex:1 1 auto;overflow-y:auto;padding:22px 18px 8px;background:radial-gradient(600px 300px at 100% 0,#F1F8F7 0%,rgba(241,248,247,0) 60%),#FBFDFC;}
.lingw-body::-webkit-scrollbar{width:8px;}
.lingw-body::-webkit-scrollbar-thumb{background:#D7E6E3;border-radius:8px;}
.lingw-day{text-align:center;font-size:11.5px;color:#9DB3AF;font-weight:600;margin:2px 0 16px;text-transform:uppercase;letter-spacing:.5px;}

.lingw-row{display:flex;margin-bottom:12px;animation:lingw-rise .4s cubic-bezier(.2,.7,.3,1) both;}
@keyframes lingw-rise{from{transform:translateY(9px);opacity:.35;}to{transform:none;opacity:1;}}
.lingw-row.bot{justify-content:flex-start;}
.lingw-row.user{justify-content:flex-end;}
.lingw-bubble{max-width:80%;padding:13px 16px;font-size:15px;line-height:1.5;border-radius:18px;white-space:pre-wrap;word-break:break-word;}
.lingw-row.bot .lingw-bubble{background:#fff;color:var(--ink);border:1px solid var(--teal-line);border-top-left-radius:6px;box-shadow:0 4px 14px -8px rgba(8,51,46,.18);}
.lingw-row.user .lingw-bubble{background:var(--teal);color:#fff;border-bottom-right-radius:6px;box-shadow:0 8px 18px -8px rgba(11,124,113,.5);}
.lingw-adminwrap{max-width:80%;}
.lingw-adminlbl{font-size:10px;font-weight:700;color:#059669;margin:0 0 4px 4px;}
.lingw-bubble.admin{max-width:100%;background:#ECFDF5;color:#065F46;border:1px solid #A7F3D0;border-top-left-radius:6px;}

.lingw-typing{display:inline-flex;gap:5px;padding:15px 18px;background:#fff;border:1px solid var(--teal-line);border-radius:18px;border-top-left-radius:6px;}
.lingw-typing span{width:8px;height:8px;border-radius:50%;background:#9DB3AF;animation:lingw-bounce 1.2s infinite;}
.lingw-typing span:nth-child(2){animation-delay:.18s;}
.lingw-typing span:nth-child(3){animation-delay:.36s;}
@keyframes lingw-bounce{0%,60%,100%{transform:translateY(0);opacity:.5;}30%{transform:translateY(-6px);opacity:1;}}

.lingw-fu{display:flex;flex-wrap:wrap;gap:9px;margin:6px 0 18px;animation:lingw-rise .5s .1s both;}
.lingw-fulabel{width:100%;display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:#9DB3AF;text-transform:uppercase;letter-spacing:.5px;margin-bottom:1px;}
.lingw-fulabel svg{width:13px;height:13px;flex:0 0 auto;color:var(--yellow-deep);}
.lingw-chip{background:#fff;border:1.4px solid var(--teal);color:var(--teal-deep);border-radius:999px;padding:10px 16px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .18s ease;}
.lingw-chip:hover{background:var(--teal);color:#fff;transform:translateY(-2px);box-shadow:0 8px 18px -8px rgba(11,124,113,.5);}

.lingw-foot{flex:0 0 auto;padding:14px 16px 16px;background:#fff;border-top:1px solid var(--teal-soft);}
.lingw-composer{display:flex;align-items:center;gap:10px;background:#F1F7F6;border:1.5px solid var(--teal-soft);border-radius:999px;padding:6px 6px 6px 18px;transition:border-color .2s;}
.lingw-composer:focus-within{border-color:var(--teal);}
.lingw-composer input{flex:1;min-width:0;border:none;background:transparent;outline:none;font-size:15px;font-family:inherit;color:var(--ink);}
.lingw-composer input::placeholder{color:#9DB3AF;}
.lingw-send{width:42px;height:42px;border-radius:50%;border:none;background:var(--teal);color:#fff;cursor:pointer;display:grid;place-items:center;flex:0 0 auto;transition:transform .2s,background .2s;}
.lingw-send:hover:not(:disabled){transform:scale(1.06);background:var(--teal-deep);}
.lingw-send:disabled{opacity:.4;cursor:default;}
.lingw-send svg{width:19px;height:19px;}
.lingw-powered{text-align:center;font-size:11px;color:#B6C8C4;margin-top:9px;font-weight:600;}
.lingw-powered b{color:var(--teal-deep);font-family:'Baloo 2','Plus Jakarta Sans',sans-serif;}

@media (max-width:560px){.lingw{--panel-w:100vw;}.lingw-launcher{right:16px;bottom:16px;}}
`;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [humanMode, setHumanMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const adminCursor = useRef(0);

  const pathname = usePathname();

  // session id persisten (per browser) — biar tiket nyambung kalau visitor balik lagi
  useEffect(() => {
    try {
      const k = "linguo_chat_session";
      let v = localStorage.getItem(k);
      if (!v) {
        v =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()) + Math.random().toString(16).slice(2);
        localStorage.setItem(k, v);
      }
      setSessionId(v);
    } catch {
      /* localStorage diblok: jalan tanpa logging */
    }
  }, []);

  // muat font Baloo 2 + Plus Jakarta Sans sekali (panel-scoped)
  useEffect(() => {
    const id = "linguo-chat-fonts";
    if (typeof document === "undefined" || document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  // auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  // kunci scroll body + tutup pakai Escape pas panel kebuka
  useEffect(() => {
    if (!open) return;
    const prev = typeof document !== "undefined" ? document.body.style.overflow : "";
    if (typeof document !== "undefined") document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      if (typeof document !== "undefined") document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // polling: ambil balasan admin + status (cuma jalan pas panel kebuka)
  useEffect(() => {
    if (!open || !sessionId) return;
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/api/chat/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, afterId: adminCursor.current }),
        });
        const data = await res.json();
        if (!alive) return;
        if (data?.status === "human") setHumanMode(true);
        else if (data?.status === "bot") setHumanMode(false);
        const arr: Array<{ id: number; content: string }> = Array.isArray(data?.messages)
          ? data.messages
          : [];
        if (arr.length) {
          adminCursor.current = Math.max(adminCursor.current, ...arr.map((x) => x.id));
          setMessages((m) => [
            ...m,
            ...arr.map((x) => ({ role: "admin" as const, content: x.content })),
          ]);
        }
      } catch {
        /* abaikan, coba lagi interval berikutnya */
      }
    }
    poll();
    const t = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [open, sessionId]);

  function waHandoff() {
    const transcript = messages
      .filter((m) => m.role === "user")
      .slice(-3)
      .map((m) => m.content)
      .join(" | ");
    const tiket = ticket ? ` (Tiket ${ticket})` : "";
    const text =
      "Halo Admin Linguo, saya dari chat website." +
      tiket +
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
        body: JSON.stringify({
          messages: next.filter((m) => m.role === "user" || m.role === "assistant"),
          sessionId,
          page: typeof window !== "undefined" ? window.location.pathname : null,
        }),
      });
      const data = await res.json();
      if (data?.ticket_no) setTicket(data.ticket_no);
      if (data?.status === "human") setHumanMode(true);
      const reply = data && data.reply;
      if (reply) {
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      }
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

  // [ling-hide-fab-akun-v1] Ling itu chat sales/support buat calon murid — sembunyiin di
  // SELURUH app student (/akun/*: dashboard + player lesson). Tetap render global di layout,
  // cuma di-suppress di sini. FAB tetap tampil di halaman marketing publik.
  if (pathname?.startsWith("/akun")) return null;

  return (
    <div className="lingw">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <button
        aria-label="Buka chat Linguo"
        onClick={() => setOpen(true)}
        className={"lingw-launcher" + (open ? " hidden" : "")}
      >
        <span className="ping" />
        {IcChat}
      </button>

      <div
        className={"lingw-scrim" + (open ? " open" : "")}
        onClick={() => setOpen(false)}
      />

      <aside
        className={"lingw-panel" + (open ? " open" : "")}
        role="dialog"
        aria-label="Chat Linguo"
        aria-hidden={!open}
      >
        {/* header */}
        <div className="lingw-head">
          <div className="deco" />
          <div className="deco2" />
          <div className="lingw-htop">
            <div style={{ position: "relative" }}>
              <div className="lingw-avatar" />
              <span className="lingw-on" />
            </div>
            <div>
              <div className="lingw-nm">
                Ling <span className="d" /> Linguo.id
              </div>
              <div className="lingw-role">
                {ticket ? `Tiket ${ticket} · Online` : "Asisten kursus bahasa · Online"}
              </div>
            </div>
            <button
              className="lingw-iconbtn"
              aria-label="Tutup chat"
              onClick={() => setOpen(false)}
            >
              {IcClose}
            </button>
          </div>
          <button className="lingw-wa" onClick={waHandoff}>
            <span className="ic">{IcWa}</span>
            Ngobrol langsung sama admin (WhatsApp)
          </button>
        </div>

        {humanMode && (
          <div className="lingw-human">
            <span className="pulse" />
            Kamu sekarang terhubung langsung sama Admin Linguo
          </div>
        )}

        {/* body */}
        <div className="lingw-body" ref={scrollRef}>
          <div className="lingw-day">Hari ini</div>
          {messages.map((m, i) => {
            if (m.role === "admin") {
              return (
                <div key={i} className="lingw-row bot">
                  <div className="lingw-adminwrap">
                    <div className="lingw-adminlbl">Admin Linguo</div>
                    <div className="lingw-bubble admin">{m.content}</div>
                  </div>
                </div>
              );
            }
            const mine = m.role === "user";
            return (
              <div key={i} className={"lingw-row " + (mine ? "user" : "bot")}>
                <div className="lingw-bubble">
                  {m.role === "assistant" ? renderRich(m.content) : m.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="lingw-row bot">
              <div className="lingw-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {!loading && !humanMode && lastIsAssistant && (
            <div className="lingw-fu">
              <div className="lingw-fulabel">{IcSpark} Pertanyaan cepat</div>
              {CHIPS.map((c) => (
                <button key={c} className="lingw-chip" onClick={() => send(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="lingw-foot">
          <div className="lingw-composer">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={humanMode ? "Tulis pesan ke admin…" : "Tulis pertanyaan…"}
            />
            <button
              className="lingw-send"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label="Kirim"
            >
              {IcSend}
            </button>
          </div>
          <div className="lingw-powered">
            Didukung oleh <b>Linguo AI</b>
          </div>
        </div>
      </aside>
    </div>
  );
}
