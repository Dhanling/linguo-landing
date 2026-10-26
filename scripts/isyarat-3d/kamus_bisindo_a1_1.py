# [isyarat-bisindo-a1a2-v1] Kamus isyarat BISINDO A1.1 "Isyarat Pertama".
# Tangan dominan kanan. Format = kamus_bisindo.py (S/k/lingkar/bolak/cermin).
# ⚠️ Bentuk ditulis dari pengetahuan umum isyarat sehari-hari komunitas Tuli Indonesia
# (variasi Jakarta/Jawa); riset web tidak menemukan deskripsi teks yang bisa dipastikan,
# jadi hampir semua entri ragu=True dan WAJIB dicek pengajar Tuli (variasi daerah besar).

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # B11_PENA: ibu jari + telunjuk menjepit seperti memegang pena
    "B11_PENA": (I._jari(_G, index=(45, 60, 40)), ("ujung", "index")),
    # B11_JEMPOL: kepalan dengan ibu jari tegak (BAIK / jempol)
    "B11_JEMPOL": (I._jari(_G), "tegak"),
})

GELENG = [(0.1, 0, 0, 0), (0.3, 0, 14, 0), (0.5, 0, -14, 0), (0.7, 0, 10, 0), (0.85, 0, 0, 0)]
ANGGUK = [(0.1, 0, 0, 0), (0.3, 12, 0, 0), (0.5, 0, 0, 0), (0.7, 12, 0, 0), (0.85, 0, 0, 0)]

