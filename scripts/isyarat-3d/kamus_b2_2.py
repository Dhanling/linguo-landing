# [isyarat-b1b2-v1] Kamus isyarat ASL B2.2 "Argument & Debate — Argumentasi & Debat".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# Kode baru berawalan B22_ (gloss tampil tanpa awalan).
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli, terutama DEBATE, DOUBT, LIMIT,
#    TOPIC, WAVE, PERSUADE yang variasinya banyak.

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

# Tangan kiri pasif yang sering dipakai
_KIRI_ATAS = dict(p=A(0.03, -0.32, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
_KIRI_TEGAK = dict(p=A(0.035, -0.38, 1.27), a="telapak", b="FLAT", j="atas", tp="dalam")


def _dua(keys, fase=None):
    """Tangan kiri = cermin tangan kanan (fase lain kalau diberikan)."""
    return cermin(fase if fase is not None else keys)


# ── Struktur argumen ───────────────────────────────────────────────────────

S("B22_REASON", "Alasan", "Argumen",
  lingkar(0, 0.8, "pelipis+0.07*depan+0.03*luar+0.02*bawah", 0.022, "luar", "atas", n=8, mulai=90, putaran=2,
          a="ujung", b="R", j="atas+0.3*dalam", tp="belakang") + [k(0.95)],
  gloss="REASON", cara="Tangan bentuk R (telunjuk & jari tengah bersilang) berputar kecil di depan dahi.")

S("B22_PROVE", "Membuktikan / bukti", "Argumen", [
    k(0, p=A(-0.03, -0.24, 1.33), a="punggung", b="FLAT", j="atas+0.2*dalam", tp="belakang"),
    k(0.15),
    k(0.5, p=A(0.03, -0.32, 1.185), j="depan+0.5*dalam", tp="atas"),
    k(0.75),
], L=[k(0, **_KIRI_ATAS)], kepala=[(0.3, 0, 0, 0), (0.5, 8, 0, 0), (0.75, 2, 0, 0)],
  gloss="PROVE", cara="Tangan datar kanan (telapak ke diri sendiri) turun dan punggungnya mendarat tegas di telapak kiri.")

_ring_R = [
    k(0, p=A(-0.012, -0.36, 1.37), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.012, -0.36, 1.27), b="S"),
    k(0.8),
]
S("B22_SUMMARIZE", "Merangkum / kesimpulan", "Argumen", _ring_R,
  L=[k(0, p=A(0.012, -0.36, 1.13), a="telapak", b="5", j="depan+0.3*dalam", tp="atas"),
     k(0.15), k(0.6, p=A(0.012, -0.36, 1.21), b="S"), k(0.8)],
  gloss="SUMMARIZE", cara="Dua tangan terbuka (kanan di atas, kiri di bawah) saling mendekat sambil mengepal — isi dipadatkan.")

_adu = [k(0, p=A(-0.08, -0.38, 1.27), a="telunjuk", b="1", j="dalam", tp="belakang")]
S("B22_ARGUE", "Berdebat / berbantah", "Argumen",
  _adu + bolak(0.15, 0.15, 5, {"p": A(-0.08, -0.38, 1.31)}, {"p": A(-0.08, -0.38, 1.23)}) + [k(0.95)],
  L=cermin(_adu + bolak(0.15, 0.15, 5, {"p": A(-0.08, -0.38, 1.23)}, {"p": A(-0.08, -0.38, 1.31)}) + [k(0.95)]),
  gloss="ARGUE", cara="Dua telunjuk saling menunjuk, digerakkan naik-turun bergantian dengan tegas.")

S("B22_DISCUSS", "Berdiskusi / membahas", "Argumen", [
    k(0, p=A(0.03, -0.33, 1.215), a="jari_telunjuk", b="1", j="depan+0.3*dalam", tp="dalam+0.3*bawah"),
    *bolak(0.12, 0.13, 6, {"p": A(0.03, -0.33, 1.18)}, {"p": A(0.03, -0.33, 1.215)}),
    k(0.9),
], L=[k(0, **_KIRI_ATAS)],
  gloss="DISCUSS", cara="Sisi telunjuk kanan mengetuk telapak kiri yang menghadap atas beberapa kali.")

S("B22_DEBATE", "Debat", "Argumen", [
    k(0, p=A(0.05, -0.33, 1.25), a="telunjuk", b="1", j="bawah+0.5*depan+0.3*dalam", tp="dalam", siku="bawah+0.5*luar"),
    k(0.18, p=A(0.05, -0.33, 1.178)),
    k(0.3, p=A(0.04, -0.31, 1.24)),
    k(0.5, p=A(-0.06, -0.33, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas"),
    k(1.05),
], L=[k(0, p=A(0.05, -0.33, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas"),
      k(0.45),
      k(0.65, p=A(-0.06, -0.33, 1.25), a="telunjuk", b="1", j="bawah+0.5*depan+0.3*dalam", tp="dalam"),
      k(0.82, p=A(-0.06, -0.33, 1.178)),
      k(1.05, p=A(-0.06, -0.33, 1.23))],
  gloss="DEBATE", cara="Telunjuk kanan mengetuk telapak kiri, lalu bergantian telunjuk kiri mengetuk telapak kanan (diskusi dua arah).")

# ── Sudut pandang ──────────────────────────────────────────────────────────

_sisi = [
    k(0, p="netral+0.03*atas", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.5, p="netral+0.10*luar+0.02*bawah", j="depan+0.3*luar", tp="atas"),
    k(0.8),
]
S("B22_ONE_HAND", "Di satu sisi", "Sudut pandang", _sisi, gloss="ON-ONE-HAND",
  cara="Tangan datar kanan dibalik menghadap atas dan ditaruh di sisi kanan (sisi pertama).")
S("B22_OTHER_HAND", "Di sisi lain", "Sudut pandang", [k(0, **IST["R"])], L=cermin(_sisi), gloss="OTHER-HAND",
  cara="Tangan datar kiri dibalik menghadap atas dan ditaruh di sisi kiri (sisi kedua).")

_banding = [k(0, p=A(-0.09, -0.38, 1.30), a="telapak", b="C", j="atas", tp="dalam")]
S("B22_COMPARE", "Membandingkan", "Sudut pandang",
  _banding + bolak(0.15, 0.18, 4, {"tp": "belakang+0.6*dalam"}, {"tp": "dalam"}) + [k(0.9)],
  L=cermin(_banding + bolak(0.15, 0.18, 4, {"tp": "dalam"}, {"tp": "belakang+0.6*dalam"}) + [k(0.9)]),
  gloss="COMPARE", cara="Dua tangan C berhadapan, bergantian diputar menghadap wajah — menimbang dua hal.")

_lawan = [
    k(0, p=A(-0.02, -0.42, 1.22), a="telunjuk", b="1", j="dalam", tp="belakang"),
    k(0.15),
    k(0.5, p=A(-0.17, -0.42, 1.22)),
    k(0.7),
]
S("B22_OPPOSITE", "Berlawanan / kebalikan", "Sudut pandang", _lawan, L=cermin(_lawan),
  gloss="OPPOSITE", cara="Dua telunjuk saling menunjuk di tengah, lalu ditarik berpisah ke samping.")

# ── Setuju sebagian & menyanggah ───────────────────────────────────────────

_terima = [
    k(0, p=A(-0.08, -0.42, 1.27), a="ujung", b="5", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.4, p=A(-0.05, -0.30, 1.30), j="bawah+0.5*depan"),
    k(0.6, p="dada+0.05*luar+0.04*depan", b="FLAT_O", j="bawah+0.3*belakang", tp="belakang", siku="bawah+0.5*luar"),
    k(0.8),
]
S("B22_ACCEPT", "Menerima", "Sanggahan", _terima, L=cermin(_terima),
  gloss="ACCEPT", cara="Dua tangan terbuka di depan ditarik ke dada sambil mengatup (O pipih) — menerima ke dalam diri.")

_akui = [
    k(0, p="dada+0.02*depan+0.05*luar+0.03*bawah", a="telapak", b="FLAT", j="bawah+0.3*dalam", tp="belakang", siku="bawah+0.6*luar"),
    k(0.15),
    k(0.6, p="dada+0.18*depan+0.06*bawah+0.06*luar", j="depan+0.2*dalam", tp="atas"),
    k(0.8),
]
S("B22_ADMIT", "Mengakui", "Sanggahan", _akui, L=cermin(_akui),
  gloss="ADMIT", cara="Dua tangan datar di dada (jari ke bawah) diputar maju hingga telapak menghadap atas — membuka diri.")

S("B22_PART", "Sebagian", "Sanggahan", [
    k(0, p=A(0.03, -0.27, 1.172), a="sisi_kelingking", b="FLAT", j="depan+0.4*dalam", tp="dalam"),
    k(0.15),
    k(0.4, p=A(0.0, -0.33, 1.172)),
    k(0.6, p=A(0.03, -0.39, 1.172)),
    k(0.8),
], L=[k(0, p=A(0.03, -0.33, 1.16), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas")],
  gloss="PART", cara="Sisi kelingking tangan datar kanan menyapu melengkung di telapak kiri — sebagian.")

S("B22_RESPECT", "Menghormati", "Sanggahan", [
    k(0, p="pelipis+0.05*depan+0.02*luar+0.05*bawah", a="telapak", b="R", j="atas", tp="dalam"),
    k(0.15),
    k(0.6, p="pelipis+0.22*depan+0.18*bawah+0.02*luar", j="atas+0.8*depan"),
    k(0.8),
], kepala=[(0.2, 0, 0, 0), (0.55, 8, 0, 0), (0.8, 2, 0, 0)],
  gloss="RESPECT", cara="Tangan bentuk R di depan dahi melengkung maju-turun, kepala sedikit menunduk.")

# ── Bukti & data ───────────────────────────────────────────────────────────

S("B22_PERCENT", "Persen", "Data", [
    k(0, p="angka+0.03*atas", a="telapak", b="O", j="atas", tp="dalam"),
    k(0.15),
    k(0.3, p="angka+0.03*atas+0.02*luar"),
    k(0.65, p="angka+0.05*dalam+0.08*bawah"),
    k(0.85),
], gloss="PERCENT", cara="Tangan bentuk O di samping bergerak miring turun ke arah tengah, seperti menulis %.")

S("B22_RESEARCH", "Meneliti / riset", "Data", [
    k(0, p=A(0.03, -0.27, 1.19), a="ujung", b="R", j="depan+0.7*bawah", tp="bawah+0.5*belakang"),
    *bolak(0.15, 0.18, 4, {"p": A(0.03, -0.36, 1.178)}, {"p": A(0.03, -0.27, 1.19)}),
    k(0.9),
], L=[k(0, **_KIRI_ATAS)],
  gloss="RESEARCH", cara="Ujung jari tangan R menyusur maju di telapak kiri dua kali — memeriksa dengan teliti.")

S("B22_NUMBER", "Angka / jumlah", "Data", [
    k(0, p=A(-0.005, -0.37, 1.27), a="ujung", b="FLAT_O", j="dalam+0.4*bawah", tp="bawah", siku="bawah+0.5*luar"),
    k(0.15),
    k(0.35, p=A(-0.03, -0.37, 1.30), j="dalam+0.2*bawah", tp="belakang"),
    k(0.55, p=A(-0.005, -0.37, 1.27), j="dalam+0.4*bawah", tp="bawah"),
    k(0.75),
], L=[k(0, p=A(0.005, -0.37, 1.25), a="ujung", b="FLAT_O", j="dalam+0.4*atas", tp="atas", siku="bawah+0.5*luar"),
      k(0.15), k(0.35, p=A(0.03, -0.37, 1.22), j="dalam+0.2*atas", tp="depan"),
      k(0.55, p=A(0.005, -0.37, 1.25), j="dalam+0.4*atas", tp="atas"), k(0.75)],
  gloss="NUMBER", cara="Ujung jari dua tangan O-pipih bersentuhan, dipisah sambil diputar berlawanan, lalu bersentuhan lagi.")

# ── Persuasi & kepastian ──────────────────────────────────────────────────

S("B22_PERSUADE", "Membujuk / meyakinkan", "Persuasi", [
    k(0, p=A(-0.06, -0.30, 1.25), a="telunjuk", b="X", j="depan+0.3*atas", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.06, -0.37, 1.25)}, {"p": A(-0.06, -0.30, 1.25)}),
    k(0.8),
], L=cermin([
    k(0, p=A(-0.05, -0.40, 1.25), a="telunjuk", b="X", j="depan+0.3*atas", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.05, -0.47, 1.25)}, {"p": A(-0.05, -0.40, 1.25)}),
    k(0.8),
]), gloss="PERSUADE", cara="Dua tangan X (kiri di depan, kanan di belakang) disentak maju dua kali, seperti menarik orang ikut.")

S("B22_DOUBT", "Ragu / meragukan", "Kepastian", [
    k(0, p="mata+0.12*depan+0.04*bawah+0.02*dalam", a="ujung", b="V", j="atas+0.3*dalam", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"b": "BENT_V"}, {"b": "V"}),
    k(0.8, b="BENT_V"),
], wajah="wh", kepala=[(0.1, 0, 0, 0), (0.4, 0, 0, 6), (0.8, 0, 0, 3)],
  gloss="DOUBT", cara="Tangan V di depan mata, jari ditekuk dua kali (pandangan 'kabur'), alis berkerut dan kepala sedikit miring.")

_bisa = [k(0, p="netral+0.06*atas", a="telapak", b="S", j="depan+0.2*dalam", tp="bawah")]
S("B22_POSSIBLE", "Mungkin terjadi / bisa jadi", "Kepastian",
  _bisa + bolak(0.15, 0.15, 4, {"p": "netral+0.02*bawah"}, {"p": "netral+0.05*atas"}) + [k(0.8)],
  L=cermin(_bisa + bolak(0.15, 0.15, 4, {"p": "netral+0.02*bawah"}, {"p": "netral+0.05*atas"}) + [k(0.8)]),
  gloss="POSSIBLE", cara="Dua kepalan (telapak ke bawah) digerakkan turun dua kali (CAN diulang).")

S("B22_SEEM", "Tampaknya / sepertinya", "Kepastian", [
    k(0, p=A(-0.17, -0.30, 1.42), a="telapak", b="BENT_B", j="atas+0.2*dalam", tp="depan"),
    k(0.15),
    k(0.45, tp="belakang+0.3*dalam"),
    k(0.75),
], gloss="SEEM", cara="Tangan tertekuk di dekat bahu, telapak menghadap depan, diputar menghadap wajah seperti melihat cermin.")

# ── Keluarga & bahasa ──────────────────────────────────────────────────────

S("B22_CHILD", "Anak", "Keluarga", [
    k(0, p=A(-0.17, -0.36, 1.13), a="telapak", b="FLAT", j="depan+0.2*luar", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.17, -0.36, 1.09)}, {"p": A(-0.17, -0.36, 1.13)}),
    k(0.8),
], gloss="CHILD", cara="Telapak menghadap bawah di samping, ditepuk turun dua kali setinggi kepala anak.")

