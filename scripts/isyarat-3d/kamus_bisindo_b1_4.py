# [isyarat-b1b2-v1] Kamus isyarat BISINDO B1.4 "Pekerjaan, Kesehatan & Layanan Publik".
# Tangan dominan kanan. Format sama dengan kamus_bisindo.py; kode baru berawalan B14_.
# ⚠️ Rujukan daring kosakata layanan publik BISINDO sangat sedikit. Sebagian besar bentuk di sini
#    ditulis dari prinsip ikonik umum BISINDO + gerak bibir dan DITANDAI ragu=True — WAJIB dicek
#    pengajar Tuli (variasi daerah besar). Bentuk ASL sengaja TIDAK disalin. Singkatan yang di
#    komunitas lazim dieja (KTP) ditulis sebagai entri eja (tanpa gerak).

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

# telapak kiri datar menghadap atas di depan badan (alas)
_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
# telapak kiri tegak menghadap kanan (seperti kertas/papan berdiri)
_PAPAN = A(0.03, -0.36, 1.28)
_L_PAPAN = [k(0, p=_PAPAN, a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam")]

GELENG = [(0.15, 0, 0, 0), (0.3, 0, 12, 0), (0.45, 0, -12, 0), (0.6, 0, 10, 0), (0.75, 0, 0, 0)]
ANGGUK = [(0.15, 0, 0, 0), (0.35, 10, 0, 0), (0.55, 0, 0, 0)]


def _sym(keys):
    return dict(R=keys, L=cermin(keys))


def _eja(kode, arti, kat, kata, ragu=False, tambah=""):
    S(kode, arti, kat, [], gloss=kode[4:].replace("_", "-"), ragu=ragu,
      cara=f"Dieja jari: {'-'.join(kata)}{tambah}")


# ── Dunia kerja & usaha ───────────────────────────────────────────────────

_REKAN = [
    k(0, p=A(-0.03, -0.32, 1.24), a="telapak", b="1", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.03, -0.46, 1.26)),
    k(0.85),
]
S("B14_REKAN", "Rekan kerja", "Kerja", **_sym(_REKAN), ragu=True, gloss="REKAN",
  cara="Dua telunjuk berdampingan bergerak maju bersama (berjalan bersama di tempat kerja), sambil mengucapkan 'rekan'.")

_KETIK = [
    k(0, p=A(-0.07, -0.38, 1.18), a="telapak", b="CLAW", j="depan", tp="bawah"),
    *bolak(0.1, 0.1, 7, {"p": A(-0.07, -0.38, 1.165)}, {"p": A(-0.07, -0.38, 1.185)}),
    k(0.85),
]
S("B14_KOMPUTER", "Komputer / laptop", "Kerja", R=_KETIK, L=cermin([
    k(0, p=A(-0.07, -0.38, 1.165), a="telapak", b="CLAW", j="depan", tp="bawah"),
    *bolak(0.1, 0.1, 7, {"p": A(-0.07, -0.38, 1.185)}, {"p": A(-0.07, -0.38, 1.165)}),
    k(0.85),
]), ragu=True, gloss="KOMPUTER",
  cara="Jari-jari dua tangan bergantian mengetik di papan ketik khayal, sambil mengucapkan 'komputer'.")

_eja("B14_EMAIL", "Surel / email", "Kerja", "EMAIL", ragu=True,
     tambah=" (sebagian orang memakai isyarat sendiri — tanyakan ke pengajar Tuli).")

_USAHA = [
    k(0, p=A(-0.07, -0.36, 1.22), a="telapak", b="S", j="depan+0.3*dalam", tp="dalam"),
    *bolak(0.12, 0.15, 5, {"p": A(-0.07, -0.44, 1.24)}, {"p": A(-0.07, -0.36, 1.22)}),
    k(0.9),
]
S("B14_USAHA", "Usaha / bisnis", "Kerja", R=_USAHA, L=cermin([
    k(0, p=A(-0.07, -0.44, 1.24), a="telapak", b="S", j="depan+0.3*dalam", tp="dalam"),
    *bolak(0.12, 0.15, 5, {"p": A(-0.07, -0.36, 1.22)}, {"p": A(-0.07, -0.44, 1.24)}),
    k(0.9),
]), ragu=True, gloss="USAHA",
  cara="Dua kepalan maju-mundur bergantian seperti mengayuh (bekerja keras menjalankan usaha), sambil mengucapkan 'usaha'.")

S("B14_UNTUNG", "Untung / laba", "Kerja", [
    k(0, p="netral+0.06*atas+0.20*depan", a="telapak", b="CLAW", j="depan+0.4*atas", tp="bawah"),
    k(0.15),
    k(0.55, p="dada_kanan+0.06*depan+-0.04*atas", b="S", j="atas+0.3*dalam", tp="belakang"),
    k(0.85),
], wajah="senang", ragu=True, gloss="UNTUNG",
  cara="Tangan cakar di depan menyambar lalu ditarik ke dada sambil mengepal (uang masuk), wajah senang, mengucapkan 'untung'.")

S("B14_RUGI", "Rugi", "Kerja", [
    k(0, p="dada_kanan+0.05*depan", a="telapak", b="S", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="netral+-0.08*atas+0.18*depan+0.05*luar", b="5", j="depan+0.6*bawah", tp="bawah"),
    k(0.85),
], wajah="sedih", ragu=True, gloss="RUGI",
  cara="Kepalan di dada dilepas membuka ke depan-bawah (uang terlepas), wajah sedih, mengucapkan 'rugi'.")

S("B14_PELANGGAN", "Pelanggan / pembeli", "Kerja", **_sym([
    k(0, p=A(-0.06, -0.52, 1.24), a="telapak", b="1", j="atas", tp="belakang"),
    k(0.15),
    k(0.6, p=A(-0.05, -0.36, 1.24)),
    k(0.85),
]), ragu=True, gloss="PELANGGAN",
  cara="Dua telunjuk tegak (orang) dari depan bergerak mendekat ke badan — orang-orang datang ke toko kita, sambil mengucapkan 'pelanggan'.")

S("B14_PROMOSI", "Promosi / iklan", "Kerja", [
    k(0, p="bahu_kanan+0.12*depan+0.14*atas+0.04*luar", a="telapak", b="FLAT", j="atas", tp="depan"),
    k(0.12),
    k(0.3, p="bahu_kanan+0.24*depan+0.14*atas"),
    k(0.45, p="bahu_kanan+0.12*depan+0.14*atas+0.04*luar"),
    k(0.62, p="bahu_kanan+0.24*depan+0.14*atas+0.06*dalam"),
    k(0.85),
], ragu=True, gloss="PROMOSI",
  cara="Telapak terbuka menghadap depan setinggi wajah didorong ke depan dua kali seperti memasang papan iklan, sambil mengucapkan 'promosi'.")

# ── Rumah sakit ───────────────────────────────────────────────────────────

S("B14_DAFTAR", "Mendaftar / daftar", "Rumah sakit", [
    k(0, p=_PAPAN + A(-0.05, -0.03, 0.06), a="ujung", b="U", j="dalam+0.4*depan", tp="bawah"),
    k(0.15, p=_PAPAN + A(-0.012, -0.01, 0.06)),
    k(0.4, p=_PAPAN + A(-0.012, -0.01, 0.0)),
    k(0.55, p=_PAPAN + A(-0.012, -0.01, -0.06)),
    k(0.8),
], L=_L_PAPAN, ragu=True, gloss="DAFTAR",
  cara="Ujung telunjuk & jari tengah menempel di telapak kiri yang tegak lalu turun (menuliskan nama di daftar), sambil mengucapkan 'daftar'.")

S("B14_ANTRE", "Antre", "Rumah sakit", [
    k(0, p=A(-0.03, -0.42, 1.24), a="telapak", b="4", j="atas", tp="dalam"),
    k(0.15),
    k(0.4, p=A(-0.03, -0.46, 1.24)),
    k(0.6, p=A(-0.03, -0.46, 1.24)),
    k(0.8, p=A(-0.03, -0.50, 1.24)),
    k(1.0),
], L=[k(0, p=A(0.03, -0.50, 1.24), a="telapak", b="4", j="atas", tp="dalam"),
      k(0.15), k(0.4, p=A(0.03, -0.54, 1.24)), k(0.8, p=A(0.03, -0.58, 1.24)), k(1.0)],
  ragu=True, gloss="ANTRE",
  cara="Dua tangan 4 (jari = orang berbaris) satu di depan yang lain, bergerak maju sedikit demi sedikit — orang mengantre.")

S("B14_NOMOR", "Nomor (antrean)", "Rumah sakit", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.06), a="telunjuk", b="1", j="depan+0.6*bawah+0.3*dalam", tp="dalam"),
    k(0.15, p=_ALAS + A(-0.01, -0.01, 0.015)),
    k(0.3, p=_ALAS + A(-0.03, -0.03, 0.015)),
    k(0.45, p=_ALAS + A(0.01, -0.05, 0.015)),
    k(0.6, p=_ALAS + A(-0.02, -0.06, 0.015)),
    k(0.85),
], L=_L_ALAS, ragu=True, gloss="NOMOR",
  cara="Telunjuk seperti menulis angka di telapak kiri (kertas nomor antrean), sambil mengucapkan 'nomor'.")

