# [isyarat-bisindo-a1a2-v1] Kamus isyarat BISINDO A1.3 "Bercerita Sederhana".
# Tangan dominan kanan. Banyak isyarat di sini IKONIK (meniru benda/gerak) dan
# bervariasi antardaerah — yang bentuknya belum diyakini ditandai ragu=True dan WAJIB
# dicek pengajar Tuli. Nama kota, SIBI, JBI, ANGKOT, PUSKESMAS dieja jari (tanpa gerak):
# isyarat nama kota berbeda tiap daerah, pengajar Tuli yang menunjukkan bentuk lokalnya.
# ⚠️ Riset daring tidak menemukan deskripsi teks bentuk isyarat untuk kosakata ini;
# bentuk ditulis dari prinsip ikonik umum, BUKAN disalin dari ASL.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # Jepit ibu jari + telunjuk (mengambil obat, menjepit baju/rambut)
    "B13_JEPIT": (I._jari(_G, index=(55, 60, 35)), ("ujung", "index")),
    # Jempol tegak (kepalan, ibu jari ke atas) — PALING
    "B13_JEMPOL": (I._jari(_G), "tegak"),
})

def dua(keys):
    """Kunci simetris dua tangan → (R, L)."""
    return keys, cermin(keys)

GELENG = [(0.1, 0, 0, 0), (0.3, 0, 14, 0), (0.5, 0, -14, 0), (0.7, 0, 12, 0), (0.9, 0, 0, 0)]
ANGGUK = [(0.1, 0, 0, 0), (0.3, 12, 0, 0), (0.5, 0, 0, 0), (0.7, 10, 0, 0), (0.9, 0, 0, 0)]

def eja(kode, arti, kat, cara):
    S(kode, arti, kat, [], cara=cara)

# ── Pergi & datang ─────────────────────────────────────────────────────────

S("PERGI", "Pergi", "Gerak", [
    k(0, p="netral+0.04*belakang+0.06*atas", a="telunjuk", b="1", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.6, p="netral+0.22*depan+0.08*atas+0.05*luar", j="depan+0.1*atas"),
    k(0.8),
], ragu=True, cara="Telunjuk menunjuk ke depan lalu diayunkan maju menjauhi badan, sambil mengucapkan 'pergi' tanpa suara.")

S("DATANG", "Datang", "Gerak", [
    k(0, p="netral+0.22*depan+0.08*atas", a="telunjuk", b="1", j="atas+0.2*belakang", tp="belakang"),
    k(0.15),
    k(0.6, p="netral+0.02*depan+0.06*atas", j="atas"),
    k(0.8),
], ragu=True, cara="Telunjuk tegak di depan, ditarik mendekat ke badan seperti orang datang menghampiri.")

# ── Transportasi ──────────────────────────────────────────────────────────

S("MOTOR", "Sepeda motor", "Transportasi", [
    k(0, p="netral+0.10*luar+0.02*bawah", a="telapak", b="S", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.15, 0.18, 4, {"j": "depan+0.5*atas+0.3*dalam"}, {"j": "depan+0.3*dalam"}),
    k(0.9),
], L=[k(0, p="netral_kiri+0.10*luar+0.02*bawah", a="telapak", b="S", j="depan+0.3*dalam", tp="bawah")],
  cara="Dua kepalan seperti memegang setang; kepalan kanan diputar di pergelangan seperti menarik gas.")

_mob_r = [k(0, p="netral+0.10*luar+0.04*atas", a="telapak", b="S", j="atas+0.3*depan", tp="dalam"),
          *bolak(0.15, 0.2, 4, {"p": "netral+0.10*luar+0.08*atas"}, {"p": "netral+0.10*luar+0.01*atas"}),
          k(0.95)]
_mob_l = [k(0, p="netral_kiri+0.10*luar+0.04*atas", a="telapak", b="S", j="atas+0.3*depan", tp="dalam"),
          *bolak(0.15, 0.2, 4, {"p": "netral_kiri+0.10*luar+0.01*atas"}, {"p": "netral_kiri+0.10*luar+0.08*atas"}),
          k(0.95)]
