# [isyarat-b1b2-v1] Kamus isyarat BISINDO B2.6 "Juru Bahasa, Relawan & Pendamping".
# Peran & etika JBI (kerahasiaan, netralitas, batas peran), kerja tim juru bahasa, relawan,
# pendamping, sekutu (ally), situasi sulit (duka, konflik), acara formal & rapat daring.
# Tangan dominan = kanan (R), tangan pasif = kiri (L).
#
# ⚠️ Rujukan tertulis BISINDO untuk kosakata B2.6 praktis tidak ada (kamus/dataset terbuka
#    umumnya hanya abjad, angka & kosakata dasar). Bentuk di sini ditulis dari prinsip ikonik
#    umum BISINDO + gerak bibir dan HAMPIR SEMUA ditandai ragu=True — WAJIB dicek pengajar Tuli
#    (variasi daerah besar). Bentuk ASL sengaja TIDAK disalin.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # jempol tegak, jari lain menggenggam (hebat / ahli)
    "B26_JEMPOL": (I._jari(_G), "tegak"),
})

# telapak kiri datar menghadap atas di depan badan (alas)
_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
# telapak kiri tegak menghadap kanan (dinding/papan)
_DINDING = A(0.04, -0.36, 1.26)
_L_DINDING = [k(0, p=_DINDING, a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")]
_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"
_TELUNJUK_DAHI = dict(a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang")


def _sym(keys):
    return dict(R=keys, L=cermin(keys))


# ── Peran juru bahasa ─────────────────────────────────────────────────────

S("B26_PERAN", "Peran / tugas", "Peran", [
    k(0, p="dada_kanan+0.02*depan", a="telapak", b="FLAT", j="atas+0.4*dalam", tp="belakang"),
    k(0.15),
    k(0.3, p="dada_kanan+0.035*depan"),
    k(0.45, p="dada_kanan+0.02*depan"),
    k(0.85, p="netral+0.10*atas+0.14*depan", j="depan+0.4*atas", tp="atas+0.4*dalam"),
    k(1.0),
], gloss="PERAN", ragu=True,
  cara="Telapak menepuk dada kanan (diri sendiri), lalu maju terbuka ke depan — tugas yang dijalankan; sambil mengucapkan 'peran'.")

S("B26_JEMBATAN", "Menjembatani / penghubung", "Peran", [
    k(0, p="netral_kiri+0.04*atas+0.06*depan", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="bawah"),
    k(0.15),
    k(0.45, p="tengah+0.12*atas+0.08*depan"),
    k(0.75, p="netral+0.04*atas+0.06*depan+0.04*luar"),
    k(0.95),
], gloss="JEMBATAN", ragu=True,
  cara="Tangan datar telapak ke bawah melengkung dari kiri ke kanan seperti jembatan yang menghubungkan dua sisi.")

_PENDAMPING = [
    k(0, p=A(-0.03, -0.30, 1.24), a="telapak", b="1", j="atas", tp="dalam"),
    k(0.15),
    k(0.7, p=A(-0.03, -0.46, 1.24)),
    k(0.9),
]
S("B26_PENDAMPING", "Pendamping / mendampingi", "Peran", **_sym(_PENDAMPING), gloss="PENDAMPING", ragu=True,
  cara="Dua telunjuk tegak berdampingan (dua orang) bergerak maju bersama — berjalan di samping, bukan di depan.")

S("B26_RELAWAN", "Relawan / sukarela", "Peran", [
    k(0, p="dada+0.03*depan", a="telapak", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.7, p="netral+0.06*atas+0.20*depan", j="depan+0.3*atas", tp="atas"),
    k(0.9),
], wajah="senang", gloss="RELAWAN", ragu=True,
  cara="Telapak di dada lalu maju terbuka ke depan (menawarkan diri dengan rela), wajah ramah; sambil mengucapkan 'relawan'.")

S("B26_SEKUTU", "Sekutu / ally / pendukung", "Peran", [
    k(0, p=A(-0.035, -0.32, 1.26), a="telapak", b="S", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.035, -0.44, 1.30)),
    k(0.85),
], L=cermin([k(0, p=A(-0.035, -0.32, 1.26), a="telapak", b="S", j="atas+0.3*depan", tp="dalam"),
             k(0.15), k(0.6, p=A(-0.035, -0.44, 1.30)), k(0.85)]),
  gloss="SEKUTU", ragu=True,
  cara="Dua kepalan berdampingan rapat lalu maju bersama dengan mantap — berdiri di pihak yang sama.")

S("B26_DUKUNG", "Mendukung / memperkuat", "Peran", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.05), a="punggung", b="S", j="atas", tp="dalam"),
    k(0.15),
    k(0.6, p=_ALAS + A(-0.01, -0.01, 0.20)),
    k(0.85),
], L=[k(0, p=_ALAS + A(0.0, 0.0, 0.0), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas"),
      k(0.15), k(0.6, p=_ALAS + A(0.0, 0.0, 0.15)), k(0.85)],
  gloss="DUKUNG", ragu=True,
  cara="Telapak kiri menopang kepalan kanan dari bawah lalu keduanya naik — mengangkat dan menguatkan.")

