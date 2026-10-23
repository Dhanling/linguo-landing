# [isyarat-3d-v1] Kamus isyarat ASL untuk A1.1 — bentuk sitasi (citation form)
# satu tangan dominan (kanan). Tiap entri: daftar kunci per tangan.
#
# Kunci: t (detik), p (titik tubuh / Vector absolut / (dasar, offset)),
#        a (titik kontak di tangan), b (bentuk tangan), j (arah jari = sumbu
#        pergelangan→buku jari), tp (arah hadap telapak), putar (puntir °),
#        siku (petunjuk arah siku). Bidang yang tak ditulis mewarisi kunci sebelumnya.
# ⚠️ Ditulis dari kamus umum (Lifeprint/HandSpeak) — perlu dicek pengajar Tuli.

import math
from mathutils import Vector as V
import isyarat as I

def A(x, y, z): return V((x, y, z))
def k(t, **kw): kw["t"] = t; return kw

# Bentuk tambahan
_G = I.GENGGAM
I.BENTUK.update({
    "NO_BUKA":  (I._jari(_G, index=(0, 0, 0, -3), middle=(0, 0, 0, 2)), "keluar_L"),
    "NO_TUTUP": (I._jari(_G, index=(38, 45, 25, -3), middle=(38, 45, 25, 2)), ("ujung", "index")),
    "3_TEKUK":  (I._jari(_G, index=(55, 50, 25, 10), middle=(55, 50, 25, -6)), "keluar"),
    "4_TEKUK":  (I._jari((55, 45, 20), I.RENGGANG), "lipat_telapak"),
    "5_TEKUK":  (I._jari((55, 45, 20), I.RENGGANG), "keluar"),
    "W_TEKUK":  (I._jari((55, 45, 20), I.RENGGANG, pinky=_G), ("ujung", "pinky")),
})

IST = {
    "R": dict(p="istirahat_R", a="telapak", b="SANTAI", j="dalam+0.35*depan", tp="bawah+0.55*belakang"),
    "L": dict(p="istirahat_L", a="telapak", b="SANTAI", j="dalam+0.35*depan", tp="atas+0.55*belakang"),
}

def lingkar(t0, t1, pusat, r, sumbu1, sumbu2, n=8, mulai=90, putaran=1.0, **kw):
    """Kunci melingkar: pusat = titik, sumbu1/2 = arah kata (dipakai per sisi)."""
    out = []
    for i in range(n + 1):
        u = i / n
        a = math.radians(mulai + 360 * putaran * u)
        off = f"{r * math.cos(a):.4f}*{sumbu1}+{r * math.sin(a):.4f}*{sumbu2}"
        out.append(k(t0 + (t1 - t0) * u, p=_tambah(pusat, off), kurva=True, **(kw if i == 0 else {})))
    return out

def _tambah(pusat, off):
    # "dada" + "0.03*luar+-0.02*atas" → string offset; negatif ditulis sebagai faktor negatif
    bag = []
    for b in off.split("+"):
        f, d = b.split("*")
        bag.append(f"{float(f):.4f}*{d}")
    if isinstance(pusat, str):
        return pusat + "+" + "+".join(bag)
    return (pusat, bag)

def bolak(t0, dt, n, a, b, **lain):
    """Kunci bergantian a, b, a, b … (dict parsial)."""
    out = []
    for i in range(n):
        d = dict(a if i % 2 == 0 else b); d.update(lain if i == 0 else {})
        out.append(k(t0 + dt * i, **d))
    return out

KAMUS = {}

def S(kode, arti, kat, R, L=None, kepala=None, wajah=None, cara="", gloss=None):
    KAMUS[kode] = dict(kode=kode, arti=arti, kat=kat, R=R, L=L, kepala=kepala or [], wajah=wajah, cara=cara, gloss=gloss or kode.replace("_", "-"))

def cermin(keys):
    """Kunci tangan kanan → tangan kiri (kata dalam/luar otomatis ikut sisi;
    Vector absolut dicerminkan X)."""
    out = []
    for kk in keys:
        d = dict(kk)
        p = d.get("p")
        if isinstance(p, V): d["p"] = A(-p.x, p.y, p.z)
        elif isinstance(p, str):
            d["p"] = (p.replace("netral", "netral_kiri").replace("pelipis", "pelipis_kiri").replace("mata", "mata_kiri")
                      .replace("dada_kanan", "dada_kiri").replace("pipi", "pipi_kiri").replace("rahang", "rahang_kiri"))
        out.append(d)
    return out

# ── Sapaan & sopan santun ───────────────────────────────────────────────────

S("HELLO", "Halo", "Sapaan", [
    k(0, p="pelipis+0.025*depan+0.010*atas", a="sisi_telunjuk", b="FLAT", j="atas+0.5*dalam", tp="depan+0.2*luar"),
    k(0.18),
    k(0.62, p="pelipis+0.20*depan+0.10*luar+0.07*bawah", j="atas+0.25*dalam", tp="depan+0.3*luar"),
    k(0.90),
], kepala=[(0.5, 6, 0, 0), (0.9, 0, 0, 0)], wajah="senang",
  cara="Tangan datar (jari rapat) di pelipis seperti hormat, lalu digerakkan menjauh ke depan-samping.")

S("BYE", "Dadah / selamat tinggal", "Sapaan", [
    k(0, p="netral+0.16*atas+0.06*luar", a="telapak", b="FLAT", j="atas", tp="depan"),
    *bolak(0.16, 0.16, 4, {"b": "BENT_B"}, {"b": "FLAT"}),
    k(0.85, b="FLAT"),
], wajah="senang", cara="Telapak menghadap lawan bicara, jari dilipat-buka beberapa kali seperti melambai.")

S("THANK_YOU", "Terima kasih", "Sapaan", [
    k(0, p="dagu+0.012*atas", a="ujung", b="FLAT", j="atas+0.25*dalam", tp="belakang"),
    k(0.15),
    k(0.60, p="dagu+0.22*depan+0.12*bawah", j="depan+0.7*atas", tp="atas+0.5*belakang"),
    k(0.88),
], kepala=[(0.3, 0, 0, 0), (0.6, 8, 0, 0), (0.9, 3, 0, 0)], wajah="senang", gloss="THANK-YOU",
  cara="Ujung jari tangan datar menyentuh dagu/bibir, lalu tangan bergerak maju ke arah lawan bicara.")

S("PLEASE", "Tolong / silakan", "Sapaan",
  lingkar(0, 0.85, "dada+0.010*depan+0.02*luar", 0.045, "luar", "atas", n=8, mulai=90,
          a="telapak", b="FLAT", j="dalam+0.4*atas", tp="belakang") + [k(1.0)],
  cara="Telapak tangan datar di dada, digerakkan memutar.")