S("MOBIL", "Mobil", "Transportasi", _mob_r, L=_mob_l,
  cara="Dua kepalan seperti memegang setir bundar, digerakkan naik-turun bergantian seperti memutar setir.")

eja("ANGKOT", "Angkot (angkutan kota)", "Transportasi",
    "Dieja jari: A-N-G-K-O-T. Isyarat angkot berbeda tiap kota — tanyakan bentuk daerahmu ke pengajar Tuli.")

S("OJEK", "Ojek", "Transportasi", [
    k(0, p="netral+0.10*luar+0.02*bawah", a="telapak", b="S", j="depan+0.3*dalam", tp="bawah"),
    k(0.15, j="depan+0.5*atas+0.3*dalam"),
    k(0.3, j="depan+0.3*dalam"),
    k(0.55, p="bahu_kanan+0.10*depan+0.06*atas", a="jempol", b="A", j="atas", tp="dalam"),
    k(0.8, p="bahu_kanan+0.02*depan+0.10*atas", j="atas+0.3*belakang"),
    k(1.0),
], L=[k(0, p="netral_kiri+0.10*luar+0.02*bawah", a="telapak", b="S", j="depan+0.3*dalam", tp="bawah")],
  ragu=True, cara="Tarik gas seperti MOTOR, lalu ibu jari kanan menunjuk ke belakang bahu (penumpang dibonceng).")

S("KERETA", "Kereta api", "Transportasi",
  lingkar(0, 0.9, "netral+0.14*luar+0.02*bawah", 0.05, "depan", "atas", n=8, mulai=180, putaran=1.5,
          a="telapak", b="S", j="depan", tp="dalam") + [k(1.05)],
  ragu=True, cara="Kepalan di samping badan diputar maju berulang seperti roda/batang penggerak kereta, sambil mengucapkan 'kereta'.")

S("PESAWAT", "Pesawat", "Transportasi", [
    k(0, p="netral+0.04*belakang+0.02*atas", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="bawah"),
    k(0.15),
    k(0.45, p="netral+0.10*depan+0.06*atas"),
    k(0.8, p="netral+0.14*depan+0.10*atas+0.03*luar", j="depan+0.25*atas"),
    k(0.95),
], ragu=True, cara="Tangan datar menghadap bawah (badan pesawat) meluncur ke depan lalu naik seperti lepas landas.")

_kap_r = [
    k(0, p=A(-0.012, -0.30, 1.20), a="ujung", b="FLAT", j="depan+0.7*dalam", tp="dalam+0.6*atas"),
    k(0.15),
    k(0.4, p=A(-0.012, -0.35, 1.24)),
    k(0.65, p=A(-0.012, -0.40, 1.20)),
    k(0.9, p=A(-0.012, -0.45, 1.24)),
    k(1.05),
]
_r, _l = _kap_r, cermin(_kap_r)
S("KAPAL", "Kapal", "Transportasi", _r, L=_l, ragu=True,
  cara="Dua telapak dirapatkan membentuk lambung kapal (ujung jari bertemu di depan), lalu maju naik-turun seperti di atas ombak.")

S("NAIK", "Naik (kendaraan / ke atas)", "Gerak", [
    k(0, p="netral+0.04*bawah", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="atas"),
    k(0.15),
    k(0.6, p="netral+0.16*atas+0.04*depan"),
    k(0.8),
], ragu=True, cara="Telapak menghadap atas diangkat dari bawah ke atas, sambil mengucapkan 'naik'.")

# ── Arah & lokasi ─────────────────────────────────────────────────────────

S("KIRI", "Kiri", "Arah", [
    k(0, p="netral+0.06*atas", a="telunjuk", b="1", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.55, p="netral+0.06*atas+0.14*dalam", j="dalam"),
    k(0.75),
], ragu=True, cara="Telunjuk kanan menunjuk ke sisi kiri dan bergerak ke kiri (sebagian daerah memakai bentuk L untuk kiri).")

