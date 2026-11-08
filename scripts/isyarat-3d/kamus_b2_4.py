# [isyarat-b1b2-v1] Kamus isyarat ASL B2.4 "ASL Literature — Sastra ASL".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli (terutama CREATIVE, CHARACTER, STAGE,
#    TRADITION, GENERATION, EXPRESSION, LIGHT yang variasinya banyak).

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

# Telapak kiri menghadap atas di depan badan (alas banyak isyarat)
_ALAS = dict(p=A(0.03, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")

# ── Kreativitas & karya ────────────────────────────────────────────────────

S("B24_CREATIVE", "Kreatif / daya cipta", "Sastra", [
    k(0, p="dahi+0.03*depan+0.07*luar+0.02*bawah", a="sisi_telunjuk", b="4", j="atas+0.2*depan", tp="dalam"),
    k(0.15),
    k(0.45, p="dahi+0.14*depan+0.03*atas+0.09*luar"),
    k(0.6, p="dahi+0.03*depan+0.07*luar+0.02*bawah"),
    k(0.9, p="dahi+0.16*depan+0.04*atas+0.09*luar"),
    k(1.05),
], gloss="CREATIVE",
  cara="Sisi telunjuk tangan bentuk 4 di dahi, digerakkan maju-naik dua kali (ide yang mengalir keluar).")

S("B24_IMAGINE", "Membayangkan / imajinasi", "Sastra",
  lingkar(0, 0.8, "pelipis+0.07*depan+0.04*luar", 0.028, "depan", "atas", n=8, mulai=270, putaran=2,
          a="kelingking", b="I", j="atas+0.2*dalam", tp="dalam+0.3*belakang") +
  [k(1.0, p="pelipis+0.12*depan+0.06*luar+0.10*atas"), k(1.15)],
  wajah="senang", gloss="IMAGINE",
  cara="Kelingking (bentuk I) di dekat pelipis berputar kecil sambil naik menjauh (pikiran melayang).")

S("B24_MAKE", "Membuat / mencipta", "Sastra", [
    k(0, p=A(0.0, -0.36, 1.235), a="telapak", b="S", j="dalam+0.6*depan", tp="bawah"),
    *bolak(0.15, 0.18, 4, {"putar": -40}, {"putar": 15}),
    k(0.9, putar=0),
], L=[k(0, p=A(0.02, -0.36, 1.19), a="punggung", b="S", j="dalam+0.6*depan", tp="atas"),
      *bolak(0.15, 0.18, 4, {"putar": 40}, {"putar": -15}), k(0.9, putar=0)],
  gloss="MAKE", cara="Kepalan kanan di atas kepalan kiri, keduanya dipuntir berlawanan dua kali (seperti meremas tanah liat).")

S("B24_CHARACTER", "Tokoh / karakter", "Sastra",
  lingkar(0, 0.6, "dada_kanan+0.09*depan", 0.03, "luar", "atas", n=8, mulai=90,
          a="telapak", b="C", j="atas+0.2*depan", tp="dalam+0.6*belakang") +
  [k(0.85, p="dada_kanan+0.03*depan"), k(1.05)],
  gloss="CHARACTER",
  cara="Tangan C membuat lingkaran kecil di depan dada, lalu ditempelkan ke dada (watak/tokoh).")

S("B24_TITLE", "Judul / kutipan", "Sastra", [
    k(0, p=A(-0.09, -0.40, 1.36), a="ujung", b="V", j="atas", tp="depan"),
    k(0.15),
    k(0.3, b="BENT_V"), k(0.45, b="V"), k(0.6, b="BENT_V"),
    k(0.85, p=A(-0.09, -0.40, 1.32)),
], L=cermin([
    k(0, p=A(-0.09, -0.40, 1.36), a="ujung", b="V", j="atas", tp="depan"),
    k(0.15),
    k(0.3, b="BENT_V"), k(0.45, b="V"), k(0.6, b="BENT_V"),
    k(0.85, p=A(-0.09, -0.40, 1.32)),
]), gloss="TITLE",
  cara="Dua tangan V di depan bahu, jari ditekuk dua kali seperti tanda kutip (TITLE/QUOTE).")

S("B24_MEAN", "Makna / berarti", "Sastra", [
    k(0, p=A(0.03, -0.31, 1.22), a="ujung", b="V", j="depan+0.8*bawah+0.3*dalam", tp="belakang+0.5*bawah"),
    k(0.15, p=A(0.03, -0.31, 1.183)),
    k(0.3, p=A(0.03, -0.31, 1.22)),
    k(0.5, putar=170),
    k(0.65, p=A(0.03, -0.31, 1.183)),
    k(0.85),
], L=[k(0, **_ALAS)], gloss="MEAN",
  cara="Ujung jari V menyentuh telapak kiri, diangkat dan diputar setengah lingkaran, lalu menyentuh lagi.")

S("B24_WRITE", "Menulis", "Sastra", [
    k(0, p=A(0.06, -0.28, 1.185), a="telunjuk", b="BABY_O", j="dalam+0.4*depan+0.3*bawah", tp="bawah+0.3*dalam"),
    k(0.15),
    k(0.35, p=A(0.035, -0.31, 1.19)),
    k(0.5, p=A(0.04, -0.315, 1.185)),
    k(0.75, p=A(0.0, -0.35, 1.19)),
    k(0.9),
], L=[k(0, **_ALAS)], gloss="WRITE",
  cara="Jari kanan seolah memegang pena dan menulis berliku di atas telapak kiri.")

S("B24_HAND", "Tangan", "Sastra", [
    k(0, p=A(0.065, -0.29, 1.19), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(0.55, p=A(-0.02, -0.38, 1.185)),
    k(0.7),
], L=[k(0, p=A(0.03, -0.31, 1.16), a="punggung", b="FLAT", j="dalam+0.5*depan", tp="bawah")],
  gloss="HAND", cara="Telapak kanan mengusap punggung tangan kiri dari pergelangan ke ujung jari (HANDSHAPE = HAND + SHAPE).")

S("B24_NUMBER", "Angka / nomor", "Sastra", [
    k(0, p=A(-0.015, -0.36, 1.26), a="ujung", b="FLAT_O", j="dalam+0.3*bawah", tp="bawah+0.3*dalam"),
    k(0.15),
    k(0.45, p=A(-0.03, -0.38, 1.29), putar=150),
    k(0.7, p=A(-0.015, -0.36, 1.26)),
    k(0.9),
], L=[k(0, p=A(0.015, -0.36, 1.25), a="ujung", b="FLAT_O", j="dalam+0.3*atas", tp="atas+0.3*dalam")],
  gloss="NUMBER",
  cara="Ujung jari dua tangan O-pipih bersentuhan, tangan kanan berputar setengah lingkaran lalu bersentuhan lagi.")

S("B24_CHANGE", "Berubah / merevisi", "Sastra", [
    k(0, p=A(-0.01, -0.38, 1.27), a="buku", b="X", j="depan+0.4*dalam", tp="dalam"),
    k(0.15),
    k(0.5, p=A(-0.01, -0.38, 1.21), putar=160),
    k(0.75),
], L=[k(0, p=A(0.01, -0.38, 1.21), a="buku", b="X", j="depan+0.4*dalam", tp="dalam"),
      k(0.15), k(0.5, p=A(0.01, -0.38, 1.27), putar=160), k(0.75)],
  gloss="CHANGE", cara="Dua tangan X bersentuhan buku jari, lalu diputar saling bertukar posisi atas-bawah.")

S("B24_IMPROVE", "Memperbaiki / meningkatkan", "Sastra", [
    k(0, p=A(0.05, -0.33, 1.20), a="sisi_kelingking", b="FLAT", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.3, p=A(0.08, -0.31, 1.25)),
    k(0.45, p=A(0.11, -0.29, 1.205)),
    k(0.6, p=A(0.14, -0.27, 1.26)),
    k(0.75, p=A(0.17, -0.25, 1.215)),
    k(0.9),
], L=[k(0, p=A(0.0, -0.36, 1.18), a="punggung", b="FLAT", j="dalam+0.3*depan", tp="bawah")],
  gloss="IMPROVE",
  cara="Sisi kelingking tangan datar kanan melompat-lompat naik di lengan bawah kiri, dari pergelangan ke arah siku.")

S("B24_PRACTICE", "Berlatih / latihan", "Sastra", [
    k(0, p=A(0.0, -0.37, 1.235), a="buku", b="A", j="dalam+0.5*depan", tp="bawah"),
    *bolak(0.15, 0.13, 6, {"p": A(0.04, -0.37, 1.235)}, {"p": A(-0.01, -0.37, 1.235)}),
    k(0.95),
], L=[k(0, p=A(0.04, -0.37, 1.21), a="telunjuk", b="1", j="dalam+0.3*depan", tp="bawah+0.3*belakang")],
  gloss="PRACTICE", cara="Buku jari kepalan A kanan digosok maju-mundur di atas telunjuk kiri yang mendatar.")

# ── Unsur cerita & puisi ───────────────────────────────────────────────────

S("B24_START", "Mulai / awal", "Sastra", [
    k(0, p=A(0.02, -0.40, 1.25), a="telunjuk", b="1", j="depan+0.4*kiri", tp="bawah"),
    k(0.15),
    k(0.5, putar=-90),
    k(0.75),
], L=[k(0, p=A(0.04, -0.38, 1.24), a="telapak", b="5", j="depan+0.4*atas", tp="dalam")],
  gloss="START", cara="Ujung telunjuk kanan diselipkan di antara jari tangan kiri yang terbuka, lalu dipuntir sekali (seperti memutar kunci).")

S("B24_END", "Akhir / selesai (cerita)", "Sastra", [
    k(0, p=A(0.02, -0.33, 1.27), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.5, p=A(0.02, -0.46, 1.27)),
    k(0.7, p=A(0.02, -0.50, 1.20)),
    k(0.85),
], L=[k(0, p=A(0.04, -0.37, 1.24), a="sisi_telunjuk", b="FLAT", j="depan+0.3*dalam", tp="dalam")],
  gloss="END", cara="Tangan datar kanan meluncur di sepanjang tepi atas tangan kiri lalu jatuh dari ujungnya.")

S("B24_BALANCE", "Seimbang / simetri", "Sastra", [
    k(0, p="netral+0.04*luar", a="telapak", b="FLAT", j="depan", tp="bawah"),
    *bolak(0.15, 0.2, 4, {"p": "netral+0.04*luar+0.05*atas"}, {"p": "netral+0.04*luar+0.05*bawah"}),
    k(0.95, p="netral+0.04*luar"),
], L=cermin([
    k(0, p="netral+0.04*luar", a="telapak", b="FLAT", j="depan", tp="bawah"),
    *bolak(0.15, 0.2, 4, {"p": "netral+0.04*luar+0.05*bawah"}, {"p": "netral+0.04*luar+0.05*atas"}),
    k(0.95, p="netral+0.04*luar"),
]), gloss="BALANCE",
  cara="Dua telapak datar menghadap bawah naik-turun bergantian seperti timbangan, lalu sejajar.")

S("B24_FAST", "Cepat", "Sastra", [
    k(0, p="netral+0.06*depan", a="telunjuk", b="L", j="depan", tp="dalam"),
    k(0.15),
    k(0.3, p="netral+0.01*depan", b="X"),
    k(0.6),
], L=cermin([
    k(0, p="netral+0.06*depan", a="telunjuk", b="L", j="depan", tp="dalam"),
    k(0.15),
    k(0.3, p="netral+0.01*depan", b="X"),
    k(0.6),
]), gloss="FAST",
  cara="Dua tangan L menunjuk ke depan lalu cepat ditarik sambil telunjuk menekuk (X).")

S("B24_FACE", "Wajah", "Sastra",
  lingkar(0, 0.8, "hidung+0.10*depan", 0.07, "luar", "atas", n=10, mulai=90,
          a="telunjuk", b="1", j="atas+0.3*belakang", tp="belakang+0.3*dalam") + [k(0.95)],
  gloss="FACE", cara="Telunjuk melingkari wajah satu putaran.")

S("B24_EXPRESSION", "Ekspresi wajah", "Sastra", [
    k(0, p="pipi+0.07*depan+0.04*luar+0.03*atas", a="telunjuk", b="X", j="atas", tp="depan"),
    *bolak(0.15, 0.18, 4, {"p": "pipi+0.07*depan+0.04*luar+0.05*bawah"}, {"p": "pipi+0.07*depan+0.04*luar+0.03*atas"}),
    k(0.9),
], L=cermin([
    k(0, p="pipi+0.07*depan+0.04*luar+0.05*bawah", a="telunjuk", b="X", j="atas", tp="depan"),
    *bolak(0.15, 0.18, 4, {"p": "pipi+0.07*depan+0.04*luar+0.03*atas"}, {"p": "pipi+0.07*depan+0.04*luar+0.05*bawah"}),
    k(0.9),
]), wajah="senang", gloss="EXPRESSION",
  cara="Dua tangan X di samping wajah naik-turun bergantian (wajah ikut berekspresi).")

S("B24_ANALYZE", "Menganalisis", "Sastra", [
    k(0, p=A(-0.04, -0.38, 1.33), a="ujung", b="BENT_V", j="bawah+0.3*dalam", tp="bawah+0.4*belakang"),
    *bolak(0.15, 0.18, 4, {"p": A(-0.04, -0.38, 1.24)}, {"p": A(-0.04, -0.38, 1.33)}),
    k(0.9),
], L=cermin([
    k(0, p=A(-0.04, -0.38, 1.24), a="ujung", b="BENT_V", j="bawah+0.3*dalam", tp="bawah+0.4*belakang"),
    *bolak(0.15, 0.18, 4, {"p": A(-0.04, -0.38, 1.33)}, {"p": A(-0.04, -0.38, 1.24)}),
    k(0.9),
]), wajah="wh", gloss="ANALYZE",
  cara="Dua tangan V bengkok saling berhadapan bergerak turun bergantian, seperti mengurai sesuatu.")

S("B24_DISCUSS", "Berdiskusi / membahas", "Sastra", [
    k(0, p=A(0.03, -0.31, 1.25), a="sisi_kelingking", b="1", j="depan+0.3*dalam", tp="dalam"),
    *bolak(0.15, 0.14, 6, {"p": A(0.03, -0.31, 1.18)}, {"p": A(0.03, -0.31, 1.23)}),
    k(0.95, p=A(0.03, -0.31, 1.18)),
], L=[k(0, **_ALAS)], gloss="DISCUSS",
  cara="Sisi telunjuk kanan mengetuk-ngetuk telapak kiri beberapa kali (membahas poin demi poin).")

# ── Panggung, video & penonton ─────────────────────────────────────────────

S("B24_STAGE", "Panggung", "Pentas", [
    k(0, p=A(0.06, -0.29, 1.215), a="telapak", b="S", j="depan+0.4*dalam", tp="bawah"),
    k(0.15),
    k(0.65, p=A(-0.02, -0.40, 1.215)),
    k(0.8),
], L=[k(0, p=A(0.03, -0.33, 1.19), a="punggung", b="FLAT", j="dalam+0.6*depan", tp="bawah")],
  gloss="STAGE", cara="Kepalan S kanan meluncur di atas punggung tangan & lengan kiri yang mendatar (lantai panggung).")

S("B24_AUDIENCE", "Penonton / hadirin", "Pentas", [
    k(0, p="netral+0.04*luar+0.02*bawah", a="telapak", b="CLAW", j="depan+0.2*bawah", tp="bawah"),
    k(0.15),
    k(0.7, p="netral+0.04*luar+0.18*depan+0.02*bawah"),
    k(0.85),
], L=cermin([
    k(0, p="netral+0.04*luar+0.06*depan", a="telapak", b="CLAW", j="depan+0.2*bawah", tp="bawah"),
    k(0.15),
    k(0.7, p="netral+0.04*luar+0.24*depan"),
    k(0.85),
]), gloss="AUDIENCE",
  cara="Dua tangan 5 bengkok menghadap bawah, satu di belakang yang lain, bergerak maju bersama (barisan orang).")

S("B24_CAMERA", "Kamera / merekam foto", "Pentas", [
    k(0, p="mata+0.12*depan+0.02*luar", a="telunjuk", b="L", j="atas", tp="depan"),
    k(0.15),
    k(0.3, b="BENT_L"), k(0.45, b="L"), k(0.6, b="BENT_L"),
    k(0.85, b="L"),
], L=[k(0, p="mata_kiri+0.12*depan+0.02*luar", a="telunjuk", b="L", j="atas", tp="depan")],
  gloss="CAMERA",
  cara="Dua tangan L di depan mata seperti memegang kamera; telunjuk kanan menekuk menekan tombol rana.")

S("B24_LIGHT", "Cahaya / lampu sorot", "Pentas", [
    k(0, p="dahi+0.20*depan+0.04*atas", a="ujung", b="FLAT_O", j="bawah+0.2*depan", tp="belakang"),
    k(0.15),
    k(0.45, p="dahi+0.22*depan+0.02*atas", b="5"),
    k(0.75),
], gloss="LIGHT",
  cara="Tangan O-pipih di atas depan kepala membuka menjadi 5 ke arah bawah, seperti lampu yang menyorot.")

S("B24_APPLAUSE", "Tepuk tangan Tuli (applause)", "Pentas", [
    k(0, p="pelipis+0.14*luar+0.12*depan+0.12*bawah", a="pergelangan", b="5", j="atas", tp="depan"),
    *bolak(0.12, 0.13, 6, {"putar": -40}, {"putar": 40}),
    k(0.95, putar=0),
], L=cermin([
    k(0, p="pelipis+0.14*luar+0.12*depan+0.12*bawah", a="pergelangan", b="5", j="atas", tp="depan"),
    *bolak(0.12, 0.13, 6, {"putar": -40}, {"putar": 40}),
    k(0.95, putar=0),
]), wajah="senang", gloss="APPLAUSE",
  cara="Dua tangan 5 diangkat setinggi kepala dan pergelangannya diputar bolak-balik — tepuk tangan visual.")

S("B24_GROUP", "Kelompok", "Pentas", [
    k(0, p=A(-0.03, -0.44, 1.28), a="telapak", b="C", j="atas+0.2*depan", tp="depan+0.5*kiri"),
    k(0.15),
    k(0.45, p=A(-0.12, -0.38, 1.28)),
    k(0.75, p=A(-0.04, -0.28, 1.28), tp="belakang+0.5*kiri"),
    k(0.9),
], L=[k(0, p=A(0.03, -0.44, 1.28), a="telapak", b="C", j="atas+0.2*depan", tp="depan+0.5*kanan"),
      k(0.15), k(0.45, p=A(0.12, -0.38, 1.28)), k(0.75, p=A(0.04, -0.28, 1.28), tp="belakang+0.5*kanan"), k(0.9)],
  gloss="GROUP", cara="Dua tangan C berdampingan di depan, lalu membuat lingkaran ke luar dan bertemu lagi di dekat badan.")

S("B24_TOGETHER", "Bersama-sama", "Pentas",
  lingkar(0, 0.8, A(-0.018, -0.38, 1.24), 0.04, "kanan", "depan", n=8, mulai=0,
          a="buku", b="A", j="depan+0.3*atas", tp="kiri") + [k(0.95)],
  L=lingkar(0, 0.8, A(0.018, -0.38, 1.24), 0.04, "kanan", "depan", n=8, mulai=0,
            a="buku", b="A", j="depan+0.3*atas", tp="kanan") + [k(0.95)],
  gloss="TOGETHER", cara="Dua kepalan A saling menempel di buku jari, lalu bersama-sama membuat lingkaran datar.")

# ── Tradisi & alam (bahan cerita/puisi) ────────────────────────────────────

S("B24_TRADITION", "Tradisi", "Folklor", [
    k(0, p=A(-0.005, -0.36, 1.27), a="telapak", b="T", j="depan+0.4*dalam", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.005, -0.38, 1.19)),
    k(0.8),
], L=[k(0, p=A(0.005, -0.36, 1.235), a="punggung", b="T", j="depan+0.4*dalam", tp="bawah"),
      k(0.15), k(0.6, p=A(0.005, -0.38, 1.155)), k(0.8)],
  gloss="TRADITION",
  cara="Tangan T kanan bertumpu di atas tangan T kiri, keduanya ditekan turun bersama (kebiasaan yang mengakar).")

S("B24_GENERATION", "Generasi / turun-temurun", "Folklor", [
    k(0, p="bahu_kanan+0.05*depan+0.10*depan+0.02*atas", a="telapak", b="BENT_B", j="kiri+0.3*bawah", tp="belakang"),
    k(0.15),
    k(0.35, p="bahu_kanan+0.05*depan+0.18*depan+0.05*bawah"),
    k(0.55, p="bahu_kanan+0.05*depan+0.16*depan+0.11*bawah"),
    k(0.75, p="bahu_kanan+0.05*depan+0.25*depan+0.17*bawah"),
    k(0.95, p="bahu_kanan+0.05*depan+0.24*depan+0.24*bawah"),
    k(1.1),
], L=[k(0, p="bahu_kanan+0.05*depan+0.15*depan+0.06*atas+0.06*kiri", a="telapak", b="BENT_B", j="kanan+0.3*bawah", tp="belakang"),
      k(0.15), k(0.35, p="bahu_kanan+0.05*depan+0.23*depan+0.01*bawah+0.06*kiri"), k(0.55, p="bahu_kanan+0.05*depan+0.21*depan+0.07*bawah+0.06*kiri"),
      k(0.75, p="bahu_kanan+0.05*depan+0.30*depan+0.13*bawah+0.06*kiri"), k(0.95, p="bahu_kanan+0.05*depan+0.29*depan+0.20*bawah+0.06*kiri"), k(1.1)],
  gloss="GENERATION",
  cara="Dua tangan tertekuk di depan bahu bergulir maju-turun berulang, seperti generasi yang turun-temurun.")

S("B24_WAVE", "Ombak / gelombang", "Folklor", [
    k(0, p="netral+0.06*luar+0.04*belakang", a="telapak", b="FLAT", j="depan", tp="bawah"),
    k(0.2, p="netral+0.04*luar+0.05*depan+0.06*atas", j="depan+0.3*atas", kurva=True),
    k(0.4, p="netral+0.02*luar+0.12*depan+0.02*bawah", j="depan+0.3*bawah", kurva=True),
    k(0.6, p="netral+0.0*luar+0.19*depan+0.06*atas", j="depan+0.3*atas", kurva=True),
    k(0.8, p="netral+0.02*dalam+0.26*depan+0.02*bawah", j="depan+0.3*bawah", kurva=True),
    k(0.95),
], gloss="WAVE", cara="Tangan datar menghadap bawah bergerak maju naik-turun bergelombang.")

S("B24_MOON", "Bulan", "Folklor", [
    k(0, p="mata+0.05*depan+0.03*luar", a="telunjuk", b="C", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.6, p="mata+0.12*depan+0.10*luar+0.07*atas"),
    k(0.8),
], gloss="MOON", cara="Tangan C kecil (ibu jari & telunjuk) di dekat mata, lalu naik menjauh ke atas (bulan sabit di langit).")

S("B24_STAR", "Bintang", "Folklor", [
    k(0, p="dahi+0.20*depan+0.02*bawah+0.05*luar", a="telunjuk", b="1", j="atas", tp="depan"),
    *bolak(0.15, 0.15, 5, {"p": "dahi+0.20*depan+0.06*atas+0.05*luar"}, {"p": "dahi+0.20*depan+0.02*bawah+0.05*luar"}),
    k(0.95),
], L=cermin([
    k(0, p="dahi+0.20*depan+0.06*atas+0.05*luar", a="telunjuk", b="1", j="atas", tp="depan"),
    *bolak(0.15, 0.15, 5, {"p": "dahi+0.20*depan+0.02*bawah+0.05*luar"}, {"p": "dahi+0.20*depan+0.06*atas+0.05*luar"}),
    k(0.95),
]), gloss="STAR", cara="Dua telunjuk menunjuk ke atas, bergantian bergesekan naik ke arah langit.")

# ── Tokoh cerita ───────────────────────────────────────────────────────────

S("B24_CHILD", "Anak", "Folklor", [
    k(0, p="perut+0.20*depan+0.16*luar+0.02*bawah", a="telapak", b="FLAT", j="depan+0.3*luar", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": "perut+0.20*depan+0.16*luar+0.06*bawah"}, {"p": "perut+0.20*depan+0.16*luar+0.02*bawah"}),
    k(0.8),
], gloss="CHILD", cara="Telapak datar menghadap bawah di samping badan, ditepuk-tepukkan turun seperti mengusap kepala anak.")
