import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filePath = join(process.cwd(), 'src', 'app', 'corporate', 'page.tsx');
let code = readFileSync(filePath, 'utf-8');

// Replace the form state + handleSubmit + form section
// 1) Replace state declarations
code = code.replace(
  `  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lang, setLang] = useState("");
  const [size, setSize] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    const msg = \`Halo, saya \${name} dari \${company}.\\n\\nSaya tertarik dengan Corporate Language Training dari Linguo.\\n\\nEmail: \${email}\\nTelp: \${phone}\\nBahasa: \${lang}\\nJumlah peserta: \${size}\\nCatatan: \${note}\`;
    window.open(waMsg(msg), "_blank");
  };`,
  `  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: "", industry: "", company_size: "", pic_name: "", pic_title: "",
    pic_email: "", pic_phone: "", languages: [] as string[], participant_count: "",
    training_goal: [] as string[], level: "", budget_range: "", timeline: "", notes: "",
  });
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k: string, val: string) => {
    setForm(f => {
      const arr = (f as any)[k] as string[];
      return { ...f, [k]: arr.includes(val) ? arr.filter((v: string) => v !== val) : [...arr, val] };
    });
  };

  const INDUSTRIES = ["Teknologi & IT", "Keuangan & Perbankan", "Farmasi & Kesehatan", "Manufaktur", "Hospitality & Travel", "Pendidikan", "E-Commerce & Retail", "Konstruksi & Real Estate", "Media & Hiburan", "Pemerintahan", "NGO / Non-Profit", "Lainnya"];
  const LANGUAGES = ["English", "Mandarin", "Japanese", "Korean", "German", "French", "Spanish", "Arabic", "Dutch", "Thai", "Vietnamese", "Turkish", "Russian", "Portuguese", "Italian", "BIPA", "Lainnya"];
  const GOALS = ["Business Communication", "Email & Writing", "Meeting & Presentation", "Negotiation", "Customer Service", "Technical Language", "General Conversation", "IELTS/TOEFL Prep", "Cultural Training"];

  const handleSubmit = async () => {
    if (!form.company_name || !form.pic_name || !form.pic_email) return;
    setSaving(true);
    try {
      // Save to Supabase
      const res = await fetch("/api/corporate-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      // Also send WA
      const msg = \`Halo, saya \${form.pic_name} (\${form.pic_title}) dari \${form.company_name} (\${form.industry}).\\n\\n📋 Kebutuhan Corporate Training:\\n• Bahasa: \${form.languages.join(", ")}\\n• Peserta: \${form.participant_count}\\n• Tujuan: \${form.training_goal.join(", ")}\\n• Budget: \${form.budget_range}\\n• Timeline: \${form.timeline}\\n\\n📧 \${form.pic_email}\\n📱 \${form.pic_phone}\\n\\nCatatan: \${form.notes || "-"}\`;
      window.open(waMsg(msg), "_blank");
      setSubmitted(true);
    } catch (e) {
      // Still open WA even if API fails
      const msg = \`Halo, saya \${form.pic_name} dari \${form.company_name}. Saya tertarik Corporate Training Linguo. Email: \${form.pic_email}, Telp: \${form.pic_phone}\`;
      window.open(waMsg(msg), "_blank");
      setSubmitted(true);
    }
    setSaving(false);
  };`
);