S("B14_PANGGIL", "Memanggil / panggilan", "Rumah sakit", [
    k(0, p="netral+0.10*atas+0.22*depan", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.13, 4, {"b": "BENT_B"}, {"b": "FLAT"}),
    k(0.65, p="netral+0.10*atas+0.12*depan", b="BENT_B"),
    k(0.85),
], ragu=True, gloss="PANGGIL",
  cara="Telapak menghadap bawah di depan, jari-jari dilambaikan ke bawah berulang (gerak 'sini' ala Indonesia), sambil mengucapkan 'panggil'.")

_LENGAN_KIRI = "bahu_kiri+0.07*depan+-0.10*atas+0.02*luar"
S("B14_PERAWAT", "Perawat", "Rumah sakit", [
    k(0, p=_LENGAN_KIRI + "+0.03*atas", a="ujung", b="1", j="dalam+0.3*bawah+0.3*depan", tp="bawah"),
    k(0.12),
    k(0.32, p=_LENGAN_KIRI + "+-0.03*atas"),
    k(0.45, p=_LENGAN_KIRI + "+0.025*dalam"),
    k(0.65, p=_LENGAN_KIRI + "+-0.025*dalam"),
    k(0.85),
], ragu=True, gloss="PERAWAT",
  cara="Telunjuk menggambar tanda tambah (+) di lengan atas kiri seperti lambang palang di seragam, sambil mengucapkan 'perawat'.")