S("SORRY", "Maaf", "Sapaan",
  lingkar(0, 0.85, "dada+0.012*depan+0.02*luar", 0.040, "luar", "atas", n=8, mulai=90,
          a="telapak", b="A", j="atas+0.3*dalam", tp="belakang") + [k(1.0)],
  wajah="sedih", cara="Kepalan tangan (bentuk A) di dada, digerakkan memutar dengan wajah menyesal.")

S("YES", "Ya", "Sapaan", [
    k(0, p="netral+0.07*atas", a="pergelangan", b="S", j="atas", tp="depan"),
    *bolak(0.18, 0.18, 4, {"j": "depan+0.35*atas", "tp": "bawah+0.35*depan"}, {"j": "atas", "tp": "depan"}),
    k(0.85),
], kepala=[(0, 0, 0, 0), (0.18, 12, 0, 0), (0.36, 0, 0, 0), (0.54, 12, 0, 0), (0.72, 0, 0, 0)],
  cara="Kepalan (S) mengangguk di pergelangan seperti kepala mengangguk.")

S("NO", "Tidak", "Sapaan", [
    k(0, p="netral+0.05*atas+0.04*luar", a="pergelangan", b="NO_BUKA", j="atas+0.5*depan", tp="depan+0.6*bawah"),
    *bolak(0.18, 0.18, 4, {"b": "NO_TUTUP"}, {"b": "NO_BUKA"}),
    k(0.85, b="NO_TUTUP"),
], kepala=[(0, 0, 0, 0), (0.2, 0, 14, 0), (0.4, 0, -14, 0), (0.6, 0, 12, 0), (0.85, 0, 0, 0)],
  cara="Telunjuk & jari tengah menutup ke ibu jari dua kali, sambil menggeleng.")

S("FINE", "Baik-baik saja", "Perasaan", [
    k(0, p="dada+0.006*depan", a="jempol", b="5", j="atas+0.15*dalam", tp="dalam"),
    *bolak(0.16, 0.16, 4, {"p": "dada+0.05*depan"}, {"p": "dada+0.006*depan"}),
    k(0.8),
], wajah="senang", cara="Tangan terbuka (5), ibu jari mengetuk dada dua kali.")

