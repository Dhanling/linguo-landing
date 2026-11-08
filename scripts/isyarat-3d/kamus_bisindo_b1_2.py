# [isyarat-b1b2-v1] Kamus isyarat BISINDO B1.2 "Bercerita dengan Peran Tokoh".
# Tangan dominan kanan. Format sama dengan kamus_bisindo.py.
# ⚠️ Rujukan daring kosakata BISINDO B1 (watak, penampilan, cerita rakyat) sangat sedikit;
#    bentuk di sini ditulis dari prinsip ikonik umum BISINDO + gerak bibir dan DITANDAI
#    ragu=True — WAJIB dicek pengajar Tuli (variasi daerah besar). Bentuk ASL sengaja
#    TIDAK disalin. Isyarat pantomim murni (KETUK, TABRAK) tidak ditandai ragu.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I


def _sym(keys):
    return dict(R=keys, L=cermin(keys))


# telapak kiri datar menghadap atas di depan badan (alas)
_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
# telapak kiri tegak menghadap kanan (dinding / pintu)
_DINDING = A(0.03, -0.38, 1.28)
_L_DINDING = [k(0, p=_DINDING, a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam")]

# ── Peran tokoh & bercerita ────────────────────────────────────────────────

_PERAN = [
    k(0, p=A(-0.07, -0.32, 1.30), a="telapak", b="FLAT", j="atas", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.55, p=A(-0.14, -0.33, 1.30)),
    k(0.85),
]
S("B12_PERAN", "Peran / memerankan tokoh", "Peran tokoh", R=_PERAN,
  L=[{**kk, "p": kk["p"] + A(0.14, 0, 0)} if "p" in kk else kk for kk in _PERAN],
  kepala=[(0.15, 0, 0, 0), (0.55, 0, -14, 0), (0.85, 0, -14, 0)], gloss="PERAN", ragu=True,
  cara="Dua telapak menghadap badan bergeser bersama ke satu sisi sementara kepala dan bahu ikut berputar — 'menjadi' tokoh di sisi itu.")

S("B12_DALAM_HATI", "Dalam hati (pikiran tokoh)", "Peran tokoh", [
    k(0, p="dada_kiri+0.03*depan", a="telunjuk", b="1", j="atas+0.3*dalam", tp="belakang"),
    *lingkar(0.12, 0.7, "dada_kiri+0.03*depan", 0.02, "dalam", "atas", n=8, mulai=0, putaran=1.5),
    k(0.9),
], wajah="tidur", gloss="DALAM-HATI", ragu=True,
  cara="Telunjuk berputar kecil di dada kiri (hati), mata agak menyipit seperti berbicara pada diri sendiri.")

S("B12_RINGKAS", "Ringkas / meringkas", "Bercerita", [
    k(0, p=A(-0.14, -0.38, 1.26), a="telapak", b="5", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.05, -0.38, 1.26), b="S"),
    k(0.85),
], L=cermin([
    k(0, p=A(-0.14, -0.38, 1.26), a="telapak", b="5", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.05, -0.38, 1.26), b="S"),
    k(0.85),
]), gloss="RINGKAS", ragu=True,
  cara="Dua tangan terbuka lebar saling mendekat sambil mengepal — cerita panjang dipadatkan.")

S("B12_SARAN", "Saran / menyarankan", "Umpan balik", [
    k(0, p="dagu+0.06*depan+0.02*bawah", a="ujung", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p="netral+0.10*atas+0.14*depan", a="telapak", j="depan+0.3*dalam", tp="atas"),
    k(0.85),
], wajah="senang", gloss="SARAN", ragu=True,
  cara="Ujung jari dari dagu bergerak maju lalu telapak terbuka ke atas — menyodorkan usul dengan sopan; ucapkan 'saran'.")

