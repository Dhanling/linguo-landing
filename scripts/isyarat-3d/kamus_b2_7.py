# [isyarat-b1b2-v1] Kamus isyarat ASL B2.7 "Mastery & Deaf Perspectives — Penguasaan & Perspektif Tuli".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli (terutama IMPLANT, INTERNATIONAL,
#    ESTABLISH, INVOLVE, GOVERNMENT, BORN yang variasinya banyak).

from kamus import S, k, A, lingkar, bolak, cermin, IST
import math
import isyarat as I

_ALAS = dict(p=A(0.03, -0.33, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
_TEGAK = dict(p=A(0.04, -0.36, 1.22), a="telapak", b="FLAT", j="depan+0.2*dalam", tp="dalam")


def _dua(keys):
    return keys, cermin(keys)


# ── Sejarah & gerakan ──────────────────────────────────────────────────────

S("B27_HISTORY", "Sejarah", "Sejarah", [
    k(0, p="netral+0.16*atas", a="ujung", b="H", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.35, p="netral+0.08*atas", kurva=True),
    k(0.5, p="netral+0.14*atas"),
    k(0.7, p="netral+0.05*atas", kurva=True),
    k(0.85),
], gloss="HISTORY", cara="Tangan bentuk H (telapak ke samping) memantul turun dua kali di depan badan.")

S("B27_ORAL", "Oral / metode lisan", "Sejarah",
  lingkar(0, 0.9, "mulut+0.05*depan", 0.03, "luar", "atas", n=8, mulai=90, putaran=1,
          a="telunjuk", b="1", j="atas+0.3*dalam", tp="belakang") + [k(1.05)],
  gloss="ORAL", cara="Telunjuk menggambar lingkaran di depan mulut.")

S("B27_LIPREAD", "Membaca bibir", "Sejarah",
  lingkar(0, 0.9, "dagu+0.08*depan+0.01*bawah", 0.02, "luar", "atas", n=8, mulai=90, putaran=2,
          a="ujung", b="BENT_V", j="belakang+0.6*atas+0.3*dalam", tp="bawah+0.4*belakang") + [k(1.05)],
  gloss="LIPREAD", cara="Tangan V bengkok, ujung jari menghadap mulut, berputar kecil di depan bibir.")

S("B27_SPEAK", "Berbicara (dengan suara)", "Sejarah", [
    k(0, p="dagu+0.03*depan+0.03*bawah", a="sisi_telunjuk", b="4", j="atas+0.6*dalam", tp="dalam+0.3*belakang"),
    *bolak(0.15, 0.15, 4, {"p": "dagu+0.11*depan+0.03*bawah"}, {"p": "dagu+0.03*depan+0.03*bawah"}),
    k(0.8),
], gloss="SPEAK", cara="Sisi telunjuk tangan 4 di depan dagu/mulut digerakkan maju-mundur berulang (bicara bersuara).")

S("B27_LANGUAGE", "Bahasa", "Sejarah", [
    k(0, p=A(-0.03, -0.40, 1.24), a="jempol", b="L", j="depan+0.3*luar", tp="bawah"),
    k(0.15),
    k(0.4, p=A(-0.09, -0.40, 1.24), putar=20),
    k(0.6, p=A(-0.15, -0.40, 1.24), putar=-15),
    k(0.85, p=A(-0.20, -0.40, 1.24), putar=0),
    k(1.0),
], L=cermin([
    k(0, p=A(-0.03, -0.40, 1.24), a="jempol", b="L", j="depan+0.3*luar", tp="bawah"),
    k(0.15),
    k(0.4, p=A(-0.09, -0.40, 1.24), putar=20),
    k(0.6, p=A(-0.15, -0.40, 1.24), putar=-15),
    k(0.85, p=A(-0.20, -0.40, 1.24), putar=0),
    k(1.0),
]), gloss="LANGUAGE", cara="Dua tangan L (telapak ke bawah), ujung ibu jari berdekatan, ditarik berpisah ke samping sambil bergoyang.")

S("B27_DEMAND", "Menuntut", "Gerakan", [
    k(0, p=A(0.02, -0.45, 1.25), a="telunjuk", b="1", j="depan+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p=A(0.02, -0.25, 1.25)),
    k(0.75),
], L=[k(0, p=A(0.04, -0.46, 1.24), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
      k(0.15), k(0.55, p=A(0.04, -0.26, 1.24)), k(0.75)],
  kepala=[(0.15, 0, 0, 0), (0.55, 8, 0, 0), (0.75, 3, 0, 0)],
  gloss="DEMAND", cara="Ujung telunjuk ditekan ke telapak kiri yang tegak, lalu kedua tangan ditarik tegas ke arah dada.")

S("B27_EQUAL", "Setara / sama rata", "Gerakan", [
    k(0, p=A(-0.06, -0.38, 1.24), a="ujung", b="BENT_B", j="dalam+0.6*bawah", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.012, -0.38, 1.24)}, {"p": A(-0.06, -0.38, 1.24)}),
    k(0.75, p=A(-0.012, -0.38, 1.24)),
], L=cermin([
    k(0, p=A(-0.06, -0.38, 1.24), a="ujung", b="BENT_B", j="dalam+0.6*bawah", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.012, -0.38, 1.24)}, {"p": A(-0.06, -0.38, 1.24)}),
    k(0.75, p=A(-0.012, -0.38, 1.24)),
]), gloss="EQUAL", cara="Dua tangan bengkok telapak ke bawah, ujung jari diketukkan bertemu dua kali (sejajar, sama tinggi).")