S("KANAN", "Kanan", "Arah", [
    k(0, p="netral+0.06*atas", a="telunjuk", b="1", j="luar+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.55, p="netral+0.06*atas+0.14*luar", j="luar"),
    k(0.75),
], ragu=True, cara="Telunjuk kanan menunjuk ke sisi kanan dan bergerak ke kanan.")

S("LURUS", "Lurus", "Arah", [
    k(0, p="netral+0.04*belakang+0.06*atas", a="sisi_kelingking", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.6, p="netral+0.24*depan+0.06*atas"),
    k(0.8),
], cara="Tangan datar tegak menyamping (telapak ke dalam) didorong lurus ke depan.")

S("BELOK", "Belok", "Arah", [
    k(0, p="netral+0.04*belakang+0.06*atas", a="sisi_kelingking", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.45, p="netral+0.12*depan+0.06*atas"),
    k(0.75, p="netral+0.12*depan+0.06*atas+0.06*luar", j="luar+0.5*depan", tp="depan+0.3*dalam"),
    k(0.95),
], ragu=True, cara="Tangan datar menyamping maju ke depan lalu berbelok ke samping (arah belokan mengikuti arah sebenarnya).")

S("DEKAT", "Dekat", "Arah", [
    k(0, p="netral+0.06*luar+0.04*atas", a="punggung", b="BENT_B", j="depan+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="netral+0.04*atas+0.06*depan+0.01*luar"),
    k(0.75),
], L=[k(0, p="netral_kiri+0.10*depan+0.04*atas", a="punggung", b="BENT_B", j="depan+0.3*dalam", tp="belakang")],
  ragu=True, cara="Dua tangan datar ditekuk menghadap badan; tangan kanan bergerak mendekat ke punggung tangan kiri hingga hampir menempel.")

S("JAUH", "Jauh", "Arah", [
    k(0, p="netral+0.08*atas", a="telunjuk", b="1", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.7, p="netral+0.30*depan+0.16*atas+0.04*luar", j="depan+0.4*atas"),
    k(0.95),
], wajah="sedih", ragu=True,
  cara="Telunjuk menunjuk dan didorong jauh ke depan-atas, mata sedikit menyipit — makin jauh, gerak makin panjang.")

# ── Tubuh & kesehatan ─────────────────────────────────────────────────────

S("KEPALA", "Kepala", "Tubuh", [
    k(0, p="pelipis+0.02*atas+0.05*luar+0.02*depan", a="telunjuk", b="1", j="dalam+0.3*atas", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "pelipis+0.02*atas+0.008*luar"}, {"p": "pelipis+0.02*atas+0.04*luar"}),
    k(0.75),
], cara="Telunjuk mengetuk sisi atas kepala dua kali.")

S("PERUT", "Perut", "Tubuh", [
    k(0, p="perut+0.05*depan", a="telapak", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "perut+0.012*depan"}, {"p": "perut+0.05*depan"}),
    k(0.75, p="perut+0.012*depan"),
], cara="Telapak tangan datar menepuk perut dua kali.")

S("GIGI", "Gigi", "Tubuh", [
    k(0, p="mulut+0.02*depan+0.02*luar", a="telunjuk", b="1", j="dalam+0.3*atas", tp="belakang"),
    k(0.15),
    k(0.5, p="mulut+0.02*depan+0.02*dalam"),
    k(0.7),
], wajah="senang", cara="Telunjuk menunjuk gigi lalu digeser sedikit ke samping di depan bibir yang memperlihatkan gigi.")