S("B26_AHLI", "Ahli / mahir", "Peran", [
    k(0, p="dagu+0.05*depan+0.02*bawah", a="telapak", b="B26_JEMPOL", j="atas+0.2*depan", tp="dalam"),
    k(0.15),
    k(0.6, p="dagu+0.22*depan+0.04*bawah"),
    k(0.85),
], kepala=[(0.2, 0, 0, 0), (0.6, 6, 0, 0)], gloss="AHLI", ragu=True,
  cara="Jempol tegak dari depan dagu didorong mantap ke depan sambil mengangguk — orang yang sangat mahir.")

S("B26_TIM", "Tim / kerja sama", "Peran", [
    k(0, p=A(-0.05, -0.38, 1.25), a="telapak", b="5", j="dalam+0.3*depan", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.45, p=A(-0.015, -0.38, 1.25)),
    *lingkar(0.55, 1.05, A(-0.015, -0.38, 1.25), 0.03, "depan", "atas", n=6, mulai=270, putaran=1),
    k(1.15),
], L=[k(0, p=A(0.05, -0.38, 1.25), a="telapak", b="5", j="dalam+0.3*depan", tp="depan+0.3*dalam"),
      k(0.15), k(0.45, p=A(0.015, -0.38, 1.25)),
      *lingkar(0.55, 1.05, A(0.015, -0.38, 1.25), 0.03, "depan", "atas", n=6, mulai=270, putaran=1),
      k(1.15)],
  gloss="TIM", ragu=True,
  cara="Jari dua tangan saling menyilang (terkait) di depan dada lalu diputar kecil bersama — bekerja menyatu.")

S("B26_TERJEMAH", "Menerjemahkan / alih bahasa", "Peran", [
    k(0, p=A(-0.06, -0.38, 1.27), a="ujung", b="FLAT_O", j="depan+0.4*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p=A(0.03, -0.38, 1.27), putar=180),
    k(0.8),
], L=[k(0, p=A(0.06, -0.38, 1.23), a="ujung", b="FLAT_O", j="depan+0.4*dalam", tp="dalam"),
      k(0.15), k(0.55, p=A(-0.03, -0.38, 1.23), putar=-180), k(0.8)],
  gloss="TERJEMAH", ragu=True,
  cara="Dua tangan kuncup berhadapan bertukar tempat (kanan ke kiri, kiri ke kanan) — makna dipindah dari satu bahasa ke bahasa lain.")

# ── Etika ─────────────────────────────────────────────────────────────────

S("B26_RAHASIA", "Rahasia / kerahasiaan", "Etika", [
    k(0, p="mulut+0.08*depan", a="telunjuk", b="1", j="atas", tp="dalam"),
    k(0.15),
    k(0.4, p="mulut+0.015*depan"),
    k(0.9),
], kepala=[(0.3, 4, 0, 0)], gloss="RAHASIA", ragu=True,
  cara="Telunjuk tegak ditempelkan di depan bibir ('sst') dan ditahan — tidak boleh diceritakan.")

S("B26_NETRAL", "Netral / tidak memihak", "Etika", [
    k(0, p="dagu+0.14*depan+0.04*bawah", a="sisi_kelingking", b="FLAT", j="atas+0.2*depan", tp="dalam"),
    k(0.15),
    k(0.75, p="tengah+0.02*bawah+0.06*depan"),
    k(0.95),
], gloss="NETRAL", ragu=True,
  cara="Tangan datar tegak (sisi kelingking ke depan) turun lurus di garis tengah badan — tidak condong ke kiri atau ke kanan.")

S("B26_TAMBAH", "Menambah / menambahkan", "Etika", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.14), a="ujung", b="FLAT_O", j="bawah", tp="belakang"),
    k(0.15),
    k(0.5, p=_ALAS + A(-0.01, -0.01, 0.025)),
    k(0.75),
], L=_L_ALAS, gloss="TAMBAH", ragu=True,
  cara="Jari kanan kuncup dari atas diletakkan ke telapak kiri — ada isi yang ditambahkan; sambil mengucapkan 'tambah'.")

