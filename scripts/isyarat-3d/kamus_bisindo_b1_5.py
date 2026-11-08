# [isyarat-b1b2-v1] Kamus isyarat BISINDO B1.5 "Masyarakat, Budaya & Variasi BISINDO".
# Tangan dominan kanan. Format sama dengan kamus_bisindo.py; kode baru berawalan B15_.
# ⚠️ Rujukan daring kosakata BISINDO tingkat B1 (agama, politik, lingkungan, teknologi) sangat
#    sedikit dan variasi daerahnya besar. Hampir semua bentuk di sini ditulis dari prinsip ikonik
#    umum BISINDO + gerak bibir dan DITANDAI ragu=True — WAJIB dicek pengajar Tuli.
#    Bentuk ASL sengaja tidak disalin.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # telunjuk ditekuk seperti kait (alat bantu dengar di belakang telinga)
    "B15_KAIT": (I._jari(_G, index=(20, 85, 60)), "depan_genggam_manis"),
    # telunjuk & jari tengah ditekuk (magnet implan di kepala)
    "B15_V_TEKUK": (I._jari(_G, index=(25, 80, 45, 8), middle=(25, 80, 45, -5)), "depan_genggam_manis"),
})

# telapak kiri datar menghadap atas di depan badan (alas)
_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
# telapak kiri tegak menghadap kanan (layar / dinding)
_LAYAR = A(0.04, -0.36, 1.28)
_L_LAYAR = [k(0, p=_LAYAR, a="telapak", b="FLAT", j="atas", tp="dalam")]
_HP = A(0.03, -0.33, 1.20)  # tangan kiri memegang HP
_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"


def _cm(keys):
    """cermin() + titik yang tak ditangani cermin: bahu_kanan, dan p tuple (Vector, offset) dari lingkar()."""
    out = []
    for kk in cermin(keys):
        p = kk.get("p")
        if isinstance(p, str):
            kk["p"] = p.replace("bahu_kanan", "bahu_kiri")
        elif isinstance(p, tuple) and len(p) == 2 and hasattr(p[0], "x"):
            kk["p"] = (A(-p[0].x, p[0].y, p[0].z), p[1])
        out.append(kk)
    return out


def _sym(keys):
    return dict(R=keys, L=_cm(keys))


# ── Variasi & asal-usul bahasa ────────────────────────────────────────────

_VARIASI = [
    k(0, p=A(-0.04, -0.38, 1.24), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.13, 5, {"p": A(-0.08, -0.38, 1.27)}, {"p": A(-0.12, -0.38, 1.22)}),
    k(0.8, p=A(-0.18, -0.38, 1.25)),
    k(0.95),
]
_VARIASI_L = _cm([
    k(0, p=A(-0.04, -0.38, 1.24), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.13, 5, {"p": A(-0.08, -0.38, 1.22)}, {"p": A(-0.12, -0.38, 1.27)}),
    k(0.8, p=A(-0.18, -0.38, 1.25)),
    k(0.95),
])
S("B15_VARIASI", "Variasi / macam-macam / beragam", "Variasi", _VARIASI, L=_VARIASI_L, gloss="VARIASI",
  cara="Dua tangan 5 telapak ke bawah di tengah bergerak menjauh ke samping sambil naik-turun bergantian — banyak bentuk yang berbeda.",
  ragu=True)

S("B15_LOGAT", "Logat / aksen / dialek", "Variasi", [
    k(0, p="dagu+0.08*depan+0.04*luar+0.03*bawah", a="sisi_telunjuk", b="5", j="atas+0.3*dalam", tp="dalam+0.3*belakang"),
    *bolak(0.12, 0.12, 5, {"b": "CLAW", "p": "dagu+0.09*depan+0.07*luar+0.03*bawah"}, {"b": "5", "p": "dagu+0.10*depan+0.10*luar+0.03*bawah"}),
    k(0.8, p="dagu+0.11*depan+0.14*luar+0.03*bawah"),
    k(0.95),
], cara="Tangan 5 di depan dagu, jari bergerak-gerak sambil bergeser ke samping — cara berbahasa yang khas; ucapkan 'logat' tanpa suara.",
  ragu=True)

