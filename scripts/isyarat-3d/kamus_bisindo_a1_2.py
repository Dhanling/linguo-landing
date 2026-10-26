# [isyarat-bisindo-a1a2-v1] Kamus isyarat BISINDO A1.2 "Isyarat Sehari-hari".
# Tangan dominan kanan (R), pasif kiri (L). Format sama dengan kamus_bisindo.py.
# ⚠️ Ditulis dari pengetahuan umum isyarat ikonik BISINDO (tanpa rujukan video per kata
# yang bisa diverifikasi) — hampir semua entri ragu=True dan WAJIB dicek pengajar Tuli.
# Banyak isyarat BISINDO disertai gerak bibir kata Indonesianya; variasi daerah besar
# (terutama nama hari, warna, angka belasan).

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST, ANGKA_L, _BENTUK_ANGKA
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # Ibu jari menggosok telunjuk-tengah (UANG): dua fase
    "B12_GOSOK_A": (I._jari(_G, index=(35, 40, 20), middle=(40, 45, 25)), ("ujung", "middle")),
    "B12_GOSOK_B": (I._jari(_G, index=(35, 40, 20), middle=(40, 45, 25)), ("ujung", "index")),
    # Jari seperti sumpit/menjepit (telunjuk & tengah lurus rapat, sedikit menekuk)
    "B12_SUMPIT": (I._jari(_G, index=(20, 15, 5, -3), middle=(20, 15, 5, 2)), "depan_genggam_manis"),
})

