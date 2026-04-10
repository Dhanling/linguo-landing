#!/bin/bash
cd ~/linguo-landing

cat > "src/app/onboarding/[token]/page.tsx" << 'ENDOFFILE'
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const PROVINCE_CITIES: Record<string, string[]> = {
  "Aceh": ["Banda Aceh","Langsa","Lhokseumawe","Sabang","Subulussalam","Aceh Barat","Aceh Besar","Aceh Jaya","Aceh Selatan","Aceh Tamiang","Aceh Tengah","Aceh Tenggara","Aceh Timur","Aceh Utara","Bener Meriah","Bireuen","Gayo Lues","Nagan Raya","Pidie","Pidie Jaya","Simeulue"],
  "Bali": ["Denpasar","Badung","Bangli","Buleleng","Gianyar","Jembrana","Karangasem","Klungkung","Tabanan"],
  "Banten": ["Cilegon","Serang","Tangerang","Tangerang Selatan","Lebak","Pandeglang"],
  "Bengkulu": ["Bengkulu","Bengkulu Selatan","Bengkulu Tengah","Bengkulu Utara","Kaur","Kepahiang","Lebong","Mukomuko","Rejang Lebong","Seluma"],
  "DI Yogyakarta": ["Yogyakarta","Bantul","Gunung Kidul","Kulon Progo","Sleman"],
  "DKI Jakarta": ["Jakarta Barat","Jakarta Pusat","Jakarta Selatan","Jakarta Timur","Jakarta Utara","Kepulauan Seribu"],
  "Gorontalo": ["Gorontalo","Boalemo","Bone Bolango","Gorontalo Utara","Pohuwato"],
  "Jambi": ["Jambi","Batanghari","Bungo","Kerinci","Merangin","Muaro Jambi","Sarolangun","Sungai Penuh","Tanjung Jabung Barat","Tanjung Jabung Timur","Tebo"],
  "Jawa Barat": ["Bandung","Bandung Barat","Bekasi","Bogor","Ciamis","Cianjur","Cimahi","Cirebon","Depok","Garut","Indramayu","Karawang","Kuningan","Majalengka","Pangandaran","Purwakarta","Subang","Sukabumi","Sumedang","Tasikmalaya"],
  "Jawa Tengah": ["Semarang","Banjarnegara","Banyumas","Batang","Blora","Boyolali","Brebes","Cilacap","Demak","Grobogan","Jepara","Karanganyar","Kebumen","Kendal","Klaten","Kudus","Magelang","Pati","Pekalongan","Pemalang","Purbalingga","Purworejo","Rembang","Salatiga","Solo","Sragen","Sukoharjo","Tegal","Temanggung","Wonogiri","Wonosobo"],
  "Jawa Timur": ["Surabaya","Bangkalan","Banyuwangi","Batu","Blitar","Bojonegoro","Bondowoso","Gresik","Jember","Jombang","Kediri","Lamongan","Lumajang","Madiun","Magetan","Malang","Mojokerto","Nganjuk","Ngawi","Pacitan","Pamekasan","Pasuruan","Ponorogo","Probolinggo","Sampang","Sidoarjo","Situbondo","Sumenep","Trenggalek","Tuban","Tulungagung"],
  "Kalimantan Barat": ["Pontianak","Bengkayang","Kapuas Hulu","Kayong Utara","Ketapang","Kubu Raya","Landak","Melawi","Mempawah","Sambas","Sanggau","Sekadau","Singkawang","Sintang"],
  "Kalimantan Selatan": ["Banjarmasin","Banjarbaru","Balangan","Barito Kuala","Hulu Sungai Selatan","Hulu Sungai Tengah","Hulu Sungai Utara","Kotabaru","Tabalong","Tanah Bumbu","Tanah Laut","Tapin"],
  "Kalimantan Tengah": ["Palangkaraya","Barito Selatan","Barito Timur","Barito Utara","Gunung Mas","Kapuas","Katingan","Kotawaringin Barat","Kotawaringin Timur","Lamandau","Murung Raya","Pulang Pisau","Seruyan","Sukamara"],
  "Kalimantan Timur": ["Samarinda","Balikpapan","Bontang","Berau","Kutai Barat","Kutai Kartanegara","Kutai Timur","Mahakam Ulu","Paser","Penajam Paser Utara"],
  "Kalimantan Utara": ["Tarakan","Bulungan","Malinau","Nunukan","Tana Tidung"],
  "Kepulauan Bangka Belitung": ["Pangkalpinang","Bangka","Bangka Barat","Bangka Selatan","Bangka Tengah","Belitung","Belitung Timur"],
  "Kepulauan Riau": ["Batam","Tanjungpinang","Bintan","Karimun","Kepulauan Anambas","Lingga","Natuna"],
  "Lampung": ["Bandar Lampung","Metro","Lampung Barat","Lampung Selatan","Lampung Tengah","Lampung Timur","Lampung Utara","Mesuji","Pesawaran","Pesisir Barat","Pringsewu","Tanggamus","Tulang Bawang","Tulang Bawang Barat","Way Kanan"],
  "Maluku": ["Ambon","Tual","Buru","Buru Selatan","Kepulauan Aru","Maluku Barat Daya","Maluku Tengah","Maluku Tenggara","Seram Bagian Barat","Seram Bagian Timur"],
  "Maluku Utara": ["Ternate","Tidore Kepulauan","Halmahera Barat","Halmahera Selatan","Halmahera Tengah","Halmahera Timur","Halmahera Utara","Kepulauan Sula","Pulau Morotai","Pulau Taliabu"],
  "Nusa Tenggara Barat": ["Mataram","Bima","Dompu","Lombok Barat","Lombok Tengah","Lombok Timur","Lombok Utara","Sumbawa","Sumbawa Barat"],
  "Nusa Tenggara Timur": ["Kupang","Alor","Belu","Ende","Flores Timur","Lembata","Manggarai","Manggarai Barat","Manggarai Timur","Nagekeo","Ngada","Rote Ndao","Sabu Raijua","Sikka","Sumba Barat","Sumba Barat Daya","Sumba Tengah","Sumba Timur","Timor Tengah Selatan","Timor Tengah Utara"],
  "Papua": ["Jayapura","Biak Numfor","Keerom","Kepulauan Yapen","Mamberamo Raya","Sarmi","Supiori","Waropen"],
  "Papua Barat": ["Manokwari","Fakfak","Kaimana","Manokwari Selatan","Pegunungan Arfak","Sorong","Sorong Selatan","Teluk Bintuni","Teluk Wondama"],
  "Papua Barat Daya": ["Sorong","Maybrat","Raja Ampat","Tambrauw"],
  "Papua Pegunungan": ["Jayawijaya","Lanny Jaya","Nduga","Pegunungan Bintang","Tolikara","Yalimo","Yahukimo"],
  "Papua Selatan": ["Merauke","Asmat","Boven Digoel","Mappi"],
  "Papua Tengah": ["Nabire","Deiyai","Dogiyai","Intan Jaya","Mimika","Paniai","Puncak","Puncak Jaya"],
  "Riau": ["Pekanbaru","Dumai","Bengkalis","Indragiri Hilir","Indragiri Hulu","Kampar","Kepulauan Meranti","Kuantan Singingi","Pelalawan","Rokan Hilir","Rokan Hulu","Siak"],
  "Sulawesi Barat": ["Mamuju","Majene","Mamasa","Mamuju Tengah","Pasangkayu","Polewali Mandar"],
  "Sulawesi Selatan": ["Makassar","Palopo","Parepare","Bantaeng","Barru","Bone","Bulukumba","Enrekang","Gowa","Jeneponto","Kepulauan Selayar","Luwu","Luwu Timur","Luwu Utara","Maros","Pangkajene dan Kepulauan","Pinrang","Sidenreng Rappang","Sinjai","Soppeng","Takalar","Tana Toraja","Toraja Utara","Wajo"],
  "Sulawesi Tengah": ["Palu","Banggai","Banggai Kepulauan","Banggai Laut","Buol","Donggala","Morowali","Morowali Utara","Parigi Moutong","Poso","Sigi","Tojo Una-Una","Toli-Toli"],
  "Sulawesi Tenggara": ["Kendari","Bau-Bau","Bombana","Buton","Buton Selatan","Buton Tengah","Buton Utara","Kolaka","Kolaka Timur","Kolaka Utara","Konawe","Konawe Kepulauan","Konawe Selatan","Konawe Utara","Muna","Muna Barat","Wakatobi"],
  "Sulawesi Utara": ["Manado","Bitung","Kotamobagu","Tomohon","Bolaang Mongondow","Bolaang Mongondow Selatan","Bolaang Mongondow Timur","Bolaang Mongondow Utara","Kepulauan Sangihe","Kepulauan Siau Tagulandang Biaro","Kepulauan Talaud","Minahasa","Minahasa Selatan","Minahasa Tenggara","Minahasa Utara"],
  "Sumatera Barat": ["Padang","Bukittinggi","Padang Panjang","Pariaman","Payakumbuh","Sawahlunto","Solok","Agam","Dharmasraya","Kepulauan Mentawai","Lima Puluh Kota","Padang Pariaman","Pasaman","Pasaman Barat","Pesisir Selatan","Sijunjung","Tanah Datar"],
  "Sumatera Selatan": ["Palembang","Lubuklinggau","Pagar Alam","Prabumulih","Banyuasin","Empat Lawang","Lahat","Muara Enim","Musi Banyuasin","Musi Rawas","Musi Rawas Utara","Ogan Ilir","Ogan Komering Ilir","Ogan Komering Ulu","Ogan Komering Ulu Selatan","Ogan Komering Ulu Timur","Penukal Abab Lematang Ilir"],
  "Sumatera Utara": ["Medan","Binjai","Gunungsitoli","Padangsidimpuan","Pematangsiantar","Sibolga","Tanjungbalai","Tebing Tinggi","Asahan","Batu Bara","Dairi","Deli Serdang","Humbang Hasundutan","Karo","Labuhanbatu","Labuhanbatu Selatan","Labuhanbatu Utara","Langkat","Mandailing Natal","Nias","Nias Barat","Nias Selatan","Nias Utara","Padang Lawas","Padang Lawas Utara","Pakpak Bharat","Samosir","Serdang Bedagai","Simalungun","Tapanuli Selatan","Tapanuli Tengah","Tapanuli Utara","Toba"],
};
const PROVINCES = Object.keys(PROVINCE_CITIES);

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada",
  "Chile","China","Colombia","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Fiji","Finland","France","Gabon",
  "Georgia","Germany","Ghana","Greece","Guatemala","Guinea","Guyana","Haiti","Honduras","Hong Kong",
  "Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Libya","Lithuania","Luxembourg",
  "Macau","Madagascar","Malaysia","Maldives","Mali","Malta","Mexico","Moldova","Monaco","Mongolia","Montenegro",
  "Morocco","Mozambique","Myanmar","Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Nigeria","North Macedonia",
  "Norway","Oman","Pakistan","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland",
  "Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia",
  "Slovenia","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden",
  "Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Trinidad and Tobago","Tunisia","Turkey",
  "Turkmenistan","UAE","Uganda","Ukraine","United Kingdom","United States","Uruguay","Uzbekistan","Venezuela",
  "Vietnam","Yemen","Zambia","Zimbabwe","Lainnya"
];

