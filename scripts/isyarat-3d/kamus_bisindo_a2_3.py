# [isyarat-bisindo-a1a2-v1] Kamus isyarat BISINDO A2.3 "Bercerita Lebih Hidup".
# Penanda waktu lanjutan, urutan/daftar di jari, kata penghubung, kalimat bersyarat,
# tangan menggambarkan gerak (orang berjalan, mobil melaju, berdiri/duduk/jatuh),
# kata kerja berarah, dan kosakata cerita (ingat, lupa, lucu, tiba-tiba …).
# Tangan dominan = kanan (R), tangan pasif = kiri (L).
#
# ⚠️ Tidak ada rujukan tertulis BISINDO yang cukup rinci untuk sebagian besar kata di sini
# (kamus/dataset terbuka umumnya hanya abjad & angka; BISINDO juga bervariasi antardaerah).
# Bentuk ditulis sebagai bentuk ikonik/umum yang masuk akal dan HAMPIR SEMUA ditandai
# ragu=True — WAJIB dicek pengajar Tuli sebelum dipakai sebagai acuan.
# Banyak isyarat BISINDO disertai gerak bibir kata Indonesianya; disebut di `cara`.
from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # V bengkok (dua "kaki" menekuk) untuk DUDUK
    "B23_V_TEKUK": (I._jari(_G, index=(30, 80, 45, 8), middle=(30, 80, 45, -5)), "depan_genggam_manis"),
    # Telunjuk & ibu jari membentuk jarak kecil (sepotong kata)
    "B23_JEPIT": (I._jari(_G, index=(35, 40, 20)), "keluar_L"),
})

# Telapak kiri datar menghadap atas = "lantai/tanah" untuk isyarat tangan-menggambarkan-gerak
_LANTAI = [k(0, p=A(0.03, -0.33, 1.17), a="telapak", b="FLAT", j="dalam+0.6*depan", tp="atas")]
_LT = A(0.025, -0.335, 1.188)   # titik di atas permukaan telapak kiri

# ── Penanda waktu lanjutan ─────────────────────────────────────────────────

S("BARU_SAJA", "Baru saja / tadi", "Waktu", [
    k(0, p="bahu_kanan+0.13*depan+0.05*atas+0.02*dalam", a="telunjuk", b="1", j="atas+0.4*belakang", tp="dalam"),
    k(0.15),
    *bolak(0.30, 0.14, 4, {"p": "bahu_kanan+0.09*depan+0.06*atas+0.02*dalam"}, {"p": "bahu_kanan+0.13*depan+0.05*atas+0.02*dalam"}),
    k(0.9),
], ragu=True,
  cara="Telunjuk tegak di depan bahu kanan digerakkan kecil ke belakang dua kali (lampau yang dekat), sambil mengucapkan 'baru' tanpa suara.")

S("DULU", "Dulu / dahulu", "Waktu", [
    k(0, p="bahu_kanan+0.20*depan+0.08*atas+0.02*dalam", a="telapak", b="FLAT", j="atas+0.3*depan", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.70, p="bahu_kanan+0.04*depan+0.15*atas+0.03*luar", j="atas+0.6*belakang", tp="belakang+0.4*bawah"),
    k(0.9),
], kepala=[(0.15, 0, 0, 0), (0.7, -5, 0, 0)], ragu=True,
  cara="Telapak datar di depan bahu kanan diayun melengkung ke belakang melewati bahu (ruang di belakang = masa lalu), sambil mengucapkan 'dulu'.")

S("SEJAK", "Sejak", "Waktu", [
    k(0, p="bahu_kanan+0.08*depan+0.04*atas+0.02*dalam", a="telunjuk", b="1", j="belakang+0.5*atas", tp="dalam+0.3*atas"),
    k(0.15),
    k(0.70, p="netral+0.22*depan+0.04*atas", j="depan+0.2*atas", tp="dalam+0.3*atas"),
    k(0.9),
], ragu=True,
  cara="Telunjuk mulai di dekat bahu menunjuk ke belakang, lalu bergerak lurus maju ke depan badan (dari dulu sampai sekarang), sambil mengucapkan 'sejak'.")

