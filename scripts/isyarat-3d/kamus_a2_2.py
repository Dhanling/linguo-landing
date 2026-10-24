# [isyarat-asl-a1a2-v1] Kamus isyarat ASL A2.2 "Around Town — Di Sekitar Kota".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli.

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # Ibu jari & telunjuk rapat-sejajar (pinching tanpa lingkaran) — JAPAN akhir
    "A22_JEPIT": (I._jari(_G, index=(55, 70, 40)), ("ujung", "index")),
})

# Tangan kiri dasar (telapak ke atas / ke bawah) di depan badan
_KIRI_ATAS = dict(p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
_KIRI_BAWAH = dict(p=A(0.04, -0.31, 1.17), a="punggung", b="FLAT", j="dalam+0.5*depan", tp="bawah")

# ── Arah & transportasi ─────────────────────────────────────────────────────

S("STRAIGHT", "Lurus", "Arah", [
    k(0, p="dada+0.10*depan+0.03*luar", a="telapak", b="B", j="depan", tp="dalam"),
    k(0.15),
    k(0.6, p="dada+0.36*depan+0.03*luar"),
    k(0.75),
], cara="Tangan B tegak menyamping (telapak ke kiri), didorong lurus ke depan.")

S("TURN", "Belok", "Arah", [
    k(0, p="netral+0.05*depan", a="telunjuk", b="1", j="depan", tp="bawah"),
    k(0.15),
    k(0.6, p="netral+0.10*depan+0.12*luar", j="luar+0.3*depan"),
    k(0.75),
], cara="Telunjuk menunjuk ke depan lalu berbelok ke arah tujuan (contoh: ke kanan) seperti jalur jalan.")

S("CORNER", "Sudut / tikungan", "Arah", [
    k(0, p=A(-0.03, -0.38, 1.24), a="ujung", b="B", j="depan+0.9*dalam", tp="dalam+0.6*belakang"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.004, -0.40, 1.24)}, {"p": A(-0.03, -0.38, 1.24)}),
    k(0.7, p=A(-0.004, -0.40, 1.24)),
], L=[k(0, p=A(0.004, -0.40, 1.24), a="ujung", b="B", j="depan+0.9*dalam", tp="dalam+0.6*belakang")],
  cara="Dua tangan datar membentuk siku; ujung jari kanan mengetuk ujung jari kiri dua kali (sudut jalan).")

S("TICKET", "Tiket / karcis", "Transportasi", [
    k(0, p=A(0.035, -0.32, 1.205), a="jari_telunjuk", b="BENT_V", j="dalam+0.4*depan", tp="bawah+0.5*dalam"),
    *bolak(0.15, 0.15, 4, {"p": A(0.035, -0.32, 1.185)}, {"p": A(0.035, -0.32, 1.205)}),
    k(0.7, p=A(0.035, -0.32, 1.185)),
], L=[k(0, p=A(0.04, -0.33, 1.17), a="sisi_kelingking", b="FLAT", j="dalam+0.6*depan", tp="atas+0.4*luar")],
  cara="Jari V bengkok menjepit sisi kelingking tangan kiri dua kali, seperti melubangi karcis.")

S("ARRIVE", "Tiba / sampai", "Transportasi", [
    k(0, p="dada+0.08*depan+0.03*bawah", a="punggung", b="BENT_B", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p=A(0.035, -0.36, 1.235), j="atas+0.4*dalam", tp="belakang"),
    k(0.75),
], L=[k(0, p=A(0.04, -0.38, 1.20), a="telapak", b="BENT_B", j="atas+0.4*dalam", tp="belakang")],
  cara="Punggung tangan kanan yang tertekuk bergerak maju lalu mendarat di telapak kiri (sampai di tujuan).")

_LEAVE = [
    k(0, p="netral+0.15*depan+0.04*luar", a="telapak", b="5", j="depan+0.3*luar", tp="bawah"),
    k(0.15),
    k(0.6, p="netral+0.02*depan+0.12*luar+0.02*atas", b="A", j="atas+0.4*luar", tp="dalam"),
    k(0.75),
]
S("LEAVE", "Berangkat / pergi", "Transportasi", _LEAVE, L=cermin(_LEAVE),
  cara="Dua tangan terbuka di depan ditarik mundur ke samping sambil mengepal (A), tanda pergi meninggalkan tempat.")