# Tangan pasif yang sering dipakai
L_ATAS = dict(p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
L_GELAS = dict(p=A(0.05, -0.32, 1.17), a="telapak", b="C", j="dalam+0.4*depan", tp="dalam")
L_KEPAL = dict(p=A(0.04, -0.32, 1.17), a="pergelangan", b="S", j="dalam+0.5*depan", tp="bawah")
GELENG = [(0.1, 0, 0, 0), (0.3, 0, 14, 0), (0.5, 0, -14, 0), (0.7, 0, 10, 0), (0.85, 0, 0, 0)]
ANGGUK = [(0.2, 0, 0, 0), (0.4, 10, 0, 0), (0.6, 0, 0, 0)]

def _cer(keys):
    """cermin() + bahu_kanan → bahu_kiri."""
    out = cermin(keys)
    for d in out:
        if isinstance(d.get("p"), str): d["p"] = d["p"].replace("bahu_kanan", "bahu_kiri")
    return out

def _L(d, t=0, **lain):
    x = dict(d); x.update(lain); return k(t, **x)

def _orang(t):
    """Penanda pelaku/orang: dua telapak berhadapan turun di depan badan (kunci kanan)."""
    return [k(t, p="netral+0.04*atas+0.02*dalam", a="telapak", b="FLAT", j="depan+0.3*atas", tp="dalam"),
            k(t + 0.08), k(t + 0.38, p="netral+0.14*bawah+0.02*dalam"), k(t + 0.5)]

# ── Kata ganti & menunjuk ──────────────────────────────────────────────────

S("DIA", "Dia", "Orang", [
    k(0, p="netral+0.04*atas", a="telunjuk", b="1", j="depan+0.3*luar", tp="bawah+0.3*dalam"),
    k(0.15),
    k(0.45, p="netral+0.04*atas+0.10*luar+0.06*depan", j="depan+0.8*luar"),
    k(0.7),
], cara="Telunjuk menunjuk ke orang yang dibicarakan (atau ke titik di samping bila orangnya tidak ada).")

S("KITA", "Kita (termasuk lawan bicara)", "Orang", [
    k(0, p="dada+0.03*depan+0.03*atas", a="telunjuk", b="1", j="belakang+0.3*bawah", tp="dalam"),
    k(0.15),
    k(0.45, p="netral+0.10*depan+0.08*atas", j="depan", tp="bawah"),
    k(0.7, p="netral+0.06*depan+0.08*atas+0.10*luar", j="depan+0.5*luar", kurva=True),
    k(0.95, p="dada+0.05*depan+0.03*atas+0.04*luar", j="belakang+0.3*dalam", tp="dalam", kurva=True),
    k(1.05),
], ragu=True, cara="Telunjuk dari dada sendiri melingkar mendatar ke arah lawan bicara lalu kembali — 'aku dan kamu'.")

S("KAMI", "Kami (tanpa lawan bicara)", "Orang", [
    k(0, p="dada+0.03*depan+0.03*atas", a="telunjuk", b="1", j="belakang+0.3*bawah", tp="dalam"),
    k(0.15),
    k(0.5, p="dada_kanan+0.06*depan+0.03*atas+0.08*luar", j="depan+0.6*luar", tp="bawah"),
    k(0.75),
], ragu=True, cara="Telunjuk menyentuh dada lalu menyapu ke samping sisi penutur (kelompokku, tanpa lawan bicara).")

S("MEREKA", "Mereka", "Orang", [
    k(0, p="netral+0.04*atas+0.06*dalam+0.04*depan", a="telunjuk", b="1", j="depan", tp="bawah"),
    k(0.15),
    k(0.65, p="netral+0.04*atas+0.14*luar+0.02*depan", j="depan+0.8*luar"),
    k(0.8),
], ragu=True, cara="Telunjuk menunjuk ke depan lalu menyapu mendatar ke samping melewati beberapa orang.")

# ── Angka 11–20, puluhan, ratusan, ribuan ──────────────────────────────────

def _bentuk_satuan(d):
    return _BENTUK_ANGKA[d if d <= 5 else d - 5]

def _belas(n):
    d = n - 10
    R = [k(0, p="angka", a="telapak", b="5", j="atas", tp="depan+0.1*dalam"), k(0.3),
         k(0.5, b=_bentuk_satuan(d)), k(0.62, p="angka+0.015*luar"), k(0.74, p="angka"), k(0.95)]
    if d <= 5:
        L = [k(0, p=ANGKA_L, a="telapak", b="5", j="atas", tp="depan+0.1*dalam"), k(0.3), _L(IST["L"], 0.6)]
    else:
        L = [k(0, p=ANGKA_L, a="telapak", b="5", j="atas", tp="depan+0.1*dalam"), k(0.95)]
    S(f"ANGKA_{n}", f"Angka {n}", "Angka", R, L=L, gloss=str(n), ragu=True,
      cara=f"Isyarat 10 (dua tangan terbuka) lalu langsung {d} — salah satu cara umum; banyak daerah punya bentuk belasan sendiri, tanyakan ke pengajar Tuli.")

for _n in range(11, 20):
    _belas(_n)

S("ANGKA_20", "Angka 20", "Angka", [
    k(0, p="angka", a="telapak", b="V", j="atas", tp="depan+0.1*dalam"), k(0.3),
    k(0.5, p="angka+0.03*luar", b="O", tp="dalam+0.3*depan"), k(0.8),
], gloss="20", ragu=True, cara="Angka 2 (V) lalu tangan bergeser sedikit ke samping membentuk O (nol) — 2 dan 0.")

def _nol(kode, arti, kali, cara):
    R = [k(0, p="angka", a="telapak", b="O", j="atas", tp="dalam+0.3*depan"), k(0.12)]
    t = 0.12
    for i in range(1, kali):
        t += 0.25
        R.append(k(t, p=f"angka+{0.035 * i:.3f}*luar"))
    R.append(k(t + 0.2))
    S(kode, arti, "Angka", R, ragu=True, cara=cara)

_nol("PULUH", "Puluh (×10)", 1,
     "Sesudah angka satuan, tangan membentuk O (nol) di tempat yang sama — 3 + PULUH = 30; sering cukup ditambah gerak bibir 'puluh'.")
_nol("RATUS", "Ratus (×100)", 2,
     "Tangan O (nol) digeser dua kali ke samping — dua nol; sambil mengucapkan 'ratus' tanpa suara.")
_nol("RIBU", "Ribu (×1000)", 3,
     "Tangan O (nol) digeser tiga kali ke samping — tiga nol; sambil mengucapkan 'ribu' tanpa suara. Bentuk ribu sangat bervariasi.")

S("UMUR", "Umur / usia", "Angka", [
    k(0, p="dada+0.10*depan+0.02*bawah", a="telapak", b="FLAT", j="dalam+0.6*depan", tp="bawah"),
    k(0.12), k(0.35, p="dada+0.10*depan+0.06*atas"), k(0.45),
    k(0.68, p="dada+0.10*depan+0.13*atas"), k(0.8),
], ragu=True, cara="Telapak datar menghadap bawah di depan dada naik bertahap dua kali (bertambah besar/usia), sambil mengucapkan 'umur'.")

# ── Hari ──────────────────────────────────────────────────────────────────

def _hari(kode, arti, n):
    R = lingkar(0, 0.8, "angka+0.01*bawah", 0.022, "luar", "atas", n=8, mulai=0,
                a="telapak", b=_bentuk_satuan(n), j="atas", tp="depan+0.1*dalam") + [k(0.95)]
    L = [k(0, p=ANGKA_L, a="telapak", b="5", j="atas", tp="depan+0.1*dalam"), k(0.95)] if n > 5 else None
    S(kode, arti, "Waktu", R, L=L, ragu=True,
      cara=f"Salah satu variasi: hari ke-{n} dari Senin — angka {n} diputar kecil sambil mengucapkan '{arti.lower()}'. Variasi lain memakai huruf awal; ikuti pengajar Tuli daerahmu.")

for _i, (_k, _a) in enumerate([("SENIN", "Senin"), ("SELASA", "Selasa"), ("RABU", "Rabu"), ("KAMIS", "Kamis"),
                               ("JUMAT", "Jumat"), ("SABTU", "Sabtu"), ("MINGGU", "Minggu")], 1):
    _hari(_k, _a, _i)

S("HARI", "Hari", "Waktu", [
    k(0, p="netral+0.16*atas+0.10*dalam", a="telunjuk", b="1", j="atas+0.3*dalam", tp="depan", kurva=True),
    k(0.25, p="netral+0.24*atas+0.02*luar", j="atas", kurva=True),
    k(0.55, p="netral+0.14*atas+0.12*luar", j="atas+0.4*luar", kurva=True),
    k(0.75),
], ragu=True, cara="Telunjuk melengkung dari kiri ke kanan di atas, seperti matahari melintas satu hari.")

# ── Waktu & penanda ──────────────────────────────────────────────────────

_SEKARANG = [
    k(0, p="netral+0.04*atas+0.06*luar", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="atas"),
    k(0.15), k(0.32, p="netral+0.06*luar"), k(0.45, p="netral+0.04*atas+0.06*luar"), k(0.6, p="netral+0.06*luar"), k(0.75),
]
S("SEKARANG", "Sekarang", "Waktu", _SEKARANG, L=cermin(_SEKARANG), ragu=True,
  cara="Dua telapak menghadap atas di depan badan, diturunkan pendek dua kali ('di sini, saat ini').")

S("NANTI", "Nanti", "Waktu", [
    k(0, p="bahu_kanan+0.08*depan+0.04*atas", a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam+0.3*depan"),
    k(0.15), k(0.6, p="bahu_kanan+0.30*depan+0.02*atas", j="depan+0.6*atas", kurva=True), k(0.8),
], ragu=True, cara="Tangan datar di dekat bahu bergerak maju melengkung ke depan (waktu yang akan datang).")

S("BESOK", "Besok", "Waktu", [
    k(0, p="pipi+0.03*luar+0.02*depan", a="telunjuk", b="1", j="atas", tp="depan"),
    k(0.15), k(0.55, p="pipi+0.08*luar+0.22*depan", j="depan+0.5*atas"), k(0.75),
], ragu=True, cara="Telunjuk tegak di samping pipi bergerak maju ke depan (satu hari ke depan).")

S("KEMARIN", "Kemarin", "Waktu", [
    k(0, p="pipi+0.05*luar+0.12*depan", a="telunjuk", b="1", j="atas+0.4*belakang", tp="dalam"),
    k(0.15), k(0.55, p="bahu_kanan+0.10*atas+0.03*luar", j="belakang+0.4*atas"), k(0.75),
], ragu=True, cara="Telunjuk dari depan pipi bergerak ke belakang melewati bahu (satu hari ke belakang).")

S("JAM", "Jam / pukul", "Waktu", [
    k(0, p=A(0.06, -0.30, 1.215), a="telunjuk", b="1", j="dalam+0.4*depan+0.4*bawah", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.06, -0.30, 1.192)}, {"p": A(0.06, -0.30, 1.215)}),
    k(0.75, p=A(0.06, -0.30, 1.192)),
], L=[_L(L_KEPAL)], cara="Telunjuk kanan mengetuk punggung pergelangan kiri (tempat jam tangan) dua kali.")

