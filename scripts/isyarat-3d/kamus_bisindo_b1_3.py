# [isyarat-b1b2-v1] Kamus isyarat BISINDO B1.3 "Kalimat Majemuk & Pendapat".
# Tangan dominan kanan. Format sama dengan kamus_bisindo.py; kode baru berawalan B13_.
# ⚠️ Rujukan daring kosakata BISINDO tingkat ini sangat sedikit. Hampir semua bentuk di sini
#    ditulis dari prinsip ikonik umum BISINDO + gerak bibir dan DITANDAI ragu=True — WAJIB
#    dicek pengajar Tuli (variasi daerah besar). Bentuk ASL sengaja TIDAK disalin.
#    Yang tidak ragu hanya isyarat yang sangat ikonik (ADUK, TUANG, POTONG).

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"
_TELUNJUK_DAHI = dict(a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang")
# telapak kiri datar menghadap atas di depan badan (alas)
_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
# tangan kiri C seperti memegang gelas
_GELAS = A(0.035, -0.35, 1.16)
_L_GELAS = [k(0, p=_GELAS, a="telapak", b="C", j="dalam+0.4*depan", tp="dalam")]

GELENG = [(0.15, 0, 0, 0), (0.3, 0, 12, 0), (0.45, 0, -12, 0), (0.6, 0, 10, 0), (0.75, 0, 0, 0)]
ANGGUK = [(0.15, 0, 0, 0), (0.35, 10, 0, 0), (0.55, 0, 0, 0)]


def _sym(keys):
    return dict(R=keys, L=cermin(keys))


# ── Sebab-akibat, pertentangan, tujuan ────────────────────────────────────

_AKIBAT = [
    k(0, p=A(-0.05, -0.30, 1.28), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.45, p=A(-0.06, -0.42, 1.26)),
    k(0.7, p=A(-0.07, -0.50, 1.18), j="depan+0.4*bawah"),
    k(0.9),
]
S("B13_AKIBAT", "Akibat / dampak", "Penghubung", **_sym(_AKIBAT), gloss="AKIBAT", ragu=True,
  cara="Dua telapak menengadah di depan dada didorong maju lalu melengkung turun ke depan (hasil yang datang kemudian), sambil mengucapkan 'akibat'.")

S("B13_WALAUPUN", "Walaupun / meskipun", "Penghubung", [
    k(0, p="netral+0.08*atas+0.04*depan", a="telapak", b="FLAT", j="depan+0.4*dalam", tp="bawah"),
    k(0.15),
    k(0.5, p="netral+0.06*atas+0.08*luar+0.06*depan", tp="atas"),
    k(0.75),
], kepala=[(0.15, 0, 0, 0), (0.45, -4, 0, 5), (0.75, -4, 0, 5)], ragu=True, gloss="WALAUPUN",
  cara="Tangan datar telapak ke bawah dibalik menjadi telapak ke atas sambil bergeser ke samping (biarpun begitu), kepala sedikit miring, sambil mengucapkan 'walaupun'.")

S("B13_SUPAYA", "Supaya / agar", "Penghubung", [
    k(0, p="dada+0.10*depan+0.03*luar", a="sisi_kelingking", b="FLAT", j="depan+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p="dada+0.30*depan+0.03*luar+0.03*atas"),
    k(0.8),
], L=[k(0, p=A(0.03, -0.50, 1.30), a="telapak", b="FLAT", j="atas", tp="belakang")],
  ragu=True, gloss="SUPAYA",
  cara="Tangan kanan datar tegak dari depan dada didorong lurus menuju telapak kiri yang tegak di depan (menuju sasaran), sambil mengucapkan 'supaya'.")

# ── Negasi ─────────────────────────────────────────────────────────────────

S("B13_JANGAN", "Jangan", "Negasi", [
    k(0, p="netral+0.10*atas+0.10*depan", a="telapak", b="FLAT", j="atas", tp="depan"),
    *bolak(0.12, 0.12, 5, {"putar": -25, "p": "netral+0.10*atas+0.10*depan+0.02*luar"},
           {"putar": 20, "p": "netral+0.10*atas+0.10*depan+0.02*dalam"}),
    k(0.8, putar=0),
], kepala=GELENG, wajah="sedih", ragu=True, gloss="JANGAN",
  cara="Telapak terbuka menghadap lawan bicara dikibaskan kiri-kanan sambil menggeleng dan alis berkerut, mengucapkan 'jangan'.")

S("B13_TOLAK", "Menolak", "Negasi", [
    k(0, p="dada+0.10*depan+0.02*luar+0.04*atas", a="telapak", b="FLAT", j="atas+0.2*dalam", tp="depan"),
    k(0.15),
    k(0.5, p="dada+0.30*depan+0.02*luar+0.04*atas"),
    k(0.8),
], kepala=[(0.15, 0, 0, 0), (0.4, -4, 10, 0), (0.6, -4, -8, 0), (0.8, 0, 0, 0)], ragu=True, gloss="TOLAK",
  cara="Telapak tegak menghadap depan didorong menjauh dari dada sambil sedikit menggeleng — menolak.")

# ── Kemungkinan & keyakinan ───────────────────────────────────────────────

S("B13_PASTI", "Pasti", "Keyakinan", [
    k(0, p="dagu+0.04*depan", a="telunjuk", b="1", j="atas+0.5*dalam", tp="dalam+0.4*belakang"),
    k(0.15),
    k(0.45, p="netral+0.10*atas+0.20*depan", j="depan+0.3*atas", tp="dalam"),
    k(0.75),
], kepala=ANGGUK, ragu=True, gloss="PASTI",
  cara="Telunjuk dari depan dagu bergerak mantap lurus ke depan sambil mengangguk tegas, mengucapkan 'pasti'.")

S("B13_SEPERTINYA", "Sepertinya / kayaknya", "Keyakinan", [
    k(0, p="netral+0.06*atas+0.06*depan", a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.14, 5, {"putar": -22}, {"putar": 22}),
    k(0.85, putar=0),
], kepala=[(0.1, 0, 0, 0), (0.35, -3, 0, 8), (0.85, -3, 0, 8)], ragu=True, gloss="SEPERTINYA",
  cara="Tangan 5 telapak ke bawah digoyang miring kiri-kanan (belum pasti), kepala sedikit miring, sambil mengucapkan 'kayaknya'.")

S("B13_YAKIN", "Yakin", "Keyakinan", [
    k(0, p="dada+0.12*depan+0.02*atas", a="telapak", b="5", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.45, p="dada+0.025*depan", b="S"),
    k(0.75),
], kepala=ANGGUK, ragu=True, gloss="YAKIN",
  cara="Tangan terbuka di depan dada ditarik lalu mengepal mantap menempel di dada sambil mengangguk.")

_RAGU = [
    k(0, p=A(-0.08, -0.38, 1.24), a="telapak", b="FLAT", j="depan+0.2*dalam", tp="atas"),
    *bolak(0.12, 0.16, 5, {"p": A(-0.08, -0.38, 1.28)}, {"p": A(-0.08, -0.38, 1.20)}),
    k(0.9),
]
_RAGU_L = cermin([
    k(0, p=A(-0.08, -0.38, 1.24), a="telapak", b="FLAT", j="depan+0.2*dalam", tp="atas"),
    *bolak(0.12, 0.16, 5, {"p": A(-0.08, -0.38, 1.20)}, {"p": A(-0.08, -0.38, 1.28)}),
    k(0.9),
])
S("B13_RAGU", "Ragu / bimbang", "Keyakinan", R=_RAGU, L=_RAGU_L, wajah="sedih",
  kepala=[(0.1, 0, 0, 0), (0.4, 0, 0, 7), (0.7, 0, 0, -7), (0.9, 0, 0, 0)], ragu=True, gloss="RAGU",
  cara="Dua telapak menengadah naik-turun bergantian seperti timbangan, wajah bimbang.")

S("B13_TEBAK", "Menebak", "Keyakinan", [
    k(0, p="pelipis+0.12*depan+0.04*luar+-0.05*atas", a="telapak", b="C", j="depan+0.5*atas", tp="dalam"),
    k(0.15),
    k(0.4, p="pelipis+0.18*depan+0.02*dalam+-0.06*atas", b="S"),
    k(0.7),
], ragu=True, gloss="TEBAK",
  cara="Tangan C di depan pelipis menyambar cepat menjadi kepalan (menangkap jawaban), sambil mengucapkan 'tebak'.")

# ── Pendapat & argumen ────────────────────────────────────────────────────

S("B13_ALASAN", "Alasan", "Pendapat", [
    k(0, p=_DAHI + "+0.04*depan", **_TELUNJUK_DAHI),
    k(0.15, p=_DAHI),
    k(0.3),
    k(0.6, p=_ALAS + A(-0.01, -0.01, 0.06), j="depan+0.6*bawah+0.3*dalam", tp="dalam"),
    k(0.72, p=_ALAS + A(-0.01, -0.01, 0.012)),
    k(0.95),
], L=_L_ALAS, ragu=True, gloss="ALASAN",
  cara="Telunjuk menyentuh pelipis lalu turun mengetuk telapak kiri (dasar pikiran), sambil mengucapkan 'alasan'.")

S("B13_CONTOH", "Contoh / misalnya", "Pendapat", [
    k(0, p=_ALAS + A(-0.01, 0.0, 0.03), a="punggung", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.55, p="netral+0.12*atas+0.16*depan", j="atas+0.4*depan", tp="depan"),
    k(0.8),
], L=_L_ALAS, ragu=True, gloss="CONTOH",
  cara="Tangan kanan datar dari atas telapak kiri diangkat dan diperlihatkan ke depan (telapak ke lawan bicara), sambil mengucapkan 'contoh'.")

_JELAS = [
    k(0, p=A(-0.05, -0.34, 1.26), a="telapak", b="FLAT", j="depan", tp="dalam"),
    k(0.12),
    k(0.32, p=A(-0.05, -0.44, 1.26)),
    k(0.5, p=A(-0.05, -0.36, 1.26)),
    k(0.7, p=A(-0.05, -0.46, 1.26)),
    k(0.85),
]
S("B13_JELASKAN", "Menjelaskan", "Pendapat", **_sym(_JELAS), ragu=True, gloss="JELASKAN",
  cara="Dua tangan datar berhadapan (seperti memegang kotak) didorong maju dua kali — menguraikan sesuatu, sambil mengucapkan 'jelaskan'.")

S("B13_BANTAH", "Membantah / berdebat", "Pendapat", [
    k(0, p=A(-0.04, -0.38, 1.28), a="telunjuk", b="1", j="depan+0.5*atas+0.3*dalam", tp="dalam"),
    *bolak(0.12, 0.14, 5, {"p": A(-0.025, -0.44, 1.28)}, {"p": A(-0.04, -0.36, 1.28)}),
    k(0.85),
], L=cermin([
    k(0, p=A(-0.04, -0.44, 1.28), a="telunjuk", b="1", j="depan+0.5*atas+0.3*dalam", tp="dalam"),
    *bolak(0.12, 0.14, 5, {"p": A(-0.04, -0.36, 1.28)}, {"p": A(-0.025, -0.44, 1.28)}),
    k(0.85),
]), wajah="wh", ragu=True, gloss="BANTAH",
  cara="Dua telunjuk saling menunjuk dan maju-mundur bergantian (adu pendapat), alis berkerut.")

S("B13_USUL", "Usul / mengusulkan", "Pendapat", [
    k(0, p="dada+0.08*depan+0.02*luar", a="punggung", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.55, p="dada+0.26*depan+0.02*luar+0.03*atas", j="depan+0.3*atas"),
    k(0.8),
], ragu=True, gloss="USUL",
  cara="Telapak menengadah dari depan dada disodorkan maju sedikit ke atas (mengajukan sesuatu), sambil mengucapkan 'usul'.")

# ── Kompromi & diskusi ────────────────────────────────────────────────────

S("B13_SEBAGIAN", "Sebagian", "Diskusi", [
    k(0, p=_ALAS + A(-0.005, -0.015, 0.07), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.15, p=_ALAS + A(-0.005, -0.015, 0.012)),
    k(0.5, p=_ALAS + A(-0.06, -0.015, 0.012), tp="dalam+0.4*luar"),
    k(0.75),
], L=_L_ALAS, ragu=True, gloss="SEBAGIAN",
  cara="Sisi kelingking tangan kanan memotong di tengah telapak kiri lalu menggeser satu bagian ke samping, sambil mengucapkan 'sebagian'.")

_TENGAH = [
    k(0, p=A(-0.20, -0.36, 1.24), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.03, -0.38, 1.24)),
    k(0.85),
]
S("B13_JALAN_TENGAH", "Jalan tengah / kompromi", "Diskusi", **_sym(_TENGAH), ragu=True, gloss="JALAN-TENGAH",
  cara="Dua tangan datar tegak dari kanan dan kiri bergerak mendekat dan bertemu di tengah, sambil mengucapkan 'jalan tengah'.")

_DISKUSI = [
    k(0, p=A(-0.07, -0.36, 1.24), a="punggung", b="FLAT", j="depan+0.4*dalam", tp="atas"),
    *bolak(0.12, 0.15, 5, {"p": A(-0.07, -0.44, 1.24)}, {"p": A(-0.07, -0.34, 1.24)}),
    k(0.9),
]
S("B13_DISKUSI", "Diskusi / musyawarah", "Diskusi", R=_DISKUSI, L=cermin([
    k(0, p=A(-0.07, -0.44, 1.24), a="punggung", b="FLAT", j="depan+0.4*dalam", tp="atas"),
    *bolak(0.12, 0.15, 5, {"p": A(-0.07, -0.34, 1.24)}, {"p": A(-0.07, -0.44, 1.24)}),
    k(0.9),
]), ragu=True, gloss="DISKUSI",
  cara="Dua telapak menengadah maju-mundur bergantian (bertukar pendapat), sambil mengucapkan 'diskusi'.")

_KELOMPOK = lingkar(0.0, 0.85, A(-0.11, -0.42, 1.24), 0.06, "depan", "luar", n=8, mulai=0, putaran=0.5,
                    a="telapak", b="C", j="atas+0.3*depan", tp="dalam") + [k(1.0)]
S("B13_KELOMPOK", "Kelompok", "Diskusi", **_sym(_KELOMPOK), ragu=True, gloss="KELOMPOK",
  cara="Dua tangan C dari depan bergerak melingkar ke arah badan, membentuk satu lingkaran orang, sambil mengucapkan 'kelompok'.")

S("B13_GILIRAN", "Giliran", "Diskusi", [
    k(0, p="dada+0.10*depan", a="telapak", b="L", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.55, p="netral+0.06*atas+0.22*depan", tp="dalam"),
    k(0.8),
], ragu=True, gloss="GILIRAN",
  cara="Tangan L (telunjuk & ibu jari) dari depan dada diputar dan diarahkan ke lawan bicara — sekarang giliranmu.")

_PERH = [
    k(0, p="mata+0.08*luar+0.08*depan+-0.09*atas", a="telapak", b="FLAT", j="depan+0.7*atas", tp="dalam"),
    k(0.15),
    k(0.55, p="mata+0.06*luar+0.26*depan+-0.12*atas", j="depan+0.3*atas"),
    k(0.8),
]
S("B13_PERHATIAN", "Perhatian / fokus", "Diskusi", R=_PERH,
  L=cermin(_PERH),
  ragu=True, gloss="PERHATIAN",
  cara="Dua tangan datar di samping mata seperti penutup mata kuda, lalu didorong lurus ke depan — fokus ke satu arah.")

S("B13_RANGKUM", "Merangkum / kesimpulan", "Diskusi", [
    k(0, p="netral+0.08*atas+0.20*depan", a="telapak", b="5", j="atas+0.3*depan", tp="depan"),
    k(0.15),
    k(0.55, p="dada+0.10*depan+0.05*atas", a="ujung", b="FLAT_O", j="atas+0.3*belakang", tp="belakang"),
    k(0.8),
], ragu=True, gloss="RANGKUM",
  cara="Tangan 5 di depan ditarik ke arah dada sambil menguncup — mengumpulkan semua jadi satu, sambil mengucapkan 'rangkum'.")

# ── Meminta, menawarkan & register ────────────────────────────────────────

S("B13_TAWAR", "Menawarkan", "Sopan santun", [
    k(0, p="dada+0.07*depan+0.03*luar", a="punggung", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.55, p="netral+0.22*depan+0.02*atas", j="depan+0.4*dalam"),
    k(0.85),
], wajah="ya_tidak", ragu=True, gloss="TAWAR",
  cara="Telapak menengadah dari dada disodorkan ke arah lawan bicara dengan alis naik — 'mau?'")

S("B13_SOPAN", "Sopan / halus", "Sopan santun", [
    k(0, p="dada+0.025*depan+0.06*atas", a="telapak", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    k(0.2),
    k(0.6, p="dada+0.025*depan+-0.02*atas"),
    k(0.9),
], kepala=[(0.2, 0, 0, 0), (0.5, 10, 0, 0), (0.9, 6, 0, 0)], wajah="senang", ragu=True, gloss="SOPAN",
  cara="Telapak menempel di dada dan diusap pelan ke bawah sambil kepala sedikit menunduk, wajah lembut.")

S("B13_TERSERAH", "Terserah", "Sopan santun", [
    k(0, p="netral+0.05*atas+0.04*depan+0.02*dalam", a="punggung", b="FLAT", j="depan+0.4*dalam", tp="atas"),
    k(0.15),
    k(0.5, p="netral+0.02*atas+0.12*luar+0.08*depan", j="depan+0.5*luar"),
    k(0.8),
], kepala=[(0.15, 0, 0, 0), (0.45, 0, 0, 8), (0.8, 0, 0, 4)], ragu=True, gloss="TERSERAH",
  cara="Telapak menengadah digerakkan ke samping-luar sambil kepala miring — 'terserah kamu'.")

S("B13_SANTAI", "Santai", "Register", **_sym([
    k(0, p=A(-0.10, -0.34, 1.30), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.2),
    k(0.75, p=A(-0.18, -0.36, 1.22)),
    k(1.0),
]), wajah="senang", ragu=True, gloss="SANTAI",
  cara="Dua tangan terbuka telapak ke bawah bergerak pelan turun ke samping, wajah tenang — santai.")

_RESMI = [
    k(0, p="leher+0.05*luar+0.05*depan+-0.02*atas", a="ujung", b="BABY_O", j="atas+0.3*dalam+0.2*depan", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.6, p="dada+0.06*luar+0.05*depan+-0.06*atas"),
    k(0.85),
]
S("B13_RESMI", "Resmi / formal", "Register", **_sym(_RESMI), ragu=True, gloss="RESMI",
  cara="Dua tangan menjepit kerah jas lalu ditarik turun merapikannya (berpakaian rapi, acara resmi), sambil mengucapkan 'resmi'.")

_ACARA = [
    k(0, p=A(-0.08, -0.38, 1.26), a="telapak", b="5", j="atas+0.3*depan", tp="depan+0.6*dalam"),
    *bolak(0.12, 0.13, 5, {"putar": -25, "p": A(-0.10, -0.38, 1.27)}, {"putar": 25, "p": A(-0.08, -0.38, 1.25)}),
    k(0.85, putar=0),
]
S("B13_ACARA", "Acara / kegiatan", "Register", **_sym(_ACARA), ragu=True, gloss="ACARA",
  cara="Dua tangan 5 terangkat di depan badan diputar-putar pergelangan bergantian (ramai kegiatan), sambil mengucapkan 'acara'.")

# ── Instruksi & resep ─────────────────────────────────────────────────────

_CARA = [
    k(0, p=A(-0.05, -0.30, 1.22), a="sisi_kelingking", b="FLAT", j="depan", tp="dalam"),
    k(0.12),
    k(0.35, p=A(-0.06, -0.38, 1.22), j="depan+0.25*luar"),
    k(0.6, p=A(-0.04, -0.46, 1.22), j="depan+0.25*dalam"),
    k(0.85, p=A(-0.05, -0.52, 1.22), j="depan"),
    k(1.0),
]
S("B13_CARA", "Cara / langkah", "Instruksi", **_sym(_CARA), ragu=True, gloss="CARA",
  cara="Dua tangan datar sejajar berhadapan maju berkelok ke depan seperti jalan yang ditempuh, sambil mengucapkan 'cara'.")

S("B13_BUAT", "Membuat", "Instruksi", [
    k(0, p=A(-0.02, -0.37, 1.235), a="telapak", b="S", j="dalam+0.4*depan", tp="bawah"),
    *bolak(0.12, 0.13, 5, {"putar": -30}, {"putar": 25}),
    k(0.85, putar=0),
], L=[k(0, p=A(0.02, -0.37, 1.20), a="punggung", b="S", j="dalam+0.4*depan", tp="atas")],
  ragu=True, gloss="BUAT",
  cara="Kepalan kanan di atas kepalan kiri, diputar-putar seperti sedang merangkai sesuatu, sambil mengucapkan 'buat'.")

S("B13_TUNGGU", "Tunggu / sebentar", "Instruksi", [
    k(0, p="netral+0.10*atas+0.10*depan", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.13, 4, {"p": "netral+0.04*atas+0.10*depan"}, {"p": "netral+0.10*atas+0.10*depan"}),
    k(0.75),
], ragu=True, gloss="TUNGGU",
  cara="Telapak menghadap bawah ditekan-tekan pelan ke bawah dua kali — 'tunggu sebentar'.")

S("B13_POTONG", "Memotong", "Instruksi", [
    k(0, p=_ALAS + A(-0.005, 0.02, 0.06), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    *bolak(0.1, 0.11, 6, {"p": _ALAS + A(-0.005, 0.02, 0.012)}, {"p": _ALAS + A(-0.005, -0.03, 0.06)}),
    k(0.8, p=_ALAS + A(-0.005, -0.06, 0.012)),
], L=_L_ALAS, gloss="POTONG",
  cara="Sisi kelingking tangan kanan memotong-motong di atas telapak kiri sambil bergeser maju — seperti memotong sayur.")

S("B13_ADUK", "Mengaduk", "Instruksi",
  [k(0, p=_GELAS + A(0.0, 0.0, 0.10), a="ujung", b="BABY_O", j="depan+0.7*bawah+0.3*dalam", tp="dalam")] +
  lingkar(0.12, 0.85, _GELAS + A(0.0, 0.0, 0.10), 0.025, "depan", "dalam", n=10, mulai=0, putaran=2) + [k(1.0)],
  L=_L_GELAS, gloss="ADUK",
  cara="Tangan kiri seperti memegang gelas; tangan kanan seperti memegang sendok, berputar mengaduk di atasnya.")

S("B13_TUANG", "Menuang", "Instruksi", [
    k(0, p=_GELAS + A(-0.10, 0.0, 0.14), a="telapak", b="A", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.55, putar=-70),
    k(0.85, putar=-70),
    k(1.05, putar=0),
], L=_L_GELAS, gloss="TUANG",
  cara="Tangan kanan menggenggam seperti memegang teko di atas 'gelas' tangan kiri, lalu dimiringkan menuang.")

S("B13_GULA", "Gula", "Instruksi", [
    k(0, p="dagu+0.03*depan", a="ujung", b="FLAT", j="atas+0.5*dalam", tp="belakang"),
    k(0.12),
    k(0.32, p="dagu+0.03*depan+-0.03*atas", b="SANTAI"),
    k(0.5, p=_GELAS + A(-0.01, 0, 0.12), a="ujung", b="FLAT_O", j="depan+0.7*bawah+0.2*dalam", tp="bawah"),
    *bolak(0.62, 0.1, 4, {"b": "O"}, {"b": "FLAT_O"}),
    k(1.05),
], L=_L_GELAS, ragu=True, gloss="GULA",
  cara="Jari mengusap dagu (manis), lalu jari kuncup menabur di atas 'gelas' tangan kiri, sambil mengucapkan 'gula'.")

# ── Masalah & solusi ──────────────────────────────────────────────────────

_MASALAH = [
    k(0, p=A(-0.035, -0.38, 1.26), a="buku", b="BENT_V", j="dalam+0.3*depan", tp="bawah+0.4*belakang"),
    *bolak(0.12, 0.15, 5, {"putar": -25, "p": A(-0.03, -0.38, 1.25)}, {"putar": 20, "p": A(-0.04, -0.38, 1.27)}),
    k(0.9, putar=0),
]
S("B13_MASALAH", "Masalah", "Masalah", R=_MASALAH, L=cermin([
    k(0, p=A(-0.035, -0.38, 1.26), a="buku", b="BENT_V", j="dalam+0.3*depan", tp="atas+0.4*belakang"),
    *bolak(0.12, 0.15, 5, {"putar": 20, "p": A(-0.04, -0.38, 1.27)}, {"putar": -25, "p": A(-0.03, -0.38, 1.25)}),
    k(0.9, putar=0),
]), wajah="sedih", ragu=True, gloss="MASALAH",
  cara="Dua tangan V bengkok saling berhadapan dan memutar bergantian seperti benang kusut, wajah berkerut, sambil mengucapkan 'masalah'.")

_SOLUSI = [
    k(0, p=A(-0.01, -0.38, 1.24), a="pergelangan", b="S", j="atas+0.3*dalam", tp="dalam+0.6*belakang"),
    k(0.15),
    k(0.55, p=A(-0.15, -0.40, 1.28), b="5", j="atas+0.4*luar", tp="depan"),
    k(0.85),
]
S("B13_SOLUSI", "Solusi / jalan keluar", "Masalah", **_sym(_SOLUSI), wajah="senang", ragu=True, gloss="SOLUSI",
  cara="Dua kepalan bersilang di pergelangan (terikat) lalu dilepas ke samping dan membuka — masalah terurai, sambil mengucapkan 'solusi'.")
