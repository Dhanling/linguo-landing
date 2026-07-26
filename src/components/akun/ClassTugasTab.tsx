'use client';

// [teacher-workspace-v1] Tab Tugas — tempat siswa MENYETOR PR.
//
// Sebelum ini PR cuma kalimat di tengah catatan sesi yang dikirim lewat WhatsApp:
// tidak ada tempat menyetor, tidak ada penilaian balik, dan pengajar tak pernah
// tahu siapa yang mengerjakan. Sekarang PR punya kolomnya sendiri
// (`schedules.homework`, diisi pengajar saat melengkapi sesi) dan setoran masuk
// `homework_submissions` yang dinilai dari dashboard pengajar.
//
// Kalau migrasinya belum jalan (tabel/kolom belum ada), tab ini tampil sebagai
// empty state biasa — bukan error.

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { BookOpen, Upload, Check, Clock, ExternalLink, Loader2, MessageSquare } from 'lucide-react';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export default function ClassTugasTab({ reg, schedules }: { reg: any; schedules: any[] }) {
  const [subs, setSubs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const withHomework = schedules
    .filter((s) => (s.homework || '').trim())
    .sort((a, b) => +new Date(b.scheduled_at) - +new Date(a.scheduled_at));

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('homework_submissions')
      .select('id, schedule_id, content, url, submitted_at, teacher_feedback, reviewed_at')
      .eq('registration_id', reg.id);
    const map: Record<string, any> = {};
    (data || []).forEach((s: any) => { map[s.schedule_id] = s; });
    setSubs(map);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [reg.id]);

  function openForm(scheduleId: string) {
    const cur = subs[scheduleId];
    setOpenId(scheduleId);
    setText(cur?.content || '');
    setLink(cur?.url || '');
    setFile(null);
    setMsg('');
  }

  async function submit(scheduleId: string) {
    if (!text.trim() && !link.trim() && !file) { setMsg('Isi jawaban, tempel link, atau lampirkan file dulu ya.'); return; }
    setSaving(true);
    setMsg('');

    let url = link.trim();
    if (file) {
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `homework/${reg.id}/${scheduleId}-${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from('class-materials').upload(path, file, { upsert: false });
      if (upErr) { setMsg('Gagal upload file: ' + upErr.message); setSaving(false); return; }
      url = supabase.storage.from('class-materials').getPublicUrl(path).data.publicUrl;
    }

    const existing = subs[scheduleId];
    const payload: any = { content: text.trim() || null, url: url || null, submitted_at: new Date().toISOString() };
    const { error } = existing
      ? await supabase.from('homework_submissions').update(payload).eq('id', existing.id)
      : await supabase.from('homework_submissions').insert({
          ...payload,
          schedule_id: scheduleId,
          registration_id: reg.id,
          student_id: reg.student_id,
        });

    setSaving(false);
    if (error) { setMsg('Gagal menyetor: ' + error.message); return; }
    setOpenId(null);
    await load();
  }

  if (loading) return <div className="py-10 text-center text-gray-400">Memuat…</div>;

  if (withHomework.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 py-12 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
        <div className="mt-3 font-semibold text-gray-700">Belum ada tugas</div>
        <div className="mt-1 text-xs text-gray-500">PR yang diberikan pengajar setelah sesi akan muncul di sini, lengkap dengan tempat menyetornya.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {withHomework.map((s) => {
        const sub = subs[s.id];
        const isOpen = openId === s.id;
        return (
          <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">{fmtDate(s.scheduled_at)}</span>
              {sub ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-[#16796E]">
                  <Check className="h-3 w-3" strokeWidth={2.5} /> Sudah disetor
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  <Clock className="h-3 w-3" strokeWidth={2.5} /> Belum disetor
                </span>
              )}
              {sub?.reviewed_at && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                  <MessageSquare className="h-3 w-3" strokeWidth={2.5} /> Sudah dinilai
                </span>
              )}
            </div>

            <p className="mt-2 text-sm font-medium text-gray-900">{s.homework}</p>

            {sub && !isOpen && (
              <div className="mt-3 rounded-xl bg-gray-50 p-3">
                <div className="text-[11px] font-semibold text-gray-500">Setoran kamu · {fmtDate(sub.submitted_at)}</div>
                {sub.content && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{sub.content}</p>}
                {sub.url && (
                  <a href={sub.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#16796E] hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} /> Buka lampiran
                  </a>
                )}
                {sub.teacher_feedback && (
                  <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50 p-2.5">
                    <div className="text-[11px] font-semibold text-purple-700">Penilaian pengajar</div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-purple-900">{sub.teacher_feedback}</p>
                  </div>
                )}
              </div>
            )}

            {isOpen ? (
              <div className="mt-3 space-y-2">
                <textarea
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Tulis jawabanmu di sini…"
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-slate-300"
                />
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="…atau tempel link (Google Docs, Drive, dll)"
                  disabled={!!file}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-slate-300 disabled:bg-gray-50"
                />
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                  <Upload className="h-3.5 w-3.5" strokeWidth={2} /> {file ? file.name : 'Lampirkan file (foto / PDF)'}
                  <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0] || null; setFile(f); if (f) setLink(''); e.target.value = ''; }} />
                </label>
                {msg && <p className="text-xs font-medium text-red-600">{msg}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => submit(s.id)}
                    disabled={saving}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#16796E] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#125f57] disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.5} />}
                    {sub ? 'Perbarui setoran' : 'Setor tugas'}
                  </button>
                  <button onClick={() => setOpenId(null)} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600">Batal</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openForm(s.id)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#16796E] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#125f57]"
              >
                <Upload className="h-4 w-4" strokeWidth={2.5} /> {sub ? 'Perbarui setoran' : 'Setor tugas'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