// 2) Replace the FORM SECTION with wizard
code = code.replace(
  `      {/* FORM */}
      <section id="form" className="py-16 sm:py-24 bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8] relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Minta Proposal Gratis</h2>
            <p className="text-white/70 text-sm">Isi form di bawah, tim kami akan menghubungi Anda dalam 1x24 jam kerja.</p>
          </motion.div>
          <motion.div {...fade} className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Lengkap *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Perusahaan *</label>
                <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="PT. Example"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.com"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">No. Telepon *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812-3456-7890"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Bahasa yang Diinginkan</label>
                <select value={lang} onChange={e => setLang(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                  <option value="">Pilih bahasa</option>
                  {["English", "Mandarin", "Japanese", "Korean", "German", "French", "Spanish", "Arabic", "Lainnya"].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jumlah Peserta</label>
                <select value={size} onChange={e => setSize(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                  <option value="">Pilih jumlah</option>
                  {["5-10 orang", "11-20 orang", "21-50 orang", "50+ orang"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Catatan Tambahan</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Jelaskan kebutuhan spesifik tim Anda..."
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors resize-none" />
            </div>
            <button onClick={handleSubmit}
              className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-4 rounded-full transition-all active:scale-[0.98] text-sm">
              Kirim via WhatsApp →
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">Data Anda aman dan tidak akan disebarkan ke pihak lain.</p>
          </motion.div>
        </div>
      </section>`,
  `      {/* FORM — 3-Step Wizard */}
      <section id="form" className="py-16 sm:py-24 bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8] relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto px-4">
          <motion.div {...fade} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Minta Proposal Gratis</h2>
            <p className="text-white/70 text-sm">3 langkah mudah — tim kami akan menghubungi Anda dalam 1×24 jam kerja.</p>
          </motion.div>

          {submitted ? (
            <motion.div {...fade} className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl text-center">
              <div className="h-20 w-20 bg-[#1A9E9E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Terima Kasih!</h3>
              <p className="text-slate-500 text-sm mb-2">Proposal akan kami kirim ke <strong>{form.pic_email}</strong></p>
              <p className="text-slate-400 text-xs">Tim kami juga akan menghubungi via WhatsApp dalam 1×24 jam kerja.</p>
            </motion.div>
          ) : (
            <motion.div {...fade} className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
              {/* Progress */}
              <div className="flex items-center gap-2 mb-6">
                {["Perusahaan", "Kebutuhan", "PIC & Kirim"].map((label, i) => (
                  <div key={i} className="flex-1">
                    <div className={\`h-1.5 rounded-full transition-all \${i <= step ? "bg-[#1A9E9E]" : "bg-slate-200"}\`} />
                    <p className={\`text-[10px] mt-1 text-center font-medium \${i <= step ? "text-[#1A9E9E]" : "text-slate-400"}\`}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Step 1: Company Info */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Perusahaan *</label>
                    <input type="text" value={form.company_name} onChange={e => setF("company_name", e.target.value)} placeholder="PT. Example Indonesia"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Industri *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {INDUSTRIES.map(ind => (
                        <button key={ind} onClick={() => setF("industry", ind)}
                          className={\`px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all text-left \${
                            form.industry === ind ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }\`}>{ind}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Ukuran Perusahaan</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["1-50 karyawan", "50-200 karyawan", "200-500 karyawan", "500+ karyawan"].map(s => (
                        <button key={s} onClick={() => setF("company_size", s)}
                          className={\`px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-all \${
                            form.company_size === s ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }\`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Training Needs */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Bahasa yang Dibutuhkan * (bisa pilih lebih dari 1)</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {LANGUAGES.map(l => (
                        <button key={l} onClick={() => toggleArr("languages", l)}
                          className={\`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all \${
                            form.languages.includes(l) ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }\`}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 block">Tujuan Training (bisa pilih lebih dari 1)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GOALS.map(g => (
                        <button key={g} onClick={() => toggleArr("training_goal", g)}
                          className={\`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all text-left \${
                            form.training_goal.includes(g) ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }\`}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jumlah Peserta</label>
                      <select value={form.participant_count} onChange={e => setF("participant_count", e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                        <option value="">Pilih</option>
                        {["5-10 orang", "11-20 orang", "21-50 orang", "50-100 orang", "100+ orang"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Budget Range</label>
                      <select value={form.budget_range} onChange={e => setF("budget_range", e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                        <option value="">Pilih</option>
                        {["< Rp 5 juta", "Rp 5-15 juta", "Rp 15-50 juta", "Rp 50-100 juta", "> Rp 100 juta", "Belum ditentukan"].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Timeline Mulai</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["Segera", "1 bulan", "2-3 bulan", "Masih survei"].map(t => (
                        <button key={t} onClick={() => setF("timeline", t)}
                          className={\`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all \${
                            form.timeline === t ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E]" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }\`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: PIC & Submit */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama PIC *</label>
                      <input type="text" value={form.pic_name} onChange={e => setF("pic_name", e.target.value)} placeholder="John Doe"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Jabatan</label>
                      <input type="text" value={form.pic_title} onChange={e => setF("pic_title", e.target.value)} placeholder="HR Manager"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email PIC *</label>
                      <input type="email" value={form.pic_email} onChange={e => setF("pic_email", e.target.value)} placeholder="john@company.com"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">No. Telepon PIC *</label>
                      <input type="tel" value={form.pic_phone} onChange={e => setF("pic_phone", e.target.value)} placeholder="0812-3456-7890"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Catatan Tambahan</label>
                    <textarea value={form.notes} onChange={e => setF("notes", e.target.value)} rows={3} placeholder="Jelaskan kebutuhan spesifik tim Anda..."
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors resize-none" />
                  </div>
                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-xs">
                    <p className="font-semibold text-sm text-slate-700 mb-2">📋 Ringkasan</p>
                    <p><span className="text-slate-400">Perusahaan:</span> <span className="font-medium">{form.company_name}</span> · {form.industry} · {form.company_size}</p>
                    <p><span className="text-slate-400">Bahasa:</span> <span className="font-medium">{form.languages.join(", ") || "-"}</span></p>
                    <p><span className="text-slate-400">Tujuan:</span> <span className="font-medium">{form.training_goal.join(", ") || "-"}</span></p>
                    <p><span className="text-slate-400">Peserta:</span> {form.participant_count || "-"} · <span className="text-slate-400">Budget:</span> {form.budget_range || "-"} · <span className="text-slate-400">Timeline:</span> {form.timeline || "-"}</p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className="flex-1 border-2 border-slate-200 text-slate-600 font-semibold py-3.5 rounded-full text-sm hover:border-slate-300 transition-all">
                    ← Kembali
                  </button>
                )}
                {step < 2 ? (
                  <button onClick={() => setStep(s => s + 1)}
                    disabled={step === 0 && (!form.company_name || !form.industry)}
                    className="flex-1 bg-[#1A9E9E] hover:bg-[#178888] disabled:bg-slate-300 text-white font-bold py-3.5 rounded-full transition-all active:scale-[0.98] text-sm">
                    Lanjut →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={saving || !form.pic_name || !form.pic_email}
                    className="flex-1 bg-[#1A9E9E] hover:bg-[#178888] disabled:bg-slate-300 text-white font-bold py-3.5 rounded-full transition-all active:scale-[0.98] text-sm">
                    {saving ? "Mengirim..." : "Kirim Proposal Request →"}
                  </button>
                )}
              </div>
              <p className="text-center text-xs text-slate-400 mt-3">Data Anda aman dan tidak akan disebarkan ke pihak lain.</p>
            </motion.div>
          )}
        </div>
      </section>`
);

writeFileSync(filePath, code);
console.log('✅ Corporate page upgraded:');
console.log('   Step 1: Perusahaan (nama, industri, ukuran)');
console.log('   Step 2: Kebutuhan (bahasa multi-select, tujuan, peserta, budget, timeline)');
console.log('   Step 3: PIC (nama, jabatan, email, telp) + summary + submit');
console.log('   Success state with confirmation message');
console.log('');
console.log('Next: git add -A && git commit -m "feat: B2B corporate wizard form" && git push');