S("B27_GOVERNMENT", "Pemerintah", "Gerakan", [
    k(0, p="pelipis+0.06*depan+0.05*luar", a="telunjuk", b="1", j="atas+0.6*dalam", tp="bawah+0.4*dalam"),
    *[k(0.12 + 0.07 * i, p=f"pelipis+{0.06 + 0.025 * math.cos(i * 1.05):.3f}*depan+{0.05 + 0.025 * math.sin(i * 1.05):.3f}*luar", kurva=True) for i in range(6)],
    k(0.6, p="pelipis+0.01*depan+0.01*luar", j="dalam+0.4*atas"),
    k(0.8),
], gloss="GOVERNMENT", cara="Telunjuk berputar kecil di samping kepala lalu menyentuh pelipis.")

S("B27_PRESIDENT", "Presiden / rektor", "Gerakan", [
    k(0, p="pelipis+0.07*luar+0.05*bawah+0.03*depan", a="telapak", b="C", j="atas+0.4*luar", tp="depan+0.3*dalam"),
    k(0.15),
    k(0.6, p="pelipis+0.13*luar+0.02*bawah+0.04*depan", b="S"),
    k(0.8),
], L=cermin([
    k(0, p="pelipis+0.07*luar+0.05*bawah+0.03*depan", a="telapak", b="C", j="atas+0.4*luar", tp="depan+0.3*dalam"),
    k(0.15),
    k(0.6, p="pelipis+0.13*luar+0.02*bawah+0.04*depan", b="S"),
    k(0.8),
]), gloss="PRESIDENT", cara="Dua tangan C di samping dahi ditarik ke luar-atas sambil mengepal (seperti tanduk).")

_dirikan = [
    k(0, p=A(-0.03, -0.38, 1.33), a="telapak", b="A", j="atas", tp="depan"),
    k(0.15),
    k(0.4, p=A(-0.01, -0.39, 1.30), putar=-60),
    k(0.65, p=A(0.03, -0.38, 1.215), j="bawah+0.2*depan", tp="dalam", putar=0),
    k(0.85),
]
S("B27_ESTABLISH", "Mendirikan / didirikan", "Sejarah", _dirikan,
  L=[k(0, p=A(0.04, -0.38, 1.19), a="punggung", b="FLAT", j="dalam+0.6*depan", tp="bawah")],
  gloss="ESTABLISH", cara="Kepalan A diputar lalu ditancapkan di punggung tangan kiri (mendirikan sesuatu yang kokoh).")

