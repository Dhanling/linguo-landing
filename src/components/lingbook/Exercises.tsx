"use client";

// [lingbook-phase2] Latihan (feedback instan per soal) + Test Yourself (mini-quiz
// + layar hasil). Semua state jawaban di React state, skor dihitung lokal.
import { useEffect, useState } from "react";
import type { Exercise, TestQuestion } from "@/data/lingbook";
import { TEAL } from "./theme";

// ── util style ──
const feedbackBox = (ok: boolean, warn: boolean): React.CSSProperties => ({
  marginTop: 14,
  padding: "12px 14px",
  borderRadius: 12,
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  background: ok ? "#E4F3DF" : warn ? "#FBF0DB" : "#FCE8E4",
  color: ok ? "#3E7D2E" : warn ? "#9A6B14" : "#B04A32",
});

// ── state per soal ──
type ExState = {
  sel?: number;
  done?: boolean;
  ok?: boolean;
  map?: Record<number, number>; // match: leftIdx -> rightIdx
  wrong?: number; // match: rightIdx yang salah (flash)
  picked?: number[]; // order: index kata terpilih
};

const BADGES: Record<Exercise["type"], string> = {
  mc: "PILIHAN GANDA",
  fill: "ISI PARTIKEL",
  match: "MENJODOHKAN",
  order: "SUSUN KALIMAT",
};

function chip(readFont: string): React.CSSProperties {
  return { padding: "9px 16px", borderRadius: 11, border: "1.5px solid var(--lb-line)", background: "var(--lb-surface)", fontFamily: readFont, fontSize: 16, color: "var(--lb-ink)", cursor: "pointer", fontWeight: 600 };
}

function Feedback({ ok, warn, title, text }: { ok: boolean; warn: boolean; title: string; text: string }) {
  return (
    <div style={feedbackBox(ok, warn)}>
      <span style={{ fontSize: 15, flex: "none" }}>{ok ? "✅" : warn ? "⚠️" : "❌"}</span>
      <div>
        <div style={{ fontWeight: 800, fontSize: 13.5 }}>{title}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 2 }}>{text}</div>
      </div>
    </div>
  );
}

function ExerciseCard({
  ex,
  n,
  isCjk,
  readFont,
  onDoneChange,
}: {
  ex: Exercise;
  n: number;
  isCjk: boolean;
  readFont: string;
  onDoneChange: (done: boolean, ok: boolean) => void;
}) {
  const [st, setStRaw] = useState<ExState>({});
  const setSt = (patch: ExState) => setStRaw((prev) => ({ ...prev, ...patch }));

  const done = !!st.done;
  useEffect(() => {
    onDoneChange(!!st.done, !!st.ok);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.done, st.ok]);
  const cardStyle: React.CSSProperties = {
    background: "var(--lb-surface)",
    border: done ? `1.5px solid ${st.ok ? "#9CCB8E" : "#E8B4A5"}` : "1px solid var(--lb-line)",
    borderRadius: 16,
    padding: "18px 20px",
    marginBottom: 14,
  };
  const qStyle: React.CSSProperties = { fontSize: 19, fontWeight: 700, color: "var(--lb-ink)", lineHeight: 1.6, fontFamily: isCjk ? readFont : "inherit" };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--lb-ink-4)" }}>SOAL {n}</span>
        <span style={{ padding: "3px 9px", borderRadius: 999, background: "var(--lb-soft)", color: "var(--lb-ink-3)", fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em" }}>{BADGES[ex.type]}</span>
      </div>

      {"q" in ex && ex.q && <div style={qStyle}>{ex.q}</div>}
      {ex.qTrans && <div style={{ fontSize: 12.5, color: "var(--lb-ink-4)", marginTop: 2, marginBottom: 10 }}>{ex.qTrans}</div>}

      {/* Pilihan ganda / isian partikel */}
      {(ex.type === "mc" || ex.type === "fill") && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {ex.opts.map((op, oi) => {
            const sel = st.sel === oi;
            const style = { ...chip(readFont) };
            if (done && oi === ex.ans) { style.background = "#E4F3DF"; style.borderColor = "#9CCB8E"; }
            else if (done && sel) { style.background = "#FCE8E4"; style.borderColor = "#E8B4A5"; }
            else if (sel) { style.background = "var(--lb-active)"; style.borderColor = TEAL; }
            return (
              <button key={oi} onClick={() => setSt({ sel: oi, done: true, ok: oi === ex.ans })} style={style}>{op}</button>
            );
          })}
        </div>
      )}

      {/* Menjodohkan */}
      {ex.type === "match" && (
        <MatchGrid ex={ex} st={st} setSt={setSt} readFont={readFont} />
      )}

      {/* Susun kalimat (tap-to-order) */}
      {ex.type === "order" && (
        <OrderBuilder ex={ex} st={st} setSt={setSt} readFont={readFont} done={done} />
      )}

      {/* Feedback instan */}
      {done && (ex.type === "mc" || ex.type === "fill") && (
        <Feedback ok={!!st.ok} warn={false} title={st.ok ? "Benar!" : "Belum tepat"} text={ex.expl} />
      )}
      {done && ex.type === "match" && (
        <Feedback ok warn={false} title="Semua cocok!" text="Kata dan arti sudah terjodohkan semua." />
      )}
      {done && ex.type === "order" && (
        <Feedback ok={!!st.ok} warn={false} title={st.ok ? "Benar!" : "Belum tepat"} text={(st.ok ? "" : `Urutan yang benar: ${ex.words.join("")} — `) + ex.expl} />
      )}
    </div>
  );
}

