# [isyarat-b1b2-v1] Kamus isyarat BISINDO B2.2 "Argumentasi & Debat".
# Tangan dominan kanan. Format sama dengan kamus_bisindo.py.
# ⚠️ Rujukan daring untuk kosakata abstrak BISINDO (argumen, bukti, debat, kritik …) sangat
#    sedikit dan variasi daerahnya besar. Hampir semua bentuk di sini ditulis dari prinsip ikonik
#    umum BISINDO + gerak bibir dan DITANDAI ragu=True — WAJIB dicek pengajar Tuli.
#    Bentuk ASL sengaja TIDAK disalin.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # jempol tegak, jari lain menggenggam (menunjuk sopan ala Jawa / bagus)
    "B22_JEMPOL": (I._jari(_G), "tegak"),
})

_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"
_TELUNJUK_DAHI = dict(a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang")
# telapak kiri datar menghadap atas di depan badan (alas)
_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
# telapak kiri tegak menghadap kanan (dinding/papan)
_PAPAN = A(0.04, -0.36, 1.24)
_L_PAPAN = [k(0, p=_PAPAN, a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")]


def _sym(keys):
    return dict(R=keys, L=cermin(keys))


# ── Struktur argumen ───────────────────────────────────────────────────────

S("B22_ARGUMEN", "Argumen", "Argumen", [
    k(0, p=_DAHI + "+0.04*depan", **_TELUNJUK_DAHI),
    k(0.18, p=_DAHI),
    k(0.3),
    k(0.6, p=_ALAS + A(0, -0.01, 0.06), a="telunjuk", b="1", j="bawah+0.3*depan", tp="belakang"),
    k(0.72, p=_ALAS + A(0, -0.01, 0.01)),
    k(0.84, p=_ALAS + A(0, -0.05, 0.06)),
    k(0.96, p=_ALAS + A(0, -0.05, 0.01)),
    k(1.15),
], L=_L_ALAS, gloss="ARGUMEN",
  cara="Telunjuk menyentuh pelipis, lalu turun mengetuk telapak kiri dua kali berurutan (menyusun pikiran), sambil mengucapkan 'argumen'.",
  ragu=True)

S("B22_ALASAN", "Alasan / dasar", "Argumen", [
    k(0, p=A(0.01, -0.34, 1.13), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas"),
    k(0.15),
    k(0.5, p=A(0.01, -0.34, 1.18)),
    k(0.8),
], L=[k(0, p=A(0.02, -0.34, 1.20), a="punggung", b="S", j="depan+0.3*dalam", tp="bawah"),
      k(0.15), k(0.5, p=A(0.02, -0.34, 1.25)), k(0.8)],
  gloss="ALASAN",
  cara="Telapak kanan menopang kepalan kiri dari bawah lalu sedikit mengangkatnya — dasar yang menyangga pendapat; ucapkan 'alasan'.",
  ragu=True)

S("B22_BUKTI", "Bukti", "Argumen", [
    k(0, p="mata+0.06*depan+0.02*luar", a="jari_telunjuk", b="V", j="atas+0.6*depan", tp="belakang"),
    k(0.15),
    k(0.55, p=_PAPAN + A(-0.025, -0.01, 0.0), a="ujung", b="FLAT", j="depan+0.6*atas", tp="luar"),
    k(0.68, p=_PAPAN + A(-0.012, -0.01, 0.0)),
    k(0.95),
], L=_L_PAPAN, gloss="BUKTI",
  cara="Jari V dari depan mata (lihat) lalu telapak kanan ditempelkan mantap ke telapak kiri yang tegak — 'ini buktinya, lihat sendiri'.",
  ragu=True)

_SIMPUL = [
    k(0, p=A(-0.16, -0.36, 1.26), a="telapak", b="5", j="depan+0.4*atas", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.03, -0.36, 1.26), a="ujung", b="FLAT_O", j="depan+0.4*dalam", tp="dalam"),
    k(0.85),
]
S("B22_KESIMPULAN", "Kesimpulan / menyimpulkan", "Argumen", **_sym(_SIMPUL), gloss="KESIMPULAN",
  cara="Dua tangan terbuka dari samping bergerak ke tengah lalu menguncup — semua poin dikumpulkan jadi satu.",
  ragu=True)

S("B22_CONTOH", "Contoh / misalnya", "Argumen", [
    k(0, p=_PAPAN + A(-0.07, -0.02, 0.03), a="telunjuk", b="1", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(0.3, p=_PAPAN + A(-0.025, -0.02, 0.03)),
    k(0.45, p=_PAPAN + A(-0.07, -0.02, 0.03)),
    k(0.6, p=_PAPAN + A(-0.025, -0.02, -0.02)),
    k(0.85),
], L=_L_PAPAN, gloss="CONTOH",
  cara="Telunjuk kanan menunjuk ke telapak kiri yang tegak dua kali (menunjukkan satu hal sebagai contoh), sambil mengucapkan 'contoh'.",
  ragu=True)

S("B22_POIN", "Poin / butir", "Argumen", [
    k(0, p=A(0.05, -0.36, 1.31), a="telunjuk", b="1", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.3, p=A(0.035, -0.36, 1.33)),
    k(0.45, p=A(0.05, -0.36, 1.31)),
    k(0.6, p=A(0.035, -0.36, 1.30)),
    k(0.85),
], L=[k(0, p=A(0.07, -0.33, 1.24), a="telapak", b="4", j="atas+0.4*dalam", tp="belakang+0.5*dalam")],
  gloss="POIN",
  cara="Telunjuk kanan menyentuh ujung jari-jari tangan kiri satu per satu — menghitung butir-butir argumen.",
  ragu=True)

# ── Data & bukti angka ─────────────────────────────────────────────────────

S("B22_DATA", "Data", "Data", [
    k(0, p=_PAPAN + A(-0.02, -0.01, 0.06), a="ujung", b="5", j="dalam+0.4*depan", tp="luar"),
    *bolak(0.15, 0.12, 5, {"p": _PAPAN + A(-0.012, -0.01, 0.04)}, {"p": _PAPAN + A(-0.02, -0.01, 0.0)}),
    k(0.8, p=_PAPAN + A(-0.012, -0.01, -0.04)),
    k(1.0),
], L=_L_PAPAN, gloss="DATA",
  cara="Ujung jari kanan mengetuk-ngetuk telapak kiri yang tegak sambil bergeser turun — baris-baris angka di tabel; ucapkan 'data'.",
  ragu=True)

S("B22_PERSEN", "Persen (%)", "Data", [
    k(0, p="netral+0.10*atas+0.04*depan", a="ujung", b="BABY_O", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.3, p="netral+0.10*atas+0.04*depan+0.04*dalam", a="ujung", b="1", j="depan+0.3*atas", tp="dalam"),
    k(0.55, p="netral+0.02*bawah+0.04*depan+0.08*luar"),
    k(0.7, p="netral+0.02*bawah+0.04*depan+0.06*luar", b="BABY_O"),
    k(0.95),
], gloss="PERSEN",
  cara="Menggambar tanda % di udara: bulatan kecil, garis miring ke bawah, bulatan kecil — sambil mengucapkan 'persen'.",
  ragu=True)

_GRAFIK = dict(a="telunjuk", b="1", j="depan+0.4*luar", tp="bawah")
S("B22_GRAFIK_NAIK", "Grafik naik / meningkat", "Data", [
    k(0, p=A(0.05, -0.38, 1.16), **_GRAFIK),
    k(0.15),
    k(0.3, p=A(0.0, -0.38, 1.22)),
    k(0.42, p=A(-0.03, -0.38, 1.19)),
    k(0.6, p=A(-0.09, -0.38, 1.29)),
    k(0.72, p=A(-0.12, -0.38, 1.26)),
    k(0.9, p=A(-0.18, -0.38, 1.38)),
    k(1.1),
], L=[k(0, p=A(0.07, -0.36, 1.12), a="telapak", b="L", j="atas", tp="belakang")],
  kepala=[(0.2, 0, 0, 0), (0.9, -5, 0, 0)], gloss="GRAFIK-NAIK",
  cara="Dengan tangan kiri L sebagai sumbu grafik, telunjuk kanan menggambar garis zig-zag yang naik ke kanan atas.")

S("B22_GRAFIK_TURUN", "Grafik turun / menurun", "Data", [
    k(0, p=A(0.04, -0.38, 1.38), **_GRAFIK),
    k(0.15),
    k(0.3, p=A(-0.01, -0.38, 1.30)),
    k(0.42, p=A(-0.04, -0.38, 1.33)),
    k(0.6, p=A(-0.09, -0.38, 1.24)),
    k(0.72, p=A(-0.12, -0.38, 1.26)),
    k(0.9, p=A(-0.18, -0.38, 1.14)),
    k(1.1),
], L=[k(0, p=A(0.07, -0.36, 1.12), a="telapak", b="L", j="atas", tp="belakang")],
  wajah="sedih", gloss="GRAFIK-TURUN",
  cara="Dengan tangan kiri L sebagai sumbu grafik, telunjuk kanan menggambar garis zig-zag yang turun ke kanan bawah, wajah prihatin.")

# ── Debat & bantahan ───────────────────────────────────────────────────────

_DEBAT_R = [
    k(0, p=A(-0.08, -0.36, 1.27), a="telunjuk", b="1", j="dalam+0.6*depan", tp="bawah"),
    *bolak(0.12, 0.14, 5, {"p": A(-0.05, -0.40, 1.28)}, {"p": A(-0.09, -0.34, 1.26)}),
    k(0.85),
]
_DEBAT_L = cermin([
    k(0, p=A(-0.08, -0.36, 1.27), a="telunjuk", b="1", j="dalam+0.6*depan", tp="bawah"),
    *bolak(0.12, 0.14, 5, {"p": A(-0.09, -0.34, 1.26)}, {"p": A(-0.05, -0.40, 1.28)}),
    k(0.85),
])
S("B22_DEBAT", "Debat / berdebat", "Debat", R=_DEBAT_R, L=_DEBAT_L, gloss="DEBAT",
  cara="Dua telunjuk berhadapan maju-mundur bergantian seperti dua pihak saling beradu pendapat, sambil mengucapkan 'debat'.",
  ragu=True)

S("B22_BANTAH", "Membantah", "Debat", [
    k(0, p="netral+0.10*atas+0.02*dalam", a="telapak", b="FLAT", j="atas+0.3*depan", tp="depan+0.5*luar"),
    k(0.15),
    k(0.45, p="netral+0.06*atas+0.14*luar+0.06*depan", j="atas+0.6*luar", tp="luar+0.3*depan"),
    k(0.75),
], kepala=[(0.1, 0, 0, 0), (0.35, 0, 10, 0), (0.55, 0, -6, 0), (0.75, 0, 0, 0)],
  gloss="BANTAH",
  cara="Telapak tegak di depan dada mengibas ke samping seperti menepis pendapat lawan, kepala sedikit menggeleng.",
  ragu=True)

_DUKUNG = [
    k(0, p=A(-0.03, -0.34, 1.16), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.55, p=A(-0.03, -0.34, 1.30)),
    k(0.85),
]
S("B22_DUKUNG", "Dukung / mendukung (pro)", "Debat", R=_DUKUNG,
  L=[k(0, p=A(0.0, -0.34, 1.19), a="punggung", b="B22_JEMPOL", j="depan+0.2*dalam", tp="dalam"),
     k(0.15), k(0.55, p=A(0.0, -0.34, 1.33)), k(0.85)],
  kepala=[(0.2, 0, 0, 0), (0.55, 8, 0, 0), (0.8, 0, 0, 0)], wajah="senang", gloss="DUKUNG",
  cara="Telapak kanan menopang jempol kiri yang tegak dari bawah lalu mendorongnya naik — memberi dukungan; mengangguk.",
  ragu=True)

S("B22_TOLAK", "Tolak / menolak (kontra)", "Debat", [
    k(0, p="dada+0.10*depan+0.06*kanan", a="telapak", b="FLAT", j="atas", tp="depan"),
    k(0.15),
    k(0.45, p="dada+0.28*depan+0.06*kanan"),
    k(0.75),
], L=[k(0, p="dada+0.10*depan+0.06*kiri", a="telapak", b="FLAT", j="atas", tp="depan"),
      k(0.15), k(0.45, p="dada+0.28*depan+0.06*kiri"), k(0.75)],
  kepala=[(0.1, 0, 0, 0), (0.3, 0, 10, 0), (0.5, 0, -10, 0), (0.7, 0, 0, 0)], wajah="sedih", gloss="TOLAK",
  cara="Dua telapak tegak didorong mantap ke depan menjauhi badan sambil menggeleng — menolak.",
  ragu=True)

S("B22_PIHAK", "Pihak / sisi", "Debat", [
    k(0, p="netral+0.06*atas+0.02*dalam", a="sisi_kelingking", b="FLAT", j="depan+0.2*atas", tp="luar"),
    k(0.15),
    k(0.5, p="netral+0.06*atas+0.12*luar"),
    k(0.8),
], gloss="PIHAK",
  cara="Tangan datar tegak (sisi kelingking ke bawah) bergerak dari tengah ke samping — menandai satu sisi di ruang isyarat. Arahkan ke kanan/kiri sesuai pihak yang dimaksud.",
  ragu=True)

_TIMBANG = dict(a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas")
S("B22_MENIMBANG", "Menimbang / membandingkan", "Debat", R=[
    k(0, p=A(-0.12, -0.36, 1.22), **_TIMBANG),
    *bolak(0.15, 0.16, 4, {"p": A(-0.12, -0.36, 1.27)}, {"p": A(-0.12, -0.36, 1.19)}),
    k(0.85, p=A(-0.12, -0.36, 1.22)),
], L=cermin([
    k(0, p=A(-0.12, -0.36, 1.22), **_TIMBANG),
    *bolak(0.15, 0.16, 4, {"p": A(-0.12, -0.36, 1.19)}, {"p": A(-0.12, -0.36, 1.27)}),
    k(0.85, p=A(-0.12, -0.36, 1.22)),
]), kepala=[(0.15, 0, 0, 5), (0.45, 0, 0, -5), (0.75, 0, 0, 0)], gloss="MENIMBANG",
  cara="Dua telapak menghadap atas naik-turun bergantian seperti timbangan, kepala ikut miring kanan-kiri.",
  ragu=True)

_ADIL_R = [
    k(0, p=A(-0.12, -0.36, 1.27), **_TIMBANG),
    k(0.15, p=A(-0.12, -0.36, 1.20)),
    k(0.3, p=A(-0.12, -0.36, 1.25)),
    k(0.55, p=A(-0.12, -0.36, 1.23)),
    k(0.85),
]
_ADIL_L = [
    k(0, p=A(-0.12, -0.36, 1.19), **_TIMBANG),
    k(0.15, p=A(-0.12, -0.36, 1.26)),
    k(0.3, p=A(-0.12, -0.36, 1.21)),
    k(0.55, p=A(-0.12, -0.36, 1.23)),
    k(0.85),
]
S("B22_ADIL", "Adil / seimbang", "Debat", R=_ADIL_R, L=cermin(_ADIL_L),
  wajah="senang", gloss="ADIL",
  cara="Dua telapak menghadap atas seperti timbangan, bergoyang sebentar lalu berhenti rata sejajar — seimbang, adil.",
  ragu=True)

S("B22_TENANG", "Tenang", "Debat", **_sym([
    k(0, p=A(-0.08, -0.34, 1.32), a="telapak", b="FLAT", j="depan+0.4*dalam", tp="bawah"),
    k(0.2),
    k(0.8, p=A(-0.10, -0.36, 1.18)),
    k(1.0),
]), wajah="netral", gloss="TENANG",
  cara="Dua telapak menghadap bawah turun perlahan di depan dada, napas dan wajah tenang.",
  ragu=True)

S("B22_SOPAN", "Sopan", "Debat", [
    k(0, p="dada+0.05*depan", a="telapak", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
    k(0.2),
    k(0.6, p="netral+0.06*atas+0.04*depan", a="telapak", b="B22_JEMPOL", j="depan+0.3*dalam", tp="dalam"),
    k(0.9),
], kepala=[(0.2, 0, 0, 0), (0.55, 10, 0, 0), (0.85, 4, 0, 0)], wajah="senang", gloss="SOPAN",
  cara="Telapak menyentuh dada lalu maju dengan jempol menunjuk ke depan (cara menunjuk yang halus), kepala sedikit menunduk.",
  ragu=True)

S("B22_HORMAT", "Hormat / menghargai", "Debat", [
    k(0, p="dada+0.04*depan", a="telapak", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="netral+0.06*atas+0.12*depan", j="depan+0.4*atas", tp="atas+0.3*dalam"),
    k(0.85),
], kepala=[(0.15, 0, 0, 0), (0.5, 12, 0, 0), (0.8, 0, 0, 0)], wajah="senang", gloss="HORMAT",
  cara="Telapak di dada lalu terbuka maju ke arah lawan bicara sambil mengangguk — menghargai pendapatnya.",
  ragu=True)

# ── Persuasi & negosiasi ───────────────────────────────────────────────────

S("B22_YAKIN", "Yakin", "Persuasi", [
    k(0, p="dada_kanan+0.08*depan", a="telapak", b="5", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.45, p="dada_kanan+0.015*depan", b="S"),
    k(0.6, p="dada_kanan+0.04*depan"),
    k(0.72, p="dada_kanan+0.015*depan"),
    k(0.95),
], kepala=[(0.3, 0, 0, 0), (0.5, 10, 0, 0), (0.75, 0, 0, 0)], gloss="YAKIN",
  cara="Tangan terbuka menuju dada lalu mengepal dan menepuk dada dua kali dengan mantap, mengangguk — yakin dalam hati.",
  ragu=True)

S("B22_KAMPANYE", "Kampanye", "Persuasi", **_sym([
    k(0, p=A(-0.10, -0.32, 1.36), a="telapak", b="S", j="atas+0.2*dalam", tp="dalam"),
    *bolak(0.15, 0.16, 4, {"p": A(-0.10, -0.32, 1.44)}, {"p": A(-0.10, -0.32, 1.36)}),
    k(0.85),
]), wajah="senang", gloss="KAMPANYE",
  cara="Dua kepalan seperti memegang tiang spanduk diangkat naik-turun bersama, sambil mengucapkan 'kampanye'.",
  ragu=True)

S("B22_TAWAR", "Menawar / negosiasi", "Persuasi", R=[
    k(0, p=A(-0.09, -0.34, 1.24), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    *bolak(0.12, 0.16, 4, {"p": A(-0.09, -0.44, 1.26)}, {"p": A(-0.09, -0.34, 1.24)}),
    k(0.85),
], L=cermin([
    k(0, p=A(-0.09, -0.44, 1.26), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    *bolak(0.12, 0.16, 4, {"p": A(-0.09, -0.34, 1.24)}, {"p": A(-0.09, -0.44, 1.26)}),
    k(0.85),
]), kepala=[(0.15, 0, 0, 4), (0.45, 0, 0, -4), (0.75, 0, 0, 0)], gloss="TAWAR",
  cara="Dua telapak menghadap atas maju-mundur bergantian — saling menyodorkan penawaran.",
  ragu=True)

S("B22_SEPAKAT", "Sepakat / kesepakatan", "Persuasi", [
    k(0, p=A(-0.08, -0.38, 1.26), a="telapak", b="FLAT", j="depan+0.6*dalam", tp="dalam"),
    k(0.15),
    k(0.4, p=A(-0.015, -0.38, 1.26), b="C"),
    k(0.6, p=A(-0.015, -0.38, 1.21)),
    k(0.75, p=A(-0.015, -0.38, 1.26)),
    k(1.0),
], L=[k(0, p=A(0.08, -0.38, 1.26), a="telapak", b="FLAT", j="depan+0.6*dalam", tp="dalam"),
      k(0.15), k(0.4, p=A(0.015, -0.38, 1.26), b="C"), k(0.6, p=A(0.015, -0.38, 1.21)),
      k(0.75, p=A(0.015, -0.38, 1.26)), k(1.0)],
  kepala=[(0.4, 0, 0, 0), (0.6, 10, 0, 0), (0.8, 0, 0, 0)], wajah="senang", gloss="SEPAKAT",
  cara="Dua tangan bertemu di tengah dan saling menggenggam seperti berjabat, digoyang turun sekali sambil mengangguk.",
  ragu=True)

S("B22_SARAN", "Saran / usul", "Persuasi", [
    k(0, p="mulut+0.09*depan+0.03*bawah", a="ujung", b="FLAT_O", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.55, p="netral+0.08*atas+0.16*depan", a="telapak", b="FLAT", j="depan+0.3*atas", tp="atas"),
    k(0.85),
], gloss="SARAN",
  cara="Tangan kuncup dari depan mulut maju dan membuka telapak ke atas ke arah lawan — menyodorkan usul; ucapkan 'saran'.",
  ragu=True)

S("B22_SOLUSI", "Solusi / jalan keluar", "Persuasi", [
    k(0, p=A(-0.03, -0.36, 1.24), a="telapak", b="S", j="depan+0.4*dalam", tp="bawah"),
    *lingkar(0.12, 0.5, A(-0.03, -0.36, 1.24), 0.02, "luar", "atas", n=5, mulai=0, putaran=1),
    k(0.8, p=A(-0.13, -0.40, 1.24), b="5", j="depan+0.4*luar", tp="atas"),
    k(1.0),
], L=cermin([
    k(0, p=A(-0.03, -0.36, 1.24), a="telapak", b="S", j="depan+0.4*dalam", tp="bawah"),
    *lingkar(0.12, 0.5, A(-0.03, -0.36, 1.24), 0.02, "luar", "atas", n=5, mulai=180, putaran=1),
    k(0.8, p=A(-0.13, -0.40, 1.24), b="5", j="depan+0.4*luar", tp="atas"),
    k(1.0),
]), wajah="senang", gloss="SOLUSI",
  cara="Dua kepalan berputar kecil seperti mengurai simpul, lalu terbuka ke samping — masalah terurai; ucapkan 'solusi'.",
  ragu=True)

S("B22_MASALAH", "Masalah / isu", "Persuasi", R=[
    k(0, p=A(-0.04, -0.36, 1.26), a="buku", b="BENT_V", j="dalam+0.4*depan", tp="belakang"),
    *bolak(0.12, 0.14, 5, {"p": A(-0.02, -0.36, 1.24), "putar": 25}, {"p": A(-0.04, -0.36, 1.26), "putar": -15}),
    k(0.85, putar=0),
], L=cermin([
    k(0, p=A(-0.04, -0.36, 1.22), a="buku", b="BENT_V", j="dalam+0.4*depan", tp="depan"),
    *bolak(0.12, 0.14, 5, {"p": A(-0.02, -0.36, 1.24), "putar": -25}, {"p": A(-0.04, -0.36, 1.22), "putar": 15}),
    k(0.85, putar=0),
]), wajah="sedih", gloss="MASALAH",
  cara="Dua tangan jari V bengkok saling bertaut dan memelintir — urusan yang kusut; wajah berkerut, ucapkan 'masalah'.",
  ragu=True)

S("B22_DAMPAK", "Dampak / akibat", "Persuasi", [
    k(0, p=A(-0.10, -0.30, 1.30), a="buku", b="S", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.38, p=_PAPAN + A(-0.03, 0, 0.0)),
    k(0.7),
], L=[k(0, p=_PAPAN, a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
      k(0.38), k(0.55, p=_PAPAN + A(0.06, -0.02, 0.0)), k(0.8)],
  wajah="sedih", gloss="DAMPAK",
  cara="Kepalan kanan membentur telapak kiri yang tegak sehingga telapak kiri terdorong ke samping — akibat yang ditimbulkan.",
  ragu=True)

S("B22_POSITIF", "Positif (+)", "Persuasi", [
    k(0, p=A(0.01, -0.39, 1.33), a="telunjuk", b="1", j="atas", tp="dalam"),
    k(0.15),
    k(0.35, p=A(0.01, -0.39, 1.295)),
    k(0.7),
], L=[k(0, p=A(-0.03, -0.37, 1.26), a="telunjuk", b="1", j="dalam", tp="bawah")],
  wajah="senang", gloss="POSITIF",
  cara="Telunjuk kiri mendatar, telunjuk kanan tegak menyilang di atasnya membentuk tanda tambah (+), sambil mengucapkan 'positif'.",
  ragu=True)

S("B22_NEGATIF", "Negatif (−)", "Persuasi", [
    k(0, p=A(0.03, -0.38, 1.26), a="telunjuk", b="1", j="dalam", tp="bawah"),
    k(0.15),
    k(0.5, p=A(-0.08, -0.38, 1.26)),
    k(0.8),
], wajah="sedih", gloss="NEGATIF",
  cara="Telunjuk mendatar menarik garis lurus ke samping membentuk tanda kurang (−), sambil mengucapkan 'negatif'.",
  ragu=True)

# ── Kritik & masukan ───────────────────────────────────────────────────────

S("B22_KRITIK", "Kritik / mengkritik", "Kritik", [
    k(0, p=_PAPAN + A(-0.03, -0.01, 0.06), a="ujung", b="1", j="dalam+0.6*depan", tp="bawah"),
    k(0.15),
    k(0.35, p=_PAPAN + A(-0.03, -0.01, -0.04)),
    k(0.5, p=_PAPAN + A(-0.03, -0.05, 0.06)),
    k(0.7, p=_PAPAN + A(-0.03, 0.03, -0.04)),
    k(0.95),
], L=_L_PAPAN, gloss="KRITIK",
  cara="Telunjuk kanan menggores tanda silang (X) di telapak kiri yang tegak, sambil mengucapkan 'kritik'.",
  ragu=True)

S("B22_TERBUKA", "Terbuka (menerima)", "Kritik", **_sym([
    k(0, p=A(-0.03, -0.30, 1.30), a="telapak", b="FLAT", j="atas+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.55, p=A(-0.17, -0.36, 1.30), j="atas+0.3*luar", tp="depan+0.4*dalam"),
    k(0.85),
]), wajah="senang", gloss="TERBUKA",
  cara="Dua telapak di depan dada membuka ke samping seperti membuka pintu hati, wajah ramah — siap menerima masukan.",
  ragu=True)

S("B22_JELASKAN", "Menjelaskan", "Kritik", R=[
    k(0, p=A(-0.06, -0.32, 1.26), a="telapak", b="FLAT", j="depan", tp="dalam"),
    *bolak(0.12, 0.14, 5, {"p": A(-0.06, -0.44, 1.26)}, {"p": A(-0.06, -0.32, 1.26)}),
    k(0.85),
], L=cermin([
    k(0, p=A(-0.06, -0.44, 1.26), a="telapak", b="FLAT", j="depan", tp="dalam"),
    *bolak(0.12, 0.14, 5, {"p": A(-0.06, -0.32, 1.26)}, {"p": A(-0.06, -0.44, 1.26)}),
    k(0.85),
]), gloss="JELASKAN",
  cara="Dua telapak berhadapan bergerak maju bergantian seperti menguraikan sesuatu selangkah demi selangkah; ucapkan 'jelaskan'.",
  ragu=True)

# ── Diskusi & moderasi ─────────────────────────────────────────────────────

S("B22_ATUR", "Atur / aturan", "Moderasi", [
    k(0, p=_PAPAN + A(-0.02, -0.01, 0.07), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="luar"),
    k(0.15),
    k(0.3, p=_PAPAN + A(-0.012, -0.01, 0.07)),
    k(0.45, p=_PAPAN + A(-0.02, -0.01, 0.0)),
    k(0.6, p=_PAPAN + A(-0.012, -0.01, 0.0)),
    k(0.75, p=_PAPAN + A(-0.02, -0.01, -0.07)),
    k(0.9, p=_PAPAN + A(-0.012, -0.01, -0.07)),
    k(1.1),
], L=_L_PAPAN, gloss="ATURAN",
  cara="Telapak kanan menepuk telapak kiri yang tegak tiga kali sambil turun — butir-butir aturan yang tertulis; ucapkan 'aturan'.",
  ragu=True)

S("B22_GILIRAN", "Giliran", "Moderasi", [
    k(0, p="dada+0.10*depan", a="ujung", b="L", j="dalam+0.6*depan", tp="bawah"),
    k(0.15),
    k(0.45, p="netral+0.04*atas+0.18*depan+0.04*luar", j="depan+0.3*luar"),
    k(0.7, p="dada+0.10*depan", j="dalam+0.6*depan"),
    k(0.95),
], gloss="GILIRAN",
  cara="Tangan L dari depan dada berayun ke arah lawan lalu kembali — 'sekarang kamu, lalu aku'; ucapkan 'giliran'.",
  ragu=True)

S("B22_HABIS", "Habis (waktu habis)", "Moderasi", [
    k(0, p=_ALAS + A(0.03, 0.04, 0.012), a="telapak", b="FLAT", j="dalam+0.4*depan", tp="bawah"),
    k(0.12),
    k(0.45, p=_ALAS + A(-0.05, -0.08, 0.03), b="5", tp="bawah+0.5*luar"),
    k(0.75),
], L=_L_ALAS, gloss="HABIS",
  cara="Telapak kanan menyapu telapak kiri sampai lepas dan jari membuka — tidak tersisa. Didahului JAM untuk 'waktu habis'.",
  ragu=True)

S("B22_TIM", "Tim / kelompok", "Moderasi", [
    k(0, p=A(-0.06, -0.38, 1.26), a="telapak", b="5", j="dalam+0.5*depan", tp="belakang"),
    k(0.15),
    k(0.45, p=A(-0.02, -0.38, 1.26)),
    k(0.6, p=A(-0.02, -0.38, 1.22)),
    k(0.9),
], L=[k(0, p=A(0.06, -0.40, 1.26), a="telapak", b="5", j="dalam+0.5*depan", tp="depan"),
      k(0.15), k(0.45, p=A(0.02, -0.40, 1.26)), k(0.6, p=A(0.02, -0.40, 1.22)), k(0.9)],
  gloss="TIM",
  cara="Jari-jari kedua tangan terbuka lalu saling bertaut erat — anggota yang bersatu; ucapkan 'tim'.",
  ragu=True)

S("B22_LANGKAH", "Langkah / tahap", "Moderasi", R=[
    k(0, p=A(-0.05, -0.32, 1.18), a="telapak", b="FLAT", j="depan", tp="bawah"),
    k(0.15),
    k(0.4, p=A(-0.05, -0.44, 1.20)),
    k(0.8, p=A(-0.05, -0.56, 1.20)),
    k(1.0),
], L=[k(0, p=A(0.05, -0.38, 1.18), a="telapak", b="FLAT", j="depan", tp="bawah"),
      k(0.15), k(0.6, p=A(0.05, -0.50, 1.20)), k(1.0)],
  gloss="LANGKAH",
  cara="Dua tangan datar telapak ke bawah bergantian melangkah maju seperti telapak kaki — langkah berikutnya.",
  ragu=True)

# ── Topik debat ────────────────────────────────────────────────────────────

S("B22_TEKNOLOGI", "Teknologi", "Topik", [],
  cara="Dieja jari: T-E-K (singkatan yang sering dipakai) atau T-E-K-N-O-L-O-G-I; tanyakan isyarat lokalnya ke pengajar Tuli.",
  gloss="TEKNOLOGI", ragu=True)

S("B22_MUDA", "Muda / anak muda", "Topik", [
    k(0, p="pipi+0.015*depan", a="ujung", b="FLAT", j="atas+0.3*belakang", tp="dalam"),
    k(0.15),
    k(0.45, p="rahang+0.02*depan+0.02*bawah"),
    k(0.6, p="pipi+0.015*depan"),
    k(0.8, p="rahang+0.02*depan+0.02*bawah"),
    k(1.0),
], wajah="senang", gloss="MUDA",
  cara="Ujung jari mengusap pipi ke bawah dua kali (kulit masih kencang), wajah ceria, sambil mengucapkan 'muda'.",
  ragu=True)

# ── Kata bantu diskusi (belum ada di A1–A2) ────────────────────────────────

S("B22_ADA", "Ada", "Kata bantu", [
    k(0, p="netral+0.08*atas+0.04*depan", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.4, p="netral+0.01*atas+0.06*depan"),
    k(0.7),
], kepala=[(0.15, 0, 0, 0), (0.4, 8, 0, 0), (0.65, 0, 0, 0)], gloss="ADA",
  cara="Telapak menghadap bawah ditekan turun sekali di depan badan sambil mengangguk kecil dan mengucapkan 'ada'.",
  ragu=True)

S("B22_CEPAT", "Cepat", "Kata bantu", [
    k(0, p="netral+0.06*atas+0.02*dalam", a="telunjuk", b="1", j="depan+0.4*atas", tp="dalam"),
    k(0.12),
    k(0.28, p="netral+0.04*atas+0.16*luar+0.06*depan", j="depan+0.6*luar"),
    k(0.6),
], gloss="CEPAT",
  cara="Telunjuk melesat cepat dari depan dada ke samping, sambil mengucapkan 'cepat'.",
  ragu=True)

S("B22_JAWAB", "Jawab / jawaban", "Kata bantu", **dict(
    R=[k(0, p="mulut+0.06*depan+0.03*bawah+0.02*luar", a="telunjuk", b="1", j="atas+0.5*depan", tp="dalam"),
       k(0.15), k(0.5, p="netral+0.10*atas+0.18*depan+0.02*luar", j="depan+0.4*atas"), k(0.8)],
    L=cermin([k(0, p="dagu+0.10*depan+0.04*bawah+0.05*luar", a="telunjuk", b="1", j="atas+0.5*depan", tp="dalam"),
              k(0.15), k(0.5, p="netral+0.06*atas+0.20*depan+0.05*luar", j="depan+0.4*atas"), k(0.8)])),
  gloss="JAWAB",
  cara="Dua telunjuk dari depan mulut-dagu bergerak maju ke arah penanya, sambil mengucapkan 'jawab'.",
  ragu=True)

S("B22_DISKUSI", "Diskusi / berdiskusi", "Kata bantu", R=[
    k(0, p=A(-0.08, -0.34, 1.30), a="ujung", b="FLAT_O", j="dalam+0.5*depan", tp="bawah"),
    *bolak(0.12, 0.14, 5, {"p": A(-0.08, -0.44, 1.30), "b": "5"}, {"p": A(-0.08, -0.34, 1.30), "b": "FLAT_O"}),
    k(0.85),
], L=cermin([
    k(0, p=A(-0.08, -0.44, 1.30), a="ujung", b="5", j="dalam+0.5*depan", tp="bawah"),
    *bolak(0.12, 0.14, 5, {"p": A(-0.08, -0.34, 1.30), "b": "FLAT_O"}, {"p": A(-0.08, -0.44, 1.30), "b": "5"}),
    k(0.85),
]), gloss="DISKUSI",
  cara="Dua tangan bergantian maju sambil membuka dari kuncup — saling menyampaikan pikiran; ucapkan 'diskusi'.",
  ragu=True)
