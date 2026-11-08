# [isyarat-b1b2-v1] Kamus isyarat ASL B2.5 "Interpreting & Translation — Penjurubahasaan & Terjemahan".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli (terutama PROFESSIONAL, TRUST, LISTEN,
#    ADD, EXACT, PATIENT yang variasinya banyak). ETHICS dieja jari.

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_ALAS = dict(p=A(0.03, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"

# ── Juru bahasa & bahasa ───────────────────────────────────────────────────

S("B25_TRANSLATE", "Menerjemahkan", "Juru bahasa", [
    k(0, p=A(-0.01, -0.37, 1.25), a="telunjuk", b="T", j="kiri+0.3*depan", tp="kiri+0.3*bawah"),
    *bolak(0.15, 0.18, 4, {"putar": 45}, {"putar": -45}),
    k(0.85, putar=0),
], L=[k(0, p=A(0.01, -0.37, 1.25), a="telunjuk", b="T", j="kanan+0.3*depan", tp="kanan+0.3*atas"),
      *bolak(0.15, 0.18, 4, {"putar": 45}, {"putar": -45}), k(0.85, putar=0)],
  gloss="TRANSLATE",
  cara="Dua tangan T saling bersentuhan lalu diputar bolak-balik (seperti INTERPRET, tetapi bentuk T).")

S("B25_LANGUAGE", "Bahasa", "Juru bahasa", [
    k(0, p=A(-0.02, -0.40, 1.24), a="jempol", b="L", j="depan", tp="bawah"),
    k(0.15),
    k(0.3, p=A(-0.06, -0.40, 1.24), putar=-20), k(0.45, p=A(-0.10, -0.40, 1.24), putar=20),
    k(0.6, p=A(-0.14, -0.40, 1.24), putar=-20), k(0.75, putar=0),
    k(0.9),
], L=cermin([
    k(0, p=A(-0.02, -0.40, 1.24), a="jempol", b="L", j="depan", tp="bawah"),
    k(0.15),
    k(0.3, p=A(-0.06, -0.40, 1.24), putar=-20), k(0.45, p=A(-0.10, -0.40, 1.24), putar=20),
    k(0.6, p=A(-0.14, -0.40, 1.24), putar=-20), k(0.75, putar=0),
    k(0.9),
]), gloss="LANGUAGE",
  cara="Dua tangan L (telapak ke bawah) berdekatan di depan, lalu ditarik ke samping sambil bergoyang.")

S("B25_WORD", "Kata", "Juru bahasa", [
    k(0, p=A(0.0, -0.38, 1.275), a="telunjuk", b="BABY_O", j="kiri+0.3*atas", tp="kiri"),
    k(0.15),
    k(0.35, p=A(0.012, -0.38, 1.275)),
    k(0.5, p=A(-0.01, -0.38, 1.275)),
    k(0.65, p=A(0.012, -0.38, 1.275)),
    k(0.85),
], L=[k(0, p=A(0.03, -0.38, 1.30), a="telunjuk", b="1", j="atas", tp="kanan")],
  gloss="WORD", cara="Jari kanan menjepit (ibu jari & telunjuk) menyentuh sisi telunjuk kiri yang tegak dua kali (sepanjang satu kata).")

S("B25_SENTENCE", "Kalimat", "Juru bahasa", [
    k(0, p=A(-0.012, -0.40, 1.24), a="telunjuk", b="F", j="atas+0.6*depan", tp="dalam"),
    k(0.15),
    k(0.3, p=A(-0.05, -0.40, 1.245)), k(0.45, p=A(-0.09, -0.40, 1.235)),
    k(0.6, p=A(-0.13, -0.40, 1.245)),
    k(0.8),
], L=cermin([
    k(0, p=A(-0.012, -0.40, 1.24), a="telunjuk", b="F", j="atas+0.6*depan", tp="dalam"),
    k(0.15),
    k(0.3, p=A(-0.05, -0.40, 1.245)), k(0.45, p=A(-0.09, -0.40, 1.235)),
    k(0.6, p=A(-0.13, -0.40, 1.245)),
    k(0.8),
]), gloss="SENTENCE",
  cara="Dua tangan F bertemu di tengah lalu ditarik ke samping sambil bergelombang (rangkaian kata).")

S("B25_EXPLAIN", "Menjelaskan", "Juru bahasa", [
    k(0, p=A(-0.03, -0.38, 1.25), a="telunjuk", b="F", j="depan", tp="kiri"),
    *bolak(0.15, 0.18, 4, {"p": A(-0.03, -0.46, 1.25)}, {"p": A(-0.03, -0.34, 1.25)}),
    k(0.9),
], L=[k(0, p=A(0.03, -0.46, 1.25), a="telunjuk", b="F", j="depan", tp="kanan"),
      *bolak(0.15, 0.18, 4, {"p": A(0.03, -0.34, 1.25)}, {"p": A(0.03, -0.46, 1.25)}), k(0.9)],
  gloss="EXPLAIN", cara="Dua tangan F saling berhadapan bergerak maju-mundur bergantian (menguraikan).")

S("B25_TALK", "Berbicara (lisan)", "Juru bahasa", [
    k(0, p="mulut+0.03*depan", a="telunjuk", b="1", j="atas+0.3*dalam", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "mulut+0.12*depan+0.01*bawah"}, {"p": "mulut+0.03*depan"}),
    k(0.8),
], gloss="TALK", cara="Telunjuk tegak di depan bibir bergerak maju-mundur dua kali (kata-kata keluar dari mulut).")

S("B25_VOICE", "Suara / menyuarakan", "Juru bahasa", [
    k(0, p="leher+0.03*depan+0.02*bawah", a="ujung", b="BENT_V", j="belakang+0.3*atas", tp="bawah+0.3*belakang"),
    k(0.15),
    k(0.55, p="dagu+0.05*depan+0.03*bawah", j="atas+0.4*belakang"),
    k(0.75),
], gloss="VOICE", cara="Ujung jari V bengkok di leher, digerakkan naik ke arah dagu (suara keluar dari tenggorokan).")

S("B25_LISTEN", "Mendengar / mendengarkan", "Juru bahasa", [
    k(0, p="telinga+0.06*luar+0.04*depan", a="telunjuk", b="1", j="dalam+0.3*atas+0.2*belakang", tp="belakang+0.3*bawah"),
    k(0.15),
    k(0.35, p="telinga+0.02*luar+0.015*depan"),
    k(0.5, p="telinga+0.05*luar+0.035*depan"),
    k(0.65, p="telinga+0.02*luar+0.015*depan"),
    k(0.85),
], gloss="LISTEN",
  cara="Telunjuk menunjuk dan mendekat ke telinga dua kali (HEAR/LISTEN). Variasi: tangan 3 bengkok di dekat telinga.")

S("B25_ETHICS", "Etika", "Etika", [], gloss="ETHICS", cara="Dieja jari: E-T-H-I-C-S.")

# ── Etika & sikap ──────────────────────────────────────────────────────────

S("B25_SECRET", "Rahasia / kerahasiaan", "Etika", [
    k(0, p="mulut+0.05*depan", a="jempol", b="A", j="atas+0.3*dalam", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "mulut+0.012*depan"}, {"p": "mulut+0.04*depan"}),
    k(0.8, p="mulut+0.012*depan"),
], gloss="SECRET", cara="Ibu jari kepalan A diketukkan ke bibir dua kali (tutup mulut).")

