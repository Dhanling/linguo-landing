"use client";

// [lingbook-phase2] Modal roleplay akhir unit. MOCK/scripted: percakapan statis
// dengan pilihan balasan. // TODO: wire ke AI (Lingcore pattern) di phase berikutnya.
import { useEffect, useRef, useState } from "react";
import type { RoleplayChoice, RoleplayTurn } from "@/data/lingbook";
import { TEAL, CJK_FONT } from "./theme";

type Bubble = { mine: boolean; text: string; trans?: string };

export default function RoleplayModal({
  turns,
  isMobile,
  readFont = CJK_FONT,
  title,
  avatar = "店",
  onClose,
}: {
  turns: RoleplayTurn[];
  isMobile: boolean;
  readFont?: string;
  title: string;
  avatar?: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [msgs, setMsgs] = useState<Bubble[]>(
    turns.length > 0 ? [{ mine: false, text: turns[0].ai, trans: turns[0].trans }] : [],
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const cur = turns[step];
  const done = !cur || !cur.choices;

  const pick = (choice: RoleplayChoice) => {
    const next = step + 1;
    const added: Bubble[] = [{ mine: true, text: choice.t, trans: choice.tr }];
    if (turns[next]) added.push({ mine: false, text: turns[next].ai, trans: turns[next].trans });
    setMsgs((prev) => prev.concat(added));
    setStep(next);
  };

  const restart = () => {
    setStep(0);
    setMsgs(turns.length > 0 ? [{ mine: false, text: turns[0].ai, trans: turns[0].trans }] : []);
  };

  const modalStyle: React.CSSProperties = isMobile
    ? { position: "fixed", left: 0, right: 0, bottom: 0, top: "10vh", background: "var(--lb-surface)", borderRadius: "22px 22px 0 0", padding: "16px 20px", zIndex: 66, boxSizing: "border-box", display: "flex", flexDirection: "column", animation: "lbSheetUp .3s cubic-bezier(.3,1,.4,1)" }
    : { position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 480, height: "min(620px, 86vh)", background: "var(--lb-surface)", borderRadius: 22, padding: "18px 22px", zIndex: 66, boxSizing: "border-box", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(4,14,17,.4)", animation: "lbPopIn .2s ease" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--lb-scrim)", zIndex: 65, animation: "lbFadeIn .2s" }} />
      <div style={modalStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--lb-line)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: TEAL, color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 15, fontFamily: readFont, flex: "none" }}>{avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--lb-ink)" }}>{title}</div>
            <div style={{ fontSize: 12, color: "var(--lb-ink-4)" }}>AI berperan sebagai pelayan — jawab dengan kosakata unit ini</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "var(--lb-soft)", color: "var(--lb-ink-2)", cursor: "pointer", fontSize: 13, flex: "none" }}>✕</button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 2px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.mine ? "flex-end" : "flex-start" }}>
              <div
                style={
                  m.mine
                    ? { background: TEAL, color: "#FFFFFF", borderRadius: "14px 14px 4px 14px", padding: "10px 14px", maxWidth: "85%" }
                    : { background: "var(--lb-trans)", color: "var(--lb-ink)", border: "1px solid var(--lb-line)", borderRadius: "14px 14px 14px 4px", padding: "10px 14px", maxWidth: "85%" }
                }
              >
                <div style={{ fontFamily: readFont, fontSize: 16.5, lineHeight: 1.7 }}>{m.text}</div>
                {m.trans && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{m.trans}</div>}
              </div>
            </div>
          ))}
          {done && (
            <div style={{ alignSelf: "center", textAlign: "center", background: "var(--lb-active)", borderRadius: 14, padding: "16px 22px", marginTop: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 14.5, color: "var(--lb-teal-ink)" }}>Roleplay selesai 🎉</div>
              <div style={{ fontSize: 13, color: "var(--lb-ink-2)", marginTop: 4 }}>Kamu memakai kosakata &amp; grammar unit ini dalam percakapan.</div>
              <button onClick={restart} style={{ marginTop: 10, padding: "9px 16px", borderRadius: 10, border: "none", background: TEAL, color: "#FFFFFF", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Ulangi</button>
            </div>
          )}
        </div>

        {!done && cur.choices && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10, borderTop: "1px solid var(--lb-line)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--lb-ink-4)" }}>Balas sebagai siswa</div>
            {cur.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => pick(c)}
                className="lb-rp-choice"
                style={{ textAlign: "left", padding: "12px 15px", borderRadius: 12, border: "1.5px solid var(--lb-line)", background: "var(--lb-surface-2)", fontFamily: readFont, fontSize: 16, color: "var(--lb-ink)", cursor: "pointer" }}
              >
                {c.t} <span style={{ fontSize: 12, color: "var(--lb-ink-3)", fontFamily: "inherit" }}>{c.tr}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