S("B14_PASIEN", "Pasien", "Rumah sakit", [
    k(0, p=_ALAS + A(-0.01, -0.03, 0.10), a="ujung", b="V", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.5, p=_ALAS + A(-0.01, -0.03, 0.025)),
    k(0.8),
], L=_L_ALAS, wajah="sedih", ragu=True, gloss="PASIEN",
  cara="Tangan V (dua kaki) telentang lalu dibaringkan di telapak kiri (orang terbaring di ranjang), wajah sakit, sambil mengucapkan 'pasien'.")

S("B14_RESEP", "Resep obat", "Rumah sakit", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.04), a="ujung", b="BABY_O", j="depan+0.5*bawah+0.2*dalam", tp="dalam"),
    *bolak(0.1, 0.1, 4, {"p": _ALAS + A(-0.04, -0.03, 0.03)}, {"p": _ALAS + A(0.01, -0.05, 0.03)}),
    k(0.55, p="netral+0.06*atas+0.22*depan", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.85),
], L=_L_ALAS, ragu=True, gloss="RESEP",
  cara="Tangan seperti memegang pena menulis di telapak kiri, lalu disodorkan ke depan (kertas resep diberikan), sambil mengucapkan 'resep'.")

S("B14_SUNTIK", "Suntik", "Rumah sakit", [
    k(0, p="bahu_kiri+0.07*depan+-0.10*atas+0.03*luar", a="ujung", b="V", j="dalam+0.3*bawah", tp="atas"),
    k(0.15, p="bahu_kiri+0.07*depan+-0.10*atas+-0.02*luar"),
    k(0.4, b="U"),
    k(0.7),
], gloss="SUNTIK",
  cara="Telunjuk & jari tengah seperti memegang alat suntik ditusukkan di lengan atas kiri, lalu ditekan.")