S("B27_FORBID", "Melarang", "Sejarah", [
    k(0, p=A(-0.06, -0.34, 1.32), a="telunjuk", b="L", j="atas+0.3*depan", tp="depan+0.4*dalam"),
    k(0.15),
    k(0.4, p=A(0.025, -0.40, 1.26), j="atas+0.2*dalam", tp="dalam"),
    k(0.6),
], L=[k(0, **_TEGAK)], wajah="sedih",
  gloss="FORBID", cara="Tangan L kanan dihentakkan sekali ke telapak kiri yang tegak (dilarang).")

S("B27_PROTECT", "Melindungi / membela", "Gerakan", [
    k(0, p=A(-0.01, -0.34, 1.22), a="buku", b="S", j="dalam+0.6*depan", tp="bawah"),
    *bolak(0.15, 0.16, 4, {"p": A(-0.01, -0.44, 1.22)}, {"p": A(-0.01, -0.34, 1.22)}),
    k(0.85, p=A(-0.01, -0.44, 1.22)),
], L=[k(0, p=A(0.02, -0.33, 1.19), a="buku", b="S", j="dalam+0.6*depan", tp="bawah"),
      *bolak(0.15, 0.16, 4, {"p": A(0.02, -0.43, 1.19)}, {"p": A(0.02, -0.33, 1.19)}),
      k(0.85, p=A(0.02, -0.43, 1.19))],
  gloss="PROTECT", cara="Dua kepalan bertumpuk (pergelangan bersilang) didorong maju dua kali (DEFEND).")

S("B27_BRAVE", "Berani", "Gerakan", [
    k(0, p="bahu_kanan+0.06*depan+0.02*bawah", a="ujung", b="CLAW", j="belakang+0.4*atas", tp="belakang"),
    k(0.15),
    k(0.55, p="bahu_kanan+0.20*depan+0.04*bawah", b="S", j="atas+0.3*depan"),
    k(0.75),
], L=cermin([
    k(0, p="bahu_kanan+0.06*depan+0.02*bawah", a="ujung", b="CLAW", j="belakang+0.4*atas", tp="belakang"),
    k(0.15),
    k(0.55, p="bahu_kanan+0.20*depan+0.04*bawah", b="S", j="atas+0.3*depan"),
    k(0.75),
]), kepala=[(0.15, 0, 0, 0), (0.55, 6, 0, 0)],
  gloss="BRAVE", cara="Dua tangan cakar di depan bahu ditarik maju dengan tegas sambil mengepal.")

S("B27_INSPIRE", "Menginspirasi", "Gerakan", [
    k(0, p="dada_kanan+0.03*depan+0.06*bawah", a="ujung", b="FLAT_O", j="atas", tp="belakang"),
    k(0.15),
    k(0.65, p="dada_kanan+0.08*depan+0.14*atas", b="5", j="atas+0.2*luar"),
    k(0.85),
], L=cermin([
    k(0, p="dada_kanan+0.03*depan+0.06*bawah", a="ujung", b="FLAT_O", j="atas", tp="belakang"),
    k(0.15),
    k(0.65, p="dada_kanan+0.08*depan+0.14*atas", b="5", j="atas+0.2*luar"),
    k(0.85),
]), wajah="senang", gloss="INSPIRE", cara="Dua tangan O-pipih di dada naik sambil membuka menjadi 5 (semangat yang tumbuh dari dalam).")

S("B27_SPREAD", "Menyebar / tersebar", "Gerakan", [
    k(0, p=A(-0.03, -0.34, 1.24), a="ujung", b="FLAT_O", j="depan", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.16, -0.50, 1.22), b="5", j="depan+0.4*luar"),
    k(0.8),
], L=cermin([
    k(0, p=A(-0.03, -0.34, 1.24), a="ujung", b="FLAT_O", j="depan", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.16, -0.50, 1.22), b="5", j="depan+0.4*luar"),
    k(0.8),
]), gloss="SPREAD", cara="Dua tangan O-pipih (telapak ke bawah) bergerak maju-menyamping sambil membuka menjadi 5.")

# ── Identitas & komunitas ──────────────────────────────────────────────────

