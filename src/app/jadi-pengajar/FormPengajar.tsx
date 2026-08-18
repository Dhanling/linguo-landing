"use client";

/* [pengajar-form-en-v1] Halaman pendaftaran pengajar, dua bahasa.
 *
 * Isinya dipakai dua rute: /jadi-pengajar (Indonesia) dan /jadi-pengajar/en
 * (Inggris). Bukan satu halaman dengan tombol ganti bahasa saja: link inilah
 * yang dikirim tim ke calon pengajar, dan native teacher yang menerima
 * /jadi-pengajar/en harus mendarat langsung di halaman yang bisa ia baca —
 * bukan di halaman berbahasa Indonesia yang menuntutnya mencari tombol dulu.
 * Rute terpisah juga berarti judul & deskripsi mesin pencarinya ikut Inggris.
 *
 * Semua teks yang dilihat pengguna ada di `T` di bawah. Menambah kalimat baru
 * = menambah entri di KEDUA bahasa; TypeScript yang menagihnya, karena bentuk
 * `T.id` dan `T.en` harus sama.
 *
 * Domisili: daftar provinsi Indonesia tetap dipakai, ditambah satu pilihan
 * "Di luar Indonesia" — tanpa itu native teacher yang tinggal di luar negeri
 * tidak bisa melewati langkah 1 sama sekali. Kalau dipilih, kolom kota berubah
 * jadi isian bebas (nama kota + negaranya). */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { WILAYAH_ID } from "@/lib/wilayah-id";
