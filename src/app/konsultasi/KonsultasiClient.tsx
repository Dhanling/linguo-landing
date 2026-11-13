"use client";
// [ai-funnel-v1] UI chat Konsultan Linguo. Angka di kartu rencana diambil
// langsung dari hasil tool (event "plan"), bukan dari teks LLM.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowRight, CalendarClock, GraduationCap, Loader2, MessageCircle, RotateCcw, Send, Sparkles, Wallet } from "lucide-react";
import type { LearningPlan } from "@/lib/advisor/plan";
import { trackEvent } from "@/lib/tracking";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Saya mau kerja di Jepang",
  "Mau S2 di Jerman tahun depan",
  "Persiapan IELTS untuk beasiswa",
  "Belajar Korea buat hobi",
];

const GREETING =
  "Halo! Aku Konsultan Linguo. Ceritakan dulu: kamu belajar bahasa untuk apa? Misalnya kerja, kuliah di luar negeri, ujian, atau hobi.";

const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");

function newSessionId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
    );
  }
}

/** Markdown minimal & aman: **tebal**, tautan http(s), daftar "- ". Tanpa innerHTML. */
function renderInline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={`${key}-${i++}`}>{tok.slice(2, -2)}</strong>);
    else
      out.push(
        <a key={`${key}-${i++}`} href={tok} target="_blank" rel="noopener noreferrer" className="text-[#1A9E9E] underline break-all">
          {tok.replace(/^https?:\/\/(www\.)?/, "")}
        </a>,
      );
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((l, i) => {
        const t = l.trim();
        if (!t) return <div key={i} className="h-1" />;
        if (/^[-*•]\s+/.test(t))
          return (
            <div key={i} className="flex gap-2">
              <span className="text-[#1A9E9E]">•</span>
              <span>{renderInline(t.replace(/^[-*•]\s+/, ""), `l${i}`)}</span>
            </div>
          );
        return <p key={i}>{renderInline(t.replace(/^#+\s*/, ""), `l${i}`)}</p>;
      })}
    </div>
  );
}

