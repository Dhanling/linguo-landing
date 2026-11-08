# [isyarat-b1b2-v1] Kamus isyarat BISINDO B2.5 "Hak, Aksesibilitas & Pendidikan Tuli".
# Tangan dominan kanan. Format sama dengan kamus_bisindo.py / kamus_bisindo_a2_4.py.
# ⚠️ Rujukan daring untuk kosakata hak & layanan BISINDO hampir tidak ada; bentuk di sini ditulis
#    dari prinsip ikonik umum BISINDO + gerak bibir dan HAMPIR SEMUA ditandai ragu=True —
#    WAJIB dicek pengajar Tuli (variasi daerah besar). Bentuk ASL sengaja TIDAK disalin.
#    Istilah teknis (otomatis, akomodasi, advokasi, moderator) dieja jari.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
_DINDING = A(0.02, -0.36, 1.27)
_L_DINDING = [k(0, p=_DINDING, a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")]
_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"
_TELUNJUK_DAHI = dict(a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang")


def _sym(keys):
    return dict(R=keys, L=cermin(keys))


# ── Model sosial & hak ─────────────────────────────────────────────────────

S("B25_HAMBATAN", "Hambatan / penghalang", "Hak", [
    k(0, p=A(-0.14, -0.40, 1.26), a="ujung", b="FLAT", j="depan+0.4*dalam", tp="bawah+0.5*dalam"),
    k(0.15),
    k(0.45, p=A(-0.03, -0.38, 1.27)),
    k(0.6, p=A(-0.05, -0.40, 1.27)),
    k(0.85),
], L=[k(0, p=A(0.03, -0.40, 1.27), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam+0.3*belakang")],
  wajah="sedih", gloss="HAMBATAN",
  cara="Tangan kiri tegak seperti dinding; tangan kanan bergerak maju lalu terbentur dan terhenti, sambil mengucapkan 'hambatan'.",
  ragu=True)

S("B25_LINGKUNGAN", "Lingkungan / sekitar", "Hak",
  [k(0, p=A(0.03, -0.30, 1.26), a="ujung", b="5", j="depan+0.3*atas", tp="bawah")] +
  lingkar(0.12, 0.85, A(0.03, -0.38, 1.24), 0.09, "depan", "luar", n=10, mulai=-90, putaran=1) + [k(1.0)],
  L=[k(0, p=A(0.03, -0.37, 1.22), a="telapak", b="1", j="atas", tp="dalam")],
  gloss="LINGKUNGAN",
  cara="Telunjuk kiri tegak (diri kita); tangan kanan terbuka memutari sekelilingnya — semua yang ada di sekitar.", ragu=True)

S("B25_KASIHAN", "Kasihan / belas kasihan", "Hak", [
    k(0, p="dada+0.03*depan", a="telapak", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
    *lingkar(0.12, 0.7, "dada+0.025*depan", 0.03, "luar", "atas", n=8, mulai=0, putaran=1),
    k(0.85),
], kepala=[(0.1, 0, 0, 0), (0.4, 0, 0, -8), (0.85, 0, 0, 0)], wajah="sedih", gloss="KASIHAN",
  cara="Telapak mengusap memutar di dada dengan kepala sedikit miring dan wajah iba, sambil mengucapkan 'kasihan'.", ragu=True)

S("B25_SETARA", "Setara / sejajar", "Hak", **_sym([
    k(0, p=A(-0.05, -0.32, 1.24), a="telapak", b="FLAT", j="depan+0.2*dalam", tp="bawah"),
    k(0.15),
    k(0.55, p=A(-0.05, -0.46, 1.24)),
    k(0.8),
]), gloss="SETARA",
  cara="Dua tangan datar telapak ke bawah sejajar, didorong maju bersama pada ketinggian yang sama — sederajat.", ragu=True)

S("B25_ADIL", "Adil", "Hak", **_sym([
    k(0, p=A(-0.10, -0.36, 1.24), a="telapak", b="FLAT", j="depan+0.3*luar", tp="atas"),
    k(0.12),
    k(0.3, p=A(-0.10, -0.36, 1.28)),
    k(0.48, p=A(-0.10, -0.36, 1.21)),
    k(0.7, p=A(-0.10, -0.36, 1.24)),
    k(0.9),
]), gloss="ADIL",
  cara="Dua telapak menghadap atas seperti piring timbangan, bergoyang lalu berhenti sama tinggi — seimbang, sambil mengucapkan 'adil'.",
  ragu=True)

S("B25_DISKRIMINASI", "Diskriminasi / dibeda-bedakan", "Hak", [
    k(0, p=A(-0.03, -0.38, 1.27), a="telapak", b="FLAT", j="atas+0.3*depan", tp="luar"),
    k(0.15),
    k(0.5, p=A(-0.18, -0.36, 1.26), tp="luar+0.3*bawah"),
    k(0.8),
], L=[k(0, p=A(0.03, -0.38, 1.25), a="telapak", b="1", j="atas", tp="dalam")],
  wajah="sedih", gloss="DISKRIMINASI",
  cara="Telunjuk kiri tegak (seseorang); telapak kanan di sampingnya mendorong menjauh ke samping — disisihkan, wajah tidak senang.",
  ragu=True)

# ── Informasi & komunikasi ─────────────────────────────────────────────────

S("B25_INFORMASI", "Informasi", "Akses", **_sym([
    k(0, p="pelipis+0.07*depan+0.03*luar", a="ujung", b="FLAT_O", j="atas+0.4*dalam+0.3*belakang", tp="dalam"),
    k(0.15),
    k(0.55, p="netral+0.10*atas+0.20*depan+0.06*luar", b="5", j="depan+0.3*atas", tp="bawah"),
    k(0.8),
]), gloss="INFORMASI",
  cara="Dua tangan kuncup dari dekat dahi bergerak maju dan membuka — kabar disebarkan, sambil mengucapkan 'informasi'.", ragu=True)

_KOM_R = [k(0, p=A(-0.05, -0.32, 1.30), a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah"),
          *bolak(0.12, 0.16, 5, {"p": A(-0.05, -0.46, 1.30)}, {"p": A(-0.05, -0.32, 1.30)}), k(0.95)]
_KOM_L = [k(0, p=A(-0.05, -0.46, 1.24), a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah"),
          *bolak(0.12, 0.16, 5, {"p": A(-0.05, -0.32, 1.24)}, {"p": A(-0.05, -0.46, 1.24)}), k(0.95)]
S("B25_KOMUNIKASI", "Komunikasi", "Akses", R=_KOM_R, L=cermin(_KOM_L), gloss="KOMUNIKASI",
  cara="Dua telunjuk bergerak maju-mundur bergantian — pesan bolak-balik antara dua orang, sambil mengucapkan 'komunikasi'.",
  ragu=True)

_LAYAR = [
    k(0, p=A(-0.02, -0.40, 1.34), a="ujung", b="1", j="depan+0.3*atas", tp="bawah"),
    k(0.12),
    k(0.4, p=A(-0.14, -0.40, 1.34)),
    k(0.7, p=A(-0.14, -0.40, 1.20)),
    k(0.95, p=A(-0.02, -0.40, 1.20)),
    k(1.05),
]
S("B25_LAYAR", "Layar", "Akses", **_sym(_LAYAR), gloss="LAYAR",
  cara="Dua telunjuk dari tengah atas menggambar persegi panjang besar di depan — bingkai layar.", ragu=True)

S("B25_APLIKASI", "Aplikasi (di HP)", "Akses", [
    k(0, p=_DINDING + A(-0.02, -0.03, 0.04), a="ujung", b="1", j="dalam+0.3*depan", tp="bawah"),
    k(0.12, p=_DINDING + A(-0.012, -0.03, 0.04)),
    k(0.3, p=_DINDING + A(-0.03, -0.06, 0.0)),
    k(0.42, p=_DINDING + A(-0.012, -0.06, 0.0)),
    k(0.6, p=_DINDING + A(-0.03, -0.03, -0.04)),
    k(0.72, p=_DINDING + A(-0.012, -0.03, -0.04)),
    k(0.9),
], L=_L_DINDING, gloss="APLIKASI",
  cara="Telapak kiri tegak seperti layar HP; telunjuk kanan mengetuk beberapa titik seperti membuka ikon aplikasi.", ragu=True)

S("B25_OTOMATIS", "Otomatis", "Akses", [], gloss="OTOMATIS", cara="Dieja jari: O-T-O-M-A-T-I-S.")
S("B25_AKOMODASI", "Akomodasi (penyesuaian yang wajar)", "Kerja", [], gloss="AKOMODASI",
  cara="Dieja jari: A-K-O-M-O-D-A-S-I; dalam percakapan sering dijelaskan dengan isyarat penyesuaian/bantuan.")
S("B25_ADVOKASI", "Advokasi", "Advokasi", [], gloss="ADVOKASI", cara="Dieja jari: A-D-V-O-K-A-S-I.")
S("B25_MODERATOR", "Moderator", "Diskusi", [], gloss="MODERATOR", cara="Dieja jari: M-O-D-E-R-A-T-O-R.")

# ── Layanan & pendampingan ─────────────────────────────────────────────────

S("B25_PEMERINTAH", "Pemerintah", "Layanan", [
    k(0, p="pelipis+0.06*depan+0.04*luar", a="sisi_telunjuk", b="FLAT", j="atas+0.4*dalam", tp="bawah+0.4*depan"),
    k(0.15, p="pelipis+0.03*depan+0.02*luar"),
    k(0.45),
    k(0.75, p="netral+0.10*atas+0.10*depan", b="S", j="atas", tp="dalam"),
    k(0.95),
], gloss="PEMERINTAH",
  cara="Tangan datar di pelipis seperti memberi hormat, lalu turun mengepal di depan — lembaga resmi negara, sambil mengucapkan 'pemerintah'.",
  ragu=True)

S("B25_LAYANAN", "Layanan / melayani", "Layanan", R=[
    k(0, p=A(-0.06, -0.32, 1.22), a="telapak", b="FLAT", j="depan", tp="atas"),
    *bolak(0.12, 0.16, 5, {"p": A(-0.06, -0.44, 1.24)}, {"p": A(-0.06, -0.32, 1.22)}), k(0.95)],
  L=cermin([k(0, p=A(-0.06, -0.44, 1.24), a="telapak", b="FLAT", j="depan", tp="atas"),
            *bolak(0.12, 0.16, 5, {"p": A(-0.06, -0.32, 1.22)}, {"p": A(-0.06, -0.44, 1.24)}), k(0.95)]),
  gloss="LAYANAN",
  cara="Dua telapak menghadap atas bergerak maju-mundur bergantian seperti menyajikan sesuatu, sambil mengucapkan 'layanan'.", ragu=True)

S("B25_PENDAMPING", "Pendamping / mendampingi", "Layanan", [
    k(0, p=A(-0.06, -0.32, 1.24), a="telapak", b="1", j="atas", tp="dalam"),
    k(0.15),
    k(0.65, p=A(-0.06, -0.46, 1.24)),
    k(0.9),
], L=[k(0, p=A(0.0, -0.32, 1.24), a="telapak", b="1", j="atas", tp="dalam"),
      k(0.15), k(0.65, p=A(0.0, -0.46, 1.24)), k(0.9)],
  gloss="PENDAMPING",
  cara="Dua telunjuk tegak berdampingan bergerak maju bersama — dua orang berjalan berdampingan.", ragu=True)

S("B25_DUKUNG", "Dukung / dukungan", "Layanan", [
    k(0, p=_ALAS + A(0, -0.01, -0.035), a="punggung", b="S", j="depan+0.3*dalam", tp="atas"),
    k(0.12),
    k(0.55, p=_ALAS + A(0, -0.01, 0.10)),
    k(0.8),
], L=[k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
      k(0.12), k(0.55, p=_ALAS + A(0, 0, 0.12)), k(0.8)],
  gloss="DUKUNG",
  cara="Kepalan kanan menopang telapak kiri dari bawah lalu keduanya naik bersama — mengangkat/menopang, sambil mengucapkan 'dukung'.",
  ragu=True)

S("B25_CATAT", "Mencatat / catatan", "Pendidikan", [
    k(0, p=_ALAS + A(0.01, 0.01, 0.025), a="ujung", b="BABY_O", j="bawah+0.3*depan", tp="belakang"),
    *bolak(0.1, 0.1, 6, {"p": _ALAS + A(-0.03, -0.02, 0.02)}, {"p": _ALAS + A(0.01, -0.04, 0.02)}),
    k(0.8),
], L=_L_ALAS, gloss="CATAT",
  cara="Jari kanan seperti memegang pena menulis cepat bolak-balik di telapak kiri, sambil mengucapkan 'catat'.", ragu=True)

S("B25_BAYI", "Bayi / sejak bayi", "Keluarga", **_sym([
    k(0, p=A(-0.06, -0.26, 1.18), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="atas"),
    k(0.12),
    k(0.32, p=A(-0.09, -0.27, 1.21)),
    k(0.5, p=A(-0.03, -0.27, 1.17)),
    k(0.7, p=A(-0.09, -0.27, 1.21)),
    k(0.9),
]), gloss="BAYI",
  cara="Dua lengan seperti menggendong bayi diayun pelan ke kiri-kanan.", ragu=True)

# ── Teknologi bantu ────────────────────────────────────────────────────────

S("B25_ALAT_BANTU_DENGAR", "Alat bantu dengar", "Teknologi bantu", [
    k(0, p="telinga+0.04*luar+0.04*depan", a="ujung", b="X", j="belakang+0.4*atas", tp="dalam"),
    k(0.15, p="telinga+0.02*luar+0.01*depan+0.02*atas"),
    k(0.4),
    k(0.55, p="telinga+0.03*luar+0.03*depan+0.02*atas"),
    k(0.7, p="telinga+0.02*luar+0.01*depan+0.02*atas"),
    k(0.9),
], gloss="ALAT-BANTU-DENGAR",
  cara="Telunjuk bengkok (X) dikaitkan di atas-belakang telinga seperti memasang alat bantu dengar.", ragu=True)

S("B25_IMPLAN", "Implan koklea", "Teknologi bantu", [
    k(0, p="telinga+0.06*luar+0.02*atas", a="ujung", b="V", j="dalam+0.3*atas", tp="belakang"),
    k(0.15, p="telinga+0.025*luar+0.04*atas+0.03*belakang"),
    k(0.35, p="telinga+0.04*luar+0.04*atas+0.03*belakang"),
    k(0.5, p="telinga+0.025*luar+0.04*atas+0.03*belakang"),
    k(0.8),
], gloss="IMPLAN",
  cara="Ujung jari V diketukkan di kepala atas-belakang telinga — letak magnet implan koklea, sambil mengucapkan 'implan'.", ragu=True)

S("B25_PUTUS", "Memutuskan / keputusan", "Teknologi bantu", [
    k(0, p=_DAHI + "+0.04*depan", **_TELUNJUK_DAHI),
    k(0.15, p=_DAHI),
    k(0.3),
    k(0.5, p=_ALAS + A(-0.01, -0.01, 0.12), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.68, p=_ALAS + A(-0.01, -0.01, 0.015)),
    k(0.9),
], L=_L_ALAS, kepala=[(0.5, 0, 0, 0), (0.68, 8, 0, 0), (0.9, 0, 0, 0)], gloss="PUTUS",
  cara="Telunjuk menyentuh pelipis (berpikir), lalu sisi tangan datar dijatuhkan mantap ke telapak kiri — sudah diputuskan.",
  ragu=True)

# ── Kerja, hukum, kesehatan ────────────────────────────────────────────────

S("B25_KESEMPATAN", "Kesempatan / peluang", "Kerja", **_sym([
    k(0, p=A(-0.02, -0.38, 1.26), a="telapak", b="FLAT", j="atas", tp="depan+0.6*dalam"),
    k(0.15),
    k(0.5, p=A(-0.10, -0.40, 1.26), j="atas+0.3*depan", tp="depan"),
    k(0.65, p=A(-0.10, -0.36, 1.26), j="depan", tp="atas"),
    k(0.85),
]), wajah="senang", gloss="KESEMPATAN",
  cara="Dua telapak membuka ke samping seperti pintu terbuka, lalu menghadap atas menyambut — ada peluang, sambil mengucapkan 'kesempatan'.",
  ragu=True)

S("B25_TANTANGAN", "Tantangan", "Kerja", **_sym([
    k(0, p=A(-0.12, -0.36, 1.26), a="buku", b="S", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.4, p=A(-0.035, -0.38, 1.26)),
    k(0.55, p=A(-0.06, -0.38, 1.26)),
    k(0.7, p=A(-0.035, -0.38, 1.26)),
    k(0.9),
]), wajah="sedih", gloss="TANTANGAN",
  cara="Dua kepalan saling berhadapan bergerak mendekat dan beradu dua kali — kekuatan yang saling menekan, sambil mengucapkan 'tantangan'.",
  ragu=True)

S("B25_HUKUM", "Hukum / pengadilan", "Hukum", [
    k(0, p=_ALAS + A(0, -0.01, 0.12), a="sisi_kelingking", b="S", j="dalam+0.3*depan", tp="dalam"),
    k(0.15, p=_ALAS + A(0, -0.01, 0.04)),
    k(0.3, p=_ALAS + A(0, -0.01, 0.12)),
    k(0.45, p=_ALAS + A(0, -0.01, 0.04)),
    k(0.75),
], L=_L_ALAS, gloss="HUKUM",
  cara="Kepalan kanan diketukkan dua kali ke telapak kiri seperti palu hakim, sambil mengucapkan 'hukum'.", ragu=True)

S("B25_SALAH_PAHAM", "Salah paham", "Hukum", [
    k(0, p=_DAHI + "+0.04*depan", **_TELUNJUK_DAHI),
    k(0.15, p=_DAHI),
    k(0.3),
    k(0.55, p="pelipis+0.09*depan+0.07*luar", a="telunjuk", b="V", j="atas+0.4*depan", tp="depan"),
    k(0.75, putar=180),
    k(0.95),
], kepala=[(0.3, 0, 0, 0), (0.6, 0, 10, 0), (0.75, 0, -10, 0), (0.95, 0, 0, 0)], wajah="sedih", gloss="SALAH-PAHAM",
  cara="Telunjuk di pelipis lalu berubah menjadi V yang dibalik di depan dahi sambil menggeleng — maksud tertukar.", ragu=True)

# ── Advokasi & audit ───────────────────────────────────────────────────────

S("B25_MENYUARAKAN", "Menyuarakan / memperjuangkan pendapat", "Advokasi", [
    k(0, p="mulut+0.06*depan+0.02*bawah", a="ujung", b="FLAT_O", j="atas+0.5*belakang+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p="netral+0.30*atas+0.10*depan+0.06*luar", b="5", j="atas+0.3*depan", tp="depan"),
    k(0.9),
], gloss="MENYUARAKAN",
  cara="Tangan kuncup dari depan mulut naik tinggi dan membuka — pesan diangkat agar didengar banyak orang.", ragu=True)

S("B25_MASALAH", "Masalah", "Advokasi", [
    k(0, p=A(-0.04, -0.36, 1.27), a="buku", b="BENT_V", j="dalam+0.3*depan", tp="bawah"),
    *bolak(0.12, 0.14, 5, {"putar": 25}, {"putar": -25}),
    k(0.85, putar=0),
], L=[k(0, p=A(0.03, -0.36, 1.23), a="buku", b="BENT_V", j="dalam+0.3*depan", tp="atas")],
  wajah="sedih", gloss="MASALAH",
  cara="Buku jari V bengkok kanan menggerus buku jari V bengkok kiri dengan putaran pergelangan, wajah berkerut, sambil mengucapkan 'masalah'.",
  ragu=True)

S("B25_PERBAIKI", "Memperbaiki / perbaikan", "Advokasi", [
    k(0, p=A(-0.03, -0.37, 1.27), a="telapak", b="S", j="depan+0.3*dalam", tp="dalam"),
    *bolak(0.12, 0.14, 5, {"putar": -40}, {"putar": 20}),
    k(0.85, putar=0),
], L=[k(0, p=A(0.03, -0.37, 1.24), a="telapak", b="S", j="depan+0.3*dalam", tp="dalam")],
  gloss="PERBAIKI",
  cara="Dua kepalan bertumpuk; kepalan kanan memutar seperti mengencangkan baut, sambil mengucapkan 'perbaiki'.", ragu=True)

S("B25_TEMUAN", "Temuan / menemukan", "Audit", [
    k(0, p=_ALAS + A(0, -0.02, 0.06), a="ujung", b="5", j="bawah+0.3*depan", tp="bawah"),
    k(0.15, p=_ALAS + A(0, -0.02, 0.02)),
    k(0.3, b="F"),
    k(0.65, p="netral+0.10*atas+0.06*depan", j="atas+0.3*depan", tp="dalam"),
    k(0.9),
], L=_L_ALAS, wajah="senang", gloss="TEMUAN",
  cara="Jari kanan memungut sesuatu kecil dari telapak kiri lalu mengangkatnya untuk diperlihatkan — sesuatu yang ditemukan.",
  ragu=True)

S("B25_LAPORAN", "Laporan / melapor", "Audit", [
    k(0, p="dada+0.06*depan", a="telapak", b="FLAT", j="atas+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.6, p="netral+0.22*depan+0.06*atas", j="atas+0.4*depan", tp="belakang+0.3*bawah"),
    k(0.85),
], L=[k(0, p=A(0.04, -0.30, 1.28), a="telapak", b="FLAT", j="atas+0.3*depan", tp="belakang"),
      k(0.15), k(0.6, p=A(0.04, -0.44, 1.30)), k(0.85)],
  gloss="LAPORAN",
  cara="Dua telapak tegak menghadap diri seperti memegang lembaran, lalu disodorkan ke depan — menyerahkan laporan.", ragu=True)

S("B25_MASUKAN", "Masukan / umpan balik", "Audit", [
    k(0, p="netral+0.22*depan+0.04*atas", a="ujung", b="FLAT_O", j="belakang", tp="bawah"),
    k(0.15),
    k(0.55, p="dada+0.06*depan+0.04*atas"),
    k(0.85),
], gloss="MASUKAN",
  cara="Tangan kuncup dari depan bergerak masuk ke arah dada — saran yang diterima, sambil mengucapkan 'masukan'.", ragu=True)

S("B25_DISKUSI", "Diskusi", "Diskusi", [
    k(0, p=_ALAS + A(0, -0.01, 0.07), a="ujung", b="1", j="bawah+0.3*depan", tp="belakang"),
    k(0.12, p=_ALAS + A(0, -0.01, 0.02)),
    k(0.27, p=_ALAS + A(-0.03, -0.05, 0.07)),
    k(0.4, p=_ALAS + A(-0.03, -0.05, 0.02)),
    k(0.55, p=_ALAS + A(0.02, -0.06, 0.07)),
    k(0.68, p=_ALAS + A(0.02, -0.06, 0.02)),
    k(0.9),
], L=_L_ALAS, gloss="DISKUSI",
  cara="Ujung telunjuk mengetuk beberapa titik berbeda di telapak kiri — poin demi poin dibahas, sambil mengucapkan 'diskusi'.",
  ragu=True)

S("B25_TANPA", "Tanpa", "Advokasi", [
    k(0, p=A(-0.04, -0.38, 1.26), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.5, p=A(-0.16, -0.38, 1.20), j="depan+0.5*luar", tp="bawah+0.5*luar"),
    k(0.75),
], kepala=[(0.15, 0, 0, 0), (0.35, 0, 10, 0), (0.55, 0, -10, 0), (0.75, 0, 0, 0)], gloss="TANPA",
  cara="Tangan datar telapak ke bawah disapukan ke samping-bawah sambil menggeleng — tidak disertakan, sambil mengucapkan 'tanpa'.",
  ragu=True)

# ── Kata umum yang sering muncul di dialog B2.5 (belum ada di kamus A1–A2) ──

S("B25_ADA", "Ada / tersedia", "Umum", [
    k(0, p="netral+0.06*atas+0.04*depan", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.45, p="netral+0.04*depan+0.02*bawah"),
    k(0.75),
], kepala=[(0.2, 0, 0, 0), (0.45, 6, 0, 0), (0.75, 0, 0, 0)], gloss="ADA",
  cara="Telapak menghadap bawah ditekan turun sekali di depan badan sambil mengangguk kecil — 'ada di sini', sambil mengucapkan 'ada'.",
  ragu=True)

S("B25_CEPAT", "Cepat", "Umum", [
    k(0, p="netral+0.06*atas+0.04*depan", a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah"),
    k(0.12),
    k(0.3, p="netral+0.06*atas+0.06*depan+0.16*luar", j="depan+0.6*luar"),
    k(0.6),
], gloss="CEPAT",
  cara="Telunjuk disentakkan cepat ke samping, sambil mengucapkan 'cepat' dengan wajah tegas.", ragu=True)

S("B25_BICARA", "Bicara (lisan)", "Umum", [
    k(0, p="mulut+0.05*depan+0.02*bawah", a="ujung", b="1", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.12, 5, {"p": "mulut+0.11*depan+0.02*bawah"}, {"p": "mulut+0.05*depan+0.02*bawah"}),
    k(0.85),
], gloss="BICARA",
  cara="Telunjuk di depan mulut bergerak maju-mundur berulang — mulut yang berbicara (lisan).", ragu=True)

S("B25_SUARA", "Suara / bunyi", "Umum", [
    k(0, p="mulut+0.05*depan+0.02*bawah", a="ujung", b="FLAT_O", j="atas+0.5*belakang+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.45, p="mulut+0.20*depan+0.15*luar+0.05*bawah", b="5", j="depan+0.4*luar", tp="bawah"),
    *bolak(0.55, 0.1, 3, {"putar": 20}, {"putar": -20}),
    k(0.9, putar=0),
], gloss="SUARA",
  cara="Tangan kuncup dari depan mulut membuka ke depan-samping dan bergetar — bunyi yang menyebar.", ragu=True)

S("B25_PRIBADI", "Pribadi / urusan sendiri", "Umum", [
    k(0, p="dada+0.05*depan", a="telapak", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
    k(0.12, p="dada+0.012*depan"),
    k(0.27, p="dada+0.04*depan"),
    k(0.4, p="dada+0.012*depan"),
    k(0.7),
], gloss="PRIBADI",
  cara="Telapak menepuk dada dua kali — milik/urusan diri sendiri, sambil mengucapkan 'pribadi'.", ragu=True)