S("B27_ACCEPT", "Menerima", "Identitas", [
    k(0, p=A(-0.10, -0.50, 1.24), a="telapak", b="5", j="depan+0.4*atas", tp="bawah+0.3*belakang"),
    k(0.15),
    k(0.6, p="dada_kanan+0.04*depan", b="FLAT_O", j="belakang+0.3*bawah", tp="bawah"),
    k(0.8),
], L=cermin([
    k(0, p=A(-0.10, -0.50, 1.24), a="telapak", b="5", j="depan+0.4*atas", tp="bawah+0.3*belakang"),
    k(0.15),
    k(0.6, p="dada_kanan+0.04*depan", b="FLAT_O", j="belakang+0.3*bawah", tp="bawah"),
    k(0.8),
]), gloss="ACCEPT", cara="Dua tangan 5 di depan ditarik ke dada sambil mengatup menjadi O-pipih (mengambil ke dalam diri).")

S("B27_INVOLVE", "Terlibat / melibatkan", "Identitas", [
    k(0, p=A(-0.06, -0.42, 1.25), a="ujung", b="5", j="bawah+0.6*depan", tp="belakang+0.6*bawah"),
    k(0.15),
    k(0.4, p=A(0.0, -0.44, 1.26), kurva=True),
    k(0.7, p=A(0.035, -0.38, 1.205), b="FLAT_O", j="bawah", tp="belakang"),
    k(0.85),
], L=[k(0, p=A(0.04, -0.38, 1.20), a="telapak", b="C", j="depan+0.3*dalam", tp="dalam+0.3*atas")],
  gloss="INVOLVE", cara="Tangan 5 berputar di atas lalu masuk ke dalam lingkaran tangan C kiri sambil mengatup (ikut ke dalam).")

S("B27_VARIOUS", "Beragam / bermacam-macam", "Identitas", [
    k(0, p=A(-0.02, -0.42, 1.25), a="telunjuk", b="1", j="depan+0.5*dalam", tp="bawah"),
    k(0.12),
    *[k(0.2 + 0.1 * i, p=A(-0.02 - 0.03 * (i + 1), -0.42, 1.25), b="X" if i % 2 == 0 else "1") for i in range(5)],
    k(0.85, b="1"),
], L=cermin([
    k(0, p=A(-0.02, -0.42, 1.25), a="telunjuk", b="1", j="depan+0.5*dalam", tp="bawah"),
    k(0.12),
    *[k(0.2 + 0.1 * i, p=A(-0.02 - 0.03 * (i + 1), -0.42, 1.25), b="X" if i % 2 == 0 else "1") for i in range(5)],
    k(0.85, b="1"),
]), gloss="VARIOUS", cara="Dua telunjuk berujung bertemu, lalu bergerak berpisah ke samping sambil menekuk-lurus berulang.")

S("B27_LIFE", "Hidup / kehidupan", "Identitas", [
    k(0, p="perut+0.03*depan+0.05*luar", a="telapak", b="L", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.65, p="dada+0.03*depan+0.05*luar+0.06*atas"),
    k(0.85),
], L=cermin([
    k(0, p="perut+0.03*depan+0.05*luar", a="telapak", b="L", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.65, p="dada+0.03*depan+0.05*luar+0.06*atas"),
    k(0.85),
]), gloss="LIFE", cara="Dua tangan L (telapak ke badan) bergerak naik dari perut ke dada (LIVE / LIFE).")

S("B27_BORN", "Lahir", "Identitas", [
    k(0, p="perut+0.03*depan", a="punggung", b="FLAT", j="dalam+0.3*bawah", tp="belakang"),
    k(0.15),
    k(0.6, p=A(0.0, -0.38, 1.175), j="dalam+0.6*depan", tp="atas"),
    k(0.8),
], L=[k(0, **IST["L"]), k(0.2, **_ALAS), k(0.8)],
  gloss="BORN", cara="Tangan datar dari depan perut bergerak maju lalu mendarat di telapak kiri (BIRTH).")