S("B14_MUNTAH", "Muntah", "Rumah sakit", [
    k(0, p="mulut+0.04*depan", a="ujung", b="FLAT_O", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.5, p="mulut+0.18*depan+-0.14*atas", b="5", j="depan+0.6*bawah", tp="bawah"),
    k(0.8),
], wajah="sedih", gloss="MUNTAH",
  cara="Tangan kuncup di depan mulut dilempar membuka ke depan-bawah, wajah mual.")

# ── Kesehatan mental ──────────────────────────────────────────────────────

S("B14_STRES", "Stres", "Kesehatan mental", **_sym([
    k(0, p="pelipis+0.09*luar+0.03*depan+-0.04*atas", a="telapak", b="CLAW", j="atas+0.6*dalam+0.2*depan", tp="dalam"),
    *bolak(0.12, 0.09, 7, {"putar": -12}, {"putar": 12}),
    k(0.85, putar=0),
]), wajah="sedih", ragu=True, gloss="STRES",
  cara="Dua tangan cakar di samping kepala digetarkan (kepala penuh tekanan), wajah tegang, sambil mengucapkan 'stres'.")

S("B14_CEMAS", "Cemas / khawatir", "Kesehatan mental", [
    k(0, p="dada+0.03*depan+-0.03*atas", a="telapak", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    *bolak(0.1, 0.11, 6, {"p": "dada+0.03*depan+0.04*atas"}, {"p": "dada+0.03*depan+-0.03*atas"}),
    k(0.85),
], wajah="sedih", ragu=True, gloss="CEMAS",
  cara="Telapak di dada diusap naik-turun cepat berulang (hati tidak tenang), wajah khawatir, sambil mengucapkan 'cemas'.")

S("B14_DUKUNG", "Mendukung / dukungan", "Kesehatan mental", [
    k(0, p=A(0.0, -0.37, 1.13), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.55, p=A(0.0, -0.37, 1.25)),
    k(0.8),
], L=[k(0, p=A(0.01, -0.37, 1.17), a="punggung", b="S", j="atas", tp="kanan"),
      k(0.15), k(0.55, p=A(0.01, -0.37, 1.29)), k(0.8)],
  wajah="senang", ragu=True, gloss="DUKUNG",
  cara="Telapak kanan menopang kepalan kiri dari bawah lalu keduanya diangkat bersama — menopang orang lain, sambil mengucapkan 'dukung'.")

_eja("B14_KONSELOR", "Konselor / psikolog", "Kesehatan mental", "KONSELOR", ragu=True,
     tambah=" (tanyakan ke pengajar Tuli apakah di daerahmu ada isyarat sendiri).")

S("B14_TENANG", "Tenang", "Kesehatan mental", **_sym([
    k(0, p=A(-0.08, -0.32, 1.34), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.2),
    k(0.8, p=A(-0.08, -0.34, 1.20)),
    k(1.05),
]), kepala=[(0.2, 0, 0, 0), (0.8, 5, 0, 0)], ragu=True, gloss="TENANG",
  cara="Dua telapak menghadap bawah turun pelan dari dada ke perut sambil menghela napas, wajah tenang.")

# ── Bank & kantor layanan ────────────────────────────────────────────────

S("B14_REKENING", "Rekening / buku tabungan", "Bank", [
    k(0, p="netral+0.08*atas+0.20*depan", a="ujung", b="BABY_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.45, p=_ALAS + A(-0.01, -0.01, 0.02)),
    k(0.6, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
    k(0.85),
], L=_L_ALAS, ragu=True, gloss="REKENING",
  cara="Tangan menjepit 'uang' lalu meletakkannya di telapak kiri dan menutupnya seperti buku tabungan, sambil mengucapkan 'rekening'.")

_KARTU = [
    k(0, p=A(-0.02, -0.42, 1.31), a="ujung", b="L", j="atas+0.5*depan", tp="depan"),
    k(0.15),
    k(0.55, p=A(-0.07, -0.42, 1.31)),
    k(0.8),
]
S("B14_KARTU", "Kartu", "Bank", **_sym(_KARTU), ragu=True, gloss="KARTU",
  cara="Dua tangan L (telunjuk & ibu jari) dari tengah bergeser ke samping, menggambar persegi panjang kecil seukuran kartu.")

_FORM = [
    k(0, p=A(-0.02, -0.40, 1.34), a="ujung", b="1", j="depan+0.3*atas", tp="bawah"),
    k(0.12),
    k(0.35, p=A(-0.09, -0.40, 1.34)),
    k(0.65, p=A(-0.09, -0.40, 1.16)),
    k(0.85),
]
S("B14_FORMULIR", "Formulir", "Bank", **_sym(_FORM), ragu=True, gloss="FORMULIR",
  cara="Dua telunjuk menggambar selembar kertas (ke samping lalu ke bawah), sambil mengucapkan 'formulir'.")

S("B14_TANDA_TANGAN", "Tanda tangan", "Bank", [
    k(0, p=_ALAS + A(0.03, 0.0, 0.03), a="ujung", b="BABY_O", j="depan+0.6*bawah+0.2*dalam", tp="dalam"),
    k(0.12, p=_ALAS + A(0.02, 0.0, 0.015)),
    k(0.25, p=_ALAS + A(-0.01, -0.03, 0.015)),
    k(0.38, p=_ALAS + A(-0.02, 0.0, 0.015)),
    k(0.5, p=_ALAS + A(-0.05, -0.03, 0.015)),
    k(0.62, p=_ALAS + A(-0.07, -0.01, 0.015)),
    k(0.85),
], L=_L_ALAS, gloss="TANDA-TANGAN",
  cara="Tangan seperti memegang pena menggoreskan tanda tangan berlekuk di telapak kiri.")

S("B14_DOKUMEN", "Dokumen / berkas", "Bank", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.07), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
    k(0.15, p=_ALAS + A(-0.01, -0.01, 0.025)),
    k(0.3, p=_ALAS + A(-0.01, -0.01, 0.07)),
    k(0.45, p=_ALAS + A(-0.01, -0.01, 0.04)),
    k(0.75),
], L=_L_ALAS, ragu=True, gloss="DOKUMEN",
  cara="Telapak kanan ditumpuk di atas telapak kiri dua kali, makin tinggi (tumpukan berkas), sambil mengucapkan 'dokumen'.")

S("B14_SALINAN", "Salinan / fotokopi", "Bank", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.03), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(0.4, p=_ALAS + A(-0.01, -0.01, 0.10), tp="atas"),
    k(0.55, p=_ALAS + A(-0.01, -0.01, 0.03), tp="bawah"),
    k(0.75, p=_ALAS + A(-0.01, -0.01, 0.10), tp="atas"),
    k(0.95),
], L=_L_ALAS, ragu=True, gloss="SALINAN",
  cara="Telapak kanan di atas telapak kiri dibalik ke atas dua kali (kertas keluar dari mesin fotokopi), sambil mengucapkan 'salinan' atau 'fotokopi'.")