S("B26_BATAS", "Batas / membatasi", "Etika", [
    k(0, p=_DINDING + A(-0.05, -0.02, 0.06), a="sisi_kelingking", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.5, p=_DINDING + A(-0.05, -0.02, -0.06)),
    k(0.75),
], L=_L_DINDING, gloss="BATAS", ragu=True,
  cara="Telapak kiri tegak sebagai dinding; tangan kanan datar turun tegas di depannya — sampai sini, tidak lewat.")

S("B26_HORMAT", "Hormat / menghormati", "Etika", [
    k(0, p=A(-0.012, -0.30, 1.30), a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam"),
    k(0.2),
    k(0.6, p=A(-0.012, -0.31, 1.27)),
    k(0.9),
], L=[k(0, p=A(0.012, -0.30, 1.30), a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam"),
      k(0.2), k(0.6, p=A(0.012, -0.31, 1.27)), k(0.9)],
  kepala=[(0.2, 0, 0, 0), (0.6, 12, 0, 0), (0.9, 4, 0, 0)], gloss="HORMAT", ragu=True,
  cara="Dua telapak dirapatkan di depan dada lalu kepala sedikit menunduk — sikap menghormati.")

S("B26_PUTUS", "Memutuskan / keputusan", "Etika", [
    k(0, p=_DAHI + "+0.04*depan", **_TELUNJUK_DAHI),
    k(0.2, p=_DAHI),
    k(0.35),
    k(0.7, p=_ALAS + A(-0.01, -0.01, 0.02), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.95),
], L=_L_ALAS, gloss="PUTUS", ragu=True,
  cara="Telunjuk di pelipis (berpikir), lalu tangan datar turun mantap mengetuk telapak kiri — sudah diputuskan.")

S("B26_AMBIL_ALIH", "Mengambil alih", "Etika", [
    k(0, p="netral+0.06*atas+0.24*depan", a="telapak", b="5", j="depan+0.3*atas", tp="bawah+0.5*belakang"),
    k(0.15),
    k(0.45, p="netral+0.04*atas+0.24*depan", b="S"),
    k(0.8, p="dada+0.05*depan", b="S", j="atas", tp="belakang"),
    k(1.0),
], wajah="sedih", gloss="AMBIL-ALIH", ragu=True,
  cara="Tangan terbuka di depan menyambar menjadi kepalan lalu ditarik ke dada — merebut peran orang lain (sikap yang dihindari).")

S("B26_SUARA", "Suara / aspirasi", "Etika", [
    k(0, p="mulut+0.04*depan+0.01*bawah", a="ujung", b="FLAT_O", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.6, p="mulut+0.22*depan+0.08*luar+0.08*bawah", b="5", j="depan+0.6*atas", tp="bawah+0.4*depan"),
    k(0.85),
], gloss="SUARA", ragu=True,
  cara="Jari kuncup di depan mulut maju dan membuka ke depan-atas — pendapat yang disuarakan (bukan bunyi); sambil mengucapkan 'suara'.")

# ── Persiapan & kerja dengan JBI ──────────────────────────────────────────

_SIAP = [
    k(0, p=A(-0.08, -0.38, 1.24), a="telapak", b="FLAT", j="depan", tp="dalam"),
    *bolak(0.15, 0.16, 4, {"p": A(-0.08, -0.38, 1.24)}, {"p": A(-0.12, -0.38, 1.24)}),
    k(0.8),
]
S("B26_SIAP", "Siap / menyiapkan / persiapan", "Persiapan", **_sym(_SIAP), gloss="SIAP", ragu=True,
  cara="Dua telapak berhadapan sejajar, digeser ke samping dua kali seperti merapikan barang; sambil mengucapkan 'siap'.")

S("B26_KHUSUS", "Khusus / istilah khusus", "Persiapan", [
    k(0, p=A(0.04, -0.40, 1.36), a="ujung", b="BABY_O", j="bawah+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.6, p=A(0.0, -0.40, 1.44), j="atas", tp="dalam"),
    k(0.85),
], L=[k(0, p=A(0.05, -0.38, 1.28), a="telapak", b="5", j="atas+0.3*depan", tp="belakang")],
  gloss="KHUSUS", ragu=True,
  cara="Dari jari-jari kiri yang terbuka, jari kanan 'memetik' satu dan mengangkatnya — yang satu ini, istimewa.")

_UMPAN = [
    k(0, p=A(-0.05, -0.32, 1.27), a="telapak", b="1", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.45, p=A(-0.05, -0.46, 1.27)),
    k(0.6),
    k(0.9, p=A(-0.05, -0.32, 1.27)),
    k(1.0),
]
S("B26_UMPAN_BALIK", "Umpan balik / masukan", "Persiapan",
  R=_UMPAN,
  L=[k(0, p=A(0.05, -0.46, 1.23), a="telapak", b="1", j="belakang+0.3*atas", tp="dalam"),
     k(0.15), k(0.45, p=A(0.05, -0.32, 1.23)), k(0.6), k(0.9, p=A(0.05, -0.46, 1.23)), k(1.0)],
  gloss="UMPAN-BALIK", ragu=True,
  cara="Telunjuk kanan maju sementara telunjuk kiri mundur, lalu sebaliknya — pesan pergi dan kembali.")

S("B26_JEDA", "Jeda / berhenti sebentar", "Persiapan", [
    k(0, p=_ALAS + A(-0.02, -0.01, 0.12), a="ujung", b="FLAT", j="bawah", tp="dalam"),
    k(0.15),
    k(0.45, p=_ALAS + A(-0.02, -0.01, 0.028)),
    k(0.85),
], L=[k(0, p=_ALAS + A(0.0, 0.0, 0.0), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="bawah")],
  gloss="JEDA", ragu=True,
  cara="Ujung jari tangan kanan tegak menyentuh telapak kiri (membentuk T) lalu ditahan — waktu berhenti sebentar.")

_LAYAR = [
    k(0, p=A(-0.02, -0.42, 1.40), a="telunjuk", b="1", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.45, p=A(-0.16, -0.42, 1.40)),
    k(0.75, p=A(-0.16, -0.42, 1.24)),
    k(1.0, p=A(-0.02, -0.42, 1.24)),
    k(1.15),
]
S("B26_LAYAR", "Layar / slide", "Persiapan", **_sym(_LAYAR), gloss="LAYAR", ragu=True,
  cara="Dua telunjuk menggambar persegi panjang di udara: mulai di atas tengah, ke samping, turun, lalu bertemu lagi di bawah.")

S("B26_GILIRAN", "Giliran / bergantian", "Persiapan", [
    k(0, p="netral_kiri+0.06*depan+0.04*atas", a="jempol", b="L", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.4, p="tengah+0.08*depan+0.04*atas", putar=90),
    k(0.7, p="netral+0.06*depan+0.04*atas+0.03*luar", putar=180),
    k(0.9),
], gloss="GILIRAN", ragu=True,
  cara="Tangan L berpindah dari kiri ke kanan sambil berbalik — kesempatan berpindah dari satu orang ke orang berikutnya.")

S("B26_POLOS", "Polos / rata (latar)", "Persiapan", [
    k(0, p=A(-0.02, -0.40, 1.34), a="telapak", b="FLAT", j="atas+0.2*luar", tp="depan"),
    k(0.15),
    k(0.65, p=A(-0.20, -0.40, 1.34)),
    k(0.85),
], gloss="POLOS", ragu=True,
  cara="Telapak tegak menghadap depan disapu datar ke samping — bidang yang rata tanpa gambar; sambil mengucapkan 'polos'.")

S("B26_CAHAYA", "Cahaya / pencahayaan", "Persiapan", [
    k(0, p="dahi+0.20*depan+0.10*luar+0.02*bawah", a="ujung", b="FLAT_O", j="bawah", tp="belakang"),
    k(0.15),
    k(0.5, p="pelipis+0.22*depan+0.10*luar+0.06*bawah", b="5", j="bawah+0.4*depan", tp="bawah"),
    k(0.85),
], gloss="CAHAYA", ragu=True,
  cara="Jari kuncup di atas depan kepala lalu membuka ke bawah — cahaya lampu memancar; sambil mengucapkan 'cahaya'.")

# ── Acara ─────────────────────────────────────────────────────────────────

S("B26_ACARA", "Acara / kegiatan", "Acara", [], gloss="ACARA", ragu=True,
  cara="Dieja jari: A-C-A-R-A (isyarat acara/kegiatan berbeda antardaerah — tanyakan bentuk lokalnya ke pengajar Tuli).")

S("B26_SEMINAR", "Seminar", "Acara", [], gloss="SEMINAR", ragu=True,
  cara="Dieja jari: S-E-M-I-N-A-R (atau isyarat lokal yang disepakati di komunitas).")

S("B26_PANITIA", "Panitia", "Acara", [], gloss="PANITIA", ragu=True,
  cara="Dieja jari: P-A-N-I-T-I-A (atau isyarat lokal; tanyakan ke pengajar Tuli).")

S("B26_UPACARA", "Upacara", "Acara", [
    k(0, p="pelipis+0.10*depan+0.06*luar", a="sisi_telunjuk", b="FLAT", j="atas+0.6*dalam", tp="bawah+0.5*depan"),
    k(0.2, p="pelipis+0.03*depan+0.02*luar"),
    k(0.85),
], kepala=[(0.2, -3, 0, 0)], gloss="UPACARA", ragu=True,
  cara="Tangan datar diangkat ke pelipis seperti memberi hormat pada upacara bendera, lalu ditahan.")

_PENONTON = [
    k(0, p=A(-0.04, -0.40, 1.22), a="telapak", b="CLAW", j="atas+0.3*depan", tp="belakang"),
    k(0.15),
    *bolak(0.3, 0.12, 4, {"p": A(-0.10, -0.40, 1.24)}, {"p": A(-0.16, -0.40, 1.22)}),
    k(0.85),
]
S("B26_PENONTON", "Penonton / hadirin", "Acara", **_sym(_PENONTON), gloss="PENONTON", ragu=True,
  cara="Dua tangan jari renggang-menekuk (deretan kepala) menghadap diri, bergerak ke samping sedikit naik-turun — orang-orang yang duduk menonton.")

# ── Situasi sulit ─────────────────────────────────────────────────────────

S("B26_DUKA", "Duka / berduka", "Situasi sulit", [
    k(0, p="dada+0.03*depan+0.04*atas", a="telapak", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    k(0.2),
    k(0.85, p="dada+0.03*depan+0.10*bawah"),
    k(1.05),
], kepala=[(0.2, 0, 0, 0), (0.85, 10, 0, 0)], wajah="sedih", gloss="DUKA", ragu=True,
  cara="Telapak di dada turun pelan sambil kepala menunduk dan wajah sedih — hati yang berduka.")

S("B26_MENINGGAL", "Meninggal dunia", "Situasi sulit", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.10), a="ujung", b="1", j="atas", tp="dalam"),
    k(0.2),
    k(0.7, p=_ALAS + A(-0.01, -0.03, 0.025), j="depan+0.3*dalam", tp="bawah"),
    k(1.0),
], L=_L_ALAS, wajah="sedih", gloss="MENINGGAL", ragu=True,
  cara="Telunjuk tegak (orang) di atas telapak kiri direbahkan pelan hingga berbaring — wajah sedih. Variasi daerah besar; tanyakan ke pengajar Tuli.")

S("B26_KONFLIK", "Konflik / bertengkar", "Situasi sulit", [
    k(0, p=A(-0.08, -0.38, 1.26), a="ujung", b="1", j="dalam+0.3*depan", tp="belakang"),
    *bolak(0.15, 0.12, 5, {"p": A(-0.012, -0.38, 1.28)}, {"p": A(-0.06, -0.38, 1.24)}),
    k(0.85),
], L=cermin([
    k(0, p=A(-0.08, -0.38, 1.24), a="ujung", b="1", j="dalam+0.3*depan", tp="belakang"),
    *bolak(0.15, 0.12, 5, {"p": A(-0.06, -0.38, 1.26)}, {"p": A(-0.012, -0.38, 1.24)}),
    k(0.85),
]), wajah="wh", gloss="KONFLIK", ragu=True,
  cara="Dua telunjuk saling menyerang bergantian di depan dada, alis berkerut — dua pihak berselisih.")

S("B26_EMOSI", "Emosi tinggi / meluap", "Situasi sulit", [
    k(0, p="perut+0.04*depan", a="telapak", b="CLAW", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p="dada+0.04*depan+0.06*atas"),
    *bolak(0.68, 0.06, 4, {"p": "dada+0.05*depan+0.07*atas"}, {"p": "dada+0.03*depan+0.06*atas"}),
    k(1.0),
], wajah="wh", gloss="EMOSI", ragu=True,
  cara="Tangan cakar naik dari perut ke dada lalu bergetar — perasaan yang meluap; sambil mengucapkan 'emosi'.")

_TENANG = [
    k(0, p=A(-0.07, -0.36, 1.32), a="telapak", b="FLAT", j="depan+0.2*dalam", tp="bawah"),
    k(0.2),
    k(0.9, p=A(-0.09, -0.38, 1.18)),
    k(1.05),
]
S("B26_TENANG", "Tenang / menenangkan", "Situasi sulit", **_sym(_TENANG), gloss="TENANG", ragu=True,
  cara="Dua telapak menghadap bawah turun pelan-pelan di depan badan sambil menarik napas — reda dan tenang.")

_JELAS = [
    k(0, p=A(-0.02, -0.36, 1.45), a="ujung", b="FLAT_O", j="depan+0.4*atas", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.14, -0.38, 1.47), b="5", j="atas+0.4*luar", tp="depan"),
    k(0.85),
]
S("B26_JELAS", "Jelas / terang", "Situasi sulit", **_sym(_JELAS), gloss="JELAS", ragu=True,
  cara="Dua tangan kuncup di depan wajah membuka ke samping-atas — menjadi terang dan jelas; sambil mengucapkan 'jelas'.")