S("B27_DIE", "Meninggal", "Identitas", [
    k(0, p=A(-0.08, -0.38, 1.22), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.14, -0.38, 1.22), tp="atas"),
    k(0.8),
], L=[k(0, p=A(0.04, -0.38, 1.22), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
      k(0.15), k(0.6, p=A(-0.02, -0.38, 1.22), tp="bawah"), k(0.8)],
  wajah="sedih", gloss="DIE", cara="Dua tangan datar (satu telapak ke atas, satu ke bawah) dibalik bersamaan ke samping.")

S("B27_IMPROVE", "Membaik / meningkatkan", "Identitas", [
    k(0, p=A(0.07, -0.30, 1.20), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.35, p=A(0.08, -0.25, 1.24), kurva=True),
    k(0.5, p=A(0.09, -0.21, 1.27)),
    k(0.7, p=A(0.10, -0.17, 1.31), kurva=True),
    k(0.85),
], L=[k(0, p=A(0.08, -0.32, 1.17), a="punggung", b="FLAT", j="depan+0.6*dalam", tp="bawah+0.3*luar")],
  gloss="IMPROVE", cara="Sisi kelingking tangan datar melompat naik bertahap di lengan bawah kiri ke arah siku.")

S("B27_ENCOURAGE", "Mendorong / menyemangati", "Identitas", [
    k(0, p=A(-0.12, -0.30, 1.26), a="telapak", b="FLAT", j="atas+0.3*dalam", tp="depan"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.12, -0.40, 1.26)}, {"p": A(-0.12, -0.36, 1.26)}),
    k(0.8, p=A(-0.12, -0.46, 1.26)),
    k(0.95),
], L=cermin([
    k(0, p=A(-0.12, -0.30, 1.26), a="telapak", b="FLAT", j="atas+0.3*dalam", tp="depan"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.12, -0.40, 1.26)}, {"p": A(-0.12, -0.36, 1.26)}),
    k(0.8, p=A(-0.12, -0.46, 1.26)),
    k(0.95),
]), wajah="senang", gloss="ENCOURAGE", cara="Dua telapak menghadap depan didorong maju beberapa kali (mendorong seseorang maju).")

# ── Teknologi & dunia ──────────────────────────────────────────────────────