S("B25_RESPECT", "Hormat / menghormati", "Etika", [
    k(0, p="dahi+0.03*depan+0.04*luar", a="telunjuk", b="R", j="atas+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p="dahi+0.22*depan+0.18*bawah+0.04*luar", j="atas+0.6*depan"),
    k(0.8),
], kepala=[(0.15, 0, 0, 0), (0.6, 8, 0, 0), (0.8, 2, 0, 0)],
  gloss="RESPECT", cara="Tangan R di samping dahi melengkung maju-turun, kepala sedikit menunduk (seperti memberi hormat).")

S("B25_TRUST", "Percaya / kepercayaan", "Etika", [
    k(0, p=A(-0.02, -0.38, 1.38), a="telapak", b="C", j="dalam+0.3*depan", tp="kiri"),
    k(0.15),
    k(0.4, p=A(-0.02, -0.38, 1.33), b="S"),
    k(0.7),
], L=[k(0, p=A(0.0, -0.38, 1.27), a="telapak", b="C", j="kanan+0.3*depan", tp="kanan"),
      k(0.15), k(0.4, p=A(0.0, -0.38, 1.22), b="S"), k(0.7)],
  gloss="TRUST", cara="Dua tangan C, satu di atas yang lain, mengepal (S) sambil turun sedikit — seperti menggenggam tali dengan yakin.")

S("B25_RESPONSIBLE", "Bertanggung jawab", "Etika", [
    k(0, p="bahu_kanan+0.09*depan+0.01*bawah+0.02*kiri", a="ujung", b="BENT_B", j="bawah+0.5*belakang", tp="bawah+0.4*belakang"),
    k(0.15, p="bahu_kanan+0.05*depan+0.01*bawah+0.02*kiri"),
    k(0.5, p="bahu_kanan+0.05*depan+0.05*bawah+0.02*kiri"),
    k(0.75),
], L=[k(0, p="bahu_kanan+0.11*depan+0.04*bawah+0.09*kiri", a="ujung", b="BENT_B", j="bawah+0.5*belakang", tp="bawah+0.4*belakang"),
      k(0.15, p="bahu_kanan+0.07*depan+0.04*bawah+0.09*kiri"), k(0.5, p="bahu_kanan+0.07*depan+0.08*bawah+0.09*kiri"), k(0.75)],
  gloss="RESPONSIBLE", cara="Ujung jari dua tangan tertekuk ditekan ke bahu kanan (beban di pundak).")

S("B25_PROFESSIONAL", "Profesional", "Etika", [
    k(0, p=A(0.02, -0.33, 1.27), a="tengah", b="P", j="depan+0.4*bawah", tp="dalam+0.3*bawah"),
    k(0.15),
    k(0.6, p=A(0.02, -0.47, 1.25)),
    k(0.8),
], L=[k(0, p=A(0.03, -0.38, 1.24), a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah+0.5*dalam")],
  gloss="PROFESSIONAL",
  cara="Tangan P meluncur maju di sepanjang telunjuk kiri. ⚠️ Variasi banyak; sebagian orang mengeja P-R-O.")

S("B25_SKILL", "Keahlian / terampil", "Etika", [
    k(0, p=A(0.03, -0.37, 1.25), a="telapak", b="C", j="atas+0.3*depan", tp="kiri"),
    k(0.15),
    k(0.5, p=A(0.03, -0.42, 1.19), b="A"),
    k(0.7),
], L=[k(0, p=A(0.04, -0.36, 1.25), a="sisi_kelingking", b="FLAT", j="depan+0.4*atas", tp="kanan")],
  gloss="SKILL", cara="Tangan kanan menggenggam tepi kelingking tangan kiri yang tegak, lalu menarik turun-maju sambil mengepal.")

S("B25_EXPERIENCE", "Pengalaman", "Etika", [
    k(0, p="pipi+0.04*luar+0.02*depan+0.03*atas", a="ujung", b="5", j="atas+0.3*dalam", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.55, p="pipi+0.10*luar+0.07*depan+0.02*atas", b="FLAT_O"),
    k(0.75),
], gloss="EXPERIENCE", cara="Tangan 5 di pipi/pelipis ditarik menjauh sambil menguncup menjadi O-pipih.")

S("B25_DECIDE", "Memutuskan", "Etika", [
    k(0, p=_DAHI + "+0.05*depan", a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang"),
    k(0.2, p=_DAHI),
    k(0.3),
    k(0.55, p=A(-0.05, -0.40, 1.32), b="F", j="depan+0.3*atas", tp="dalam"),
    k(0.75, p=A(-0.05, -0.40, 1.22)),
    k(0.9),
], L=[k(0, **IST["L"]), k(0.55, p=A(0.05, -0.40, 1.32), a="telunjuk", b="F", j="depan+0.3*atas", tp="dalam"),
      k(0.75, p=A(0.05, -0.40, 1.22)), k(0.9)],
  kepala=[(0.55, 0, 0, 0), (0.75, 8, 0, 0), (0.9, 2, 0, 0)],
  gloss="DECIDE", cara="Telunjuk menyentuh dahi (THINK), lalu dua tangan F turun bersamaan dengan tegas.")

# ── Strategi penjurubahasaan ───────────────────────────────────────────────

S("B25_WAIT", "Menunggu / tunggu", "Strategi", [
    k(0, p="netral+0.04*luar+0.02*bawah", a="telapak", b="5", j="depan+0.3*dalam", tp="atas"),
    *bolak(0.15, 0.12, 6, {"b": "CLAW"}, {"b": "5"}),
    k(0.95),
], L=[k(0, p="netral_kiri+0.10*depan+0.02*bawah", a="telapak", b="5", j="depan+0.3*dalam", tp="atas"),
      *bolak(0.15, 0.12, 6, {"b": "CLAW"}, {"b": "5"}), k(0.95)],
  gloss="WAIT", cara="Dua tangan 5 menghadap atas (kiri lebih depan), jari-jari digerakkan bergelombang.")

S("B25_STOP", "Berhenti / stop", "Strategi", [
    k(0, p=A(0.03, -0.31, 1.30), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="kiri"),
    k(0.15),
    k(0.35, p=A(0.03, -0.31, 1.18)),
    k(0.65),
], L=[k(0, **_ALAS)], kepala=[(0.15, 0, 0, 0), (0.35, 6, 0, 0), (0.65, 0, 0, 0)],
  gloss="STOP", cara="Sisi kelingking tangan datar kanan dihentakkan sekali ke telapak kiri.")

S("B25_ADD", "Menambah (tambahan)", "Strategi", [
    k(0, p="netral+0.12*luar+0.06*bawah", a="ujung", b="5", j="dalam+0.4*atas", tp="atas+0.3*dalam"),
    k(0.15),
    k(0.6, p=A(0.02, -0.37, 1.19), b="FLAT_O", j="atas+0.3*dalam"),
    k(0.8),
], L=[k(0, p=A(0.03, -0.37, 1.22), a="ujung", b="FLAT_O", j="bawah+0.2*depan", tp="bawah")],
  gloss="ADD", cara="Tangan 5 kanan naik dari samping sambil menguncup (O pipih) dan bertemu dengan ujung jari tangan kiri.")

S("B25_EXACT", "Tepat / persis / akurat", "Strategi",
  lingkar(0, 0.45, A(0.0, -0.37, 1.33), 0.025, "kanan", "depan", n=6, mulai=0,
          a="telunjuk", b="F", j="kiri+0.4*bawah", tp="bawah+0.3*kiri") +
  [k(0.7, p=A(0.0, -0.37, 1.285)), k(0.9)],
  L=[k(0, p=A(0.02, -0.37, 1.26), a="telunjuk", b="F", j="kanan+0.4*atas", tp="atas+0.3*kanan")],
  gloss="EXACT", cara="Tangan F kanan berputar kecil di atas tangan F kiri lalu ujung jarinya mendarat tepat bersentuhan.")

S("B25_PROBLEM", "Masalah", "Strategi", [
    k(0, p=A(-0.018, -0.38, 1.25), a="buku", b="BENT_V", j="kiri+0.3*bawah", tp="belakang"),
    *bolak(0.15, 0.18, 4, {"putar": 40}, {"putar": -30}),
    k(0.85, putar=0),
], L=[k(0, p=A(0.018, -0.38, 1.25), a="buku", b="BENT_V", j="kanan+0.3*bawah", tp="belakang"),
      *bolak(0.15, 0.18, 4, {"putar": -40}, {"putar": 30}), k(0.85, putar=0)],
  wajah="sedih", gloss="PROBLEM", cara="Buku jari dua tangan V bengkok saling beradu dan dipuntir berlawanan arah.")

S("B25_PREPARE", "Bersiap / menyiapkan", "Strategi", [
    k(0, p=A(0.07, -0.40, 1.24), a="telapak", b="FLAT", j="depan", tp="kiri"),
    k(0.15),
    k(0.35, p=A(0.02, -0.40, 1.24)), k(0.55, p=A(-0.03, -0.40, 1.24)), k(0.75, p=A(-0.08, -0.40, 1.24)),
    k(0.9),
], L=[k(0, p=A(0.17, -0.40, 1.24), a="telapak", b="FLAT", j="depan", tp="kanan"),
      k(0.15), k(0.35, p=A(0.12, -0.40, 1.24)), k(0.55, p=A(0.07, -0.40, 1.24)), k(0.75, p=A(0.02, -0.40, 1.24)), k(0.9)],
  gloss="PREPARE", cara="Dua telapak datar saling berhadapan (jari ke depan) digeser bertahap ke samping, seperti merapikan barang.")

S("B25_SUPPORT", "Mendukung", "Strategi", [
    k(0, p=A(0.02, -0.36, 1.14), a="buku", b="S", j="atas+0.3*depan", tp="kiri"),
    k(0.15),
    k(0.4, p=A(0.02, -0.36, 1.185)),
    k(0.75, p=A(0.02, -0.36, 1.29)),
    k(0.9),
], L=[k(0, p=A(0.02, -0.36, 1.21), a="sisi_kelingking", b="S", j="depan+0.3*kanan", tp="bawah+0.3*kanan"),
      k(0.4), k(0.75, p=A(0.02, -0.36, 1.315)), k(0.9)],
  gloss="SUPPORT", cara="Kepalan kanan mendorong kepalan kiri dari bawah ke atas (menopang).")

S("B25_TEAM", "Tim", "Strategi", [
    k(0, p=A(-0.03, -0.44, 1.28), a="telapak", b="T", j="atas+0.2*depan", tp="depan+0.5*kiri"),
    k(0.15),
    k(0.45, p=A(-0.12, -0.38, 1.28)),
    k(0.75, p=A(-0.04, -0.28, 1.28), tp="belakang+0.5*kiri"),
    k(0.9),
], L=[k(0, p=A(0.03, -0.44, 1.28), a="telapak", b="T", j="atas+0.2*depan", tp="depan+0.5*kanan"),
      k(0.15), k(0.45, p=A(0.12, -0.38, 1.28)), k(0.75, p=A(0.04, -0.28, 1.28), tp="belakang+0.5*kanan"), k(0.9)],
  gloss="TEAM", cara="Seperti GROUP, tetapi dengan dua tangan T: bertemu di depan, melingkar ke luar, bertemu lagi di dekat badan.")

# ── Konteks medis, pendidikan, kerja & hukum ───────────────────────────────

S("B25_PATIENT", "Pasien", "Medis", [
    k(0, p="bahu_kiri+0.05*depan+0.03*bawah", a="tengah", b="P", j="bawah+0.5*kiri", tp="kiri+0.3*belakang"),
    k(0.15),
    k(0.35, p="bahu_kiri+0.05*depan+0.10*bawah"),
    k(0.5, p="bahu_kiri+0.05*depan+0.065*bawah+0.03*kanan"),
    k(0.7, p="bahu_kiri+0.05*depan+0.065*bawah+0.03*kiri"),
    k(0.85),
], L=[k(0, **IST["L"])], gloss="PATIENT",
  cara="Ujung jari tengah tangan P menggambar tanda palang di lengan atas kiri (palang merah), biasanya disusul PERSON.")

S("B25_HEART", "Jantung / hati (perasaan)", "Medis", [
    k(0, p="dada_kiri+0.04*depan", a="tengah", b="OPEN_8", j="kiri+0.3*atas", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "dada_kiri+0.008*depan"}, {"p": "dada_kiri+0.04*depan"}),
    k(0.8, p="dada_kiri+0.008*depan"),
], gloss="HEART", cara="Ujung jari tengah (bentuk 8 terbuka) mengetuk dada kiri, di letak jantung, dua kali.")

S("B25_BREATHE", "Bernapas", "Medis", [
    k(0, p="dada+0.012*depan", a="telapak", b="FLAT", j="kiri+0.2*atas", tp="belakang"),
    *bolak(0.15, 0.25, 4, {"p": "dada+0.07*depan"}, {"p": "dada+0.012*depan"}),
    k(1.05),
], L=[k(0, p="perut+0.012*depan+0.03*atas", a="telapak", b="FLAT", j="kanan+0.2*atas", tp="belakang"),
      *bolak(0.15, 0.25, 4, {"p": "perut+0.07*depan+0.03*atas"}, {"p": "perut+0.012*depan+0.03*atas"}), k(1.05)],
  gloss="BREATHE", cara="Dua telapak di dada & perut bergerak maju-mundur bersama, seperti dada mengembang saat bernapas.")

S("B25_SURGERY", "Operasi (bedah)", "Medis", [
    k(0, p=A(0.03, -0.30, 1.21), a="jempol", b="A", j="depan+0.3*dalam", tp="kiri"),
    k(0.15, p=A(0.03, -0.30, 1.183)),
    k(0.6, p=A(0.03, -0.38, 1.183)),
    k(0.8, p=A(0.03, -0.38, 1.22)),
], L=[k(0, **_ALAS)], gloss="SURGERY",
  cara="Ujung ibu jari kepalan A menggores lurus di telapak kiri, seperti pisau bedah. Lokasi bisa dipindah ke bagian tubuh yang dioperasi.")

S("B25_LECTURE", "Kuliah / ceramah", "Pendidikan", [
    k(0, p="bahu_kanan+0.20*depan+0.06*atas+0.02*luar", a="pergelangan", b="FLAT", j="atas", tp="kiri"),
    *bolak(0.15, 0.18, 4, {"j": "atas+0.5*depan"}, {"j": "atas"}),
    k(0.9),
], gloss="LECTURE", cara="Tangan datar tegak di samping kepala (telapak ke samping) diayun maju-mundur di pergelangan, seperti dosen berceramah.")

S("B25_JUDGE", "Hakim / pengadilan", "Hukum", [
    k(0, p="netral+0.04*luar+0.04*atas", a="telunjuk", b="F", j="depan", tp="dalam"),
    *bolak(0.15, 0.18, 4, {"p": "netral+0.04*luar+0.10*atas"}, {"p": "netral+0.04*luar"}),
    k(0.9),
], L=cermin([
    k(0, p="netral+0.04*luar+0.04*atas", a="telunjuk", b="F", j="depan", tp="dalam"),
    *bolak(0.15, 0.18, 4, {"p": "netral+0.04*luar"}, {"p": "netral+0.04*luar+0.10*atas"}),
    k(0.9),
]), gloss="JUDGE", cara="Dua tangan F naik-turun bergantian seperti timbangan keadilan (JUDGE/COURT; hakim = JUDGE + PERSON).")
