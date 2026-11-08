# [isyarat-b1b2-v1] Kamus isyarat ASL B2.1 "Register & Style — Register & Gaya Berisyarat".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# Kode baru berawalan B21_ (gloss= tanpa awalan). Kode A1–A2 & B15_ dipakai ulang di dek.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli, terutama FORMAL (bentuk FANCY),
#    RELAX (untuk 'santai/kasual'), GENERATION, EXPRESSION, ANALYZE yang variasinya banyak.

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_KIRI_ATAS = dict(p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
_KIRI_TEGAK = dict(p=A(0.035, -0.37, 1.25), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")


def _cermin_putar(keys):
    """cermin() + puntiran dibalik untuk tangan kiri."""
    return [dict(kk, putar=-kk["putar"]) if "putar" in kk else kk for kk in cermin(keys)]


# ── Register ───────────────────────────────────────────────────────────────

S("B21_FORMAL", "Formal / resmi", "Register",
  lingkar(0, 0.9, "dada+0.02*depan+0.03*luar+0.02*atas", 0.035, "depan", "atas", n=8, mulai=270, putaran=2,
          a="jempol", b="5", j="atas+0.3*dalam", tp="dalam") + [k(1.05)],
  gloss="FORMAL", cara="Ibu jari tangan 5 menyentuh dada dan berputar ke depan dua kali (bentuk FANCY, dipakai untuk 'formal/resmi').")

_R = [
    k(0, p="dada_kiri+0.04*depan+0.02*bawah", a="telapak", b="FLAT", j="dalam+0.6*atas", tp="belakang"),
    k(0.15),
    k(0.4, p="dada_kiri+0.012*depan+0.02*bawah"),
    k(0.8),
]
S("B21_RELAX", "Santai / kasual", "Register", _R,
  L=[k(0, p="dada_kanan+0.06*depan+0.04*bawah", a="telapak", b="FLAT", j="dalam+0.6*atas", tp="belakang"),
     k(0.15), k(0.4, p="dada_kanan+0.03*depan+0.04*bawah"), k(0.8)],
  wajah="senang", gloss="RELAX", cara="Dua tangan datar menyilang di dada (lengan bersilang) — istirahat, santai.")

_R = [
    k(0, p=A(-0.07, -0.30, 1.20), a="telapak", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.65, p=A(-0.07, -0.48, 1.18)),
    k(0.8),
]
S("B21_WAY", "Cara / jalan", "Register", _R, L=cermin(_R),
  gloss="WAY", cara="Dua tangan datar sejajar (telapak berhadapan) bergerak maju bersama, seperti jalan.")

S("B21_LECTURE", "Kuliah / ceramah", "Register", [
    k(0, p=A(-0.17, -0.30, 1.48), a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam"),
    *bolak(0.15, 0.15, 5, {"p": A(-0.17, -0.38, 1.47)}, {"p": A(-0.17, -0.30, 1.48)}),
    k(0.95),
], gloss="LECTURE", cara="Tangan datar tegak di samping kepala (telapak ke dalam) digoyang maju-mundur, seperti orang berpidato.")

# ── Kata & makna ───────────────────────────────────────────────────────────

S("B21_WORD", "Kata", "Kata & makna", [
    k(0, p=A(0.0, -0.40, 1.33), a="telunjuk", b="G", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.35, p=A(0.015, -0.385, 1.32)),
    k(0.5, p=A(0.0, -0.40, 1.33)),
    k(0.65, p=A(0.015, -0.385, 1.32)),
    k(0.85),
], L=[k(0, p=A(0.035, -0.37, 1.24), a="telunjuk", b="1", j="atas+0.2*depan", tp="dalam")],
  gloss="WORD", cara="Ujung jari G (telunjuk & ibu jari) mengetuk telunjuk kiri yang tegak dua kali (sepotong kata).")

S("B21_MEANING", "Arti / makna", "Kata & makna", [
    k(0, p=A(0.035, -0.32, 1.19), a="ujung", b="V", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.3, p=A(0.035, -0.32, 1.23)),
    k(0.45, p=A(0.035, -0.32, 1.19), putar=150),
    k(0.7),
], L=[k(0, **_KIRI_ATAS)],
  gloss="MEAN", cara="Ujung jari V menyentuh telapak kiri, diangkat dan diputar, lalu menyentuh lagi.")

S("B21_SIMILAR", "Mirip / serupa", "Kata & makna", [
    k(0, p="netral+0.04*atas", a="pergelangan", b="Y", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.15, 0.15, 5, {"p": "netral+0.04*atas+0.05*dalam"}, {"p": "netral+0.04*atas+0.03*luar"}),
    k(0.9),
], gloss="SIMILAR", cara="Tangan Y (telapak ke bawah) digerakkan ke kiri-kanan beberapa kali (sama-sama juga).")

S("B21_QUOTE", "Kutipan / istilah ('…')", "Kata & makna", [
    k(0, p="pelipis+0.10*depan+0.06*luar", a="ujung", b="V", j="atas", tp="depan"),
    *bolak(0.15, 0.15, 4, {"b": "BENT_V"}, {"b": "V"}),
    k(0.8, b="BENT_V"),
], L=cermin([
    k(0, p="pelipis+0.10*depan+0.06*luar", a="ujung", b="V", j="atas", tp="depan"),
    *bolak(0.15, 0.15, 4, {"b": "BENT_V"}, {"b": "V"}),
    k(0.8, b="BENT_V"),
]), gloss="QUOTE", cara="Dua tangan V di samping kepala, jari ditekuk dua kali (tanda kutip di udara).")

S("B21_SENTENCE", "Kalimat", "Kata & makna", [
    k(0, p=A(-0.012, -0.40, 1.24), a="telunjuk", b="F", j="atas+0.6*depan", tp="dalam"),
    k(0.15),
    k(0.35, p=A(-0.06, -0.41, 1.25)),
    k(0.55, p=A(-0.11, -0.40, 1.23)),
    k(0.75, p=A(-0.16, -0.41, 1.24)),
    k(0.9),
], L=[k(0, p=A(0.012, -0.40, 1.24), a="telunjuk", b="F", j="atas+0.6*depan", tp="dalam")],
  gloss="SENTENCE", cara="Dua tangan F bersentuhan, tangan kanan ditarik ke samping sambil bergelombang (rangkaian kata).")

S("B21_GLOSS", "Gloss (tulisan isyarat)", "Kata & makna", [],
  gloss="GLOSS", cara="Dieja jari: G-L-O-S-S.")

S("B21_IDIOM", "Idiom", "Kata & makna", [],
  gloss="IDIOM", cara="Dieja jari: I-D-I-O-M.")

S("B21_PSE", "PSE / contact signing", "Kata & makna", [],
  gloss="PSE", cara="Dieja jari: P-S-E (Pidgin Signed English, kini disebut contact signing).")

S("B21_SEE", "SEE (Signing Exact English)", "Kata & makna", [],
  gloss="SEE", cara="Dieja jari: S-E-E.")

# ── Variasi ────────────────────────────────────────────────────────────────

S("B21_AREA", "Daerah / wilayah", "Variasi",
  lingkar(0, 0.9, "netral+0.02*bawah+0.04*depan", 0.05, "depan", "luar", n=8, mulai=180, putaran=1,
          a="telapak", b="FLAT", j="depan+0.4*dalam", tp="bawah") + [k(1.05)],
  gloss="AREA", cara="Telapak datar menghadap bawah berputar satu kali mendatar (menandai wilayah).")

S("B21_NEW", "Baru", "Variasi", [
    k(0, p=A(-0.06, -0.38, 1.185), a="punggung", b="BENT_B", j="dalam+0.3*depan", tp="atas"),
    k(0.15),
    k(0.55, p=A(0.04, -0.29, 1.20), j="dalam+0.3*atas"),
    k(0.75),
], L=[k(0, **_KIRI_ATAS)],
  gloss="NEW", cara="Punggung tangan kanan yang melengkung menyendok melintasi telapak kiri ke arah dalam.")

S("B21_GENERATION", "Generasi", "Variasi", [
    k(0, p="bahu_kanan+0.10*depan+0.06*atas", a="telapak", b="BENT_B", j="dalam+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.4, p="bahu_kanan+0.16*depan"),
    k(0.65, p="bahu_kanan+0.20*depan+0.08*bawah"),
    k(0.85, p="bahu_kanan+0.24*depan+0.16*bawah"),
    k(1.0),
], L=[k(0, p="bahu_kiri+0.10*depan+0.06*atas", a="telapak", b="BENT_B", j="dalam+0.3*depan", tp="belakang"),
      k(0.15), k(0.4, p="bahu_kiri+0.16*depan"), k(0.65, p="bahu_kiri+0.20*depan+0.08*bawah"),
      k(0.85, p="bahu_kiri+0.24*depan+0.16*bawah"), k(1.0)],
  gloss="GENERATION", cara="Dua tangan melengkung dari depan bahu bergerak bergulir turun ke depan (keturunan demi keturunan).")

S("B21_EXPRESSION", "Ekspresi wajah", "Variasi", [
    k(0, p="pipi+0.06*luar+0.05*depan+0.03*atas", a="telunjuk", b="X", j="atas", tp="depan"),
    *bolak(0.15, 0.16, 4, {"p": "pipi+0.06*luar+0.05*depan+0.04*bawah"}, {"p": "pipi+0.06*luar+0.05*depan+0.03*atas"}),
    k(0.85),
], L=cermin([
    k(0, p="pipi+0.06*luar+0.05*depan+0.04*bawah", a="telunjuk", b="X", j="atas", tp="depan"),
    *bolak(0.15, 0.16, 4, {"p": "pipi+0.06*luar+0.05*depan+0.03*atas"}, {"p": "pipi+0.06*luar+0.05*depan+0.04*bawah"}),
    k(0.85),
]), wajah="senang", gloss="EXPRESSION", cara="Dua tangan X di samping wajah bergantian naik-turun (raut wajah berubah-ubah).")

# ── Menerjemahkan & menjelaskan ────────────────────────────────────────────

_R = [
    k(0, p=A(-0.012, -0.38, 1.25), a="buku", b="T", j="depan+0.4*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p=A(-0.012, -0.38, 1.25), putar=160),
    k(0.75),
]
S("B21_TRANSLATE", "Menerjemahkan", "Terjemah", _R, L=_cermin_putar(_R),
  gloss="TRANSLATE", cara="Dua tangan T bersentuhan lalu diputar bertukar posisi (mengalihkan dari satu bahasa ke bahasa lain).")

_tulis = [k(0, p=A(0.02, -0.29, 1.185), a="telunjuk", b="BABY_O", j="dalam+0.3*depan+0.3*bawah", tp="bawah+0.4*dalam")]
for _i, _x in enumerate((0.03, -0.01, 0.03, -0.01)):
    _tulis.append(k(0.15 + 0.15 * _i, p=A(0.02 - 0.012 * (_i + 1), -0.31 - 0.025 * (_i + 1), 1.185 + _x * 0.3), kurva=True))
_tulis.append(k(0.95))
S("B21_WRITE", "Menulis", "Terjemah", _tulis, L=[k(0, **_KIRI_ATAS)],
  gloss="WRITE", cara="Telunjuk & ibu jari (memegang pena) menggores di telapak kiri sambil bergerak maju.")

_R = [
    k(0, p=A(-0.02, -0.34, 1.25), a="telunjuk", b="F", j="depan+0.3*dalam", tp="dalam"),
    *bolak(0.12, 0.16, 6, {"p": A(-0.02, -0.44, 1.25)}, {"p": A(-0.02, -0.34, 1.25)}),
    k(1.0),
]
_L = cermin([
    k(0, p=A(-0.02, -0.44, 1.25), a="telunjuk", b="F", j="depan+0.3*dalam", tp="dalam"),
    *bolak(0.12, 0.16, 6, {"p": A(-0.02, -0.34, 1.25)}, {"p": A(-0.02, -0.44, 1.25)}),
    k(1.0),
])
S("B21_EXPLAIN", "Menjelaskan", "Terjemah", _R, L=_L,
  gloss="EXPLAIN", cara="Dua tangan F (telapak berhadapan) bergantian maju-mundur.")

_R = [
    k(0, p=A(-0.08, -0.38, 1.25), a="telapak", b="C", j="atas+0.3*depan", tp="dalam+0.6*belakang"),
    *bolak(0.15, 0.18, 5, {"putar": 30}, {"putar": -20}),
    k(1.0, putar=0),
]
S("B21_COMPARE", "Membandingkan", "Terjemah", _R, L=_cermin_putar(_R),
  gloss="COMPARE", cara="Dua tangan melengkung (telapak menghadap diri) diputar bergantian, seperti menimbang dua hal.")

_R = [
    k(0, p=A(-0.06, -0.33, 1.28), a="ujung", b="BENT_V", j="depan+0.6*bawah", tp="bawah"),
    *bolak(0.12, 0.16, 6, {"p": A(-0.06, -0.33, 1.22), "b": "BENT_V"}, {"p": A(-0.06, -0.33, 1.28)}),
    k(1.0),
]
_L = cermin([
    k(0, p=A(-0.06, -0.33, 1.22), a="ujung", b="BENT_V", j="depan+0.6*bawah", tp="bawah"),
    *bolak(0.12, 0.16, 6, {"p": A(-0.06, -0.33, 1.28)}, {"p": A(-0.06, -0.33, 1.22)}),
    k(1.0),
])
S("B21_ANALYZE", "Menganalisis", "Terjemah", _R, L=_L,
  gloss="ANALYZE", cara="Dua tangan V bengkok bergantian 'mencakar' turun, seperti membongkar sesuatu menjadi bagian kecil.")

_R = [
    k(0, p="mata+0.04*depan+0.07*luar", a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam"),
    k(0.15),
    k(0.6, p="mata+0.22*depan+0.025*luar+0.04*bawah", j="depan+0.4*atas"),
    k(0.8),
]
S("B21_FOCUS", "Fokus / memusatkan", "Terjemah", _R, L=cermin(_R),
  gloss="FOCUS", cara="Dua tangan datar di samping mata bergerak maju sambil menyempit (seperti kacamata kuda).")

S("B21_CLEAR", "Jelas", "Terjemah", [
    k(0, p=A(-0.012, -0.38, 1.28), a="ujung", b="FLAT_O", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p=A(-0.16, -0.36, 1.38), b="5", j="atas+0.3*luar", tp="depan"),
    k(0.75),
], L=cermin([
    k(0, p=A(-0.012, -0.38, 1.28), a="ujung", b="FLAT_O", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p=A(-0.16, -0.36, 1.38), b="5", j="atas+0.3*luar", tp="depan"),
    k(0.75),
]), wajah="senang", gloss="CLEAR", cara="Ujung jari dua tangan O-pipih bertemu di tengah, lalu membuka ke atas-samping (terang, jelas).")

# ── Kesopanan ──────────────────────────────────────────────────────────────

S("B21_POLITE", "Sopan", "Kesopanan", [
    k(0, p="dada+0.04*depan+0.03*atas+0.01*luar", a="jempol", b="5", j="atas+0.2*dalam", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "dada+0.006*depan+0.03*atas+0.01*luar"}, {"p": "dada+0.04*depan+0.03*atas+0.01*luar"}),
    k(0.8, p="dada+0.006*depan+0.03*atas+0.01*luar"),
], wajah="senang", gloss="POLITE", cara="Ibu jari tangan 5 mengetuk dada atas dua kali dengan ringan.")

S("B21_REFUSE", "Menolak", "Kesopanan", [
    k(0, p=A(-0.10, -0.33, 1.25), a="pergelangan", b="A", j="depan+0.2*atas", tp="dalam"),
    k(0.15),
    k(0.5, p=A(-0.15, -0.16, 1.42), j="atas+0.5*belakang"),
    k(0.7),
], kepala=[(0.2, 0, 0, 0), (0.5, 0, -10, 0), (0.75, 0, 0, 0)],
  gloss="REFUSE", cara="Kepalan A (ibu jari ke atas) disentak ke atas-belakang melewati bahu (tidak mau).")

S("B21_CRITICIZE", "Mengkritik", "Kesopanan", [
    k(0, p=A(0.0, -0.40, 1.29), a="telunjuk", b="1", j="bawah+0.4*depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.35, p=A(0.07, -0.31, 1.255)),
    k(0.5, p=A(0.07, -0.40, 1.29)),
    k(0.7, p=A(0.0, -0.31, 1.255)),
    k(0.85),
], L=[k(0, p=A(0.035, -0.35, 1.23), a="telapak", b="FLAT", j="atas+0.4*depan", tp="belakang+0.3*dalam")],
  gloss="CRITICIZE", cara="Telunjuk menggores tanda X di telapak kiri (mencoret / mengkritik).")

_R = [
    k(0, p=A(-0.08, -0.32, 1.18), a="telapak", b="FLAT", j="depan+0.2*dalam", tp="atas"),
    k(0.15),
    k(0.55, p=A(-0.08, -0.44, 1.26), j="depan+0.4*atas"),
    k(0.75),
]
S("B21_SUGGEST", "Menyarankan / mengusulkan", "Kesopanan", _R, L=cermin(_R), wajah="senang",
  gloss="SUGGEST", cara="Dua telapak menghadap atas bergerak naik ke depan, seperti menyodorkan usul.")

S("B21_ADVICE", "Nasihat / saran", "Kesopanan", [
    k(0, p=A(0.03, -0.31, 1.205), a="ujung", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.55, p=A(0.03, -0.46, 1.19), b="5", j="depan+0.6*bawah"),
    k(0.75),
], L=[k(0, p=A(0.04, -0.31, 1.165), a="punggung", b="FLAT", j="dalam+0.5*depan", tp="bawah")],
  gloss="ADVICE", cara="Ujung O-pipih di punggung tangan kiri, lalu didorong maju sambil membuka (menyampaikan saran).")

# ── Tempo & tingkat ────────────────────────────────────────────────────────

_R = [
    k(0, p=A(-0.07, -0.40, 1.24), a="pergelangan", b="L", j="depan+0.3*dalam", tp="dalam"),
    k(0.2),
    k(0.32, b="X"),
    k(0.6),
]
S("B21_FAST", "Cepat", "Tempo", _R, L=cermin(_R),
  gloss="FAST", cara="Dua tangan L, telunjuk ditekuk cepat menjadi X (seperti menarik pelatuk).")

S("B21_EASY", "Mudah", "Tempo", [
    k(0, p=A(0.02, -0.40, 1.205), a="punggung", b="BENT_B", j="depan+0.2*dalam", tp="atas"),
    *bolak(0.15, 0.16, 4, {"p": A(0.02, -0.40, 1.25)}, {"p": A(0.02, -0.40, 1.205)}),
    k(0.85, p=A(0.02, -0.40, 1.25)),
], L=[k(0, p=A(0.03, -0.39, 1.215), a="telapak", b="BENT_B", j="depan+0.3*dalam", tp="atas")],
  wajah="senang", gloss="EASY", cara="Jari tangan kanan yang melengkung menyapu ujung jari kiri ke atas dua kali dengan ringan.")

S("B21_HARD", "Sulit / susah", "Tempo", [
    k(0, p=A(-0.04, -0.38, 1.33), a="buku", b="BENT_V", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.4, p=A(0.0, -0.38, 1.27)),
    k(0.55, p=A(-0.04, -0.38, 1.33)),
    k(0.8, p=A(0.0, -0.38, 1.27)),
    k(0.95),
], L=[k(0, p=A(0.02, -0.38, 1.24), a="buku", b="BENT_V", j="kanan+0.3*depan", tp="atas")],
  wajah="sedih", gloss="HARD", cara="Buku jari V bengkok kanan dipukulkan ke buku jari V bengkok kiri dua kali (sulit).")

S("B21_GONE", "Hilang / sudah lewat", "Tempo", [
    k(0, p=A(0.03, -0.38, 1.30), a="ujung", b="5", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.55, p=A(0.03, -0.38, 1.13), b="FLAT_O"),
    k(0.75),
], L=[k(0, p=A(0.045, -0.38, 1.21), a="telapak", b="C", j="depan+0.3*dalam", tp="kanan+0.6*bawah")],
  gloss="GONE", cara="Tangan 5 ditarik turun menembus lingkaran tangan C kiri sambil mengatup (lenyap). Dalam idiom TRAIN-GONE.")