_eja("B14_KTP", "KTP (Kartu Tanda Penduduk)", "Dokumen", "KTP")

S("B14_INFORMASI", "Informasi", "Dokumen", [
    k(0, p="dahi+0.06*depan+0.02*luar+-0.03*atas", a="ujung", b="FLAT_O", j="atas+0.3*dalam+0.4*belakang", tp="dalam"),
    k(0.15),
    k(0.55, p="netral+0.10*atas+0.22*depan", b="5", j="depan+0.4*atas", tp="atas"),
    k(0.8),
], ragu=True, gloss="INFORMASI",
  cara="Tangan kuncup dari dahi dibawa ke depan sambil membuka, telapak ke atas (pengetahuan diberikan), sambil mengucapkan 'informasi'.")

S("B14_IZIN", "Izin / persetujuan", "Dokumen", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.09), a="pergelangan", b="S", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.4, p=_ALAS + A(-0.01, -0.01, 0.04)),
    k(0.7),
], L=_L_ALAS, kepala=ANGGUK, ragu=True, gloss="IZIN",
  cara="Kepalan diketuk ke telapak kiri seperti membubuhkan stempel, sambil mengangguk — disetujui/diizinkan.")

S("B14_KELUHAN", "Keluhan / mengeluh", "Dokumen", [
    k(0, p="dada+0.03*depan+-0.04*atas", a="telapak", b="CLAW", j="atas+0.3*dalam", tp="belakang"),
    k(0.12),
    k(0.3, p="dada+0.07*depan+-0.04*atas"),
    k(0.42, p="dada+0.03*depan+-0.04*atas"),
    k(0.6, p="dada+0.07*depan+-0.04*atas"),
    k(0.85),
], wajah="sedih", ragu=True, gloss="KELUHAN",
  cara="Tangan cakar mengetuk dada dua kali (ada yang mengganjal di hati), wajah tidak puas, sambil mengucapkan 'keluhan'.")