_PERNAH = [
    k(0, p=(_LT, ["0.06*atas", "0.02*luar"]), a="telunjuk", b="1", j="depan+0.7*bawah+0.3*dalam", tp="dalam+0.3*bawah", siku="bawah+0.5*luar"),
    k(0.15),
    k(0.35, p=(_LT, ["0.008*atas"])),
    k(0.50),
    k(0.85, p="bahu_kanan+0.10*depan+0.06*atas+0.02*dalam", j="atas+0.4*belakang", tp="dalam"),
    k(1.0),
]
S("PERNAH", "Pernah", "Waktu", _PERNAH, L=_LANTAI + [k(1.0)], ragu=True,
  cara="Ujung telunjuk kanan menyentuh telapak kiri sekali (pernah 'mengalami'), lalu tangan kanan bergerak ke belakang bahu, sambil mengucapkan 'pernah'.")

S("BELUM_PERNAH", "Belum pernah", "Waktu", [
    k(0, p="netral+0.08*atas+0.03*luar", a="pergelangan", b="1", j="atas", tp="depan"),
    *bolak(0.12, 0.14, 4, {"j": "atas+0.35*luar"}, {"j": "atas+0.35*dalam"}),
    k(0.70, j="atas"),
    k(1.05, p="bahu_kanan+0.10*depan+0.06*atas+0.02*dalam", a="telunjuk", j="atas+0.4*belakang", tp="dalam"),
    k(1.2),
], kepala=[(0.1, 0, 0, 0), (0.3, 0, 12, 0), (0.5, 0, -12, 0), (0.7, 0, 8, 0), (0.95, 0, 0, 0)], ragu=True,
  cara="Telunjuk tegak digoyang kiri-kanan (belum) sambil menggeleng, lalu bergerak ke belakang bahu, sambil mengucapkan 'belum pernah'.")

# ── Aspek: terus, mulai, selesai ───────────────────────────────────────────

S("TERUS", "Terus / terus-menerus", "Aspek", [
    k(0, p="dada_kanan+0.10*depan+0.06*bawah", a="sisi_kelingking", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.85, p="dada_kanan+0.34*depan+0.04*bawah"),
    k(1.0),
], ragu=True,
  cara="Tangan datar tegak (telapak menghadap ke dalam) didorong lurus dan panjang ke depan tanpa berhenti, sambil mengucapkan 'terus'.")

S("MULAI", "Mulai", "Aspek", [
    k(0, p=A(0.0, -0.33, 1.25), a="telapak", b="FLAT", j="atas+0.5*depan", tp="dalam"),
    k(0.15),
    k(0.60, p=A(-0.05, -0.47, 1.27)),
    k(0.8),
], L=[k(0, p=A(0.03, -0.33, 1.25), a="telapak", b="FLAT", j="atas+0.5*depan", tp="dalam")], ragu=True,
  cara="Dua telapak datar tegak saling berhadapan; tangan kanan bergerak maju meninggalkan tangan kiri (berangkat dari titik awal), sambil mengucapkan 'mulai'.")

_SELESAI = [
    k(0, p="netral+0.10*atas+0.06*dalam", a="telapak", b="5", j="depan+0.4*dalam", tp="bawah"),
    k(0.15),
    k(0.55, p="netral+0.02*atas+0.10*luar+0.05*depan", j="depan+0.4*luar", tp="bawah+0.3*luar"),
    k(0.75),
]
S("SELESAI", "Selesai / sudah beres", "Aspek", _SELESAI, L=cermin(_SELESAI), ragu=True,
  cara="Dua tangan terbuka, telapak menghadap bawah di depan dada, diayun menyebar ke samping-bawah (habis, beres), sambil mengucapkan 'selesai'.")