function MatchGrid({ ex, st, setSt, readFont }: { ex: Extract<Exercise, { type: "match" }>; st: ExState; setSt: (p: ExState) => void; readFont: string }) {
  const map = st.map || {};
  const rightOrder = [2, 0, 3, 1].slice(0, ex.pairs.length);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ex.pairs.map((p, li) => {
          const matched = map[li] !== undefined;
          const sel = st.sel === li;
          const style = { ...chip(readFont), textAlign: "center" as const };
          if (matched) { style.background = "#E4F3DF"; style.borderColor = "#9CCB8E"; style.cursor = "default"; }
          else if (sel) { style.background = "var(--lb-active)"; style.borderColor = TEAL; }
          return <button key={li} onClick={() => { if (!matched) setSt({ sel: li }); }} style={style}>{p[0]}</button>;
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rightOrder.map((ri) => {
          const matched = Object.values(map).includes(ri);
          const wrong = st.wrong === ri;
          const style = { ...chip(readFont), fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, textAlign: "center" as const };
          if (matched) { style.background = "#E4F3DF"; style.borderColor = "#9CCB8E"; style.cursor = "default"; }
          if (wrong) { style.background = "#FCE8E4"; style.borderColor = "#E8B4A5"; style.animation = "lbShake .3s"; }
          return (
            <button
              key={ri}
              style={style}
              onClick={() => {
                if (matched || st.sel === undefined || st.sel < 0) return;
                if (st.sel === ri) {
                  const m2 = { ...map, [st.sel]: ri };
                  const allDone = Object.keys(m2).length === ex.pairs.length;
                  setSt({ map: m2, sel: -1, wrong: -1, done: allDone, ok: allDone ? true : st.ok });
                } else {
                  setSt({ wrong: ri });
                  setTimeout(() => setSt({ wrong: -1 }), 400);
                }
              }}
            >
              {ex.pairs[ri][1]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderBuilder({ ex, st, setSt, readFont, done }: { ex: Extract<Exercise, { type: "order" }>; st: ExState; setSt: (p: ExState) => void; readFont: string; done: boolean }) {
  const picked = st.picked || [];
  const canCheck = picked.length === ex.words.length && !done;
  return (
    <>
      <div style={{ minHeight: 52, background: "var(--lb-surface-2)", border: "1.5px dashed var(--lb-line)", borderRadius: 12, padding: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
        {picked.length === 0 && <span style={{ fontSize: 13, color: "#9AB4B1" }}>Tap kata di bawah untuk menyusun kalimat…</span>}
        {picked.map((wi, pi) => (
          <button
            key={pi}
            onClick={() => { if (done) { setSt({ picked: [], done: false, ok: false }); } else setSt({ picked: picked.filter((_, xi) => xi !== pi) }); }}
            style={{ ...chip(readFont), background: "var(--lb-active)", borderColor: TEAL }}
          >
            {ex.words[wi]}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {ex.words.map((w, wi) => (picked.indexOf(wi) >= 0 ? null : (
          <button key={wi} onClick={() => { if (!done) setSt({ picked: picked.concat([wi]) }); }} style={chip(readFont)}>{w}</button>
        )))}
      </div>
      {canCheck && (
        <button
          onClick={() => setSt({ done: true, ok: picked.every((wi, pi) => wi === pi) })}
          style={{ marginTop: 12, padding: "10px 18px", borderRadius: 11, border: "none", background: TEAL, color: "#FFFFFF", fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}
        >
          Periksa
        </button>
      )}
    </>
  );
}

export function LatihanSection({
  exercises,
  isCjk,
  readFont,
}: {
  exercises: Exercise[];
  isCjk: boolean;
  readFont: string;
}) {
  const [doneMap, setDoneMap] = useState<Record<number, boolean>>({});
  const doneN = Object.values(doneMap).filter(Boolean).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--lb-ink)", margin: 0 }}>Latihan</h2>
          <div style={{ fontSize: 13, color: "var(--lb-ink-4)", marginTop: 2 }}>Feedback instan per soal</div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: TEAL }}>{doneN} / {exercises.length} selesai</span>
      </div>
      {exercises.map((ex, i) => (
        <ExerciseCard
          key={i}
          ex={ex}
          n={i + 1}
          isCjk={isCjk}
          readFont={readFont}
          onDoneChange={(done) => setDoneMap((prev) => ({ ...prev, [i]: done }))}
        />
      ))}
    </div>
  );
}

export function TestSection({
  test,
  isCjk,
  readFont,
  onSkip,
  onOpenRoleplay,
}: {
  test: TestQuestion[];
  isCjk: boolean;
  readFont: string;
  onSkip: () => void;
  onOpenRoleplay: () => void;
}) {
  const [ans, setAns] = useState<Record<number, number>>({});
  const [scored, setScored] = useState(false);

  const answered = Object.keys(ans).length;
  const allAnswered = answered === test.length && test.length > 0;
  const correctN = test.filter((tq, i) => ans[i] === tq.ans).length;
  const pct = test.length ? Math.round((correctN / test.length) * 100) : 0;
  const jpUi: React.CSSProperties = isCjk ? { fontFamily: readFont } : {};

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--lb-ink)", margin: "0 0 4px 0" }}>Test Yourself</h2>
      <div style={{ fontSize: 13, color: "var(--lb-ink-4)", marginBottom: 20 }}>Mini-quiz akhir unit — {test.length} soal. Bisa dilewati, tapi akan ditandai.</div>

      {!scored && (
        <>
          {test.map((tq, i) => (
            <div key={i} style={{ background: "var(--lb-surface)", border: "1px solid var(--lb-line)", borderRadius: 16, padding: "18px 20px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--lb-ink-4)", marginBottom: 8 }}>{i + 1} / {test.length}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--lb-ink)", lineHeight: 1.6, ...jpUi }}>{tq.q}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {tq.opts.map((op, oi) => {
                  const sel = ans[i] === oi;
                  const style = { ...chip(readFont) };
                  if (sel) { style.background = "var(--lb-active)"; style.borderColor = TEAL; }
                  return <button key={oi} onClick={() => setAns((prev) => ({ ...prev, [i]: oi }))} style={style}>{op}</button>;
                })}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={() => allAnswered && setScored(true)}
              style={{ flex: 1, padding: 14, borderRadius: 13, border: "none", background: allAnswered ? TEAL : "var(--lb-line)", color: "#FFFFFF", fontFamily: "inherit", fontSize: 14.5, fontWeight: 800, cursor: allAnswered ? "pointer" : "default", boxShadow: allAnswered ? "0 6px 16px rgba(26,158,158,.3)" : "none" }}
            >
              Kumpulkan jawaban
            </button>
            <button onClick={onSkip} style={{ padding: "14px 18px", borderRadius: 13, border: "1px solid var(--lb-line)", background: "var(--lb-surface)", color: "var(--lb-ink-3)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Lewati</button>
          </div>
        </>
      )}

      {scored && (
        <>
          <div style={{ background: "var(--lb-surface)", border: "1px solid var(--lb-line)", borderRadius: 18, padding: 26, textAlign: "center", marginBottom: 16 }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", margin: "0 auto", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800, color: "#FFFFFF", background: pct >= 80 ? TEAL : pct >= 60 ? "#D9A13B" : "#C96F55", animation: "lbCheckPop .45s ease" }}>{pct}%</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--lb-ink)", marginTop: 14 }}>{pct >= 80 ? "Hebat, kamu siap lanjut!" : pct >= 60 ? "Lumayan — masih ada celah" : "Perlu review dulu"}</div>
            <div style={{ fontSize: 13.5, color: "var(--lb-ink-3)", marginTop: 4 }}>{correctN} dari {test.length} soal benar</div>
            <button onClick={() => { setScored(false); setAns({}); }} style={{ marginTop: 14, padding: "10px 18px", borderRadius: 11, border: "1px solid var(--lb-line)", background: "var(--lb-surface)", color: "var(--lb-ink-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Coba lagi</button>
          </div>
          {test.map((tq, i) => {
            const ok = ans[i] === tq.ans;
            return (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--lb-surface)", border: "1px solid var(--lb-line)", borderRadius: 13, padding: "13px 16px", marginBottom: 8 }}>
                <span style={{ fontSize: 14, flex: "none" }}>{ok ? "✅" : "❌"}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--lb-ink)", ...jpUi }}>{tq.q}</div>
                  <div style={{ fontSize: 12.5, color: "var(--lb-ink-3)", marginTop: 2 }}>{ok ? `Benar — ${tq.topic}` : `Jawaban benar: ${tq.opts[tq.ans]} · topik: ${tq.topic}`}</div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Roleplay CTA — scripted (mock). */}
      <div style={{ marginTop: 24, background: "linear-gradient(135deg,#11313A,#1A5B60)", borderRadius: 18, padding: 22, color: "#FFFFFF" }}>
        <div style={{ fontWeight: 800, fontSize: 17 }}>Praktikkan dialog ini</div>
        <div style={{ fontSize: 13.5, color: "#B7D2D0", marginTop: 4, lineHeight: 1.55 }}>Roleplay dengan AI sebagai pelayan kafe — pakai kosakata &amp; grammar unit ini.</div>
        <button onClick={onOpenRoleplay} style={{ marginTop: 14, padding: "12px 20px", borderRadius: 12, border: "none", background: TEAL, color: "#FFFFFF", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>▶ Mulai roleplay</button>
      </div>
    </div>
  );
}