_SUDAH = [
    k(0, p="netral+0.10*atas+0.04*luar", a="telapak", b="5", j="atas", tp="belakang"),
    k(0.12), k(0.42, p="netral+0.02*bawah+0.10*luar", j="atas+0.5*luar", tp="depan+0.4*bawah"), k(0.62),
]
S("SUDAH", "Sudah", "Waktu", _SUDAH, L=cermin(_SUDAH), kepala=ANGGUK, ragu=True,
  cara="Dua tangan terbuka menghadap diri lalu dikibaskan ke bawah-luar sekali (selesai), sambil mengucapkan 'sudah'.")

S("BELUM", "Belum", "Waktu", [
    k(0, p="netral+0.06*atas", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.06*atas+0.04*luar"}, {"p": "netral+0.06*atas+0.03*dalam"}),
    k(0.8, p="netral+0.06*atas"),
], kepala=GELENG, ragu=True,
  cara="Telapak datar menghadap bawah digoyang kecil ke kiri-kanan sambil menggeleng dan mengucapkan 'belum'.")

S("AKAN", "Akan", "Waktu", [
    k(0, p="dada_kanan+0.08*depan+0.06*atas", a="telunjuk", b="1", j="depan", tp="dalam+0.3*bawah"),
    k(0.12), k(0.45, p="dada_kanan+0.30*depan+0.08*atas"), k(0.65),
], ragu=True, cara="Telunjuk menunjuk ke depan, bergerak maju sekali (ke masa depan), sambil mengucapkan 'akan'.")

# ── Kegiatan harian ──────────────────────────────────────────────────────

S("MAKAN", "Makan", "Kegiatan", [
    k(0, p="mulut+0.05*depan+0.02*bawah", a="ujung", b="FLAT_O", j="belakang+0.6*atas", tp="dalam+0.5*atas"),
    *bolak(0.15, 0.15, 4, {"p": "mulut+0.015*depan"}, {"p": "mulut+0.06*depan+0.03*bawah"}),
    k(0.8, p="mulut+0.015*depan"),
], cara="Ujung jari menguncup didekatkan ke mulut dua kali, seperti menyuap nasi dengan tangan.")

S("MINUM", "Minum", "Kegiatan", [
    k(0, p="mulut+0.08*depan+0.06*bawah", a="telapak", b="C", j="atas", tp="dalam"),
    k(0.15), k(0.45, p="mulut+0.05*depan+0.02*bawah", j="atas+0.8*belakang"), k(0.7),
], cara="Tangan bentuk C seperti memegang gelas didekatkan ke mulut lalu dimiringkan.")

_MANDI = [
    k(0, p="dada_kanan+0.03*depan+0.04*atas+0.02*luar", a="telapak", b="FLAT", j="atas+0.25*dalam", tp="belakang"),
    *bolak(0.12, 0.16, 4, {"p": "dada_kanan+0.03*depan+0.06*bawah+0.02*luar"}, {"p": "dada_kanan+0.03*depan+0.04*atas+0.02*luar"}),
    k(0.8),
]
S("MANDI", "Mandi", "Kegiatan", _MANDI, L=cermin(_MANDI), ragu=True,
  cara="Dua telapak menggosok dada naik-turun seperti menyabun badan.")

S("TIDUR", "Tidur", "Kegiatan", [
    k(0, p="pipi+0.08*luar+0.08*depan", a="telapak", b="FLAT", j="atas", tp="dalam"),
    k(0.15), k(0.5, p="pipi+0.018*luar"), k(1.0),
], kepala=[(0.2, 0, 0, 0), (0.5, 0, 0, 16), (1.0, 0, 0, 16)], wajah="tidur",
  cara="Telapak ditempelkan ke pipi sambil kepala dimiringkan dan mata dipejamkan.")

S("BANGUN", "Bangun (tidur)", "Kegiatan", [
    k(0, p="mata+0.05*luar+0.03*depan", a="telunjuk", b="BABY_O", j="atas+0.2*dalam", tp="dalam+0.3*depan"),
    k(0.2), k(0.45, b="L"), k(0.75),
], kepala=[(0, 0, 0, 12), (0.45, 0, 0, 0)], ragu=True,
  cara="Telunjuk & ibu jari menutup di samping mata lalu membuka (mata terbuka), kepala tegak kembali.")

S("KERJA", "Kerja", "Kegiatan", [
    k(0, p=A(0.03, -0.32, 1.24), a="punggung", b="S", j="dalam+0.5*depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.03, -0.32, 1.205)}, {"p": A(0.03, -0.32, 1.24)}),
    k(0.8, p=A(0.03, -0.32, 1.205)),
], L=[_L(L_KEPAL)], ragu=True, cara="Kepalan kanan mengetuk atas kepalan kiri dua kali seperti memalu.")

_SEKOLAH = [
    k(0, p="bahu_kanan+0.06*depan+0.05*bawah", a="telapak", b="S", j="atas", tp="belakang+0.3*dalam"),
    *bolak(0.12, 0.16, 4, {"p": "bahu_kanan+0.06*depan+0.10*bawah"}, {"p": "bahu_kanan+0.06*depan+0.05*bawah"}),
    k(0.8),
]
S("SEKOLAH", "Sekolah", "Kegiatan", _SEKOLAH, L=_cer(_SEKOLAH), ragu=True,
  cara="Dua kepalan memegang tali tas di depan bahu, digerakkan naik-turun kecil (menggendong tas sekolah), sambil mengucapkan 'sekolah'.")

S("PULANG", "Pulang", "Kegiatan", [
    k(0, p="netral+0.20*depan+0.06*atas", a="ujung", b="FLAT_O", j="depan+0.3*atas", tp="bawah"),
    k(0.15), k(0.55, p="bahu_kanan+0.06*depan+0.02*atas", j="atas+0.6*belakang"), k(0.75),
], ragu=True, cara="Tangan kuncup dari depan ditarik kembali ke dekat bahu (kembali ke tempat asal/rumah).")

# ── Makanan & minuman ────────────────────────────────────────────────────

S("NASI", "Nasi", "Makanan", [
    k(0, p=A(0.03, -0.32, 1.18), a="ujung", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.15), k(0.3, p=A(0.03, -0.32, 1.195)),
    k(0.7, p="mulut+0.03*depan", j="belakang+0.6*atas", tp="dalam+0.5*atas"), k(0.9),
], L=[_L(L_ATAS)], ragu=True, cara="Jari menguncup menjumput dari telapak kiri (piring) lalu ke mulut, sambil mengucapkan 'nasi'.")

S("MI", "Mi", "Makanan", [
    k(0, p=A(0.04, -0.33, 1.20), a="jari_telunjuk", b="B12_SUMPIT", j="bawah+0.4*dalam", tp="belakang"),
    k(0.15), k(0.55, p="mulut+0.08*depan+0.05*bawah", j="dalam+0.5*atas", tp="belakang"),
    k(0.7, p="mulut+0.05*depan"), k(0.9),
], L=[_L(L_GELAS, b="C", tp="atas", j="dalam+0.4*depan")], ragu=True,
  cara="Telunjuk & jari tengah seperti sumpit mengangkat mi dari mangkuk (tangan kiri) ke mulut.")

S("TEH", "Teh", "Minuman", [
    k(0, p=A(0.05, -0.32, 1.27), a="telunjuk", b="BABY_O", j="bawah", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": A(0.05, -0.32, 1.235)}, {"p": A(0.05, -0.32, 1.27)}),
    k(0.8),
], L=[_L(L_GELAS)], ragu=True, cara="Tangan kiri C (gelas); jari kanan seperti memegang teh celup dicelup-celupkan, sambil mengucapkan 'teh'.")

S("KOPI", "Kopi", "Minuman",
  lingkar(0, 0.8, A(0.05, -0.32, 1.245), 0.02, "dalam", "depan", n=8, mulai=0,
          a="telunjuk", b="1", j="bawah", tp="dalam") + [k(0.95)],
  L=[_L(L_GELAS)], ragu=True, cara="Tangan kiri C (gelas); telunjuk kanan mengaduk melingkar di atasnya, sambil mengucapkan 'kopi'.")

S("SAMBAL", "Sambal", "Makanan",
  lingkar(0, 0.9, A(0.04, -0.31, 1.19), 0.025, "dalam", "depan", n=10, mulai=0,
          a="pergelangan", b="S", j="bawah", tp="belakang+0.3*dalam", putaran=1.5) + [k(1.05)],
  L=[_L(L_ATAS)], ragu=True, cara="Kepalan kanan menggerus melingkar di telapak kiri seperti mengulek sambal di cobek.")

_BAKSO = [
    k(0, p="tengah+0.06*luar+0.05*atas", a="telapak", b="C", j="atas+0.3*depan", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "tengah+0.04*luar+0.05*atas"}, {"p": "tengah+0.06*luar+0.05*atas"}),
    k(0.8),
]
S("BAKSO", "Bakso", "Makanan", _BAKSO, L=cermin(_BAKSO), ragu=True,
  cara="Dua tangan C saling berhadapan seperti membulatkan bola kecil, sambil mengucapkan 'bakso'.")

S("PEDAS", "Pedas", "Makanan", [
    k(0, p="mulut+0.12*depan+0.12*bawah+0.05*luar", a="telapak", b="5", j="atas+0.3*dalam", tp="belakang+0.4*dalam"),
    *bolak(0.12, 0.13, 5, {"j": "atas+0.5*luar"}, {"j": "atas+0.3*dalam"}),
    k(0.8),
], wajah="sedih", ragu=True, cara="Tangan terbuka mengipasi mulut beberapa kali dengan wajah kepedasan.")

S("ENAK", "Enak", "Makanan", [
    k(0, p="sudut_mulut+0.02*depan", a="jempol", b="10", j="depan+0.3*dalam", tp="dalam"),
    k(0.15), k(0.5, p="sudut_mulut+0.14*depan+0.05*bawah", j="depan"), k(0.7),
], wajah="senang", ragu=True, cara="Ibu jari tegak dari sudut mulut bergerak maju (jempol = enak), wajah puas.")

S("MANIS", "Manis", "Makanan", [
    k(0, p="dagu+0.01*depan", a="ujung", b="FLAT", j="atas", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "dagu+0.01*depan+0.04*bawah"}, {"p": "dagu+0.01*depan"}),
    k(0.8, p="dagu+0.01*depan+0.04*bawah"),
], wajah="senang", ragu=True, cara="Ujung jari tangan datar mengusap dagu ke bawah dua kali, sambil mengucapkan 'manis'.")

# ── Warna ────────────────────────────────────────────────────────────────

S("WARNA", "Warna", "Warna", [
    k(0, p="dagu+0.05*depan+0.02*bawah", a="ujung", b="5", j="atas+0.3*dalam", tp="belakang"),
    *bolak(0.12, 0.13, 5, {"j": "atas+0.6*dalam"}, {"j": "atas"}),
    k(0.8),
], ragu=True, cara="Tangan terbuka di depan dagu, jari-jari digoyang, sambil mengucapkan 'warna'.")

S("MERAH", "Merah", "Warna", [
    k(0, p="mulut+0.012*depan+0.01*atas", a="telunjuk", b="1", j="dalam+0.9*atas", tp="belakang"),
    k(0.12), k(0.4, p="dagu+0.02*depan"), k(0.55, p="mulut+0.012*depan+0.01*atas"), k(0.8, p="dagu+0.02*depan"), k(0.9),
], ragu=True, cara="Telunjuk mengusap bibir ke bawah (bibir merah), sambil mengucapkan 'merah'.")

S("BIRU", "Biru", "Warna",
  lingkar(0, 0.8, "netral+0.18*atas+0.06*luar", 0.03, "luar", "atas", n=8, mulai=0,
          a="telapak", b="FLAT", j="atas", tp="depan") + [k(0.95)],
  ragu=True, cara="Tangan datar menghadap depan diputar kecil di atas samping kepala (langit), sambil mengucapkan 'biru'. Bentuk sangat bervariasi.")

S("HIJAU", "Hijau", "Warna", [
    k(0, p="bahu_kanan+0.12*depan+0.04*atas", a="pergelangan", b="5", j="atas+0.2*dalam", tp="depan"),
    *bolak(0.12, 0.14, 5, {"j": "atas+0.5*luar", "tp": "depan+0.4*dalam"}, {"j": "atas+0.2*dalam", "tp": "depan"}),
    k(0.85),
], ragu=True, cara="Tangan terbuka di depan bahu digoyang di pergelangan seperti daun tertiup, sambil mengucapkan 'hijau'.")

S("KUNING", "Kuning", "Warna",
  lingkar(0, 0.8, "pipi+0.09*luar+0.06*depan", 0.025, "luar", "atas", n=8, mulai=0,
          a="telapak", b="Y", j="atas", tp="belakang+0.4*dalam") + [k(0.95)],
  ragu=True, cara="Tangan bentuk Y diputar kecil di samping pipi, sambil mengucapkan 'kuning'. Bentuk sangat bervariasi.")

S("HITAM", "Hitam", "Warna", [
    k(0, p="mata+0.035*atas+0.03*depan+0.03*dalam", a="jari_telunjuk", b="1", j="dalam", tp="belakang+0.4*bawah"),
    k(0.12), k(0.5, p="mata+0.035*atas+0.03*depan+0.05*luar"), k(0.7),
], ragu=True, cara="Telunjuk mendatar mengusap alis kanan ke arah luar (alis hitam), sambil mengucapkan 'hitam'.")

S("PUTIH", "Putih", "Warna", [
    k(0, p="mulut+0.04*depan", a="telunjuk", b="1", j="belakang+0.3*atas", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "mulut+0.012*depan"}, {"p": "mulut+0.04*depan"}),
    k(0.8),
], ragu=True, cara="Telunjuk mengetuk gigi depan dua kali (gigi putih), sambil mengucapkan 'putih'.")