S("OBAT", "Obat", "Kesehatan", [
    k(0, p=A(0.02, -0.33, 1.18), a="jempol", b="B13_JEPIT", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(0.6, p="mulut+0.03*depan", j="atas+0.3*dalam", tp="belakang"),
    k(0.8),
], L=[k(0, p=A(0.03, -0.33, 1.15), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  ragu=True, cara="Jepit 'butir obat' dari telapak kiri dengan ibu jari & telunjuk, lalu bawa ke mulut seperti menelan obat.")

eja("PUSKESMAS", "Puskesmas", "Kesehatan",
    "Dieja jari: P-U-S-K-E-S-M-A-S. Tiap daerah bisa punya singkatan/isyarat sendiri — tanyakan ke pengajar Tuli.")

# ── Deskripsi orang & pakaian ─────────────────────────────────────────────

S("TINGGI", "Tinggi (badan)", "Deskripsi", [
    k(0, p="bahu_kanan+0.18*depan+0.05*luar", a="telapak", b="FLAT", j="dalam+0.6*depan", tp="bawah"),
    k(0.15),
    k(0.6, p="dahi+0.03*atas+0.12*depan+0.10*luar"),
    k(0.85),
], cara="Telapak menghadap bawah diangkat dari bahu ke atas kepala — menunjukkan orang yang tinggi.")

S("PENDEK", "Pendek (badan)", "Deskripsi", [
    k(0, p="netral+0.08*luar+0.04*atas", a="telapak", b="FLAT", j="dalam+0.6*depan", tp="bawah"),
    *bolak(0.15, 0.17, 3, {"p": "netral+0.08*luar+0.10*bawah"}, {"p": "netral+0.08*luar+0.05*bawah"}),
    k(0.8),
], cara="Telapak menghadap bawah ditekan turun rendah di samping badan — menunjukkan orang yang pendek.")

S("RAMBUT", "Rambut", "Deskripsi", [
    k(0, p="telinga+0.01*atas+0.03*luar", a="jempol", b="5", j="atas+0.2*depan", tp="dalam"),
    k(0.2, b="B13_JEPIT"),
    *bolak(0.35, 0.15, 3, {"p": "telinga+0.01*atas+0.06*luar"}, {"p": "telinga+0.01*atas+0.03*luar"}),
    k(0.85),
], cara="Ibu jari & telunjuk menjepit sejumput rambut di samping kepala dan menariknya pelan dua kali.")

_jil = [
    k(0, p="dahi+0.06*atas+0.03*luar+0.02*depan", a="telapak", b="FLAT", j="atas+0.3*dalam", tp="dalam+0.3*belakang"),
    k(0.15),
    k(0.5, p="pipi+0.06*luar+0.02*depan", j="atas", tp="dalam"),
    k(0.85, p="dagu+0.05*bawah+0.04*luar+0.03*depan", j="dalam+0.3*atas", tp="atas+0.4*belakang"),
    k(1.0),
]
S("JILBAB", "Jilbab / kerudung", "Pakaian", _jil, L=cermin(_jil), ragu=True,
  cara="Dua telapak menelusuri dari atas kepala turun di sisi wajah sampai bawah dagu, seperti membingkai jilbab.")

_kac = [
    k(0, p="mata+0.05*depan", a="jempol", b="C", j="atas+0.2*dalam", tp="dalam+0.4*belakang"),
    k(0.15),
    k(0.55, p="mata+0.04*depan+0.05*luar"),
    k(0.75),
]
S("KACAMATA", "Kacamata", "Pakaian", _kac, L=cermin(_kac),
  cara="Dua tangan bentuk C melingkari kedua mata seperti bingkai kacamata, lalu ditarik sedikit ke arah telinga.")

S("BAJU", "Baju", "Pakaian", [
    k(0, p="dada_kanan+0.04*depan", a="jempol", b="5", j="bawah+0.4*dalam", tp="belakang"),
    k(0.15, b="B13_JEPIT"),
    *bolak(0.3, 0.15, 3, {"p": "dada_kanan+0.07*depan"}, {"p": "dada_kanan+0.04*depan"}),
    k(0.8),
], cara="Ibu jari & telunjuk menjepit kain baju di dada dan menariknya pelan dua kali.")

# ── Kata kerja berarah ────────────────────────────────────────────────────

S("MEMBERI", "Memberi", "Kata kerja berarah", [
    k(0, p="dada+0.08*depan+0.06*luar+0.03*bawah", a="telapak", b="FLAT", j="depan+0.4*dalam", tp="atas"),
    k(0.15),
    k(0.6, p="dada+0.28*depan+0.06*luar+0.03*bawah"),
    k(0.8),
], ragu=True,
  cara="Telapak menghadap atas (seperti menyodorkan barang) bergerak dari badan ke arah penerima — arah gerak = siapa memberi kepada siapa.")

S("MEMBANTU", "Membantu", "Kata kerja berarah", [
    k(0, p=A(0.01, -0.30, 1.14), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas"),
    k(0.15),
    k(0.6, p=A(0.01, -0.44, 1.22)),
    k(0.8),
], L=[k(0, p=A(0.02, -0.30, 1.19), a="punggung", b="A", j="depan+0.3*atas", tp="dalam"),
      k(0.15),
      k(0.6, p=A(0.02, -0.44, 1.27)),
      k(0.8)],
  ragu=True, cara="Telapak kanan menopang kepalan kiri dari bawah, lalu keduanya didorong maju-naik ke arah orang yang dibantu.")

S("BERTANYA", "Bertanya", "Kata kerja berarah", [
    k(0, p="dagu+0.04*depan+0.02*bawah", a="telunjuk", b="1", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.6, p="dagu+0.26*depan+0.08*bawah", j="depan+0.4*atas"),
    k(0.8),
], wajah="wh", ragu=True,
  cara="Telunjuk dari dekat dagu bergerak maju ke arah orang yang ditanya, alis berkerut.")

# ── Mau, bisa, harus, boleh ───────────────────────────────────────────────

S("MAU", "Mau / ingin", "Modal", [
    k(0, p="dada+0.012*depan+0.02*luar", a="telapak", b="FLAT", j="dalam+0.4*atas", tp="belakang"),
    k(0.15),
    k(0.55, p="dada+0.12*depan+0.04*luar", j="depan+0.4*dalam", tp="atas"),
    k(0.75),
], ragu=True, cara="Telapak menempel di dada lalu bergerak maju sedikit dan membuka ke atas, sambil mengucapkan 'mau' tanpa suara.")

S("BISA", "Bisa / mampu", "Modal", [
    k(0, p="netral+0.10*atas", a="telapak", b="S", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.5, p="netral+0.01*atas", j="depan+0.2*atas"),
    k(0.7),
], kepala=[(0.1, 0, 0, 0), (0.45, 10, 0, 0), (0.7, 0, 0, 0)], ragu=True,
  cara="Kepalan diturunkan mantap satu kali di depan badan sambil mengangguk dan mengucapkan 'bisa'.")

S("TIDAK_BISA", "Tidak bisa", "Modal", [
    k(0, p="netral+0.10*atas", a="telapak", b="S", j="atas+0.3*depan", tp="dalam"),
    k(0.12),
    k(0.4, p="netral+0.01*atas", j="depan+0.2*atas"),
    k(0.5, p="netral+0.06*atas", b="FLAT", j="atas", tp="depan"),
    *bolak(0.62, 0.14, 4, {"p": "netral+0.06*atas+0.04*luar"}, {"p": "netral+0.06*atas+0.03*dalam"}),
    k(1.15),
], kepala=[(0.4, 0, 0, 0), (0.6, 0, 14, 0), (0.8, 0, -14, 0), (1.0, 0, 10, 0), (1.15, 0, 0, 0)], wajah="sedih",
  gloss="TIDAK-BISA", ragu=True,
  cara="Isyarat BISA lalu telapak terbuka dikibaskan kiri-kanan (tidak) sambil menggeleng.")

S("HARUS", "Harus / wajib", "Modal", [
    k(0, p="netral+0.06*atas+0.06*depan", a="telunjuk", b="1", j="bawah+0.9*depan+0.3*dalam", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.01*bawah+0.06*depan"}, {"p": "netral+0.05*atas+0.06*depan"}),
    k(0.75, p="netral+0.01*bawah+0.06*depan"),
], ragu=True, cara="Telunjuk menunjuk ke bawah dan dihentakkan tegas dua kali di depan badan, wajah serius.")

S("BOLEH", "Boleh", "Modal", [
    k(0, p="netral+0.04*belakang+0.04*atas", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.55, p="netral+0.12*depan+0.04*atas+0.06*luar"),
    k(0.75),
], kepala=ANGGUK, wajah="senang", ragu=True,
  cara="Telapak menghadap atas bergerak maju-membuka seperti mempersilakan, sambil mengangguk.")

# ── Perbandingan & pilihan ────────────────────────────────────────────────

S("LEBIH", "Lebih", "Perbandingan", [
    k(0, p=A(-0.02, -0.33, 1.21), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(0.55, p=A(-0.02, -0.33, 1.33)),
    k(0.75),
], L=[k(0, p=A(0.03, -0.33, 1.19), a="punggung", b="FLAT", j="dalam+0.5*depan", tp="bawah")],
  ragu=True, cara="Tangan kanan datar di atas tangan kiri lalu naik melampauinya — 'lebih' dari yang lain.")

S("PALING", "Paling", "Perbandingan", [
    k(0, p="netral+0.06*atas", a="pergelangan", b="B13_JEMPOL", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.6, p="netral+0.30*atas+0.04*luar", j="atas+0.2*depan"),
    k(0.85),
], wajah="senang", ragu=True,
  cara="Kepalan dengan ibu jari tegak diangkat tinggi ke atas — 'paling', yang nomor satu.")

_sama = [
    k(0, p=A(-0.035, -0.33, 1.24), a="telapak", b="1", j="depan+0.2*dalam", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.012, -0.33, 1.24)}, {"p": A(-0.035, -0.33, 1.24)}),
    k(0.75, p=A(-0.012, -0.33, 1.24)),
]
S("SAMA", "Sama", "Perbandingan", _sama, L=cermin(_sama), ragu=True,
  cara="Dua telunjuk mendatar di depan dada didekatkan hingga bersentuhan dua kali (dua hal yang setara).")

S("ATAU", "Atau", "Perbandingan", [
    k(0, p=A(0.03, -0.34, 1.27), a="telunjuk", b="1", j="dalam+0.3*depan", tp="bawah"),
    k(0.15, p=A(0.045, -0.335, 1.29)),
    k(0.35, p=A(0.03, -0.34, 1.27)),
    k(0.55, p=A(0.045, -0.335, 1.33)),
    k(0.75),
], L=[k(0, p=A(0.06, -0.33, 1.29), a="telapak", b="V", j="atas+0.2*dalam", tp="belakang+0.4*dalam")],
  wajah="ya_tidak", ragu=True,
  cara="Tangan kiri V (dua pilihan); telunjuk kanan menyentuh jari pertama lalu jari kedua bergantian, alis naik.")

S("PILIH", "Pilih / memilih", "Perbandingan", [
    k(0, p=A(0.045, -0.335, 1.33), a="jempol", b="5", j="dalam+0.3*depan", tp="bawah"),
    k(0.2, b="B13_JEPIT"),
    k(0.6, p=A(-0.02, -0.36, 1.38), j="atas+0.4*dalam", tp="dalam"),
    k(0.8),
], L=[k(0, p=A(0.06, -0.33, 1.29), a="telapak", b="5", j="atas+0.2*dalam", tp="belakang+0.4*dalam")],
  ragu=True, cara="Ibu jari & telunjuk kanan 'memetik' satu jari dari tangan kiri yang terbuka, lalu ditarik ke atas.")

# ── Hari besar Indonesia ──────────────────────────────────────────────────

S("LEBARAN", "Lebaran / Idulfitri", "Hari besar", [
    k(0, p=A(-0.01, -0.36, 1.22), a="telapak", b="FLAT", j="depan+0.6*dalam", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.01, -0.36, 1.18)}, {"p": A(-0.01, -0.36, 1.22)}),
    k(0.75, p=A(-0.01, -0.36, 1.20), b="FLAT"),
], L=[k(0, p=A(0.01, -0.36, 1.22), a="telapak", b="FLAT", j="depan+0.6*dalam", tp="dalam"),
      *bolak(0.15, 0.15, 4, {"p": A(0.01, -0.36, 1.18)}, {"p": A(0.01, -0.36, 1.22)}),
      k(0.75, p=A(0.01, -0.36, 1.20))],
  wajah="senang", ragu=True,
  cara="Dua tangan seperti bersalaman (saling bermaafan) digoyang naik-turun, wajah tersenyum.")

S("NATAL", "Natal", "Hari besar", [
    k(0, p=A(-0.005, -0.34, 1.30), a="jari_telunjuk", b="1", j="dalam", tp="belakang"),
    k(0.15),
    k(0.6),
], L=[k(0, p=A(0.0, -0.355, 1.28), a="jari_telunjuk", b="1", j="atas", tp="belakang+0.3*dalam")],
  ragu=True, cara="Telunjuk kiri tegak, telunjuk kanan mendatar di bagian atasnya membentuk tanda salib (sebagian daerah memakai bentuk pohon Natal).")

S("IMLEK", "Imlek / Tahun Baru Imlek", "Hari besar", [
    k(0, p=A(-0.005, -0.33, 1.30), a="punggung", b="S", j="dalam+0.6*atas", tp="depan"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.005, -0.37, 1.27)}, {"p": A(-0.005, -0.33, 1.30)}),
    k(0.75),
], L=[k(0, p=A(0.02, -0.35, 1.30), a="telapak", b="FLAT", j="atas+0.2*dalam", tp="dalam+0.3*belakang"),
      *bolak(0.15, 0.15, 4, {"p": A(0.02, -0.39, 1.27)}, {"p": A(0.02, -0.35, 1.30)}),
      k(0.75)],
  wajah="senang", ragu=True,
  cara="Kepalan kanan ditangkup telapak kiri di depan dada (salam Imlek), digoyang maju dua kali.")