S("B22_PARENTS", "Orang tua", "Keluarga", [
    k(0, p="dagu+0.04*depan", a="jempol", b="5", j="atas", tp="dalam"),
    k(0.15, p="dagu+0.004*depan"),
    k(0.3),
    k(0.55, p="dahi+0.004*depan"),
    k(0.75),
], gloss="PARENTS", cara="Ibu jari tangan 5 menyentuh dagu (MOTHER) lalu dahi (FATHER).")

_bhs = [
    k(0, p=A(-0.03, -0.40, 1.26), a="jempol", b="L", j="depan", tp="bawah"),
    k(0.15),
    k(0.32, p=A(-0.08, -0.40, 1.275)),
    k(0.48, p=A(-0.12, -0.40, 1.25)),
    k(0.65, p=A(-0.17, -0.40, 1.265)),
    k(0.85),
]
S("B22_LANGUAGE", "Bahasa", "Bahasa", _bhs, L=cermin(_bhs),
  gloss="LANGUAGE", cara="Dua tangan L (telapak ke bawah, ibu jari berdekatan) ditarik berpisah ke samping sambil bergelombang.")

S("B22_CHOOSE", "Memilih / pilihan", "Bahasa", [
    k(0, p=A(0.05, -0.45, 1.40), a="telunjuk", b="F", j="atas+0.3*depan", tp="depan+0.6*dalam"),
    k(0.2),
    k(0.6, p=A(-0.03, -0.30, 1.36)),
    k(0.8),
], L=[k(0, p=A(0.06, -0.40, 1.30), a="telapak", b="V", j="atas+0.2*depan", tp="belakang")],
  gloss="CHOOSE", cara="Tangan F 'memetik' ujung jari tangan kiri lalu ditarik ke arah badan.")

