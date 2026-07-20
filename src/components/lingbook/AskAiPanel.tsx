"use client";

// [lingbook-phase2] Panel "Tanya AI" dari word card. REAL: memanggil
// /api/lingbook/ask (Anthropic haiku). Batas 5 pertanyaan per sesi kartu,
// loading state (dots), pertanyaan saran saat kosong.
import { useEffect, useRef, useState } from "react";
import { TEAL } from "./theme";

export interface AskContext {
  word: string;
  meaning: string;
  pos: string;
  sentence: string;
  grammar: string;
  langName: string;
}

type Msg = { role: "user" | "assistant"; content: string };

const MAX_Q = 5;

export default function AskAiPanel({
  ctx,
  isMobile,
  onClose,
}: {
  ctx: AskContext;
  isMobile: boolean;
  onClose: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userCount = msgs.filter((m) => m.role === "user").length;
  const limitReached = userCount >= MAX_Q;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy || limitReached) return;
    const next = msgs.concat([{ role: "user", content: question }]);
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/lingbook/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          word: ctx.word,
          meaning: ctx.meaning,
          pos: ctx.pos,
          sentence: ctx.sentence,
          grammar: ctx.grammar,
          langName: ctx.langName,
          messages: next,
        }),
      });
      const data = (await r.json().catch(() => ({}))) as { reply?: string };
      const reply = data.reply || "Maaf, AI sedang tidak bisa dihubungi. Coba lagi ya.";
      setMsgs((prev) => prev.concat([{ role: "assistant", content: reply }]));
    } catch {
      setMsgs((prev) =>
        prev.concat([{ role: "assistant", content: "Maaf, koneksi bermasalah. Coba lagi ya." }]),
      );
    } finally {
      setBusy(false);
    }
  };

  const suggests = [
    `Kenapa pakai ${ctx.word} di kalimat ini?`,
    `Beri 2 contoh kalimat lain dengan ${ctx.word}`,
    "Apa kesalahan umum pemula dengan kata ini?",
  ];

  const panelBase: React.CSSProperties = {
    background: "var(--lb-surface)",
    boxSizing: "border-box",
    zIndex: 65,
    boxShadow: "0 18px 50px rgba(4,14,17,.35)",
    display: "flex",
    flexDirection: "column",
  };
  const panelStyle: React.CSSProperties = isMobile
    ? { ...panelBase, position: "fixed", left: 0, right: 0, bottom: 0, top: "18vh", borderRadius: "22px 22px 0 0", padding: "16px 20px", animation: "lbSheetUp .3s cubic-bezier(.3,1,.4,1)" }
    : { ...panelBase, position: "fixed", right: 24, bottom: 24, width: 400, height: "min(560px, 82vh)", borderRadius: 20, padding: "16px 20px", border: "1px solid var(--lb-line)", animation: "lbPopIn .2s ease" };
  const backStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 64, background: isMobile ? "var(--lb-scrim)" : "transparent", animation: isMobile ? "lbFadeIn .2s" : "none" };

  const showSuggest = msgs.length === 0 && !busy;

  return (
    <>
      <div onClick={onClose} style={backStyle} />
      <div style={panelStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--lb-line)" }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, background: "var(--lb-ai)", color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 15, fontWeight: 800, flex: "none" }}>✦</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--lb-ink)" }}>Tanya AI</div>
            <div style={{ fontSize: 12, color: "var(--lb-ink-4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Konteks: {ctx.word} — {ctx.meaning}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "var(--lb-soft)", color: "var(--lb-ink-2)", cursor: "pointer", fontSize: 13, flex: "none" }}>✕</button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 2px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={
                  m.role === "user"
                    ? { background: TEAL, color: "#FFFFFF", borderRadius: "14px 14px 4px 14px", padding: "10px 14px", fontSize: 14, lineHeight: 1.55, maxWidth: "85%" }
                    : { background: "var(--lb-ai-bubble)", color: "var(--lb-ink)", borderRadius: "14px 14px 14px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.6, maxWidth: "90%", whiteSpace: "pre-wrap" }
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div style={{ alignSelf: "flex-start", background: "var(--lb-ai-bubble)", borderRadius: "14px 14px 14px 4px", padding: "12px 16px", display: "flex", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lb-ai)", animation: "lbDotBlink 1.2s infinite" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lb-ai)", animation: "lbDotBlink 1.2s infinite .2s" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lb-ai)", animation: "lbDotBlink 1.2s infinite .4s" }} />
            </div>
          )}
          {showSuggest && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {suggests.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="lb-ai-suggest"
                  style={{ textAlign: "left", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--lb-ai-line)", background: "var(--lb-ai-soft)", color: "var(--lb-ai-ink)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          {limitReached && !busy && (
            <div style={{ alignSelf: "center", fontSize: 12.5, color: "var(--lb-ink-4)", textAlign: "center", padding: "6px 10px" }}>
              Batas {MAX_Q} pertanyaan untuk kata ini tercapai.
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--lb-line)" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ask(input); }}
            disabled={limitReached}
            placeholder={limitReached ? "Batas pertanyaan tercapai" : "Tanya tentang kata ini…"}
            style={{ flex: 1, minWidth: 0, padding: "12px 14px", border: "1.5px solid var(--lb-line)", borderRadius: 12, fontFamily: "inherit", fontSize: 14, color: "var(--lb-ink)", outline: "none", background: limitReached ? "var(--lb-surface-2)" : "var(--lb-surface)" }}
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim() || busy || limitReached}
            style={{ width: 44, height: 44, borderRadius: 12, border: "none", background: input.trim() && !limitReached ? "var(--lb-ai)" : "var(--lb-ai-line)", color: "#FFFFFF", fontSize: 18, fontWeight: 800, cursor: input.trim() && !limitReached ? "pointer" : "default", flex: "none" }}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