# ── Urutan & daftar di jari tangan pasif ───────────────────────────────────
# Tangan kiri bentuk 4 (telapak ke diri sendiri, jari ke atas-dalam); tiap jari = satu
# butir. Urutan jari mengikuti cara BISINDO menghitung (telunjuk = 1).

_TITIK_DAFTAR = A(0.055, -0.31, 1.345)

def _ketuk(nama, arti, anchor_kiri, cara, ragu=True):
    L = [k(0, p=_TITIK_DAFTAR, a=anchor_kiri, b="4", j="atas+0.35*dalam", tp="belakang+0.3*dalam"), k(0.9)]
    S(nama, arti, "Urutan", [
        k(0, p=(_TITIK_DAFTAR, ["0.05*luar", "0.03*atas", "0.03*depan"]), a="telunjuk", b="1", j="dalam+0.3*atas+0.2*belakang", tp="bawah+0.3*belakang"),
        k(0.2),
        k(0.42, p=(_TITIK_DAFTAR, ["0.012*luar", "0.008*depan"])),
        k(0.62, p=(_TITIK_DAFTAR, ["0.06*luar", "0.02*atas", "0.03*depan"])),
        k(0.8),
    ], L=L, cara=cara, ragu=ragu)

_ketuk("PERTAMA", "Pertama (dalam daftar)", "telunjuk",
       "Tangan kiri terbuka empat jari, telapak ke diri sendiri; telunjuk kanan menyentuh ujung telunjuk kiri (butir pertama), sambil mengucapkan 'pertama'.")
_ketuk("KEDUA", "Kedua (dalam daftar)", "tengah",
       "Tangan kiri tetap empat jari; telunjuk kanan menyentuh ujung jari tengah kiri (butir kedua), sambil mengucapkan 'kedua'.")
_ketuk("KETIGA", "Ketiga (dalam daftar)", "manis",
       "Tangan kiri tetap empat jari; telunjuk kanan menyentuh ujung jari manis kiri (butir ketiga), sambil mengucapkan 'ketiga'.")

S("TERAKHIR", "Terakhir", "Urutan", [
    k(0, p=(_TITIK_DAFTAR, ["0.05*luar", "0.03*atas", "0.03*depan"]), a="telunjuk", b="1", j="dalam+0.3*atas+0.2*belakang", tp="bawah+0.3*belakang"),
    k(0.2),
    k(0.42, p=(_TITIK_DAFTAR, ["0.010*luar", "0.008*depan"])),
    k(0.70, p=(_TITIK_DAFTAR, ["0.02*luar", "0.10*bawah", "0.03*depan"])),
    k(0.85),
], L=[k(0, p=_TITIK_DAFTAR, a="kelingking", b="4", j="atas+0.35*dalam", tp="belakang+0.3*dalam"), k(0.9)], ragu=True,
  cara="Tangan kiri empat jari; telunjuk kanan menyentuh kelingking kiri (butir paling ujung) lalu turun ke bawah, sambil mengucapkan 'terakhir'.")

# ── Kata penghubung ────────────────────────────────────────────────────────

S("TAPI", "Tapi / tetapi", "Penghubung", [
    k(0, p="netral+0.10*atas+0.02*dalam", a="sisi_kelingking", b="FLAT", j="atas+0.4*depan", tp="dalam"),
    k(0.15),
    k(0.50, p="netral+0.02*atas+0.10*luar+0.04*depan", j="atas+0.6*depan+0.3*luar", tp="dalam+0.3*bawah"),
    k(0.7),
], ragu=True,
  cara="Tangan datar tegak (telapak ke dalam) di depan dada dibelokkan ke samping-luar sekali (arah cerita berbelok), sambil mengucapkan 'tapi'.")

S("LALU", "Lalu / kemudian", "Penghubung", [
    k(0, p="dada_kanan+0.10*depan+0.04*bawah", a="sisi_kelingking", b="FLAT", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.32, p="dada_kanan+0.18*depan+0.02*atas"),
    k(0.50, p="dada_kanan+0.26*depan+0.04*bawah"),
    k(0.7),
], ragu=True,
  cara="Tangan datar tegak melompat melengkung satu langkah ke depan (ke kejadian berikutnya), sambil mengucapkan 'lalu'.")