S("LATE", "Terlambat", "Waktu", [
    k(0, p=A(-0.20, -0.15, 1.08), a="telapak", b="FLAT", j="bawah", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"j": "bawah+0.5*belakang", "tp": "belakang+0.5*atas"}, {"j": "bawah", "tp": "belakang"}),
    k(0.75),
], cara="Tangan datar di samping pinggang, telapak ke belakang, dikibaskan ke belakang dua kali.")

S("EARLY", "Awal / lebih pagi", "Waktu", [
    k(0, p=A(0.075, -0.30, 1.19), a="tengah", b="OPEN_8", j="dalam+0.3*depan+0.4*bawah", tp="bawah+0.3*belakang"),
    k(0.12),
    k(0.5, p=A(0.02, -0.38, 1.20)),
    k(0.65),
], L=[k(0, p=A(0.04, -0.33, 1.17), a="punggung", b="S", j="dalam+0.5*depan", tp="bawah")],
  cara="Ujung jari tengah (bentuk 8 terbuka) mengusap punggung kepalan kiri ke depan.")

# ── Restoran ────────────────────────────────────────────────────────────────

S("MENU", "Menu / daftar", "Restoran", [
    k(0, p=A(0.035, -0.33, 1.30), a="sisi_kelingking", b="BENT_B", j="kiri+0.3*depan", tp="bawah+0.4*kiri"),
    k(0.12),
    k(0.32, p=A(0.035, -0.33, 1.25)),
    k(0.52, p=A(0.035, -0.33, 1.20)),
    k(0.65),
], L=[k(0, p=A(0.06, -0.33, 1.25), a="telapak", b="FLAT", j="atas+0.3*depan", tp="kanan")],
  cara="Tangan kiri tegak (telapak ke kanan); sisi tangan kanan menyentuh telapak kiri dari atas ke bawah, seperti daftar.")

S("ORDER", "Memesan", "Restoran", [
    k(0, p="mulut+0.03*depan+0.02*luar", a="telunjuk", b="1", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.55, p="mulut+0.25*depan+0.10*bawah+0.02*luar", j="depan+0.3*atas", tp="dalam+0.3*bawah"),
    k(0.7),
], cara="Telunjuk dari dekat mulut digerakkan tegas ke depan (memberi perintah/pesanan).")

S("WAITER", "Pelayan / pramusaji", "Restoran",
  bolak(0, 0.2, 5, {"p": "netral+0.12*depan+0.04*luar", "a": "telapak", "b": "FLAT", "j": "depan", "tp": "atas"},
        {"p": "netral+0.01*depan+0.04*luar"}) + [k(1.0)],
  L=cermin(bolak(0, 0.2, 5, {"p": "netral+0.01*depan+0.04*luar", "a": "telapak", "b": "FLAT", "j": "depan", "tp": "atas"},
                 {"p": "netral+0.12*depan+0.04*luar"}) + [k(1.0)]),
  cara="Dua telapak menghadap atas (membawa nampan) maju-mundur bergantian (SERVE), biasanya disusul PERSON.")

S("DELICIOUS", "Enak / lezat", "Restoran", [
    k(0, p="mulut+0.006*depan", a="tengah", b="OPEN_8", j="atas+0.3*dalam", tp="belakang"),
    k(0.18),
    k(0.55, p="mulut+0.12*depan+0.04*bawah+0.03*luar", b="5", j="atas+0.3*luar", tp="depan+0.3*atas"),
    k(0.75),
], wajah="senang", cara="Ujung jari tengah menyentuh bibir, lalu tangan diputar keluar dan terbuka, wajah puas.")

S("BILL", "Bon / tagihan", "Restoran", [
    k(0, p="netral+0.10*atas+0.10*depan", a="jempol", b="BABY_O", j="atas+0.4*depan", tp="dalam+0.5*depan"),
    *bolak(0.12, 0.12, 6, {"p": "netral+0.10*atas+0.10*depan+0.03*luar+0.015*atas"}, {"p": "netral+0.10*atas+0.10*depan+0.03*dalam"}),
    k(0.9),
], cara="Ibu jari & telunjuk menjepit seperti memegang pena, 'menandatangani' di udara ke arah pelayan (meminta bon); bisa juga dieja B-I-L-L.")

# ── Belanja ────────────────────────────────────────────────────────────────

S("SIZE", "Ukuran", "Belanja", [
    k(0, p=A(-0.03, -0.36, 1.22), a="jempol", b="Y", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.15, -0.36, 1.22)),
    k(0.75),
], L=cermin([
    k(0, p=A(-0.03, -0.36, 1.22), a="jempol", b="Y", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.15, -0.36, 1.22)),
    k(0.75),
]), cara="Dua tangan Y menghadap bawah, ujung ibu jari bersentuhan, lalu ditarik menjauh (mengukur).")