const SCHEDULES = [
  "Senin pagi (08-12)","Senin siang (12-17)","Senin malam (17-21)",
  "Selasa pagi (08-12)","Selasa siang (12-17)","Selasa malam (17-21)",
  "Rabu pagi (08-12)","Rabu siang (12-17)","Rabu malam (17-21)",
  "Kamis pagi (08-12)","Kamis siang (12-17)","Kamis malam (17-21)",
  "Jumat pagi (08-12)","Jumat siang (12-17)","Jumat malam (17-21)",
  "Sabtu pagi (08-12)","Sabtu siang (12-17)","Sabtu malam (17-21)",
  "Minggu pagi (08-12)","Minggu siang (12-17)","Minggu malam (17-21)",
];

const EXPERIENCE_OPTIONS = [
  { id: "none", label: "Belum pernah sama sekali", icon: "\u{1F331}" },
  { id: "self", label: "Belajar sendiri (YouTube, app)", icon: "\u{1F4F1}" },
  { id: "course", label: "Pernah kursus sebelumnya", icon: "\u{1F4DA}" },
  { id: "school", label: "Belajar di sekolah/kuliah", icon: "\u{1F393}" },
  { id: "lived", label: "Pernah tinggal di negara tersebut", icon: "\u{2708}\u{FE0F}" },
];