S("B15_ASAL", "Asal / berasal dari", "Variasi", [
    k(0, p="netral+0.20*depan+0.06*atas+0.04*luar", a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah+0.4*dalam"),
    k(0.15),
    k(0.6, p="dada_kanan+0.06*depan", j="atas+0.6*dalam", tp="belakang"),
    k(0.85),
], cara="Telunjuk menunjuk jauh ke depan lalu ditarik ke dada — dari sana sampai ke diri kita.", ragu=True)

S("B15_ALAMI", "Alami / tumbuh sendiri", "Variasi", [
    k(0, p=_ALAS + A(-0.01, 0.0, 0.03), a="ujung", b="FLAT_O", j="atas", tp="dalam"),
    k(0.15),
    k(0.6, p=_ALAS + A(-0.01, -0.01, 0.17), b="5", j="atas+0.2*luar", tp="dalam+0.3*depan"),
    k(0.85),
], L=[k(0, p=_ALAS + A(0.0, 0.0, -0.01), a="punggung", b="C", j="dalam+0.5*depan", tp="atas")],
  cara="Jari kanan kuncup naik dari tangan kiri lalu mekar — seperti tunas yang tumbuh sendiri tanpa dibuat-buat.", ragu=True)

S("B15_BUATAN", "Buatan / dibuat orang", "Variasi", [
    k(0, p=A(-0.02, -0.37, 1.255), a="telapak", b="S", j="dalam+0.4*depan", tp="bawah"),
    *bolak(0.12, 0.13, 4, {"putar": 45}, {"putar": -10}),
    k(0.7, putar=0),
    k(0.85),
], L=[k(0, p=A(0.02, -0.37, 1.20), a="punggung", b="S", j="dalam+0.4*depan", tp="bawah")],
  cara="Kepalan kanan di atas kepalan kiri dipelintir bolak-balik seperti merakit sesuatu, sambil mengucapkan 'buatan'.",
  ragu=True)

S("B15_PEMERINTAH", "Pemerintah / negara (lembaga)", "Masyarakat", [
    k(0, p="dada_kiri+0.03*depan", a="telapak", b="FLAT", j="atas+0.6*dalam", tp="belakang"),
    k(0.2),
    k(0.6, p="bahu_kanan+0.18*depan+0.06*atas", a="telapak", b="B24_JEMPOL", j="depan+0.2*dalam", tp="dalam"),
    k(0.85),
], cara="Telapak di dada kiri (lambang di seragam), lalu jempol tegak naik tinggi — lembaga yang memimpin; banyak orang juga mengeja.",
  ragu=True)

# ── Istilah baru & serapan ────────────────────────────────────────────────

_ISTILAH = [
    k(0, p=A(-0.03, -0.38, 1.33), a="telapak", b="L", j="atas+0.3*dalam", tp="depan"),
    k(0.15),
    k(0.55, p=A(-0.12, -0.38, 1.33)),
    k(0.8),
]
S("B15_ISTILAH", "Istilah / sebutan", "Istilah", **_sym(_ISTILAH), gloss="ISTILAH",
  cara="Dua tangan L berhadapan di depan wajah bawah lalu ditarik ke samping — membingkai sebuah nama/label.", ragu=True)

S("B15_BARU", "Baru", "Istilah", [
    k(0, p=_ALAS + A(0.03, 0.02, 0.02), a="punggung", b="FLAT", j="dalam+0.4*depan", tp="atas"),
    k(0.15),
    k(0.5, p=_ALAS + A(-0.07, -0.05, 0.08)),
    k(0.75),
], L=_L_ALAS, wajah="senang",
  cara="Punggung tangan kanan menyapu telapak kiri lalu terangkat ke samping, sambil mengucapkan 'baru'.", ragu=True)

S("B15_PINJAM", "Pinjam / menyerap (dari bahasa lain)", "Istilah", [
    k(0, p="netral+0.22*depan+0.06*atas", a="telapak", b="5", j="depan+0.4*atas", tp="bawah+0.4*dalam"),
    k(0.15),
    k(0.35, b="S"),
    k(0.75, p="dada+0.06*depan", j="atas+0.4*dalam", tp="belakang"),
    k(0.95),
], cara="Tangan terbuka di depan meraih (menggenggam) lalu ditarik ke dada — mengambil sesuatu dari luar.", ragu=True)

S("B15_MUNCUL", "Muncul / lahir (isyarat baru)", "Istilah", [
    k(0, p=A(-0.005, -0.37, 1.13), a="telunjuk", b="1", j="atas", tp="dalam"),
    k(0.15),
    k(0.5, p=A(-0.005, -0.37, 1.30)),
    k(0.8),
], L=[k(0, p=A(0.03, -0.38, 1.21), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah")],
  wajah="senang", cara="Telunjuk kanan naik dari bawah melewati sisi tangan kiri yang datar — sesuatu yang tiba-tiba muncul.",
  ragu=True)

# ── Budaya & hari besar ───────────────────────────────────────────────────

S("B15_TRADISI", "Tradisi / adat (turun-temurun)", "Budaya", [
    k(0, p="bahu_kanan+0.04*atas+0.03*depan", a="telapak", b="FLAT", j="atas+0.5*belakang", tp="dalam"),
    k(0.15),
    k(0.45, p="bahu_kanan+0.14*depan"),
    k(0.75, p="bahu_kanan+0.28*depan+0.06*bawah", j="depan+0.4*atas"),
    k(0.95),
], cara="Tangan datar dari atas bahu (masa lalu) bergerak maju dua tahap ke depan — kebiasaan dari dulu sampai sekarang.",
  ragu=True)

_RAYA = [
    k(0, p="bahu_kanan+0.12*depan+0.14*atas+0.02*luar", a="telapak", b="5", j="atas", tp="depan+0.4*dalam"),
    *bolak(0.1, 0.11, 6, {"putar": 35}, {"putar": -35}),
    k(0.8, putar=0),
]
S("B15_RAYAKAN", "Merayakan / perayaan", "Budaya", **_sym(_RAYA), wajah="senang",
  cara="Dua tangan 5 diangkat di samping kepala dan diputar-putar gembira — suasana pesta.", ragu=True)

S("B15_SALAMAN", "Bersalaman (maaf-maafan)", "Budaya", [
    k(0, p=A(-0.03, -0.42, 1.24), a="telapak", b="FLAT", j="depan+0.4*dalam", tp="dalam"),
    k(0.15),
    k(0.35, p=A(-0.01, -0.42, 1.24)),
    k(0.5, p=A(-0.01, -0.42, 1.21)),
    k(0.65, p=A(-0.01, -0.42, 1.24)),
    k(0.95, p="dada_kanan+0.03*depan", a="telapak", b="FLAT", j="atas+0.6*dalam", tp="belakang"),
    k(1.15),
], L=[k(0, p=A(0.03, -0.42, 1.24), a="telapak", b="FLAT", j="depan+0.4*dalam", tp="dalam"),
      k(0.15), k(0.35, p=A(0.01, -0.42, 1.24)), k(0.5, p=A(0.01, -0.42, 1.21)), k(0.65, p=A(0.01, -0.42, 1.24)),
      k(0.95, p=A(0.03, -0.38, 1.20)), k(1.15)],
  kepala=[(0.3, 0, 0, 0), (0.55, 8, 0, 0), (0.95, 4, 0, 0)], wajah="senang",
  cara="Dua telapak bertemu seperti bersalaman, lalu tangan kanan menyentuh dada sambil sedikit menunduk — salaman ala Lebaran.",
  ragu=True)

# ── Agama & ibadah ────────────────────────────────────────────────────────

S("B15_AGAMA", "Agama", "Agama", [
    k(0, p="dada+0.06*depan", a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam"),
    k(0.2),
    k(0.6, p="dada+0.10*depan+0.06*atas"),
    k(0.85),
], L=_cm([
    k(0, p="dada+0.06*depan", a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam"),
    k(0.2),
    k(0.6, p="dada+0.10*depan+0.06*atas"),
    k(0.85),
]), cara="Dua telapak dirapatkan di depan dada (seperti berdoa) lalu diangkat sedikit; ucapkan 'agama' tanpa suara.",
  ragu=True)

S("B15_BERDOA", "Berdoa", "Agama", [
    k(0, p=A(-0.06, -0.33, 1.27), a="telapak", b="FLAT", j="depan+0.5*atas+0.2*dalam", tp="atas+0.5*belakang"),
    k(0.2),
    k(0.7, p=A(-0.06, -0.34, 1.29)),
    k(0.95),
], L=_cm([
    k(0, p=A(-0.06, -0.33, 1.27), a="telapak", b="FLAT", j="depan+0.5*atas+0.2*dalam", tp="atas+0.5*belakang"),
    k(0.2),
    k(0.7, p=A(-0.06, -0.34, 1.29)),
    k(0.95),
]), kepala=[(0.1, 0, 0, 0), (0.4, 10, 0, 0), (0.95, 10, 0, 0)],
  cara="Dua telapak terbuka menghadap ke atas di depan dada, kepala sedikit menunduk — sikap berdoa (bentuk bisa berbeda tiap agama).",
  ragu=True)

S("B15_SHOLAT", "Salat / sholat", "Agama", [
    k(0, p="telinga+0.06*depan+0.02*luar", a="telapak", b="FLAT", j="atas", tp="depan"),
    k(0.25),
    k(0.65, p="dada+0.05*depan+0.02*bawah", a="punggung", b="FLAT", j="dalam", tp="belakang"),
    k(0.9),
], L=[k(0, p=A(0.12, -0.13, 1.56), a="telapak", b="FLAT", j="atas", tp="depan"),
      k(0.25),
      k(0.65, p=A(0.02, -0.18, 1.27), a="telapak", b="FLAT", j="dalam", tp="belakang"),
      k(0.9)],
  cara="Dua telapak diangkat di samping telinga (takbir), lalu bersedekap di depan dada — gerakan awal salat.")

S("B15_IBADAH", "Ibadah / beribadah", "Agama", [
    k(0, p="dagu+0.10*depan+0.04*bawah", a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
    k(0.2),
    k(0.6, p="dada+0.12*depan"),
    k(0.85),
], L=_cm([
    k(0, p="dagu+0.10*depan+0.04*bawah", a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
    k(0.2),
    k(0.6, p="dada+0.12*depan"),
    k(0.85),
]), kepala=[(0.2, 0, 0, 0), (0.6, 12, 0, 0), (0.85, 4, 0, 0)],
  cara="Dua telapak dirapatkan di depan dagu lalu turun ke dada sambil menunduk; ucapkan 'ibadah' tanpa suara.", ragu=True)

S("B15_HORMAT", "Hormat / menghormati", "Agama", [
    k(0, p="dada_kanan+0.05*depan", a="telapak", b="FLAT", j="atas+0.5*dalam", tp="belakang"),
    k(0.2),
    k(0.65, p="netral+0.18*depan", j="depan+0.3*dalam", tp="atas+0.3*dalam"),
    k(0.9),
], kepala=[(0.2, 0, 0, 0), (0.6, 10, 0, 0), (0.9, 2, 0, 0)], wajah="senang",
  cara="Telapak di dada lalu diulurkan ke depan dengan telapak ke atas sambil sedikit menunduk — memberi hormat.", ragu=True)

S("B15_TUHAN", "Tuhan", "Agama", [
    k(0, p="bahu_kanan+0.10*depan+0.12*atas", a="telunjuk", b="1", j="atas", tp="depan+0.4*dalam"),
    k(0.2),
    k(0.6, p="bahu_kanan+0.10*depan+0.34*atas"),
    k(0.85),
], kepala=[(0.2, 0, 0, 0), (0.6, -10, 0, 0)],
  cara="Telunjuk menunjuk ke atas dan naik tinggi, pandangan ikut ke atas; ucapkan 'Tuhan' tanpa suara.", ragu=True)

# ── Berita, politik, ekonomi ──────────────────────────────────────────────

S("B15_POLITIK", "Politik", "Berita", [], gloss="POLITIK",
  cara="Umumnya dieja jari P-O-L-I-T-I-K sambil mengucapkan 'politik'; tanyakan isyarat lokal ke pengajar Tuli.", ragu=True)

S("B15_EKONOMI", "Ekonomi", "Berita",
  lingkar(0, 0.85, "netral+0.16*depan+0.06*atas", 0.035, "luar", "atas", n=8, mulai=90, putaran=1,
          a="jempol", b="BABY_O", j="atas+0.3*depan", tp="dalam+0.3*atas") + [k(1.0)],
  L=_cm(lingkar(0, 0.85, "netral+0.16*depan+0.06*atas", 0.035, "luar", "atas", n=8, mulai=270, putaran=1,
                   a="jempol", b="BABY_O", j="atas+0.3*depan", tp="dalam+0.3*atas") + [k(1.0)]),
  cara="Dua tangan seperti memegang uang (ibu jari menggesek telunjuk) berputar bergantian — uang yang beredar.", ragu=True)

_RINGKAS = [
    k(0, p=A(-0.16, -0.38, 1.26), a="telapak", b="5", j="depan+0.4*atas", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.03, -0.38, 1.26), b="S"),
    k(0.85),
]
S("B15_RINGKAS", "Meringkas / ringkasan", "Berita", **_sym(_RINGKAS),
  cara="Dua tangan terbuka lebar mendekat ke tengah sambil mengepal — isi yang banyak dipadatkan.", ragu=True)

# ── Lingkungan ────────────────────────────────────────────────────────────

S("B15_IKLIM", "Iklim / cuaca jangka panjang", "Lingkungan", [], gloss="IKLIM",
  cara="Sering dieja jari I-K-L-I-M sambil mengucapkan 'iklim'; tanyakan isyarat lokal ke pengajar Tuli.", ragu=True)

S("B15_POLUSI", "Polusi / asap kotor", "Lingkungan", [
    k(0, p="netral+0.04*depan+0.04*bawah", a="ujung", b="CLAW", j="atas", tp="dalam"),
    *bolak(0.12, 0.12, 4, {"b": "5", "p": "netral+0.06*depan+0.10*atas"}, {"b": "CLAW", "p": "dagu+0.12*depan+0.04*bawah"}),
    k(0.7, p="dagu+0.17*depan+0.04*luar", b="5", j="atas+0.3*dalam", tp="belakang"),
    k(0.95),
], kepala=[(0.5, 0, 0, 0), (0.75, -4, 10, 0)], wajah="sedih",
  cara="Jari bergerak-gerak naik dari bawah seperti asap menuju hidung, wajah tidak nyaman.", ragu=True)

_DAUR = lingkar(0, 0.9, A(-0.03, -0.38, 1.26), 0.05, "dalam", "atas", n=10, mulai=180, putaran=1,
                a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah+0.4*dalam") + [k(1.05)]
_DAUR_L = _cm(lingkar(0, 0.9, A(-0.03, -0.38, 1.26), 0.05, "dalam", "atas", n=10, mulai=0, putaran=1,
                         a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah+0.4*dalam") + [k(1.05)])
S("B15_DAUR_ULANG", "Daur ulang", "Lingkungan", _DAUR, L=_DAUR_L, gloss="DAUR-ULANG",
  cara="Dua telunjuk berputar saling mengejar membentuk lingkaran — barang dipakai kembali; ucapkan 'daur ulang'.", ragu=True)

S("B15_LINGKUNGAN", "Lingkungan / sekitar", "Lingkungan",
  lingkar(0, 0.9, A(0.02, -0.38, 1.28), 0.07, "dalam", "depan", n=10, mulai=0, putaran=1,
          a="telapak", b="5", j="depan+0.2*luar", tp="bawah") + [k(1.05)],
  L=[k(0, p=A(0.03, -0.38, 1.24), a="telunjuk", b="1", j="atas", tp="dalam")],
  cara="Telunjuk kiri tegak (diri kita); tangan kanan terbuka berputar mengelilinginya — semua yang ada di sekitar.", ragu=True)

S("B15_PLASTIK", "Plastik", "Lingkungan", [
    k(0, p="netral+0.14*depan+0.06*atas", a="jempol", b="BABY_O", j="atas+0.3*depan", tp="dalam"),
    *bolak(0.12, 0.12, 4, {"b": "O"}, {"b": "BABY_O"}),
    k(0.6, p="netral+0.14*depan+0.06*atas+0.06*luar", b="BABY_O"),
    k(0.85),
], L=_cm([
    k(0, p="netral+0.14*depan+0.06*atas", a="jempol", b="BABY_O", j="atas+0.3*depan", tp="dalam"),
    *bolak(0.12, 0.12, 4, {"b": "O"}, {"b": "BABY_O"}),
    k(0.6, p="netral+0.14*depan+0.06*atas+0.06*luar", b="BABY_O"),
    k(0.85),
]), cara="Dua tangan mencubit seperti meremas lembaran tipis lalu menariknya — bahan plastik; ucapkan 'plastik'.", ragu=True)

# ── Pendidikan & teknologi ────────────────────────────────────────────────

S("B15_SLB", "SLB (Sekolah Luar Biasa)", "Pendidikan", [], gloss="SLB",
  cara="Umumnya dieja jari S-L-B.", ragu=True)

S("B15_INKLUSI", "Inklusi / sekolah inklusi (semua ikut)", "Pendidikan", [
    k(0, p=A(-0.08, -0.40, 1.30), a="ujung", b="FLAT_O", j="bawah+0.6*dalam+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.55, p=A(0.02, -0.37, 1.27), j="bawah+0.4*dalam+0.3*depan", tp="dalam"),
    k(0.8),
], L=[k(0, p=A(0.03, -0.37, 1.22), a="telapak", b="C", j="dalam+0.4*depan", tp="dalam+0.6*atas")],
  cara="Ujung jari kanan yang kuncup dimasukkan ke dalam tangan C kiri — semua orang ikut masuk ke kelompok yang sama.",
  ragu=True)

_DIDIK = [
    k(0, p=A(-0.05, -0.40, 1.28), a="telapak", b="FLAT", j="atas+0.3*depan", tp="belakang+0.6*dalam"),
    k(0.15),
    k(0.35, p=A(-0.05, -0.43, 1.31)),
    k(0.55, p=A(-0.05, -0.40, 1.28)),
    k(0.75, p=A(-0.05, -0.43, 1.31)),
    k(0.9),
]
S("B15_PENDIDIKAN", "Pendidikan", "Pendidikan", **_sym(_DIDIK),
  cara="Dua telapak menghadap diri seperti buku terbuka, digerakkan maju dua kali; ucapkan 'pendidikan' tanpa suara.", ragu=True)

S("B15_TEKNOLOGI", "Teknologi", "Teknologi", [
    k(0, p=A(-0.03, -0.38, 1.26), a="telapak", b="5", j="dalam+0.3*depan", tp="belakang+0.5*dalam"),
    *bolak(0.12, 0.13, 4, {"putar": 25}, {"putar": -25}),
    k(0.7, putar=0),
], L=_cm([
    k(0, p=A(-0.03, -0.38, 1.26), a="telapak", b="5", j="dalam+0.3*depan", tp="belakang+0.5*dalam"),
    *bolak(0.12, 0.13, 4, {"putar": -25}, {"putar": 25}),
    k(0.7, putar=0),
]), cara="Jari dua tangan saling bertaut seperti roda gigi, diputar bergantian — mesin yang bekerja; banyak orang juga mengeja.",
  ragu=True)

S("B15_CAPTION", "Caption / teks di layar", "Teknologi", [
    k(0, p=_LAYAR + A(-0.025, -0.01, -0.06), a="telunjuk", b="1", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.4, p=_LAYAR + A(-0.11, -0.01, -0.06)),
    k(0.5, p=_LAYAR + A(-0.025, -0.01, -0.06)),
    k(0.75, p=_LAYAR + A(-0.11, -0.01, -0.06)),
    k(0.9),
], L=_L_LAYAR,
  cara="Tangan kiri tegak sebagai layar; telunjuk kanan menyapu mendatar di bagian bawahnya dua kali — baris teks di bawah video.",
  ragu=True)

S("B15_APLIKASI", "Aplikasi (di HP)", "Teknologi", [
    k(0, p=_HP + A(-0.01, -0.06, 0.03), a="ujung", b="1", j="depan+0.5*bawah+0.3*dalam", tp="bawah"),
    k(0.15, p=_HP + A(-0.01, -0.025, 0.012)),
    k(0.3, p=_HP + A(-0.02, -0.06, 0.04)),
    k(0.45, p=_HP + A(-0.02, -0.035, 0.02)),
    k(0.7),
], L=[k(0, p=_HP, a="telapak", b="FLAT", j="depan+0.6*atas+0.3*dalam", tp="atas+0.6*belakang")],
  cara="Tangan kiri seperti memegang HP; telunjuk kanan mengetuk dua ikon di layarnya; ucapkan 'aplikasi'.", ragu=True)

# ── Alat bantu dengar & implan ────────────────────────────────────────────

S("B15_ABD", "Alat bantu dengar (ABD)", "Teknologi", [
    k(0, p="telinga+0.03*luar+0.05*atas", a="jari_telunjuk", b="B15_KAIT", j="atas+0.4*belakang", tp="dalam"),
    k(0.15),
    k(0.4, p="telinga+0.02*luar+0.02*atas"),
    k(0.55, p="telinga+0.03*luar+0.05*atas"),
    k(0.7, p="telinga+0.02*luar+0.02*atas"),
    k(0.9),
], cara="Telunjuk ditekuk seperti kait lalu disentuhkan di belakang daun telinga dua kali — alat yang dipasang di telinga.",
  ragu=True)

S("B15_IMPLAN", "Implan koklea", "Teknologi", [
    k(0, p="telinga+0.04*luar+0.03*atas+0.01*belakang", a="ujung", b="B15_V_TEKUK", j="dalam+0.3*bawah", tp="dalam"),
    k(0.15, p="telinga+0.02*luar+0.03*atas+0.01*belakang"),
    k(0.3, p="telinga+0.05*luar+0.03*atas+0.01*belakang"),
    k(0.45, p="telinga+0.02*luar+0.03*atas+0.01*belakang"),
    k(0.7),
], cara="Dua jari ditekuk ditempelkan di kepala di atas-belakang telinga, dua kali — letak magnet implan; ucapkan 'implan'.",
  ragu=True)

# ── Kata Kolok, komunitas, kampanye ──────────────────────────────────────

S("B15_KOLOK", "Kolok (dalam 'Kata Kolok')", "Komunitas", [], gloss="KOLOK",
  cara="Dieja jari K-O-L-O-K, biasanya setelah isyarat KATA; tanyakan ke pengajar Tuli apakah ada isyarat khususnya.",
  ragu=True)

S("B15_KAMPANYE", "Kampanye / gerakan mengajak", "Komunitas", [
    k(0, p="bahu_kanan+0.10*depan+0.06*atas", a="telapak", b="S", j="atas", tp="depan+0.3*dalam"),
    k(0.15),
    k(0.32, p="bahu_kanan+0.10*depan+0.20*atas"),
    k(0.48, p="bahu_kanan+0.10*depan+0.08*atas"),
    k(0.64, p="bahu_kanan+0.10*depan+0.20*atas"),
    k(0.9),
], wajah="senang",
  cara="Kepalan diangkat dan didorong ke atas dua kali dengan semangat — mengajak orang lain ikut bergerak.", ragu=True)

_KELOMPOK = lingkar(0, 0.85, A(-0.05, -0.40, 1.24), 0.06, "luar", "depan", n=8, mulai=180, putaran=0.5,
                    a="telapak", b="C", j="depan+0.3*dalam", tp="dalam") + [k(1.0)]
S("B15_KELOMPOK", "Kelompok", "Komunitas", **_sym(_KELOMPOK),
  cara="Dua tangan C bertemu di depan lalu melingkar ke belakang dan bertemu lagi dekat badan — menggambar satu lingkaran orang.",
  ragu=True)

_TEPUK = [
    k(0, p="bahu_kanan+0.12*depan+0.16*atas+0.02*luar", a="telapak", b="5", j="atas", tp="depan"),
    *bolak(0.1, 0.1, 7, {"putar": 40}, {"putar": -40}),
    k(0.85, putar=0),
]
S("B15_TEPUK_TULI", "Tepuk tangan Tuli (tepuk visual)", "Komunitas", **_sym(_TEPUK), wajah="senang", gloss="TEPUK-TANGAN",
  cara="Dua tangan 5 diangkat setinggi kepala lalu diputar-putar di pergelangan — tepuk tangan yang bisa dilihat.")

# ── Seni & presentasi ─────────────────────────────────────────────────────

S("B15_PENONTON", "Penonton / hadirin", "Seni", [
    k(0, p=A(-0.10, -0.42, 1.22), a="ujung", b="B23_V_TEKUK", j="depan+0.2*dalam", tp="bawah"),
    *bolak(0.12, 0.12, 4, {"p": A(-0.08, -0.44, 1.23)}, {"p": A(-0.10, -0.42, 1.22)}),
    k(0.7),
], L=_cm([
    k(0, p=A(-0.10, -0.42, 1.22), a="ujung", b="B23_V_TEKUK", j="depan+0.2*dalam", tp="bawah"),
    *bolak(0.12, 0.12, 4, {"p": A(-0.10, -0.42, 1.22)}, {"p": A(-0.08, -0.44, 1.23)}),
    k(0.7),
]), cara="Dua tangan V ditekuk (barisan orang yang duduk) bergerak-gerak kecil menghadap ke depan — banyak orang menonton.",
  ragu=True)

S("B15_RITME", "Ritme / irama", "Seni", [
    k(0, p="netral+0.10*atas+0.08*depan+0.06*dalam", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.18, p="netral+0.03*atas+0.08*depan+0.02*dalam"),
    k(0.36, p="netral+0.10*atas+0.08*depan+-0.02*dalam"),
    k(0.54, p="netral+0.03*atas+0.08*depan+0.06*luar"),
    k(0.72, p="netral+0.10*atas+0.08*depan+0.10*luar"),
    k(0.9),
], cara="Tangan datar memantul naik-turun teratur sambil bergeser ke samping — ketukan yang berulang.", ragu=True)

_PRESENT = [
    k(0, p="dada+0.07*depan+0.02*luar", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas+0.3*dalam"),
    k(0.15),
    k(0.55, p="netral+0.20*depan+0.06*luar"),
    k(0.85),
]
S("B15_PRESENTASI", "Presentasi", "Seni", **_sym(_PRESENT),
  cara="Dua telapak menghadap atas dari depan dada didorong ke depan — menyajikan sesuatu kepada penonton.", ragu=True)

S("B15_PERAN", "Peran / ganti tokoh (role shift)", "Seni", [
    k(0, p="dada_kanan+0.05*depan", a="telapak", b="FLAT", j="atas+0.6*dalam", tp="belakang"),
    k(0.15),
    k(0.45, p="dada_kiri+0.05*depan"),
    k(0.85),
], kepala=[(0.1, 0, 0, 0), (0.45, 0, -15, 0), (0.6, 0, 15, 0), (0.85, 0, 0, 0)],
  cara="Telapak menyapu di depan dada sementara bahu & kepala berpaling ke kiri lalu ke kanan — berganti menjadi tokoh lain.",
  ragu=True)