function PlanCard({ plan, onCta }: { plan: LearningPlan; onCta: (label: string, url: string) => void }) {
  return (
    <div className="rounded-2xl border border-[#1A9E9E]/30 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[#1A9E9E] font-bold mb-3">
        <Sparkles size={18} /> Rencana Belajar {plan.language.name}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4">
        <div className="rounded-xl bg-[#F4FAFA] p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1"><GraduationCap size={14} /> Target</div>
          <div className="font-bold">{plan.start_from} → {plan.target_level}</div>
          {plan.target_exam_equivalent && <div className="text-xs text-slate-500">≈ {plan.target_exam_equivalent}</div>}
        </div>
        <div className="rounded-xl bg-[#F4FAFA] p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1"><CalendarClock size={14} /> Estimasi waktu</div>
          <div className="font-bold">±{plan.estimated_months} bulan</div>
          <div className="text-xs text-slate-500">{plan.total_sessions} sesi · {plan.sessions_per_week} sesi/minggu</div>
        </div>
        <div className="rounded-xl bg-[#F4FAFA] p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1"><Wallet size={14} /> Estimasi biaya</div>
          <div className="font-bold">{plan.estimated_cost_idr ? rp(plan.estimated_cost_idr) : "Per batch"}</div>
          <div className="text-xs text-slate-500">{plan.program}</div>
        </div>
      </div>
      <div className="overflow-x-auto -mx-1 mb-3">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-1 py-1 font-medium">Level</th>
              <th className="px-1 py-1 font-medium">Sublevel</th>
              <th className="px-1 py-1 font-medium">Sesi</th>
              <th className="px-1 py-1 font-medium">Tarif/sesi</th>
            </tr>
          </thead>
          <tbody>
            {plan.stages.map((s) => (
              <tr key={s.level} className="border-t border-slate-100">
                <td className="px-1 py-1.5 font-semibold">
                  {s.level}
                  {s.exam_equivalent && <span className="block text-[11px] font-normal text-slate-500">≈ {s.exam_equivalent}</span>}
                </td>
                <td className="px-1 py-1.5">{s.sublevels[0]}{s.sublevels.length > 1 ? `–${s.sublevels[s.sublevels.length - 1]}` : ""}</td>
                <td className="px-1 py-1.5">{s.sessions}</td>
                <td className="px-1 py-1.5">{s.price_per_session_idr ? rp(s.price_per_session_idr) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 mb-1">{plan.cost_note}</p>
      <p className="text-xs text-slate-400 mb-4">{plan.disclaimer}</p>
      <div className="flex flex-wrap gap-2">
        {plan.next_steps.map((s, i) => (
          <a
            key={s.url}
            href={s.url}
            target={s.url.startsWith("https://linguo.id") ? undefined : "_blank"}
            rel="noopener noreferrer"
            onClick={() => onCta(s.label, s.url)}
            className={
              i === 0
                ? "inline-flex items-center gap-1.5 rounded-full bg-[#1A9E9E] text-white px-4 py-2 text-sm font-semibold hover:bg-[#158585]"
                : "inline-flex items-center gap-1.5 rounded-full border border-[#1A9E9E]/40 text-[#147a7a] px-4 py-2 text-sm font-semibold hover:bg-[#1A9E9E]/5"
            }
          >
            {s.label} <ArrowRight size={14} />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function KonsultasiClient({ waUrl }: { waUrl: string }) {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [planInput, setPlanInput] = useState<Record<string, unknown> | null>(null);
  const [lead, setLead] = useState({ name: "", whatsapp: "", schedule: "", website: "" });
  const [leadState, setLeadState] = useState<"idle" | "saving" | "saved">("idle");
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => setSessionId(newSessionId()), []);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [messages, plan]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || !sessionId) return;
    const history: Msg[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    if (messages.length === 0) trackEvent("advisor_started");
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, messages: [{ role: "assistant", content: GREETING }, ...history] }),
        signal: ctl.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "Gagal menghubungi konsultan");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (!line.trim()) continue;
          let ev: { t: string; v?: unknown; input?: Record<string, unknown> };
          try {
            ev = JSON.parse(line);
          } catch {
            continue;
          }
          if (ev.t === "text" || ev.t === "error") {
            acc += (ev.t === "error" && acc ? "\n\n" : "") + String(ev.v ?? "");
            setMessages([...history, { role: "assistant", content: acc }]);
          } else if (ev.t === "plan") {
            setPlan(ev.v as LearningPlan);
            setPlanInput(ev.input ?? null);
            trackEvent("advisor_plan_generated", { language: (ev.v as LearningPlan).language.name });
          }
        }
      }
      if (!acc) setMessages([...history, { role: "assistant", content: "Maaf, belum ada jawaban. Coba kirim ulang ya." }]);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setMessages([...history, { role: "assistant", content: `${(e as Error).message}. Kamu juga bisa tanya admin: ${waUrl}` }]);
    } finally {
      setBusy(false);
    }
  }

  function onCta(label: string, url: string) {
    trackEvent("advisor_cta_clicked", { label });
    const body = JSON.stringify({ sessionId, event: "advisor_cta_clicked", label, url });
    try {
      if (!navigator.sendBeacon?.("/api/advisor/event", new Blob([body], { type: "application/json" }))) throw 0;
    } catch {
      void fetch("/api/advisor/event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  }

  async function saveLead(e: React.FormEvent) {
    e.preventDefault();
    if (leadState !== "idle") return;
    setLeadState("saving");
    try {
      const res = await fetch("/api/advisor/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, planInput, ...lead }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error || "Gagal menyimpan");
      setLeadState("saved");
      trackEvent("advisor_lead_saved", { language: plan?.language.name });
      toast.success("Terkirim! Admin Linguo akan menghubungimu lewat WhatsApp.");
    } catch (err) {
      setLeadState("idle");
      toast.error((err as Error).message);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setPlan(null);
    setPlanInput(null);
    setLeadState("idle");
    setSessionId(newSessionId());
  }

  return (
    <div className="rounded-3xl bg-white shadow-lg border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <span className="grid place-items-center w-8 h-8 rounded-full bg-[#1A9E9E] text-white"><Sparkles size={16} /></span>
          Konsultan Linguo
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
            <RotateCcw size={13} /> Mulai ulang
          </button>
        )}
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-3 max-h-[65vh] min-h-[320px] overflow-y-auto" aria-live="polite">
        <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#F4FAFA] px-4 py-2.5 text-sm leading-relaxed">{GREETING}</div>
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={!sessionId}
                className="rounded-full border border-[#1A9E9E]/40 text-[#147a7a] px-3 py-1.5 text-sm hover:bg-[#1A9E9E]/5"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[88%] w-fit rounded-2xl rounded-tr-sm bg-[#1A9E9E] text-white px-4 py-2.5 text-sm whitespace-pre-wrap">
              {m.content}
            </div>
          ) : (
            <div key={i} className="max-w-[92%] rounded-2xl rounded-tl-sm bg-[#F4FAFA] px-4 py-2.5 text-sm leading-relaxed">
              {m.content ? <Markdown text={m.content} /> : <Loader2 size={16} className="animate-spin text-[#1A9E9E]" />}
            </div>
          ),
        )}
        {plan && <PlanCard plan={plan} onCta={onCta} />}
        {plan && (
          <form onSubmit={saveLead} className="rounded-2xl border border-slate-200 p-4 space-y-3">
            {leadState === "saved" ? (
              <p className="text-sm text-[#147a7a] font-semibold flex items-center gap-2">
                <MessageCircle size={16} /> Terima kasih! Admin Linguo akan menghubungimu lewat WhatsApp untuk jadwal trial.
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-800">Mau dihubungi admin untuk jadwal trial?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    required
                    value={lead.name}
                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                    placeholder="Nama"
                    maxLength={80}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A9E9E]"
                  />
                  <input
                    required
                    inputMode="tel"
                    value={lead.whatsapp}
                    onChange={(e) => setLead({ ...lead, whatsapp: e.target.value })}
                    placeholder="No. WhatsApp (08…)"
                    maxLength={25}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A9E9E]"
                  />
                </div>
                <input
                  value={lead.schedule}
                  onChange={(e) => setLead({ ...lead, schedule: e.target.value })}
                  placeholder="Waktu belajar yang cocok (opsional), mis. Senin & Rabu malam"
                  maxLength={200}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1A9E9E]"
                />
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={lead.website}
                  onChange={(e) => setLead({ ...lead, website: e.target.value })}
                  className="hidden"
                />
                <button
                  type="submit"
                  disabled={leadState === "saving"}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1A9E9E] text-white px-5 py-2 text-sm font-semibold hover:bg-[#158585] disabled:opacity-60"
                >
                  {leadState === "saving" ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                  Hubungi saya via WhatsApp
                </button>
                <p className="text-[11px] text-slate-400">Data hanya dipakai admin Linguo untuk menghubungimu soal kelas.</p>
              </>
            )}
          </form>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-end gap-2 border-t border-slate-100 p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          maxLength={1500}
          placeholder="Tulis jawabanmu…"
          className="flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1A9E9E] max-h-32"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Kirim"
          className="grid place-items-center w-11 h-11 rounded-full bg-[#1A9E9E] text-white disabled:opacity-50"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
