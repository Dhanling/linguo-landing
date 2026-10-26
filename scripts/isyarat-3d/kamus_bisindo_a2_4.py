# [isyarat-bisindo-a1a2-v1] Kamus isyarat BISINDO A2.4 "Pendapat & Masyarakat".
# Tangan dominan kanan. Format sama dengan kamus_bisindo.py.
# ⚠️ Rujukan daring untuk kosakata A2.4 BISINDO sangat sedikit; sebagian besar bentuk di
#    sini ditulis dari prinsip ikonik umum BISINDO + gerak bibir dan DITANDAI ragu=True —
#    WAJIB dicek pengajar Tuli (variasi daerah Jakarta/Yogyakarta/Makassar dll. besar).
#    Bentuk ASL (kamus_a2_4.py) sengaja TIDAK disalin.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # jempol tegak, jari lain menggenggam (bagus/setuju)
    "B24_JEMPOL": (I._jari(_G), "tegak"),
})

_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"
_TELUNJUK_DAHI = dict(a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang")
# telapak kiri datar menghadap atas di depan badan (alas)
_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]


def _sym(keys):
    return dict(R=keys, L=cermin(keys))


# ── Pendapat ───────────────────────────────────────────────────────────────

S("PIKIR", "Pikir / berpikir", "Pendapat", [
    k(0, p=_DAHI + "+0.05*depan", **_TELUNJUK_DAHI),
    k(0.22, p=_DAHI),
    k(0.36, p=_DAHI + "+0.015*depan"),
    k(0.5, p=_DAHI),
    k(0.75),
], cara="Ujung telunjuk mengetuk pelipis dua kali, sambil mengucapkan 'pikir' tanpa suara.")

S("PENDAPAT", "Pendapat / menurut", "Pendapat", [
    k(0, p=_DAHI + "+0.04*depan", **_TELUNJUK_DAHI),
    k(0.2, p=_DAHI),
    k(0.32),
    k(0.7, p="netral+0.12*atas+0.06*depan", a="telapak", b="5", j="depan+0.6*atas", tp="atas+0.3*dalam"),
    k(0.9),
], cara="Telunjuk menyentuh pelipis, lalu tangan turun maju dan membuka menjadi telapak ke atas (menyodorkan isi pikiran).",
  ragu=True)

