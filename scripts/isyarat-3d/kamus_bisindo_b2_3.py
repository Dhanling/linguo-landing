# [isyarat-b1b2-v1] Kamus isyarat BISINDO B2.3 "Narasi Panjang & Analisis Video".
# Tangan dominan kanan. Format sama dengan kamus_bisindo.py.
# ⚠️ Rujukan daring untuk kosakata BISINDO tingkat lanjut (narasi, analisis, berita) sangat
#    sedikit dan variasi daerahnya besar. Hampir semua bentuk di sini ditulis dari prinsip ikonik
#    umum BISINDO + gerak bibir dan DITANDAI ragu=True — WAJIB dicek pengajar Tuli.
#    Istilah berita (politik, ekonomi, pemerintah) ditulis sebagai ejaan jari karena bentuk
#    lokalnya tidak kami ketahui dengan pasti. Bentuk ASL sengaja TIDAK disalin.
#    Catatan: kode B23_JALAN_TERUS, B23_MOBIL_LAJU, B23_ORANG_JALAN, B23_PESAN_TITIP,
#    B23_TERTAWA_TERUS sudah dipakai kamus A2.3 — tidak didefinisikan ulang di sini.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"
_TELUNJUK_DAHI = dict(a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang")
_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
_PAPAN = A(0.04, -0.36, 1.24)
_L_PAPAN = [k(0, p=_PAPAN, a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")]


def _sym(keys):
    return dict(R=keys, L=cermin(keys))


# ── Struktur narasi ────────────────────────────────────────────────────────

S("B23_TOKOH", "Tokoh (dalam cerita)", "Narasi", [
    k(0, p="netral+0.10*atas+0.02*dalam", a="telunjuk", b="1", j="atas", tp="dalam+0.5*belakang"),
    k(0.15),
    k(0.45, p="netral+0.06*atas+0.10*luar+0.06*depan"),
    k(0.58, p="netral+0.03*atas+0.10*luar+0.06*depan"),
    k(0.85),
], gloss="TOKOH",
  cara="Telunjuk tegak (orang) diletakkan mantap di satu titik ruang — tokoh itu kini 'tinggal' di sana; ucapkan 'tokoh'.",
  ragu=True)

_KONFLIK = [
    k(0, p=A(-0.16, -0.36, 1.28), a="telunjuk", b="1", j="dalam+0.4*depan", tp="bawah"),
    k(0.15),
    k(0.45, p=A(-0.025, -0.38, 1.28)),
    k(0.55, p=A(-0.045, -0.38, 1.28)),
    k(0.65, p=A(-0.025, -0.38, 1.28)),
    k(0.9),
]
S("B23_KONFLIK", "Konflik / pertentangan", "Narasi", **_sym(_KONFLIK), wajah="sedih", gloss="KONFLIK",
  cara="Dua telunjuk dari samping saling mendekat dan beradu ujungnya dua kali, wajah tegang — dua pihak bertentangan.",
  ragu=True)

S("B23_PUNCAK", "Puncak (cerita)", "Narasi", [
    k(0, p=A(-0.04, -0.36, 1.18), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.35, p=A(-0.04, -0.36, 1.25)),
    k(0.5, p=A(-0.04, -0.36, 1.24)),
    k(0.7, p=A(-0.04, -0.36, 1.36)),
    k(0.85, p=A(-0.04, -0.36, 1.42)),
    k(1.1),
], kepala=[(0.2, 0, 0, 0), (0.85, -6, 0, 0)], gloss="PUNCAK",
  cara="Tangan datar telapak ke bawah naik bertahap makin tinggi lalu berhenti di titik tertinggi — ketegangan memuncak.",
  ragu=True)

S("B23_KILAS_BALIK", "Kilas balik", "Narasi", [
    k(0, p="netral+0.10*atas+0.06*depan", a="telapak", b="FLAT", j="atas+0.3*depan", tp="belakang+0.4*dalam"),
    k(0.15),
    k(0.5, p="bahu_kanan+0.04*atas+0.02*depan+0.04*luar", j="belakang+0.6*atas", tp="dalam"),
    k(0.65),
    k(0.95),
], kepala=[(0.2, 0, 0, 0), (0.5, -4, 8, 0), (0.85, 0, 0, 0)], gloss="KILAS-BALIK",
  cara="Tangan datar dari depan diayun melengkung ke atas bahu kanan menuju belakang — cerita mundur ke masa lalu; pandangan ikut menjauh.",
  ragu=True)

_KAMERA = [
    k(0, p="mata+0.20*depan+0.08*luar+0.04*bawah", a="telapak", b="L", j="dalam+0.3*atas", tp="depan"),
    k(0.15),
    k(0.4, b="BENT_L"),
    k(0.55, b="L"),
    k(0.85),
]
S("B23_KAMERA", "Kamera / sudut kamera", "Narasi", R=_KAMERA, L=cermin([
    k(0, p="mata+0.20*depan+0.08*luar+0.04*bawah", a="telapak", b="L", j="dalam+0.3*atas", tp="depan"),
    k(0.85),
]), gloss="KAMERA",
  cara="Dua tangan L membingkai di depan mata seperti memegang kamera; telunjuk kanan menekuk menekan tombol rana.",
  ragu=True)

S("B23_GERAK_LAMBAT", "Gerak lambat", "Narasi", [
    k(0, p=A(-0.06, -0.32, 1.26), a="telapak", b="5", j="atas+0.4*depan", tp="depan"),
    k(0.2),
    k(1.2, p=A(-0.08, -0.46, 1.30)),
    k(1.4),
], wajah="tidur", kepala=[(0.2, 0, 0, 0), (1.2, 4, 0, 0)], gloss="GERAK-LAMBAT",
  cara="Tangan terbuka bergerak maju sangat pelan dengan mata setengah tertutup — adegan diperlambat; dipakai juga pada isyarat lain (diperlambat).",
  ragu=True)

S("B23_ADEGAN", "Adegan", "Narasi", **_sym([
    k(0, p=A(-0.08, -0.40, 1.34), a="ujung", b="L", j="atas+0.3*luar", tp="depan"),
    k(0.15),
    k(0.4, p=A(-0.12, -0.40, 1.30)),
    k(0.85),
]), gloss="ADEGAN",
  cara="Dua tangan L membentuk bingkai persegi di depan, lalu bingkai sedikit melebar — satu potongan adegan.",
  ragu=True)

S("B23_URUTAN", "Urutan / kronologi", "Narasi", [
    k(0, p="netral+0.06*atas+0.04*dalam", a="sisi_kelingking", b="FLAT", j="depan+0.2*atas", tp="luar"),
    k(0.12),
    k(0.25, p="netral+0.04*atas+0.04*dalam"),
    k(0.4, p="netral+0.06*atas+0.04*luar"),
    k(0.5, p="netral+0.04*atas+0.04*luar"),
    k(0.65, p="netral+0.06*atas+0.12*luar"),
    k(0.75, p="netral+0.04*atas+0.12*luar"),
    k(1.0),
], gloss="URUTAN",
  cara="Tangan datar tegak ditaruh di tiga titik berurutan dari tengah ke samping — peristiwa satu, dua, tiga.",
  ragu=True)

S("B23_MENIT", "Menit", "Narasi", [
    k(0, p=A(0.05, -0.35, 1.25), a="telunjuk", b="1", j="bawah+0.4*depan", tp="belakang"),
    k(0.12, p=A(0.05, -0.35, 1.215)),
    k(0.3, p=A(-0.02, -0.38, 1.28), a="pergelangan", b="1", j="atas", tp="depan"),
    k(0.5, putar=-35),
    k(0.7, putar=0),
    k(0.9),
], L=[k(0, p=A(0.05, -0.33, 1.20), a="pergelangan", b="S", j="dalam+0.4*depan", tp="bawah")],
  gloss="MENIT",
  cara="Telunjuk menyentuh pergelangan kiri (jam tangan), lalu telunjuk tegak berayun kecil seperti jarum jam; ucapkan 'menit'.",
  ragu=True)

# ── Biografi ───────────────────────────────────────────────────────────────

_LAHIR = [
    k(0, p="perut+0.06*depan+0.03*luar", a="telapak", b="FLAT", j="bawah+0.6*dalam", tp="belakang+0.3*atas"),
    k(0.15),
    k(0.55, p="perut+0.20*depan+0.06*bawah+0.06*luar", j="depan+0.4*dalam", tp="atas"),
    k(0.85),
]
S("B23_LAHIR", "Lahir", "Biografi", **_sym(_LAHIR), gloss="LAHIR",
  cara="Dua telapak dari depan perut bergerak maju-turun dan terbuka ke atas — bayi lahir; ucapkan 'lahir'.",
  ragu=True)

S("B23_MENINGGAL", "Meninggal / wafat", "Biografi", [
    k(0, p=_ALAS + A(0, -0.02, 0.12), a="ujung", b="V", j="atas+0.2*depan", tp="belakang"),
    k(0.2),
    k(0.6, p=_ALAS + A(0, -0.02, 0.02), j="depan+0.3*dalam", tp="atas"),
    k(0.95),
], L=_L_ALAS, kepala=[(0.2, 0, 0, 0), (0.6, 10, 0, 0)], wajah="sedih", gloss="MENINGGAL",
  cara="Jari V (kaki orang) yang tegak direbahkan telentang di telapak kiri, kepala menunduk, wajah sedih.",
  ragu=True)

S("B23_HIDUP", "Hidup / kehidupan", "Biografi", [
    k(0, p="dada_kiri+0.04*depan", a="telapak", b="S", j="atas+0.3*dalam", tp="belakang"),
    *bolak(0.12, 0.14, 4, {"p": "dada_kiri+0.07*depan", "b": "5"}, {"p": "dada_kiri+0.04*depan", "b": "S"}),
    k(0.8),
], gloss="HIDUP",
  cara="Kepalan di dada kiri membuka-menutup seperti jantung berdetak — masih hidup; ucapkan 'hidup'.",
  ragu=True)

S("B23_TUA", "Tua / lanjut usia", "Biografi", [
    k(0, p=A(-0.10, -0.32, 1.12), a="telapak", b="S", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.35, p=A(-0.10, -0.34, 1.09)),
    k(0.55, p=A(-0.10, -0.36, 1.12)),
    k(0.75, p=A(-0.10, -0.38, 1.09)),
    k(1.0),
], kepala=[(0.1, 0, 0, 0), (0.4, 14, 0, 0), (0.9, 12, 0, 0)], gloss="TUA",
  cara="Kepalan seperti memegang tongkat, diayun pelan ke depan dengan badan dan kepala sedikit membungkuk; ucapkan 'tua'.",
  ragu=True)

# ── Analisis video ─────────────────────────────────────────────────────────

S("B23_ANALISIS", "Analisis / menganalisis", "Analisis", [
    k(0, p=_ALAS + A(0.04, 0.02, 0.07), a="sisi_kelingking", b="FLAT", j="depan+0.4*dalam", tp="dalam"),
    k(0.12, p=_ALAS + A(0.04, 0.02, 0.012)),
    k(0.27, p=_ALAS + A(0.0, -0.01, 0.07)),
    k(0.39, p=_ALAS + A(0.0, -0.01, 0.012)),
    k(0.54, p=_ALAS + A(-0.04, -0.04, 0.07)),
    k(0.66, p=_ALAS + A(-0.04, -0.04, 0.012)),
    k(0.9),
], L=_L_ALAS, wajah="wh", gloss="ANALISIS",
  cara="Sisi kelingking tangan kanan 'memotong' telapak kiri tiga kali sambil bergeser — mengurai bagian demi bagian; alis berkerut.",
  ragu=True)

S("B23_IDE", "Ide / gagasan", "Analisis", [
    k(0, p=_DAHI + "+0.03*depan", a="ujung", b="FLAT_O", j="atas+0.5*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="pelipis+0.08*atas+0.08*depan+0.02*luar", a="telapak", b="5", j="atas", tp="depan"),
    k(0.85),
], wajah="senang", gloss="IDE",
  cara="Jari kuncup di pelipis lalu naik dan mekar terbuka di samping kepala seperti lampu menyala.",
  ragu=True)

S("B23_DETAIL", "Detail / rinci", "Analisis", [
    k(0, p="mata+0.12*depan+0.04*bawah", a="ujung", b="BABY_O", j="atas+0.4*dalam", tp="dalam"),
    *bolak(0.15, 0.14, 4, {"p": "mata+0.12*depan+0.04*bawah+0.03*luar"}, {"p": "mata+0.12*depan+0.04*bawah"}),
    k(0.85),
], wajah="wh", gloss="DETAIL",
  cara="Jempol dan telunjuk hampir bertemu (sesuatu yang kecil) di depan mata, bergeser kecil kiri-kanan dengan mata menyipit.",
  ragu=True)

S("B23_RINGKAS", "Ringkas / meringkas", "Analisis", **_sym([
    k(0, p=A(-0.15, -0.36, 1.26), a="telapak", b="FLAT", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.05, -0.36, 1.26)),
    k(0.85),
]), gloss="RINGKAS",
  cara="Dua telapak tegak berhadapan berjauhan lalu didorong saling mendekat — yang panjang dipadatkan menjadi pendek.",
  ragu=True)

S("B23_EKSPRESI", "Ekspresi wajah / penanda wajah", "Analisis", R=[
    k(0, p="pipi+0.10*depan+0.13*luar", a="telapak", b="5", j="atas", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "pipi+0.10*depan+0.13*luar+0.04*atas"}, {"p": "pipi+0.10*depan+0.13*luar+0.02*bawah"}),
    k(0.85),
], L=cermin([
    k(0, p="pipi+0.10*depan+0.13*luar", a="telapak", b="5", j="atas", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "pipi+0.10*depan+0.13*luar+0.02*bawah"}, {"p": "pipi+0.10*depan+0.13*luar+0.04*atas"}),
    k(0.85),
]), wajah="senang", gloss="EKSPRESI",
  cara="Dua tangan terbuka di kiri-kanan wajah naik-turun bergantian (wajah berubah-ubah), sambil memainkan ekspresi.",
  ragu=True)

S("B23_GAYA", "Gaya (berisyarat)", "Analisis", R=[
    k(0, p="dada_kanan+0.06*depan", a="telapak", b="5", j="atas+0.4*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="dada_kanan+0.10*depan+0.14*bawah", j="atas+0.2*luar", tp="belakang+0.3*luar"),
    k(0.85),
], wajah="senang", gloss="GAYA",
  cara="Tangan terbuka dari dada menyapu turun seperti menunjukkan penampilan — gaya khas seseorang.",
  ragu=True)

S("B23_VARIASI", "Variasi / beragam", "Analisis", R=[
    k(0, p=A(-0.04, -0.38, 1.26), a="telunjuk", b="1", j="atas+0.3*depan", tp="depan"),
    k(0.12, p=A(-0.08, -0.38, 1.30)),
    k(0.27, p=A(-0.12, -0.38, 1.24)),
    k(0.42, p=A(-0.16, -0.38, 1.30)),
    k(0.57, p=A(-0.20, -0.38, 1.24)),
    k(0.85),
], L=cermin([
    k(0, p=A(-0.04, -0.38, 1.26), a="telunjuk", b="1", j="atas+0.3*depan", tp="depan"),
    k(0.12, p=A(-0.08, -0.38, 1.24)),
    k(0.27, p=A(-0.12, -0.38, 1.30)),
    k(0.42, p=A(-0.16, -0.38, 1.24)),
    k(0.57, p=A(-0.20, -0.38, 1.30)),
    k(0.85),
]), gloss="VARIASI",
  cara="Dua telunjuk bergerak ke samping sambil naik-turun berlawanan — beda-beda di tiap tempat; ucapkan 'variasi'.",
  ragu=True)

S("B23_KOMENTAR", "Komentar / tanggapan", "Analisis", [
    k(0, p="mulut+0.07*depan+0.03*bawah", a="ujung", b="FLAT_O", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.55, p=_PAPAN + A(-0.03, -0.01, 0.03), a="ujung", b="FLAT", j="depan+0.5*dalam", tp="luar"),
    k(0.68, p=_PAPAN + A(-0.012, -0.01, 0.03)),
    k(0.95),
], L=_L_PAPAN, gloss="KOMENTAR",
  cara="Tangan kuncup dari mulut bergerak dan ditempelkan ke telapak kiri yang tegak (layar) — menaruh tanggapan.",
  ragu=True)

# ── Berita ─────────────────────────────────────────────────────────────────

S("B23_POLITIK", "Politik", "Berita", [],
  cara="Dieja jari: P-O-L-I-T-I-K (bentuk isyarat lokal berbeda-beda); tanyakan ke pengajar Tuli.",
  gloss="POLITIK", ragu=True)

S("B23_EKONOMI", "Ekonomi", "Berita", [],
  cara="Dieja jari: E-K-O-N-O-M-I (sebagian penutur memakai isyarat UANG + gerak bibir); tanyakan ke pengajar Tuli.",
  gloss="EKONOMI", ragu=True)

S("B23_PEMERINTAH", "Pemerintah", "Berita", [],
  cara="Dieja jari: P-E-M-E-R-I-N-T-A-H (bentuk isyarat lokal berbeda-beda); tanyakan ke pengajar Tuli.",
  gloss="PEMERINTAH", ragu=True)

# ── Misteri & ketegangan ───────────────────────────────────────────────────

S("B23_MISTERI", "Misteri", "Misteri",
  [k(0, p="dagu+0.20*depan+0.04*bawah+0.04*luar", a="telapak", b="5", j="atas+0.3*luar", tp="belakang")] +
  lingkar(0.15, 0.95, "dagu+0.20*depan+0.04*bawah+0.04*luar", 0.04, "luar", "atas", n=8, mulai=0, putaran=1) + [k(1.15)],
  wajah="wh", gloss="MISTERI",
  cara="Tangan terbuka di depan mata berputar pelan seperti kabut yang menutupi pandangan, mata menyipit curiga.",
  ragu=True)

S("B23_RAHASIA", "Rahasia", "Misteri", [
    k(0, p="mulut+0.06*depan", a="telunjuk", b="1", j="atas", tp="belakang"),
    k(0.15, p="mulut+0.014*depan"),
    k(0.6),
    k(0.85),
], kepala=[(0.1, 0, 0, 0), (0.3, 4, 0, 0)], gloss="RAHASIA",
  cara="Telunjuk tegak ditempelkan di depan bibir ('sst'), mata melirik — jangan diceritakan ke orang lain.",
  ragu=True)

S("B23_PETUNJUK", "Petunjuk / jejak", "Misteri", [
    k(0, p=A(-0.02, -0.32, 1.17), a="telunjuk", b="1", j="bawah+0.5*depan", tp="belakang"),
    k(0.12, p=A(-0.02, -0.32, 1.13)),
    k(0.27, p=A(-0.04, -0.38, 1.17)),
    k(0.36, p=A(-0.04, -0.38, 1.13)),
    k(0.51, p=A(-0.06, -0.44, 1.17)),
    k(0.6, p=A(-0.06, -0.44, 1.13)),
    k(0.85),
], wajah="wh", gloss="PETUNJUK",
  cara="Telunjuk mengetuk tiga titik berurutan menjauh ke depan seperti mengikuti jejak, mata mengikuti dengan serius.",
  ragu=True)

S("B23_HILANG", "Hilang", "Misteri", [
    k(0, p=_ALAS + A(0, -0.01, 0.025), a="ujung", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.55, p=_ALAS + A(-0.02, -0.04, 0.16), a="telapak", b="5", j="atas+0.3*depan", tp="bawah"),
    k(0.85),
], L=_L_ALAS, wajah="sedih", gloss="HILANG",
  cara="Jari kuncup kanan terangkat dari telapak kiri lalu mekar terbuka — barang yang tadi ada kini lenyap; wajah bingung.",
  ragu=True)

_UNGKAP = [
    k(0, p=A(-0.015, -0.36, 1.36), a="telapak", b="FLAT", j="atas", tp="dalam"),
    k(0.2),
    k(0.5, p=A(-0.14, -0.36, 1.36), tp="depan+0.3*dalam"),
    k(0.85),
]
S("B23_KETAHUAN", "Ketahuan / terungkap", "Misteri", **_sym(_UNGKAP), wajah="ya_tidak", gloss="KETAHUAN",
  cara="Dua telapak tegak berimpit di depan wajah lalu terbuka cepat ke samping, alis naik terkejut — rahasianya terungkap.",
  ragu=True)

S("B23_TEGANG", "Tegang / menegangkan", "Misteri", **_sym([
    k(0, p=A(-0.07, -0.33, 1.30), a="telapak", b="CLAW", j="atas+0.3*dalam", tp="belakang"),
    *bolak(0.12, 0.08, 7, {"p": A(-0.072, -0.33, 1.303)}, {"p": A(-0.068, -0.33, 1.297)}),
    k(0.8),
]), wajah="sedih", gloss="TEGANG",
  cara="Dua tangan cakar di depan dada bergetar kecil, bahu terangkat dan wajah tegang.",
  ragu=True)

S("B23_CURI", "Curi / mencuri", "Misteri", [
    k(0, p=_ALAS + A(0, -0.02, 0.06), a="ujung", b="CLAW", j="bawah+0.3*depan", tp="bawah"),
    k(0.12, p=_ALAS + A(0, -0.02, 0.02)),
    k(0.3, p=_ALAS + A(0, -0.02, 0.025), b="S"),
    k(0.55, p=A(-0.12, -0.24, 1.12), j="depan", tp="dalam"),
    k(0.85),
], L=_L_ALAS, wajah="wh", gloss="CURI",
  cara="Tangan cakar menyambar sesuatu dari telapak kiri, menggenggam, lalu cepat ditarik ke samping badan (disembunyikan).",
  ragu=True)

# ── Kesaksian ──────────────────────────────────────────────────────────────

S("B23_SAKSI", "Saksi / melihat sendiri", "Kesaksian", [
    k(0, p="mata+0.06*depan+0.02*luar", a="jari_telunjuk", b="V", j="atas+0.6*depan", tp="belakang"),
    k(0.15),
    k(0.45, p="netral+0.12*atas+0.16*depan", j="depan", tp="bawah"),
    k(0.7, p="dada+0.03*depan", a="ujung", b="1", j="belakang+0.4*bawah", tp="dalam"),
    k(0.95),
], kepala=[(0.6, 0, 0, 0), (0.75, 8, 0, 0)], gloss="SAKSI",
  cara="Jari V dari mata ke arah kejadian, lalu telunjuk menunjuk dada sendiri sambil mengangguk — 'aku sendiri yang melihat'.",
  ragu=True)

S("B23_KATANYA", "Katanya / kabar dari orang lain", "Kesaksian", [
    k(0, p="telinga+0.04*depan+0.02*luar", a="ujung", b="1", j="atas+0.4*dalam", tp="depan"),
    k(0.15),
    k(0.5, p="netral+0.10*atas+0.14*luar+0.08*depan", j="depan+0.6*luar", tp="bawah"),
    k(0.85),
], kepala=[(0.3, 0, 0, 0), (0.55, 0, 0, 8)], wajah="ya_tidak", gloss="KATANYA",
  cara="Telunjuk di dekat telinga lalu menunjuk ke samping (orang lain), kepala sedikit miring — 'kudengar dari orang lain, belum tentu benar'.",
  ragu=True)

S("B23_PERBAIKI", "Perbaiki / revisi", "Kesaksian", [
    k(0, p=A(-0.02, -0.36, 1.27), a="telapak", b="S", j="depan+0.4*dalam", tp="bawah"),
    *bolak(0.12, 0.14, 4, {"putar": -40}, {"putar": 20}),
    k(0.75, putar=0),
], L=[k(0, p=A(0.02, -0.36, 1.21), a="punggung", b="S", j="depan+0.4*dalam", tp="bawah")],
  gloss="PERBAIKI",
  cara="Kepalan kanan di atas kepalan kiri memutar bolak-balik seperti memutar obeng — memperbaiki; ucapkan 'perbaiki'.",
  ragu=True)