import { languages, regionLabels } from "@/data/curriculum/languages";
import {
  Video, Users, Repeat,
  Smile, Ban, Baby, Backpack,
  GraduationCap, Award, Link2, AlertCircle,
  X, Loader2, CheckCircle2, Search, Check, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";

const WA = "https://wa.me/6282130113243";
const waMsg = (msg: string) => `${WA}?text=${encodeURIComponent(msg)}`;

export type Lang = "id" | "en";

/* Foto & jumlah sesi tidak diterjemahkan — kutipannya yang dwibahasa. */
const TEACHER_PHOTOS = [
  { name: "Febri Darusman", role: "Spanish & Thai Teacher", img: "/images/teachers/teacher-febri.png", sessions: 850 },
  { name: "Nitalia Wijaya", role: "Korean & English Teacher", img: "/images/teachers/teacher-nitalia.png", sessions: 1200 },
  { name: "Angga", role: "Chinese & Korean Teacher", img: "/images/teachers/teacher-angga.png", sessions: 680 },
];

/* Nilai yang TERSIMPAN ke database sengaja tetap satu bahasa (Indonesia) —
   dashboard staf membaca kolom `experience` apa adanya, dan dua ejaan untuk
   jawaban yang sama membuat filter & rekapnya pecah. Yang diterjemahkan cuma
   labelnya di layar. */
const EXP_VALUES = [
  "Belum pernah (tapi mau belajar)",
  "< 1 tahun",
  "1-3 tahun",
  "3-5 tahun",
  "5+ tahun",
] as const;

/** Penanda domisili luar negeri di dropdown provinsi. Bukan nama provinsi mana
 *  pun, jadi tidak bisa bentrok dengan isi WILAYAH_ID. */
const LUAR_NEGERI = "__abroad__";

const T = {
  id: {
    switchLabel: "English",
    switchHref: "/jadi-pengajar/en",
    contactUs: "Hubungi Kami",
    waHello: "Halo, saya tertarik menjadi pengajar di Linguo",
    waAsk: "Halo, saya mau tanya dulu tentang jadi pengajar di Linguo",
    heroBadge: "Bergabung Bersama Kami",
    heroTitleA: "Jadi Pengajar Bahasa",
    heroTitleB: "di",
    heroDesc: "Bagikan keahlian bahasa kamu dan dapatkan penghasilan fleksibel. Mengajar online dari mana saja, kapan saja.",
    ctaRegister: "Daftar Sekarang →",
    ctaAskWa: "Tanya Dulu via WA",
    stats: ["Bahasa", "Siswa Aktif", "Pengajar", "Fee/Sesi"],
    earnEyebrow: "Simulasi Penghasilan",
    earnTitle: "Berapa yang Bisa Kamu Dapatkan?",
    earnCards: [
      { sesi: "5 sesi/minggu", monthly: "Rp 1.200.000", label: "Part-time ringan" },
      { sesi: "10 sesi/minggu", monthly: "Rp 2.400.000", label: "Part-time aktif" },
      { sesi: "20 sesi/minggu", monthly: "Rp 4.800.000", label: "Full-time" },
    ],
    earnPer: "/bulan",
    earnNote: "*Berdasarkan fee Rp 60.000/sesi, 4 minggu/bulan",
    benefitEyebrow: "Kenapa Mengajar di Linguo?",
    benefitTitle: "Keuntungan Jadi Pengajar",
    benefits: [
      { icon: "💰", title: "Penghasilan Fleksibel", desc: "Fee per sesi yang kompetitif — semakin banyak mengajar, semakin besar penghasilan" },
      { icon: "🕐", title: "Atur Jadwal Sendiri", desc: "Tentukan hari dan jam mengajar sesuai availability kamu" },
      { icon: "🏠", title: "Kerja dari Mana Saja", desc: "100% online via Zoom — dari rumah, kafe, atau mana pun" },
      { icon: "📈", title: "Berkembang Bersama", desc: "Pelatihan rutin, feedback siswa, dan kesempatan mengajar berbagai level" },
      { icon: "🌍", title: "Komunitas Polyglot", desc: "Bergabung dengan komunitas pengajar bahasa dari berbagai latar belakang" },
      { icon: "📜", title: "Sertifikat Mengajar", desc: "Dapatkan sertifikat pengajar resmi dari Linguo.id" },
    ],
    tierEyebrow: "Dua Jalur Mengajar",
    tierTitle: "Pilih Sesuai Kualifikasi Kamu",
    tierProTitle: "Pengajar Profesional",
    tierProSub: "Professional Teacher",
    tierProItems: [
      "S1 Bahasa/Sastra/Pendidikan",
      "Sertifikat bahasa (JLPT, TOPIK, DELF, IELTS, dll)",
      "Pengalaman mengajar 1+ tahun",
      "Bisa mengajar semua level (A1–B2)",
    ],
    tierProBadge: "Fee lebih tinggi • Badge Profesional",
    tierComTitle: "Pengajar Komunitas",
    tierComSub: "Community Tutor",
    tierComItems: [
      "Fasih di bahasa target (minimal B2)",
      "Mahasiswa aktif / lulusan S1 (semua jurusan)",
      "Passionate & sabar mengajar",
      "Bisa upgrade ke Profesional nanti",
    ],
    tierComBadge: "Cocok untuk pemula • Bisa upgrade",
    testiEyebrow: "Cerita Pengajar",
    testiTitle: "Apa Kata Mereka?",
    testiQuotes: [
      "Mengajar di Linguo memberi saya fleksibilitas waktu dan penghasilan tambahan yang stabil. Sistem-nya terstruktur dan mudah diikuti.",
      "Saya bisa mengajar dari rumah sambil mengurus keluarga. Siswa-siswanya antusias dan bikin semangat mengajar!",
      "Platform yang profesional dan supportive. Tim Linguo selalu bantu kalau ada kendala. Recommended!",
    ],
    testiSessions: (n: number) => `${n.toLocaleString("id-ID")} sesi`,
    howEyebrow: "Prosesnya Mudah",
    howTitle: "4 Langkah Bergabung",
    howSteps: [
      { num: "01", title: "Isi Form Online", desc: "Lengkapi data diri, bahasa, dan pengalaman kamu" },
      { num: "02", title: "Review & Interview", desc: "Tim kami review profil dan undang interview singkat" },
      { num: "03", title: "Onboarding", desc: "Orientasi metode mengajar dan sistem Linguo" },
      { num: "04", title: "Mulai Mengajar!", desc: "Set jadwal dan mulai terima siswa" },
    ],
    finalTitle: "Siap Bergabung?",
    finalDesc: "Proses pendaftaran hanya 5 menit. Isi form, kami review, dan kamu bisa mulai mengajar!",
    footerLegal: "PT. Linguo Edu Indonesia",
    // — wizard —
    wizardTitle: "Pendaftaran Pengajar",
    back: "Kembali",
    prev: "Sebelumnya",
    stepOf: (n: number) => `Step ${n}/4`,
    next: "Lanjut →",
    sending: "Mengirim...",
    submit: "Kirim Pendaftaran →",
    steps: [
      { num: 1, title: "Data Diri", desc: "Info kontak kamu" },
      { num: 2, title: "Bahasa & Kualifikasi", desc: "Keahlian bahasa" },
      { num: 3, title: "Pengalaman", desc: "Latar belakang" },
      { num: 4, title: "Review & Kirim", desc: "Periksa data" },
    ],
    s1Title: "Data Diri",
    s1Desc: "Isi info kontak kamu untuk proses pendaftaran",
    fullName: "Nama Lengkap *",
    fullNamePh: "Nama lengkap kamu",
    email: "Email *",
    emailChecking: "Mengecek email...",
    emailFree: "Email belum terdaftar",
    emailTaken: "Email ini sudah terdaftar di sistem kami.",
    waNumber: "No. WhatsApp *",
    waNumberPh: "0812-3456-7890",
    waChecking: "Mengecek nomor WhatsApp...",
    waFree: "Nomor belum terdaftar",
    waTaken: "Nomor WhatsApp ini sudah terdaftar di sistem kami.",
    askAdmin: "Tanya admin via WhatsApp →",
    waCheckEmail: (v: string) => `Halo, saya cek pendaftaran pengajar dengan email ${v}`,
    waCheckPhone: (v: string) => `Halo, saya cek pendaftaran pengajar dengan WA ${v}`,
    province: "Provinsi *",
    provincePh: "Pilih provinsi...",
    abroad: "Di luar Indonesia",
    city: "Kab/Kota Domisili *",
    cityPh: "Pilih kab/kota...",
    cityWait: "Pilih provinsi dulu",
    cityAbroadPh: "Kota & negara, contoh: Madrid, Spanyol",
    statusMessages: {
      submitted: "Pendaftaran kamu sedang menunggu review. Tim kami akan menghubungi via WhatsApp dalam 1–3 hari kerja.",
      reviewed: "Pendaftaran sudah direview tim. Tunggu kabar selanjutnya via WhatsApp.",
      interview: "Kamu sudah masuk tahap interview. Cek WhatsApp untuk jadwal interview.",
      accepted: "Kamu sudah diterima! Tunggu info onboarding via WhatsApp.",
      onboarded: "Kamu sudah jadi pengajar Linguo. Login ke dashboard pengajar untuk mulai mengajar.",
    } as Record<string, string>,
    s2Title: "Bahasa & Kualifikasi",
    s2Desc: "Pilih bahasa yang ingin kamu ajarkan",
    langsLabel: "Bahasa yang Dikuasai * (urutkan dari paling mahir, max 5)",
    langNo: (n: number) => `Bahasa #${n}`,
    langBest: " (paling mahir)",
    level: "Level",
    levelPh: "Pilih level...",
    levels: {
      A1: "A1 (Pemula)", A2: "A2 (Dasar)", B1: "B1 (Menengah)",
      B2: "B2 (Menengah Atas)", C1: "C1 (Mahir)", C2: "C2 (Sangat Mahir)",
      Native: "Native Speaker",
    } as Record<string, string>,
    removeLang: "Hapus bahasa",
    addLang: "+ Tambah bahasa",
    modeLabel: "Mode Mengajar *",
    modes: {
      online: { label: "Online", desc: "Via Zoom" },
      offline: { label: "Offline", desc: "Tatap muka" },
      both: { label: "Keduanya", desc: "Online & offline" },
    } as Record<string, { label: string; desc: string }>,
    certLabel: "Sertifikat Bahasa",
    optional: "(opsional)",
    certWarnA: "Lampirkan link Google Drive untuk tiap sertifikat. Pastikan akses-nya di-set ",
    certWarnB: ' — jangan private/gembok, biar tim kami bisa langsung buka tanpa request access.',
    certWarnStrong: '"Anyone with the link can view"',
    certNo: (n: number) => `Sertifikat #${n}`,
    certNamePh: "Contoh: JLPT N2",
    certLink: "Link Google Drive",
    removeCert: "Hapus sertifikat",
    addCert: "+ Tambah sertifikat",
    kidsLabel: "Bisa Mengajar Anak-anak? *",
    kidsYes: "Ya, bisa",
    kidsNo: "Tidak / Hanya dewasa",
    kidsTierLabel: "Pilih kelompok usia yang bisa kamu ajar * (boleh pilih keduanya)",
    kidsTiers: {
      little_learner: { label: "Little Learner", age: "4–6 tahun" },
      young_explorer: { label: "Young Explorer", age: "7–12 tahun" },
    } as Record<string, { label: string; age: string }>,
    s3Title: "Pengalaman",
    s3Desc: "Ceritakan pengalaman dan motivasi kamu",
    expLabel: "Pengalaman Mengajar *",
    expOptions: ["Belum pernah (tapi mau belajar)", "< 1 tahun", "1-3 tahun", "3-5 tahun", "5+ tahun"],
    videoLabel: "Video Perkenalan (opsional)",
    videoPh: "Link YouTube atau Google Drive (1-3 menit)",
    videoTip: "Tips: Perkenalkan diri, tunjukkan gaya mengajar, dan jelaskan kenapa kamu cocok jadi pengajar",
    motivLabel: "Kenapa kamu ingin mengajar di Linguo?",
    motivPh: "Ceritakan motivasi dan latar belakang kamu...",
    s4Title: "Review & Kirim",
    s4Desc: "Periksa data kamu sebelum mengirim",
    review: {
      name: "Nama", email: "Email", wa: "WhatsApp", province: "Provinsi", city: "Kota",
      langs: "Bahasa", mode: "Mode Mengajar", cert: "Sertifikat", kids: "Mengajar Kids",
      exp: "Pengalaman", video: "Video", motiv: "Motivasi",
    },
    yes: "Ya",
    no: "Tidak",
    successTitle: "Pendaftaran Terkirim!",
    successDesc: "Data kamu sudah tersimpan. Tim kami akan menghubungi kamu via WhatsApp dalam 1-3 hari kerja untuk proses selanjutnya.",
    successHome: "Kembali ke Beranda",
    pick: {
      choose: "Pilih bahasa...",
      title: "Pilih Bahasa",
      signTitle: "Bahasa Isyarat",
      back: "Kembali",
      close: "Tutup",
      searchLang: "Cari bahasa...",
      searchSign: "Cari jenis bahasa isyarat...",
      empty: "Bahasa tidak ditemukan",
      emptySign: "Tidak ditemukan",
      used: "dipakai",
      signBoth: "Keduanya (BISINDO & ASL)",
      regions: {} as Record<string, string>,
    },
    dupAlertTail: "Kamu akan diarahkan ke Step 1 untuk mengganti kontak atau hubungi admin via WA.",
    dupAlertFallback: "Email atau WhatsApp kamu sudah terdaftar.",
    submitFailed: "Gagal mengirim pendaftaran. Silakan coba lagi atau hubungi kami langsung via WhatsApp.",
    offline: "Koneksi terputus. Cek internet kamu dan coba lagi.",
    waSummary: {
      intro: (n: string) => `Halo, saya ${n} dan tertarik menjadi pengajar di Linguo.`,
      email: "Email", phone: "Telp", province: "Provinsi", city: "Kota", langs: "Bahasa",
      mode: "Mode", kids: "Mengajar Kids", certs: "Sertifikat", exp: "Pengalaman",
      video: "Video", motiv: "Motivasi",
    },
  },
  en: {
    switchLabel: "Bahasa Indonesia",
    switchHref: "/jadi-pengajar",
    contactUs: "Contact Us",
    waHello: "Hello, I am interested in teaching at Linguo",
    waAsk: "Hello, I have a few questions about teaching at Linguo",
    heroBadge: "Join Our Team",
    heroTitleA: "Teach Your Language",
    heroTitleB: "at",
    heroDesc: "Share your language skills and earn on a schedule you set yourself. Teach online from anywhere, anytime.",
    ctaRegister: "Apply Now →",
    ctaAskWa: "Ask Us on WhatsApp",
    stats: ["Languages", "Active Students", "Teachers", "Fee/Session"],
    earnEyebrow: "Earnings Simulation",
    earnTitle: "How Much Can You Earn?",
    earnCards: [
      { sesi: "5 sessions/week", monthly: "Rp 1,200,000", label: "Light part-time" },
      { sesi: "10 sessions/week", monthly: "Rp 2,400,000", label: "Active part-time" },
      { sesi: "20 sessions/week", monthly: "Rp 4,800,000", label: "Full-time" },
    ],
    earnPer: "/month",
    earnNote: "*Based on a Rp 60,000/session fee, 4 weeks per month",
    benefitEyebrow: "Why Teach at Linguo?",
    benefitTitle: "What You Get as a Teacher",
    benefits: [
      { icon: "💰", title: "Flexible Income", desc: "Competitive per-session fee — the more you teach, the more you earn" },
      { icon: "🕐", title: "Set Your Own Hours", desc: "Choose the days and times that fit your availability" },
      { icon: "🏠", title: "Work From Anywhere", desc: "100% online via Zoom — from home, a café, or anywhere else" },
      { icon: "📈", title: "Grow With Us", desc: "Regular training, student feedback, and the chance to teach every level" },
      { icon: "🌍", title: "Polyglot Community", desc: "Join a community of language teachers from all kinds of backgrounds" },
      { icon: "📜", title: "Teaching Certificate", desc: "Receive an official teaching certificate from Linguo.id" },
    ],
    tierEyebrow: "Two Teaching Tracks",
    tierTitle: "Pick the One That Fits You",
    tierProTitle: "Professional Teacher",
    tierProSub: "Pengajar Profesional",
    tierProItems: [
      "Bachelor's degree in language, literature, or education",
      "Language certificate (JLPT, TOPIK, DELF, IELTS, etc.)",
      "1+ year of teaching experience",
      "Able to teach every level (A1–B2)",
    ],
    tierProBadge: "Higher fee • Professional badge",
    tierComTitle: "Community Tutor",
    tierComSub: "Pengajar Komunitas",
    tierComItems: [
      "Fluent in the target language (B2 or above)",
      "Current university student or a graduate of any major",
      "Passionate and patient with learners",
      "Can upgrade to Professional later",
    ],
    tierComBadge: "Great for first-timers • Upgradeable",
    testiEyebrow: "Teacher Stories",
    testiTitle: "What They Say",
    testiQuotes: [
      "Teaching at Linguo gives me flexible hours and a steady extra income. The system is well structured and easy to follow.",
      "I can teach from home while taking care of my family. The students are enthusiastic and they keep me motivated!",
      "A professional and supportive platform. The Linguo team always helps whenever something comes up. Recommended!",
    ],
    testiSessions: (n: number) => `${n.toLocaleString("en-US")} sessions`,
    howEyebrow: "A Simple Process",
    howTitle: "Four Steps to Join",
    howSteps: [
      { num: "01", title: "Fill the Online Form", desc: "Tell us about yourself, your languages, and your experience" },
      { num: "02", title: "Review & Interview", desc: "We review your profile and invite you to a short interview" },
      { num: "03", title: "Onboarding", desc: "An orientation on our teaching method and the Linguo system" },
      { num: "04", title: "Start Teaching!", desc: "Set your schedule and start taking students" },
    ],
    finalTitle: "Ready to Join?",
    finalDesc: "The application takes about 5 minutes. Fill in the form, we review it, and you can start teaching!",
    footerLegal: "PT. Linguo Edu Indonesia",
    wizardTitle: "Teacher Registration",
    back: "Back",
    prev: "Previous",
    stepOf: (n: number) => `Step ${n}/4`,
    next: "Continue →",
    sending: "Sending...",
    submit: "Submit Application →",
    steps: [
      { num: 1, title: "Your Details", desc: "Contact information" },
      { num: 2, title: "Languages & Qualifications", desc: "Language skills" },
      { num: 3, title: "Experience", desc: "Your background" },
      { num: 4, title: "Review & Submit", desc: "Check your answers" },
    ],
    s1Title: "Your Details",
    s1Desc: "Tell us how to reach you",
    fullName: "Full Name *",
    fullNamePh: "Your full name",
    email: "Email *",
    emailChecking: "Checking email...",
    emailFree: "This email is available",
    emailTaken: "This email is already registered in our system.",
    waNumber: "WhatsApp Number *",
    waNumberPh: "+62 812-3456-7890",
    waChecking: "Checking WhatsApp number...",
    waFree: "This number is available",
    waTaken: "This WhatsApp number is already registered in our system.",
    askAdmin: "Ask our admin on WhatsApp →",
    waCheckEmail: (v: string) => `Hello, I would like to check my teacher application for the email ${v}`,
    waCheckPhone: (v: string) => `Hello, I would like to check my teacher application for the WhatsApp number ${v}`,
    province: "Province *",
    provincePh: "Select a province...",
    abroad: "Outside Indonesia",
    city: "City / Regency *",
    cityPh: "Select a city/regency...",
    cityWait: "Select a province first",
    cityAbroadPh: "City and country, e.g. Madrid, Spain",
    statusMessages: {
      submitted: "Your application is waiting to be reviewed. Our team will contact you on WhatsApp within 1–3 working days.",
      reviewed: "Your application has been reviewed. We will get back to you on WhatsApp.",
      interview: "You have reached the interview stage. Check WhatsApp for your interview schedule.",
      accepted: "You have been accepted! Onboarding details are coming on WhatsApp.",
      onboarded: "You are already a Linguo teacher. Sign in to the teacher dashboard to start teaching.",
    } as Record<string, string>,
    s2Title: "Languages & Qualifications",
    s2Desc: "Choose the languages you want to teach",
    langsLabel: "Languages You Speak * (most fluent first, up to 5)",
    langNo: (n: number) => `Language #${n}`,
    langBest: " (most fluent)",
    level: "Level",
    levelPh: "Select a level...",
    levels: {
      A1: "A1 (Beginner)", A2: "A2 (Elementary)", B1: "B1 (Intermediate)",
      B2: "B2 (Upper Intermediate)", C1: "C1 (Advanced)", C2: "C2 (Proficient)",
      Native: "Native Speaker",
    } as Record<string, string>,
    removeLang: "Remove language",
    addLang: "+ Add a language",
    modeLabel: "Teaching Mode *",
    modes: {
      online: { label: "Online", desc: "Via Zoom" },
      offline: { label: "Offline", desc: "In person" },
      both: { label: "Both", desc: "Online & offline" },
    } as Record<string, { label: string; desc: string }>,
    certLabel: "Language Certificates",
    optional: "(optional)",
    certWarnA: "Attach a Google Drive link for each certificate. Make sure sharing is set to ",
    certWarnB: " — not private, so our team can open it without requesting access.",
    certWarnStrong: '"Anyone with the link can view"',
    certNo: (n: number) => `Certificate #${n}`,
    certNamePh: "Example: JLPT N2",
    certLink: "Google Drive link",
    removeCert: "Remove certificate",
    addCert: "+ Add a certificate",
    kidsLabel: "Can You Teach Children? *",
    kidsYes: "Yes, I can",
    kidsNo: "No / Adults only",
    kidsTierLabel: "Pick the age groups you can teach * (you may choose both)",
    kidsTiers: {
      little_learner: { label: "Little Learner", age: "ages 4–6" },
      young_explorer: { label: "Young Explorer", age: "ages 7–12" },
    } as Record<string, { label: string; age: string }>,
    s3Title: "Experience",
    s3Desc: "Tell us about your experience and what motivates you",
    expLabel: "Teaching Experience *",
    expOptions: ["None yet (but eager to learn)", "< 1 year", "1-3 years", "3-5 years", "5+ years"],
    videoLabel: "Introduction Video (optional)",
    videoPh: "YouTube or Google Drive link (1-3 minutes)",
    videoTip: "Tip: introduce yourself, show your teaching style, and explain why you would be a good fit",
    motivLabel: "Why do you want to teach at Linguo?",
    motivPh: "Tell us about your motivation and background...",
    s4Title: "Review & Submit",
    s4Desc: "Check your answers before sending",
    review: {
      name: "Name", email: "Email", wa: "WhatsApp", province: "Province", city: "City",
      langs: "Languages", mode: "Teaching Mode", cert: "Certificates", kids: "Teaches Kids",
      exp: "Experience", video: "Video", motiv: "Motivation",
    },
    yes: "Yes",
    no: "No",
    successTitle: "Application Sent!",
    successDesc: "We have received your details. Our team will contact you on WhatsApp within 1-3 working days about the next steps.",
    successHome: "Back to Home",
    pick: {
      choose: "Select a language...",
      title: "Select a Language",
      signTitle: "Sign Language",
      back: "Back",
      close: "Close",
      searchLang: "Search languages...",
      searchSign: "Search sign languages...",
      empty: "No language found",
      emptySign: "Nothing found",
      used: "in use",
      signBoth: "Both (BISINDO & ASL)",
      regions: {
        european: "Europe",
        asian: "Asia",
        "middle-eastern": "Middle East",
        nusantara: "Indonesian Archipelago",
        african: "Africa",
        other: "Classical & Others",
        sign: "Sign Language",
      } as Record<string, string>,
    },
    dupAlertTail: "You will be taken back to Step 1 to change your contact details, or you can reach our admin on WhatsApp.",
    dupAlertFallback: "Your email or WhatsApp number is already registered.",
    submitFailed: "We could not send your application. Please try again or contact us on WhatsApp.",
    offline: "Connection lost. Check your internet and try again.",
    waSummary: {
      intro: (n: string) => `Hello, my name is ${n} and I am interested in teaching at Linguo.`,
      email: "Email", phone: "Phone", province: "Province", city: "City", langs: "Languages",
      mode: "Mode", kids: "Teaches kids", certs: "Certificates", exp: "Experience",
      video: "Video", motiv: "Motivation",
    },
  },
} as const;

type Copy = (typeof T)[Lang];

const LANG_REGION_ORDER = ["european", "asian", "middle-eastern", "nusantara", "african", "other"] as const;

type PickerLang = { slug: string; name: string; flag: string; nativeName?: string };

// Bahasa isyarat — bukan bagian dari katalog `languages`, jadi didefinisikan terpisah.
const signLanguages = (t: Copy): PickerLang[] => [
  { slug: "bisindo", name: "BISINDO", flag: "🤟", nativeName: "Bahasa Isyarat Indonesia" },
  { slug: "asl", name: "ASL", flag: "🤟", nativeName: "American Sign Language" },
  { slug: "sign-both", name: t.pick.signBoth, flag: "🤟" },
];
// Resolusi nama (langNameBySlug) dipakai di luar picker, di mana bahasanya tidak
// selalu terbawa — pakai daftar Indonesia sebagai cadangan yang selalu ada.
const SIGN_LANGUAGES: PickerLang[] = signLanguages(T.id);

// Slug penanda "induk" bahasa isyarat di list utama — bukan nilai yang disimpan,
// klik item ini akan membuka sub-pilihan (BISINDO / ASL / Keduanya).
const SIGN_PARENT_SLUG = "__sign__";
const signParent = (t: Copy): PickerLang => ({ slug: SIGN_PARENT_SLUG, name: t.pick.signTitle, flag: "🤟" });

const langGroups = (t: Copy): { region: string; label: string; items: PickerLang[] }[] => [
  ...LANG_REGION_ORDER.map(region => ({
    region,
    label: t.pick.regions[region] ?? regionLabels[region],
    items: languages
      .filter(l => l.region === region)
      .sort((a, b) => a.name.localeCompare(b.name, "id"))
      .map(l => ({ slug: l.slug, name: l.name, flag: l.flag, nativeName: l.nativeName })),
  })).filter(g => g.items.length > 0),
  // Di list utama bahasa isyarat tampil sebagai SATU item, bukan 3.
  { region: "sign", label: t.pick.signTitle, items: [signParent(t)] },
];
const LANG_GROUPS = langGroups(T.id);

// Resolusi nama: cari di katalog utama + 3 opsi bahasa isyarat yang sebenarnya.
const findLangMeta = (slug: string): PickerLang | null =>
  LANG_GROUPS.flatMap(g => g.items).find(l => l.slug === slug)
  ?? SIGN_LANGUAGES.find(l => l.slug === slug)
  ?? null;

const LEVEL_VALUES = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"] as const;

const langNameBySlug = (slug: string) => findLangMeta(slug)?.name ?? slug;

// ---- Language picker modal (search + grouped per region) ----
function LangPicker({ value, usedLangs, onSelect, t }: {
  value: string;
  usedLangs: string[];
  onSelect: (slug: string) => void;
  t: Copy;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [showSignSub, setShowSignSub] = useState(false);
  const selected = value ? findLangMeta(value) : null;
  const close = () => { setOpen(false); setQ(""); setShowSignSub(false); };

  const norm = q.trim().toLowerCase();
  const matches = (l: PickerLang) =>
    !norm ||
    l.name.toLowerCase().includes(norm) ||
    (l.nativeName?.toLowerCase().includes(norm) ?? false);

  const groups = langGroups(t).map(g => ({
    ...g,
    items: g.items.filter(matches),
  })).filter(g => g.items.length > 0);

  const signOptions = signLanguages(t).filter(matches);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm text-left focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white flex items-center justify-between gap-2">
        <span className={selected ? "truncate" : "text-slate-400"}>
          {selected ? `${selected.flag} ${selected.name}` : t.pick.choose}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  {showSignSub && (
                    <button type="button" onClick={() => setShowSignSub(false)} aria-label={t.pick.back}
                      className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <h3 className="font-bold text-base truncate">{showSignSub ? t.pick.signTitle : t.pick.title}</h3>
                </div>
                <button type="button" onClick={close} aria-label={t.pick.close}
                  className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                  placeholder={showSignSub ? t.pick.searchSign : t.pick.searchLang}
                  className="w-full border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
              </div>
            </div>
            <div className="overflow-y-auto p-2">
              {showSignSub ? (
                signOptions.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-10">{t.pick.emptySign}</p>
                ) : signOptions.map(l => {
                  const isSel = l.slug === value;
                  const used = !isSel && usedLangs.includes(l.slug);
                  return (
                    <button key={l.slug} type="button" disabled={used}
                      onClick={() => { onSelect(l.slug); close(); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors ${used ? "opacity-40 cursor-not-allowed" : "hover:bg-[#1A9E9E]/5"} ${isSel ? "bg-[#1A9E9E]/10 text-[#1A9E9E] font-semibold" : ""}`}>
                      <span className="truncate">{l.flag} {l.name}</span>
                      {isSel && <Check className="h-4 w-4 flex-shrink-0" />}
                      {used && <span className="text-[10px] text-slate-400 flex-shrink-0">{t.pick.used}</span>}
                    </button>
                  );
                })
              ) : groups.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-10">{t.pick.empty}</p>
              ) : groups.map(g => (
                <div key={g.region} className="mb-2">
                  <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{g.label}</p>
                  {g.items.map(l => {
                    const isSignParent = l.slug === SIGN_PARENT_SLUG;
                    // Item bahasa isyarat terpilih bila value adalah salah satu dari 3 opsi.
                    const isSel = isSignParent
                      ? signLanguages(t).some(s => s.slug === value)
                      : l.slug === value;
                    const used = !isSel && !isSignParent && usedLangs.includes(l.slug);
                    const onClick = isSignParent
                      ? () => { setShowSignSub(true); setQ(""); }
                      : () => { onSelect(l.slug); close(); };
                    return (
                      <button key={l.slug} type="button" disabled={used} onClick={onClick}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors ${used ? "opacity-40 cursor-not-allowed" : "hover:bg-[#1A9E9E]/5"} ${isSel ? "bg-[#1A9E9E]/10 text-[#1A9E9E] font-semibold" : ""}`}>
                        <span className="truncate">
                          {l.flag} {l.name}
                          {isSignParent && isSel && (
                            <span className="font-normal text-[#1A9E9E]/70"> · {findLangMeta(value)?.name}</span>
                          )}
                        </span>
                        {isSignParent
                          ? <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
                          : <>
                              {isSel && <Check className="h-4 w-4 flex-shrink-0" />}
                              {used && <span className="text-[10px] text-slate-400 flex-shrink-0">{t.pick.used}</span>}
                            </>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

// ---- Dup detection helpers ----
type DupStatus = "idle" | "checking" | "ok" | "blocking";
type DupCheck = { status: DupStatus; appStatus?: string };

function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

// ---- Tier kids ----
const KIDS_TIERS = [
  { value: "little_learner", Icon: Baby },
  { value: "young_explorer", Icon: Backpack },
] as const;

// ---- Mode mengajar ----
const TEACHING_MODES = [
  { value: "online", Icon: Video },
  { value: "offline", Icon: Users },
  { value: "both", Icon: Repeat },
] as const;

export default function FormPengajar({ lang }: { lang: Lang }) {
  const t: Copy = T[lang];
  const [step, setStep] = useState(0); // 0 = landing, 1-4 = wizard steps
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1: Data Diri
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  // Step 1: Dup check states
  const [emailCheck, setEmailCheck] = useState<DupCheck>({ status: "idle" });
  const [phoneCheck, setPhoneCheck] = useState<DupCheck>({ status: "idle" });
  const [lastCheckedEmail, setLastCheckedEmail] = useState("");
  const [lastCheckedPhone, setLastCheckedPhone] = useState("");

  // Step 2: Bahasa & Kualifikasi
  const [langSkills, setLangSkills] = useState<{ lang: string; level: string }[]>([{ lang: "", level: "" }]);
  const [teachingMode, setTeachingMode] = useState<"" | "online" | "offline" | "both">("");
  const [certificates, setCertificates] = useState<{ name: string; link: string }[]>([{ name: "", link: "" }]);
  const [canTeachKids, setCanTeachKids] = useState<null | boolean>(null);
  const [kidsTiers, setKidsTiers] = useState<string[]>([]);

  // Step 3: Pengalaman
  const [exp, setExp] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [motivation, setMotivation] = useState("");

  // ---- Lang skills helpers ----
  const addLangSlot = () => {
    if (langSkills.length < 5) setLangSkills([...langSkills, { lang: "", level: "" }]);
  };
  const removeLangSlot = (idx: number) => {
    setLangSkills(langSkills.filter((_, i) => i !== idx));
  };
  const updateLangSlot = (idx: number, field: "lang" | "level", value: string) => {
    setLangSkills(langSkills.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const validSkills = langSkills.filter(s => s.lang && s.level);
  const hasIncompleteSkill = langSkills.some(s => (s.lang && !s.level) || (!s.lang && s.level));

  // ---- Certificate helpers ----
  const addCert = () => {
    if (certificates.length < 5) setCertificates([...certificates, { name: "", link: "" }]);
  };
  const removeCert = (idx: number) => {
    setCertificates(certificates.filter((_, i) => i !== idx));
  };
  const updateCert = (idx: number, field: "name" | "link", value: string) => {
    setCertificates(certificates.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };
  const validCerts = certificates.filter(c => c.name.trim() && c.link.trim());
  const hasIncompleteCert = certificates.some(c => {
    const hasName = !!c.name.trim();
    const hasLink = !!c.link.trim();
    return (hasName && !hasLink) || (!hasName && hasLink);
  });

  // ---- Kids tier helper ----
  const toggleKidsTier = (t: string) => {
    setKidsTiers(kidsTiers.includes(t)
      ? kidsTiers.filter(x => x !== t)
      : [...kidsTiers, t]
    );
  };

  // ---- Dup check API ----
  async function checkDuplicate(field: "email" | "phone", rawValue: string) {
    const value = field === "email" ? rawValue.trim().toLowerCase() : rawValue;
    const param = field === "email"
      ? `email=${encodeURIComponent(value)}`
      : `phone=${encodeURIComponent(value)}`;
    try {
      const res = await fetch(`/api/teacher-apply?${param}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data[field] as { exists: boolean; status: string; blocking: boolean } | null;
    } catch {
      return null;
    }
  }

  const handleEmailBlur = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) return;
    if (trimmed === lastCheckedEmail) return;
    setEmailCheck({ status: "checking" });
    setLastCheckedEmail(trimmed);
    const result = await checkDuplicate("email", trimmed);
    if (result?.blocking) {
      setEmailCheck({ status: "blocking", appStatus: result.status });
    } else {
      setEmailCheck({ status: "ok" });
    }
  };

  const handlePhoneBlur = async () => {
    const normalized = normalizePhone(phone);
    if (!normalized || normalized.length < 9) return;
    if (normalized === lastCheckedPhone) return;
    setPhoneCheck({ status: "checking" });
    setLastCheckedPhone(normalized);
    const result = await checkDuplicate("phone", phone);
    if (result?.blocking) {
      setPhoneCheck({ status: "blocking", appStatus: result.status });
    } else {
      setPhoneCheck({ status: "ok" });
    }
  };

  const onEmailChange = (v: string) => {
    setEmail(v);
    if (emailCheck.status !== "idle") setEmailCheck({ status: "idle" });
  };
  const onPhoneChange = (v: string) => {
    setPhone(v);
    if (phoneCheck.status !== "idle") setPhoneCheck({ status: "idle" });
  };

  /* [pengajar-form-en-v1] "Di luar Indonesia" mematikan dropdown kab/kota dan
     menggantinya dengan isian bebas — daftar WILAYAH_ID tidak punya baris untuk
     Madrid, dan tanpa jalan keluar ini pelamar dari luar negeri mentok di
     langkah 1. Yang dikirim ke server tetap dua kolom teks yang sama. */
  const diLuarNegeri = province === LUAR_NEGERI;
  const provinceValue = diLuarNegeri ? t.abroad : province;

  const canNext = (s: number) => {
    if (s === 1) {
      return !!(name.trim() && email.trim() && phone.trim() && province && city)
        && emailCheck.status !== "blocking"
        && phoneCheck.status !== "blocking"
        && emailCheck.status !== "checking"
        && phoneCheck.status !== "checking";
    }
    if (s === 2) {
      const kidsOk = canTeachKids === false || (canTeachKids === true && kidsTiers.length > 0);
      return validSkills.length >= 1
        && !hasIncompleteSkill
        && !!teachingMode
        && !hasIncompleteCert
        && canTeachKids !== null
        && kidsOk;
    }
    if (s === 3) return !!exp;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const certsBlock = validCerts.length > 0
      ? `Sertifikat:\n${validCerts.map(c => `- ${c.name} (${c.link})`).join("\n")}`
      : null;
    const payload = {
      name, email, phone, province: provinceValue, city,
      languages: validSkills.map(s => `${s.lang}|${s.level}`).join(", "),
      level: validSkills[0]?.level ?? "",
      experience: exp,
      note: [
        provinceValue && `Provinsi: ${provinceValue}`,
        city && `Kota: ${city}`,
        certsBlock,
        videoLink && `Video: ${videoLink}`,
        motivation && `Motivasi: ${motivation}`,
      ].filter(Boolean).join("\n"),
      teaching_mode: teachingMode || null,
      can_teach_kids: canTeachKids === true,
      kids_tiers: canTeachKids === true ? kidsTiers : null,
    };

    try {
      const res = await fetch("/api/teacher-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Submit failed:", res.status, errData);
        if (res.status === 409 && errData.error === "duplicate") {
          const msg = t.statusMessages[errData.status] || t.dupAlertFallback;
          alert(`${msg}\n\n${t.dupAlertTail}`);
          setStep(1);
          if (errData.field === "email") setEmailCheck({ status: "blocking", appStatus: errData.status });
          if (errData.field === "phone") setPhoneCheck({ status: "blocking", appStatus: errData.status });
          setLoading(false);
          return;
        }
        alert(errData.error || t.submitFailed);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error(e);
      alert(t.offline);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);

    const skillsText = validSkills.map(s => `${langNameBySlug(s.lang)} (${s.level})`).join(", ");
    const modeLabel = teachingMode ? t.modes[teachingMode].label : "-";
    const kidsLabel = canTeachKids
      ? kidsTiers.map(v => t.kidsTiers[v]?.label).filter(Boolean).join(", ") || t.yes
      : t.no;
    const certsText = validCerts.length > 0
      ? validCerts.map(c => `${c.name}: ${c.link}`).join("\n")
      : "-";
    const w = t.waSummary;
    const msg = [
      w.intro(name), "",
      `${w.email}: ${email}`,
      `${w.phone}: ${phone}`,
      `${w.province}: ${provinceValue}`,
      `${w.city}: ${city}`,
      `${w.langs}: ${skillsText}`,
      `${w.mode}: ${modeLabel}`,
      `${w.kids}: ${kidsLabel}`,
      `${w.certs}:\n${certsText}`,
      `${w.exp}: ${exp}`,
      `${w.video}: ${videoLink}`,
      `${w.motiv}: ${motivation}`,
    ].join("\n");
    setTimeout(() => window.open(waMsg(msg), "_blank"), 1000);
  };

  const fade = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };
  const slideIn = { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 }, transition: { duration: 0.3 } };

  // ====== LANDING VIEW (step === 0) ======
  if (step === 0) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* HEADER */}
        <header className="sticky top-[var(--promo-bar-h,0px)] z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center"><Image src="/images/logo-white.png" alt="Linguo" width={90} height={32} priority className="h-8 w-auto brightness-0" /></Link>
            <div className="flex items-center gap-2">
              {/* Tombol ganti bahasa memindahkan RUTE, bukan sekadar state: alamat
                  yang sedang dibuka itu yang dibagikan ulang & di-bookmark. */}
              <Link href={t.switchHref} className="text-slate-500 hover:text-[#1A9E9E] font-semibold px-3 py-2 rounded-full text-xs sm:text-sm transition-colors border border-slate-200">
                {t.switchLabel}
              </Link>
              <a href={waMsg(t.waHello)} target="_blank" className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all active:scale-95">{t.contactUs}</a>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8]" />
          <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 lg:py-36">
            <motion.div {...fade} className="max-w-2xl">
              <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wider uppercase">{t.heroBadge}</span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                {t.heroTitleA}<br />{t.heroTitleB} <span className="text-[#fbbf24]">Linguo.id</span>
              </h1>
              <p className="text-white/80 text-base sm:text-lg mb-8 leading-relaxed max-w-xl">{t.heroDesc}</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setStep(1)} className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-4 rounded-full transition-all active:scale-95 text-sm">{t.ctaRegister}</button>
                <a href={waMsg(t.waAsk)} target="_blank" className="bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-4 rounded-full transition-all active:scale-95 text-sm backdrop-blur-sm border border-white/20">{t.ctaAskWa}</a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-10 border-b border-slate-100 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {["55+", "1,200+", "20+", "Rp 60K"].map((num, i) => ({ num, label: t.stats[i] })).map((s, i) => (
              <motion.div key={i} {...fade} transition={{ delay: i * 0.1 }}>
                <p className="text-2xl sm:text-3xl font-bold text-[#1A9E9E]">{s.num}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* EARNING SIMULATOR */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-10">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">{t.earnEyebrow}</p>
              <h2 className="text-2xl sm:text-3xl font-bold">{t.earnTitle}</h2>
            </motion.div>
            <motion.div {...fade} className="grid sm:grid-cols-3 gap-4">
              {[
                "border-blue-200 bg-blue-50",
                "border-[#1A9E9E]/30 bg-[#1A9E9E]/5 ring-2 ring-[#1A9E9E]/20",
                "border-amber-200 bg-amber-50",
              ].map((color, i) => ({ ...t.earnCards[i], color })).map((e, i) => (
                <div key={i} className={`rounded-2xl border-2 p-6 text-center ${e.color} transition-all`}>
                  <p className="text-sm text-slate-500 mb-1">{e.sesi}</p>
                  <p className="text-2xl font-bold text-slate-800 mb-1">{e.monthly}</p>
                  <p className="text-xs text-slate-400">{t.earnPer} • {e.label}</p>
                </div>
              ))}
            </motion.div>
            <p className="text-center text-xs text-slate-400 mt-4">{t.earnNote}</p>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-16 sm:py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-14">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">{t.benefitEyebrow}</p>
              <h2 className="text-2xl sm:text-3xl font-bold">{t.benefitTitle}</h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {t.benefits.map((b, i) => (
                <motion.div key={i} {...fade} transition={{ delay: i * 0.08 }} className="bg-white border-2 border-slate-100 rounded-2xl p-6 hover:border-[#1A9E9E]/30 hover:shadow-lg transition-all group">
                  <span className="text-3xl mb-3 block">{b.icon}</span>
                  <h3 className="font-bold text-base mb-2 group-hover:text-[#1A9E9E] transition-colors">{b.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TWO TIERS */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-14">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">{t.tierEyebrow}</p>
              <h2 className="text-2xl sm:text-3xl font-bold">{t.tierTitle}</h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-5">
              <motion.div {...fade} className="border-2 border-slate-100 rounded-2xl p-6 hover:border-[#1A9E9E]/30 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-10 w-10 bg-[#1A9E9E]/10 rounded-xl flex items-center justify-center text-xl">🎓</span>
                  <div><h3 className="font-bold">{t.tierProTitle}</h3><p className="text-xs text-slate-400">{t.tierProSub}</p></div>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {t.tierProItems.map((item) => (
                    <li key={item} className="flex items-start gap-2"><span className="text-[#1A9E9E] mt-0.5">✓</span>{item}</li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs bg-[#1A9E9E]/10 text-[#1A9E9E] font-semibold px-3 py-1 rounded-full">{t.tierProBadge}</span>
                </div>
              </motion.div>
              <motion.div {...fade} transition={{ delay: 0.1 }} className="border-2 border-slate-100 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">🗣️</span>
                  <div><h3 className="font-bold">{t.tierComTitle}</h3><p className="text-xs text-slate-400">{t.tierComSub}</p></div>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {t.tierComItems.map((item) => (
                    <li key={item} className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span>{item}</li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1 rounded-full">{t.tierComBadge}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* TEACHER TESTIMONIALS */}
        <section className="py-16 sm:py-24 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-14">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">{t.testiEyebrow}</p>
              <h2 className="text-2xl sm:text-3xl font-bold">{t.testiTitle}</h2>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-5">
              {TEACHER_PHOTOS.map((teacher, i) => ({ ...teacher, quote: t.testiQuotes[i] })).map((t, i) => (
                <motion.div key={i} {...fade} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={t.img} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic mb-3">"{t.quote}"</p>
                  <span className="text-xs bg-[#1A9E9E]/10 text-[#1A9E9E] px-2.5 py-1 rounded-full font-medium">{T[lang].testiSessions(t.sessions)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-14">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">{t.howEyebrow}</p>
              <h2 className="text-2xl sm:text-3xl font-bold">{t.howTitle}</h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.howSteps.map((s, i) => (
                <motion.div key={i} {...fade} transition={{ delay: i * 0.12 }} className="text-center">
                  <div className="w-14 h-14 bg-[#1A9E9E]/10 text-[#1A9E9E] font-bold text-lg rounded-2xl flex items-center justify-center mx-auto mb-4">{s.num}</div>
                  <h3 className="font-bold text-sm mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8]">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <motion.div {...fade}>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t.finalTitle}</h2>
              <p className="text-white/70 text-sm mb-8">{t.finalDesc}</p>
              <button onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-10 py-4 rounded-full transition-all active:scale-95 text-sm">{t.ctaRegister}</button>
            </motion.div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#14726E] text-white py-10">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <Link href="/" className="inline-block mb-4"><Image src="/images/logo-white.png" alt="Linguo" width={113} height={40} className="h-10 w-auto mx-auto" /></Link>
            <p className="text-white/60 text-sm mb-2">{t.footerLegal}</p>
            <p className="text-white/40 text-xs">Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung 40135</p>
            <div className="border-t border-white/20 mt-6 pt-6 text-xs text-white/40">© {new Date().getFullYear()} Linguo.id</div>
          </div>
        </footer>
      </div>
    );
  }

  // ====== WIZARD VIEW (step 1-4) ======
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* WIZARD HEADER */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => step === 1 ? setStep(0) : setStep(step - 1)} className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1">
            ← {step === 1 ? t.back : t.prev}
          </button>
          <span className="text-sm font-semibold text-[#1A9E9E]">{t.wizardTitle}</span>
          <span className="text-xs text-slate-400">{t.stepOf(step)}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <motion.div className="h-full bg-[#1A9E9E]" initial={{ width: 0 }} animate={{ width: `${(step / 4) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
      </header>

      {/* STEP INDICATORS */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between">
          {t.steps.map((s) => (
            <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? "text-[#1A9E9E]" : "text-slate-300"}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > s.num ? "bg-[#1A9E9E] text-white" : step === s.num ? "bg-[#1A9E9E]/10 text-[#1A9E9E] ring-2 ring-[#1A9E9E]" : "bg-slate-100 text-slate-400"}`}>
                {step > s.num ? "✓" : s.num}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold">{s.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WIZARD CONTENT */}
      <div className="flex-1 py-8">
        <div className="max-w-xl mx-auto px-4">
          <AnimatePresence mode="wait">
            {/* STEP 1: Data Diri */}
            {step === 1 && (
              <motion.div key="step1" {...slideIn} className="space-y-6">
                <div><h2 className="text-xl font-bold mb-1">{t.s1Title}</h2><p className="text-sm text-slate-500">{t.s1Desc}</p></div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t.fullName}</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.fullNamePh}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t.email}</label>
                    <input type="email" value={email}
                      onChange={e => onEmailChange(e.target.value)}
                      onBlur={handleEmailBlur}
                      placeholder="email@example.com"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                        emailCheck.status === "blocking"
                          ? "border-red-300 focus:border-red-500 bg-red-50/30"
                          : emailCheck.status === "ok"
                          ? "border-green-300 focus:border-green-500"
                          : "border-slate-200 focus:border-[#1A9E9E]"
                      }`} />
                    {emailCheck.status === "checking" && (
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <Loader2 className="animate-spin h-3 w-3" />
                        {t.emailChecking}
                      </p>
                    )}
                    {emailCheck.status === "ok" && (
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t.emailFree}
                      </p>
                    )}
                    {emailCheck.status === "blocking" && (
                      <div className="mt-1.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 leading-relaxed flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{t.statusMessages[emailCheck.appStatus!] || t.emailTaken}</span>
                        </p>
                        <a href={waMsg(t.waCheckEmail(email))} target="_blank"
                          className="inline-block mt-2 text-xs font-semibold text-red-700 underline hover:text-red-800">
                          {t.askAdmin}
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t.waNumber}</label>
                    <input type="tel" value={phone}
                      onChange={e => onPhoneChange(e.target.value)}
                      onBlur={handlePhoneBlur}
                      placeholder={t.waNumberPh}
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                        phoneCheck.status === "blocking"
                          ? "border-red-300 focus:border-red-500 bg-red-50/30"
                          : phoneCheck.status === "ok"
                          ? "border-green-300 focus:border-green-500"
                          : "border-slate-200 focus:border-[#1A9E9E]"
                      }`} />
                    {phoneCheck.status === "checking" && (
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <Loader2 className="animate-spin h-3 w-3" />
                        {t.waChecking}
                      </p>
                    )}
                    {phoneCheck.status === "ok" && (
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t.waFree}
                      </p>
                    )}
                    {phoneCheck.status === "blocking" && (
                      <div className="mt-1.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 leading-relaxed flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{t.statusMessages[phoneCheck.appStatus!] || t.waTaken}</span>
                        </p>
                        <a href={waMsg(t.waCheckPhone(phone))} target="_blank"
                          className="inline-block mt-2 text-xs font-semibold text-red-700 underline hover:text-red-800">
                          {t.askAdmin}
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t.province}</label>
                    <select value={province} onChange={e => { setProvince(e.target.value); setCity(""); }}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white">
                      <option value="">{t.provincePh}</option>
                      {WILAYAH_ID.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                      <option value={LUAR_NEGERI}>{t.abroad}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t.city}</label>
                    {diLuarNegeri ? (
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder={t.cityAbroadPh}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                    ) : (
                      <select value={city} onChange={e => setCity(e.target.value)} disabled={!province}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed">
                        <option value="">{province ? t.cityPh : t.cityWait}</option>
                        {(WILAYAH_ID.find(p => p.name === province)?.cities ?? []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Bahasa & Kualifikasi */}
            {step === 2 && (
              <motion.div key="step2" {...slideIn} className="space-y-6">
                <div><h2 className="text-xl font-bold mb-1">{t.s2Title}</h2><p className="text-sm text-slate-500">{t.s2Desc}</p></div>

                {/* BAHASA */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">{t.langsLabel}</label>
                  <div className="space-y-3">
                    {langSkills.map((skill, idx) => {
                      const usedLangs = langSkills.filter((_, i) => i !== idx).map(s => s.lang).filter(Boolean);
                      return (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 mb-1 block uppercase tracking-wide">
                                {t.langNo(idx + 1)}{idx === 0 ? t.langBest : ""}
                              </label>
                              <LangPicker
                                value={skill.lang}
                                usedLangs={usedLangs}
                                onSelect={slug => updateLangSlot(idx, "lang", slug)}
                                t={t}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 mb-1 block uppercase tracking-wide">{t.level}</label>
                              <select value={skill.level} onChange={e => updateLangSlot(idx, "level", e.target.value)} disabled={!skill.lang}
                                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed">
                                <option value="">{t.levelPh}</option>
                                {LEVEL_VALUES.map(lv => (
                                  <option key={lv} value={lv}>{t.levels[lv]}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          {idx > 0 && (
                            <button type="button" onClick={() => removeLangSlot(idx)} aria-label={t.removeLang}
                              className="mt-6 h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {langSkills.length < 5 && (
                      <button type="button" onClick={addLangSlot}
                        className="text-sm text-[#1A9E9E] font-semibold hover:bg-[#1A9E9E]/5 px-4 py-2 rounded-lg transition-colors">
                        {t.addLang}
                      </button>
                    )}
                  </div>
                </div>

                {/* MODE MENGAJAR */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">{t.modeLabel}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TEACHING_MODES.map(m => {
                      const selected = teachingMode === m.value;
                      const Icon = m.Icon;
                      return (
                        <button key={m.value} type="button" onClick={() => setTeachingMode(m.value)}
                          className={`text-center p-3 rounded-xl border-2 transition-all ${selected ? "bg-[#1A9E9E]/5 border-[#1A9E9E]" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                          <Icon strokeWidth={1.75} className={`h-7 w-7 mb-1.5 mx-auto ${selected ? "text-[#1A9E9E]" : "text-slate-500"}`} />
                          <p className="font-semibold text-xs">{t.modes[m.value].label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.modes[m.value].desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SERTIFIKAT BAHASA — multi-add, optional */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />
                    {t.certLabel} <span className="font-normal text-slate-400">{t.optional}</span>
                  </label>
                  <div className="mb-3 p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {t.certWarnA}<strong>{t.certWarnStrong}</strong>{t.certWarnB}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {certificates.map((cert, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 gap-2">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wide">
                              <Award className="h-3 w-3" /> {t.certNo(idx + 1)}
                            </label>
                            <input type="text" value={cert.name} onChange={e => updateCert(idx, "name", e.target.value)} placeholder={t.certNamePh}
                              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wide">
                              <Link2 className="h-3 w-3" /> {t.certLink}
                            </label>
                            <input type="url" value={cert.link} onChange={e => updateCert(idx, "link", e.target.value)} placeholder="https://drive.google.com/..."
                              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                          </div>
                        </div>
                        {idx > 0 && (
                          <button type="button" onClick={() => removeCert(idx)} aria-label={t.removeCert}
                            className="mt-6 h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    {certificates.length < 5 && (
                      <button type="button" onClick={addCert}
                        className="text-sm text-[#1A9E9E] font-semibold hover:bg-[#1A9E9E]/5 px-4 py-2 rounded-lg transition-colors">
                        {t.addCert}
                      </button>
                    )}
                  </div>
                </div>

                {/* BISA NGAJAR KIDS */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">{t.kidsLabel}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setCanTeachKids(true); }}
                      className={`text-center p-3 rounded-xl border-2 transition-all ${canTeachKids === true ? "bg-amber-50 border-amber-400" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      <Smile strokeWidth={1.75} className={`h-7 w-7 mb-1.5 mx-auto ${canTeachKids === true ? "text-amber-500" : "text-slate-500"}`} />
                      <p className="font-semibold text-sm">{t.kidsYes}</p>
                    </button>
                    <button type="button" onClick={() => { setCanTeachKids(false); setKidsTiers([]); }}
                      className={`text-center p-3 rounded-xl border-2 transition-all ${canTeachKids === false ? "bg-slate-100 border-slate-400" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      <Ban strokeWidth={1.75} className={`h-7 w-7 mb-1.5 mx-auto ${canTeachKids === false ? "text-slate-600" : "text-slate-500"}`} />
                      <p className="font-semibold text-sm">{t.kidsNo}</p>
                    </button>
                  </div>

                  {canTeachKids === true && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                      className="mt-3 p-4 bg-amber-50/50 border-2 border-amber-100 rounded-xl">
                      <label className="text-xs font-semibold text-amber-700 mb-2 block">{t.kidsTierLabel}</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {KIDS_TIERS.map(k => {
                          const selected = kidsTiers.includes(k.value);
                          const Icon = k.Icon;
                          return (
                            <button key={k.value} type="button" onClick={() => toggleKidsTier(k.value)}
                              className={`text-left p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 ${selected ? "bg-white border-amber-400 ring-2 ring-amber-200" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                              <Icon strokeWidth={1.75} className={`h-7 w-7 flex-shrink-0 ${selected ? "text-amber-500" : "text-slate-500"}`} />
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{t.kidsTiers[k.value].label}</p>
                                <p className="text-xs text-slate-500">{t.kidsTiers[k.value].age}</p>
                              </div>
                              {selected && <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Pengalaman */}
            {step === 3 && (
              <motion.div key="step3" {...slideIn} className="space-y-6">
                <div><h2 className="text-xl font-bold mb-1">{t.s3Title}</h2><p className="text-sm text-slate-500">{t.s3Desc}</p></div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">{t.expLabel}</label>
                  <div className="grid grid-cols-1 gap-2">
                    {EXP_VALUES.map((e, i) => (
                      <button key={e} onClick={() => setExp(e)}
                        className={`text-sm px-4 py-3 rounded-xl border-2 transition-all text-left ${exp === e ? "bg-[#1A9E9E]/5 border-[#1A9E9E] text-[#1A9E9E] font-semibold" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        {t.expOptions[i]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t.videoLabel}</label>
                  <input type="url" value={videoLink} onChange={e => setVideoLink(e.target.value)} placeholder={t.videoPh}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors" />
                  <p className="text-xs text-slate-400 mt-1.5">{t.videoTip}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t.motivLabel}</label>
                  <textarea value={motivation} onChange={e => setMotivation(e.target.value)} rows={4} placeholder={t.motivPh}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors resize-none" />
                </div>
              </motion.div>
            )}

            {/* STEP 4: Review & Submit */}
            {step === 4 && !success && (
              <motion.div key="step4" {...slideIn} className="space-y-6">
                <div><h2 className="text-xl font-bold mb-1">{t.s4Title}</h2><p className="text-sm text-slate-500">{t.s4Desc}</p></div>
                <div className="bg-white border-2 border-slate-100 rounded-2xl divide-y divide-slate-100">
                  {[
                    { label: t.review.name, value: name },
                    { label: t.review.email, value: email },
                    { label: t.review.wa, value: phone },
                    { label: t.review.province, value: provinceValue || "-" },
                    { label: t.review.city, value: city || "-" },
                    { label: t.review.langs, value: validSkills.map(s => `${langNameBySlug(s.lang)} (${s.level})`).join(", ") || "-" },
                    { label: t.review.mode, value: teachingMode ? t.modes[teachingMode].label : "-" },
                    { label: t.review.cert, value: validCerts.length > 0 ? validCerts.map(c => c.name).join(", ") : "-" },
                    { label: t.review.kids, value: canTeachKids === true
                        ? (kidsTiers.length > 0
                          ? kidsTiers.map(v => t.kidsTiers[v]?.label ?? v).join(", ")
                          : t.yes)
                        : t.no },
                    { label: t.review.exp, value: exp ? t.expOptions[EXP_VALUES.indexOf(exp as typeof EXP_VALUES[number])] ?? exp : "" },
                    { label: t.review.video, value: videoLink || "-" },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between px-5 py-3">
                      <span className="text-xs text-slate-400">{r.label}</span>
                      <span className="text-sm font-medium text-right max-w-[60%]">{r.value}</span>
                    </div>
                  ))}
                  {motivation && (
                    <div className="px-5 py-3">
                      <span className="text-xs text-slate-400 block mb-1">{t.review.motiv}</span>
                      <p className="text-sm text-slate-600">{motivation}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* SUCCESS */}
            {success && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-bold mb-3">{t.successTitle}</h2>
                <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">{t.successDesc}</p>
                <Link href="/" className="inline-block bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all">{t.successHome}</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* WIZARD FOOTER */}
      {!success && (
        <div className="bg-white border-t border-slate-100">
          <div className="max-w-xl mx-auto px-4 py-4 flex justify-between">
            <button onClick={() => step === 1 ? setStep(0) : setStep(step - 1)} className="text-sm text-slate-500 hover:text-slate-900 px-6 py-3 rounded-full transition-colors">
              ← {t.back}
            </button>
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext(step)}
                className="bg-[#1A9E9E] hover:bg-[#178888] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-full text-sm transition-all active:scale-95">
                {t.next}
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
                {loading && <Loader2 className="animate-spin h-4 w-4" />}
                {loading ? t.sending : t.submit}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