S("B12_PERBAIKI", "Memperbaiki", "Umpan balik", [
    k(0, p=A(-0.05, -0.38, 1.24), a="telapak", b="S", j="depan+0.3*dalam", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"putar": 40}, {"putar": -10}),
    k(0.8, putar=0),
], L=cermin([
    k(0, p=A(-0.05, -0.38, 1.24), a="telapak", b="S", j="depan+0.3*dalam", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"putar": -10}, {"putar": 40}),
    k(0.8, putar=0),
]), gloss="PERBAIKI", ragu=True,
  cara="Dua kepalan berdekatan diputar bergantian seperti memutar baut — membetulkan sesuatu.")

# ── Watak & sifat ──────────────────────────────────────────────────────────

S("B12_SOMBONG", "Sombong", "Watak", [
    k(0, p="hidung+0.02*depan", a="telunjuk", b="1", j="atas+0.4*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="hidung+0.12*depan+0.06*atas"),
    k(0.85),
], kepala=[(0.15, 0, 0, 0), (0.5, -10, 0, 0), (0.85, -10, 0, 0)], gloss="SOMBONG", ragu=True,
  cara="Telunjuk dari ujung hidung bergerak maju-naik ('hidung tinggi'), dagu terangkat dan wajah meremehkan.")

S("B12_RAMAH", "Ramah", "Watak", [
    k(0, p="pipi+0.08*depan+0.04*luar", a="telapak", b="5", j="atas", tp="belakang+0.4*dalam"),
    *lingkar(0.12, 0.75, "pipi+0.10*depan+0.06*luar", 0.03, "luar", "atas", n=8, mulai=0, putaran=1),
    k(0.9),
], wajah="senang", gloss="RAMAH", ragu=True,
  cara="Telapak terbuka di samping wajah berputar kecil sementara wajah tersenyum lebar.")

S("B12_MALU", "Malu", "Watak", [
    k(0, p="pipi+0.012*depan+0.02*atas", a="telapak", b="FLAT", j="atas+0.2*dalam", tp="dalam"),
    k(0.2),
    k(0.6, p="pipi+0.012*depan+0.04*bawah"),
    k(0.85),
], kepala=[(0.1, 0, 0, 0), (0.45, 14, 8, 0), (0.85, 14, 8, 0)], wajah="sedih", gloss="MALU", ragu=True,
  cara="Telapak mengusap pipi ke bawah sementara kepala menunduk dan berpaling sedikit.")

S("B12_BERANI", "Berani", "Watak", [
    k(0, p="dada+0.10*depan", a="telapak", b="S", j="dalam+0.3*atas", tp="belakang"),
    k(0.15),
    k(0.3, p="dada+0.02*depan"),
    k(0.45, p="dada+0.10*depan"),
    k(0.6, p="dada+0.02*depan"),
    k(0.85),
], kepala=[(0.1, 0, 0, 0), (0.4, -6, 0, 0)], gloss="BERANI", ragu=True,
  cara="Kepalan menepuk dada dua kali dengan mantap, dagu sedikit terangkat — 'aku siap'.")

S("B12_RAJIN", "Rajin", "Watak", [
    k(0, p=A(-0.05, -0.36, 1.24), a="telapak", b="S", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.1, 6, {"p": A(-0.05, -0.36, 1.21)}, {"p": A(-0.05, -0.36, 1.25)}),
    k(0.8),
], L=cermin([
    k(0, p=A(-0.05, -0.36, 1.21), a="telapak", b="S", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.1, 6, {"p": A(-0.05, -0.36, 1.25)}, {"p": A(-0.05, -0.36, 1.21)}),
    k(0.8),
]), wajah="senang", gloss="RAJIN", ragu=True,
  cara="Dua kepalan bergantian naik-turun dengan cepat seperti bekerja tanpa henti, wajah bersemangat.")

S("B12_MALAS", "Malas", "Watak", [
    k(0, p="dada_kanan+0.10*depan+0.04*atas", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.2),
    k(0.7, p="perut+0.10*depan+0.06*luar", b="SANTAI", j="bawah+0.4*depan", tp="belakang"),
    k(0.95),
], kepala=[(0.2, 0, 0, 0), (0.7, 6, 0, 8)], wajah="tidur", gloss="MALAS", ragu=True,
  cara="Tangan terangkat lalu jatuh lunglai pelan, kepala miring dan mata setengah tertutup.")

# ── Penampilan ─────────────────────────────────────────────────────────────

S("B12_KERITING", "Keriting", "Penampilan",
  [k(0, p="telinga+0.07*luar+0.04*depan", a="telunjuk", b="1", j="atas+0.3*depan", tp="dalam")] +
  lingkar(0.12, 0.8, "telinga+0.07*luar+0.04*depan+0.03*bawah", 0.025, "depan", "atas", n=12, mulai=90, putaran=3) + [k(0.95)],
  gloss="KERITING", ragu=True,
  cara="Telunjuk berputar-putar kecil sambil turun di samping kepala seperti ikal rambut.")

_GEMUK = [
    k(0, p="pipi+0.03*depan+0.01*luar", a="telapak", b="C", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.55, p="pipi+0.06*depan+0.12*luar"),
    k(0.85),
]
S("B12_GEMUK", "Gemuk", "Penampilan", **_sym(_GEMUK), wajah="ya_tidak", gloss="GEMUK", ragu=True,
  cara="Dua tangan C di samping pipi bergerak menjauh ke samping, pipi menggembung.")

_KURUS = [
    k(0, p="pipi+0.012*depan+0.02*atas", a="telapak", b="FLAT", j="atas", tp="dalam"),
    k(0.15),
    k(0.55, p="rahang+0.012*depan+0.02*dalam"),
    k(0.85),
]
S("B12_KURUS", "Kurus", "Penampilan", **_sym(_KURUS), gloss="KURUS", ragu=True,
  cara="Dua telapak menyusuri pipi ke bawah sambil sedikit menyempit, pipi dikempiskan.")

S("B12_CANTIK", "Cantik", "Penampilan", [
    k(0, p="pipi+0.12*depan+0.10*luar", a="telapak", b="5", j="atas+0.2*dalam", tp="dalam+0.5*belakang"),
    k(0.15),
    k(0.55, p="dagu+0.12*depan+0.06*luar", b="FLAT_O", j="atas+0.4*depan", tp="belakang"),
    k(0.85),
], wajah="senang", gloss="CANTIK", ragu=True,
  cara="Telapak terbuka di samping wajah turun ke arah dagu sambil menguncup — wajah yang elok; ucapkan 'cantik'.")

S("B12_GANTENG", "Ganteng / tampan", "Penampilan", [
    k(0, p="rahang+0.02*depan", a="jempol", b="10", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.5, p="dagu+0.03*depan"),
    k(0.85),
], wajah="senang", gloss="GANTENG", ragu=True,
  cara="Ibu jari tegak menyusuri rahang menuju dagu, wajah percaya diri; ucapkan 'ganteng'.")

_KUMIS = [
    k(0, p="mulut+0.02*depan+0.03*atas+0.005*luar", a="jari_telunjuk", b="G", j="dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="mulut+0.02*depan+0.03*atas+0.05*luar"),
    k(0.85),
]
S("B12_KUMIS", "Kumis", "Penampilan", **_sym(_KUMIS), gloss="KUMIS", ragu=True,
  cara="Ibu jari & telunjuk dua tangan menyusuri bagian atas bibir dari tengah ke samping seperti merapikan kumis.")

S("B12_TAS", "Tas", "Penampilan", [
    k(0, p="bahu_kanan+0.04*depan+0.02*atas", a="telapak", b="S", j="dalam", tp="belakang"),
    k(0.15),
    k(0.4, p="bahu_kanan+0.04*depan+0.05*bawah"),
    k(0.55, p="bahu_kanan+0.04*depan+0.02*atas"),
    k(0.7, p="bahu_kanan+0.04*depan+0.05*bawah"),
    k(0.9),
], gloss="TAS", ragu=True,
  cara="Kepalan menggenggam tali tas di bahu kanan dan menariknya ke bawah dua kali.")

_KALUNG = [
    k(0, p="leher+0.03*depan+0.05*luar", a="telunjuk", b="1", j="bawah+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p="dada+0.04*depan+0.06*atas+0.01*luar"),
    k(0.85),
]
S("B12_KALUNG", "Kalung", "Penampilan", **_sym(_KALUNG), gloss="KALUNG", ragu=True,
  cara="Dua telunjuk dari sisi leher menyusuri ke bawah bertemu di tengah dada seperti rantai kalung.")

S("B12_MENCARI", "Mencari", "Penampilan", [
    k(0, p="dahi+0.06*depan+0.03*luar", a="sisi_telunjuk", b="FLAT", j="dalam+0.2*depan", tp="bawah"),
    k(0.15),
    k(0.9),
], kepala=[(0.1, 0, 0, 0), (0.3, 0, -18, 0), (0.55, 0, 18, 0), (0.8, 0, -10, 0), (0.95, 0, 0, 0)], wajah="wh",
  gloss="MENCARI", ragu=True,
  cara="Telapak di atas mata seperti meneduhi, kepala menoleh ke kanan dan kiri mencari-cari, alis berkerut.")

# ── Perasaan bernuansa ─────────────────────────────────────────────────────

S("B12_CEMAS", "Cemas / khawatir", "Perasaan", [
    k(0, p="dada+0.08*depan+0.03*luar", a="telapak", b="5", j="dalam+0.3*atas", tp="belakang"),
    *bolak(0.12, 0.1, 7, {"b": "CLAW"}, {"b": "5"}),
    k(0.9),
], L=cermin([k(0, p="dada+0.08*depan+0.03*luar", a="telapak", b="5", j="dalam+0.3*atas", tp="belakang"),
             *bolak(0.12, 0.1, 7, {"b": "5"}, {"b": "CLAW"}), k(0.9)]),
  wajah="sedih", gloss="CEMAS", ragu=True,
  cara="Dua tangan di depan dada, jari-jari bergerak gelisah bergantian, alis berkerut cemas.")

S("B12_LEGA", "Lega", "Perasaan", [
    k(0, p="dada+0.04*depan+0.04*atas", a="telapak", b="FLAT", j="dalam+0.2*atas", tp="belakang"),
    k(0.2),
    k(0.7, p="perut+0.06*depan"),
    k(0.95),
], kepala=[(0.2, -4, 0, 0), (0.7, 6, 0, 0)], wajah="senang", gloss="LEGA", ragu=True,
  cara="Telapak di dada turun perlahan ke perut seperti menghembuskan napas panjang, bahu turun dan wajah lega.")

_TEGANG = [
    k(0, p=A(-0.08, -0.34, 1.30), a="telapak", b="CLAW", j="atas+0.3*depan", tp="depan"),
    *bolak(0.12, 0.08, 8, {"p": A(-0.085, -0.34, 1.30)}, {"p": A(-0.075, -0.34, 1.30)}),
    k(0.85),
]
S("B12_TEGANG", "Tegang", "Perasaan", **_sym(_TEGANG), wajah="ya_tidak", gloss="TEGANG", ragu=True,
  cara="Dua tangan cakar kaku di depan dada bergetar sedikit, mata melebar dan rahang mengeras.")

S("B12_MENANGIS", "Menangis", "Perasaan", [
    k(0, p="mata+0.02*depan+0.03*bawah", a="telunjuk", b="1", j="dalam+0.6*atas", tp="belakang"),
    k(0.15),
    k(0.45, p="pipi+0.02*depan+0.06*bawah"),
    k(0.55, p="mata+0.02*depan+0.03*bawah"),
    k(0.85, p="pipi+0.02*depan+0.06*bawah"),
    k(1.0),
], L=cermin([
    k(0, p="mata+0.02*depan+0.03*bawah", a="telunjuk", b="1", j="dalam+0.6*atas", tp="belakang"),
    k(0.15),
    k(0.45, p="pipi+0.02*depan+0.06*bawah"),
    k(0.55, p="mata+0.02*depan+0.03*bawah"),
    k(0.85, p="pipi+0.02*depan+0.06*bawah"),
    k(1.0),
]), wajah="sedih", gloss="MENANGIS", ragu=True,
  cara="Dua telunjuk dari bawah mata menyusuri pipi ke bawah berulang seperti air mata mengalir.")

# ── Ketegangan & kejutan ───────────────────────────────────────────────────

S("B12_GELAP", "Gelap", "Suasana", [
    k(0, p=A(-0.16, -0.30, 1.44), a="telapak", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p=A(-0.02, -0.28, 1.40), j="atas+0.6*dalam"),
    k(0.85),
], L=cermin([
    k(0, p=A(-0.16, -0.30, 1.44), a="telapak", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p=A(-0.02, -0.29, 1.36), j="atas+0.6*dalam"),
    k(0.85),
]), wajah="tidur", gloss="GELAP", ragu=True,
  cara="Dua telapak dari samping bergerak menyilang di depan mata seperti tirai menutup cahaya.")

S("B12_KETUK", "Mengetuk (pintu)", "Suasana", [
    k(0, p=_DINDING + A(-0.05, -0.02, 0.0), a="buku", b="A", j="dalam+0.3*depan", tp="belakang"),
    k(0.12),
    k(0.22, p=_DINDING + A(-0.02, -0.01, 0.0)),
    k(0.32, p=_DINDING + A(-0.06, -0.02, 0.0)),
    k(0.42, p=_DINDING + A(-0.02, -0.01, 0.0)),
    k(0.52, p=_DINDING + A(-0.06, -0.02, 0.0)),
    k(0.62, p=_DINDING + A(-0.02, -0.01, 0.0)),
    k(0.85),
], L=_L_DINDING, gloss="KETUK",
  cara="Buku jari kepalan kanan mengetuk telapak kiri yang tegak (pintu) tiga kali.")

S("B12_MENGINTIP", "Mengintip", "Suasana", [
    k(0, p=_DINDING + A(-0.06, 0.03, 0.14), a="ujung", b="V", j="dalam+0.4*depan", tp="bawah"),
    k(0.2),
    k(0.55, p=_DINDING + A(0.02, -0.02, 0.14)),
    k(0.75),
    k(0.95, p=_DINDING + A(-0.06, 0.03, 0.14)),
], L=[k(0, p=_DINDING + A(0, 0, 0.04), a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam")],
  kepala=[(0.2, 0, 0, 0), (0.55, 0, 10, 6), (0.95, 0, 0, 0)], wajah="ya_tidak", gloss="MENGINTIP", ragu=True,
  cara="Jari V (mata) muncul pelan dari balik telapak kiri yang tegak (dinding), lalu bersembunyi lagi; kepala ikut condong.")

S("B12_TABRAK", "Menabrak / bertabrakan", "Suasana", [
    k(0, p=_DINDING + A(-0.16, -0.02, -0.02), a="buku", b="S", j="dalam+0.3*depan", tp="belakang"),
    k(0.12),
    k(0.3, p=_DINDING + A(-0.035, -0.01, -0.02)),
    k(0.45, p=_DINDING + A(-0.05, -0.02, 0.0)),
    k(0.8),
], L=_L_DINDING, wajah="ya_tidak", gloss="TABRAK",
  cara="Kepalan kanan meluncur cepat dan membentur telapak kiri yang tegak, wajah kaget.")

# ── Cerita rakyat & alam ───────────────────────────────────────────────────

_RAJA = [
    k(0, p="dahi+0.06*atas+0.06*luar+0.02*depan", a="ujung", b="CLAW", j="atas", tp="dalam"),
    k(0.15),
    k(0.55, p="dahi+0.12*atas+0.06*luar+0.02*depan"),
    k(0.85),
]
S("B12_RAJA", "Raja", "Cerita rakyat", **_sym(_RAJA), kepala=[(0.15, 0, 0, 0), (0.55, -6, 0, 0)], gloss="RAJA", ragu=True,
  cara="Dua tangan cakar di atas kepala seperti mengenakan mahkota, dagu agak terangkat.")

S("B12_PUTRI", "Putri", "Cerita rakyat", [
    k(0, p="pelipis+0.05*luar+0.06*atas", a="ujung", b="FLAT_O", j="atas+0.3*belakang", tp="dalam"),
    k(0.15),
    k(0.45, p="pelipis+0.06*luar+0.10*atas", b="5"),
    k(0.75, p="pipi+0.06*luar+0.04*bawah", b="FLAT", j="bawah", tp="dalam"),
    k(1.0),
], wajah="senang", gloss="PUTRI", ragu=True,
  cara="Jari kuncup di atas samping kepala mekar seperti hiasan rambut, lalu turun menyusuri rambut panjang; ucapkan 'putri'.")

_HUTAN = [
    k(0, p=A(-0.06, -0.38, 1.24), a="pergelangan", b="5", j="atas", tp="depan"),
    k(0.15),
    k(0.35, p=A(-0.10, -0.38, 1.28)),
    k(0.55, p=A(-0.14, -0.38, 1.24)),
    k(0.75, p=A(-0.18, -0.38, 1.28)),
    k(0.9),
]
S("B12_HUTAN", "Hutan", "Cerita rakyat", **_sym(_HUTAN), gloss="HUTAN", ragu=True,
  cara="Dua tangan 5 tegak (pohon-pohon) bergerak naik-turun menjauh ke samping — banyak pohon berderet.")

S("B12_SUNGAI", "Sungai", "Cerita rakyat", [
    k(0, p=A(-0.06, -0.28, 1.18), a="telapak", b="FLAT", j="depan", tp="bawah"),
    k(0.12),
    k(0.3, p=A(-0.10, -0.34, 1.18)),
    k(0.5, p=A(-0.02, -0.40, 1.18)),
    k(0.7, p=A(-0.10, -0.46, 1.18)),
    k(0.9, p=A(-0.03, -0.52, 1.18)),
    k(1.05),
], L=cermin([
    k(0, p=A(-0.06, -0.28, 1.18), a="telapak", b="FLAT", j="depan", tp="bawah"),
    k(0.12),
    k(0.3, p=A(-0.10, -0.34, 1.18)),
    k(0.5, p=A(-0.02, -0.40, 1.18)),
    k(0.7, p=A(-0.10, -0.46, 1.18)),
    k(0.9, p=A(-0.03, -0.52, 1.18)),
    k(1.05),
]), gloss="SUNGAI", ragu=True,
  cara="Dua tangan datar sejajar bergerak maju berkelok-kelok seperti aliran sungai; ucapkan 'sungai'.")

S("B12_BUAYA", "Buaya", "Cerita rakyat", [
    k(0, p=A(-0.04, -0.40, 1.26), a="telapak", b="CLAW", j="depan", tp="bawah"),
    k(0.12),
    k(0.3, p=A(-0.04, -0.40, 1.31)),
    k(0.45, p=A(-0.04, -0.40, 1.265)),
    k(0.6, p=A(-0.04, -0.40, 1.31)),
    k(0.75, p=A(-0.04, -0.40, 1.265)),
    k(0.95),
], L=[k(0, p=A(0.0, -0.40, 1.21), a="telapak", b="CLAW", j="depan+0.4*dalam", tp="atas")],
  gloss="BUAYA", ragu=True,
  cara="Dua tangan cakar bertumpuk (rahang atas & bawah); tangan atas membuka-mengatup dua kali seperti mulut buaya.")

S("B12_KANCIL", "Kancil (tokoh cerita)", "Cerita rakyat", [],
  gloss="KANCIL", ragu=True,
  cara="Dieja jari: K-A-N-C-I-L; dalam cerita, sesudah dieja, tokoh kancil sering diberi isyarat nama ikonik (mis. telinga kecil) — tanyakan bentuk lokalnya ke pengajar Tuli.")

S("B12_BATU", "Batu", "Cerita rakyat", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.10), a="buku", b="S", j="dalam+0.3*depan", tp="bawah"),
    k(0.12),
    k(0.25, p=_ALAS + A(-0.01, -0.01, 0.05)),
    k(0.4, p=_ALAS + A(-0.01, -0.01, 0.10)),
    k(0.55, p=_ALAS + A(-0.01, -0.01, 0.05)),
    k(0.8),
], L=[k(0, p=_ALAS + A(0, 0, 0.0), a="punggung", b="S", j="dalam+0.4*depan", tp="atas")],
  gloss="BATU", ragu=True,
  cara="Kepalan kanan mengetuk kepalan kiri dua kali — keras seperti batu; ucapkan 'batu'.")

# ── Humor & perjalanan ─────────────────────────────────────────────────────

S("B12_BERCANDA", "Bercanda", "Humor", [
    k(0, p="netral+0.10*atas+0.04*depan", a="telunjuk", b="1", j="depan+0.4*dalam", tp="bawah"),
    *bolak(0.12, 0.12, 5, {"p": "netral+0.10*atas+0.10*depan+0.02*dalam"}, {"p": "netral+0.10*atas+0.04*depan"}),
    k(0.8),
], L=cermin([
    k(0, p="netral+0.10*atas+0.10*depan+0.02*dalam", a="telunjuk", b="1", j="depan+0.4*dalam", tp="bawah"),
    *bolak(0.12, 0.12, 5, {"p": "netral+0.10*atas+0.04*depan"}, {"p": "netral+0.10*atas+0.10*depan+0.02*dalam"}),
    k(0.8),
]), wajah="senang", gloss="BERCANDA", ragu=True,
  cara="Dua telunjuk bergantian menusuk-nusuk ke depan dengan ringan, wajah usil tersenyum.")

S("B12_SEPEDA", "Sepeda", "Perjalanan",
  [k(0, p=A(-0.07, -0.34, 1.12), a="telapak", b="S", j="depan+0.3*dalam", tp="bawah")] +
  lingkar(0.12, 0.85, A(-0.07, -0.36, 1.12), 0.045, "depan", "atas", n=10, mulai=90, putaran=2) + [k(1.0)],
  L=cermin([k(0, p=A(-0.07, -0.38, 1.12), a="telapak", b="S", j="depan+0.3*dalam", tp="bawah")] +
           lingkar(0.12, 0.85, A(-0.07, -0.36, 1.12), 0.045, "depan", "atas", n=10, mulai=270, putaran=2) + [k(1.0)]),
  gloss="SEPEDA", ragu=True,
  cara="Dua kepalan berputar bergantian di depan badan seperti mengayuh pedal sepeda.")

S("B12_SINGGAH", "Singgah / mampir", "Perjalanan", [
    k(0, p=A(-0.10, -0.28, 1.20), a="telapak", b="FLAT", j="depan", tp="bawah"),
    k(0.12),
    k(0.35, p=A(-0.10, -0.38, 1.20)),
    k(0.42, p=A(-0.10, -0.38, 1.16)),
    k(0.6, p=A(-0.10, -0.38, 1.16)),
    k(0.7, p=A(-0.10, -0.40, 1.20)),
    k(0.9, p=A(-0.10, -0.50, 1.20)),
    k(1.0),
], gloss="SINGGAH", ragu=True,
  cara="Tangan datar (kendaraan) maju, turun dan diam sebentar di satu titik, lalu naik dan melanjutkan perjalanan; ucapkan 'mampir'.")

# ── Kata umum pendukung cerita B1.2 ───────────────────────────────────────

S("B12_LOMPAT", "Melompat", "Gerak", [
    k(0, p=_ALAS + A(0.0, 0.02, 0.03), a="ujung", b="BENT_V", j="bawah+0.2*depan", tp="belakang"),
    k(0.15),
    k(0.4, p=_ALAS + A(-0.04, -0.08, 0.14)),
    k(0.65, p=_ALAS + A(-0.08, -0.17, 0.03)),
    k(0.9),
], L=_L_ALAS, gloss="LOMPAT", ragu=True,
  cara="Dua jari ditekuk (kaki) berdiri di telapak kiri, lalu melompat melengkung ke depan dan mendarat.")

_HILANG = [
    k(0, p=A(-0.03, -0.38, 1.26), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.5, p=A(-0.16, -0.40, 1.22), b="FLAT_O", j="depan+0.4*luar"),
    k(0.8),
]
S("B12_HILANG", "Hilang / lenyap", "Gerak", **_sym(_HILANG), wajah="wh", gloss="HILANG", ragu=True,
  cara="Dua tangan terbuka menghadap bawah berpisah cepat ke samping sambil menguncup — tiba-tiba tidak ada; wajah bingung.")

_BAWA = [
    k(0, p=A(-0.07, -0.30, 1.18), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.65, p=A(-0.15, -0.44, 1.20)),
    k(0.9),
]
S("B12_BAWA", "Membawa", "Gerak", R=_BAWA,
  L=[{**kk, "p": kk["p"] + A(0.14, 0, 0)} if "p" in kk else kk for kk in _BAWA],
  gloss="BAWA", ragu=True,
  cara="Dua telapak menghadap atas seperti menyangga barang, dipindahkan bersama ke depan-samping; ucapkan 'bawa'.")

S("B12_SULIT", "Sulit / susah", "Perasaan", [
    k(0, p="dahi+0.05*depan+0.03*luar", a="buku", b="X", j="dalam", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"putar": 35}, {"putar": -10}),
    k(0.8, putar=0),
], wajah="sedih", gloss="SULIT", ragu=True,
  cara="Telunjuk ditekuk (X) di depan dahi diputar bolak-balik seperti memeras pikiran, alis berkerut; ucapkan 'sulit'.")

S("B12_SENDIRI", "Sendiri / sendirian", "Suasana",
  [k(0, p="dada+0.14*depan+0.06*bawah", a="pergelangan", b="1", j="atas", tp="belakang")] +
  lingkar(0.12, 0.75, "dada+0.14*depan+0.04*bawah", 0.025, "luar", "depan", n=8, mulai=0, putaran=1.5) + [k(0.9)],
  wajah="sedih", gloss="SENDIRI", ragu=True,
  cara="Telunjuk tegak (satu orang) berputar kecil di depan dada — hanya satu orang; ucapkan 'sendiri'.")

S("B12_PINTAR", "Pintar / cerdik", "Watak", [
    k(0, p="pelipis+0.02*depan+0.01*luar", a="telunjuk", b="1", j="atas+0.4*dalam", tp="belakang"),
    k(0.15),
    k(0.45, p="pelipis+0.10*depan+0.10*luar+0.06*atas", j="atas+0.4*luar"),
    k(0.75),
], wajah="senang", gloss="PINTAR", ragu=True,
  cara="Ujung telunjuk menyentuh pelipis lalu dijentikkan ke atas-samping — otak yang cemerlang; ucapkan 'pintar'.")