# Tangan kiri dasar
L_TELAPAK_ATAS = dict(p=A(0.04, -0.31, 1.18), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")

def _L(d, t=0, **lain):
    x = dict(d); x.update(lain); return k(t, **x)

# ── Angka ───────────────────────────────────────────────────────────────────

S("ANGKA_0", "Angka 0", "Angka", [k(0, p="angka", a="telapak", b="O", j="atas", tp="dalam+0.5*depan"), k(0.5)],
  gloss="0", cara="Semua jari melengkung bertemu ibu jari membentuk bulatan O.")

# ── Sapaan & sopan santun ──────────────────────────────────────────────────

S("HALO", "Halo", "Sapaan", [
    k(0, p="netral+0.20*atas+0.08*luar", a="telapak", b="5", j="atas", tp="depan"),
    *bolak(0.15, 0.15, 4, {"j": "atas+0.35*luar"}, {"j": "atas+0.35*dalam"}),
    k(0.8, j="atas"),
], wajah="senang", cara="Telapak terbuka menghadap lawan bicara di samping kepala, dilambaikan pelan.")

S("DADAH", "Dadah / sampai jumpa", "Sapaan", [
    k(0, p="netral+0.16*atas+0.06*luar", a="telapak", b="5", j="atas", tp="depan"),
    *bolak(0.12, 0.12, 6, {"j": "atas+0.5*luar"}, {"j": "atas+0.5*dalam"}),
    k(0.9, j="atas"),
], wajah="senang", cara="Telapak terbuka menghadap lawan bicara, dilambaikan kiri-kanan beberapa kali.")

S("SELAMAT", "Selamat", "Sapaan", [
    k(0, p="netral+0.08*atas", a="telapak", b="FLAT", j="depan+0.4*dalam", tp="dalam"),
    k(0.15),
    *bolak(0.3, 0.15, 3, {"p": "netral+0.04*atas"}, {"p": "netral+0.08*atas"}),
    k(0.8),
], L=[k(0, p=A(0.04, -0.33, 1.32), a="telapak", b="FLAT", j="depan+0.4*dalam", tp="dalam")],
  wajah="senang", ragu=True,
  cara="Dua tangan saling berjabat di depan dada, diayun turun-naik seperti memberi selamat.")

S("PAGI", "Pagi", "Waktu", [
    k(0, p=A(-0.03, -0.32, 1.20), a="pergelangan", b="5", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p=A(-0.03, -0.32, 1.38)),
    k(0.8),
], L=[k(0, p=A(0.02, -0.30, 1.19), a="punggung", b="FLAT", j="kanan", tp="bawah")],
  ragu=True, cara="Lengan kiri mendatar seperti cakrawala; tangan kanan terbuka naik dari baliknya seperti matahari terbit.")

S("SIANG", "Siang", "Waktu", [
    k(0, p=A(-0.15, -0.24, 1.57), a="pergelangan", b="5", j="atas", tp="depan+0.5*bawah"),
    k(0.15),
    k(0.55, p=A(-0.15, -0.24, 1.60)),
    k(0.8),
], ragu=True, cara="Tangan terbuka di atas kepala, jari ke atas, seperti matahari tepat di atas.")

S("SORE", "Sore", "Waktu", [
    k(0, p=A(-0.10, -0.33, 1.40), a="pergelangan", b="5", j="atas+0.4*luar", tp="depan"),
    k(0.15),
    k(0.65, p=A(-0.03, -0.32, 1.22), j="atas+0.2*dalam"),
    k(0.85),
], L=[k(0, p=A(0.02, -0.30, 1.19), a="punggung", b="FLAT", j="kanan", tp="bawah")],
  ragu=True, cara="Tangan kanan terbuka turun perlahan ke lengan kiri yang mendatar, seperti matahari terbenam.")

S("MALAM", "Malam", "Waktu", [
    k(0, p=A(-0.10, -0.36, 1.42), a="telapak", b="5", j="atas", tp="depan"),
    k(0.15),
    k(0.6, p=A(-0.03, -0.36, 1.32), b="FLAT", j="dalam+0.3*atas", tp="depan"),
    k(0.8),
], L=cermin([
    k(0, p=A(-0.10, -0.36, 1.42), a="telapak", b="5", j="atas", tp="depan"),
    k(0.15),
    k(0.6, p=A(-0.03, -0.36, 1.26), b="FLAT", j="dalam+0.3*atas", tp="depan"),
    k(0.8),
]), ragu=True, cara="Dua tangan terbuka bergerak menutup bersilang di depan wajah, seperti hari menjadi gelap.")

S("TERIMA_KASIH", "Terima kasih", "Sapaan", [
    k(0, p="dagu+0.015*bawah+0.01*depan", a="ujung", b="FLAT", j="atas+0.2*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p="dagu+0.22*depan+0.14*bawah", j="depan+0.6*atas", tp="atas+0.5*belakang"),
    k(0.85),
], kepala=[(0.3, 0, 0, 0), (0.6, 8, 0, 0), (0.9, 2, 0, 0)], wajah="senang", gloss="TERIMA-KASIH", ragu=True,
  cara="Ujung jari tangan datar di dagu, lalu tangan maju-turun ke arah lawan bicara sambil mengangguk kecil.")

S("SAMA_SAMA", "Sama-sama", "Sapaan", [
    k(0, p="netral+0.04*atas", a="telapak", b="1", j="depan", tp="bawah+0.3*dalam"),
    *bolak(0.15, 0.16, 4, {"p": "netral+0.04*atas+0.04*dalam"}, {"p": "netral+0.04*atas"}),
    k(0.85),
], L=[k(0, p="netral_kiri+0.04*atas", a="telapak", b="1", j="depan", tp="bawah+0.3*dalam")],
  wajah="senang", gloss="SAMA-SAMA", ragu=True,
  cara="Dua telunjuk sejajar mendatar di depan badan, telunjuk kanan mendekat ke telunjuk kiri dua kali.")

S("MAAF", "Maaf", "Sapaan",
  lingkar(0, 0.85, "dada+0.012*depan+0.02*luar", 0.040, "luar", "atas", n=8, mulai=90,
          a="telapak", b="FLAT", j="dalam+0.4*atas", tp="belakang") + [k(1.0)],
  wajah="sedih", ragu=True, cara="Telapak tangan datar di dada, diusap memutar dengan wajah menyesal.")

S("TOLONG", "Tolong", "Sapaan", [
    k(0, p=A(0.02, -0.32, 1.205), a="tumit", b="B11_JEMPOL", j="atas", tp="dalam"),
    k(0.15),
    k(0.6, p=A(0.02, -0.34, 1.30)),
    k(0.8),
], L=[k(0, p=A(0.03, -0.32, 1.17), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas"),
      k(0.15), k(0.6, p=A(0.03, -0.34, 1.265)), k(0.8)],
  ragu=True, cara="Kepalan kanan dengan ibu jari tegak di atas telapak kiri, keduanya diangkat ke depan bersama.")

S("YA", "Ya", "Sapaan", [
    k(0, p="netral+0.07*atas", a="pergelangan", b="S", j="atas", tp="depan"),
    *bolak(0.18, 0.18, 4, {"j": "depan+0.35*atas", "tp": "bawah+0.35*depan"}, {"j": "atas", "tp": "depan"}),
    k(0.85),
], kepala=ANGGUK, ragu=True, cara="Kepalan tangan menekuk di pergelangan seperti mengangguk, kepala ikut mengangguk.")

S("TIDAK", "Tidak", "Sapaan", [
    k(0, p="netral+0.05*atas+0.06*luar+0.03*depan", a="pergelangan", b="1", j="atas", tp="depan"),
    *bolak(0.15, 0.15, 4, {"j": "atas+0.45*luar"}, {"j": "atas+0.45*dalam"}),
    k(0.8, j="atas"),
], kepala=GELENG, cara="Telunjuk tegak, telapak ke depan, digoyang kiri-kanan sambil menggeleng.")

# ── Diri & orang ───────────────────────────────────────────────────────────

S("AKU", "Aku / saya", "Orang", [
    k(0, p="dada+0.05*depan", a="telunjuk", b="1", j="belakang+0.2*dalam+0.2*bawah", tp="dalam"),
    k(0.18, p="dada+0.012*depan"),
    k(0.5),
], cara="Telunjuk menunjuk dada sendiri.")

S("KAMU", "Kamu / Anda", "Orang", [
    k(0, p="netral+0.06*atas+0.03*belakang", a="telunjuk", b="1", j="depan", tp="bawah+0.3*dalam"),
    k(0.28, p="netral+0.06*atas+0.08*depan"),
    k(0.55),
], cara="Telunjuk menunjuk ke arah lawan bicara.")

S("ORANG", "Orang", "Orang", [
    k(0, p="netral+0.12*atas", a="pergelangan", b="1", j="atas", tp="dalam"),
    k(0.15),
    k(0.55, p="netral+0.01*atas"),
    k(0.75),
], ragu=True, cara="Telunjuk tegak (seperti satu sosok) digerakkan lurus turun di depan badan.")

S("NAMA", "Nama", "Orang", [
    k(0, p="dada_kiri+0.03*depan", a="jari_tengah", b="U", j="dalam+0.3*atas", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "dada_kiri+0.06*depan"}, {"p": "dada_kiri+0.012*depan"}),
    k(0.8),
], ragu=True, cara="Telunjuk & jari tengah rapat (U) ditepukkan dua kali di dada kiri, seperti papan nama.")

S("KENAL", "Kenal", "Orang", [
    k(0, p="pelipis+0.02*depan", a="telunjuk", b="1", j="atas+0.5*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="netral+0.10*atas+0.06*depan", j="depan+0.5*atas", tp="bawah"),
    k(0.75),
], ragu=True, cara="Telunjuk menyentuh pelipis lalu bergerak maju ke arah lawan bicara.")

S("SENANG", "Senang", "Perasaan", [
    k(0, p="dada+0.012*depan+0.05*bawah", a="telapak", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    *bolak(0.12, 0.18, 4, {"p": "dada+0.012*depan+0.05*atas"}, {"p": "dada+0.012*depan+0.05*bawah"}),
    k(0.85),
], wajah="senang", ragu=True, cara="Telapak datar di dada diusap ke atas berulang dengan wajah ceria.")

S("TULI", "Tuli", "Orang", [
    k(0, p="telinga+0.03*depan+0.01*luar", a="telunjuk", b="1", j="atas+0.6*dalam+0.4*belakang", tp="dalam"),
    k(0.15),
    k(0.45, p="sudut_mulut+0.02*depan", b="FLAT", j="atas+0.5*dalam", tp="belakang"),
    k(0.7),
], ragu=True, cara="Telunjuk menunjuk telinga, lalu tangan datar menutup di depan mulut.")

S("DENGAR", "Dengar / orang dengar", "Orang", [
    k(0, p="telinga+0.05*luar+0.03*depan", a="telapak", b="C", j="atas", tp="dalam"),
    k(0.15),
    k(0.5, p="telinga+0.025*luar+0.02*depan"),
    k(0.8),
], ragu=True, cara="Tangan melengkung (C) di belakang telinga seperti sedang mendengarkan.")

S("BELAJAR", "Belajar", "Kelas", [
    k(0, p=A(-0.02, -0.33, 1.22), a="ujung", b="5", j="bawah+0.3*depan", tp="belakang"),
    k(0.15, b="FLAT_O"),
    k(0.55, p="pelipis+0.03*depan+0.02*atas", j="atas+0.25*belakang", tp="belakang+0.3*dalam"),
    k(0.8),
], L=[_L(L_TELAPAK_ATAS)],
  ragu=True, cara="Tangan kanan seperti mengambil sesuatu dari telapak kiri (buku) lalu dibawa ke dahi.")

S("ISYARAT", "Isyarat / berisyarat", "Kelas",
  lingkar(0, 0.9, "netral+0.08*atas", 0.04, "depan", "atas", n=8, mulai=90, putaran=2,
          a="telapak", b="1", j="atas+0.4*dalam", tp="depan+0.3*dalam") + [k(1.0)],
  L=cermin(lingkar(0, 0.9, "netral+0.08*atas", 0.04, "depan", "atas", n=8, mulai=270, putaran=2,
                   a="telapak", b="1", j="atas+0.4*dalam", tp="depan+0.3*dalam") + [k(1.0)]),
  ragu=True, cara="Dua telunjuk berputar bergantian di depan dada, seperti tangan yang sedang berisyarat.")

S("BISINDO", "BISINDO (Bahasa Isyarat Indonesia)", "Kelas", [],
  gloss="B-I-S-I-N-D-O", cara="Dieja jari: B-I-S-I-N-D-O.")

S("EJA", "Mengeja (abjad jari)", "Kelas", [
    k(0, p="eja+0.03*dalam", a="telapak", b="5", j="atas", tp="depan"),
    *bolak(0.12, 0.12, 6, {"b": "S", "p": "eja+0.01*dalam"}, {"b": "5", "p": "eja+0.03*luar"}),
    k(0.9, b="5"),
], ragu=True, cara="Tangan di posisi eja, jari membuka-menggenggam sambil bergeser ke samping seperti mengeja huruf.")

# ── Kata tanya (wajah wh: alis berkerut) ───────────────────────────────────

S("APA", "Apa", "Kata tanya", [
    k(0, p="netral+0.02*atas", a="telapak", b="5", j="depan+0.3*dalam", tp="atas"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.02*atas+0.03*luar"}, {"p": "netral+0.02*atas+0.01*dalam"}),
    k(0.8),
], wajah="wh", ragu=True, cara="Telapak terbuka menghadap atas digoyang kecil ke samping, alis berkerut.")

S("SIAPA", "Siapa", "Kata tanya", [
    k(0, p="dagu+0.03*depan", a="telunjuk", b="1", j="atas", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "dagu+0.006*depan"}, {"p": "dagu+0.03*depan"}),
    k(0.8),
], wajah="wh", ragu=True, cara="Telunjuk tegak mengetuk dagu dua kali, alis berkerut.")

S("DI_MANA", "Di mana", "Kata tanya", [
    k(0, p="netral+0.05*atas", a="telapak", b="5", j="depan+0.3*dalam", tp="atas"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.05*atas+0.05*luar"}, {"p": "netral+0.05*atas"}),
    k(0.8),
], L=cermin([
    k(0, p="netral+0.05*atas", a="telapak", b="5", j="depan+0.3*dalam", tp="atas"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.05*atas+0.05*luar"}, {"p": "netral+0.05*atas"}),
    k(0.8),
]), kepala=[(0.1, 0, 0, 0), (0.3, 0, 10, 0), (0.55, 0, -10, 0), (0.8, 0, 0, 0)],
  wajah="wh", gloss="DI-MANA", ragu=True,
  cara="Dua telapak terbuka menghadap atas digerakkan ke samping, kepala menoleh mencari, alis berkerut.")

S("KAPAN", "Kapan", "Kata tanya", [
    k(0, p=A(0.04, -0.29, 1.24), a="telunjuk", b="1", j="bawah+0.4*depan", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": A(0.04, -0.29, 1.215)}, {"p": A(0.04, -0.29, 1.24)}),
    k(0.8),
], L=[k(0, p=A(0.06, -0.27, 1.18), a="pergelangan", b="S", j="dalam+0.6*depan", tp="bawah")],
  wajah="wh", ragu=True, cara="Telunjuk kanan mengetuk pergelangan kiri (tempat jam tangan), alis berkerut.")

S("KENAPA", "Kenapa", "Kata tanya", [
    k(0, p="pelipis+0.015*depan", a="telunjuk", b="1", j="atas+0.5*dalam", tp="belakang"),
    k(0.15),
    k(0.5, p="netral+0.14*atas+0.04*luar", b="5", j="atas", tp="atas+0.4*belakang"),
    k(0.8),
], wajah="wh", ragu=True, cara="Telunjuk menyentuh pelipis lalu tangan membuka ke depan dengan telapak ke atas, alis berkerut.")

S("BAGAIMANA", "Bagaimana", "Kata tanya", [
    k(0, p="netral+0.06*atas", a="buku", b="BENT_B", j="bawah+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, j="atas+0.3*dalam", tp="atas"),
    k(0.8),
], L=cermin([
    k(0, p="netral+0.06*atas", a="buku", b="BENT_B", j="bawah+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, j="atas+0.3*dalam", tp="atas"),
    k(0.8),
]), wajah="wh", ragu=True, cara="Dua tangan menekuk berhadapan, lalu diputar membuka ke atas, alis berkerut.")

S("BERAPA", "Berapa", "Kata tanya", [
    k(0, p="netral+0.06*atas", a="telapak", b="S", j="atas+0.3*dalam", tp="atas+0.4*belakang"),
    k(0.15),
    k(0.55, b="5"),
    k(0.65), k(0.8, b="S"), k(1.0, b="5"), k(1.1),
], wajah="wh", ragu=True, cara="Kepalan menghadap atas membuka jadi lima jari (seperti menghitung) dua kali, alis berkerut.")

S("KABAR", "Kabar", "Perasaan", [
    k(0, p="dada+0.03*depan", a="ujung", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    k(0.15),
    k(0.55, p="netral+0.08*atas+0.10*depan", j="depan+0.3*atas", tp="atas"),
    k(0.8),
], L=cermin([
    k(0, p="dada+0.03*depan", a="ujung", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    k(0.15),
    k(0.55, p="netral+0.08*atas+0.10*depan", j="depan+0.3*atas", tp="atas"),
    k(0.8),
]), ragu=True, cara="Dua tangan datar dari dada membuka ke depan dengan telapak ke atas.")

# ── Perasaan & keadaan ─────────────────────────────────────────────────────

S("BAIK", "Baik / bagus", "Perasaan", [
    k(0, p="netral+0.08*atas", a="pergelangan", b="B11_JEMPOL", j="atas+0.2*depan", tp="dalam"),
    k(0.15),
    k(0.45, p="netral+0.08*atas+0.05*depan"),
    k(0.75),
], wajah="senang", cara="Kepalan dengan ibu jari tegak (jempol) didorong sedikit ke depan.")

S("SEDIH", "Sedih", "Perasaan", [
    k(0, p="mata+0.02*bawah+0.01*luar", a="telunjuk", b="1", j="atas+0.6*dalam", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.6, p="pipi+0.05*bawah"),
    k(0.85),
], wajah="sedih", ragu=True, cara="Telunjuk menelusuri pipi dari bawah mata ke bawah seperti air mata, wajah sedih.")

S("MARAH", "Marah", "Perasaan", [
    k(0, p="dada+0.03*depan+0.03*bawah", a="ujung", b="CLAW", j="atas+0.4*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="leher+0.06*depan"),
    k(0.8),
], wajah="sedih", ragu=True, cara="Tangan cakar di dada naik ke arah leher dengan wajah tegang/marah.")

_CAPEK = [
    k(0, p="dada_kanan+0.015*depan", a="telapak", b="FLAT", j="atas", tp="belakang"),
    k(0.15),
    k(0.6, p="dada_kanan+0.07*depan+0.17*bawah+0.03*luar", j="bawah+0.3*depan", tp="belakang"),
    k(0.85),
]
S("CAPEK", "Capek / lelah", "Perasaan", _CAPEK, L=cermin(_CAPEK),
  kepala=[(0.2, 0, 0, 0), (0.7, 8, 0, 6)], wajah="sedih", ragu=True,
  cara="Dua telapak menempel di dada, lalu jatuh lemas ke bawah dengan bahu & kepala turun, wajah lelah.")

S("SAKIT", "Sakit", "Perasaan", [
    k(0, p="dahi+0.03*depan", a="telapak", b="FLAT", j="dalam", tp="belakang"),
    k(0.15),
    *bolak(0.3, 0.15, 3, {"p": "dahi+0.012*depan"}, {"p": "dahi+0.03*depan"}),
    k(0.85),
], kepala=[(0.2, 0, 0, 0), (0.6, 6, 0, -5)], wajah="sedih", ragu=True,
  cara="Telapak ditempelkan ke dahi seperti memeriksa demam, wajah meringis.")

S("LAPAR", "Lapar", "Perasaan",
  lingkar(0, 0.85, "perut+0.015*depan", 0.04, "luar", "atas", n=8, mulai=90,
          a="telapak", b="FLAT", j="dalam", tp="belakang") + [k(1.0)],
  ragu=True, cara="Telapak diusap memutar di perut.")

# ── Strategi komunikasi ────────────────────────────────────────────────────

S("ULANG", "Ulang / ulangi", "Kelas",
  lingkar(0, 0.8, "netral+0.08*atas", 0.035, "depan", "atas", n=8, mulai=90, putaran=2,
          a="telunjuk", b="1", j="dalam+0.6*depan", tp="bawah") + [k(0.95)],
  ragu=True, cara="Telunjuk mendatar diputar dua kali di depan badan.")

S("PELAN", "Pelan-pelan", "Kelas", [
    k(0, p="netral+0.12*atas", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.85, p="netral+0.01*atas"),
    k(1.0),
], L=cermin([
    k(0, p="netral+0.12*atas", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.85, p="netral+0.01*atas"),
    k(1.0),
]), ragu=True, cara="Dua telapak menghadap bawah diturunkan perlahan.")

S("PAHAM", "Paham / mengerti", "Kelas", [
    k(0, p="pelipis+0.03*depan", a="telunjuk", b="1", j="atas+0.5*dalam", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "pelipis+0.008*depan"}, {"p": "pelipis+0.03*depan"}),
    k(0.8),
], kepala=ANGGUK, ragu=True, cara="Telunjuk mengetuk pelipis sambil mengangguk.")

S("TIDAK_PAHAM", "Tidak paham", "Kelas", [
    k(0, p="pelipis+0.012*depan", a="telunjuk", b="1", j="atas+0.5*dalam", tp="belakang"),
    k(0.15),
    k(0.35, p="netral+0.12*atas+0.04*luar", j="atas", tp="depan"),
    *bolak(0.45, 0.13, 4, {"j": "atas+0.45*luar"}, {"j": "atas+0.45*dalam"}),
    k(1.0, j="atas"),
], kepala=GELENG, wajah="sedih", gloss="TIDAK-PAHAM", ragu=True,
  cara="Telunjuk di pelipis, lalu telunjuk tegak digoyang (TIDAK) sambil menggeleng.")

S("TAHU", "Tahu", "Kelas", [
    k(0, p="pelipis+0.03*depan+0.02*atas", a="ujung", b="FLAT", j="atas+0.5*dalam", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "pelipis+0.008*depan+0.02*atas"}, {"p": "pelipis+0.03*depan+0.02*atas"}),
    k(0.8),
], kepala=[(0.3, 8, 0, 0), (0.7, 0, 0, 0)], ragu=True, cara="Ujung jari tangan datar mengetuk sisi dahi (pelipis).")

S("TIDAK_TAHU", "Tidak tahu", "Kelas", [
    k(0, p="dahi+0.012*depan+0.03*luar", a="ujung", b="FLAT", j="atas+0.5*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="netral+0.14*atas+0.12*luar+0.06*depan", b="5", j="atas+0.5*luar", tp="depan+0.4*atas"),
    k(0.85),
], kepala=GELENG, wajah="sedih", gloss="TIDAK-TAHU", ragu=True,
  cara="Ujung jari di dahi lalu tangan dikibaskan terbuka ke samping-depan sambil menggeleng.")

S("TULIS", "Tulis / menulis", "Kelas", [
    k(0, p=A(0.0, -0.33, 1.20), a="ujung", b="B11_PENA", j="bawah+0.5*depan+0.3*dalam", tp="dalam+0.5*bawah"),
    *bolak(0.12, 0.14, 5, {"p": A(0.035, -0.35, 1.20)}, {"p": A(0.0, -0.32, 1.20)}),
    k(0.85),
], L=[_L(L_TELAPAK_ATAS, p=A(0.04, -0.33, 1.17))],
  cara="Tangan kanan seperti memegang pena, digerakkan menulis di atas telapak kiri.")

S("LIHAT", "Lihat", "Kelas", [
    k(0, p="mata+0.04*depan+0.02*bawah", a="buku", b="V", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="netral+0.16*atas+0.14*depan", j="depan", tp="bawah"),
    k(0.8),
], ragu=True, cara="Jari V di depan mata lalu diarahkan maju ke benda/orang yang dilihat.")

S("HP", "HP / telepon genggam", "Benda", [
    k(0, p=A(-0.04, -0.33, 1.25), a="telapak", b="C", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    *bolak(0.25, 0.12, 5, {"b": "C"}, {"b": "B11_JEMPOL"}),
    k(0.9, b="C"),
], ragu=True, cara="Tangan seperti menggenggam HP di depan dada, ibu jari bergerak seperti mengetik.")

# ── Keluarga & teman ───────────────────────────────────────────────────────

S("AYAH", "Ayah / bapak", "Keluarga", [
    k(0, p="mulut+0.02*atas+0.02*depan+0.03*dalam", a="jari_telunjuk", b="1", j="dalam", tp="belakang"),
    k(0.15),
    k(0.5, p="mulut+0.02*atas+0.02*depan+0.04*luar"),
    k(0.75),
], ragu=True, cara="Telunjuk mendatar diusap di atas bibir seperti kumis (variasi daerah banyak).")

S("IBU", "Ibu", "Keluarga", [
    k(0, p="pipi+0.03*depan", a="telunjuk", b="1", j="atas+0.5*dalam", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "pipi+0.008*depan"}, {"p": "pipi+0.03*depan"}),
    k(0.8),
], ragu=True, cara="Telunjuk menyentuh pipi dua kali (variasi daerah banyak).")

S("KAKAK", "Kakak", "Keluarga", [
    k(0, p="netral+0.04*atas+0.04*luar", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.55, p="netral+0.22*atas+0.04*luar"),
    k(0.8),
], ragu=True, cara="Telapak datar menghadap bawah diangkat ke atas — lebih tinggi/lebih tua.")

S("ADIK", "Adik", "Keluarga", [
    k(0, p="netral+0.08*atas+0.04*luar", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.55, p="netral+0.10*bawah+0.04*luar"),
    k(0.8),
], ragu=True, cara="Telapak datar menghadap bawah diturunkan — lebih rendah/lebih muda.")

S("ANAK", "Anak", "Keluarga", [
    k(0, p="netral+0.06*bawah+0.08*luar", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.09*bawah+0.08*luar"}, {"p": "netral+0.06*bawah+0.08*luar"}),
    k(0.8),
], ragu=True, cara="Telapak datar menghadap bawah di ketinggian rendah, ditepuk pelan seperti mengusap kepala anak kecil.")

S("KELUARGA", "Keluarga", "Keluarga", [
    k(0, p=A(-0.035, -0.33, 1.27), a="telapak", b="5", j="atas", tp="depan"),
    k(0.15),
    k(0.45, p=A(-0.14, -0.40, 1.27), tp="depan+0.7*luar"),
    k(0.8, p=A(-0.03, -0.46, 1.27), b="CLAW", tp="belakang+0.3*dalam"),
    k(0.95),
], L=cermin([
    k(0, p=A(-0.035, -0.33, 1.27), a="telapak", b="5", j="atas", tp="depan"),
    k(0.15),
    k(0.45, p=A(-0.14, -0.40, 1.27), tp="depan+0.7*luar"),
    k(0.8, p=A(-0.03, -0.46, 1.27), b="CLAW", tp="belakang+0.3*dalam"),
    k(0.95),
]), ragu=True, cara="Dua tangan terbuka bergerak melingkar dari depan dada lalu bertemu, seperti merangkul satu kelompok.")

S("TEMAN", "Teman", "Keluarga", [
    k(0, p=A(-0.03, -0.34, 1.27), a="telapak", b="1", j="atas+0.2*depan", tp="depan+0.6*dalam"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.012, -0.34, 1.27)}, {"p": A(-0.03, -0.34, 1.27)}),
    k(0.8),
], L=[k(0, p=A(0.012, -0.34, 1.27), a="telapak", b="1", j="atas+0.2*depan", tp="depan+0.6*dalam")],
  ragu=True, cara="Dua telunjuk tegak berdampingan, telunjuk kanan merapat ke telunjuk kiri dua kali — selalu bersama.")

S("SAYANG", "Sayang", "Perasaan", [
    k(0, p="netral+0.10*atas", a="telapak", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="dada_kiri+0.02*depan", j="dalam+0.4*atas"),
    k(0.85),
], L=[k(0, p="netral_kiri+0.10*atas", a="telapak", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
      k(0.15), k(0.55, p="dada_kanan+0.06*depan+0.03*bawah", j="dalam+0.4*atas"), k(0.85)],
  wajah="senang", ragu=True, cara="Dua telapak bersilang memeluk dada dengan wajah lembut.")

S("GURU", "Guru", "Orang", [
    k(0, p="dahi+0.04*depan+0.03*luar", a="ujung", b="FLAT_O", j="atas+0.4*dalam", tp="belakang"),
    k(0.15),
    k(0.5, p="netral+0.14*atas+0.12*depan", b="5", j="depan+0.4*atas", tp="bawah+0.3*depan"),
    k(0.8),
], ragu=True, cara="Jari kuncup di dahi lalu membuka ke depan, seperti memberikan ilmu ke orang lain.")

S("MURID", "Murid / siswa", "Orang", [
    k(0, p="netral+0.16*atas+0.12*depan", a="ujung", b="5", j="belakang+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.55, p="pelipis+0.03*depan+0.02*atas", b="FLAT_O", j="atas+0.3*belakang", tp="belakang"),
    k(0.85),
], ragu=True, cara="Tangan terbuka di depan kuncup sambil dibawa ke sisi dahi, seperti menerima ilmu.")