S("B27_TECHNOLOGY", "Teknologi", "Teknologi", [
    k(0, p=A(0.04, -0.37, 1.13), a="tengah", b="OPEN_8", j="atas+0.3*depan", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": A(0.04, -0.37, 1.17)}, {"p": A(0.04, -0.37, 1.13)}),
    k(0.75, p=A(0.04, -0.37, 1.17)),
], L=[k(0, p=A(0.04, -0.37, 1.20), a="sisi_kelingking", b="FLAT", j="depan+0.4*dalam", tp="dalam")],
  gloss="TECHNOLOGY", cara="Ujung jari tengah (bentuk 8 terbuka) mengetuk sisi bawah tangan kiri dua kali.")

S("B27_IMPLANT", "Implan koklea", "Teknologi", [
    k(0, p="telinga+0.03*belakang+0.06*luar+0.02*atas", a="ujung", b="BENT_V", j="dalam+0.3*depan", tp="depan", siku="bawah+0.6*luar"),
    *bolak(0.15, 0.15, 4, {"p": "telinga+0.03*belakang+0.012*luar+0.02*atas"}, {"p": "telinga+0.03*belakang+0.05*luar+0.02*atas"}),
    k(0.75, p="telinga+0.03*belakang+0.012*luar+0.02*atas"),
], gloss="COCHLEAR-IMPLANT",
  cara="Ujung jari tangan V bengkok diketukkan di belakang telinga dua kali (posisi implan).")

S("B27_INTERNATIONAL", "Internasional", "Teknologi",
  lingkar(0, 0.9, A(0.0, -0.38, 1.25), 0.05, "depan", "atas", n=10, mulai=90, putaran=1,
          a="kelingking", b="I", j="atas+0.2*depan", tp="dalam") + [k(1.05)],
  L=[k(0, p=A(0.03, -0.38, 1.22), a="kelingking", b="I", j="atas+0.2*depan", tp="dalam")],
  gloss="INTERNATIONAL", cara="Tangan I kanan berputar maju mengelilingi tangan I kiri (WORLD dengan huruf I).")

S("B27_FAST", "Cepat", "Teknologi", [
    k(0, p=A(-0.06, -0.44, 1.24), a="telunjuk", b="1", j="depan+0.2*dalam", tp="bawah"),
    k(0.15),
    k(0.32, p=A(-0.06, -0.34, 1.25), b="X"),
    k(0.6),
], L=cermin([
    k(0, p=A(-0.06, -0.44, 1.24), a="telunjuk", b="1", j="depan+0.2*dalam", tp="bawah"),
    k(0.15),
    k(0.32, p=A(-0.06, -0.34, 1.25), b="X"),
    k(0.6),
]), gloss="FAST", cara="Dua telunjuk menunjuk ke depan lalu ditarik cepat ke belakang sambil menekuk menjadi X.")

# ── Makna, nuansa & idiom ──────────────────────────────────────────────────

S("B27_MEAN", "Berarti / makna", "Makna", [
    k(0, p=A(0.04, -0.37, 1.24), a="ujung", b="V", j="bawah+0.3*depan", tp="belakang"),
    k(0.15, p=A(0.04, -0.37, 1.225)),
    k(0.35, p=A(0.04, -0.37, 1.26)),
    k(0.55, p=A(0.04, -0.37, 1.225), putar=150),
    k(0.75),
], L=[k(0, p=A(0.04, -0.37, 1.19), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  gloss="MEAN", cara="Ujung jari V menyentuh telapak kiri, diangkat dan diputar, lalu menyentuh lagi.")

S("B27_BORROW", "Meminjam (kata pinjaman)", "Makna", [
    k(0, p=A(-0.03, -0.48, 1.25), a="ujung", b="K", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.03, -0.30, 1.27)),
    k(0.8),
], L=[k(0, p=A(0.0, -0.48, 1.22), a="ujung", b="K", j="depan+0.3*atas", tp="dalam"),
      k(0.15), k(0.6, p=A(0.0, -0.30, 1.24)), k(0.8)],
  gloss="BORROW", cara="Dua tangan K/V bertumpuk di depan, ditarik ke arah badan (mengambil dari pihak lain).")

S("B27_CHOOSE", "Memilih", "Makna", [
    k(0, p=A(0.04, -0.46, 1.32), a="telunjuk", b="F", j="depan+0.3*dalam", tp="dalam"),
    k(0.2),
    k(0.55, p=A(-0.02, -0.30, 1.32)),
    k(0.75),
], L=[k(0, p=A(0.04, -0.42, 1.28), a="ujung", b="V", j="atas+0.3*luar", tp="belakang")],
  gloss="CHOOSE", cara="Tangan F 'memetik' dari jari V kiri lalu ditarik ke arah badan.")

S("B27_TEASE", "Menggoda / meledek", "Makna", [
    k(0, p=A(0.0, -0.36, 1.24), a="buku", b="X", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.13, 6, {"p": A(0.0, -0.48, 1.24)}, {"p": A(0.0, -0.36, 1.24)}),
    k(0.95),
], L=[k(0, p=A(0.03, -0.37, 1.21), a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah")],
  wajah="senang", gloss="TEASE", cara="Tangan X kanan didorong maju berulang di atas telunjuk kiri (meledek dengan nakal).")

S("B27_TOUCH", "Menyentuh / pernah", "Makna", [
    k(0, p=A(0.04, -0.37, 1.23), a="tengah", b="OPEN_8", j="bawah+0.4*depan", tp="belakang"),
    k(0.15),
    k(0.4, p=A(0.04, -0.37, 1.197)),
    k(0.65),
], L=[k(0, p=A(0.04, -0.37, 1.18), a="punggung", b="FLAT", j="dalam+0.6*depan", tp="bawah")],
  gloss="TOUCH", cara="Ujung jari tengah (8 terbuka) menyentuh punggung tangan kiri sekali.")