# ── Polisi & darurat ──────────────────────────────────────────────────────

S("B14_LAPOR", "Melapor / laporan", "Polisi", [
    k(0, p="dagu+0.05*depan", a="telapak", b="FLAT", j="atas+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p="netral+0.14*atas+0.24*depan", j="depan+0.4*atas", tp="dalam"),
    k(0.8),
], ragu=True, gloss="LAPOR",
  cara="Tangan datar tegak dari depan dagu didorong maju ke atas (menyampaikan ke petugas), sambil mengucapkan 'lapor'.")

S("B14_HILANG", "Hilang", "Polisi", [
    k(0, p="netral+0.08*atas+0.10*depan", a="telapak", b="5", j="atas+0.3*depan", tp="depan"),
    k(0.15),
    k(0.55, p="netral+0.02*atas+0.24*depan+0.04*luar", a="ujung", b="FLAT_O", j="depan", tp="bawah"),
    k(0.85),
], kepala=[(0.3, 0, 0, 0), (0.6, 0, 8, 0), (0.85, 0, 0, 0)], wajah="sedih", ragu=True, gloss="HILANG",
  cara="Tangan terbuka bergerak menjauh ke depan sambil menguncup (lenyap), wajah bingung, sambil mengucapkan 'hilang'.")

S("B14_CURI", "Mencuri / dicuri", "Polisi", [
    k(0, p=A(0.0, -0.36, 1.14), a="telapak", b="CLAW", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.45, p=A(-0.03, -0.34, 1.12), b="S"),
    k(0.7, p=A(-0.16, -0.26, 1.08)),
    k(0.9),
], L=[k(0, p=A(0.04, -0.33, 1.20), a="telapak", b="FLAT", j="dalam+0.4*depan", tp="bawah")],
  ragu=True, gloss="CURI",
  cara="Tangan cakar menyambar diam-diam dari bawah lengan kiri lalu mengepal dan ditarik ke samping (barang diambil), sambil mengucapkan 'curi'.")

S("B14_DOMPET", "Dompet", "Polisi", [
    k(0, p=A(-0.015, -0.38, 1.20), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.4, tp="atas+0.3*dalam"),
    k(0.6, tp="dalam"),
    k(0.85),
], L=[k(0, p=A(0.015, -0.38, 1.20), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
      k(0.15), k(0.4, tp="atas+0.3*dalam"), k(0.6, tp="dalam"), k(0.85)],
  ragu=True, gloss="DOMPET",
  cara="Dua telapak dirapatkan lalu dibuka dan ditutup seperti dompet lipat, sambil mengucapkan 'dompet'.")

S("B14_TAS", "Tas", "Polisi", [
    k(0, p="bahu_kanan+0.05*depan+-0.02*atas", a="telapak", b="S", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.45, p="bahu_kanan+0.05*depan+-0.08*atas"),
    k(0.6, p="bahu_kanan+0.05*depan+-0.03*atas"),
    k(0.85),
], ragu=True, gloss="TAS",
  cara="Kepalan memegang tali tas di bahu kanan dan menariknya sedikit ke bawah, sambil mengucapkan 'tas'.")

S("B14_DARURAT", "Darurat", "Polisi",
  [k(0, p="pelipis+0.11*luar+-0.07*atas+0.06*depan", a="telapak", b="C", j="atas+0.3*luar", tp="dalam")] +
  lingkar(0.1, 0.8, "pelipis+0.11*luar+-0.07*atas+0.06*depan", 0.02, "luar", "depan", n=8, mulai=0, putaran=2) + [k(0.95)],
  wajah="wh", ragu=True, gloss="DARURAT",
  cara="Tangan C di samping atas kepala diputar-putar seperti lampu sirene, alis berkerut, sambil mengucapkan 'darurat'.")

S("B14_PERINGATAN", "Peringatan", "Polisi", [
    k(0, p="bahu_kanan+0.12*depan+0.12*atas", a="telapak", b="1", j="atas", tp="depan+0.4*dalam"),
    *bolak(0.12, 0.12, 5, {"p": "bahu_kanan+0.16*depan+0.12*atas"}, {"p": "bahu_kanan+0.10*depan+0.12*atas"}),
    k(0.8),
], wajah="ya_tidak", ragu=True, gloss="PERINGATAN",
  cara="Telunjuk tegak di samping wajah digerakkan maju-mundur (awas!), alis naik, sambil mengucapkan 'peringatan'.")

S("B14_GETAR", "Getar / bergetar", "Polisi", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.05), a="telapak", b="5", j="dalam+0.5*depan", tp="bawah"),
    *bolak(0.08, 0.06, 12, {"p": _ALAS + A(-0.02, -0.01, 0.05)}, {"p": _ALAS + A(0.0, -0.01, 0.05)}),
    k(0.9),
], L=_L_ALAS, gloss="GETAR",
  cara="Tangan 5 di atas telapak kiri digetarkan cepat ke kiri-kanan — benda yang bergetar (HP, gempa, alarm getar).")