S("GOOD", "Baik / bagus", "Perasaan", [
    k(0, p="dagu+0.015*bawah", a="ujung", b="FLAT", j="atas", tp="belakang"),
    k(0.15),
    k(0.55, p=A(0.04, -0.31, 1.185), a="punggung", j="depan+0.5*dalam", tp="atas"),
    k(0.75),
], L=[k(0, p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.6*depan", tp="atas")],
  wajah="senang", cara="Ujung jari di dagu, lalu tangan turun dan mendarat di telapak tangan kiri.")

S("BAD", "Buruk / jelek", "Perasaan", [
    k(0, p="dagu+0.015*bawah", a="ujung", b="FLAT", j="atas", tp="belakang"),
    k(0.15),
    k(0.5, p="dagu+0.16*depan+0.20*bawah", j="depan+0.4*bawah", tp="bawah"),
    k(0.7),
], wajah="sedih", cara="Ujung jari di dagu, lalu tangan dibalik ke bawah menjauh.")

# ── Diri & orang ────────────────────────────────────────────────────────────

S("ME", "Saya / aku", "Orang", [
    k(0, p="dada+0.04*depan", a="telunjuk", b="1", j="belakang+0.2*dalam+0.2*bawah", tp="dalam"),
    k(0.18, p="dada+0.012*depan"),
    k(0.5),
], cara="Telunjuk menunjuk dada sendiri.")

S("YOU", "Kamu / Anda", "Orang", [
    k(0, p="netral+0.06*atas+0.03*belakang", a="telunjuk", b="1", j="depan", tp="bawah+0.3*dalam"),
    k(0.28, p="netral+0.06*atas+0.07*depan"),
    k(0.55),
], cara="Telunjuk menunjuk lawan bicara.")

S("MY", "Milikku / -ku", "Orang", [
    k(0, p="dada+0.05*depan", a="telapak", b="FLAT", j="atas+0.4*dalam", tp="belakang"),
    k(0.2, p="dada+0.008*depan"),
    k(0.5),
], cara="Telapak tangan datar ditempel di dada.")

S("YOUR", "Milikmu / -mu", "Orang", [
    k(0, p="netral+0.06*atas+0.03*belakang", a="telapak", b="FLAT", j="atas", tp="depan"),
    k(0.28, p="netral+0.06*atas+0.07*depan"),
    k(0.55),
], cara="Telapak tangan datar didorong ke arah lawan bicara.")

S("NAME", "Nama", "Orang", [
    k(0, p=A(0.0, -0.33, 1.245), a="jari_tengah", b="H", j="dalam+depan", tp="dalam+belakang"),
    *bolak(0.15, 0.15, 4, {"p": A(0.0, -0.33, 1.222)}, {"p": A(0.0, -0.33, 1.255)}),
    k(0.7, p=A(0.0, -0.33, 1.222)),
], L=[k(0, p=A(0.0, -0.33, 1.20), a="jari_telunjuk", b="H", j="dalam+depan", tp="dalam+belakang")],
  cara="Dua jari (bentuk H) tangan kanan mengetuk dua jari tangan kiri dua kali, bersilang.")

S("NICE", "Senang / menyenangkan", "Orang", [
    k(0, p=A(0.075, -0.265, 1.182), a="telapak", b="FLAT", j="dalam+0.4*depan", tp="bawah"),
    k(0.12),
    k(0.5, p=A(-0.03, -0.38, 1.182)),
    k(0.65),
], L=[k(0, p=A(0.03, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  cara="Telapak kanan mengusap telapak kiri dari pangkal ke ujung jari.")

S("MEET", "Bertemu / berkenalan", "Orang", [
    k(0, p=A(-0.11, -0.34, 1.25), a="telapak", b="1", j="atas", tp="dalam"),
    k(0.45, p=A(-0.026, -0.34, 1.25)),
    k(0.65),
], L=cermin([
    k(0, p=A(-0.11, -0.34, 1.25), a="telapak", b="1", j="atas", tp="dalam"),
    k(0.45, p=A(-0.026, -0.34, 1.25)),
    k(0.65),
]), cara="Dua telunjuk tegak saling mendekat sampai bertemu, seperti dua orang bertemu.")

S("DEAF", "Tuli", "Orang", [
    k(0, p="pipi+0.035*atas+0.02*luar", a="telunjuk", b="1", j="atas+0.6*dalam+0.6*belakang", tp="dalam+0.5*belakang"),
    k(0.15),
    k(0.45, p="sudut_mulut+0.004*depan"),
    k(0.65),
], cara="Telunjuk menyentuh pipi dekat telinga, lalu dekat sudut mulut.")

S("HEARING", "Dengar (orang dengar)", "Orang",
  lingkar(0, 0.8, "mulut+0.05*depan+0.01*luar", 0.022, "depan", "atas", n=8, mulai=90, putaran=2,
          a="telunjuk", b="1", j="dalam+0.6*atas+0.2*depan", tp="belakang+0.6*bawah") + [k(0.95)],
  cara="Telunjuk mendatar di depan mulut, berputar ke depan seperti kata-kata keluar.")

S("LEARN", "Belajar", "Kelas", [
    k(0, p=A(0.04, -0.31, 1.185), a="ujung", b="5", j="bawah+0.3*depan", tp="belakang"),
    k(0.15, b="FLAT_O"),
    k(0.55, p="dahi+0.02*depan+0.01*luar", j="atas+0.25*belakang", tp="belakang+0.3*dalam"),
    k(0.75),
], L=[k(0, p=A(0.04, -0.31, 1.165), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  cara="Tangan kanan seolah 'mengambil' dari telapak kiri lalu memasukkannya ke dahi.")

S("SIGN", "Isyarat / berisyarat", "Kelas",
  lingkar(0, 1.0, "netral+0.05*atas+0.03*luar", 0.05, "depan", "atas", n=10, mulai=90, putaran=2,
          a="telunjuk", b="1", j="atas+0.4*depan", tp="depan+0.3*dalam") + [k(1.15)],
  L=cermin(lingkar(0, 1.0, "netral+0.05*atas+0.03*luar", 0.05, "depan", "atas", n=10, mulai=270, putaran=2,
                   a="telunjuk", b="1", j="atas+0.4*depan", tp="depan+0.3*dalam") + [k(1.15)]),
  cara="Dua telunjuk berputar bergantian ke arah badan.")

S("PERSON", "Orang", "Orang", [
    k(0, p="dada+0.11*luar+0.18*depan", a="telapak", b="FLAT", j="depan", tp="dalam"),
    k(0.45, p="perut+0.11*luar+0.18*depan+0.04*bawah"),
    k(0.6),
], L=cermin([
    k(0, p="dada+0.11*luar+0.18*depan", a="telapak", b="FLAT", j="depan", tp="dalam"),
    k(0.45, p="perut+0.11*luar+0.18*depan+0.04*bawah"),
    k(0.6),
]), cara="Dua telapak saling berhadapan turun sejajar badan (akhiran -er/orang).")

# ── Kata tanya ──────────────────────────────────────────────────────────────

S("WHAT", "Apa", "Kata tanya", [
    k(0, p="netral+0.09*luar+0.07*bawah", a="telapak", b="5", j="depan+0.5*luar", tp="atas"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.12*luar+0.07*bawah"}, {"p": "netral+0.07*luar+0.07*bawah"}),
    k(0.75),
], L=cermin([
    k(0, p="netral+0.09*luar+0.07*bawah", a="telapak", b="5", j="depan+0.5*luar", tp="atas"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.12*luar+0.07*bawah"}, {"p": "netral+0.07*luar+0.07*bawah"}),
    k(0.75),
]), wajah="wh", cara="Dua telapak terbuka menghadap ke atas, digoyang kecil ke samping, alis berkerut.")

S("WHERE", "Di mana", "Kata tanya", [
    k(0, p="netral+0.13*atas", a="telunjuk", b="1", j="atas", tp="depan+0.3*dalam"),
    *bolak(0.14, 0.14, 4, {"p": "netral+0.13*atas+0.03*luar"}, {"p": "netral+0.13*atas+0.03*dalam"}),
    k(0.75),
], wajah="wh", cara="Telunjuk tegak digoyang ke kiri-kanan, alis berkerut.")

S("WHO", "Siapa", "Kata tanya", [
    k(0, p="dagu+0.005*depan", a="jempol", b="L", j="atas", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"b": "BENT_L"}, {"b": "L"}),
    k(0.8),
], wajah="wh", cara="Ibu jari bentuk L di dagu, telunjuk menekuk-lurus berulang.")

S("WHEN", "Kapan", "Kata tanya",
  lingkar(0, 0.45, A(0.03, -0.335, 1.33), 0.035, "luar", "atas", n=6, mulai=90,
          a="telunjuk", b="1", j="dalam+depan+0.3*bawah", tp="bawah") +
  [k(0.65, p=A(0.03, -0.335, 1.295)), k(0.85)],
  L=[k(0, p=A(0.03, -0.335, 1.28), a="telunjuk", b="1", j="atas", tp="dalam")],
  wajah="wh", cara="Telunjuk kanan memutari ujung telunjuk kiri, lalu mendarat di atasnya.")

S("WHY", "Mengapa", "Kata tanya", [
    k(0, p="dahi+0.004*luar", a="ujung", b="BENT_B", j="atas", tp="belakang"),
    k(0.15),
    k(0.55, p="dahi+0.16*depan+0.08*bawah+0.04*luar", a="telapak", b="Y", j="atas+0.2*dalam", tp="belakang"),
    k(0.8),
], wajah="wh", cara="Ujung jari menyentuh dahi, lalu tangan menjauh sambil berubah ke bentuk Y.")

S("HOW", "Bagaimana", "Kata tanya", [
    k(0, p=A(-0.013, -0.31, 1.21), a="buku", b="BENT_B", j="dalam+0.3*atas", tp="bawah+0.3*belakang"),
    k(0.25, tp="depan"),
    k(0.5, p=A(-0.022, -0.34, 1.225), tp="atas+0.3*depan"),
    k(0.7),
], L=cermin([
    k(0, p=A(-0.013, -0.31, 1.21), a="buku", b="BENT_B", j="dalam+0.3*atas", tp="bawah+0.3*belakang"),
    k(0.25, tp="depan"),
    k(0.5, p=A(-0.022, -0.34, 1.225), tp="atas+0.3*depan"),
    k(0.7),
]), wajah="wh", cara="Punggung jari kedua tangan beradu, lalu diputar ke depan hingga telapak menghadap atas.")

S("HOW_MANY", "Berapa", "Kata tanya", [
    k(0, p="netral+0.04*bawah", a="telapak", b="S", j="depan+0.3*luar", tp="atas"),
    k(0.15),
    k(0.42, p="netral+0.06*atas", b="5"),
    k(0.65),
], wajah="wh", gloss="HOW-MANY", cara="Kepalan menghadap atas lalu dibuka jadi tangan terbuka sambil naik.")

# ── Strategi komunikasi & kelas ─────────────────────────────────────────────

S("UNDERSTAND", "Mengerti / paham", "Kelas", [
    k(0, p="pelipis+0.05*depan+0.02*luar", a="buku", b="S", j="atas", tp="belakang"),
    k(0.2),
    k(0.36, b="1"),
    k(0.65),
], cara="Kepalan dekat pelipis, telunjuk menjentik ke atas.")

S("DONT_UNDERSTAND", "Tidak mengerti", "Kelas", [
    k(0, p="pelipis+0.05*depan+0.02*luar", a="buku", b="S", j="atas", tp="belakang"),
    k(0.2),
    k(0.36, b="1"),
    k(0.85),
], kepala=[(0.1, 0, 0, 0), (0.3, 0, 14, 0), (0.5, 0, -14, 0), (0.7, 0, 10, 0), (0.85, 0, 0, 0)],
  wajah="wh", gloss="NOT-UNDERSTAND", cara="Isyarat MENGERTI sambil menggeleng dan alis berkerut.")

S("KNOW", "Tahu", "Kelas", [
    k(0, p="pelipis+0.035*depan", a="ujung", b="FLAT", j="atas+0.4*dalam", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "pelipis+0.004*depan"}, {"p": "pelipis+0.035*depan"}),
    k(0.7, p="pelipis+0.004*depan"),
], cara="Ujung jari tangan datar mengetuk pelipis/dahi.")

S("DONT_KNOW", "Tidak tahu", "Kelas", [
    k(0, p="pelipis+0.035*depan", a="ujung", b="FLAT", j="atas+0.4*dalam", tp="belakang"),
    k(0.15, p="pelipis+0.004*depan"),
    k(0.3),
    k(0.65, p="pelipis+0.13*depan+0.10*luar", j="atas+0.3*luar", tp="depan"),
    k(0.85),
], kepala=[(0.3, 0, 0, 0), (0.55, 0, 10, 4), (0.85, 0, 0, 0)], gloss="DON'T-KNOW",
  cara="Ujung jari di pelipis, lalu tangan dibalik menjauh dengan telapak menghadap depan.")

S("AGAIN", "Lagi / ulangi", "Kelas", [
    k(0, p=A(-0.07, -0.31, 1.16), a="ujung", b="BENT_B", j="dalam+0.3*depan", tp="atas"),
    k(0.3, p=A(-0.015, -0.31, 1.25), tp="dalam+0.5*atas"),
    k(0.55, p=A(0.04, -0.31, 1.178), tp="bawah+0.3*dalam", j="dalam+0.4*atas"),
    k(0.78),
], L=[k(0, p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  cara="Tangan kanan tertekuk berayun naik lalu ujung jarinya mendarat di telapak kiri.")

S("SLOW", "Pelan / lambat", "Kelas", [
    k(0, p=A(-0.025, -0.37, 1.205), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(1.0, p=A(0.065, -0.29, 1.205)),
    k(1.15),
], L=[k(0, p=A(0.03, -0.33, 1.18), a="punggung", b="FLAT", j="dalam+0.5*depan", tp="bawah")],
  cara="Telapak kanan mengusap punggung tangan kiri perlahan dari ujung jari ke pergelangan.")

S("QUESTION", "Pertanyaan / tanya", "Kelas", [
    k(0, p="netral+0.12*atas", a="telunjuk", b="1", j="atas", tp="depan"),
    k(0.22, p="netral+0.14*atas+0.03*dalam", b="X"),
    k(0.45, p="netral+0.03*atas+0.05*depan", j="depan+0.3*atas"),
    k(0.62, p="netral+0.03*bawah+0.07*depan", b="1", j="depan+0.6*bawah"),
    k(0.8),
], wajah="wh", cara="Telunjuk 'menggambar' tanda tanya di udara.")

S("HELP", "Bantu / tolong", "Kelas", [
    k(0, p=A(0.03, -0.30, 1.142), a="sisi_kelingking", b="A", j="depan+0.2*dalam", tp="dalam"),
    k(0.2),
    k(0.6, p=A(0.03, -0.30, 1.242)),
    k(0.75),
], L=[k(0, p=A(0.03, -0.30, 1.12), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas"),
      k(0.2), k(0.6, p=A(0.03, -0.30, 1.22)), k(0.75)],
  cara="Kepalan kanan (ibu jari tegak) di atas telapak kiri, keduanya diangkat bersama.")

S("TEACH", "Mengajar", "Kelas", [
    k(0, p="pelipis+0.06*depan+0.05*luar", a="ujung", b="FLAT_O", j="atas+0.5*depan", tp="dalam"),
    *bolak(0.18, 0.18, 3, {"p": "pelipis+0.17*depan+0.05*luar+0.02*bawah"}, {"p": "pelipis+0.06*depan+0.05*luar"}),
    k(0.7),
], L=cermin([
    k(0, p="pelipis+0.06*depan+0.05*luar", a="ujung", b="FLAT_O", j="atas+0.5*depan", tp="dalam"),
    *bolak(0.18, 0.18, 3, {"p": "pelipis+0.17*depan+0.05*luar+0.02*bawah"}, {"p": "pelipis+0.06*depan+0.05*luar"}),
    k(0.7),
]), cara="Dua tangan bentuk O-pipih di samping dahi, didorong ke depan dua kali.")

S("SCHOOL", "Sekolah", "Kelas", [
    k(0, p=A(0.03, -0.31, 1.245), a="telapak", b="FLAT", j="dalam+0.6*depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.03, -0.31, 1.177)}, {"p": A(0.03, -0.31, 1.245)}),
    k(0.7, p=A(0.03, -0.31, 1.177)),
], L=[k(0, p=A(0.03, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  cara="Telapak kanan menepuk telapak kiri dua kali (tepuk tangan guru).")

S("BOOK", "Buku", "Kelas", [
    k(0, p=A(-0.016, -0.34, 1.22), a="telapak", b="FLAT", j="depan+0.4*atas", tp="dalam"),
    k(0.15),
    k(0.55, p=A(-0.055, -0.34, 1.20), tp="atas+0.4*dalam"),
    k(0.75),
], L=cermin([
    k(0, p=A(-0.016, -0.34, 1.22), a="telapak", b="FLAT", j="depan+0.4*atas", tp="dalam"),
    k(0.15),
    k(0.55, p=A(-0.055, -0.34, 1.20), tp="atas+0.4*dalam"),
    k(0.75),
]), cara="Dua telapak menempel lalu dibuka seperti membuka buku.")

S("FINGERSPELL", "Mengeja jari", "Kelas", [
    k(0, p="eja+0.04*luar", a="telapak", b="5", j="atas+0.3*depan", tp="bawah+0.5*depan"),
    *bolak(0.12, 0.12, 6, {"b": "CLAW", "p": "eja+0.02*luar"}, {"b": "5", "p": "eja+0.06*luar"}),
    k(0.95),
], cara="Jari-jari bergerak menggeliat sambil tangan bergeser ke samping.")

# ── Perasaan ────────────────────────────────────────────────────────────────

S("HAPPY", "Senang / bahagia", "Perasaan", [
    k(0, p="dada+0.07*bawah+0.012*depan", a="telapak", b="FLAT", j="dalam+0.4*atas", tp="belakang"),
    k(0.25, p="dada+0.06*atas+0.03*depan"),
    k(0.38, p="dada+0.05*bawah+0.05*depan"),
    k(0.5, p="dada+0.07*bawah+0.012*depan"),
    k(0.75, p="dada+0.06*atas+0.03*depan"),
    k(0.9),
], wajah="senang", cara="Telapak di dada mengusap ke atas dua kali dengan wajah ceria.")

S("SAD", "Sedih", "Perasaan", [
    k(0, p="mata+0.10*depan+0.03*luar+0.02*bawah", a="telapak", b="5", j="atas", tp="belakang"),
    k(0.15),
    k(0.75, p="dagu+0.11*depan+0.08*bawah+0.03*luar"),
    k(0.95),
], L=cermin([
    k(0, p="mata+0.10*depan+0.03*luar+0.02*bawah", a="telapak", b="5", j="atas", tp="belakang"),
    k(0.15),
    k(0.75, p="dagu+0.11*depan+0.08*bawah+0.03*luar"),
    k(0.95),
]), kepala=[(0.1, 0, 0, 0), (0.8, 10, 0, 0)], wajah="sedih",
  cara="Dua tangan terbuka di depan wajah turun perlahan, wajah sedih.")

S("TIRED", "Capek / lelah", "Perasaan", [
    k(0, p="dada_kanan+0.06*atas", a="ujung", b="BENT_B", j="atas+0.2*luar", tp="belakang"),
    k(0.15),
    k(0.6, j="depan+0.2*bawah", tp="atas+0.5*belakang"),
    k(0.8),
], L=cermin([
    k(0, p="dada_kanan+0.06*atas", a="ujung", b="BENT_B", j="atas+0.2*luar", tp="belakang"),
    k(0.15),
    k(0.6, j="depan+0.2*bawah", tp="atas+0.5*belakang"),
    k(0.8),
]), kepala=[(0.1, 0, 0, 0), (0.6, 8, 0, 5)], wajah="sedih",
  cara="Ujung jari kedua tangan di dada atas, tangan 'jatuh' ke bawah, bahu lunglai.")

S("SICK", "Sakit", "Perasaan", [
    k(0, p="dahi+0.006*luar", a="tengah", b="OPEN_8", j="atas+0.3*dalam", tp="belakang"),
    k(0.3, putar=12), k(0.6, putar=-6), k(0.8, putar=0),
], L=[k(0, p="perut", a="tengah", b="OPEN_8", j="dalam+0.3*bawah", tp="belakang"),
      k(0.3, putar=-12), k(0.6, putar=6), k(0.8, putar=0)],
  kepala=[(0, 0, 0, 0), (0.5, 4, 0, 6)], wajah="sedih",
  cara="Jari tengah kanan di dahi, jari tengah kiri di perut, wajah tak enak badan.")

S("HUNGRY", "Lapar", "Kebutuhan", [
    k(0, p="dada+0.07*atas+0.012*depan", a="telapak", b="C", j="dalam", tp="belakang"),
    k(0.6, p="perut+0.06*atas+0.012*depan"),
    k(0.8),
], cara="Tangan bentuk C di dada turun ke perut.")

S("LIKE", "Suka", "Perasaan", [
    k(0, p="dada+0.008*depan", a="tengah", b="OPEN_8", j="atas+0.2*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="dada+0.16*depan", b="8"),
    k(0.75),
], wajah="senang", cara="Jari tengah & ibu jari di dada, ditarik maju sambil menyatu.")

S("LOVE", "Cinta / sayang", "Perasaan", [
    k(0, p="dada_kiri+0.05*depan", a="telapak", b="S", j="atas+0.7*dalam", tp="belakang"),
    k(0.3, p="dada_kiri+0.015*depan"),
    k(0.85),
], L=[k(0, p="dada_kanan+0.08*depan", a="telapak", b="S", j="atas+0.7*dalam", tp="belakang"),
      k(0.3, p="dada_kanan+0.05*depan"), k(0.85)],
  wajah="senang", cara="Dua kepalan menyilang memeluk dada.")

# ── Keluarga ───────────────────────────────────────────────────────────────

S("MOTHER", "Ibu", "Keluarga", [
    k(0, p="dagu+0.04*depan", a="jempol", b="5", j="atas", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "dagu+0.004*depan"}, {"p": "dagu+0.04*depan"}),
    k(0.7, p="dagu+0.004*depan"),
], cara="Tangan terbuka (5), ibu jari mengetuk dagu.")

S("FATHER", "Ayah", "Keluarga", [
    k(0, p="dahi+0.04*depan", a="jempol", b="5", j="atas", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "dahi+0.004*depan"}, {"p": "dahi+0.04*depan"}),
    k(0.7, p="dahi+0.004*depan"),
], cara="Tangan terbuka (5), ibu jari mengetuk dahi.")

S("SISTER", "Saudara perempuan", "Keluarga", [
    k(0, p="rahang+0.006*depan", a="jempol", b="L", j="depan", tp="dalam"),
    k(0.15),
    k(0.6, p=A(0.015, -0.36, 1.228), a="sisi_kelingking"),
    k(0.8),
], L=[k(0, p=A(0.02, -0.36, 1.17), a="jari_telunjuk", b="L", j="depan", tp="dalam")],
  cara="Ibu jari bentuk L di rahang, lalu turun mendarat di atas tangan L kiri.")

S("BROTHER", "Saudara laki-laki", "Keluarga", [
    k(0, p="pelipis+0.03*depan", a="jempol", b="L", j="depan", tp="dalam"),
    k(0.15),
    k(0.6, p=A(0.015, -0.36, 1.228), a="sisi_kelingking"),
    k(0.8),
], L=[k(0, p=A(0.02, -0.36, 1.17), a="jari_telunjuk", b="L", j="depan", tp="dalam")],
  cara="Ibu jari bentuk L di dahi/pelipis, lalu turun mendarat di atas tangan L kiri.")

S("BABY", "Bayi", "Keluarga", [
    k(0, p=A(-0.03, -0.30, 1.175), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="atas"),
    *bolak(0.25, 0.25, 4, {"p": A(0.01, -0.30, 1.19)}, {"p": A(-0.05, -0.30, 1.17)}),
    k(1.2),
], L=[k(0, p=A(0.07, -0.27, 1.145), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="atas"),
      *bolak(0.25, 0.25, 4, {"p": A(0.11, -0.27, 1.16)}, {"p": A(0.05, -0.27, 1.14)}),
      k(1.2)], wajah="senang", cara="Dua lengan seperti menimang bayi, diayun ke kiri-kanan.")

S("FAMILY", "Keluarga", "Keluarga", [
    k(0, p=A(-0.035, -0.33, 1.25), a="telapak", b="F", j="atas", tp="depan"),
    k(0.15),
    k(0.45, p=A(-0.15, -0.40, 1.25), tp="depan+0.7*luar"),
    k(0.8, p=A(-0.03, -0.46, 1.25), tp="belakang+0.3*dalam"),
    k(0.95),
], L=cermin([
    k(0, p=A(-0.035, -0.33, 1.25), a="telapak", b="F", j="atas", tp="depan"),
    k(0.15),
    k(0.45, p=A(-0.15, -0.40, 1.25), tp="depan+0.7*luar"),
    k(0.8, p=A(-0.03, -0.46, 1.25), tp="belakang+0.3*dalam"),
    k(0.95),
]), cara="Dua tangan bentuk F berputar keluar membentuk lingkaran sampai bertemu lagi.")

S("FRIEND", "Teman", "Keluarga", [
    k(0, p=A(0.0, -0.31, 1.248), a="jari_telunjuk", b="X", j="dalam+0.3*depan", tp="bawah"),
    k(0.2),
    k(0.55, p=A(0.0, -0.31, 1.20), tp="atas"),
    k(0.75),
], L=[k(0, p=A(0.0, -0.31, 1.222), a="jari_telunjuk", b="X", j="dalam+0.3*depan", tp="atas"),
      k(0.2), k(0.55, p=A(0.0, -0.31, 1.226), tp="bawah"), k(0.75)],
  wajah="senang", cara="Dua telunjuk bengkok saling mengait, lalu dibalik.")

# ── Waktu ──────────────────────────────────────────────────────────────────

S("MORNING", "Pagi", "Waktu", [
    k(0, p=A(-0.02, -0.38, 1.12), a="telapak", b="FLAT", j="dalam+0.6*depan", tp="atas+0.4*belakang"),
    k(0.2),
    k(0.8, p=A(-0.07, -0.36, 1.32), j="atas+0.5*dalam+0.2*depan", tp="belakang"),
    k(1.0),
], L=[k(0, p=A(-0.11, -0.25, 1.085), a="telapak", b="FLAT", j="dalam+0.2*depan", tp="bawah")],
  cara="Tangan kiri di siku kanan; lengan bawah kanan (telapak ke atas) naik seperti matahari terbit.")

S("NIGHT", "Malam", "Waktu", [
    k(0, p=A(0.02, -0.33, 1.235), a="telapak", b="BENT_B", j="dalam+0.4*depan", tp="bawah"),
    *bolak(0.2, 0.2, 3, {"j": "dalam+0.4*depan+0.5*bawah"}, {"j": "dalam+0.4*depan"}),
    k(0.8),
], L=[k(0, p=A(0.04, -0.31, 1.17), a="punggung", b="FLAT", j="dalam+0.3*depan", tp="bawah")],
  cara="Tangan kanan tertekuk menghadap bawah mengetuk-ngetuk di atas pergelangan kiri (matahari terbenam).")

S("NOW", "Sekarang", "Waktu", [
    k(0, p="netral+0.07*luar+0.05*atas", a="telapak", b="Y", j="depan", tp="atas"),
    k(0.15),
    k(0.4, p="netral+0.07*luar+0.02*bawah"),
    k(0.6),
], L=cermin([
    k(0, p="netral+0.07*luar+0.05*atas", a="telapak", b="Y", j="depan", tp="atas"),
    k(0.15),
    k(0.4, p="netral+0.07*luar+0.02*bawah"),
    k(0.6),
]), cara="Dua tangan bentuk Y menghadap atas, diturunkan sedikit.")

S("TOMORROW", "Besok", "Waktu", [
    k(0, p="pipi+0.008*depan", a="jempol", b="10", j="atas", tp="dalam"),
    k(0.15),
    k(0.55, p="pipi+0.13*depan+0.03*bawah", j="atas+0.6*depan"),
    k(0.75),
], cara="Ibu jari di pipi bergerak maju ke depan (masa depan).")

S("YESTERDAY", "Kemarin", "Waktu", [
    k(0, p="sudut_mulut+0.03*luar+0.008*depan", a="jempol", b="10", j="atas", tp="dalam"),
    k(0.15),
    k(0.55, p="telinga+0.045*depan", j="atas+0.5*belakang"),
    k(0.75),
], cara="Ibu jari di pipi dekat mulut bergerak mundur ke arah telinga (masa lalu).")

S("DAY", "Hari / siang", "Waktu", [
    k(0, p=A(-0.03, -0.34, 1.44), a="telunjuk", b="1", j="atas", tp="dalam"),
    k(0.15),
    k(0.85, p=A(0.10, -0.36, 1.25), j="dalam+0.15*atas"),
    k(1.0),
], L=[k(0, p=A(0.07, -0.30, 1.10), a="punggung", b="FLAT", j="dalam+0.2*depan", tp="bawah")],
  cara="Telunjuk kanan tegak lalu berayun turun melintasi badan seperti matahari bergerak.")

# ── Warna ──────────────────────────────────────────────────────────────────

S("RED", "Merah", "Warna", [
    k(0, p="mulut+0.014*bawah+0.012*depan", a="telunjuk", b="1", j="atas", tp="belakang"),
    *bolak(0.2, 0.15, 4, {"p": "dagu+0.025*bawah+0.02*depan", "b": "X"}, {"p": "mulut+0.014*bawah+0.012*depan", "b": "1"}),
    k(0.85),
], cara="Telunjuk mengusap bibir bawah ke bawah dua kali.")

def _goyang(nama, arti, bentuk, cara, j="atas", tp="dalam"):
    S(nama, arti, "Warna", [
        k(0, p="netral+0.07*atas", a="pergelangan", b=bentuk, j=j, tp=tp),
        *bolak(0.13, 0.13, 5, {"putar": -32}, {"putar": 28}),
        k(0.85, putar=0),
    ], cara=cara)

_goyang("BLUE", "Biru", "B", "Tangan bentuk B digoyang/diputar kecil di pergelangan.")
_goyang("GREEN", "Hijau", "G", "Tangan bentuk G digoyang/diputar kecil di pergelangan.", j="atas+0.4*depan")
_goyang("YELLOW", "Kuning", "Y", "Tangan bentuk Y digoyang/diputar kecil di pergelangan.")

S("BLACK", "Hitam", "Warna", [
    k(0, p="dahi+0.035*dalam+0.016*depan", a="jari_telunjuk", b="1", j="dalam+0.15*bawah", tp="bawah+0.6*belakang"),
    k(0.12),
    k(0.55, p="dahi+0.075*luar+0.016*depan"),
    k(0.7),
], cara="Sisi telunjuk ditarik melintasi dahi.")

S("WHITE", "Putih", "Warna", [
    k(0, p="dada+0.010*depan", a="telapak", b="5", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="dada+0.15*depan", b="FLAT_O"),
    k(0.75),
], cara="Tangan terbuka di dada ditarik maju sambil jari mengatup.")

S("ORANGE", "Oranye / jeruk", "Warna", [
    k(0, p="dagu+0.05*depan+0.01*bawah", a="telapak", b="C", j="atas", tp="belakang+0.4*dalam"),
    *bolak(0.15, 0.15, 4, {"b": "S"}, {"b": "C"}),
    k(0.75, b="S"),
], cara="Tangan C di depan dagu meremas jadi S dua kali, seperti memeras jeruk.")

# ── Kebutuhan sehari-hari ──────────────────────────────────────────────────

S("EAT", "Makan", "Kebutuhan", [
    k(0, p="mulut+0.035*depan", a="ujung", b="FLAT_O", j="belakang+0.6*atas", tp="bawah+0.3*dalam"),
    *bolak(0.15, 0.15, 4, {"p": "mulut+0.008*depan"}, {"p": "mulut+0.045*depan"}),
    k(0.7, p="mulut+0.008*depan"),
], cara="Ujung jari bentuk O-pipih mengetuk mulut.")

S("DRINK", "Minum", "Kebutuhan", [
    k(0, p="dagu+0.07*depan+0.03*bawah", a="telapak", b="C", j="atas", tp="dalam"),
    k(0.15),
    k(0.55, p="dagu+0.045*depan", j="atas+0.8*belakang", tp="dalam+0.3*bawah"),
    k(0.75),
], cara="Tangan bentuk C seperti memegang gelas didekatkan dan dimiringkan ke mulut.")

S("WATER", "Air", "Kebutuhan", [
    k(0, p="dagu+0.03*depan", a="telunjuk", b="W", j="atas", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "dagu+0.004*depan"}, {"p": "dagu+0.03*depan"}),
    k(0.7, p="dagu+0.004*depan"),
], cara="Jari telunjuk bentuk W mengetuk dagu.")

S("TOILET", "Toilet / kamar mandi", "Kebutuhan", [
    k(0, p="netral+0.06*atas", a="pergelangan", b="T", j="atas", tp="depan"),
    *bolak(0.14, 0.14, 5, {"putar": -25, "p": "netral+0.06*atas+0.015*dalam"}, {"putar": 25, "p": "netral+0.06*atas+0.015*luar"}),
    k(0.85, putar=0, p="netral+0.06*atas"),
], cara="Tangan bentuk T digoyang ke kiri-kanan.")

S("WANT", "Mau / ingin", "Kebutuhan", [
    k(0, p="netral+0.07*luar+0.05*bawah+0.07*depan", a="telapak", b="5", j="depan+0.3*luar", tp="atas"),
    k(0.15),
    k(0.55, p="netral+0.07*luar+0.05*bawah+0.05*belakang", b="CLAW"),
    k(0.75),
], L=cermin([
    k(0, p="netral+0.07*luar+0.05*bawah+0.07*depan", a="telapak", b="5", j="depan+0.3*luar", tp="atas"),
    k(0.15),
    k(0.55, p="netral+0.07*luar+0.05*bawah+0.05*belakang", b="CLAW"),
    k(0.75),
]), cara="Dua tangan menghadap atas ditarik ke badan sambil jari menekuk (cakar).")

S("NEED", "Perlu / butuh", "Kebutuhan", [
    k(0, p="netral+0.09*atas", a="pergelangan", b="X", j="depan", tp="bawah"),
    *bolak(0.16, 0.16, 4, {"j": "bawah+0.6*depan", "tp": "belakang"}, {"j": "depan", "tp": "bawah"}),
    k(0.8, j="bawah+0.6*depan", tp="belakang"),
], cara="Telunjuk bengkok (X) menekuk ke bawah dua kali.")

S("SLEEP", "Tidur", "Kebutuhan", [
    k(0, p="mata+0.08*depan+0.02*luar", a="telapak", b="5", j="atas", tp="belakang"),
    k(0.15),
    k(0.65, p="dagu+0.07*depan+0.03*bawah", b="FLAT_O"),
    k(0.9),
], kepala=[(0.15, 0, 0, 0), (0.7, 8, 0, 10)], wajah="tidur",
  cara="Tangan terbuka di depan wajah ditarik turun sambil mengatup; mata terpejam.")

S("WORK", "Kerja", "Kebutuhan", [
    k(0, p=A(0.03, -0.31, 1.25), a="telapak", b="S", j="dalam+0.6*depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.03, -0.31, 1.205)}, {"p": A(0.03, -0.31, 1.25)}),
    k(0.7, p=A(0.03, -0.31, 1.205)),
], L=[k(0, p=A(0.045, -0.31, 1.175), a="punggung", b="S", j="dalam+0.6*depan", tp="bawah")],
  cara="Kepalan kanan mengetuk punggung kepalan kiri dua kali.")

S("HOUSE", "Rumah", "Kebutuhan", [
    k(0, p=A(-0.012, -0.34, 1.40), a="ujung", b="FLAT", j="atas+dalam", tp="bawah+dalam"),
    k(0.12),
    k(0.45, p=A(-0.13, -0.34, 1.29), a="telapak", j="atas+0.3*dalam", tp="dalam+0.4*bawah"),
    k(0.85, p=A(-0.13, -0.34, 1.13), j="atas", tp="dalam"),
    k(1.0),
], L=cermin([
    k(0, p=A(-0.012, -0.34, 1.40), a="ujung", b="FLAT", j="atas+dalam", tp="bawah+dalam"),
    k(0.12),
    k(0.45, p=A(-0.13, -0.34, 1.29), a="telapak", j="atas+0.3*dalam", tp="dalam+0.4*bawah"),
    k(0.85, p=A(-0.13, -0.34, 1.13), j="atas", tp="dalam"),
    k(1.0),
]), cara="Dua tangan menggambar atap lalu dinding rumah.")

S("OLD", "Tua / umur", "Waktu", [
    k(0, p="dagu+0.03*depan+0.02*bawah", a="telapak", b="C", j="dalam+0.2*bawah", tp="belakang+0.5*atas"),
    k(0.15),
    k(0.55, p="dagu+0.05*depan+0.15*bawah", b="S"),
    k(0.75),
], cara="Tangan C di dagu ditarik turun menjadi kepalan, seperti mengelus jenggot panjang.")

S("SEE", "Melihat", "Kelas", [
    k(0, p="mata+0.05*depan+0.02*dalam", a="ujung", b="V", j="belakang+atas", tp="bawah"),
    k(0.12),
    k(0.5, p="mata+0.22*depan+0.04*bawah"),
    k(0.65),
], cara="Ujung jari bentuk V dari depan mata bergerak maju.")

S("LATER", "Nanti", "Waktu", [
    k(0, p="netral+0.07*atas", a="jempol", b="L", j="atas", tp="depan"),
    k(0.15),
    k(0.55, j="depan+0.4*atas+0.3*dalam", tp="bawah+0.4*depan"),
    k(0.75),
], cara="Ibu jari bentuk L sebagai poros, telunjuk diputar maju.")

S("ASL", "ASL", "Kelas", [], cara="Dieja jari: A-S-L.")

# ── Abjad jari ─────────────────────────────────────────────────────────────

HURUF_ARAH = {
    "C": ("atas", "dalam"), "O": ("atas", "dalam+0.3*depan"), "D": ("atas", "depan+0.3*dalam"),
    "G": ("dalam", "belakang"), "H": ("dalam", "belakang"), "P": ("depan+0.9*bawah", "dalam+0.5*belakang"),
    "Q": ("bawah+0.2*depan", "belakang+0.4*dalam"), "E": ("atas", "depan"), "X": ("atas", "depan+0.4*dalam"),
}

def _huruf(h):
    b = h if h in I.BENTUK else h
    j, tp = HURUF_ARAH.get(h, ("atas", "depan"))
    if h == "J":
        R = [k(0, p="eja", a="telapak", b="J", j="atas", tp="depan+0.5*dalam"),
             k(0.18, p="eja+0.04*bawah", tp="dalam+0.4*belakang"),
             k(0.36, p="eja+0.05*bawah+0.035*dalam", tp="belakang"),
             k(0.5)]
    elif h == "Z":
        R = [k(0, p="eja+0.04*luar+0.05*atas", a="telunjuk", b="Z", j="atas+0.6*depan", tp="depan+0.3*bawah"),
             k(0.18, p="eja+0.05*dalam+0.05*atas"),
             k(0.36, p="eja+0.04*luar"),
             k(0.54, p="eja+0.05*dalam"),
             k(0.65)]
    else:
        R = [k(0, p="eja", a="telapak", b=b, j=j, tp=tp), k(0.45)]
    S(f"HURUF_{h}", f"Huruf {h}", "Abjad jari", R, gloss=h, cara=f"Huruf {h} dalam abjad jari ASL.")

for _h in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
    _huruf(_h)

# ── Angka ──────────────────────────────────────────────────────────────────

def _angka(n, R, cara):
    S(f"ANGKA_{n}", f"Angka {n}", "Angka", R, gloss=str(n), cara=cara)

for n, b in [(1, "1"), (2, "V"), (3, "3"), (4, "4"), (5, "5")]:
    _angka(n, [k(0, p="angka", a="telapak", b=b, j="atas", tp="belakang+0.15*dalam"), k(0.45)],
           "Angka 1–5: telapak menghadap ke diri sendiri.")
for n, b in [(6, "6"), (7, "7"), (8, "8"), (9, "9")]:
    _angka(n, [k(0, p="angka", a="telapak", b=b, j="atas", tp="depan+0.15*dalam"), k(0.45)],
           "Angka 6–9: telapak menghadap lawan bicara, ibu jari menyentuh ujung jari.")
_angka(0, [k(0, p="angka", a="telapak", b="O", j="atas", tp="dalam+0.3*depan"), k(0.45)], "Angka 0: bentuk O.")
_angka(10, [k(0, p="angka", a="pergelangan", b="10", j="atas", tp="dalam"),
            *bolak(0.12, 0.12, 4, {"putar": -30}, {"putar": 25}), k(0.65, putar=0)],
       "Angka 10: ibu jari tegak, pergelangan digoyang.")
_angka(11, [k(0, p="angka", a="telapak", b="S", j="atas", tp="belakang"),
            *bolak(0.14, 0.14, 4, {"b": "1"}, {"b": "S"}), k(0.7, b="1")],
       "Angka 11: telunjuk menjentik dari kepalan dua kali, telapak ke diri sendiri.")
_angka(12, [k(0, p="angka", a="telapak", b="S", j="atas", tp="belakang"),
            *bolak(0.14, 0.14, 4, {"b": "V"}, {"b": "S"}), k(0.7, b="V")],
       "Angka 12: telunjuk & jari tengah menjentik dari kepalan dua kali.")
for n, a_, b_ in [(13, "3", "3_TEKUK"), (14, "4", "4_TEKUK"), (15, "5", "5_TEKUK")]:
    _angka(n, [k(0, p="angka", a="telapak", b=a_, j="atas", tp="belakang"),
               *bolak(0.14, 0.14, 4, {"b": b_}, {"b": a_}), k(0.7, b=b_)],
           f"Angka {n}: bentuk {a_}, jari-jari menekuk berulang, telapak ke diri sendiri.")
for n, b in [(16, "6"), (17, "7"), (18, "8"), (19, "9")]:
    _angka(n, [k(0, p="angka", a="telapak", b="10", j="atas", tp="belakang+0.3*dalam"),
               k(0.15),
               k(0.5, b=b, tp="depan+0.15*dalam"),
               k(0.75)],
           f"Angka {n}: mulai dari 10 (ibu jari tegak), diputar menjadi {n - 10}.")
_angka(20, [k(0, p="angka", a="telapak", b="L", j="atas+0.3*dalam", tp="depan"),
            *bolak(0.14, 0.14, 4, {"b": "BABY_O"}, {"b": "L"}), k(0.7, b="BABY_O")],
       "Angka 20: ibu jari & telunjuk mengatup berulang.")

# ── Wajah (lapis ekspresi) ─────────────────────────────────────────────────
# alis: (naik m, ke tengah m, putar ° [+ = ujung dalam naik]); mata: skala Z; mulut: (lebar, tinggi)
WAJAH = {
    "netral": dict(alis=(0, 0, 0), mata=1.0, mulut=(1.0, 1.0)),
    "senang": dict(alis=(0.0025, 0, -3), mata=0.92, mulut=(1.18, 1.25)),
    "ya_tidak": dict(alis=(0.0065, 0, 4), mata=1.12, mulut=(0.95, 1.0)),
    "wh": dict(alis=(-0.0035, 0.004, -14), mata=0.86, mulut=(0.9, 1.0)),
    "sedih": dict(alis=(0.0015, 0.002, 16), mata=0.88, mulut=(0.85, 0.7)),
    "tidur": dict(alis=(-0.001, 0, 3), mata=0.08, mulut=(0.9, 0.8)),
}