# ── Benda & tempat ───────────────────────────────────────────────────────

_MEJA = [
    k(0, p="tengah+0.02*luar+0.02*bawah", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="bawah"),
    k(0.12), k(0.45, p="tengah+0.16*luar+0.02*bawah"), k(0.55, b="1", j="bawah", tp="belakang"),
    k(0.85, p="tengah+0.16*luar+0.12*bawah"), k(0.95),
]
S("MEJA", "Meja", "Benda", _MEJA, L=cermin(_MEJA), ragu=True,
  cara="Dua telapak menghadap bawah bergerak ke samping (permukaan meja), lalu dua telunjuk turun (kaki meja).")

S("KURSI", "Kursi", "Benda", [
    k(0, p=A(-0.02, -0.36, 1.17), a="telapak", b="FLAT", j="depan+0.2*dalam", tp="bawah"),
    k(0.15), k(0.35, p=A(-0.02, -0.36, 1.15)), k(0.55, p=A(-0.02, -0.36, 1.17)), k(0.75, p=A(-0.02, -0.36, 1.15)), k(0.85),
], L=[k(0, p=A(0.03, -0.30, 1.20), a="telapak", b="FLAT", j="atas", tp="depan+0.4*luar")], ragu=True,
  cara="Telapak kiri tegak (sandaran), telapak kanan mendatar di depannya (dudukan) ditekan dua kali.")