_SETUJU = [
    k(0, p=A(-0.07, -0.36, 1.30), a="telapak", b="B24_JEMPOL", j="depan+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.4, p=A(-0.07, -0.40, 1.24)),
    k(0.7),
]
S("SETUJU", "Setuju", "Pendapat", **_sym(_SETUJU),
  kepala=[(0.1, 0, 0, 0), (0.35, 12, 0, 0), (0.55, 0, 0, 0), (0.7, 8, 0, 0)], wajah="senang",
  cara="Dua tangan jempol tegak di depan dada digerakkan mantap ke depan-bawah sambil mengangguk.", ragu=True)

_TSETUJU = [
    k(0, p=A(-0.07, -0.36, 1.28), a="telapak", b="B24_JEMPOL", j="depan+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.5, p=A(-0.09, -0.38, 1.22), putar=180),
    k(0.8),
]
S("TIDAK_SETUJU", "Tidak setuju", "Pendapat", **_sym(_TSETUJU),
  kepala=[(0.2, 0, 0, 0), (0.4, 0, 12, 0), (0.6, 0, -12, 0), (0.8, 0, 0, 0)], wajah="sedih",
  cara="Dua tangan jempol tegak lalu diputar menjadi jempol ke bawah, sambil menggeleng.", ragu=True)

S("BENAR", "Benar / betul", "Pendapat", [
    k(0, p=_ALAS + A(-0.01, 0, 0.11), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.38, p=_ALAS + A(-0.01, 0, 0.012)),
    k(0.7),
], L=_L_ALAS, kepala=[(0.2, 0, 0, 0), (0.4, 8, 0, 0), (0.7, 0, 0, 0)],
  cara="Sisi kelingking tangan kanan yang datar diketukkan mantap sekali di telapak kiri, sambil mengangguk dan mengucapkan 'benar'.",
  ragu=True)

S("SALAH", "Salah", "Pendapat", [
    k(0, p="netral+0.08*atas", a="pergelangan", b="I", j="atas", tp="depan"),
    *bolak(0.15, 0.15, 4, {"putar": -30}, {"putar": 30}),
    k(0.8, putar=0),
], wajah="sedih", cara="Kelingking tegak (jari lain menggenggam) digoyang kiri-kanan di depan dada, wajah menyesal.", ragu=True)

S("BEDA", "Beda / berbeda", "Pendapat", [
    k(0, p=A(-0.04, -0.38, 1.22), a="telapak", b="FLAT", j="depan", tp="bawah"),
    k(0.15),
    k(0.5, p=A(-0.12, -0.38, 1.22), tp="atas"),
    k(0.75),
], L=[k(0, p=A(0.04, -0.38, 1.22), a="telapak", b="FLAT", j="depan", tp="bawah"),
      k(0.15), k(0.5, p=A(0.12, -0.38, 1.22)), k(0.75)],
  cara="Dua tangan datar berdampingan telapak ke bawah, lalu berpisah; tangan kanan dibalik telapak ke atas.", ragu=True)

# ── Cita-cita & masa depan ────────────────────────────────────────────────

S("CITA_CITA", "Cita-cita", "Cita-cita", [
    k(0, p=_DAHI + "+0.04*depan", **_TELUNJUK_DAHI),
    k(0.2, p=_DAHI),
    k(0.3),
    k(0.75, p="pelipis+0.10*luar+0.22*depan+0.04*bawah", a="telapak", b="5", j="atas+0.9*depan", tp="depan+0.3*dalam"),
    k(0.95),
], wajah="senang", cara="Telunjuk di pelipis lalu tangan naik ke depan-atas dan membuka (5), mata mengikuti — sambil mengucapkan 'cita-cita'.",
  ragu=True)

S("MIMPI", "Mimpi", "Cita-cita", [
    k(0, p="pipi+0.012*depan", a="telapak", b="FLAT", j="atas+0.3*belakang", tp="dalam"),
    k(0.25),
    k(0.45, p="pelipis+0.05*luar+0.05*depan+0.03*atas", a="ujung", b="FLAT_O", j="atas+0.3*luar", tp="depan"),
    k(0.85, p="pelipis+0.12*luar+0.14*depan+0.02*bawah", a="telapak", b="5", j="atas+0.6*luar+0.5*depan"),
    k(1.05),
], kepala=[(0, 0, 0, 0), (0.15, 0, 0, -12), (0.4, 0, 0, -12), (0.7, 0, 0, 0)], wajah="tidur",
  cara="Telapak di pipi dengan kepala miring (tidur), lalu tangan kuncup dari pelipis naik dan membuka seperti gelembung mimpi.",
  ragu=True)

S("HARAP", "Harap / berharap", "Cita-cita", [
    k(0, p=A(-0.012, -0.30, 1.28), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
    k(0.2),
    k(0.6, p=A(-0.012, -0.34, 1.36)),
    k(0.85),
], L=[k(0, p=A(0.012, -0.30, 1.28), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
      k(0.2), k(0.6, p=A(0.012, -0.34, 1.36)), k(0.85)],
  wajah="senang", cara="Dua telapak dirapatkan di depan dada lalu diangkat sedikit ke atas, wajah berharap.", ragu=True)

S("MASA_DEPAN", "Masa depan", "Waktu", [
    k(0, p="bahu_kanan+0.06*depan+0.04*atas", a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.65, p="bahu_kanan+0.30*depan+0.06*atas", j="depan+0.4*atas"),
    k(0.85),
], cara="Tangan datar di depan bahu kanan (telapak ke samping) didorong jauh ke depan — waktu di depan badan.", ragu=True)

# ── Kerja ─────────────────────────────────────────────────────────────────

S("PEKERJAAN", "Pekerjaan", "Kerja", [
    k(0, p=A(-0.02, -0.36, 1.25), a="telapak", b="S", j="dalam+0.4*depan", tp="bawah"),
    *bolak(0.15, 0.14, 4, {"p": A(-0.02, -0.36, 1.215)}, {"p": A(-0.02, -0.36, 1.25)}),
    k(0.8, p=A(-0.02, -0.36, 1.215)),
], L=[k(0, p=A(0.03, -0.36, 1.19), a="punggung", b="S", j="dalam+0.4*depan", tp="bawah")],
  cara="Kepalan kanan mengetuk punggung kepalan kiri dua kali (seperti KERJA), sambil mengucapkan 'pekerjaan'.", ragu=True)

S("BOS", "Bos / atasan", "Kerja", [
    k(0, p="dada+0.08*depan", a="telapak", b="B24_JEMPOL", j="depan+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p="dada+0.10*depan+0.16*atas"),
    k(0.8),
], cara="Jempol tegak di depan dada diangkat ke atas setinggi bahu — orang yang posisinya paling atas.", ragu=True)

_RAPAT = [
    k(0, p=A(-0.16, -0.36, 1.22), a="telapak", b="CLAW", j="depan+0.3*dalam", tp="dalam+0.4*bawah"),
    k(0.15),
    k(0.55, p=A(-0.045, -0.40, 1.22)),
    k(0.8),
]
S("RAPAT", "Rapat / pertemuan", "Kerja", **_sym(_RAPAT),
  cara="Dua tangan cakar (jari agak ditekuk) dari samping bergerak mendekat ke tengah — orang-orang berkumpul mengelilingi meja.",
  ragu=True)

S("GAJI", "Gaji", "Kerja", [
    k(0, p="netral+0.20*depan+0.06*atas", a="jempol", b="BABY_O", j="atas+0.3*depan", tp="dalam+0.3*atas"),
    *bolak(0.12, 0.12, 3, {"b": "O"}, {"b": "BABY_O"}),
    k(0.6, p="dada+0.04*depan", b="S", j="atas", tp="belakang"),
    k(0.85),
], cara="Ibu jari menggesek telunjuk (uang) di depan, lalu tangan ditarik ke dada — uang yang diterima.", ragu=True)

_LAMAR = [
    k(0, p=A(-0.05, -0.28, 1.25), a="telapak", b="FLAT", j="depan", tp="atas+0.4*dalam"),
    k(0.15),
    k(0.6, p=A(-0.05, -0.46, 1.27)),
    k(0.85),
]
S("MELAMAR", "Melamar (kerja)", "Kerja", **_sym(_LAMAR),
  cara="Dua telapak menghadap atas seperti membawa map, didorong ke depan menyerahkan berkas lamaran.", ragu=True)

# ── Teknologi ─────────────────────────────────────────────────────────────

S("INTERNET", "Internet", "Teknologi", [
    k(0, p=A(-0.03, -0.36, 1.26), a="telapak", b="5", j="atas+0.4*dalam", tp="dalam+0.3*depan"),
    *bolak(0.15, 0.14, 4, {"putar": -20, "p": A(-0.03, -0.37, 1.26)}, {"putar": 20, "p": A(-0.03, -0.35, 1.26)}),
    k(0.8, putar=0),
], L=cermin([
    k(0, p=A(-0.03, -0.36, 1.26), a="telapak", b="5", j="atas+0.4*dalam", tp="dalam+0.3*depan"),
    *bolak(0.15, 0.14, 4, {"putar": 20, "p": A(-0.03, -0.35, 1.26)}, {"putar": -20, "p": A(-0.03, -0.37, 1.26)}),
    k(0.8, putar=0),
]), cara="Dua tangan 5 berhadapan dekat, digoyang bergantian seperti jaring yang saling terhubung; banyak orang juga mengeja I-N-T.",
  ragu=True)

S("VIDEO", "Video / merekam", "Teknologi", [
    k(0, p="mata+0.12*depan", a="telapak", b="C", j="atas+0.3*depan", tp="dalam+0.5*belakang"),
    k(0.15),
    k(0.6, p="mata+0.14*depan+0.10*luar"),
    k(0.85),
], cara="Tangan C di depan mata seperti memegang kamera, digerakkan menyapu pelan ke samping.", ragu=True)

S("MEDSOS", "Media sosial", "Teknologi", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.03), a="jempol", b="A", j="depan+0.3*dalam", tp="dalam"),
    *bolak(0.12, 0.12, 4, {"p": _ALAS + A(-0.01, -0.06, 0.03)}, {"p": _ALAS + A(-0.01, -0.01, 0.03)}),
    k(0.7),
], L=[k(0, p=_ALAS + A(0, 0, 0.0), a="telapak", b="FLAT", j="atas+0.5*depan", tp="belakang+0.5*atas")],
  cara="Tangan kiri seperti memegang HP; ibu jari kanan menggulir layar berulang-ulang.", ragu=True)

S("TEKS", "Teks / pesan tertulis", "Teknologi", [
    k(0, p=A(-0.03, -0.36, 1.22), a="jempol", b="A", j="depan+0.3*dalam", tp="atas+0.3*dalam"),
    *bolak(0.12, 0.12, 5, {"p": A(-0.03, -0.36, 1.205)}, {"p": A(-0.03, -0.36, 1.225)}),
    k(0.8),
], L=cermin([
    k(0, p=A(-0.03, -0.36, 1.205), a="jempol", b="A", j="depan+0.3*dalam", tp="atas+0.3*dalam"),
    *bolak(0.12, 0.12, 5, {"p": A(-0.03, -0.36, 1.225)}, {"p": A(-0.03, -0.36, 1.205)}),
    k(0.8),
]), cara="Dua ibu jari bergantian mengetuk seperti mengetik di HP.", ragu=True)

# ── Kesehatan ─────────────────────────────────────────────────────────────

_SEHAT = [
    k(0, p="dada_kanan+0.03*depan", a="telapak", b="5", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.5, p="dada_kanan+0.14*depan+0.05*bawah", b="S", j="atas+0.3*depan", tp="dalam"),
    k(0.75),
]
S("SEHAT", "Sehat", "Kesehatan", R=_SEHAT,
  L=[{**kk, "p": kk["p"].replace("dada_kanan", "dada_kiri")} for kk in _SEHAT[:1]] + _SEHAT[1:2] +
    [{**_SEHAT[2], "p": _SEHAT[2]["p"].replace("dada_kanan", "dada_kiri")}] + _SEHAT[3:],
  wajah="senang", cara="Dua telapak terbuka di dada lalu maju sedikit sambil mengepal mantap — badan segar bugar.", ragu=True)

S("KUAT", "Kuat", "Kesehatan", [
    k(0, p=A(-0.16, -0.25, 1.30), a="telapak", b="S", j="atas", tp="belakang+0.4*dalam"),
    k(0.15),
    k(0.45, p=A(-0.17, -0.22, 1.40)),
    k(0.75),
], kepala=[(0.15, 0, 0, 0), (0.45, 5, 0, 0), (0.75, 2, 0, 0)],
  cara="Lengan kanan ditekuk, kepalan diangkat ke atas memamerkan otot lengan, wajah mantap.")

S("LEMAH", "Lemah / lesu", "Kesehatan", [
    k(0, p=A(-0.13, -0.30, 1.36), a="telapak", b="S", j="atas", tp="belakang"),
    k(0.2),
    k(0.65, p=A(-0.12, -0.34, 1.20), b="SANTAI", j="bawah+0.5*depan", tp="belakang"),
    k(0.9),
], kepala=[(0.2, 0, 0, 0), (0.65, 8, 0, 4)], wajah="sedih",
  cara="Kepalan terangkat lalu jatuh lunglai dengan jari lemas terkulai, wajah lesu.", ragu=True)

S("ROKOK", "Rokok / merokok", "Kesehatan", [
    k(0, p="mulut+0.06*depan", a="jari_telunjuk", b="V", j="atas+0.6*dalam", tp="belakang"),
    k(0.15, p="mulut+0.012*depan"),
    k(0.4, p="mulut+0.07*depan+0.02*luar"),
    k(0.55, p="mulut+0.012*depan"),
    k(0.85, p="mulut+0.08*depan+0.02*luar"),
], cara="Telunjuk & jari tengah (V) seperti menjepit rokok, didekatkan ke bibir dua kali.")

S("SAYUR", "Sayur", "Kesehatan", [
    k(0, p=_ALAS + A(-0.01, -0.02, 0.08), a="ujung", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.15, p=_ALAS + A(-0.01, -0.02, 0.02)),
    k(0.35, p=_ALAS + A(-0.01, -0.02, 0.10)),
    k(0.5, p=_ALAS + A(-0.01, -0.04, 0.02)),
    k(0.7, p=_ALAS + A(-0.01, -0.04, 0.10)),
    k(0.85),
], L=_L_ALAS, cara="Jari kanan menguncup memetik daun dari telapak kiri dua kali, sambil mengucapkan 'sayur'.", ragu=True)

# ── Alam & lingkungan ─────────────────────────────────────────────────────

_POHON = [
    k(0, p=A(-0.035, -0.36, 1.14), a="telapak", b="C", j="dalam+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.45, p=A(-0.035, -0.36, 1.30)),
    k(0.8, p=A(-0.12, -0.36, 1.44), b="5", j="atas+0.6*luar", tp="depan+0.3*dalam"),
    k(1.0),
]
S("POHON", "Pohon", "Alam", **_sym(_POHON),
  cara="Dua tangan C melingkari batang dan naik, lalu membuka ke atas-samping seperti daun-daun pohon.", ragu=True)

S("BUNGA", "Bunga", "Alam", [
    k(0, p="netral+0.10*atas+0.06*depan", a="ujung", b="FLAT_O", j="atas", tp="dalam"),
    k(0.15),
    k(0.45, b="5"),
    k(0.75, p="hidung+0.04*depan+0.02*bawah", a="ujung", b="FLAT_O", j="atas+0.8*belakang+0.2*dalam", tp="dalam+0.3*belakang"),
    k(1.0),
], wajah="senang", cara="Jari menguncup lalu mekar terbuka seperti kelopak, kemudian didekatkan ke hidung seperti mencium bunga.", ragu=True)

_LAUT = [
    k(0, p=A(-0.06, -0.38, 1.18), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15, p=A(-0.10, -0.38, 1.22)),
    k(0.35, p=A(-0.14, -0.38, 1.18)),
    k(0.55, p=A(-0.18, -0.38, 1.22)),
    k(0.75, p=A(-0.22, -0.38, 1.18)),
    k(0.9),
]
S("LAUT", "Laut", "Alam", **_sym(_LAUT),
  cara="Dua tangan datar telapak ke bawah bergerak ke samping naik-turun seperti ombak, sambil mengucapkan 'laut'.", ragu=True)

S("SAMPAH", "Sampah", "Alam", [
    k(0, p="netral+0.08*atas", a="telapak", b="S", j="atas+0.3*depan", tp="bawah+0.3*dalam"),
    k(0.15),
    k(0.5, p="netral+0.12*bawah+0.10*luar+0.04*depan", b="5", j="bawah+0.4*luar", tp="bawah"),
    k(0.75),
], wajah="sedih", cara="Tangan menggenggam lalu dilempar membuka ke bawah-samping seperti membuang sampah.", ragu=True)

S("BERSIH", "Bersih", "Alam", [
    k(0, p=_ALAS + A(0.04, 0.045, 0.012), a="telapak", b="FLAT", j="dalam+0.4*depan", tp="bawah"),
    k(0.12),
    k(0.5, p=_ALAS + A(-0.06, -0.07, 0.012)),
    k(0.65),
], L=_L_ALAS, wajah="senang", cara="Telapak kanan mengusap telapak kiri sekali dari pangkal ke ujung — licin dan bersih.", ragu=True)

S("KOTOR", "Kotor", "Alam", [
    k(0, p=_ALAS + A(0, 0, 0.03), a="ujung", b="CLAW", j="bawah+0.3*depan", tp="bawah"),
    *bolak(0.12, 0.12, 5, {"p": _ALAS + A(-0.02, -0.02, 0.02)}, {"p": _ALAS + A(0.02, 0.01, 0.02)}),
    k(0.8),
], L=_L_ALAS, wajah="sedih", cara="Jari kanan seperti cakar menggaruk-garuk telapak kiri, wajah jijik.", ragu=True)

# ── Masyarakat & hak ──────────────────────────────────────────────────────

_ORG = [
    k(0, p=A(-0.04, -0.46, 1.24), a="telapak", b="C", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.5, p=A(-0.13, -0.38, 1.24), j="depan", tp="dalam+0.4*depan"),
    k(0.8, p=A(-0.06, -0.30, 1.24), j="dalam+0.3*depan", tp="depan"),
    k(1.0),
]
S("ORGANISASI", "Organisasi / perkumpulan", "Masyarakat", **_sym(_ORG),
  cara="Dua tangan C dari depan bergerak melingkar ke samping lalu bertemu dekat badan — menggambar satu kelompok.", ragu=True)

S("HAK", "Hak", "Masyarakat", [
    k(0, p=_ALAS + A(0, -0.02, 0.06), a="punggung", b="S", j="depan+0.3*dalam", tp="atas"),
    k(0.15, p=_ALAS + A(0, -0.02, 0.03)),
    k(0.55, p="dada+0.05*depan", a="telapak", j="atas+0.3*dalam", tp="belakang"),
    k(0.8),
], L=_L_ALAS, cara="Kepalan kanan di atas telapak kiri lalu ditarik mantap ke dada — sesuatu yang menjadi milik kita.", ragu=True)

_AKSES = [
    k(0, p=A(-0.02, -0.40, 1.26), a="telapak", b="FLAT", j="atas", tp="depan"),
    k(0.15),
    k(0.55, p=A(-0.13, -0.38, 1.26), tp="depan+0.9*dalam"),
    k(0.8),
]
S("AKSES", "Akses / bisa masuk", "Masyarakat", **_sym(_AKSES),
  cara="Dua telapak tegak berdampingan lalu membuka ke samping seperti pintu yang dibuka, sambil mengucapkan 'akses'.", ragu=True)

S("DISABILITAS", "Disabilitas", "Masyarakat", [],
  cara="Dieja jari: D-I-S-A-B-I-L-I-T-A-S (atau disingkat sesuai kebiasaan komunitas setempat); tanyakan isyarat lokalnya ke pengajar Tuli.",
  ragu=True)

S("UNDANG_UNDANG", "Undang-undang", "Masyarakat", [
    k(0, p=_ALAS + A(0, -0.01, 0.07), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": _ALAS + A(0, -0.01, 0.012)}, {"p": _ALAS + A(0, -0.06, 0.07)}),
    k(0.8, p=_ALAS + A(0, -0.06, 0.012)),
], L=_L_ALAS, cara="Telapak kanan menepuk telapak kiri (kertas aturan) dua kali sambil bergeser ke depan, sambil mengucapkan 'undang-undang'.",
  ragu=True)

# ── Seni & dunia ──────────────────────────────────────────────────────────

S("SENI", "Seni", "Seni", [
    k(0, p="netral+0.12*atas+0.06*depan", a="jempol", b="BABY_O", j="atas+0.3*depan", tp="depan"),
    k(0.2, p="netral+0.16*atas+0.10*depan+0.06*luar"),
    k(0.4, p="netral+0.08*atas+0.10*depan+0.02*dalam"),
    k(0.6, p="netral+0.14*atas+0.10*depan+0.08*luar"),
    k(0.85),
], wajah="senang", cara="Tangan seperti memegang kuas, diayunkan melengkung di udara seperti melukis.", ragu=True)

_TEATER = [
    k(0, p=A(-0.02, -0.40, 1.34), a="telapak", b="FLAT", j="atas", tp="depan+0.5*luar"),
    k(0.15),
    k(0.6, p=A(-0.18, -0.38, 1.34), tp="depan"),
    k(0.85),
]
S("TEATER", "Teater / panggung", "Seni", **_sym(_TEATER),
  cara="Dua telapak tegak bertemu di tengah lalu bergeser ke samping seperti membuka tirai panggung.", ragu=True)

S("FILM", "Film", "Seni",
  lingkar(0, 0.9, "bahu_kanan+0.16*depan+0.14*atas+0.03*luar", 0.04, "depan", "atas", n=10, mulai=90, putaran=2,
          a="telunjuk", b="1", j="depan+0.3*atas", tp="dalam") + [k(1.05)],
  cara="Telunjuk berputar di samping kepala seperti gulungan film yang berputar, sambil mengucapkan 'film'.", ragu=True)

_DUNIA = lingkar(0, 0.9, A(-0.07, -0.38, 1.26), 0.06, "depan", "atas", n=10, mulai=180, putaran=1,
                 a="telapak", b="C", j="atas+0.4*dalam", tp="dalam") + [k(1.05)]
S("DUNIA", "Dunia", "Seni", **_sym(_DUNIA),
  cara="Dua tangan C berhadapan membentuk bola, lalu bersama-sama memutar seperti bola dunia.", ragu=True)

# ── Keharusan ─────────────────────────────────────────────────────────────

S("PERLU", "Perlu", "Keharusan", [
    k(0, p=_ALAS + A(0, -0.01, 0.07), a="telunjuk", b="1", j="bawah+0.3*depan", tp="belakang"),
    k(0.15, p=_ALAS + A(0, -0.01, 0.01)),
    k(0.3, p=_ALAS + A(0, -0.01, 0.06)),
    k(0.45, p=_ALAS + A(0, -0.01, 0.01)),
    k(0.75),
], L=_L_ALAS, cara="Ujung telunjuk mengetuk telapak kiri dua kali, sambil mengucapkan 'perlu'.", ragu=True)

S("PENTING", "Penting", "Keharusan", [
    k(0, p=_ALAS + A(0, -0.01, 0.03), a="punggung", b="B24_JEMPOL", j="depan+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p=_ALAS + A(0, -0.03, 0.17)),
    k(0.8),
], L=_L_ALAS, kepala=[(0.2, 0, 0, 0), (0.55, 6, 0, 0)],
  cara="Jempol tegak di atas telapak kiri diangkat naik dengan tegas — diutamakan; alis sedikit naik.", ragu=True)

# ── Berita & bahasa ───────────────────────────────────────────────────────

_BERITA = [
    k(0, p=A(-0.02, -0.38, 1.25), a="telapak", b="FLAT", j="atas+0.3*depan", tp="belakang+0.6*dalam"),
    k(0.15),
    k(0.5, p=A(-0.13, -0.38, 1.25), tp="belakang"),
    k(0.8),
]
S("BERITA", "Berita", "Berita", **_sym(_BERITA),
  cara="Dua telapak menghadap diri dibuka dari tengah ke samping seperti membuka koran, sambil mengucapkan 'berita'.", ragu=True)

_UMUM = [
    k(0, p="mulut+0.05*depan+0.01*luar", a="telunjuk", b="1", j="atas+0.4*depan", tp="dalam"),
    k(0.15),
    k(0.6, p="mulut+0.22*depan+0.18*luar+0.05*bawah", j="depan+0.5*luar", tp="dalam+0.3*bawah"),
    k(0.85),
]
S("UMUMKAN", "Mengumumkan", "Berita", **_sym(_UMUM),
  cara="Dua telunjuk dari depan mulut bergerak menyebar ke depan-samping — kabar disebarkan ke banyak orang.", ragu=True)

S("WAWANCARA", "Wawancara", "Berita", [
    k(0, p="mulut+0.07*depan+0.02*bawah", a="telapak", b="S", j="atas", tp="dalam"),
    k(0.15),
    k(0.4, p="netral+0.12*atas+0.20*depan"),
    k(0.6, p="mulut+0.07*depan+0.02*bawah"),
    k(0.85, p="netral+0.12*atas+0.20*depan"),
    k(1.0),
], cara="Kepalan seperti memegang mikrofon, digerakkan bergantian ke mulut sendiri dan ke depan (lawan bicara).", ragu=True)

S("BAHASA", "Bahasa", "Berita", [
    k(0, p="mulut+0.03*depan+0.02*bawah", a="telunjuk", b="1", j="atas+0.6*dalam", tp="belakang"),
    *lingkar(0.12, 0.62, "mulut+0.04*depan+0.02*bawah", 0.02, "luar", "atas", n=6, mulai=0, putaran=1),
    k(0.9, p="mulut+0.14*depan+0.04*bawah", j="depan+0.4*atas"),
    k(1.05),
], cara="Telunjuk memutar kecil di depan mulut lalu bergerak maju, sambil mengucapkan 'bahasa'.", ragu=True)