S("EXPENSIVE", "Mahal", "Belanja", [
    k(0, p=A(0.04, -0.31, 1.180), a="ujung", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.12),
    k(0.35, p=A(0.0, -0.33, 1.27)),
    k(0.65, p=A(-0.18, -0.30, 1.12), b="5", j="bawah+0.3*luar", tp="belakang+0.3*bawah"),
    k(0.8),
], L=[k(0, **_KIRI_ATAS)], wajah="sedih",
  cara="Tangan O-pipih menyentuh telapak kiri (MONEY), lalu diangkat dan 'dilempar' ke samping bawah sambil terbuka.")

S("CHEAP", "Murah", "Belanja", [
    k(0, p=A(0.035, -0.37, 1.28), a="sisi_telunjuk", b="B", j="dalam+0.6*depan", tp="kiri+0.4*bawah"),
    k(0.12),
    k(0.5, p=A(0.035, -0.37, 1.16)),
    k(0.65),
], L=[k(0, p=A(0.06, -0.34, 1.23), a="telapak", b="FLAT", j="atas+0.4*depan", tp="kanan")],
  cara="Tangan kiri tegak (telapak ke kanan); sisi telunjuk tangan kanan mengusap turun di telapak kiri.")

_SALE = [
    k(0, p="netral+0.03*luar", a="ujung", b="FLAT_O", j="bawah", tp="belakang"),
    *bolak(0.15, 0.17, 4, {"j": "bawah+0.9*depan", "tp": "atas+0.3*belakang"}, {"j": "bawah", "tp": "belakang"}),
    k(0.85),
]
S("SALE", "Jual / obral", "Belanja", _SALE, L=cermin(_SALE),
  cara="Dua tangan O-pipih menghadap bawah, diayun di pergelangan ke depan-belakang dua kali (SELL).")

S("MONEY", "Uang", "Belanja", [
    k(0, p=A(0.04, -0.31, 1.215), a="punggung", b="FLAT_O", j="dalam+0.6*depan", tp="atas"),
    *bolak(0.15, 0.15, 4, {"p": A(0.04, -0.31, 1.178)}, {"p": A(0.04, -0.31, 1.215)}),
    k(0.7, p=A(0.04, -0.31, 1.178)),
], L=[k(0, **_KIRI_ATAS)],
  cara="Punggung tangan O-pipih menepuk telapak kiri yang terbuka ke atas dua kali.")

S("BANK", "Bank", "Belanja", [],
  cara="Dieja jari: B-A-N-K (ejaan yang sudah melebur, sering dieja cepat seperti satu isyarat).")

S("SAVE", "Menabung / menyimpan", "Belanja", [
    k(0, p=A(0.035, -0.37, 1.24), a="jari_tengah", b="V", j="atas+0.4*dalam", tp="depan"),
    *bolak(0.15, 0.15, 4, {"p": A(0.035, -0.355, 1.24)}, {"p": A(0.035, -0.385, 1.24)}),
    k(0.7, p=A(0.035, -0.355, 1.24)),
], L=[k(0, p=A(0.04, -0.33, 1.22), a="punggung", b="V", j="atas+0.4*dalam", tp="belakang")],
  cara="Jari V kanan mengetuk punggung jari V kiri (telapak kiri ke badan) dua kali, seperti jeruji brankas.")