_BUKU = [
    k(0, p="tengah+0.012*luar+0.02*atas", a="telapak", b="FLAT", j="depan+0.4*atas", tp="dalam"),
    k(0.15), k(0.55, p="tengah+0.05*luar", j="depan+0.3*atas", tp="atas+0.3*dalam"), k(0.75),
]
S("BUKU", "Buku", "Benda", _BUKU, L=cermin(_BUKU),
  cara="Dua telapak rapat lalu dibuka ke samping seperti membuka buku.")

_RUMAH = [
    k(0, p="tengah+0.012*luar+0.12*atas", a="ujung", b="FLAT", j="atas+1.0*dalam", tp="dalam+0.6*bawah"),
    k(0.15), k(0.55, p="tengah+0.10*luar+0.03*atas", j="atas+1.0*dalam"),
    k(0.75, p="tengah+0.10*luar+0.10*bawah", j="atas", tp="dalam"), k(0.9),
]
S("RUMAH", "Rumah", "Tempat", _RUMAH, L=cermin(_RUMAH),
  cara="Ujung dua telapak bertemu membentuk atap, lalu bergerak turun ke samping dan ke bawah (dinding).")

_PASAR = [
    k(0, p="netral+0.04*luar", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="atas"),
    *bolak(0.12, 0.16, 4, {"p": "netral+0.04*luar+0.08*depan"}, {"p": "netral+0.04*luar"}),
    k(0.8),
]
_PASAR_L = [
    k(0, p="netral_kiri+0.04*luar+0.08*depan", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="atas"),
    *bolak(0.12, 0.16, 4, {"p": "netral_kiri+0.04*luar"}, {"p": "netral_kiri+0.04*luar+0.08*depan"}),
    k(0.8),
]
S("PASAR", "Pasar", "Tempat", _PASAR, L=_PASAR_L, ragu=True,
  cara="Dua telapak menghadap atas maju-mundur bergantian (menawarkan & menerima barang), sambil mengucapkan 'pasar'.")

_KANTOR = [
    k(0, p="tengah+0.08*luar+0.14*atas", a="telapak", b="FLAT", j="atas", tp="dalam"),
    k(0.15), k(0.6, p="tengah+0.08*luar+0.04*bawah"), k(0.8),
]
S("KANTOR", "Kantor", "Tempat", _KANTOR, L=cermin(_KANTOR), ragu=True,
  cara="Dua telapak tegak berhadapan turun sejajar (dinding gedung), sambil mengucapkan 'kantor'.")

S("RUMAH_SAKIT", "Rumah sakit", "Tempat", [
    k(0, p=A(0.17, -0.12, 1.30), a="telunjuk", b="1", j="bawah+0.3*depan+0.3*dalam", tp="dalam"),
    k(0.12), k(0.35, p=A(0.17, -0.12, 1.24)),
    k(0.5, p=A(0.20, -0.14, 1.27), j="dalam+0.3*depan"), k(0.7, p=A(0.14, -0.14, 1.27)), k(0.85),
], ragu=True, cara="Telunjuk kanan menggambar palang (+) di lengan atas kiri, sambil mengucapkan 'rumah sakit'.")