S("NYEPI", "Nyepi", "Hari besar", [
    k(0, p="mulut+0.04*depan", a="telunjuk", b="1", j="atas", tp="belakang"),
    k(0.15, p="mulut+0.015*depan"),
    k(0.45),
    k(0.85, p="netral+0.04*bawah+0.06*luar", b="FLAT", j="depan+0.4*dalam", tp="bawah"),
    k(1.0),
], kepala=[(0.2, 0, 0, 0), (0.6, 8, 0, 0), (1.0, 8, 0, 0)], wajah="tidur", ragu=True,
  cara="Telunjuk di depan bibir (sepi, diam), lalu telapak turun perlahan menghadap bawah dengan kepala tertunduk tenang.")

S("MERDEKA", "Merdeka / 17 Agustus", "Hari besar", [
    k(0, p="bahu_kanan+0.10*depan", a="telapak", b="S", j="atas", tp="dalam"),
    k(0.15),
    k(0.5, p="dahi+0.22*atas+0.14*luar+0.06*depan", j="atas"),
    k(0.85),
], wajah="senang", ragu=True,
  cara="Kepalan diangkat tinggi ke atas kepala dengan semangat, seperti pekik 'merdeka'.")

_lib = [
    k(0, p=A(-0.02, -0.33, 1.27), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.16, -0.36, 1.25), j="depan+0.3*luar"),
    k(0.8),
]
S("LIBUR", "Libur", "Hari besar", _lib, L=cermin(_lib), wajah="senang", ragu=True,
  cara="Dua telapak menghadap bawah di depan dada lalu disapukan ke samping kiri-kanan (kosong, bebas kegiatan).")

