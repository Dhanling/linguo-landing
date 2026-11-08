# [isyarat-b1b2-v1] Kamus isyarat BISINDO B2.4 "Puisi, Seni & Budaya Tuli".
# Tangan dominan kanan. Format sama dengan kamus_bisindo.py / kamus_bisindo_a2_4.py.
# ⚠️ Rujukan daring untuk kosakata seni/budaya BISINDO hampir tidak ada; bentuk di sini ditulis
#    dari prinsip ikonik umum BISINDO + gerak bibir dan HAMPIR SEMUA ditandai ragu=True —
#    WAJIB dicek pengajar Tuli (variasi daerah besar). Bentuk ASL sengaja TIDAK disalin.
#    Istilah teknis (metafora, tema, sumber, Isyarat Internasional) dieja jari.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

# telapak kiri datar menghadap atas di depan badan (alas)
_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
# telapak kiri tegak menghadap kanan (dinding / kertas tegak)
_DINDING = A(0.02, -0.36, 1.27)
_L_DINDING = [k(0, p=_DINDING, a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")]
_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"


def _sym(keys):
    return dict(R=keys, L=cermin(keys))


# ── Puisi isyarat ──────────────────────────────────────────────────────────

_RITME_R = [k(0, p=A(-0.09, -0.36, 1.26), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
            *bolak(0.12, 0.12, 6, {"p": A(-0.09, -0.36, 1.20)}, {"p": A(-0.09, -0.36, 1.26)}), k(0.95)]
_RITME_L = [k(0, p=A(-0.09, -0.36, 1.20), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
            *bolak(0.12, 0.12, 6, {"p": A(-0.09, -0.36, 1.26)}, {"p": A(-0.09, -0.36, 1.20)}), k(0.95)]
S("B24_RITME", "Ritme / irama", "Puisi", R=_RITME_R, L=cermin(_RITME_L), gloss="RITME",
  cara="Dua tangan 5 telapak ke bawah naik-turun bergantian dengan tempo teratur, sambil mengucapkan 'ritme'.", ragu=True)

S("B24_BENTUK_TANGAN", "Bentuk tangan (handshape)", "Puisi", [
    k(0, p="netral+0.10*atas+0.04*depan", a="telapak", b="5", j="atas", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.4, putar=-35),
    k(0.6, putar=20),
    k(0.85, b="S", putar=0),
    k(1.0),
], gloss="BENTUK-TANGAN",
  cara="Tangan 5 diangkat di depan wajah dan diputar sedikit sambil dipandangi, lalu mengepal — menunjuk bentuk jari.", ragu=True)

_GERAK = [k(0, p=A(-0.08, -0.37, 1.25), a="telapak", b="5", j="atas+0.3*depan", tp="depan+0.4*dalam"),
          *bolak(0.12, 0.16, 5, {"p": A(-0.13, -0.37, 1.27)}, {"p": A(-0.05, -0.37, 1.23)}), k(0.95)]
S("B24_GERAK", "Gerak / gerakan", "Puisi", **_sym(_GERAK), gloss="GERAK",
  cara="Dua tangan 5 bergoyang bersamaan ke kanan-kiri di depan badan seperti menari.", ragu=True)

_SIMETRI = [k(0, p=A(-0.05, -0.37, 1.18), a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam"),
            k(0.15), k(0.55, p=A(-0.13, -0.37, 1.34)), k(0.85)]
S("B24_SIMETRI", "Simetris / seimbang", "Puisi", **_sym(_SIMETRI), gloss="SIMETRIS",
  cara="Dua telapak berhadapan bergerak serempak naik dan melebar seperti bayangan cermin.", ragu=True)

S("B24_GAMBAR", "Gambar / citra", "Puisi", [
    k(0, p=_DINDING + A(-0.012, -0.01, 0.06), a="ujung", b="1", j="dalam+0.3*depan", tp="bawah"),
    k(0.15, p=_DINDING + A(-0.012, -0.01, 0.05)),
    k(0.35, p=_DINDING + A(-0.012, -0.05, 0.02), kurva=True),
    k(0.5, p=_DINDING + A(-0.012, -0.03, -0.02), kurva=True),
    k(0.7, p=_DINDING + A(-0.012, -0.07, -0.05), kurva=True),
    k(0.9),
], L=_L_DINDING, gloss="GAMBAR",
  cara="Telunjuk kanan menggoreskan garis berkelok di telapak kiri yang tegak seperti menggambar di kertas.", ragu=True)

S("B24_MAKNA", "Makna / arti", "Puisi", [
    k(0, p=_DAHI + "+0.03*depan", a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang"),
    k(0.15, p=_DAHI),
    k(0.3),
    k(0.55, p=_ALAS + A(0, -0.01, 0.025), a="ujung", j="bawah+0.3*depan", tp="belakang"),
    *lingkar(0.6, 0.95, _ALAS + A(0, -0.01, 0.025), 0.018, "luar", "depan", n=6, mulai=0, putaran=1),
    k(1.05),
], L=_L_ALAS, gloss="MAKNA",
  cara="Telunjuk menyentuh pelipis lalu turun memutar kecil di telapak kiri — isi pikiran di balik sesuatu, sambil mengucapkan 'makna'.",
  ragu=True)

S("B24_BERUBAH", "Berubah / menjadi", "Puisi", [
    k(0, p=A(-0.03, -0.37, 1.26), a="telapak", b="S", j="atas+0.3*depan", tp="depan"),
    k(0.15),
    k(0.6, p=A(-0.03, -0.37, 1.24), tp="belakang", putar=180),
    k(0.85),
], L=[k(0, p=A(0.03, -0.37, 1.22), a="telapak", b="S", j="atas+0.3*depan", tp="belakang"),
      k(0.15), k(0.6, p=A(0.03, -0.37, 1.26), tp="depan", putar=-180), k(0.85)],
  gloss="BERUBAH",
  cara="Dua kepalan berdekatan saling bertukar posisi sambil memutar pergelangan — sesuatu berganti rupa.", ragu=True)

S("B24_EKSPRESI", "Ekspresi wajah", "Puisi",
  [k(0, p="pipi+0.10*depan+0.09*luar", a="telapak", b="5", j="atas", tp="belakang+0.4*dalam")] +
  lingkar(0.12, 0.8, "pipi+0.10*depan+0.09*luar", 0.04, "luar", "atas", n=8, mulai=0, putaran=1) + [k(0.95)],
  wajah="senang", gloss="EKSPRESI",
  cara="Tangan 5 menghadap wajah memutar satu kali di depan muka, sambil wajah berganti ekspresi.", ragu=True)

# ── Pertunjukan ────────────────────────────────────────────────────────────

S("B24_TAMPIL", "Tampil / pentas", "Pertunjukan", [
    k(0, p="dada+0.06*depan+0.02*atas", a="telapak", b="FLAT", j="dalam+0.3*depan", tp="atas"),
    k(0.15),
    k(0.6, p="netral+0.20*depan+0.10*luar+0.04*atas", j="depan+0.5*luar"),
    k(0.85),
], wajah="senang", gloss="TAMPIL",
  cara="Telapak menghadap atas bergerak dari dada mengayun ke depan-samping seperti mempersembahkan diri ke penonton.", ragu=True)

_PENONTON = [k(0, p=A(-0.10, -0.42, 1.22), a="ujung", b="CLAW", j="belakang+0.3*atas", tp="bawah"),
             k(0.15), k(0.5, p=A(-0.10, -0.44, 1.20)), k(0.7, p=A(-0.10, -0.42, 1.22)), k(0.9)]
S("B24_PENONTON", "Penonton", "Pertunjukan", **_sym(_PENONTON), gloss="PENONTON",
  cara="Dua tangan cakar di depan, ujung jari menghadap si pengisyarat — barisan kepala orang yang menonton.", ragu=True)

S("B24_CAHAYA", "Cahaya / lampu sorot", "Pertunjukan", [
    k(0, p="netral+0.34*atas+0.06*depan+0.07*luar", a="ujung", b="FLAT_O", j="bawah+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.5, b="5"),
    k(0.85),
], gloss="CAHAYA",
  cara="Jari kuncup di atas kepala lalu membuka ke bawah seperti sinar lampu sorot yang turun.", ragu=True)

S("B24_NASKAH", "Naskah", "Pertunjukan", [
    k(0, p=_DINDING + A(-0.012, -0.02, 0.06), a="ujung", b="1", j="dalam+0.3*depan", tp="bawah"),
    k(0.12),
    k(0.3, p=_DINDING + A(-0.012, -0.06, 0.06)),
    k(0.42, p=_DINDING + A(-0.012, -0.02, 0.02)),
    k(0.6, p=_DINDING + A(-0.012, -0.06, 0.02)),
    k(0.72, p=_DINDING + A(-0.012, -0.02, -0.02)),
    k(0.9, p=_DINDING + A(-0.012, -0.06, -0.02)),
    k(1.0),
], L=_L_DINDING, gloss="NASKAH",
  cara="Telunjuk kanan menelusuri baris demi baris di telapak kiri yang tegak — membaca lembar naskah.", ragu=True)

S("B24_SUTRADARA", "Sutradara", "Pertunjukan", [
    k(0, p=A(-0.04, -0.38, 1.36), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="bawah+0.4*dalam"),
    k(0.15),
    k(0.35, p=A(-0.04, -0.38, 1.29)),
    k(0.5, p=A(-0.04, -0.38, 1.36)),
    k(0.65, p=A(-0.04, -0.38, 1.29)),
    k(0.9),
], L=[k(0, p=A(0.02, -0.38, 1.26), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="atas")],
  gloss="SUTRADARA",
  cara="Tangan kanan datar menutup-buka di atas tangan kiri seperti papan klep film ('action!'), sambil mengucapkan 'sutradara'.",
  ragu=True)

S("B24_MUSIK", "Musik", "Pertunjukan", [
    k(0, p="netral+0.10*atas+0.06*depan", a="telunjuk", b="1", j="atas+0.4*depan", tp="depan"),
    k(0.12, p="netral+0.04*atas+0.08*depan+0.04*dalam", kurva=True),
    k(0.3, p="netral+0.12*atas+0.08*depan+0.06*luar", kurva=True),
    k(0.48, p="netral+0.04*atas+0.08*depan", kurva=True),
    k(0.66, p="netral+0.12*atas+0.08*depan+0.06*luar", kurva=True),
    k(0.9),
], wajah="senang", gloss="MUSIK",
  cara="Telunjuk diayunkan berirama ke kiri-kanan seperti dirigen, sambil mengucapkan 'musik'.", ragu=True)

_GETAR = [k(0, p=A(-0.07, -0.38, 1.20), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
          *bolak(0.1, 0.07, 10, {"p": A(-0.075, -0.38, 1.21)}, {"p": A(-0.065, -0.38, 1.19)}), k(0.95)]
S("B24_GETAR", "Getar / getaran", "Pertunjukan", **_sym(_GETAR), gloss="GETAR",
  cara="Dua tangan 5 telapak ke bawah bergetar cepat dan kecil — merasakan getaran lantai atau speaker.", ragu=True)

S("B24_LAGU", "Lagu / bernyanyi", "Pertunjukan", [
    k(0, p="mulut+0.06*depan+0.02*bawah", a="ujung", b="FLAT_O", j="atas+0.5*belakang+0.3*dalam", tp="dalam"),
    k(0.12),
    k(0.4, p="mulut+0.16*depan+0.05*luar+0.03*atas", b="5", j="depan+0.3*atas", tp="bawah", kurva=True),
    k(0.6, p="mulut+0.24*depan+0.10*luar+0.02*bawah", kurva=True),
    k(0.8, p="mulut+0.30*depan+0.16*luar+0.03*atas", kurva=True),
    k(0.95),
], gloss="LAGU",
  cara="Jari kuncup dari depan mulut membuka dan bergerak bergelombang ke depan — suara/lagu mengalun, sambil mengucapkan 'lagu'.",
  ragu=True)

S("B24_TEPUK_TULI", "Tepuk tangan Tuli", "Pertunjukan", **_sym([
    k(0, p=A(-0.15, -0.34, 1.50), a="telapak", b="5", j="atas", tp="depan"),
    *bolak(0.12, 0.1, 8, {"putar": -40}, {"putar": 40}),
    k(0.95, putar=0),
]), wajah="senang", gloss="TEPUK-TULI",
  cara="Dua tangan 5 diangkat di samping kepala lalu diputar-putar pergelangannya — tepuk tangan visual yang lazim di komunitas Tuli.")

# ── Seni rupa & karya ──────────────────────────────────────────────────────

_PAMERAN = [k(0, p=A(-0.06, -0.40, 1.30), a="telapak", b="FLAT", j="atas", tp="depan"),
            k(0.12), k(0.3, p=A(-0.10, -0.40, 1.30)), k(0.42, p=A(-0.10, -0.42, 1.30)),
            k(0.6, p=A(-0.17, -0.40, 1.30)), k(0.72, p=A(-0.17, -0.42, 1.30)), k(0.95)]
S("B24_PAMERAN", "Pameran", "Seni rupa", **_sym(_PAMERAN), gloss="PAMERAN",
  cara="Dua telapak tegak menghadap depan bergeser ke samping bertahap — bingkai-bingkai karya berjajar di dinding.", ragu=True)

S("B24_KARYA", "Karya / hasil karya", "Seni rupa", [
    k(0, p=_ALAS + A(0, -0.01, 0.05), a="punggung", b="S", j="depan+0.3*dalam", tp="bawah"),
    k(0.12, p=_ALAS + A(0, -0.01, 0.025)),
    k(0.25, p=_ALAS + A(0, -0.01, 0.06)),
    k(0.37, p=_ALAS + A(0, -0.01, 0.025)),
    k(0.75, p=_ALAS + A(-0.04, -0.12, 0.10), a="telapak", b="FLAT", j="depan", tp="atas"),
    k(0.95),
], L=_L_ALAS, wajah="senang", gloss="KARYA",
  cara="Kepalan kanan mengetuk telapak kiri dua kali (membuat), lalu membuka telapak ke atas maju — menyodorkan hasilnya.", ragu=True)

S("B24_INDAH", "Indah / cantik", "Seni rupa",
  [k(0, p="pipi+0.10*depan+0.09*luar", a="telapak", b="5", j="atas", tp="belakang+0.4*dalam")] +
  lingkar(0.12, 0.65, "pipi+0.10*depan+0.09*luar", 0.04, "luar", "atas", n=8, mulai=0, putaran=1) +
  [k(0.85, p="dagu+0.12*depan", a="ujung", b="FLAT_O", j="atas+0.3*depan", tp="belakang"), k(1.0)],
  wajah="senang", gloss="INDAH",
  cara="Tangan 5 melingkari wajah lalu menguncup di depan dagu, wajah kagum, sambil mengucapkan 'indah'.", ragu=True)

S("B24_PANDANG", "Pandang / sudut pandang", "Seni rupa", [
    k(0, p="mata+0.05*depan", a="pergelangan", b="V", j="depan", tp="bawah"),
    k(0.15),
    k(0.55, p="mata+0.24*depan+0.03*bawah"),
    k(0.8),
], gloss="PANDANG",
  cara="Jari V dari depan mata bergerak lurus ke depan — arah pandangan mata.", ragu=True)

# ── Identitas & budaya ─────────────────────────────────────────────────────

S("B24_IDENTITAS", "Identitas / jati diri", "Budaya", [
    k(0, p="dada+0.03*depan", a="telapak", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
    k(0.15, p="dada+0.012*depan"),
    k(0.4, p="dada+0.012*depan"),
    k(0.7, p="dada+0.012*depan+0.03*atas", b="S"),
    k(0.9),
], wajah="senang", gloss="IDENTITAS",
  cara="Telapak menempel mantap di dada lalu mengepal — siapa diri kita, sambil mengucapkan 'identitas'.", ragu=True)

_BUDAYA_R = lingkar(0, 0.85, A(-0.0, -0.38, 1.26), 0.05, "depan", "atas", n=10, mulai=0, putaran=1,
                    a="telapak", b="5", j="atas+0.3*depan", tp="dalam") + [k(1.0)]
_BUDAYA_L = lingkar(0, 0.85, A(-0.0, -0.38, 1.26), 0.05, "depan", "atas", n=10, mulai=180, putaran=1,
                    a="telapak", b="5", j="atas+0.3*depan", tp="dalam") + [k(1.0)]
S("B24_BUDAYA", "Budaya", "Budaya", R=_BUDAYA_R, L=cermin(_BUDAYA_L), gloss="BUDAYA",
  cara="Dua tangan 5 berhadapan berputar saling mengitari di depan dada — kebiasaan yang diwariskan bersama, sambil mengucapkan 'budaya'.",
  ragu=True)

S("B24_HORMAT", "Hormat / menghormati", "Budaya", [
    k(0, p=A(-0.012, -0.30, 1.30), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
    k(0.2),
    k(0.55, p=A(-0.012, -0.32, 1.28)),
    k(0.85),
], L=[k(0, p=A(0.012, -0.30, 1.30), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
      k(0.2), k(0.55, p=A(0.012, -0.32, 1.28)), k(0.85)],
  kepala=[(0.2, 0, 0, 0), (0.5, 14, 0, 0), (0.85, 0, 0, 0)], gloss="HORMAT",
  cara="Dua telapak dirapatkan di depan dada sambil kepala sedikit menunduk — sikap menghormati.", ragu=True)

S("B24_SOPAN", "Sopan", "Budaya", [
    k(0, p="dada+0.03*depan+0.06*atas", a="telapak", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    k(0.15),
    k(0.6, p="dada+0.03*depan+0.08*bawah"),
    k(0.85),
], kepala=[(0.15, 0, 0, 0), (0.5, 8, 0, 0), (0.85, 0, 0, 0)], gloss="SOPAN",
  cara="Telapak mengusap pelan dada dari atas ke bawah sambil sedikit menunduk, sambil mengucapkan 'sopan'.", ragu=True)

S("B24_TAMU", "Tamu", "Budaya", [
    k(0, p="netral+0.22*depan+0.10*luar", a="telapak", b="FLAT", j="depan+0.3*luar", tp="atas"),
    k(0.15),
    k(0.6, p="netral+0.06*depan+0.02*dalam"),
    k(0.85),
], wajah="senang", gloss="TAMU",
  cara="Telapak menghadap atas dari depan-samping ditarik ke arah badan — mempersilakan orang datang.", ragu=True)

S("B24_BERBAGI", "Berbagi", "Budaya", [
    k(0, p=_ALAS + A(0, -0.01, 0.02), a="sisi_kelingking", b="FLAT", j="depan", tp="dalam"),
    k(0.12),
    k(0.32, p=_ALAS + A(-0.05, -0.08, 0.02)),
    k(0.45, p=_ALAS + A(0, -0.01, 0.02)),
    k(0.65, p=_ALAS + A(0.05, -0.08, 0.02)),
    k(0.85),
], L=_L_ALAS, gloss="BERBAGI",
  cara="Sisi kelingking tangan kanan di telapak kiri bergerak ke depan-kanan lalu ke depan-kiri — membagi ke beberapa orang.",
  ragu=True)

S("B24_INKLUSI", "Inklusi / semua dilibatkan", "Budaya", [
    k(0, p="netral+0.20*depan+0.10*luar+0.04*atas", a="ujung", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.6, p=A(0.035, -0.36, 1.27), b="FLAT_O", j="bawah+0.3*dalam", tp="bawah"),
    k(0.85),
], L=[k(0, p=A(0.04, -0.36, 1.22), a="telapak", b="C", j="depan+0.3*dalam", tp="dalam")],
  gloss="INKLUSI",
  cara="Tangan kanan terbuka menyapu dari samping lalu menguncup masuk ke tangan kiri C — semua orang dimasukkan, sambil mengucapkan 'inklusi'.",
  ragu=True)

S("B24_ACARA", "Acara / kegiatan", "Budaya", [
    k(0, p=A(-0.06, -0.38, 1.24), a="telapak", b="5", j="depan+0.3*atas", tp="atas"),
    *bolak(0.12, 0.14, 4, {"p": A(-0.10, -0.40, 1.26)}, {"p": A(-0.06, -0.38, 1.24)}),
    k(0.8),
], L=cermin([k(0, p=A(-0.06, -0.38, 1.24), a="telapak", b="5", j="depan+0.3*atas", tp="atas"),
             *bolak(0.12, 0.14, 4, {"p": A(-0.06, -0.38, 1.24)}, {"p": A(-0.10, -0.40, 1.26)}),
             k(0.8)]),
  gloss="ACARA",
  cara="Dua telapak menghadap atas bergerak maju-mundur bergantian — orang-orang sibuk berkegiatan, sambil mengucapkan 'acara'.",
  ragu=True)

# ── Sejarah & perjuangan ───────────────────────────────────────────────────

S("B24_PERJUANGAN", "Perjuangan / berjuang", "Sejarah", **_sym([
    k(0, p=A(-0.08, -0.32, 1.24), a="telapak", b="S", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.35, p=A(-0.08, -0.42, 1.30)),
    k(0.5, p=A(-0.08, -0.32, 1.24)),
    k(0.7, p=A(-0.08, -0.42, 1.30)),
    k(0.9),
]), gloss="PERJUANGAN",
  cara="Dua kepalan didorong maju dengan tegas dua kali, wajah bersungguh-sungguh, sambil mengucapkan 'berjuang'.", ragu=True)

S("B24_PENGAKUAN", "Pengakuan / diakui resmi", "Sejarah", [
    k(0, p=_ALAS + A(0, -0.01, 0.12), a="telapak", b="S", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.45, p=_ALAS + A(0, -0.01, 0.03)),
    k(0.6, p=_ALAS + A(0, -0.01, 0.06)),
    k(0.85),
], L=_L_ALAS, kepala=[(0.3, 0, 0, 0), (0.45, 8, 0, 0), (0.7, 0, 0, 0)], gloss="PENGAKUAN",
  cara="Kepalan kanan dicapkan mantap ke telapak kiri seperti stempel resmi, sambil mengangguk.", ragu=True)

S("B24_JENDELA", "Jendela (JBI di layar)", "Media", [
    k(0, p=A(-0.10, -0.40, 1.22), a="ujung", b="1", j="depan+0.3*atas", tp="bawah"),
    k(0.12),
    k(0.32, p=A(-0.18, -0.40, 1.22)),
    k(0.5, p=A(-0.18, -0.40, 1.14)),
    k(0.68, p=A(-0.10, -0.40, 1.14)),
    k(0.85, p=A(-0.10, -0.40, 1.22)),
    k(1.0),
], gloss="JENDELA",
  cara="Telunjuk menggambar kotak kecil di sudut bawah-kanan ruang depan — kotak JBI di pojok layar.", ragu=True)

S("B24_KRITIK", "Kritik", "Apresiasi", [
    k(0, p=_DINDING + A(-0.012, -0.03, 0.07), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.45, p=_DINDING + A(-0.012, -0.05, -0.05)),
    k(0.75),
], L=_L_DINDING, gloss="KRITIK",
  cara="Sisi tangan kanan menebas turun di depan telapak kiri yang tegak — memotong/menilai, sambil mengucapkan 'kritik'.", ragu=True)

S("B24_SARAN", "Saran / usul", "Apresiasi", [
    k(0, p="dagu+0.08*depan+0.02*bawah", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.6, p="netral+0.20*depan+0.06*atas", j="depan+0.3*atas", tp="atas"),
    k(0.85),
], gloss="SARAN",
  cara="Tangan datar dari depan mulut bergerak maju dan membalik telapak ke atas — menawarkan ide, sambil mengucapkan 'saran'.",
  ragu=True)

# ── Dieja jari (istilah tanpa isyarat baku yang kami yakini) ──────────────

S("B24_IS", "Isyarat Internasional (International Sign)", "Bahasa isyarat", [],
  gloss="IS", cara="Dieja jari: I-S; banyak komunitas juga menyebutnya 'Isyarat Internasional'. Tanyakan isyarat lokalnya ke pengajar Tuli.",
  ragu=True)
S("B24_METAFORA", "Metafora", "Puisi", [], gloss="METAFORA", cara="Dieja jari: M-E-T-A-F-O-R-A.")
S("B24_TEMA", "Tema", "Puisi", [], gloss="TEMA", cara="Dieja jari: T-E-M-A.")
S("B24_SUMBER", "Sumber (rujukan)", "Sejarah", [], gloss="SUMBER", cara="Dieja jari: S-U-M-B-E-R.")
