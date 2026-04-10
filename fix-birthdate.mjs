import { readFileSync, writeFileSync } from "fs";

let code = readFileSync("src/app/onboarding/[token]/page.tsx", "utf8");

// Replace birthdate state
code = code.replace(
  `const [birthdate, setBirthdate] = useState("");`,
  `const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const birthdate = birthYear && birthMonth && birthDay ? \`\${birthYear}-\${birthMonth.padStart(2,"0")}-\${birthDay.padStart(2,"0")}\` : "";`
);

// Replace the date input with 3 dropdowns
code = code.replace(
  `<div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tanggal Lahir</label><input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20" /></div>`,
  `<div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tanggal Lahir</label>
                <div className="flex gap-2">
                  <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="flex-1 px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 bg-white">
                    <option value="">Tgl</option>
                    {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={String(d)}>{d}</option>)}
                  </select>
                  <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="flex-[2] px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 bg-white">
                    <option value="">Bulan</option>
                    {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map((m,i)=><option key={m} value={String(i+1)}>{m}</option>)}
                  </select>
                  <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="flex-1 px-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 bg-white">
                    <option value="">Tahun</option>
                    {Array.from({length:80},(_,i)=>2026-i).map(y=><option key={y} value={String(y)}>{y}</option>)}
                  </select>
                </div>
              </div>`
);

writeFileSync("src/app/onboarding/[token]/page.tsx", code);
console.log("✅ Birthdate changed to Day/Month/Year dropdowns");