S("KARENA", "Karena", "Penghubung", [
    k(0, p="pelipis+0.015*depan", a="telunjuk", b="1", j="atas+0.4*dalam", tp="belakang+0.4*dalam"),
    k(0.15),
    k(0.60, p="netral+0.12*atas+0.12*depan", j="depan+0.3*atas", tp="dalam+0.3*bawah"),
    k(0.8),
], ragu=True,
  cara="Telunjuk menyentuh pelipis (alasan dari pikiran) lalu bergerak maju-turun menunjuk ke depan, sambil mengucapkan 'karena'.")

_JADI = [
    k(0, p="netral+0.12*atas+0.04*dalam", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.45, p="netral+0.01*atas+0.04*dalam+0.04*depan"),
    k(0.7),
]
S("JADI", "Jadi / sehingga", "Penghubung", _JADI, L=cermin(_JADI), ragu=True,
  cara="Dua telapak datar menghadap bawah di depan dada ditekan turun sekali (hasilnya …), sambil mengucapkan 'jadi'.")

S("KALAU", "Kalau / jika", "Penghubung", [
    k(0, p="netral+0.05*atas+0.06*depan", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    *bolak(0.30, 0.16, 3, {"p": "netral+0.10*atas+0.06*depan", "j": "depan+0.3*dalam+0.2*atas"}, {"p": "netral+0.05*atas+0.06*depan", "j": "depan+0.3*dalam"}),
    k(0.85),
], kepala=[(0.15, 0, 0, 0), (0.4, -6, 0, 4), (0.85, -6, 0, 4)], wajah="ya_tidak", ragu=True,
  cara="Telapak datar menghadap atas di depan badan diangkat-turunkan kecil seperti menimbang, alis naik dan kepala sedikit miring (bagian syarat), sambil mengucapkan 'kalau'.")

# ── Tangan menggambarkan gerak ─────────────────────────────────────────────

def _langkah(base, n, dt, mulai_depan):
    a = {"p": f"{base}+0.02*bawah+0.02*luar+0.05*depan", "j": "depan+0.2*dalam"}
    b = {"p": f"{base}+0.02*bawah+0.02*luar+0.13*depan", "j": "depan+0.2*dalam+0.25*bawah"}
    if mulai_depan: a, b = b, a
    return [k(0, a="telapak", b="FLAT", tp="bawah", **a), *bolak(dt, dt, n, b, a)]

S("JALAN", "Jalan / berjalan", "Gerak", _langkah("netral", 4, 0.22, False) + [k(1.15)],
  L=_langkah("netral_kiri", 4, 0.22, True) + [k(1.15)], ragu=True,
  cara="Dua telapak datar menghadap bawah melangkah maju bergantian seperti dua telapak kaki, sambil mengucapkan 'jalan'.")

S("B23_JALAN_TERUS", "Berjalan terus-menerus (lama)", "Aspek", _langkah("netral", 6, 0.36, False) + [k(2.6)],
  L=_langkah("netral_kiri", 6, 0.36, True) + [k(2.6)],
  kepala=[(0.0, 0, 0, 0), (0.6, 5, 0, 0), (1.2, 0, 0, 0), (1.8, 5, 0, 0), (2.4, 0, 0, 0)],
  wajah="sedih", gloss="JALAN++", ragu=True,
  cara="Isyarat JALAN diulang berkali-kali dengan tempo lambat dan berat, wajah lelah — 'jalan terus, lama sekali'.")

S("B23_ORANG_JALAN", "Orang berjalan (tangan = orang)", "Gerak", [
    k(0, p="dada_kanan+0.08*depan+0.06*bawah+0.03*luar", a="telunjuk", b="1", j="atas", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.40, p="dada_kanan+0.15*depan+0.04*bawah+0.03*luar"),
    k(0.65, p="dada_kanan+0.22*depan+0.06*bawah+0.03*luar"),
    k(0.90, p="dada_kanan+0.30*depan+0.04*bawah+0.03*luar"),
    k(1.05),
], gloss="ORANG-JALAN", ragu=True,
  cara="Telunjuk tegak mewakili satu orang; tangan bergerak maju sambil sedikit naik-turun mengikuti langkah — jalurnya menunjukkan ke mana orang itu berjalan.")

S("B23_MOBIL_LAJU", "Mobil melaju (tangan = mobil)", "Gerak", [
    k(0, p="netral+0.10*luar+0.02*belakang", a="telapak", b="FLAT", j="depan+0.6*dalam", tp="bawah"),
    k(0.15),
    k(0.70, p="netral_kiri+0.08*luar+0.10*depan", j="depan+0.8*dalam"),
    k(0.85),
], gloss="MOBIL-LAJU", ragu=True,
  cara="Tangan datar menghadap bawah mewakili mobil, meluncur cepat dari kanan ke kiri depan — kecepatan gerak tangan = kecepatan mobil.")

S("BERDIRI", "Berdiri", "Gerak", [
    k(0, p=(_LT, ["0.08*atas"]), a="telunjuk", b="V", j="bawah+0.45*depan+0.2*dalam", tp="belakang+0.3*dalam", siku="bawah+0.6*luar"),
    k(0.15),
    k(0.45, p=(_LT, ["0.004*atas"])),
    k(0.75),
], L=_LANTAI + [k(0.75)], ragu=True,
  cara="Dua jari kanan (V terbalik) mewakili dua kaki, diletakkan berdiri di atas telapak kiri yang datar, sambil mengucapkan 'berdiri'.")

S("DUDUK", "Duduk", "Gerak", [
    k(0, p=(_LT, ["0.08*atas", "0.02*belakang"]), a="telunjuk", b="V", j="bawah+0.45*depan+0.2*dalam", tp="belakang+0.3*dalam", siku="bawah+0.6*luar"),
    k(0.15),
    k(0.50, p=(_LT, ["0.006*atas"]), b="B23_V_TEKUK", j="depan+0.4*bawah", tp="bawah+0.4*belakang"),
    k(0.8),
], L=_LANTAI + [k(0.8)], ragu=True,
  cara="Dua jari kanan (V) turun ke telapak kiri lalu menekuk seperti kaki yang duduk, sambil mengucapkan 'duduk'.")

S("JATUH", "Jatuh", "Gerak", [
    k(0, p=(_LT, ["0.004*atas"]), a="telunjuk", b="V", j="bawah+0.45*depan+0.2*dalam", tp="belakang+0.3*dalam", siku="bawah+0.6*luar"),
    k(0.20),
    k(0.45, p=(_LT, ["0.05*atas", "0.06*depan"]), j="depan+0.3*bawah", tp="bawah"),
    k(0.70, p=(_LT, ["0.06*bawah", "0.12*depan"]), a="punggung", j="depan+0.2*dalam", tp="atas"),
    k(0.9),
], L=_LANTAI + [k(0.9)], kepala=[(0.3, 0, 0, 0), (0.6, 6, 0, 0)], ragu=True,
  cara="V terbalik berdiri di telapak kiri lalu terlempar ke depan dan rebah telentang di bawah (orang jatuh), wajah kaget, sambil mengucapkan 'jatuh'.")

S("TURUN", "Turun", "Gerak", [
    k(0, p="netral+0.08*atas+0.10*depan", a="telunjuk", b="1", j="bawah+0.45*depan+0.2*dalam", tp="belakang+0.3*dalam", siku="bawah+0.6*luar"),
    k(0.15),
    k(0.65, p="netral+0.12*bawah+0.10*depan"),
    k(0.8),
], ragu=True,
  cara="Telunjuk menunjuk ke bawah bergerak turun dari depan dada ke bawah, sambil mengucapkan 'turun'.")

# ── Kata kerja berarah ─────────────────────────────────────────────────────

S("MEMBERI_TAHU", "Memberi tahu", "Kata kerja berarah", [
    k(0, p="mulut+0.03*depan+0.01*bawah", a="telunjuk", b="1", j="atas+0.3*depan", tp="dalam+0.3*belakang"),
    k(0.15),
    k(0.60, p="netral+0.16*atas+0.18*depan", j="depan+0.3*atas", tp="dalam+0.4*bawah"),
    k(0.8),
], ragu=True,
  cara="Telunjuk mulai di depan mulut lalu bergerak ke arah orang yang diberi tahu (arah gerak = dari siapa ke siapa), sambil mengucapkan 'kasih tahu'.")

S("MENGAJAK", "Mengajak", "Kata kerja berarah", [
    k(0, p="netral+0.10*atas+0.22*depan", a="telapak", b="5", j="depan+0.4*atas", tp="atas+0.5*belakang"),
    k(0.15),
    k(0.60, p="netral+0.08*atas+0.04*depan", b="5_TEKUK", j="atas+0.4*depan", tp="belakang+0.4*atas"),
    k(0.8),
], ragu=True,
  cara="Tangan terbuka di depan (ke arah orang yang diajak) ditarik ke arah diri sendiri sambil jari menekuk, sambil mengucapkan 'ajak'.")

# ── Kenangan & perasaan cerita ─────────────────────────────────────────────

S("WAKTU_KECIL", "Waktu kecil / masa kecil", "Waktu", [
    k(0, p="perut+0.12*luar+0.10*depan+0.02*atas", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    *bolak(0.30, 0.16, 4, {"p": "perut+0.12*luar+0.10*depan+0.03*bawah"}, {"p": "perut+0.12*luar+0.10*depan+0.02*atas"}),
    k(0.95),
], ragu=True,
  cara="Telapak datar menghadap bawah setinggi perut (tinggi badan anak) ditepuk turun kecil dua kali, sambil mengucapkan 'waktu kecil'; sering diikuti DULU.")

S("INGAT", "Ingat", "Pikiran", [
    k(0, p="pelipis+0.05*depan", a="telunjuk", b="1", j="atas+0.4*dalam", tp="belakang+0.4*dalam"),
    k(0.15),
    *bolak(0.30, 0.14, 4, {"p": "pelipis+0.012*depan"}, {"p": "pelipis+0.04*depan"}),
    k(0.85, p="pelipis+0.012*depan"),
], ragu=True,
  cara="Ujung telunjuk mengetuk pelipis dua kali (simpan di kepala), sambil mengucapkan 'ingat'.")

S("LUPA", "Lupa", "Pikiran", [
    k(0, p="pelipis+0.015*depan", a="ujung", b="FLAT_O", j="atas+0.4*dalam", tp="belakang+0.4*dalam"),
    k(0.15),
    k(0.60, p="pelipis+0.16*depan+0.08*luar+0.02*atas", b="5", j="atas+0.3*depan", tp="depan+0.3*luar"),
    k(0.8),
], wajah="sedih", ragu=True,
  cara="Jari kuncup di pelipis lalu tangan menjauh sambil membuka (ingatan terlepas dari kepala), wajah bingung, sambil mengucapkan 'lupa'.")

S("LUCU", "Lucu", "Perasaan", [
    k(0, p="dagu+0.05*depan+0.03*bawah", a="ujung", b="5_TEKUK", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    *bolak(0.25, 0.12, 6, {"b": "5"}, {"b": "5_TEKUK"}),
    k(0.95),
], wajah="senang", kepala=[(0.2, 0, 0, 0), (0.5, -4, 0, 3), (0.9, 0, 0, 0)], ragu=True,
  cara="Tangan terbuka di depan dagu, jari ditekuk-buka cepat beberapa kali dengan wajah geli, sambil mengucapkan 'lucu'.")

_TAWA = [
    k(0, p="mulut+0.030*luar+0.022*depan", a="telunjuk", b="1", j="atas+0.6*dalam", tp="belakang+0.3*dalam"),
    k(0.12),
    *bolak(0.24, 0.13, 4, {"p": "mulut+0.060*luar+0.030*depan+0.02*atas"}, {"p": "mulut+0.030*luar+0.022*depan"}),
    k(0.8),
]
S("TERTAWA", "Tertawa", "Perasaan", _TAWA, L=cermin(_TAWA), wajah="senang",
  kepala=[(0.2, 0, 0, 0), (0.45, -8, 0, 0), (0.8, 0, 0, 0)], ragu=True,
  cara="Dua telunjuk di sudut mulut ditarik ke samping-atas berulang (mulut tertawa lebar), kepala sedikit menengadah.")

_TAWA_TERUS = [
    k(0, p="mulut+0.030*luar+0.022*depan", a="telunjuk", b="1", j="atas+0.6*dalam", tp="belakang+0.3*dalam"),
    k(0.12),
    *bolak(0.24, 0.13, 12, {"p": "mulut+0.060*luar+0.030*depan+0.02*atas"}, {"p": "mulut+0.030*luar+0.022*depan"}),
    k(1.8),
]
S("B23_TERTAWA_TERUS", "Tertawa terus / tak berhenti tertawa", "Aspek", _TAWA_TERUS, L=cermin(_TAWA_TERUS), wajah="senang",
  kepala=[(0.2, 0, 0, 0), (0.6, -8, 0, 3), (1.0, -4, 0, -3), (1.4, -8, 0, 3), (1.8, 0, 0, 0)], gloss="TERTAWA++", ragu=True,
  cara="Isyarat TERTAWA diulang lama tanpa jeda dengan kepala bergoyang — 'tertawa terus, tak bisa berhenti'.")

S("TIBA_TIBA", "Tiba-tiba", "Cerita", [
    k(0, p="netral+0.10*atas+0.04*depan", a="ujung", b="FLAT_O", j="atas+0.4*depan", tp="depan+0.3*dalam"),
    k(0.25),
    k(0.42, p="netral+0.14*atas+0.14*depan", b="5", j="atas+0.3*depan", tp="depan"),
    k(0.75),
], wajah="ya_tidak", kepala=[(0.25, 0, 0, 0), (0.42, -8, 0, 0), (0.75, -5, 0, 0)], ragu=True,
  cara="Jari kuncup di depan dada dibuka mendadak ke depan (5) dengan mata membelalak dan kepala tersentak, sambil mengucapkan 'tiba-tiba'.")

S("ANEH", "Aneh", "Cerita", [
    k(0, p="pipi+0.08*depan+0.04*luar", a="telunjuk", b="1", j="atas+0.3*dalam", tp="depan+0.3*dalam"),
    k(0.15),
    *bolak(0.30, 0.15, 4, {"j": "atas+0.5*luar"}, {"j": "atas+0.3*dalam"}),
    k(0.95),
], wajah="wh", kepala=[(0.2, 0, 0, 0), (0.5, 0, 0, 8), (0.95, 0, 0, 6)], ragu=True,
  cara="Telunjuk tegak di samping wajah digoyang miring-tegak dengan alis berkerut dan kepala miring (heran), sambil mengucapkan 'aneh'.")

_TERJADI = [
    k(0, p="netral+0.02*atas+0.05*dalam", a="telapak", b="FLAT", j="depan+0.4*dalam", tp="atas"),
    k(0.15),
    k(0.55, p="netral+0.08*atas+0.10*luar+0.08*depan", b="5", j="depan+0.3*luar+0.2*atas", tp="atas+0.3*depan"),
    k(0.75),
]
S("TERJADI", "Terjadi", "Cerita", _TERJADI, L=cermin(_TERJADI), ragu=True,
  cara="Dua telapak menghadap atas di depan badan bergerak maju-menyebar sambil membuka (sesuatu muncul), sambil mengucapkan 'terjadi'.")

S("AKHIRNYA", "Akhirnya", "Cerita", [
    k(0, p=A(-0.02, -0.29, 1.27), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p=A(-0.02, -0.46, 1.25)),
    k(0.70, p=A(-0.02, -0.47, 1.21)),
    k(0.9),
], L=[k(0, p=A(0.035, -0.35, 1.22), a="telapak", b="FLAT", j="depan+0.4*dalam", tp="dalam+0.2*atas")],
  kepala=[(0.5, 0, 0, 0), (0.7, 6, 0, 0)], ragu=True,
  cara="Tangan kanan datar meluncur maju menyusuri telapak kiri lalu jatuh di ujung jarinya (sampai di akhir), kepala mengangguk, sambil mengucapkan 'akhirnya'.")

# ── Puisi, ucapan, pesan ───────────────────────────────────────────────────

S("PUISI", "Puisi", "Seni", [
    k(0, p="dada_kanan+0.12*depan+0.04*atas", a="telapak", b="FLAT", j="atas+0.3*dalam", tp="dalam+0.3*belakang"),
    k(0.15),
    *bolak(0.30, 0.22, 4, {"p": "dada_kanan+0.18*depan+0.10*atas+0.06*luar", "j": "atas+0.3*luar"},
           {"p": "dada_kanan+0.12*depan+0.04*atas", "j": "atas+0.3*dalam"}),
    k(1.25),
], L=[k(0, p="netral_kiri+0.02*bawah", a="telapak", b="FLAT", j="atas+0.4*depan", tp="belakang+0.3*dalam")],
  kepala=[(0.3, 0, 0, 3), (0.75, 0, 0, -3), (1.2, 0, 0, 0)], ragu=True,
  cara="Tangan kiri datar seperti lembar kertas; tangan kanan datar mengayun berirama di depan dada ke samping, sambil mengucapkan 'puisi'.")

S("BILANG", "Bilang / berkata", "Ucapan", [
    k(0, p="mulut+0.025*depan+0.01*bawah", a="telunjuk", b="1", j="atas+0.4*depan+0.2*dalam", tp="dalam+0.3*belakang"),
    k(0.15),
    k(0.50, p="mulut+0.16*depan+0.06*bawah", j="depan+0.3*atas", tp="dalam+0.3*bawah"),
    k(0.7),
], ragu=True,
  cara="Telunjuk di depan mulut bergerak maju sekali (kata keluar dari mulut), sambil mengucapkan 'bilang'.")

S("KATA", "Kata", "Ucapan", [
    k(0, p="mulut+0.07*depan+0.03*luar+0.02*bawah", a="telunjuk", b="B23_JEPIT", j="atas+0.5*dalam", tp="depan+0.5*dalam", siku="bawah+0.4*luar"),
    k(0.15),
    *bolak(0.30, 0.14, 2, {"p": "mulut+0.12*depan+0.04*luar+0.03*bawah"}, {"p": "mulut+0.07*depan+0.03*luar+0.02*bawah"}),
    k(0.7),
], ragu=True,
  cara="Telunjuk dan ibu jari membentuk jarak kecil (sepotong kata) di depan mulut, maju kecil sekali, sambil mengucapkan 'kata'.")

S("B23_PESAN_TITIP", "Pesan (titip pesan)", "Ucapan", [
    k(0, p="mulut+0.03*depan+0.01*bawah", a="ujung", b="FLAT_O", j="atas+0.3*depan+0.2*dalam", tp="dalam+0.3*belakang"),
    k(0.15),
    k(0.65, p="netral+0.10*atas+0.16*depan+0.08*luar", j="depan+0.4*atas", tp="atas"),
    k(0.80, b="FLAT"),
    k(1.0),
], gloss="PESAN", ragu=True,
  cara="Jari kuncup di depan mulut (mengambil ucapan) dibawa ke depan-samping lalu dibuka seperti menyerahkan titipan, sambil mengucapkan 'pesan'.")