# ── Transportasi umum ─────────────────────────────────────────────────────

S("B14_BANDARA", "Bandara", "Transportasi", [
    k(0, p="netral+0.12*atas+0.04*luar+0.12*depan", a="telapak", b="ILY", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.6, p=_ALAS + A(-0.01, -0.03, 0.03)),
    k(0.85),
], L=_L_ALAS, ragu=True, gloss="BANDARA",
  cara="Tangan pesawat (ibu jari, telunjuk & kelingking terbuka) turun mendarat di telapak kiri, sambil mengucapkan 'bandara'.")

_eja("B14_TERMINAL", "Terminal (bus)", "Transportasi", "TERMINAL", ragu=True,
     tambah=" — atau BUS + tempat; tanyakan isyarat setempat ke pengajar Tuli.")

S("B14_JADWAL", "Jadwal", "Transportasi", [
    k(0, p=_PAPAN + A(-0.03, -0.02, 0.07), a="ujung", b="4", j="dalam+0.3*depan", tp="bawah+0.5*dalam"),
    k(0.12),
    k(0.4, p=_PAPAN + A(-0.03, -0.02, -0.07)),
    k(0.55, p=_PAPAN + A(-0.03, -0.02, 0.05), b="1", j="atas", tp="dalam"),
    k(0.8, p=_PAPAN + A(-0.03, -0.06, 0.05)),
    k(0.95),
], L=_L_PAPAN, ragu=True, gloss="JADWAL",
  cara="Jari-jari menggaris turun di telapak kiri yang tegak lalu telunjuk menggaris mendatar — garis-garis tabel jadwal, sambil mengucapkan 'jadwal'.")

S("B14_BATAL", "Batal", "Transportasi", [
    k(0, p=_PAPAN + A(-0.025, -0.012, 0.05), a="ujung", b="1", j="dalam+0.3*depan+0.3*bawah", tp="bawah"),
    k(0.12),
    k(0.32, p=_PAPAN + A(-0.025, -0.07, -0.05)),
    k(0.42, p=_PAPAN + A(-0.025, -0.07, 0.05)),
    k(0.62, p=_PAPAN + A(-0.025, -0.012, -0.05)),
    k(0.85),
], L=_L_PAPAN, kepala=GELENG, ragu=True, gloss="BATAL",
  cara="Telunjuk mencoret silang (X) di telapak kiri yang tegak sambil menggeleng, mengucapkan 'batal'.")

S("B14_TUNDA", "Tunda / ditunda", "Transportasi", **_sym([
    k(0, p=A(-0.06, -0.36, 1.26), a="ujung", b="BABY_O", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.4, p=A(-0.06, -0.46, 1.27)),
    k(0.55),
    k(0.8, p=A(-0.06, -0.54, 1.28)),
    k(0.95),
]), ragu=True, gloss="TUNDA",
  cara="Dua tangan menjepit (seperti memegang sesuatu) didorong maju dua tahap — dipindah ke waktu nanti, sambil mengucapkan 'tunda'.")