# ── Daerah & budaya Tuli ──────────────────────────────────────────────────

S("DAERAH", "Daerah / wilayah", "Budaya",
  lingkar(0, 0.9, "netral+0.02*bawah+0.06*depan", 0.06, "luar", "depan", n=8, mulai=180,
          a="telapak", b="FLAT", j="depan+0.4*dalam", tp="bawah") + [k(1.05)],
  ragu=True, cara="Telapak menghadap bawah digerakkan melingkar mendatar di depan badan, seperti menandai satu wilayah.")

eja("JAKARTA", "Jakarta", "Kota", "Dieja jari: J-A-K-A-R-T-A. Komunitas Tuli Jakarta punya isyarat nama kota sendiri — tanyakan ke pengajar Tuli.")
eja("YOGYAKARTA", "Yogyakarta", "Kota", "Dieja jari: Y-O-G-Y-A-K-A-R-T-A. Isyarat nama kota ini berbeda antardaerah — tanyakan ke pengajar Tuli.")
eja("SOLO", "Solo (Surakarta)", "Kota", "Dieja jari: S-O-L-O. Isyarat nama kota ini berbeda antardaerah — tanyakan ke pengajar Tuli.")
eja("MAKASSAR", "Makassar", "Kota", "Dieja jari: M-A-K-A-S-S-A-R. Isyarat nama kota ini berbeda antardaerah — tanyakan ke pengajar Tuli.")
eja("BALI", "Bali", "Kota", "Dieja jari: B-A-L-I. Isyarat nama pulau ini berbeda antardaerah — tanyakan ke pengajar Tuli.")
eja("SIBI", "SIBI (Sistem Isyarat Bahasa Indonesia)", "Budaya", "Dieja jari: S-I-B-I (singkatan).")
eja("JBI", "JBI (Juru Bahasa Isyarat)", "Budaya", "Dieja jari: J-B-I (singkatan).")