S("B22_EXPERIENCE", "Pengalaman", "Bahasa", [
    k(0, p="pelipis+0.03*luar+0.01*depan+0.08*bawah", a="telapak", b="5", j="atas+0.3*depan", tp="dalam"),
    k(0.12),
    k(0.4, p="pelipis+0.10*luar+0.04*depan+0.10*bawah", b="FLAT_O"),
    k(0.52, p="pelipis+0.03*luar+0.01*depan+0.08*bawah", b="5"),
    k(0.8, p="pelipis+0.10*luar+0.04*depan+0.10*bawah", b="FLAT_O"),
    k(0.95),
], gloss="EXPERIENCE", cara="Tangan 5 di pelipis ditarik menjauh sambil mengatup menjadi O-pipih, dua kali.")

_putus = [
    k(0, p="netral+0.12*atas", a="telunjuk", b="F", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.42, p="netral+0.03*bawah", j="depan"),
    k(0.75),
]
S("B22_DECIDE", "Memutuskan / keputusan", "Bahasa", _putus, L=cermin(_putus),
  kepala=[(0.15, 0, 0, 0), (0.42, 10, 0, 0), (0.75, 3, 0, 0)],
  gloss="DECIDE", cara="Dua tangan F (telapak berhadapan) diturunkan tegas bersamaan, kepala mengangguk (sering didahului THINK).")