_MASJID = [
    k(0, p="tengah+0.012*luar+0.16*atas", a="ujung", b="C", j="atas+0.5*dalam", tp="dalam+0.4*bawah"),
    k(0.15), k(0.45, p="tengah+0.08*luar+0.09*atas", j="atas+0.2*dalam", kurva=True),
    k(0.7, p="tengah+0.10*luar+0.00*atas", j="atas", tp="dalam", kurva=True), k(0.85),
]
S("MASJID", "Masjid", "Tempat", _MASJID, L=cermin(_MASJID), ragu=True,
  cara="Dua tangan melengkung, ujung jari bertemu di atas lalu turun melengkung membentuk kubah.")

S("GEREJA", "Gereja", "Tempat", [
    k(0, p="dada+0.02*depan+0.08*atas", a="telunjuk", b="1", j="bawah+0.3*dalam", tp="belakang"),
    k(0.12), k(0.4, p="dada+0.02*depan+0.04*bawah"),
    k(0.5, p="dada_kiri+0.02*depan+0.03*atas", j="dalam", tp="belakang"), k(0.75, p="dada_kanan+0.02*depan+0.03*atas"), k(0.9),
], ragu=True, cara="Telunjuk menggambar salib di depan dada (garis tegak lalu mendatar), sambil mengucapkan 'gereja'.")

# ── Pekerjaan ────────────────────────────────────────────────────────────