const GOALS = [
  { id: "travel", label: "Traveling", icon: "\u{1F30D}" },
  { id: "work", label: "Karir / Kerja", icon: "\u{1F4BC}" },
  { id: "study", label: "Studi ke luar negeri", icon: "\u{1F393}" },
  { id: "hobby", label: "Hobi / Interest", icon: "\u{2764}\u{FE0F}" },
  { id: "family", label: "Keluarga / Pasangan", icon: "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}" },
  { id: "other", label: "Lainnya", icon: "\u{2728}" },
];

const PROGRAM_LABELS: Record<string, string> = {
  "private": "Kelas Private", "reguler": "Kelas Reguler", "ielts-toefl": "IELTS/TOEFL Prep",
  "Kelas Private": "Kelas Private", "Kelas Reguler": "Kelas Reguler", "IELTS/TOEFL Prep": "IELTS/TOEFL Prep",
};

type LeadData = { name: string; email: string; wa_number: string; language: string; program: string; level: string; onboarding_completed: boolean; };

function SearchDropdown({ options, value, onChange, placeholder }: { options: string[]; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full px-4 py-3 rounded-xl border text-sm text-left focus:outline-none transition-all flex items-center justify-between ${open ? "border-[#1A9E9E] ring-2 ring-[#1A9E9E]/20" : "border-slate-200"} ${value ? "text-slate-900" : "text-slate-400"}`}>
        {value || placeholder}
        <svg className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl max-h-64 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input type="text" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E]" />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Tidak ditemukan</p>}
            {filtered.map(o => (
              <button key={o} onClick={() => { onChange(o); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${o === value ? "bg-[#1A9E9E]/10 text-[#1A9E9E] font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />}
    </div>
  );
}

export default function OnboardingPage() {
  const params = useParams();
  const token = params.token as string;
  const [lead, setLead] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [birthdate, setBirthdate] = useState("");
  const [livesInIndonesia, setLivesInIndonesia] = useState<boolean | null>(null);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [cityAbroad, setCityAbroad] = useState("");
  const [experience, setExperience] = useState("");
  const [goal, setGoal] = useState("");
  const [schedules, setSchedules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/onboarding?token=${token}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((d) => { setLead(d); if (d.onboarding_completed) setAlreadyDone(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleSchedule = (s: string) => setSchedules((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  const getDomicile = () => livesInIndonesia ? `${city}, ${province}, Indonesia` : `${cityAbroad}, ${country}`;

  const handleSubmit = async () => {
    if (schedules.length === 0) { setError("Pilih minimal 1 jadwal"); return; }
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, birthdate, domicile: getDomicile(), reason: goal, experience, schedule_preference: schedules.join(", "), learning_goal: goal }),
      });
      if (res.ok) setDone(true); else setError("Gagal menyimpan. Coba lagi.");
    } catch { setError("Terjadi kesalahan. Coba lagi."); }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white">
      <div className="text-center"><div className="h-10 w-10 border-3 border-[#1A9E9E] border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-500 text-sm">Memuat data...</p></div>
    </div>
  );
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <div className="text-center max-w-md"><span className="text-5xl block mb-4">{"\u{1F50D}"}</span><h1 className="text-2xl font-bold mb-2">Link tidak valid</h1><p className="text-slate-500 mb-6">Link onboarding ini tidak ditemukan atau sudah kadaluarsa.</p><a href="https://wa.me/6282116859493" target="_blank" className="text-[#1A9E9E] font-semibold hover:underline">Hubungi kami via WhatsApp</a></div>
    </div>
  );
  if (alreadyDone || done) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4">
      <div className="text-center max-w-md"><span className="text-5xl block mb-4">{"\u{1F389}"}</span><h1 className="text-2xl font-bold text-slate-900 mb-2">{done ? "Data berhasil disimpan!" : "Data kamu sudah lengkap!"}</h1><p className="text-slate-500 mb-6">Tim Linguo akan segera menghubungi kamu via WhatsApp untuk mulai kelas.</p>
        <div className="flex flex-col gap-3"><a href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20sudah%20lengkapi%20data%20onboarding" target="_blank" className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition inline-block">Chat WhatsApp</a><a href="/" className="text-[#1A9E9E] hover:underline text-sm">Kembali ke halaman utama</a></div>
      </div>
    </div>
  );

  const programLabel = PROGRAM_LABELS[lead?.program || ""] || lead?.program;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30">
      <div className="bg-white border-b border-slate-100"><div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between"><img src="/images/logo-white.png" alt="Linguo" className="h-10 brightness-0" /><span className="text-xs text-slate-400">Onboarding Form</span></div></div>
      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Hai {lead?.name?.split(" ")[0]}! {"\u{1F44B}"}</h1>
          <p className="text-slate-500 text-sm">Lengkapi data di bawah supaya kami bisa siapkan kelas terbaik untukmu.</p>
          <div className="flex items-center gap-2 mt-3 bg-[#1A9E9E]/5 rounded-xl px-4 py-2.5 text-xs">
            <span className="font-medium text-[#1A9E9E]">{lead?.language}</span><span className="text-slate-300">{"\u{2022}"}</span><span className="text-slate-600">{programLabel}</span><span className="text-slate-300">{"\u{2022}"}</span><span className="text-slate-600">Level {lead?.level}</span>
          </div>
        </div>
        <div className="flex gap-1.5 mb-8">{Array.from({ length: totalSteps }).map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < step ? "bg-[#1A9E9E]" : "bg-slate-200"}`} />))}</div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div><h2 className="text-lg font-bold text-slate-900 mb-1">Data Pribadi</h2><p className="text-sm text-slate-500">Bantu kami mengenal kamu lebih dekat</p></div>
              <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tanggal Lahir</label><input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20" /></div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Kamu tinggal di mana?</label>
                <div className="flex gap-3">
                  <button onClick={() => { setLivesInIndonesia(true); setCountry(""); setCityAbroad(""); }} className={`flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 text-sm transition-all ${livesInIndonesia === true ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E] font-medium" : "border-slate-100 text-slate-600 hover:border-slate-200"}`}><span className="text-2xl">{"\u{1F1EE}\u{1F1E9}"}</span>Indonesia</button>
                  <button onClick={() => { setLivesInIndonesia(false); setProvince(""); setCity(""); }} className={`flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 text-sm transition-all ${livesInIndonesia === false ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E] font-medium" : "border-slate-100 text-slate-600 hover:border-slate-200"}`}><span className="text-2xl">{"\u{1F30D}"}</span>Luar Indonesia</button>
                </div>
              </div>
              {livesInIndonesia === true && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Provinsi</label><SearchDropdown options={PROVINCES} value={province} onChange={(v) => { setProvince(v); setCity(""); }} placeholder="Pilih provinsi..." /></div>
                  {province && (<div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Kota / Kabupaten</label><SearchDropdown options={PROVINCE_CITIES[province] || []} value={city} onChange={setCity} placeholder="Pilih kota..." /></div>)}
                </motion.div>
              )}
              {livesInIndonesia === false && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Negara</label><SearchDropdown options={COUNTRIES} value={country} onChange={setCountry} placeholder="Pilih negara..." /></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Kota</label><input type="text" placeholder="contoh: Singapore, Tokyo, Dubai" value={cityAbroad} onChange={(e) => setCityAbroad(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20" /></div>
                </motion.div>
              )}
              <button onClick={() => { if (!birthdate) { setError("Masukkan tanggal lahir"); return; } if (livesInIndonesia === null) { setError("Pilih lokasi tinggal"); return; } if (livesInIndonesia && (!province || !city)) { setError("Lengkapi provinsi dan kota"); return; } if (!livesInIndonesia && (!country || !cityAbroad.trim())) { setError("Lengkapi negara dan kota"); return; } setError(""); setStep(2); }} className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">Lanjut →</button>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div><button onClick={() => setStep(1)} className="text-sm text-[#1A9E9E] font-medium mb-2 hover:underline">{"\u{2190}"} Kembali</button><h2 className="text-lg font-bold text-slate-900 mb-1">Pengalaman Belajar</h2><p className="text-sm text-slate-500">Seberapa familiar kamu dengan bahasa {lead?.language}?</p></div>
              <div className="space-y-2.5">{EXPERIENCE_OPTIONS.map((opt) => (<button key={opt.id} onClick={() => setExperience(opt.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left text-sm transition-all ${experience === opt.id ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E] font-medium" : "border-slate-100 text-slate-600 hover:border-slate-200"}`}><span className="text-xl">{opt.icon}</span>{opt.label}</button>))}</div>
              <button onClick={() => { if (!experience) { setError("Pilih salah satu"); return; } setError(""); setStep(3); }} className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">Lanjut →</button>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div><button onClick={() => setStep(2)} className="text-sm text-[#1A9E9E] font-medium mb-2 hover:underline">{"\u{2190}"} Kembali</button><h2 className="text-lg font-bold text-slate-900 mb-1">Tujuan Belajar</h2><p className="text-sm text-slate-500">Kenapa kamu tertarik belajar bahasa {lead?.language}?</p></div>
              <div className="grid grid-cols-2 gap-2.5">{GOALS.map((g) => (<button key={g.id} onClick={() => setGoal(g.id)} className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 text-sm transition-all ${goal === g.id ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E] font-medium" : "border-slate-100 text-slate-600 hover:border-slate-200"}`}><span className="text-2xl">{g.icon}</span>{g.label}</button>))}</div>
              <button onClick={() => { if (!goal) { setError("Pilih tujuan belajar"); return; } setError(""); setStep(4); }} className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">Lanjut →</button>
            </motion.div>
          )}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <button onClick={() => setStep(3)} className="text-sm text-[#1A9E9E] font-medium mb-2 hover:underline">{"\u{2190}"} Kembali</button>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Preferensi Jadwal</h2>
                <p className="text-sm text-slate-500">Pilih waktu yang kamu mau (boleh lebih dari 1)</p>
                {livesInIndonesia === false && <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">Jadwal di bawah menggunakan zona waktu WIB (GMT+7)</p>}
              </div>
              <div className="space-y-1">
                {["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"].map((day) => (
                  <div key={day}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-3 mb-1.5">{day}</p>
                    <div className="flex gap-2">
                      {SCHEDULES.filter((s) => s.startsWith(day)).map((s) => {
                        const time = s.match(/\((.+)\)/)?.[1] || "";
                        const label = s.includes("pagi") ? "Pagi" : s.includes("siang") ? "Siang" : "Malam";
                        return (<button key={s} onClick={() => toggleSchedule(s)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${schedules.includes(s) ? "bg-[#1A9E9E] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{label}<br /><span className="text-[10px] opacity-75">{time}</span></button>);
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleSubmit} disabled={saving} className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-slate-900 font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg mt-4">{saving ? "Menyimpan..." : "Kirim Data \u{2192}"}</button>
            </motion.div>
          )}
        </AnimatePresence>
        {error && <p className="text-red-500 text-xs mt-3 text-center">{error}</p>}
      </div>
    </div>
  );
}
ENDOFFILE

echo "✅ Onboarding page completely rewritten!"