_tv = [
    k(0, p=A(-0.01, -0.34, 1.34), a="telunjuk", b="1", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.4, p=A(-0.11, -0.34, 1.34)),
    k(0.65, p=A(-0.11, -0.34, 1.22)),
    k(0.9, p=A(-0.01, -0.34, 1.22)),
    k(1.0),
]
S("TV", "Televisi / TV", "Budaya", _tv, L=cermin(_tv), ragu=True,
  cara="Dua telunjuk menggambar bentuk persegi layar TV di depan badan (mulai dari atas tengah, ke samping, lalu turun dan bertemu di bawah).")

_kom = lingkar(0, 0.9, "netral+0.06*depan+0.02*atas+0.06*luar", 0.05, "depan", "luar", n=8, mulai=90,
               a="telapak", b="CLAW", j="depan+0.2*atas", tp="bawah+0.3*dalam") + [k(1.05)]
S("KOMUNITAS", "Komunitas", "Budaya", _kom, L=cermin(_kom), ragu=True,
  cara="Dua tangan jari renggang-melengkung (banyak orang) bergerak melingkar mendatar di depan badan — kumpulan orang.")

S("SEJARAH", "Sejarah / masa lalu", "Budaya", [
    k(0, p="bahu_kanan+0.14*depan+0.06*atas", a="telapak", b="FLAT", j="atas+0.2*belakang", tp="belakang"),
    k(0.15),
    k(0.45, p="bahu_kanan+0.02*belakang+0.12*atas+0.02*luar", j="belakang+0.6*atas"),
    k(0.6, p="bahu_kanan+0.10*depan+0.08*atas", j="atas+0.2*belakang"),
    k(0.9, p="bahu_kanan+0.02*belakang+0.12*atas+0.02*luar", j="belakang+0.6*atas"),
    k(1.05),
], ragu=True,
  cara="Tangan datar di depan bahu diayun ke belakang melewati bahu dua kali (masa lalu yang jauh), sambil mengucapkan 'sejarah'.")