# ── Teknologi ──────────────────────────────────────────────────────────────

S("B22_TECHNOLOGY", "Teknologi", "Teknologi", [
    k(0, p=A(0.03, -0.38, 1.19), a="tengah", b="OPEN_8", j="depan+0.3*dalam", tp="atas"),
    *bolak(0.15, 0.15, 4, {"p": A(0.03, -0.38, 1.228)}, {"p": A(0.03, -0.38, 1.19)}),
    k(0.8, p=A(0.03, -0.38, 1.228)),
], L=[k(0, p=A(0.03, -0.38, 1.24), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam")],
  gloss="TECHNOLOGY", cara="Ujung jari tengah yang tertekuk (8 terbuka) mengetuk sisi kelingking tangan kiri dari bawah dua kali.")

S("B22_PRIVATE", "Pribadi / rahasia / privasi", "Teknologi", [
    k(0, p="mulut+0.03*depan", a="jempol", b="A", j="atas", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "mulut+0.006*depan"}, {"p": "mulut+0.03*depan"}),
    k(0.8),
], gloss="PRIVATE", cara="Ibu jari kepalan A mengetuk bibir dua kali (SECRET / PRIVATE).")

S("B22_LIMIT", "Batas / membatasi", "Teknologi", [
    k(0, p=A(-0.02, -0.37, 1.33), a="telapak", b="BENT_B", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.5, p=A(-0.02, -0.44, 1.33)),
    k(0.7),
], L=[k(0, p=A(0.02, -0.37, 1.22), a="telapak", b="BENT_B", j="dalam+0.3*depan", tp="bawah"),
      k(0.15), k(0.5, p=A(0.02, -0.44, 1.22)), k(0.7)],
  gloss="LIMIT", cara="Dua tangan tertekuk bertumpuk (kanan di atas = batas atas) digerakkan maju sedikit.")

S("B22_BENEFIT", "Manfaat / keuntungan", "Teknologi", [
    k(0, p="dada_kanan+0.06*depan+0.05*atas+0.03*luar", a="telunjuk", b="F", j="bawah+0.3*depan", tp="dalam+0.3*belakang", siku="bawah+0.4*luar"),
    k(0.15),
    k(0.45, p="dada_kanan+0.015*depan+0.05*bawah+0.03*luar"),
    k(0.7),
], gloss="BENEFIT", cara="Tangan F didorong turun di sisi dada, seperti memasukkan sesuatu ke saku.")

# ── Lingkungan ─────────────────────────────────────────────────────────────

S("B22_ENVIRONMENT", "Lingkungan", "Lingkungan",
  lingkar(0, 1.0, A(0.03, -0.38, 1.34), 0.065, "luar", "depan", n=10, mulai=0, putaran=1,
          a="telapak", b="E", j="atas", tp="dalam") + [k(1.15)],
  L=[k(0, p=A(0.03, -0.38, 1.26), a="pergelangan", b="1", j="atas", tp="dalam")],
  gloss="ENVIRONMENT", cara="Tangan bentuk E berputar mengelilingi telunjuk kiri yang tegak (yang ada di sekitar kita).")

_masalah = [k(0, p=A(-0.02, -0.39, 1.25), a="ujung", b="BENT_V", j="dalam+0.2*depan", tp="belakang")]
S("B22_PROBLEM", "Masalah", "Lingkungan",
  _masalah + bolak(0.15, 0.18, 4, {"putar": 35}, {"putar": -25}) + [k(0.9, putar=0)],
  L=cermin(_masalah + bolak(0.15, 0.18, 4, {"putar": -25}, {"putar": 35}) + [k(0.9, putar=0)]),
  wajah="sedih", gloss="PROBLEM", cara="Dua tangan V tertekuk, buku jarinya beradu dan diputar berlawanan.")

S("B22_PROTECT", "Melindungi / menjaga", "Lingkungan", [
    k(0, p=A(0.0, -0.33, 1.26), a="pergelangan", b="S", j="atas+0.6*dalam", tp="depan"),
    k(0.15),
    k(0.45, p=A(0.0, -0.43, 1.26)),
    k(0.7),
], L=[k(0, p=A(0.0, -0.30, 1.26), a="pergelangan", b="S", j="atas+0.6*dalam", tp="depan"),
      k(0.15), k(0.45, p=A(0.0, -0.40, 1.26)), k(0.7)],
  gloss="PROTECT", cara="Dua kepalan bersilang di pergelangan, didorong maju seperti perisai (DEFEND / PROTECT).")

S("B22_THROW_AWAY", "Membuang", "Lingkungan", [
    k(0, p="netral+0.10*atas+0.03*belakang", a="telapak", b="S", j="atas+0.4*depan", tp="belakang"),
    k(0.15),
    k(0.42, p="netral+0.10*depan+0.06*bawah", b="5", j="depan+0.5*bawah", tp="bawah"),
    k(0.7),
], gloss="THROW-AWAY", cara="Kepalan diayun ke depan-bawah lalu dibuka menjadi tangan 5 — membuang sesuatu.")

# ── Media sosial ───────────────────────────────────────────────────────────

S("B22_LIE", "Bohong / hoaks", "Media", [
    k(0, p="dagu+0.05*luar+0.025*atas+0.012*depan", a="jari_telunjuk", b="1", j="dalam", tp="bawah"),
    k(0.15),
    k(0.55, p="dagu+0.04*dalam+0.025*atas+0.012*depan"),
    k(0.75),
], gloss="LIE", cara="Telunjuk mendatar (telapak ke bawah) digeser melintasi dagu dari kanan ke kiri.")

S("B22_RULE", "Aturan", "Media", [
    k(0, p=A(0.035, -0.385, 1.33), a="ujung", b="R", j="atas+0.3*depan", tp="dalam"),
    k(0.15, p=A(0.03, -0.385, 1.31)),
    k(0.3, p=A(0.035, -0.385, 1.29)),
    k(0.5, p=A(0.03, -0.385, 1.24)),
    k(0.75),
], L=[k(0, **_KIRI_TEGAK)],
  gloss="RULE", cara="Tangan bentuk R ditempelkan ke telapak kiri yang tegak, di bagian atas lalu bawah (seperti LAW dengan R).")

S("B22_INFLUENCE", "Pengaruh / memengaruhi", "Media", [
    k(0, p=A(0.03, -0.30, 1.225), a="ujung", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.6, p=A(-0.06, -0.50, 1.24), b="5", j="depan", tp="bawah"),
    k(0.8),
], L=[k(0, p=A(0.03, -0.30, 1.20), a="punggung", b="FLAT", j="dalam+0.5*depan", tp="bawah")],
  gloss="INFLUENCE", cara="O-pipih di punggung tangan kiri bergerak maju sambil membuka menyebar.")

S("B22_DANGER", "Bahaya / berbahaya", "Media", [
    k(0, p=A(0.03, -0.355, 1.19), a="jempol", b="A", j="atas", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": A(0.03, -0.355, 1.25)}, {"p": A(0.03, -0.355, 1.19)}),
    k(0.8, p=A(0.03, -0.355, 1.25)),
], L=[k(0, p=A(0.03, -0.33, 1.22), a="punggung", b="S", j="dalam", tp="belakang")],
  wajah="sedih", gloss="DANGER", cara="Ibu jari kepalan A menyapu ke atas di punggung kepalan kiri dua kali.")

# ── Diskusi kelompok ───────────────────────────────────────────────────────

def _lingkar_kelompok(b):
    kk = [
        k(0, p=A(-0.045, -0.44, 1.26), a="telapak", b=b, j="atas", tp="depan"),
        k(0.15),
        k(0.38, p=A(-0.14, -0.36, 1.26), tp="dalam"),
        k(0.6, p=A(-0.045, -0.28, 1.26), tp="belakang"),
        k(0.8),
    ]
    return kk, cermin(kk)

_R, _L = _lingkar_kelompok("C")
S("B22_GROUP", "Kelompok", "Diskusi", _R, L=_L,
  gloss="GROUP", cara="Dua tangan C (telapak ke depan) melingkar ke arah badan sampai kelingking bertemu.")
_R, _L = _lingkar_kelompok("T")
S("B22_TEAM", "Tim", "Diskusi", _R, L=_L,
  gloss="TEAM", cara="Sama dengan GROUP, tetapi dengan dua tangan bentuk T.")

S("B22_WAIT", "Menunggu", "Diskusi", [
    k(0, p=A(-0.12, -0.36, 1.22), a="telapak", b="5", j="depan+0.3*dalam", tp="atas"),
    *bolak(0.12, 0.12, 6, {"b": "5_TEKUK"}, {"b": "5"}),
    k(0.9),
], L=[k(0, p=A(0.07, -0.46, 1.23), a="telapak", b="5", j="depan+0.3*dalam", tp="atas"),
      *bolak(0.12, 0.12, 6, {"b": "5"}, {"b": "5_TEKUK"}), k(0.9)],
  gloss="WAIT", cara="Dua tangan 5 menghadap atas (kiri di depan), jari-jari digoyang menunggu.")

_fokus = [
    k(0, p="mata+0.10*luar+0.05*depan+0.13*bawah", a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.6, p="mata+0.10*luar+0.22*depan+0.15*bawah", j="depan+0.3*atas"),
    k(0.8),
]
S("B22_FOCUS", "Fokus / perhatian", "Diskusi", _fokus, L=cermin(_fokus),
  gloss="ATTENTION", cara="Dua tangan datar di samping mata (seperti kacamata kuda) bergerak lurus ke depan.")

S("B22_INTERRUPT", "Menyela / memotong", "Diskusi", [
    k(0, p=A(0.03, -0.36, 1.32), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.2),
    k(0.42, p=A(0.03, -0.36, 1.228)),
    k(0.7),
], L=[k(0, p=A(0.03, -0.36, 1.22), a="sisi_telunjuk", b="FLAT", j="depan+0.3*dalam", tp="dalam")],
  gloss="INTERRUPT", cara="Sisi kelingking tangan kanan memotong turun ke sisi atas tangan kiri yang tegak menyamping.")

S("B22_WAVE", "Melambai minta perhatian", "Diskusi", [
    k(0, p="netral+0.10*atas+0.06*depan", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="bawah"),
    *bolak(0.12, 0.13, 6, {"j": "depan+0.6*bawah"}, {"j": "depan+0.4*atas"}),
    k(0.95),
], gloss="(WAVE)", cara="Telapak menghadap bawah dikibaskan naik-turun di bidang pandang lawan bicara — cara sopan meminta perhatian.")

# ── Debat formal ───────────────────────────────────────────────────────────

_hakim = [k(0, p=A(-0.08, -0.38, 1.26), a="telunjuk", b="F", j="depan+0.3*atas", tp="dalam")]
S("B22_JUDGE", "Menilai / juri / pengadilan", "Debat",
  _hakim + bolak(0.15, 0.15, 5, {"p": A(-0.08, -0.38, 1.32)}, {"p": A(-0.08, -0.38, 1.20)}) + [k(0.95)],
  L=cermin(_hakim + bolak(0.15, 0.15, 5, {"p": A(-0.08, -0.38, 1.20)}, {"p": A(-0.08, -0.38, 1.32)}) + [k(0.95)]),
  gloss="JUDGE", cara="Dua tangan F naik-turun bergantian seperti timbangan (JUDGE / COURT; + PERSON = juri/hakim).")

_kutip = [k(0, p=A(-0.12, -0.36, 1.52), a="ujung", b="V", j="atas", tp="depan")]
S("B22_TOPIC", "Topik / judul / mosi", "Debat",
  _kutip + bolak(0.15, 0.15, 4, {"b": "BENT_V"}, {"b": "V"}) + [k(0.8, b="BENT_V")],
  L=cermin(_kutip + bolak(0.15, 0.15, 4, {"b": "BENT_V"}, {"b": "V"}) + [k(0.8, b="BENT_V")]),
  gloss="TOPIC", cara="Dua tangan V di depan atas, jari ditekuk dua kali seperti tanda kutip (TITLE / TOPIC).")

S("B22_SUPPORT", "Mendukung / pro", "Debat", [
    k(0, p=A(0.02, -0.36, 1.13), a="buku", b="S", j="atas", tp="dalam"),
    k(0.2, p=A(0.02, -0.36, 1.218)),
    k(0.6, p=A(0.02, -0.36, 1.308)),
    k(0.8),
], L=[k(0, p=A(0.02, -0.36, 1.24), a="telapak", b="S", j="depan+0.3*dalam", tp="bawah"),
      k(0.2), k(0.6, p=A(0.02, -0.36, 1.33)), k(0.8)],
  gloss="SUPPORT", cara="Kepalan kanan mendorong naik kepalan kiri dari bawah — menopang.")

S("B22_AGAINST", "Menentang / kontra", "Debat", [
    k(0, p=A(-0.09, -0.30, 1.27), a="ujung", b="FLAT", j="dalam+0.2*depan", tp="belakang"),
    k(0.15),
    k(0.4, p=A(0.022, -0.385, 1.27)),
    k(0.65),
], L=[k(0, p=A(0.04, -0.385, 1.27), a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam")],
  wajah="sedih", gloss="AGAINST", cara="Ujung jari tangan datar kanan menghantam telapak kiri yang tegak.")

S("B22_IDEA", "Ide / gagasan", "Debat", [
    k(0, p="pelipis+0.03*depan+0.02*luar", a="kelingking", b="I", j="atas", tp="belakang"),
    k(0.15),
    k(0.55, p="pelipis+0.09*depan+0.05*luar+0.06*atas"),
    k(0.75),
], wajah="senang", gloss="IDEA", cara="Kelingking (bentuk I) di pelipis bergerak naik ke depan — gagasan muncul.")
