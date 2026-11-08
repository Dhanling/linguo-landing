# [isyarat-b1b2-v1] Kamus isyarat ASL B1.5 "Deaf Community & Daily Life — Komunitas Tuli & Kehidupan".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# Kode baru berawalan B15_ (gloss= tanpa awalan). Kode A1–A2 dipakai ulang di dek.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli, terutama FORBID, VIBRATE, OPPRESS,
#    HISTORY, COCHLEAR-IMPLANT, EXAMINE (CHECK) yang variasinya banyak.

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_KIRI_ATAS = dict(p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
_KIRI_TEGAK = dict(p=A(0.035, -0.37, 1.25), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")


def _cermin_putar(keys):
    """cermin() + puntiran dibalik untuk tangan kiri."""
    return [dict(kk, putar=-kk["putar"]) if "putar" in kk else kk for kk in cermin(keys)]


# ── Keluarga & rumah ───────────────────────────────────────────────────────

S("B15_PARENTS", "Orang tua", "Keluarga", [
    k(0, p="dagu+0.03*depan+0.01*luar", a="tengah", b="P", j="depan+0.6*bawah+0.3*dalam", tp="dalam+0.3*bawah"),
    k(0.15, p="dagu+0.008*depan+0.01*luar"),
    k(0.3),
    k(0.6, p="dahi+0.012*depan+0.02*luar+0.03*bawah"),
    k(0.8),
], gloss="PARENTS", cara="Ujung jari tengah bentuk P menyentuh dagu (MOTHER), lalu dahi (FATHER).")

S("B15_CHILD", "Anak", "Keluarga", [
    k(0, p=A(-0.15, -0.38, 1.10), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.15, 0.16, 4, {"p": A(-0.15, -0.38, 1.065)}, {"p": A(-0.15, -0.38, 1.10)}),
    k(0.8),
], gloss="CHILD", cara="Telapak datar menghadap bawah setinggi anak kecil, ditepuk turun dua kali.")

S("B15_HOME", "Rumah / di rumah", "Keluarga", [
    k(0, p="sudut_mulut+0.012*depan+0.01*luar", a="ujung", b="FLAT_O", j="atas+0.6*dalam+0.3*belakang", tp="dalam+0.3*belakang"),
    k(0.15),
    k(0.45, p="pipi+0.012*depan+0.025*atas"),
    k(0.65),
], gloss="HOME", cara="Ujung jari O-pipih menyentuh sudut mulut (EAT), lalu pipi (SLEEP).")

S("B15_CODA", "CODA (anak dengar dari orang tua Tuli)", "Keluarga", [],
  gloss="CODA", cara="Dieja jari: C-O-D-A (Child Of Deaf Adults).")

# ── Bahasa & pendidikan ────────────────────────────────────────────────────

_R = [
    k(0, p=A(-0.03, -0.38, 1.24), a="jempol", b="L", j="atas+0.3*depan", tp="depan+0.4*bawah"),
    k(0.15),
    k(0.35, p=A(-0.08, -0.385, 1.255)),
    k(0.55, p=A(-0.13, -0.38, 1.235)),
    k(0.75, p=A(-0.18, -0.385, 1.25)),
    k(0.9),
]
S("B15_LANGUAGE", "Bahasa", "Bahasa", _R, L=cermin(_R), gloss="LANGUAGE",
  cara="Dua tangan L (ibu jari hampir bersentuhan) ditarik berpisah ke samping sambil bergelombang.")

S("B15_TALK", "Bicara / berbicara (lisan)", "Bahasa", [
    k(0, p="dagu+0.02*depan+0.01*luar", a="sisi_telunjuk", b="4", j="atas+0.3*dalam", tp="dalam"),
    *bolak(0.15, 0.16, 4, {"p": "dagu+0.10*depan+0.01*luar"}, {"p": "dagu+0.02*depan+0.01*luar"}),
    k(0.85),
], gloss="TALK", cara="Sisi telunjuk tangan 4 di depan dagu didorong maju dua kali (suara keluar dari mulut).")

S("B15_ORAL", "Oral / metode lisan", "Bahasa",
  lingkar(0, 0.9, "mulut+0.035*depan", 0.028, "luar", "atas", n=8, mulai=90, putaran=1,
          a="telunjuk", b="1", j="dalam+0.5*atas", tp="belakang") + [k(1.05)],
  gloss="ORAL", cara="Telunjuk berputar satu kali mengelilingi mulut (menunjuk gerak bibir/bicara).")

S("B15_UNIVERSITY", "Universitas", "Pendidikan", [
    k(0, p=A(0.03, -0.32, 1.185), a="telapak", b="U", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.4, p=A(0.04, -0.33, 1.25), j="depan+0.3*dalam"),
    k(0.6, p=A(-0.01, -0.36, 1.32)),
    k(0.8, p=A(-0.06, -0.33, 1.26)),
    k(0.95),
], L=[k(0, **_KIRI_ATAS)],
  gloss="UNIVERSITY", cara="Tangan U di telapak kiri, lalu naik berputar ke atas (seperti COLLEGE dengan huruf U).")

S("B15_EQUAL", "Setara / sama rata", "Pendidikan", [
    k(0, p=A(-0.05, -0.38, 1.22), a="ujung", b="BENT_B", j="dalam+0.3*depan", tp="bawah"),
    *bolak(0.15, 0.16, 4, {"p": A(-0.012, -0.38, 1.22)}, {"p": A(-0.05, -0.38, 1.22)}),
    k(0.8, p=A(-0.012, -0.38, 1.22)),
], L=cermin([
    k(0, p=A(-0.05, -0.38, 1.22), a="ujung", b="BENT_B", j="dalam+0.3*depan", tp="bawah"),
    *bolak(0.15, 0.16, 4, {"p": A(-0.012, -0.38, 1.22)}, {"p": A(-0.05, -0.38, 1.22)}),
    k(0.8, p=A(-0.012, -0.38, 1.22)),
]), gloss="EQUAL", cara="Dua tangan B bengkok (telapak ke bawah), ujung jarinya diketukkan bertemu dua kali.")

# ── Pekerjaan ──────────────────────────────────────────────────────────────

S("B15_APPLY", "Melamar / mendaftar", "Pekerjaan", [
    k(0, p="dada_kanan+0.012*depan+0.02*atas", a="telunjuk", b="F", j="atas+0.3*dalam", tp="dalam+0.6*belakang"),
    *bolak(0.15, 0.16, 4, {"p": "dada_kanan+0.07*depan+0.02*atas"}, {"p": "dada_kanan+0.012*depan+0.02*atas"}),
    k(0.85),
], gloss="APPLY", cara="Telunjuk & ibu jari (F) mencubit baju di dada kanan lalu menariknya maju dua kali (mengajukan diri).")

S("B15_HIRE", "Menerima kerja / merekrut", "Pekerjaan", [
    k(0, p=A(-0.20, -0.44, 1.20), a="telapak", b="H", j="depan+0.4*luar", tp="atas"),
    k(0.15),
    k(0.6, p=A(-0.07, -0.27, 1.20), j="dalam+0.5*depan"),
    k(0.8),
], gloss="HIRE", cara="Tangan H (telapak ke atas) dari samping disapu masuk ke arah badan (seperti INVITE dengan H).")

S("B15_EARN", "Mendapat penghasilan / gaji", "Pekerjaan", [
    k(0, p=A(-0.03, -0.40, 1.185), a="sisi_kelingking", b="C", j="atas+0.4*depan", tp="dalam"),
    k(0.15),
    k(0.6, p=A(0.03, -0.27, 1.185), b="S"),
    k(0.8),
], L=[k(0, **_KIRI_ATAS)],
  gloss="EARN", cara="Sisi kelingking tangan C menyapu telapak kiri ke arah badan sambil mengepal (mengumpulkan uang).")

S("B15_SKILL", "Keterampilan / mahir", "Pekerjaan", [
    k(0, p=A(0.005, -0.36, 1.24), a="telapak", b="C", j="dalam+0.3*depan", tp="atas+0.4*belakang"),
    k(0.15),
    k(0.3, p=A(0.012, -0.37, 1.22), b="A"),
    k(0.65, p=A(-0.01, -0.46, 1.14)),
    k(0.85),
], L=[k(0, **_KIRI_TEGAK)],
  gloss="SKILL", cara="Tangan kanan menggenggam sisi kelingking tangan kiri yang tegak, lalu ditarik maju-turun sambil mengepal.")

S("B15_EXPERIENCE", "Pengalaman", "Pekerjaan", [
    k(0, p="pelipis+0.012*depan+0.03*bawah+0.01*luar", a="ujung", b="5", j="atas+0.3*dalam", tp="dalam+0.3*belakang"),
    k(0.15),
    k(0.55, p="pelipis+0.06*luar+0.08*depan+0.05*bawah", b="FLAT_O"),
    k(0.75),
], gloss="EXPERIENCE", cara="Ujung jari tangan 5 di pelipis ditarik menjauh sambil mengatup jadi O-pipih (seperti mencabut uban).")

# ── Kesehatan ──────────────────────────────────────────────────────────────

_R = [
    k(0, p="dahi+0.10*depan+0.04*luar+0.04*bawah", a="telunjuk", b="1", j="dalam+0.2*depan", tp="belakang"),
    *bolak(0.15, 0.16, 5, {"putar": 35}, {"putar": -30}),
    k(0.95, putar=0),
]
S("B15_HEADACHE", "Sakit kepala", "Kesehatan", _R, L=_cermin_putar(_R), wajah="sedih",
  gloss="HEADACHE", cara="HURT di depan dahi: dua telunjuk saling menunjuk dan diputar berlawanan arah.")

S("B15_DIZZY", "Pusing / pening", "Kesehatan",
  lingkar(0, 1.0, "mata+0.12*depan+0.01*luar", 0.04, "luar", "atas", n=10, mulai=90, putaran=2,
          a="telapak", b="CLAW", j="atas+0.2*dalam", tp="belakang") + [k(1.15)],
  wajah="sedih", gloss="DIZZY", cara="Tangan cakar di depan mata berputar beberapa kali (pandangan berputar).")

S("B15_NAUSEA", "Mual", "Kesehatan",
  lingkar(0, 1.0, "perut+0.035*depan", 0.035, "luar", "atas", n=10, mulai=90, putaran=2,
          a="telapak", b="CLAW", j="atas+0.3*dalam", tp="belakang") + [k(1.15)],
  wajah="sedih", gloss="NAUSEA", cara="Tangan cakar di depan perut berputar beberapa kali (perut bergejolak).")

S("B15_EXAMINE", "Memeriksa / mengecek", "Kesehatan", [
    k(0, p="mata+0.05*depan+0.03*bawah", a="telunjuk", b="1", j="atas+0.4*dalam", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.4, p=A(0.0, -0.27, 1.19), j="depan+0.3*dalam", tp="bawah"),
    k(0.7, p=A(0.02, -0.40, 1.19)),
    k(0.85),
], L=[k(0, **IST["L"]), k(0.3, **_KIRI_ATAS), k(0.85)],
  gloss="CHECK", cara="Telunjuk dari bawah mata (LOOK) lalu menyusur telapak kiri ke depan (memeriksa dengan teliti).")

# ── Pendengaran & teknologi ────────────────────────────────────────────────

S("B15_HARD_OF_HEARING", "Hard of hearing (kurang dengar)", "Pendengaran", [
    k(0, p="netral+0.06*atas+0.03*dalam", a="ujung", b="H", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.3, p="netral+0.035*atas+0.01*dalam"),
    k(0.45, p="netral+0.06*atas+0.02*luar"),
    k(0.6, p="netral+0.035*atas+0.05*luar"),
    k(0.75),
], gloss="HARD-OF-HEARING", cara="Tangan H memantul turun dua kali sambil bergeser ke kanan (H-H).")

S("B15_HEARING_AID", "Alat bantu dengar", "Pendengaran", [
    k(0, p="telinga+0.03*luar+0.01*depan+0.02*bawah", a="telunjuk", b="BENT_V", j="dalam+0.6*atas+0.3*depan", tp="dalam+0.4*belakang"),
    *bolak(0.15, 0.16, 4, {"putar": 25}, {"putar": -20}),
    k(0.8, putar=0),
], gloss="HEARING-AID", cara="Tangan V bengkok di telinga diputar bolak-balik kecil (alat yang dipasang di telinga).")

S("B15_COCHLEAR_IMPLANT", "Implan koklea", "Pendengaran", [
    k(0, p="telinga+0.03*belakang+0.01*atas+0.05*luar", a="telunjuk", b="BENT_V", j="dalam+0.6*atas", tp="dalam+0.4*belakang"),
    *bolak(0.15, 0.16, 4, {"p": "telinga+0.03*belakang+0.01*atas+0.02*luar"}, {"p": "telinga+0.03*belakang+0.01*atas+0.05*luar"}),
    k(0.8, p="telinga+0.03*belakang+0.01*atas+0.02*luar"),
], gloss="COCHLEAR-IMPLANT", cara="Ujung jari V bengkok diketukkan dua kali di kepala belakang telinga (letak magnet implan).")

S("B15_VRS", "VRS (Video Relay Service)", "Teknologi", [],
  gloss="VRS", cara="Dieja jari: V-R-S. Layanan telepon lewat juru bahasa di video.")

S("B15_FLASH", "Lampu berkedip / notifikasi cahaya", "Teknologi", [
    k(0, p=A(-0.14, -0.36, 1.50), a="pergelangan", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    *bolak(0.15, 0.15, 6, {"b": "5"}, {"b": "FLAT_O"}),
    k(1.0, b="5"),
], gloss="FLASH", cara="Tangan O-pipih di atas samping kepala membuka-mengatup berulang (lampu berkedip).")

_R = [
    k(0, p=A(-0.09, -0.38, 1.20), a="telapak", b="CLAW", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.08, 10, {"p": A(-0.105, -0.38, 1.20)}, {"p": A(-0.075, -0.38, 1.20)}),
    k(1.0),
]
S("B15_VIBRATE", "Bergetar / getar", "Teknologi", _R, L=cermin(_R),
  gloss="VIBRATE", cara="Dua tangan cakar (telapak ke bawah) digoyang cepat kecil ke kiri-kanan.")

S("B15_LIGHT", "Lampu / cahaya", "Teknologi", [
    k(0, p=A(-0.13, -0.36, 1.52), a="pergelangan", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.5, p=A(-0.14, -0.37, 1.50), b="5"),
    k(0.7),
], gloss="LIGHT", cara="Tangan O-pipih di atas samping kepala membuka ke bawah (cahaya lampu memancar).")

# ── Juru bahasa & etika ────────────────────────────────────────────────────

S("B15_SECRET", "Rahasia", "Etika", [
    k(0, p="mulut+0.03*depan", a="jempol", b="A", j="atas+0.2*dalam", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "mulut+0.006*depan"}, {"p": "mulut+0.03*depan"}),
    k(0.8, p="mulut+0.006*depan"),
], gloss="SECRET", cara="Ibu jari kepalan A mengetuk bibir dua kali (tutup mulut = rahasia).")

S("B15_RESPECT", "Menghormati / hormat", "Etika", [
    k(0, p="dahi+0.02*depan+0.035*luar", a="ujung", b="R", j="atas+0.4*dalam", tp="dalam+0.3*belakang"),
    k(0.15),
    k(0.6, p="dahi+0.16*depan+0.16*bawah+0.06*luar", j="atas+0.5*depan", tp="dalam"),
    k(0.8),
], kepala=[(0.2, 0, 0, 0), (0.6, 8, 0, 0), (0.85, 2, 0, 0)],
  gloss="RESPECT", cara="Tangan R di dahi bergerak melengkung turun ke depan, kepala sedikit menunduk.")

_R = [
    k(0, p=A(-0.02, -0.38, 1.24), a="telunjuk", b="X", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p=A(-0.03, -0.38, 1.24), putar=170),
    k(0.75),
]
S("B15_CHANGE", "Berubah / mengubah", "Etika", _R, L=_cermin_putar(_R),
  gloss="CHANGE", cara="Dua tangan X saling menempel lalu diputar bertukar posisi (yang atas jadi di bawah).")

S("B15_DECIDE", "Memutuskan / keputusan", "Etika", [
    k(0, p="pelipis+0.02*dalam+0.02*atas+0.05*depan", a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang"),
    k(0.2, p="pelipis+0.02*dalam+0.02*atas+0.006*depan"),
    k(0.3),
    k(0.55, p=A(-0.08, -0.38, 1.30), b="F", j="depan+0.3*atas", tp="dalam"),
    k(0.75, p=A(-0.08, -0.38, 1.20)),
    k(0.9),
], L=[k(0, **IST["L"]), k(0.5, p=A(0.08, -0.38, 1.30), a="telunjuk", b="F", j="depan+0.3*atas", tp="dalam"),
      k(0.75, p=A(0.08, -0.38, 1.20)), k(0.9)],
  kepala=[(0.5, 0, 0, 0), (0.75, 10, 0, 0), (0.9, 3, 0, 0)],
  gloss="DECIDE", cara="Telunjuk menyentuh dahi (THINK), lalu dua tangan F turun bersamaan dengan tegas.")

# ── Komunitas & olahraga ───────────────────────────────────────────────────

_R = [
    k(0, p=A(-0.035, -0.33, 1.25), a="telapak", b="T", j="atas", tp="depan"),
    k(0.15),
    k(0.45, p=A(-0.15, -0.40, 1.25), tp="depan+0.7*luar"),
    k(0.8, p=A(-0.04, -0.46, 1.25), tp="belakang+0.3*dalam"),
    k(0.95),
]
S("B15_TEAM", "Tim / regu", "Komunitas", _R, L=cermin(_R),
  gloss="TEAM", cara="Dua tangan T berputar keluar membentuk lingkaran sampai bertemu di depan (gerak CLASS dengan huruf T).")

_R = [
    k(0, p=A(-0.04, -0.34, 1.24), a="telapak", b="A", j="atas+0.4*depan", tp="dalam"),
    *bolak(0.12, 0.15, 6, {"p": A(-0.04, -0.44, 1.24)}, {"p": A(-0.04, -0.32, 1.24)}),
    k(1.0),
]
_L = cermin([
    k(0, p=A(-0.04, -0.44, 1.24), a="telapak", b="A", j="atas+0.4*depan", tp="dalam"),
    *bolak(0.12, 0.15, 6, {"p": A(-0.04, -0.32, 1.24)}, {"p": A(-0.04, -0.44, 1.24)}),
    k(1.0),
])
S("B15_COMPETE", "Bertanding / lomba", "Komunitas", _R, L=_L,
  gloss="COMPETE", cara="Dua kepalan A (ibu jari ke atas) saling berhadapan, bergantian maju-mundur cepat (berlomba).")

S("B15_HISTORY", "Sejarah", "Sejarah", [
    k(0, p="netral+0.08*atas+0.02*dalam", a="ujung", b="H", j="depan+0.4*atas", tp="dalam"),
    *bolak(0.15, 0.16, 4, {"p": "netral+0.04*atas+0.02*dalam"}, {"p": "netral+0.08*atas+0.02*dalam"}),
    k(0.85, p="netral+0.04*atas+0.02*dalam"),
], gloss="HISTORY", cara="Tangan H (telapak ke samping) memantul turun dua kali di depan badan.")

S("B15_PRESIDENT", "Presiden / ketua", "Sejarah", [
    k(0, p=A(-0.035, -0.14, 1.665), a="telunjuk", b="C", j="atas+0.4*dalam", tp="depan+0.3*luar"),
    k(0.15),
    k(0.6, p=A(-0.12, -0.16, 1.64), b="S"),
    k(0.8),
], L=cermin([
    k(0, p=A(-0.035, -0.14, 1.665), a="telunjuk", b="C", j="atas+0.4*dalam", tp="depan+0.3*luar"),
    k(0.15),
    k(0.6, p=A(-0.12, -0.16, 1.64), b="S"),
    k(0.8),
]), gloss="PRESIDENT", cara="Dua tangan C di dahi ditarik ke samping sambil mengepal (seperti tanduk / mahkota pemimpin).")

S("B15_FORBID", "Melarang / dilarang", "Sejarah", [
    k(0, p=A(-0.05, -0.33, 1.30), a="telapak", b="L", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.42, p=A(0.008, -0.37, 1.25)),
    k(0.7),
], L=[k(0, **_KIRI_TEGAK)],
  kepala=[(0.2, 0, 0, 0), (0.42, 8, 0, 0), (0.7, 2, 0, 0)],
  gloss="FORBID", cara="Tangan L kanan dipukulkan tegas ke telapak kiri yang tegak (dilarang).")

S("B15_DEMAND", "Menuntut / menuntut hak", "Sejarah", [
    k(0, p=A(0.010, -0.43, 1.25), a="telunjuk", b="1", j="dalam+0.4*depan", tp="bawah"),
    k(0.15, b="X"),
    k(0.6, p=A(-0.01, -0.27, 1.25)),
    k(0.8),
], L=[k(0, p=A(0.035, -0.43, 1.25), a="telapak", b="FLAT", j="atas+0.3*depan", tp="kanan+0.5*belakang"),
      k(0.15), k(0.6, p=A(0.035, -0.29, 1.25)), k(0.8)],
  gloss="DEMAND", cara="Telunjuk kanan mengait telapak kiri yang tegak, lalu keduanya ditarik tegas ke arah badan.")

S("B15_SUPPORT", "Mendukung / dukungan", "Komunitas", [
    k(0, p=A(0.0, -0.37, 1.13), a="buku", b="S", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.35, p=A(0.0, -0.37, 1.185)),
    k(0.7, p=A(0.0, -0.37, 1.29)),
    k(0.85),
], L=[k(0, p=A(0.01, -0.37, 1.24), a="pergelangan", b="S", j="depan+0.3*dalam", tp="bawah"),
      k(0.35), k(0.7, p=A(0.01, -0.37, 1.345)), k(0.85)],
  wajah="senang", gloss="SUPPORT", cara="Kepalan kanan mendorong kepalan kiri dari bawah lalu keduanya naik (menopang).")

S("B15_OPPRESS", "Menindas / menekan", "Komunitas", [
    k(0, p=A(0.02, -0.37, 1.30), a="telapak", b="5", j="dalam+0.3*depan", tp="bawah"),
    k(0.15, p=A(0.02, -0.37, 1.255)),
    k(0.6, p=A(0.02, -0.37, 1.19)),
    k(0.8),
], L=[k(0, p=A(0.02, -0.37, 1.23), a="buku", b="A", j="atas+0.3*depan", tp="dalam"),
      k(0.15), k(0.6, p=A(0.02, -0.37, 1.165)), k(0.8)],
  wajah="sedih", gloss="OPPRESS", cara="Telapak kanan menekan kepalan A kiri ke bawah (menekan / menindas).")

S("B15_SUMMARIZE", "Meringkas / ringkasan", "Komunitas", [
    k(0, p=A(-0.02, -0.38, 1.36), a="telapak", b="5", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.02, -0.38, 1.28), b="S"),
    k(0.8),
], L=[k(0, p=A(0.02, -0.38, 1.16), a="telapak", b="5", j="dalam+0.3*depan", tp="atas"),
      k(0.15), k(0.6, p=A(0.02, -0.38, 1.23), b="S"), k(0.8)],
  gloss="SUMMARIZE", cara="Dua tangan terbuka (atas & bawah) saling mendekat sambil mengepal (isi dipadatkan).")

_R = [
    k(0, p=A(-0.10, -0.36, 1.22), a="telapak", b="5", j="depan+0.6*dalam", tp="atas+0.3*dalam"),
    *bolak(0.12, 0.12, 7, {"b": "5_TEKUK"}, {"b": "5"}),
    k(1.0, b="5"),
]
_L = [dict(kk, p=A(0.0, -0.44, 1.24)) if "p" in kk else kk for kk in cermin(_R)]
S("B15_WAIT", "Menunggu / tunggu", "Etika", _R, L=_L,
  gloss="WAIT", cara="Dua tangan 5 telapak ke atas (kiri di depan, kanan di belakang), jari-jari digerakkan bergelombang.")