S("VIDEO_CALL", "Video call / panggilan video", "Teknologi", [
    k(0, p="netral+0.12*atas+0.06*depan", a="telapak", b="5", j="atas", tp="depan"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.12*atas+0.06*depan+0.03*luar"}, {"p": "netral+0.12*atas+0.06*depan+0.01*dalam"}),
    k(0.8),
], L=[k(0, p="netral_kiri+0.18*atas+0.10*depan", a="telapak", b="FLAT", j="atas", tp="belakang+0.3*luar")],
  wajah="senang", gloss="VIDEO-CALL", ragu=True,
  cara="Tangan kiri tegak di depan wajah seperti memegang layar HP; tangan kanan melambai/berisyarat di depannya.")

S("CERITA", "Cerita / bercerita", "Budaya", [
    k(0, p="dagu+0.06*depan+0.05*bawah", a="telapak", b="FLAT_O", j="depan+0.4*atas", tp="dalam"),
    k(0.15),
    k(0.45, p="dagu+0.20*depan+0.10*bawah", b="5", j="depan+0.3*atas", tp="atas"),
    k(0.6, p="dagu+0.06*depan+0.05*bawah", b="FLAT_O", j="depan+0.4*atas", tp="dalam"),
    k(0.9, p="dagu+0.20*depan+0.10*bawah", b="5", j="depan+0.3*atas", tp="atas"),
    k(1.05),
], L=[k(0, p="netral_kiri+0.10*depan", a="telapak", b="FLAT_O", j="depan+0.4*atas", tp="dalam"),
      k(0.3), k(0.6, p="netral_kiri+0.22*depan", b="5", tp="atas"), k(0.75, p="netral_kiri+0.10*depan", b="FLAT_O", tp="dalam"),
      k(1.05, p="netral_kiri+0.22*depan", b="5", tp="atas")],
  ragu=True, cara="Tangan kuncup dari depan mulut membuka maju berulang (kata-kata mengalir keluar), tangan kiri ikut bergantian.")