S("DOKTER", "Dokter", "Pekerjaan", [
    k(0, p=A(0.055, -0.30, 1.20), a="jari_telunjuk", b="U", j="dalam+0.4*depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.055, -0.30, 1.183)}, {"p": A(0.055, -0.30, 1.20)}),
    k(0.8, p=A(0.055, -0.30, 1.183)),
], L=[_L(L_KEPAL, tp="atas", a="telapak", p=A(0.06, -0.30, 1.16))], ragu=True,
  cara="Telunjuk & jari tengah kanan mengetuk pergelangan kiri (memeriksa nadi).")

S("POLISI", "Polisi", "Pekerjaan", [
    k(0, p="dada_kiri+0.06*depan+0.04*atas", a="telapak", b="C", j="atas", tp="belakang"),
    k(0.15), k(0.45, p="dada_kiri+0.012*depan+0.04*atas"), k(0.75),
], ragu=True, cara="Tangan C ditempelkan di dada kiri (lencana), sambil mengucapkan 'polisi'.")

S("PEDAGANG", "Pedagang", "Pekerjaan", [
    k(0, p="netral+0.04*atas", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="atas"),
    *bolak(0.12, 0.15, 3, {"p": "netral+0.04*atas+0.10*depan"}, {"p": "netral+0.04*atas"}),
    *_orang(0.55),
], L=[_L(IST["L"]), _L(IST["L"], 0.5), *cermin(_orang(0.55))], ragu=True,
  cara="Telapak menghadap atas disodorkan ke depan dua kali (menjual), lalu dua telapak turun di depan badan (penanda orang).")

S("PEGAWAI", "Pegawai / karyawan", "Pekerjaan", [
    k(0, p=A(0.03, -0.32, 1.24), a="punggung", b="S", j="dalam+0.5*depan", tp="bawah"),
    k(0.15, p=A(0.03, -0.32, 1.205)), k(0.3, p=A(0.03, -0.32, 1.24)), k(0.45, p=A(0.03, -0.32, 1.205)),
    *_orang(0.6),
], L=[_L(L_KEPAL), _L(L_KEPAL, 0.5), *cermin(_orang(0.6))], ragu=True,
  cara="KERJA (kepalan mengetuk kepalan) lalu dua telapak turun (penanda orang), sambil mengucapkan 'pegawai'.")

S("MAHASISWA", "Mahasiswa", "Pekerjaan", [
    k(0, p="dahi+0.07*atas+0.02*depan", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15, p="dahi+0.05*atas+0.02*depan"), k(0.3, p="dahi+0.05*atas+0.02*depan+0.04*luar"), k(0.45),
    *_orang(0.6),
], L=[_L(IST["L"]), _L(IST["L"], 0.5), *cermin(_orang(0.6))], ragu=True,
  cara="Telapak datar di atas kepala (topi toga) bergeser sedikit, lalu penanda orang; sambil mengucapkan 'mahasiswa'.")

# ── Negasi ───────────────────────────────────────────────────────────────

S("BUKAN", "Bukan", "Negasi", [
    k(0, p="netral+0.10*atas", a="telapak", b="1", j="atas", tp="depan"),
    *bolak(0.12, 0.13, 5, {"j": "atas+0.5*luar"}, {"j": "atas+0.5*dalam"}),
    k(0.8, j="atas"),
], kepala=GELENG, ragu=True, cara="Telunjuk tegak digoyang ke kiri-kanan sambil menggeleng dan mengucapkan 'bukan'.")

_TIDAK_ADA = [
    k(0, p="tengah+0.05*luar+0.04*atas", a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.15), k(0.4, tp="atas"), k(0.7, p="tengah+0.18*luar", j="depan+0.6*luar"), k(0.85),
]
S("TIDAK_ADA", "Tidak ada", "Negasi", _TIDAK_ADA, L=cermin(_TIDAK_ADA), kepala=GELENG, ragu=True,
  cara="Dua tangan terbuka dibalik menghadap atas lalu menyapu ke luar (kosong), sambil menggeleng.")

S("TIDAK_MAU", "Tidak mau", "Negasi", [
    k(0, p="dada+0.08*depan+0.04*atas", a="telapak", b="FLAT", j="atas", tp="depan"),
    k(0.15), k(0.45, p="dada+0.28*depan+0.04*atas"), k(0.75),
], kepala=GELENG, wajah="sedih", ragu=True,
  cara="Telapak didorong menjauh dari dada ke depan (menolak) sambil menggeleng dan mengucapkan 'tidak mau'.")

# ── Uang & belanja ───────────────────────────────────────────────────────

S("UANG", "Uang", "Belanja", [
    k(0, p="netral+0.06*atas", a="jempol", b="B12_GOSOK_A", j="atas+0.4*dalam", tp="dalam+0.5*atas"),
    *bolak(0.12, 0.13, 5, {"b": "B12_GOSOK_B"}, {"b": "B12_GOSOK_A"}),
    k(0.8),
], ragu=True, cara="Ibu jari menggosok ujung telunjuk & jari tengah beberapa kali (menghitung uang).")

S("RUPIAH", "Rupiah", "Belanja", [
    k(0, p="netral+0.06*atas", a="jempol", b="B12_GOSOK_A", j="atas+0.4*dalam", tp="dalam+0.5*atas"),
    k(0.15, b="B12_GOSOK_B"), k(0.3, b="B12_GOSOK_A"),
    k(0.5, p="angka", a="telapak", b="R", j="atas", tp="depan"), k(0.9),
], ragu=True, cara="UANG (ibu jari menggosok jari) lalu huruf R satu tangan (telunjuk & jari tengah bersilang), sambil mengucapkan 'rupiah'.")

S("MAHAL", "Mahal", "Belanja", [
    k(0, p="netral+0.04*atas+0.06*luar", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.12), k(0.45, p="netral+0.30*atas+0.10*luar"), k(0.7),
], wajah="ya_tidak", ragu=True, cara="Telapak menghadap bawah naik cepat ke atas kepala (harga tinggi), mata membesar, sambil mengucapkan 'mahal'.")

S("MURAH", "Murah", "Belanja", [
    k(0, p="netral+0.12*atas", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.12), k(0.5, p="netral+0.10*bawah"), k(0.7),
], wajah="senang", ragu=True, cara="Telapak menghadap bawah turun ke bawah (harga rendah), sambil mengucapkan 'murah'.")

S("BELI", "Beli", "Belanja", [
    k(0, p="dada_kanan+0.10*depan", a="ujung", b="FLAT_O", j="depan+0.3*dalam", tp="atas"),
    k(0.12), k(0.4, p="dada_kanan+0.28*depan", b="5"), k(0.5),
    k(0.8, p="dada_kanan+0.08*depan", b="FLAT_O"), k(0.9),
], ragu=True, cara="Tangan menyerahkan uang ke depan lalu ditarik kembali ke dada membawa barang, sambil mengucapkan 'beli'.")

S("JUAL", "Jual", "Belanja", [
    k(0, p="dada_kanan+0.08*depan", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="atas"),
    *bolak(0.12, 0.15, 4, {"p": "dada_kanan+0.26*depan"}, {"p": "dada_kanan+0.08*depan"}),
    k(0.8),
], ragu=True, cara="Telapak menghadap atas disodorkan ke depan dua kali (menawarkan barang), sambil mengucapkan 'jual'.")

S("KURANG", "Kurang / kurangi", "Belanja", [
    k(0, p=A(0.03, -0.32, 1.27), a="telapak", b="FLAT", j="depan+0.4*dalam", tp="bawah"),
    k(0.12), k(0.5, p=A(0.03, -0.32, 1.195)), k(0.7),
], L=[_L(L_ATAS)], ragu=True,
  cara="Telapak kanan menghadap bawah turun mendekati telapak kiri (jarak mengecil = berkurang), sambil mengucapkan 'kurang'.")

# ── Cuaca ────────────────────────────────────────────────────────────────

S("PANAS", "Panas", "Cuaca", [
    k(0, p="dahi+0.02*depan+0.04*dalam", a="jari_telunjuk", b="1", j="luar", tp="bawah+0.3*belakang"),
    k(0.12), k(0.4, p="pelipis+0.03*depan+0.04*luar"),
    k(0.6, p="pelipis+0.12*depan+0.10*luar+0.06*bawah", b="5", j="atas+0.5*luar", tp="depan"), k(0.8),
], wajah="sedih", ragu=True, cara="Telunjuk menyeka keringat di dahi ke samping lalu dikibaskan, wajah kegerahan.")

_DINGIN = [
    k(0, p="dada_kanan+0.10*depan+0.02*bawah", a="pergelangan", b="S", j="atas", tp="dalam"),
    *bolak(0.1, 0.08, 8, {"p": "dada_kanan+0.10*depan+0.02*bawah+0.012*luar"}, {"p": "dada_kanan+0.10*depan+0.02*bawah+0.012*dalam"}),
    k(0.85),
]
S("DINGIN", "Dingin", "Cuaca", _DINGIN, L=cermin(_DINGIN), kepala=[(0.2, -6, 0, 0)], wajah="sedih", ragu=True,
  cara="Dua kepalan di depan dada digetarkan (menggigil), bahu sedikit terangkat.")

_HUJAN = [
    k(0, p="netral+0.20*atas+0.08*luar", a="telapak", b="5", j="depan+0.6*bawah", tp="bawah"),
    k(0.1), k(0.4, p="netral+0.04*atas+0.08*luar"), k(0.5, p="netral+0.20*atas+0.08*luar"), k(0.8, p="netral+0.04*atas+0.08*luar"), k(0.9),
]
S("HUJAN", "Hujan", "Cuaca", _HUJAN, L=cermin(_HUJAN), ragu=True,
  cara="Dua tangan terbuka, jari ke bawah, turun dua kali dari atas (air hujan jatuh).")

_MENDUNG = lingkar(0, 0.9, "netral+0.36*atas+0.17*luar", 0.035, "luar", "atas", n=8, mulai=180,
                   a="telapak", b="CLAW", j="atas+0.3*dalam", tp="depan+0.5*dalam") + [k(1.0)]
S("MENDUNG", "Mendung", "Cuaca", _MENDUNG, L=cermin(_MENDUNG), wajah="sedih", ragu=True,
  cara="Dua tangan cakar berputar di atas kepala (awan bergulung), wajah muram.")

_BANJIR = [
    k(0, p="tengah+0.08*luar+0.10*bawah", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.12), k(0.7, p="tengah+0.08*luar+0.14*atas"), k(0.85),
]
S("BANJIR", "Banjir", "Cuaca", _BANJIR, L=cermin(_BANJIR), wajah="ya_tidak", ragu=True,
  cara="Dua telapak menghadap bawah naik dari perut ke dada (air naik), sambil mengucapkan 'banjir'.")

_ANGIN = [
    k(0, p="netral+0.12*atas+0.08*luar", a="telapak", b="5", j="atas+0.3*luar", tp="dalam+0.5*depan"),
    *bolak(0.12, 0.18, 4, {"p": "netral+0.12*atas+0.06*dalam", "j": "atas+0.3*dalam"},
           {"p": "netral+0.12*atas+0.08*luar", "j": "atas+0.3*luar"}),
    k(0.85),
]
def _tukar(x):
    """Kunci kanan → kiri yang bergerak SEARAH (bukan cermin): dalam↔luar ditukar."""
    d = dict(x)
    for f in ("p", "j", "tp"):
        if isinstance(d.get(f), str):
            v = d[f].replace("netral", "netral_kiri") if f == "p" else d[f]
            d[f] = v.replace("luar", "XX").replace("dalam", "luar").replace("XX", "dalam")
    return d

S("ANGIN", "Angin", "Cuaca", _ANGIN, L=[_tukar(x) for x in _ANGIN], ragu=True,
  cara="Dua tangan terbuka diayun bersama ke kiri-kanan (angin bertiup).")

# ── Hobi & waktu luang ───────────────────────────────────────────────────

S("SEPAK_BOLA", "Sepak bola", "Hobi", [
    k(0, p="netral+0.04*bawah+0.02*belakang", a="telapak", b="V", j="bawah", tp="belakang"),
    k(0.12), k(0.35, p="netral+0.06*bawah+0.10*depan", j="bawah+0.7*depan"),
    k(0.5, p="netral+0.04*bawah+0.02*belakang", j="bawah"), k(0.72, p="netral+0.06*bawah+0.10*depan", j="bawah+0.7*depan"), k(0.85),
], ragu=True, cara="Jari V menghadap bawah (dua kaki), satu ayunan ke depan seperti menendang bola, dua kali.")

S("BULU_TANGKIS", "Bulu tangkis", "Hobi", [
    k(0, p="bahu_kanan+0.18*atas+0.04*luar", a="pergelangan", b="S", j="atas+0.4*belakang", tp="dalam"),
    k(0.15), k(0.45, p="netral+0.20*atas+0.10*depan", j="depan+0.6*atas", tp="bawah+0.3*depan"),
    k(0.6), k(0.85, p="bahu_kanan+0.18*atas+0.04*luar", j="atas+0.4*belakang", tp="dalam"), k(0.95),
], ragu=True, cara="Tangan menggenggam raket di atas bahu lalu mengayun ke depan-atas (smes).")

S("NONTON", "Nonton / menonton", "Hobi", [
    k(0, p="mata+0.04*depan+0.01*bawah", a="buku", b="V", j="depan", tp="bawah"),
    k(0.15), k(0.5, p="mata+0.22*depan+0.04*bawah"), k(0.9),
], ragu=True, cara="Jari V dari depan mata diarahkan maju (mata memandang layar), sambil mengucapkan 'nonton'.")

S("MASAK", "Masak", "Hobi",
  lingkar(0, 0.9, A(0.02, -0.34, 1.21), 0.03, "dalam", "depan", n=8, mulai=0,
          a="ujung", b="FLAT", j="bawah+0.5*dalam", tp="belakang") + [k(1.0)],
  L=[k(0, p=A(0.10, -0.30, 1.18), a="pergelangan", b="S", j="dalam+0.6*depan", tp="dalam")], ragu=True,
  cara="Tangan kiri memegang gagang wajan; tangan kanan datar (sutil) mengaduk melingkar, sambil mengucapkan 'masak'.")

S("JALAN_JALAN", "Jalan-jalan / pelesir", "Hobi", [
    k(0, p="netral+0.02*dalam", a="telapak", b="V", j="bawah", tp="belakang"),
    k(0.12, p="netral+0.03*depan+0.02*luar"), k(0.3, p="netral+0.08*depan+0.03*dalam"),
    k(0.5, p="netral+0.13*depan+0.04*luar"), k(0.7, p="netral+0.18*depan+0.02*dalam"), k(0.85),
], wajah="senang", ragu=True, cara="Jari V menghadap bawah (dua kaki) 'berjalan' maju berkelok-kelok, wajah santai.")

S("SUKA", "Suka", "Perasaan", [
    k(0, p="dada+0.012*depan+0.02*luar", a="telapak", b="FLAT", j="dalam+0.4*atas", tp="belakang"),
    k(0.12), k(0.35, p="dada+0.012*depan+0.02*luar+0.04*bawah"), k(0.55, p="dada+0.012*depan+0.02*luar"),
    k(0.75, p="dada+0.012*depan+0.02*luar+0.04*bawah"), k(0.85),
], wajah="senang", ragu=True, cara="Telapak mengusap dada ke bawah dua kali dengan wajah senang, sambil mengucapkan 'suka'.")

S("TIDAK_SUKA", "Tidak suka", "Perasaan", [
    k(0, p="dada+0.012*depan+0.02*luar", a="telapak", b="FLAT", j="dalam+0.4*atas", tp="belakang"),
    k(0.15), k(0.5, p="dada+0.20*depan+0.10*luar+0.06*bawah", j="depan+0.3*luar", tp="bawah"), k(0.75),
], kepala=GELENG, wajah="sedih", ragu=True,
  cara="Telapak dari dada dibuang ke depan-bawah sambil menggeleng, wajah tidak suka.")

S("HOBI", "Hobi / kegemaran", "Perasaan", [
    k(0, p="dada+0.02*depan+0.02*luar", a="telapak", b="5", j="dalam+0.4*atas", tp="belakang"),
    k(0.12), k(0.38, p="dada+0.14*depan+0.04*luar", b="FLAT_O", kurva=True),
    k(0.5, p="dada+0.02*depan+0.02*luar", b="5"), k(0.76, p="dada+0.14*depan+0.04*luar", b="FLAT_O"), k(0.88),
], wajah="senang", ragu=True,
  cara="Tangan terbuka di dada ditarik maju sambil menguncup dua kali (hal yang sering disukai), sambil mengucapkan 'hobi'.")
