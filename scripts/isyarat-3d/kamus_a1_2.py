# [isyarat-asl-a1a2-v1] Kamus isyarat ASL A1.2 "Everyday Signs — Isyarat Sehari-hari".
# Bentuk sitasi, tangan dominan kanan. Format sama dengan kamus.py (S/k/lingkar/bolak/cermin).
# ⚠️ Ditulis dari kamus umum (Lifeprint/HandSpeak) — perlu dicek pengajar Tuli.

from kamus import S, k, A, lingkar, bolak, cermin, IST, _angka
import isyarat as I

# Bentuk tangan tambahan A1.2
_G = I.GENGGAM
I.BENTUK.update({
    # 23: ibu jari + telunjuk lurus, jari tengah menekuk (digoyang)
    "A12_3_TENGAH": (I._jari(_G, index=(0, 0, 0, 10), middle=(50, 60, 30, -6)), "keluar"),
    # sesudah menjentik (DOG): jari tengah jatuh ke telapak, jari lain terbuka
    "A12_JENTIK": (I._jari(I.LURUS, I.RENGGANG, middle=_G), "keluar"),
})

# Posisi tangan dasar (non-dominan) yang sering dipakai
L_TELAPAK_ATAS = dict(p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
L_TELAPAK_SAMPING = dict(p=A(0.03, -0.33, 1.22), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")

def _L(d, t=0, **lain):
    x = dict(d); x.update(lain); return k(t, **x)

GELENG = [(0.1, 0, 0, 0), (0.3, 0, 14, 0), (0.5, 0, -14, 0), (0.7, 0, 10, 0), (0.85, 0, 0, 0)]

# ── Kata ganti & penunjukan ────────────────────────────────────────────────

S("IX", "Dia / itu (menunjuk)", "Orang", [
    k(0, p="netral+0.04*atas", a="telunjuk", b="1", j="depan+0.3*luar", tp="bawah+0.3*dalam"),
    k(0.15),
    k(0.45, p="netral+0.04*atas+0.09*luar+0.06*depan", j="depan+0.8*luar"),
    k(0.65),
], gloss="IX", cara="Telunjuk menunjuk ke titik di ruang tempat orang/benda itu 'ditaruh' (dia, itu, di sana).")

S("WE", "Kami / kita", "Orang", [
    k(0, p="dada_kanan+0.01*depan+0.03*atas", a="telunjuk", b="1", j="atas+0.6*belakang", tp="dalam"),
    k(0.15),
    k(0.4, p="dada+0.08*depan+0.05*atas"),
    k(0.65, p="dada_kiri+0.01*depan+0.03*atas", j="atas+0.6*belakang+0.2*dalam"),
    k(0.8),
], cara="Telunjuk menyentuh dada kanan, lalu melengkung ke depan dan mendarat di dada kiri.")

S("THEY", "Mereka", "Orang", [
    k(0, p="netral+0.02*atas+0.03*dalam+0.03*depan", a="telunjuk", b="1", j="depan", tp="bawah"),
    k(0.15),
    k(0.6, p="netral+0.02*atas+0.14*luar", j="depan+0.7*luar"),
    k(0.75),
], cara="Telunjuk menunjuk ke depan lalu menyapu mendatar ke samping (beberapa orang).")

# ── Hewan ──────────────────────────────────────────────────────────────────

S("CAT", "Kucing", "Hewan", [
    k(0, p="sudut_mulut+0.03*luar+0.012*depan", a="telunjuk", b="F", j="atas+0.4*luar", tp="depan+0.4*dalam"),
    *bolak(0.15, 0.17, 4, {"p": "sudut_mulut+0.10*luar+0.03*depan"}, {"p": "sudut_mulut+0.03*luar+0.012*depan"}),
    k(0.8, p="sudut_mulut+0.10*luar+0.03*depan"),
], cara="Ujung telunjuk & ibu jari (bentuk F) di pipi dekat mulut ditarik keluar dua kali, seperti kumis kucing.")

S("DOG", "Anjing", "Hewan", [
    k(0, p=A(-0.17, -0.17, 1.03), a="telapak", b="FLAT", j="bawah+0.3*depan", tp="dalam"),
    *bolak(0.12, 0.12, 3, {"p": A(-0.15, -0.17, 1.03)}, {"p": A(-0.18, -0.17, 1.03)}),
    k(0.55, p="netral+0.08*luar+0.03*bawah", a="tengah", b="8", j="atas+0.4*depan", tp="dalam"),
    k(0.7, b="A12_JENTIK"),
    k(0.85),
], cara="Telapak menepuk paha, lalu jari tengah & ibu jari menjentik (memanggil anjing).")

# ── Hari & minggu ──────────────────────────────────────────────────────────

S("WEEK", "Minggu (7 hari)", "Waktu", [
    k(0, p=A(0.075, -0.285, 1.178), a="jari_telunjuk", b="1", j="dalam+0.2*depan", tp="bawah"),
    k(0.12),
    k(0.55, p=A(-0.015, -0.35, 1.178)),
    k(0.7),
], L=[_L(L_TELAPAK_ATAS)],
  cara="Telunjuk kanan (telapak ke bawah) menggeser di atas telapak kiri dari pangkal ke ujung jari.")

def _hari(kode, arti, bentuk, huruf):
    S(kode, arti, "Waktu",
      lingkar(0, 0.8, "angka+0.01*bawah", 0.028, "luar", "atas", n=8, mulai=0,
              a="telapak", b=bentuk, j="atas", tp="belakang+0.2*dalam") + [k(0.95)],
      cara=f"Huruf {huruf} di depan bahu, telapak menghadap diri sendiri, diputar kecil.")

_hari("MONDAY", "Senin", "M", "M")
_hari("TUESDAY", "Selasa", "T", "T")
_hari("WEDNESDAY", "Rabu", "W", "W")
_hari("THURSDAY", "Kamis", "H", "H")
_hari("FRIDAY", "Jumat", "F", "F")
_hari("SATURDAY", "Sabtu", "S", "S")

S("SUNDAY", "Minggu (hari)", "Waktu",
  lingkar(0, 0.8, "netral+0.10*atas+0.06*luar", 0.04, "luar", "atas", n=8, mulai=180,
          a="telapak", b="FLAT", j="atas", tp="depan") + [k(0.95)],
  L=cermin(lingkar(0, 0.8, "netral+0.10*atas+0.06*luar", 0.04, "luar", "atas", n=8, mulai=180,
                   a="telapak", b="FLAT", j="atas", tp="depan") + [k(0.95)]),
  cara="Dua telapak menghadap depan, diputar kecil ke arah luar (seperti mengagumi).")

# ── Jam & waktu ────────────────────────────────────────────────────────────

S("TIME", "Waktu / jam berapa", "Waktu", [
    k(0, p=A(0.06, -0.30, 1.21), a="telunjuk", b="X", j="dalam+0.4*depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.06, -0.30, 1.185)}, {"p": A(0.06, -0.30, 1.21)}),
    k(0.7, p=A(0.06, -0.30, 1.185)),
], L=[k(0, p=A(0.06, -0.30, 1.16), a="pergelangan", b="S", j="dalam+0.5*depan", tp="bawah")],
  cara="Telunjuk bengkok (X) mengetuk punggung pergelangan kiri (tempat jam tangan) dua kali.")

S("HOUR", "Jam (60 menit)", "Waktu", [
    k(0, p=A(0.012, -0.34, 1.24), a="telapak", b="1", j="atas", tp="dalam"),
    k(0.12),
    k(0.35, j="depan+0.4*atas"),
    k(0.6, j="depan+0.6*bawah"),
    k(0.85, j="atas+0.2*belakang"),
    k(1.0, j="atas"),
], L=[_L(L_TELAPAK_SAMPING)],
  cara="Telunjuk kanan menempel di telapak kiri lalu diputar satu putaran penuh seperti jarum jam.")

S("MINUTE", "Menit", "Waktu", [
    k(0, p=A(0.012, -0.34, 1.24), a="telapak", b="1", j="atas", tp="dalam"),
    k(0.12),
    k(0.4, j="atas+0.6*depan"),
    k(0.6),
], L=[_L(L_TELAPAK_SAMPING)],
  cara="Telunjuk kanan menempel di telapak kiri, bergerak maju sedikit seperti jarum menit.")

# ── Kata kerja harian ──────────────────────────────────────────────────────

_GO = [
    k(0, p="netral+0.06*atas+0.03*luar+0.04*belakang", a="pergelangan", b="1", j="atas+0.2*depan", tp="depan"),
    k(0.12),
    k(0.5, p="netral+0.03*atas+0.03*luar+0.12*depan", j="depan+0.2*luar", tp="bawah"),
    k(0.7),
]
S("GO", "Pergi", "Kata kerja", _GO, L=cermin(_GO),
  cara="Dua telunjuk tegak berayun ke depan sampai menunjuk menjauh (arah tujuan).")

_COME = [
    k(0, p="netral+0.03*atas+0.03*luar+0.12*depan", a="pergelangan", b="1", j="depan+0.4*atas", tp="atas"),
    k(0.12),
    k(0.5, p="netral+0.06*atas+0.03*luar+0.04*belakang", j="atas+0.3*belakang", tp="belakang"),
    k(0.7),
]
S("COME", "Datang", "Kata kerja", _COME, L=cermin(_COME),
  cara="Dua telunjuk menunjuk ke depan lalu berayun mendekat ke badan.")

S("STUDY", "Belajar (mengulang pelajaran)", "Kata kerja", [
    k(0, p=A(0.03, -0.31, 1.25), a="ujung", b="5", j="depan+0.6*bawah+0.3*dalam", tp="bawah", siku="bawah+0.5*luar"),
    *bolak(0.12, 0.12, 6, {"b": "5_TEKUK", "p": A(0.035, -0.31, 1.24)}, {"b": "5", "p": A(0.03, -0.31, 1.25)}),
    k(0.85),
], L=[_L(L_TELAPAK_ATAS)],
  cara="Jari-jari tangan kanan terbuka menghadap telapak kiri dan bergoyang (seperti memandangi buku).")

_WAKE = [
    k(0, p="mata+0.035*depan+0.025*luar", a="telunjuk", b="BABY_O", j="atas+0.6*dalam", tp="depan", siku="bawah+0.3*luar"),
    k(0.15),
    k(0.5, b="L"),
    k(0.7),
]
S("WAKE_UP", "Bangun tidur", "Kata kerja", _WAKE, L=cermin(_WAKE), wajah="senang", gloss="WAKE-UP",
  cara="Ibu jari & telunjuk terkatup di samping mata, lalu membuka seperti mata yang terbuka.")

S("SHOWER", "Mandi (pancuran)", "Kata kerja", [
    k(0, p="dahi+0.10*atas+0.06*luar+0.08*depan", a="ujung", b="S", j="bawah+0.3*belakang", tp="belakang"),
    *bolak(0.15, 0.17, 4, {"b": "5"}, {"b": "S"}),
    k(0.8, b="5"),
], cara="Kepalan di atas kepala dibuka jadi tangan terbuka dua kali, seperti air pancuran.")

# ── Makanan & minuman ──────────────────────────────────────────────────────

S("APPLE", "Apel", "Makanan", [
    k(0, p="pipi+0.008*depan", a="jari_telunjuk", b="X", j="atas+0.3*dalam", tp="belakang+0.4*luar"),
    *bolak(0.14, 0.14, 4, {"putar": -35}, {"putar": 15}),
    k(0.75, putar=0),
], cara="Buku telunjuk bengkok (X) di pipi diputar maju-mundur.")

S("BREAD", "Roti", "Makanan", [
    k(0, p=A(0.075, -0.335, 1.25), a="ujung", b="BENT_B", j="dalam+0.3*bawah", tp="belakang+0.3*bawah"),
    k(0.12),
    k(0.3, p=A(0.075, -0.335, 1.19)),
    k(0.42, p=A(0.04, -0.335, 1.25)),
    k(0.6, p=A(0.04, -0.335, 1.19)),
    k(0.72, p=A(0.005, -0.335, 1.25)),
    k(0.9, p=A(0.005, -0.335, 1.19)),
    k(1.0),
], L=[k(0, p=A(0.03, -0.31, 1.22), a="telapak", b="FLAT", j="dalam+0.2*depan", tp="belakang")],
  cara="Tangan kiri tegak menghadap badan; ujung jari kanan 'mengiris' punggung tangan kiri beberapa kali.")

S("RICE", "Nasi / beras", "Makanan", [
    k(0, p=A(0.04, -0.31, 1.18), a="ujung", b="R", j="dalam+0.5*depan", tp="atas"),
    k(0.12),
    k(0.4, p="mulut+0.04*depan+0.03*bawah", j="belakang+0.6*atas", tp="bawah+0.3*dalam", siku="bawah"),
    k(0.55, p=A(0.04, -0.31, 1.18), j="dalam+0.5*depan", tp="atas", siku=None),
    k(0.85, p="mulut+0.04*depan+0.03*bawah", j="belakang+0.6*atas", tp="bawah+0.3*dalam"),
    k(1.0),
], L=[_L(L_TELAPAK_ATAS)],
  cara="Bentuk R menyendok dari telapak kiri ke arah mulut dua kali (seperti makan nasi).")

S("COFFEE", "Kopi", "Minuman",
  lingkar(0, 0.85, A(0.035, -0.32, 1.235), 0.02, "depan", "dalam", n=8, mulai=0, putaran=2,
          a="sisi_kelingking", b="S", j="depan+0.3*dalam", tp="dalam") + [k(1.0)],
  L=[k(0, p=A(0.035, -0.32, 1.16), a="pergelangan", b="S", j="depan+0.3*dalam", tp="dalam")],
  cara="Kepalan kanan memutar di atas kepalan kiri, seperti menggiling kopi.")

S("TEA", "Teh", "Minuman",
  lingkar(0, 0.85, A(0.035, -0.33, 1.205), 0.012, "depan", "dalam", n=8, mulai=0, putaran=2,
          a="telunjuk", b="F", j="bawah+0.3*depan", tp="dalam") + [k(1.0)],
  L=[k(0, p=A(0.035, -0.33, 1.17), a="pergelangan", b="O", j="depan+0.3*dalam", tp="dalam")],
  cara="Ujung bentuk F 'mencelup' ke dalam tangan O kiri dan diaduk memutar, seperti kantong teh.")

S("MILK", "Susu", "Minuman", [
    k(0, p="netral+0.04*atas+0.03*luar", a="telapak", b="C", j="atas+0.2*depan", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"b": "S"}, {"b": "C"}),
    k(0.75, b="S"),
], cara="Tangan C meremas jadi kepalan S berulang, seperti memerah susu.")

# ── Tempat di kota ─────────────────────────────────────────────────────────

_STORE = [
    k(0, p="netral+0.06*atas+0.05*luar", a="pergelangan", b="FLAT_O", j="bawah+0.5*depan", tp="belakang+0.3*bawah", siku="bawah+0.4*luar"),
    *bolak(0.15, 0.15, 4, {"j": "depan+0.4*bawah", "tp": "bawah+0.3*belakang"}, {"j": "bawah+0.5*depan", "tp": "belakang+0.3*bawah"}),
    k(0.75, j="depan+0.4*bawah", tp="bawah+0.3*belakang"),
]
S("STORE", "Toko", "Tempat", _STORE, L=cermin(_STORE),
  cara="Dua tangan O-pipih menunjuk ke bawah, diayun ke depan dua kali di pergelangan.")

S("HOSPITAL", "Rumah sakit", "Tempat", [
    k(0, p="bahu_kiri+0.04*depan+0.01*bawah", a="ujung", b="H", j="belakang+0.5*dalam", tp="bawah+0.3*luar"),
    k(0.12),
    k(0.4, p="bahu_kiri+0.04*depan+0.08*bawah"),
    k(0.5, p="bahu_kiri+0.05*depan+0.04*bawah+0.03*luar"),
    k(0.8, p="bahu_kiri+0.05*depan+0.04*bawah+0.03*dalam"),
    k(0.95),
], cara="Dua jari (bentuk H) menggambar tanda palang (+) di lengan atas kiri.")

S("RESTAURANT", "Restoran", "Tempat", [
    k(0, p="sudut_mulut+0.008*depan+0.01*bawah", a="ujung", b="R", j="atas+0.4*belakang", tp="dalam+0.5*belakang"),
    k(0.15),
    k(0.3, p="sudut_mulut+0.04*depan+0.01*bawah+0.03*dalam"),
    k(0.5, p="mulut+0.008*depan+0.01*bawah+0.03*dalam"),
    k(0.7),
], cara="Ujung jari bentuk R menyentuh satu sisi mulut lalu sisi lainnya.")

S("LIBRARY", "Perpustakaan", "Tempat",
  lingkar(0, 0.8, "netral+0.08*atas+0.03*luar", 0.035, "luar", "atas", n=8, mulai=0,
          a="telapak", b="L", j="atas", tp="depan") + [k(0.95)],
  cara="Bentuk L, telapak menghadap depan, diputar kecil.")

S("LEFT", "Kiri", "Arah", [
    k(0, p="netral+0.06*atas+0.02*luar", a="pergelangan", b="L", j="atas", tp="depan"),
    k(0.12),
    k(0.5, p="netral+0.06*atas+0.12*dalam"),
    k(0.65),
], cara="Bentuk L, telapak ke depan, digeser ke kiri.")

S("RIGHT", "Kanan", "Arah", [
    k(0, p="netral+0.06*atas", a="pergelangan", b="R", j="atas+0.4*depan", tp="depan+0.4*bawah"),
    k(0.12),
    k(0.5, p="netral+0.06*atas+0.12*luar"),
    k(0.65),
], cara="Bentuk R digeser ke kanan.")

# ── Pekerjaan ──────────────────────────────────────────────────────────────

L_NADI = k(0, p=A(0.05, -0.30, 1.16), a="pergelangan", b="FLAT", j="dalam+0.5*depan", tp="atas")

S("DOCTOR", "Dokter", "Pekerjaan", [
    k(0, p=A(0.05, -0.30, 1.21), a="ujung", b="M", j="bawah+0.4*dalam", tp="bawah+0.5*belakang"),
    *bolak(0.15, 0.15, 4, {"p": A(0.05, -0.30, 1.18)}, {"p": A(0.05, -0.30, 1.21)}),
    k(0.7, p=A(0.05, -0.30, 1.18)),
], L=[L_NADI], cara="Ujung jari bentuk M mengetuk pergelangan kiri dua kali (memeriksa nadi).")

S("NURSE", "Perawat", "Pekerjaan", [
    k(0, p=A(0.05, -0.30, 1.21), a="ujung", b="N", j="bawah+0.4*dalam", tp="bawah+0.5*belakang"),
    *bolak(0.15, 0.15, 4, {"p": A(0.05, -0.30, 1.18)}, {"p": A(0.05, -0.30, 1.21)}),
    k(0.7, p=A(0.05, -0.30, 1.18)),
], L=[L_NADI], cara="Ujung jari bentuk N mengetuk pergelangan kiri dua kali (memeriksa nadi).")

S("COOK", "Memasak / juru masak", "Pekerjaan", [
    k(0, p=A(0.04, -0.31, 1.18), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
    k(0.12),
    k(0.35, p=A(0.04, -0.31, 1.18), a="punggung", tp="atas"),
    k(0.6, a="telapak", tp="bawah"),
    k(0.85, a="punggung", tp="atas"),
    k(1.0),
], L=[_L(L_TELAPAK_ATAS)],
  cara="Tangan kanan di atas telapak kiri dibalik bolak-balik, seperti membalik dadar.")

# ── Negasi ─────────────────────────────────────────────────────────────────

S("NOT", "Tidak / bukan", "Negasi", [
    k(0, p="dagu+0.03*bawah+0.01*depan", a="jempol", b="10", j="atas", tp="dalam"),
    k(0.15),
    k(0.45, p="dagu+0.15*depan+0.06*bawah"),
    k(0.65),
], kepala=GELENG, cara="Ujung ibu jari (bentuk A) di bawah dagu didorong ke depan, sambil menggeleng.")

_NONE = [
    k(0, p="netral+0.05*atas+0.02*luar", a="pergelangan", b="O", j="atas+0.2*depan", tp="depan+0.5*dalam"),
    k(0.15),
    k(0.55, p="netral+0.02*atas+0.12*luar+0.06*depan", j="atas+0.3*luar"),
    k(0.75),
]
S("NONE", "Tidak ada / nol", "Negasi", _NONE, L=cermin(_NONE), kepala=GELENG,
  cara="Dua tangan bentuk O di depan dada bergerak menjauh ke samping, sambil menggeleng.")

S("NEVER", "Tidak pernah", "Negasi", [
    k(0, p="pipi+0.14*depan+0.04*luar", a="telapak", b="FLAT", j="atas", tp="dalam"),
    k(0.12),
    k(0.35, p="pipi+0.16*depan+0.08*luar+0.06*bawah", tp="dalam+0.6*depan"),
    k(0.55, p="pipi+0.16*depan+0.03*luar+0.11*bawah", tp="dalam"),
    k(0.8, p="pipi+0.17*depan+0.09*luar+0.20*bawah", tp="depan"),
    k(0.95),
], kepala=GELENG, cara="Tangan datar (telapak ke kiri) turun berkelok seperti huruf tanya, berakhir telapak ke depan.")

# ── Deskripsi orang ────────────────────────────────────────────────────────

S("TALL", "Tinggi (orang)", "Sifat", [
    k(0, p=A(0.012, -0.34, 1.18), a="jari_telunjuk", b="1", j="atas", tp="dalam"),
    k(0.12),
    k(0.6, p=A(0.012, -0.34, 1.36)),
    k(0.75),
], L=[_L(L_TELAPAK_SAMPING)],
  cara="Telunjuk kanan menggeser naik di telapak kiri sampai di atas ujung jari.")

S("SHORT", "Pendek (orang)", "Sifat", [
    k(0, p="netral+0.12*luar+0.04*atas", a="telapak", b="BENT_B", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.12*luar+0.03*bawah"}, {"p": "netral+0.12*luar+0.01*atas"}),
    k(0.75, p="netral+0.12*luar+0.03*bawah"),
], cara="Tangan menekuk (telapak ke bawah) di samping badan, ditekan turun dua kali (orang bertubuh pendek).")

S("BEAUTIFUL", "Cantik / indah", "Sifat",
  lingkar(0, 0.6, "hidung+0.13*depan", 0.075, "luar", "atas", n=8, mulai=90, putaran=0.85,
          a="telapak", b="5", j="atas", tp="belakang") +
  [k(0.85, p="dagu+0.10*depan", b="FLAT_O", j="atas+0.3*depan"), k(1.0)],
  wajah="senang", cara="Tangan terbuka memutari wajah lalu mengatup (O-pipih) di dekat dagu.")

_BIG = [
    k(0, p="netral+0.02*atas+0.01*luar", a="pergelangan", b="L", j="depan+0.3*atas", tp="dalam"),
    k(0.12),
    k(0.55, p="netral+0.02*atas+0.15*luar"),
    k(0.7),
]
S("BIG", "Besar", "Sifat", _BIG, L=cermin(_BIG), cara="Dua tangan bentuk L saling berhadapan, ditarik menjauh.")

_SMALL = [
    k(0, p="netral+0.02*atas+0.08*luar", a="telapak", b="FLAT", j="depan+0.3*atas", tp="dalam"),
    k(0.12),
    k(0.5, p="netral+0.02*atas+0.025*luar"),
    k(0.65),
]
S("SMALL", "Kecil", "Sifat", _SMALL, L=cermin(_SMALL), cara="Dua telapak saling berhadapan, didekatkan.")

S("HAIR", "Rambut", "Sifat", [
    k(0, p="pelipis+0.05*atas+0.02*luar+0.01*depan", a="telunjuk", b="F", j="atas+0.3*dalam", tp="belakang+0.5*dalam"),
    *bolak(0.12, 0.12, 4, {"p": "pelipis+0.065*atas+0.03*luar+0.01*depan"}, {"p": "pelipis+0.05*atas+0.02*luar+0.01*depan"}),
    k(0.7),
], cara="Ibu jari & telunjuk (bentuk F) menjepit sejumput rambut di samping kepala dan menggoyangnya.")

# ── Angka 21–100 ───────────────────────────────────────────────────────────

_angka(21, [k(0, p="angka", a="telapak", b="L", j="atas", tp="depan+0.15*dalam"),
            *bolak(0.14, 0.14, 4, {"b": "1"}, {"b": "L"}), k(0.7, b="1")],
       "Angka 21: bentuk L (ibu jari & telunjuk), ibu jari ditekuk berulang.")
_angka(22, [k(0, p="angka+0.02*dalam", a="telapak", b="V", j="depan+0.3*atas", tp="bawah"),
            k(0.2, p="angka+0.02*dalam+0.02*atas"),
            k(0.35, p="angka+0.02*luar"),
            k(0.55, p="angka+0.05*luar+0.02*atas"),
            k(0.7, p="angka+0.07*luar"),
            k(0.8)],
       "Angka 22: bentuk 2 telapak ke bawah, memantul dua kali ke samping.")
_angka(23, [k(0, p="angka", a="telapak", b="3", j="atas", tp="depan+0.15*dalam"),
            *bolak(0.14, 0.14, 4, {"b": "A12_3_TENGAH"}, {"b": "3"}), k(0.7, b="A12_3_TENGAH")],
       "Angka 23: bentuk 3 (ibu jari, telunjuk, tengah), jari tengah ditekuk berulang.")
_angka(25, [k(0, p="angka", a="telapak", b="5", j="atas", tp="depan+0.15*dalam"),
            *bolak(0.14, 0.14, 4, {"b": "OPEN_8"}, {"b": "5"}), k(0.7, b="OPEN_8")],
       "Angka 25: bentuk 5, jari tengah ditekuk berulang.")
_angka(30, [k(0, p="angka", a="telapak", b="3", j="atas", tp="depan+0.15*dalam"),
            k(0.15),
            k(0.4, p="angka+0.02*luar", b="O", tp="dalam+0.3*depan"),
            k(0.6)],
       "Angka 30: bentuk 3 lalu 0 (O), sedikit bergeser ke samping.")
_angka(50, [k(0, p="angka", a="telapak", b="5", j="atas", tp="depan+0.15*dalam"),
            k(0.15),
            k(0.4, p="angka+0.02*luar", b="O", tp="dalam+0.3*depan"),
            k(0.6)],
       "Angka 50: bentuk 5 lalu 0 (O).")
_angka(100, [k(0, p="angka", a="telapak", b="1", j="atas", tp="depan+0.15*dalam"),
             k(0.15),
             k(0.4, p="angka+0.02*luar", b="C", tp="dalam"),
             k(0.6)],
       "Angka 100: angka 1 lalu bentuk C (C = 100).")

# ── Uang & belanja ─────────────────────────────────────────────────────────

S("DOLLAR", "Dolar", "Belanja", [
    k(0, p=A(-0.005, -0.385, 1.215), a="ujung", b="C", j="depan+0.3*dalam", tp="dalam"),
    k(0.12, b="FLAT_O"),
    k(0.35, p=A(-0.01, -0.46, 1.215)),
    k(0.45, p=A(-0.005, -0.385, 1.215), b="C"),
    k(0.55, b="FLAT_O"),
    k(0.78, p=A(-0.01, -0.46, 1.215)),
    k(0.9),
], L=[k(0, p=A(0.035, -0.32, 1.215), a="telapak", b="FLAT", j="depan+0.4*dalam", tp="dalam")],
  cara="Tangan kanan menjepit ujung jari tangan kiri lalu menariknya lepas, dua kali (seperti menarik uang kertas).")

S("CENT", "Sen", "Belanja", [
    k(0, p="pelipis+0.015*depan+0.025*atas", a="telunjuk", b="1", j="belakang+0.5*atas+0.2*dalam", tp="dalam", siku="bawah+0.5*luar"),
    k(0.15),
    k(0.5, p="pelipis+0.14*depan+0.03*luar", j="atas+0.4*depan", tp="dalam"),
    k(0.65),
], cara="Ujung telunjuk menyentuh dahi samping lalu bergerak menjauh ke depan.")

S("COST", "Harga / biaya", "Belanja", [
    k(0, p=A(0.012, -0.35, 1.27), a="jari_telunjuk", b="X", j="dalam+0.3*bawah", tp="bawah+0.5*luar"),
    k(0.12),
    k(0.5, p=A(0.012, -0.35, 1.18)),
    k(0.65),
], L=[_L(L_TELAPAK_SAMPING)],
  cara="Buku telunjuk bengkok (X) menggaris turun di telapak kiri yang tegak.")

S("BUY", "Membeli", "Belanja", [
    k(0, p=A(0.04, -0.31, 1.18), a="punggung", b="FLAT_O", j="depan+0.4*dalam", tp="atas"),
    k(0.12),
    k(0.55, p=A(-0.02, -0.47, 1.25), j="depan+0.4*atas"),
    k(0.7),
], L=[_L(L_TELAPAK_ATAS)],
  cara="Tangan O-pipih (seperti memegang uang) di telapak kiri, lalu melengkung maju menjauh.")

S("PAY", "Membayar", "Belanja", [
    k(0, p=A(0.05, -0.30, 1.178), a="telunjuk", b="1", j="dalam+0.6*depan", tp="bawah"),
    k(0.12),
    k(0.5, p=A(-0.06, -0.43, 1.21), j="depan+0.3*dalam+0.2*atas"),
    k(0.65),
], L=[_L(L_TELAPAK_ATAS)],
  cara="Ujung telunjuk kanan di telapak kiri dijentikkan maju melewati ujung jari kiri.")

# ── Cuaca & musim ──────────────────────────────────────────────────────────

S("HOT", "Panas", "Cuaca", [
    k(0, p="mulut+0.045*depan", a="ujung", b="CLAW", j="atas+0.3*belakang", tp="belakang"),
    k(0.12),
    k(0.45, p="mulut+0.14*depan+0.14*bawah+0.06*luar", j="depan+0.3*luar", tp="bawah+0.4*depan"),
    k(0.65),
], cara="Tangan cakar di depan mulut diputar lalu 'dibuang' ke bawah, seperti makanan yang terlalu panas.")

_COLD = [
    k(0, p="dada+0.10*depan+0.06*luar+0.02*atas", a="telapak", b="S", j="atas+0.2*depan", tp="dalam"),
    *bolak(0.08, 0.08, 8, {"p": "dada+0.10*depan+0.08*luar+0.02*atas"}, {"p": "dada+0.10*depan+0.045*luar+0.02*atas"}),
    k(0.8),
]
S("COLD", "Dingin", "Cuaca", _COLD, L=cermin(_COLD), kepala=[(0.1, 4, 0, 0), (0.7, 4, 0, 0), (0.8, 0, 0, 0)],
  cara="Dua kepalan di depan dada digetarkan, seperti menggigil kedinginan.")

_RAIN = [
    k(0, p="netral+0.14*atas+0.06*luar", a="telapak", b="CLAW", j="depan+0.3*bawah", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.04*atas+0.06*luar"}, {"p": "netral+0.14*atas+0.06*luar"}),
    k(0.75, p="netral+0.04*atas+0.06*luar"),
]
S("RAIN", "Hujan", "Cuaca", _RAIN, L=cermin(_RAIN), cara="Dua tangan cakar, telapak ke bawah, diturunkan dua kali seperti air hujan.")

_SNOW = [
    k(0, p="netral+0.10*atas+0.08*luar+0.04*depan", a="telapak", b="5", j="depan", tp="bawah", siku="bawah+0.5*luar"),
    *bolak(0.12, 0.12, 7, {"b": "5_TEKUK"}, {"b": "5"}),
    k(1.0, p="netral+0.03*bawah+0.10*luar"),
]
S("SNOW", "Salju", "Cuaca", _SNOW, L=cermin(_SNOW),
  cara="Dua tangan terbuka, telapak ke bawah, turun perlahan sambil jari-jari bergoyang.")

S("SUN", "Matahari", "Cuaca",
  lingkar(0, 0.5, "dahi+0.07*atas+0.14*depan+0.07*luar", 0.04, "luar", "depan", n=8, mulai=0,
          a="telunjuk", b="1", j="atas+0.3*depan", tp="depan") +
  [k(0.65, p="dahi+0.06*atas+0.16*depan+0.07*luar", a="ujung", b="FLAT_O", j="bawah+0.4*belakang", tp="belakang"),
   k(0.9, b="5"), k(1.05)],
  cara="Telunjuk menggambar lingkaran di atas kepala, lalu tangan membuka ke arah wajah seperti sinar matahari.")

_WEATHER = [
    k(0, p="netral+0.04*atas+0.05*luar", a="pergelangan", b="W", j="atas+0.3*depan", tp="dalam"),
    *bolak(0.13, 0.13, 5, {"putar": -30}, {"putar": 25}),
    k(0.85, putar=0),
]
S("WEATHER", "Cuaca", "Cuaca", _WEATHER, L=cermin(_WEATHER),
  cara="Dua tangan bentuk W saling berhadapan, diputar bolak-balik di pergelangan.")

S("SPRING", "Musim semi", "Cuaca", [
    k(0, p=A(0.015, -0.33, 1.12), a="ujung", b="FLAT_O", j="atas", tp="dalam"),
    k(0.1),
    k(0.4, p=A(0.015, -0.33, 1.26), b="5"),
    k(0.5, p=A(0.015, -0.33, 1.12), b="FLAT_O"),
    k(0.8, p=A(0.015, -0.33, 1.26), b="5"),
    k(0.95),
], L=[k(0, p=A(0.03, -0.33, 1.17), a="pergelangan", b="C", j="depan+0.3*dalam", tp="dalam")],
  cara="Tangan O-pipih menembus tangan C kiri dari bawah lalu mekar terbuka, dua kali (tunas tumbuh).")

S("SUMMER", "Musim panas", "Cuaca", [
    k(0, p="dahi+0.055*dalam+0.016*depan", a="jari_telunjuk", b="1", j="dalam+0.15*bawah", tp="bawah+0.6*belakang"),
    k(0.12),
    k(0.6, p="dahi+0.075*luar+0.016*depan", b="X"),
    k(0.75),
], cara="Telunjuk ditarik melintasi dahi sambil menekuk (X), seperti menyeka keringat.")

S("FALL", "Musim gugur", "Cuaca", [
    k(0, p=A(0.035, -0.34, 1.27), a="sisi_telunjuk", b="FLAT", j="dalam+0.3*bawah", tp="bawah+0.3*belakang"),
    k(0.12),
    k(0.4, p=A(0.07, -0.31, 1.19)),
    k(0.5, p=A(0.035, -0.34, 1.27)),
    k(0.78, p=A(0.07, -0.31, 1.19)),
    k(0.9),
], L=[k(0, p=A(-0.03, -0.37, 1.38), a="pergelangan", b="5", j="atas+0.3*dalam", tp="belakang+0.5*dalam")],
  cara="Lengan kiri tegak serong; sisi tangan kanan menyapu turun di lengan bawah kiri dua kali (daun gugur).")

_WINTER = [
    k(0, p="dada+0.12*depan+0.07*luar+0.02*atas", a="telapak", b="W", j="atas+0.2*depan", tp="dalam"),
    *bolak(0.08, 0.08, 8, {"p": "dada+0.12*depan+0.09*luar+0.02*atas"}, {"p": "dada+0.12*depan+0.055*luar+0.02*atas"}),
    k(0.8),
]
S("WINTER", "Musim dingin", "Cuaca", _WINTER, L=cermin(_WINTER),
  cara="Dua tangan bentuk W digetarkan seperti menggigil (variasi lain: sama dengan COLD).")

# ── Hobi & waktu luang ─────────────────────────────────────────────────────

S("READ", "Membaca", "Hobi", [
    k(0, p=A(0.0, -0.35, 1.215), a="ujung", b="V", j="depan+0.6*bawah+0.3*dalam", tp="bawah+0.3*belakang", siku="bawah+0.5*luar"),
    k(0.12),
    k(0.45, p=A(0.07, -0.29, 1.215)),
    k(0.55, p=A(0.0, -0.35, 1.215)),
    k(0.85, p=A(0.07, -0.29, 1.215)),
    k(0.95),
], L=[_L(L_TELAPAK_ATAS)],
  cara="Dua jari (bentuk V) menghadap telapak kiri seperti mata, 'membaca' dari ujung ke pangkal.")

_SWIM = [
    k(0, p="netral+0.02*luar+0.02*bawah", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah+0.3*luar"),
    k(0.1),
    k(0.4, p="netral+0.10*depan+0.12*luar+0.02*bawah", j="depan+0.2*luar"),
    k(0.5, p="netral+0.02*luar+0.02*bawah", j="depan+0.3*dalam"),
    k(0.8, p="netral+0.10*depan+0.12*luar+0.02*bawah", j="depan+0.2*luar"),
    k(0.9),
]
S("SWIM", "Berenang", "Hobi", _SWIM, L=cermin(_SWIM), cara="Dua telapak ke bawah didorong maju lalu menyibak ke samping (gaya dada).")

S("MOVIE", "Film / bioskop", "Hobi", [
    k(0, p=A(0.012, -0.34, 1.20), a="tumit", b="5", j="atas", tp="depan+0.4*dalam"),
    *bolak(0.12, 0.13, 6, {"j": "atas+0.35*luar"}, {"j": "atas+0.25*dalam"}),
    k(0.9, j="atas"),
], L=[_L(L_TELAPAK_SAMPING)],
  cara="Pangkal telapak tangan kanan (terbuka) bertumpu di telapak kiri, digoyang ke kiri-kanan.")

S("MUSIC", "Musik", "Hobi", [
    k(0, p=A(0.10, -0.29, 1.21), a="telapak", b="FLAT", j="atas+0.4*dalam", tp="dalam+0.4*bawah"),
    *bolak(0.15, 0.2, 4, {"p": A(-0.01, -0.32, 1.23)}, {"p": A(0.10, -0.29, 1.21)}),
    k(0.85),
], L=[k(0, p=A(-0.05, -0.32, 1.17), a="pergelangan", b="FLAT", j="dalam+0.2*depan", tp="atas+0.3*belakang")],
  cara="Telapak kanan berayun bolak-balik di atas lengan bawah kiri, seperti dirigen.")

S("DANCE", "Menari", "Hobi", [
    k(0, p=A(0.04, -0.31, 1.19), a="ujung", b="V", j="depan+0.7*bawah+0.2*dalam", tp="belakang+0.3*bawah", siku="bawah+0.5*luar"),
    *bolak(0.14, 0.14, 5, {"p": A(0.08, -0.30, 1.20)}, {"p": A(0.0, -0.32, 1.20)}),
    k(0.9),
], L=[_L(L_TELAPAK_ATAS)],
  cara="Bentuk V terbalik (seperti kaki) berayun kiri-kanan di atas telapak kiri.")

_PLAY = [
    k(0, p="netral+0.03*atas+0.07*luar", a="pergelangan", b="Y", j="atas+0.2*depan", tp="belakang+0.6*dalam"),
    *bolak(0.12, 0.12, 6, {"putar": -35}, {"putar": 25}),
    k(0.85, putar=0),
]
S("PLAY", "Bermain", "Hobi", _PLAY, L=cermin(_PLAY), wajah="senang",
  cara="Dua tangan bentuk Y digoyang/diputar di pergelangan.")

S("DONT_LIKE", "Tidak suka", "Perasaan", [
    k(0, p="dada+0.008*depan", a="tengah", b="OPEN_8", j="atas+0.2*dalam", tp="belakang"),
    k(0.12),
    k(0.4, p="dada+0.13*depan", b="8"),
    k(0.65, p="dada+0.20*depan+0.06*bawah+0.05*luar", a="telapak", b="5", j="depan+0.3*luar", tp="bawah"),
    k(0.85),
], kepala=GELENG, wajah="sedih", gloss="DON'T-LIKE",
  cara="Isyarat LIKE ditarik dari dada, lalu tangan dibuka & dilempar ke bawah sambil menggeleng.")