# ── Refleksi & rencana ────────────────────────────────────────────────────

S("B26_REFLEKSI", "Refleksi / menilai diri", "Refleksi", [
    k(0, p="dagu+0.22*depan+0.08*luar+0.08*bawah", a="telapak", b="FLAT", j="atas", tp="belakang"),
    k(0.15),
    *bolak(0.3, 0.16, 4, {"putar": 20}, {"putar": -20}),
    k(0.95, putar=0),
], gloss="REFLEKSI", ragu=True,
  cara="Telapak di depan wajah seperti cermin, diputar sedikit kiri-kanan sambil 'melihat diri' — merenungkan diri sendiri.")

_RENCANA = [
    k(0, p=A(-0.06, -0.30, 1.26), a="sisi_kelingking", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.4, p=A(-0.06, -0.37, 1.26)),
    k(0.5, p=A(-0.06, -0.37, 1.24)),
    k(0.75, p=A(-0.06, -0.44, 1.24)),
    k(0.9),
]
S("B26_RENCANA", "Rencana / merencanakan", "Refleksi", **_sym(_RENCANA), gloss="RENCANA", ragu=True,
  cara="Dua tangan datar sejajar (telapak berhadapan) bergerak maju bertahap — langkah-langkah yang disusun ke depan.")

_HUBUNG = [
    k(0, p=A(-0.03, -0.38, 1.26), a="ujung", b="F", j="depan+0.4*dalam", tp="dalam"),
    k(0.15),
    *bolak(0.3, 0.14, 4, {"p": A(-0.03, -0.42, 1.26)}, {"p": A(-0.03, -0.34, 1.26)}),
    k(0.9),
]
S("B26_TERHUBUNG", "Terhubung / tetap berhubungan", "Refleksi", R=_HUBUNG,
  L=[k(0, p=A(0.03, -0.38, 1.26), a="ujung", b="F", j="depan+0.4*dalam", tp="dalam"),
     k(0.15), *bolak(0.3, 0.14, 4, {"p": A(0.03, -0.42, 1.26)}, {"p": A(0.03, -0.34, 1.26)}), k(0.9)],
  gloss="TERHUBUNG", ragu=True,
  cara="Lingkaran ibu jari-telunjuk dua tangan saling mengait seperti rantai, lalu digerakkan maju-mundur bersama — tetap terhubung.")