S("LETTER", "Surat", "Pos", [
    k(0, p="mulut+0.025*depan", a="jempol", b="10", j="atas+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p=A(0.04, -0.31, 1.185), a="jempol", j="depan+0.3*dalam", tp="dalam+0.6*bawah"),
    k(0.8),
], L=[k(0, **_KIRI_ATAS)],
  cara="Ibu jari tegak didekatkan ke mulut (menjilat perangko), lalu ditempel di telapak kiri.")

S("SEND", "Mengirim", "Pos", [
    k(0, p=A(0.045, -0.305, 1.19), a="ujung", b="BENT_B", j="bawah+0.4*depan", tp="belakang"),
    k(0.15),
    k(0.5, p=A(0.0, -0.45, 1.23), b="FLAT", j="depan", tp="bawah"),
    k(0.65),
], L=[k(0, **_KIRI_BAWAH)],
  cara="Ujung jari kanan yang tertekuk di punggung tangan kiri dijentikkan ke depan menjauh.")

S("APPOINTMENT", "Janji temu", "Kesehatan",
  lingkar(0, 0.55, A(0.05, -0.31, 1.26), 0.035, "depan", "kiri", n=6, mulai=0,
          a="telapak", b="A", j="atas+0.4*depan", tp="bawah+0.3*dalam") +
  [k(0.8, p=A(0.05, -0.31, 1.21)), k(0.95)],
  L=[k(0, p=A(0.05, -0.30, 1.17), a="punggung", b="S", j="dalam+0.5*depan", tp="bawah")],
  cara="Kepalan A kanan berputar kecil di atas pergelangan kiri, lalu turun mendarat di atasnya (memesan waktu).")

# ── Kesehatan & darurat ────────────────────────────────────────────────────

_PAIN = [
    k(0, p="netral+0.05*atas+0.02*dalam", a="telunjuk", b="1", j="dalam", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.05*atas+0.045*dalam"}, {"p": "netral+0.05*atas+0.02*dalam"}),
    k(0.75, p="netral+0.05*atas+0.045*dalam"),
]
S("PAIN", "Nyeri / sakit (bagian tubuh)", "Kesehatan", _PAIN, L=cermin(_PAIN), wajah="sedih",
  cara="Dua telunjuk saling menusuk ke arah satu sama lain berulang; bisa dibuat tepat di bagian tubuh yang sakit (sama dengan HURT).")

S("FEVER", "Demam", "Kesehatan", [
    k(0, p=A(0.025, -0.34, 1.28), a="sisi_telunjuk", b="1", j="dalam+0.3*depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.025, -0.34, 1.32)}, {"p": A(0.025, -0.34, 1.26)}),
    k(0.75),
], L=[k(0, p=A(0.03, -0.32, 1.22), a="telapak", b="1", j="atas", tp="kanan")],
  wajah="sedih", cara="Telunjuk kanan mendatar naik-turun di sepanjang telunjuk kiri yang tegak (termometer/TEMPERATURE).")

S("COUGH", "Batuk", "Kesehatan", [
    k(0, p="dada+0.04*depan", a="ujung", b="CLAW", j="atas+0.3*dalam", tp="belakang"),
    *bolak(0.14, 0.14, 4, {"p": "dada+0.008*depan"}, {"p": "dada+0.04*depan"}),
    k(0.7, p="dada+0.008*depan"),
], kepala=[(0.14, 6, 0, 0), (0.28, 0, 0, 0), (0.42, 6, 0, 0), (0.6, 0, 0, 0)], wajah="sedih",
  cara="Ujung jari tangan cakar mengetuk dada berulang, kepala ikut tersentak seperti batuk.")

S("EMERGENCY", "Darurat", "Darurat", [
    k(0, p="netral+0.12*atas", a="pergelangan", b="E", j="atas", tp="depan"),
    *bolak(0.12, 0.12, 6, {"p": "netral+0.12*atas+0.04*luar"}, {"p": "netral+0.12*atas+0.03*dalam"}),
    k(0.9),
], cara="Tangan bentuk E digoyang cepat ke kiri-kanan, wajah serius.")

S("POLICE", "Polisi", "Darurat", [
    k(0, p="dada_kiri+0.04*depan+0.03*atas", a="telapak", b="C", j="atas", tp="kiri+0.5*belakang"),
    *bolak(0.15, 0.15, 4, {"p": "dada_kiri+0.008*depan+0.03*atas"}, {"p": "dada_kiri+0.04*depan+0.03*atas"}),
    k(0.7, p="dada_kiri+0.008*depan+0.03*atas"),
], cara="Tangan bentuk C ditepuk di dada kiri dua kali (lencana polisi).")

_FIRE = [
    k(0, p="perut+0.10*depan+0.05*luar", a="telapak", b="5", j="atas", tp="belakang"),
    *bolak(0.15, 0.15, 6, {"p": "dada+0.10*depan+0.05*luar+0.02*bawah", "b": "CLAW"}, {"p": "perut+0.10*depan+0.05*luar", "b": "5"}),
    k(1.0),
]
S("FIRE", "Api / kebakaran", "Darurat", _FIRE,
  L=cermin(bolak(0, 0.15, 7, {"p": "dada+0.10*depan+0.05*luar+0.02*bawah", "a": "telapak", "b": "CLAW", "j": "atas", "tp": "belakang"},
                 {"p": "perut+0.10*depan+0.05*luar", "b": "5"}) + [k(1.0)]),
  cara="Dua tangan terbuka menghadap badan naik-turun bergantian sambil jari bergerak, seperti nyala api.")

_ACC = [
    k(0, p="netral+0.10*luar+0.05*depan", a="buku", b="5", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(0.5, p=A(-0.02, -0.40, 1.24), b="A", j="dalam+0.3*depan", tp="bawah"),
    k(0.6, p=A(-0.03, -0.40, 1.25)),
    k(0.8),
]
S("ACCIDENT", "Kecelakaan", "Darurat", _ACC, L=cermin(_ACC), wajah="sedih",
  cara="Dua tangan terbuka bergerak saling mendekat dan menjadi kepalan yang beradu (tabrakan).")

_SAFE = [
    k(0, p=A(0.01, -0.30, 1.24), a="pergelangan", b="S", j="atas+0.6*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p=A(-0.14, -0.33, 1.26), j="atas+0.2*luar", tp="depan"),
    k(0.75),
]
S("SAFE", "Aman / selamat", "Darurat", _SAFE, L=cermin(_SAFE),
  cara="Dua kepalan S menyilang di pergelangan (terikat), lalu dipisah ke samping dan diputar menghadap depan (bebas, aman).")

# ── Lokasi & preposisi ─────────────────────────────────────────────────────

S("IN", "Di dalam", "Lokasi", [
    k(0, p=A(0.04, -0.34, 1.25), a="ujung", b="FLAT_O", j="bawah+0.3*dalam", tp="kiri"),
    k(0.12),
    k(0.5, p=A(0.04, -0.34, 1.19)),
    k(0.65),
], L=[k(0, p=A(0.05, -0.34, 1.15), a="telapak", b="C", j="dalam+0.3*depan", tp="kanan+0.3*atas")],
  cara="Ujung jari O-pipih kanan dimasukkan ke dalam lubang tangan C/O kiri.")

S("ON", "Di atas (menempel)", "Lokasi", [
    k(0, p=A(0.04, -0.33, 1.26), a="telapak", b="FLAT", j="dalam+0.6*depan", tp="bawah"),
    k(0.12),
    k(0.45, p=A(0.04, -0.33, 1.195)),
    k(0.6),
], L=[k(0, **_KIRI_BAWAH)],
  cara="Telapak kanan diletakkan di atas punggung tangan kiri yang menghadap bawah.")

S("UNDER", "Di bawah", "Lokasi",
  [k(0, p=A(0.03, -0.43, 1.15), a="buku", b="10", j="atas", tp="kiri"), k(0.12)] +
  lingkar(0.12, 0.6, A(0.03, -0.38, 1.12), 0.05, "depan", "belakang", n=4, mulai=0, putaran=0.5) + [k(0.75)],
  L=[k(0, p=A(0.04, -0.33, 1.20), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah")],
  cara="Kepalan dengan ibu jari tegak bergerak melengkung di bawah telapak kiri yang menghadap bawah.")

S("NEXT_TO", "Di samping / sebelah", "Lokasi", [
    k(0, p=A(0.025, -0.36, 1.24), a="telapak", b="B", j="depan", tp="kiri"),
    k(0.15),
    k(0.55, p=A(-0.07, -0.36, 1.24)),
    k(0.7),
], L=[k(0, p=A(0.04, -0.36, 1.24), a="punggung", b="B", j="depan", tp="kiri")],
  gloss="NEXT-TO", cara="Dua tangan B tegak bersebelahan (telapak ke kiri); tangan kanan bergeser sedikit ke samping kanan.")

S("BEHIND", "Di belakang", "Lokasi", [
    k(0, p=A(0.0, -0.42, 1.22), a="sisi_kelingking", b="10", j="atas", tp="kiri"),
    k(0.15),
    k(0.6, p=A(0.0, -0.28, 1.22)),
    k(0.75),
], L=[k(0, p=A(0.025, -0.40, 1.22), a="sisi_telunjuk", b="10", j="atas", tp="kanan")],
  cara="Dua kepalan dengan ibu jari tegak bersebelahan; kepalan kanan bergerak ke belakang kepalan kiri.")

# ── Rekreasi & perjalanan ──────────────────────────────────────────────────

S("WEEKEND", "Akhir pekan", "Waktu", [
    k(0, p=A(0.07, -0.29, 1.19), a="sisi_kelingking", b="1", j="depan+0.6*dalam", tp="bawah+0.5*dalam"),
    k(0.12),
    k(0.4, p=A(-0.02, -0.39, 1.19)),
    k(0.55, p=A(0.03, -0.36, 1.21), b="FLAT", j="dalam+0.6*depan", tp="kiri"),
    k(0.85, p=A(0.03, -0.42, 1.165)),
    k(1.0),
], L=[k(0, **_KIRI_ATAS), k(0.45), k(0.55, p=A(0.04, -0.33, 1.20), j="dalam+0.6*depan", tp="kanan")],
  cara="Telunjuk menyusur telapak kiri (WEEK), lalu sisi tangan kanan meluncur turun dari ujung jari kiri (END).")

_PLAN = [
    k(0, p=A(0.06, -0.38, 1.22), a="telapak", b="FLAT", j="depan", tp="kiri"),
    k(0.15),
    k(0.4, p=A(0.0, -0.38, 1.235)),
    k(0.65, p=A(-0.06, -0.38, 1.22)),
    k(0.8),
]
S("PLAN", "Rencana / merencanakan", "Rekreasi", _PLAN,
  L=[dict(kk, p=A(kk["p"].x + 0.10, kk["p"].y, kk["p"].z), tp="kanan") if "p" in kk else dict(kk) for kk in _PLAN],
  cara="Dua telapak saling berhadapan (jari ke depan) digerakkan bersama dari kiri ke kanan sedikit bergelombang.")

S("BEACH", "Pantai", "Rekreasi",
  bolak(0, 0.22, 4, {"p": A(-0.06, -0.42, 1.21), "a": "telapak", "b": "5", "j": "dalam+0.5*depan", "tp": "bawah"},
        {"p": A(0.04, -0.33, 1.20)}) + [k(0.95)],
  L=[k(0, p=A(0.09, -0.30, 1.16), a="punggung", b="FLAT", j="dalam+0.4*depan", tp="bawah")],
  cara="Tangan terbuka menghadap bawah bergerak bergelombang ke arah lengan kiri berulang (ombak menyapu pantai); sering didahului WATER.")

S("MOUNTAIN", "Gunung", "Rekreasi", [
    k(0, p=A(0.04, -0.31, 1.215), a="buku", b="S", j="dalam+0.6*depan", tp="bawah"),
    *bolak(0.12, 0.12, 2, {"p": A(0.04, -0.31, 1.195)}, {"p": A(0.04, -0.31, 1.215)}),
    k(0.4, p=A(-0.05, -0.38, 1.20), b="5", j="atas+0.5*depan", tp="depan+0.5*bawah"),
    k(0.6, p=A(-0.08, -0.40, 1.30)),
    k(0.85, p=A(-0.12, -0.42, 1.40)),
    k(1.0),
], L=[k(0, p=A(0.04, -0.31, 1.17), a="punggung", b="S", j="dalam+0.6*depan", tp="bawah"), k(0.3),
      k(0.4, p=A(0.08, -0.38, 1.20), b="5", j="atas+0.5*depan", tp="depan+0.5*bawah"),
      k(0.6, p=A(0.11, -0.40, 1.30)), k(0.85, p=A(0.15, -0.42, 1.40)), k(1.0)],
  cara="Kepalan kanan mengetuk punggung kepalan kiri (ROCK), lalu dua tangan terbuka naik menggambar lereng gunung.")

S("PARK", "Taman", "Rekreasi", [],
  cara="Dieja jari: P-A-R-K (untuk 'taman' umumnya dieja; isyarat PARK lain berarti memarkir kendaraan).")

S("TRAVEL", "Bepergian / jalan-jalan", "Perjalanan",
  lingkar(0, 1.0, "netral+0.06*depan", 0.05, "depan", "atas", n=10, mulai=180, putaran=1.5,
          a="ujung", b="BENT_V", j="bawah+0.4*depan", tp="bawah+0.3*belakang") + [k(1.15)],
  cara="Jari V bengkok menghadap bawah bergerak maju berputar-putar (berpindah dari tempat ke tempat).")

_VAC = [
    k(0, p=A(-0.16, -0.12, 1.33), a="jempol", b="5", j="atas+0.4*dalam", tp="depan+0.5*dalam"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.155, -0.15, 1.33)}, {"p": A(-0.16, -0.12, 1.33)}),
    k(0.75),
]
S("VACATION", "Liburan", "Perjalanan", _VAC, L=cermin(_VAC), wajah="senang",
  cara="Ibu jari dua tangan terbuka ditempel dekat ketiak/dada samping, jari digoyang (santai); sama dengan HOLIDAY.")

S("HOTEL", "Hotel", "Perjalanan", [
    k(0, p=A(0.04, -0.33, 1.30), a="sisi_kelingking", b="H", j="kiri+0.2*depan", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"j": "kiri+0.2*depan+0.35*bawah"}, {"j": "kiri+0.2*depan"}),
    k(0.75),
], L=[k(0, p=A(0.045, -0.33, 1.23), a="pergelangan", b="1", j="atas", tp="kanan")],
  cara="Tangan H kanan (dua jari mendatar) bertumpu di atas telunjuk kiri yang tegak, dua jarinya dikibaskan seperti bendera.")

S("FLY", "Terbang / naik pesawat", "Perjalanan", [
    k(0, p="netral+0.05*atas+0.05*luar", a="telapak", b="ILY", j="depan", tp="bawah"),
    k(0.15),
    k(0.65, p="netral+0.20*atas+0.25*depan+0.02*luar"),
    k(0.8),
], cara="Tangan pesawat (ibu jari, telunjuk, kelingking terbuka) menghadap bawah, melesat ke depan-atas.")

# ── Negara ─────────────────────────────────────────────────────────────────

S("INDONESIA", "Indonesia", "Negara", [],
  cara="Dieja jari: I-N-D-O-N-E-S-I-A; komunitas Tuli Indonesia (BISINDO) punya isyarat sendiri — tanyakan ke pengajar/teman Tuli.")

S("AMERICA", "Amerika", "Negara",
  lingkar(0, 1.0, A(-0.02, -0.36, 1.25), 0.06, "kanan", "depan", n=8, mulai=90,
          a="telapak", b="5", j="kiri+0.4*depan+0.2*atas", tp="belakang+0.6*kiri") + [k(1.15)],
  L=lingkar(0, 1.0, A(0.02, -0.36, 1.25), 0.06, "kanan", "depan", n=8, mulai=90,
            a="telapak", b="5", j="kanan+0.4*depan+0.2*atas", tp="belakang+0.6*kanan") + [k(1.15)],
  cara="Jari dua tangan terbuka saling mengait (pagar kayu), digerakkan memutar mendatar di depan badan.")

_JPN = [
    k(0, p=A(-0.012, -0.36, 1.25), a="telunjuk", b="L", j="atas+0.6*dalam", tp="depan"),
    k(0.15),
    k(0.6, p=A(-0.10, -0.36, 1.25), b="A22_JEPIT", j="dalam+0.3*atas", tp="depan"),
    k(0.75),
]
S("JAPAN", "Jepang", "Negara", _JPN, L=cermin(_JPN),
  cara="Ibu jari & telunjuk dua tangan bertemu ujungnya (bentuk pulau), lalu ditarik ke samping sambil merapat; isyarat dari komunitas Tuli Jepang (isyarat lama di mata sebaiknya tidak dipakai).")

S("CHINA", "Tiongkok / Cina", "Negara", [
    k(0, p="dada_kiri+0.02*depan+0.03*atas", a="telunjuk", b="1", j="dalam+0.6*bawah", tp="belakang"),
    k(0.12),
    k(0.4, p="dada_kanan+0.02*depan+0.03*atas"),
    k(0.7, p="dada_kanan+0.02*depan+0.14*bawah"),
    k(0.85),
], cara="Telunjuk menyusur dari dada kiri ke dada kanan lalu turun (kerah jas); isyarat ini dipakai menggantikan isyarat lama di sudut mata yang dianggap menyinggung.")

S("ENGLAND", "Inggris", "Negara", [
    k(0, p=A(0.04, -0.31, 1.205), a="telapak", b="BENT_B", j="dalam+0.6*depan+0.3*bawah", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.04, -0.28, 1.205)}, {"p": A(0.04, -0.33, 1.205)}),
    k(0.75),
], L=[k(0, **_KIRI_BAWAH), *bolak(0.15, 0.15, 4, {"p": A(0.04, -0.28, 1.17)}, {"p": A(0.04, -0.33, 1.17)}), k(0.75)],
  cara="Tangan kanan menggenggam punggung tangan kiri, keduanya ditarik maju-mundur kecil (sama dengan ENGLISH).")

S("FRANCE", "Prancis", "Negara", [
    k(0, p="netral+0.10*atas+0.03*luar", a="pergelangan", b="F", j="atas", tp="belakang"),
    k(0.15),
    k(0.55, p="netral+0.12*atas+0.06*luar", tp="depan"),
    k(0.7),
], cara="Tangan F menghadap badan diputar di pergelangan hingga menghadap depan.")

S("COUNTRY", "Negara", "Negara",
  lingkar(0, 0.9, A(0.11, -0.25, 1.18), 0.03, "atas", "depan", n=8, mulai=90, putaran=2,
          a="telapak", b="Y", j="kiri+0.3*depan", tp="kiri") + [k(1.05)],
  L=[k(0, p=A(0.07, -0.30, 1.16), a="punggung", b="FLAT", j="dalam+0.4*depan", tp="bawah")],
  cara="Tangan Y menghadap badan diputar kecil di lengan bawah kiri dekat siku.")

# ── Juru bahasa & pertanyaan ───────────────────────────────────────────────

S("INTERPRETER", "Juru bahasa isyarat", "Bantuan", [
    k(0, p=A(-0.01, -0.36, 1.25), a="telunjuk", b="F", j="kiri+0.3*depan", tp="kiri+0.3*bawah"),
    *bolak(0.15, 0.18, 4, {"putar": 40}, {"putar": -40}),
    k(0.85, putar=0),
], L=[k(0, p=A(0.01, -0.36, 1.25), a="telunjuk", b="F", j="kanan+0.3*depan", tp="kanan+0.3*atas"),
      *bolak(0.15, 0.18, 4, {"putar": 40}, {"putar": -40}), k(0.85, putar=0)],
  cara="Ujung jari dua tangan F bersentuhan lalu diputar bolak-balik (INTERPRET), disusul PERSON.")

S("REQUEST", "Meminta / permohonan", "Bantuan", [
    k(0, p=A(-0.012, -0.44, 1.23), a="telapak", b="FLAT", j="depan+0.4*atas", tp="kiri"),
    k(0.15),
    k(0.6, p=A(-0.012, -0.32, 1.30), j="atas+0.2*depan"),
    k(0.75),
], L=[k(0, p=A(0.012, -0.44, 1.23), a="telapak", b="FLAT", j="depan+0.4*atas", tp="kanan"),
      k(0.15), k(0.6, p=A(0.012, -0.32, 1.30), j="atas+0.2*depan"), k(0.75)],
  cara="Dua telapak menempel seperti berdoa, diayun dari depan mendekat ke badan (meminta dengan hormat).")

_WHICH_R = bolak(0, 0.2, 5, {"p": "netral+0.07*luar+0.05*atas", "a": "telapak", "b": "10", "j": "depan+0.5*atas", "tp": "dalam"},
                 {"p": "netral+0.07*luar+0.04*bawah"}) + [k(1.0)]
_WHICH_L = bolak(0, 0.2, 5, {"p": "netral+0.07*luar+0.04*bawah", "a": "telapak", "b": "10", "j": "depan+0.5*atas", "tp": "dalam"},
                 {"p": "netral+0.07*luar+0.05*atas"}) + [k(1.0)]
S("WHICH", "Yang mana", "Kata tanya", _WHICH_R, L=cermin(_WHICH_L), wajah="wh",
  cara="Dua kepalan dengan ibu jari tegak naik-turun bergantian (menimbang pilihan), alis berkerut.")

S("HOW_LONG", "Berapa lama", "Kata tanya", [
    k(0, p=A(0.08, -0.29, 1.165), a="telunjuk", b="1", j="dalam+0.4*depan", tp="bawah"),
    k(0.15),
    k(0.65, p=A(0.15, -0.16, 1.15)),
    k(0.8),
], L=[k(0, p=A(0.07, -0.30, 1.15), a="punggung", b="FLAT", j="dalam+0.6*depan", tp="bawah")],
  wajah="wh", gloss="HOW-LONG",
  cara="Telunjuk menyusur lengan kiri dari pergelangan ke arah siku (LONG) dengan alis berkerut.")

S("FOR", "Untuk", "Kata tanya", [
    k(0, p="pelipis+0.02*depan+0.01*luar", a="telunjuk", b="1", j="dalam+0.3*atas", tp="belakang"),
    k(0.15),
    k(0.3, p="pelipis+0.07*depan+0.05*luar", j="atas+0.5*depan", tp="dalam"),
    k(0.55, p="pelipis+0.20*depan+0.04*luar+0.02*bawah", j="depan", tp="dalam+0.5*bawah"),
    k(0.7),
], cara="Telunjuk di pelipis diputar dan diarahkan ke depan; diulang (FOR-FOR) dengan alis berkerut = 'untuk apa?'.")
