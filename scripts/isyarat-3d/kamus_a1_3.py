# [isyarat-asl-a1a2-v1] Kamus isyarat ASL A1.3 "Telling Stories — Bercerita Sederhana".
# Bentuk sitasi, tangan dominan kanan. Classifier (CL_1, CL_3, CL_B, CL_C) dibuat sebagai
# klip contoh gerak yang khas — di kelas, gerak classifier berubah mengikuti cerita.
# ⚠️ Ditulis dari kamus umum (Lifeprint/HandSpeak) — perlu dicek pengajar Tuli.

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # H bengkok (CHAIR): telunjuk & tengah rapat, ditekuk
    "A13_H_TEKUK": (I._jari(_G, index=(35, 70, 40, -3), middle=(35, 70, 40, 2)), "depan_genggam_manis"),
})

def dua(keys):
    """Kunci simetris dua tangan → (R, L)."""
    return keys, cermin(keys)

# ── Penanda waktu ──────────────────────────────────────────────────────────

_r, _l = dua([
    k(0, p="netral+0.06*atas+0.07*luar+0.04*belakang", a="telapak", b="5", j="atas+0.2*depan", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.45, p="netral+0.03*atas+0.13*luar+0.03*depan", j="luar+0.6*depan+0.3*atas", tp="bawah+0.6*depan"),
    k(0.65),
])
S("FINISH", "Sudah / selesai", "Waktu", _r, L=_l,
  cara="Dua tangan terbuka (5) telapak ke arah badan, dikibaskan ke luar sampai telapak menghadap bawah.")

S("WILL", "Akan", "Waktu", [
    k(0, p="pipi+0.05*luar+0.02*depan", a="telapak", b="FLAT", j="atas", tp="dalam"),
    k(0.15),
    k(0.55, p="pipi+0.06*luar+0.20*depan", j="atas+0.6*depan"),
    k(0.75),
], cara="Tangan datar di samping pipi, telapak ke dalam, didorong maju ke depan (masa depan).")

S("BEFORE", "Sebelum", "Waktu", [
    k(0, p=A(0.0, -0.375, 1.25), a="punggung", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    k(0.15),
    k(0.55, p=A(-0.01, -0.25, 1.25)),
    k(0.75),
], L=[k(0, p=A(0.03, -0.40, 1.25), a="telapak", b="FLAT", j="dalam+0.3*atas", tp="belakang")],
  cara="Tangan kiri datar menghadap badan; punggung tangan kanan menempel di telapak kiri lalu ditarik mundur ke arah badan.")

S("AFTER", "Sesudah", "Waktu", [
    k(0, p=A(0.0, -0.355, 1.25), a="telapak", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    k(0.15),
    k(0.55, p=A(-0.02, -0.48, 1.24)),
    k(0.75),
], L=[k(0, p=A(0.03, -0.32, 1.25), a="punggung", b="FLAT", j="dalam+0.3*atas", tp="belakang")],
  cara="Tangan kiri datar menghadap badan; telapak kanan menempel di punggung tangan kiri lalu bergerak maju menjauh.")

# ── Classifier (klip contoh) ────────────────────────────────────────────────

S("CL_1", "Classifier 1: orang (contoh: orang berjalan mendekat)", "Classifier", [
    k(0, p="netral+0.12*depan+0.08*atas+0.04*luar", a="telapak", b="1", j="atas", tp="belakang"),
    k(0.15),
    *[k(0.15 + 0.2 * (i + 1), p=f"netral+{0.12 - 0.035 * (i + 1):.3f}*depan+{0.08 - (0.012 if i % 2 == 0 else 0):.3f}*atas+0.04*luar")
      for i in range(4)],
    k(1.15),
], cara="Telunjuk tegak (1) = satu orang; contoh: bergerak dari depan mendekat ke badan seperti orang berjalan menghampiri.")

S("CL_3", "Classifier 3: kendaraan (contoh: mobil melaju maju)", "Classifier", [
    k(0, p="netral+0.04*belakang+0.06*luar+0.03*bawah", a="telapak", b="3", j="depan", tp="dalam"),
    k(0.15),
    k(0.55, p="netral+0.10*depan+0.03*luar+0.03*bawah", kurva=True),
    k(0.95, p="netral+0.20*depan+0.02*dalam+0.03*bawah", kurva=True),
    k(1.1),
], cara="Bentuk 3 menyamping (ibu jari di atas, jari menunjuk ke depan) = kendaraan; contoh: mobil melaju maju menjauh.")

S("CL_B", "Classifier B: benda datar (contoh: meja/kertas di atas)", "Classifier", [
    k(0, p="netral+0.10*atas+0.02*luar", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.45, p="netral+0.02*bawah+0.02*luar"),
    k(0.6),
    k(1.0, p="netral+0.02*bawah+0.12*luar"),
    k(1.15),
], cara="Tangan datar menghadap bawah = permukaan datar; contoh: diletakkan lalu digeser ke samping menunjukkan luas meja.")

S("CL_C", "Classifier C: benda bulat/silinder (contoh: gelas diletakkan)", "Classifier", [
    k(0, p=A(0.0, -0.36, 1.27), a="sisi_kelingking", b="C", j="depan+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p=A(0.025, -0.33, 1.172)),
    k(0.85),
], L=[k(0, p=A(0.04, -0.32, 1.15), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  cara="Tangan C = benda bulat (gelas, botol, pipa); contoh: gelas diletakkan di atas telapak kiri (meja).")

# ── Kata kerja berarah ─────────────────────────────────────────────────────

_r, _l = dua([
    k(0, p="dada+0.07*depan+0.06*luar+0.03*bawah", a="ujung", b="FLAT_O", j="depan+0.5*atas", tp="dalam+0.4*atas"),
    k(0.15),
    k(0.55, p="dada+0.25*depan+0.06*luar+0.03*bawah", j="depan+0.2*atas"),
    k(0.75),
])
S("GIVE", "Memberi", "Kata kerja berarah", _r, L=_l,
  cara="Dua tangan O-pipih bergerak dari badan maju ke arah penerima (arah gerak = siapa memberi kepada siapa).")

S("ASK", "Bertanya", "Kata kerja berarah", [
    k(0, p="dada+0.10*atas+0.08*depan+0.02*luar", a="telunjuk", b="1", j="atas", tp="depan"),
    k(0.15),
    k(0.55, p="dada+0.04*atas+0.24*depan+0.02*luar", b="X", j="depan+0.6*atas", tp="bawah+0.5*depan"),
    k(0.75),
], cara="Telunjuk tegak di depan dada bergerak maju ke arah orang yang ditanya sambil menekuk (X).")

# ── Rumah ─────────────────────────────────────────────────────────────────

S("ROOM", "Ruangan / kamar", "Rumah", [
    k(0, p="netral+0.09*luar", a="telapak", b="FLAT", j="depan+0.3*atas", tp="dalam"),
    k(0.2),
    k(0.6, p="netral+0.06*depan+0.02*dalam", j="dalam+0.3*atas", tp="belakang"),
    k(0.8),
], L=[k(0, p="netral_kiri+0.09*luar", a="telapak", b="FLAT", j="depan+0.3*atas", tp="dalam"),
      k(0.2),
      k(0.6, p="netral_kiri+0.08*belakang+0.02*dalam", j="dalam+0.3*atas", tp="depan"),
      k(0.8)],
  cara="Dua tangan datar saling berhadapan kiri-kanan, lalu berpindah berhadapan depan-belakang — membentuk empat dinding.")

S("KITCHEN", "Dapur", "Rumah", [
    k(0, p=A(0.03, -0.32, 1.19), a="punggung", b="K", j="dalam+0.6*depan", tp="bawah"),
    k(0.15),
    k(0.4, p=A(0.03, -0.32, 1.22), tp="atas+0.3*dalam"),
    k(0.6, p=A(0.03, -0.32, 1.172), tp="atas"),
    k(0.8),
], L=[k(0, p=A(0.04, -0.31, 1.15), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  cara="Bentuk K di atas telapak kiri dibalik seperti membalik masakan (inisial K + gerak COOK).")

S("BED", "Tempat tidur / kasur", "Rumah", [
    k(0, p="pipi+0.06*luar+0.04*depan", a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam+0.3*belakang"),
    k(0.2, p="pipi+0.015*luar"),
    k(0.9),
], kepala=[(0.1, 0, 0, 0), (0.5, 4, 0, -12), (0.9, 4, 0, -12)], wajah="tidur",
  cara="Telapak tangan datar ditempelkan ke pipi, kepala dimiringkan seperti berbaring di bantal.")

S("BATHROOM", "Kamar mandi", "Rumah", [
    k(0, p="netral+0.06*atas", a="pergelangan", b="T", j="atas", tp="depan"),
    *bolak(0.14, 0.14, 5, {"putar": -25, "p": "netral+0.06*atas+0.015*dalam"}, {"putar": 25, "p": "netral+0.06*atas+0.015*luar"}),
    k(0.85, putar=0, p="netral+0.06*atas"),
], cara="Bentuk T digoyang ke kiri-kanan — sama dengan TOILET.")

S("TABLE", "Meja", "Rumah", [
    k(0, p=A(0.03, -0.35, 1.215), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.03, -0.35, 1.19)}, {"p": A(0.03, -0.35, 1.215)}),
    k(0.7, p=A(0.03, -0.35, 1.19)),
], L=[k(0, p=A(-0.03, -0.30, 1.16), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="bawah")],
  cara="Dua lengan bawah mendatar bertumpuk, telapak ke bawah; lengan kanan menepuk lengan kiri dua kali (permukaan meja).")

S("CHAIR", "Kursi", "Rumah", [
    k(0, p=A(0.0, -0.33, 1.235), a="jari_tengah", b="A13_H_TEKUK", j="dalam+depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.0, -0.33, 1.212)}, {"p": A(0.0, -0.33, 1.24)}),
    k(0.7, p=A(0.0, -0.33, 1.212)),
], L=[k(0, p=A(0.0, -0.33, 1.19), a="jari_telunjuk", b="H", j="dalam+depan", tp="bawah")],
  cara="Dua jari kanan yang ditekuk (seperti kaki) mengetuk dua jari kiri (H) dua kali — 'duduk' di kursi.")

S("DOOR", "Pintu", "Rumah", [
    k(0, p=A(-0.03, -0.37, 1.27), a="sisi_telunjuk", b="FLAT", j="atas", tp="depan"),
    *bolak(0.2, 0.2, 4, {"p": A(-0.06, -0.33, 1.27), "tp": "dalam+0.3*depan", "a": "sisi_telunjuk"},
           {"p": A(-0.03, -0.37, 1.27), "tp": "depan"}),
    k(0.95),
], L=[k(0, p=A(0.03, -0.37, 1.27), a="sisi_telunjuk", b="FLAT", j="atas", tp="depan")],
  cara="Dua tangan datar berdampingan menghadap depan (daun pintu); tangan kanan berayun membuka-menutup dua kali.")

# ── Transportasi ──────────────────────────────────────────────────────────

S("CAR", "Mobil", "Transportasi", [
    k(0, p="netral+0.10*luar+0.03*atas", a="telapak", b="S", j="atas+0.3*depan", tp="dalam"),
    *bolak(0.15, 0.2, 4, {"p": "netral+0.10*luar+0.07*atas"}, {"p": "netral+0.10*luar"}),
    k(0.95),
], L=[k(0, p="netral_kiri+0.10*luar+0.03*atas", a="telapak", b="S", j="atas+0.3*depan", tp="dalam"),
      *bolak(0.15, 0.2, 4, {"p": "netral_kiri+0.10*luar"}, {"p": "netral_kiri+0.10*luar+0.07*atas"}),
      k(0.95)],
  cara="Dua kepalan seperti memegang setir, digerakkan naik-turun bergantian.")

_r, _l = dua([
    k(0, p="netral+0.10*luar+0.03*atas+0.05*belakang", a="telapak", b="S", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.75, p="netral+0.10*luar+0.03*atas+0.12*depan"),
    k(0.9),
])
S("DRIVE", "Menyetir / mengemudi", "Transportasi", _r, L=_l,
  cara="Dua kepalan memegang setir lalu didorong maju ke depan (berbeda dengan CAR yang naik-turun di tempat).")

S("BUS", "Bus", "Transportasi", [
    k(0, p=A(-0.01, -0.33, 1.27), a="sisi_kelingking", b="B", j="atas+0.2*depan", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.03, -0.23, 1.27)),
    k(0.8),
], L=[k(0, p=A(0.01, -0.40, 1.27), a="sisi_telunjuk", b="B", j="atas+0.2*depan", tp="dalam")],
  cara="Dua tangan B berderet depan-belakang (badan bus); tangan kanan di belakang ditarik mundur ke arah badan.")

S("TRAIN", "Kereta api", "Transportasi", [
    k(0, p=A(0.02, -0.34, 1.215), a="jari_tengah", b="H", j="dalam+depan", tp="bawah"),
    *bolak(0.15, 0.17, 4, {"p": A(0.06, -0.38, 1.215)}, {"p": A(0.0, -0.32, 1.215)}),
    k(0.85),
], L=[k(0, p=A(0.03, -0.34, 1.19), a="jari_telunjuk", b="H", j="dalam+depan", tp="bawah")],
  cara="Dua jari kanan (H) digosok maju-mundur di atas dua jari kiri (H) — seperti roda di atas rel.")

S("PLANE", "Pesawat", "Transportasi", [
    k(0, p="netral+0.10*atas+0.04*luar", a="telapak", b="ILY", j="depan", tp="bawah"),
    k(0.1),
    k(0.4, p="netral+0.15*atas+0.14*depan+0.02*luar"),
    k(0.5, p="netral+0.10*atas+0.04*luar"),
    k(0.8, p="netral+0.15*atas+0.14*depan+0.02*luar"),
    k(0.95),
], cara="Bentuk ILY (ibu jari, telunjuk, kelingking terbuka) menghadap bawah, didorong maju-naik dua kali seperti pesawat lepas landas.")

S("BICYCLE", "Sepeda", "Transportasi",
  lingkar(0, 1.0, "netral+0.08*luar+0.06*bawah", 0.045, "depan", "atas", n=10, mulai=90, putaran=2,
          a="telapak", b="S", j="depan", tp="bawah") + [k(1.1)],
  L=cermin(lingkar(0, 1.0, "netral+0.08*luar+0.06*bawah", 0.045, "depan", "atas", n=10, mulai=270, putaran=2,
                   a="telapak", b="S", j="depan", tp="bawah") + [k(1.1)]),
  cara="Dua kepalan menghadap bawah berputar maju bergantian seperti mengayuh pedal.")

# ── Kesehatan & tubuh ──────────────────────────────────────────────────────

S("HEAD", "Kepala", "Tubuh", [
    k(0, p="pelipis+0.03*depan+0.02*luar", a="ujung", b="BENT_B", j="atas+0.4*belakang", tp="dalam"),
    k(0.15, p="pelipis+0.008*luar"),
    k(0.3),
    k(0.6, p="rahang+0.012*luar", j="atas+0.2*belakang"),
    k(0.8),
], cara="Ujung jari tangan tertekuk menyentuh sisi kepala dekat pelipis, lalu dekat rahang.")

S("STOMACH", "Perut", "Tubuh", [
    k(0, p="perut+0.04*depan", a="telapak", b="FLAT", j="dalam+0.2*bawah", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "perut+0.01*depan"}, {"p": "perut+0.04*depan"}),
    k(0.7, p="perut+0.01*depan"),
], cara="Telapak tangan datar menepuk perut dua kali.")

_r, _l = dua([
    k(0, p="tengah+0.03*atas+0.025*luar", a="telunjuk", b="1", j="dalam+0.2*depan", tp="belakang"),
    *bolak(0.15, 0.17, 4, {"putar": 35}, {"putar": -25}),
    k(0.85, putar=0),
])
S("HURT", "Sakit / nyeri", "Kesehatan", _r, L=[dict(kk, putar=-kk["putar"]) if "putar" in kk else kk for kk in _l],
  kepala=[(0.1, 0, 0, 0), (0.4, 4, 0, 4)], wajah="sedih",
  cara="Dua telunjuk saling menunjuk dan diputar berlawanan arah; dibuat di dekat bagian tubuh yang sakit (mis. kepala, perut).")

S("MEDICINE", "Obat", "Kesehatan", [
    k(0, p=A(0.04, -0.31, 1.172), a="tengah", b="OPEN_8", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.15, 0.15, 5, {"putar": 25}, {"putar": -25}),
    k(0.85, putar=0),
], L=[k(0, p=A(0.04, -0.31, 1.15), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  cara="Ujung jari tengah kanan di telapak kiri, diputar kecil bolak-balik seperti menggerus obat.")

# ── Perbandingan & pilihan ─────────────────────────────────────────────────

S("BETTER", "Lebih baik", "Perbandingan", [
    k(0, p="dagu+0.012*bawah", a="ujung", b="FLAT", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="pipi+0.13*luar+0.12*depan+0.10*bawah", a="pergelangan", b="10", j="depan+0.3*atas", tp="dalam"),
    k(0.75),
], cara="Ujung jari tangan datar di dagu, lalu bergerak naik ke samping sambil menjadi kepalan ibu jari tegak.")

S("PREFER", "Lebih suka / memilih", "Perbandingan", [
    k(0, p="dagu+0.01*bawah", a="telapak", b="FLAT", j="atas+0.4*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="dagu+0.17*depan+0.16*bawah+0.03*luar", a="pergelangan", b="10", j="depan+0.4*atas", tp="dalam"),
    k(0.75),
], wajah="senang",
  cara="Telapak tangan datar menyentuh dagu, lalu bergerak maju sambil menjadi kepalan ibu jari tegak.")

_r, _l = dua([
    k(0, p="netral+0.12*luar+0.05*atas", a="telapak", b="V", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="netral+0.06*dalam+0.05*atas+0.02*depan"),
    k(0.75),
])
_l = [dict(kk, p="netral_kiri+0.12*luar+0.05*atas+0.03*depan") if i == 0 else
      (dict(kk, p="netral_kiri+0.06*dalam+0.05*atas+0.05*depan") if "p" in kk else kk) for i, kk in enumerate(_l)]
S("WORSE", "Lebih buruk", "Perbandingan", _r, L=_l, wajah="sedih",
  cara="Dua tangan V telapak ke badan bergerak menyilang saling melewati di depan dada.")

# ── Cerita, budaya, komunitas ──────────────────────────────────────────────

S("STORY", "Cerita", "Budaya", [
    k(0, p=A(-0.012, -0.36, 1.25), a="jempol", b="F", j="depan+0.3*atas", tp="dalam"),
    *bolak(0.15, 0.2, 4, {"p": A(-0.10, -0.36, 1.25)}, {"p": A(-0.012, -0.36, 1.25)}),
    k(0.95, p=A(-0.10, -0.36, 1.25)),
], L=[k(0, p=A(0.012, -0.36, 1.25), a="jempol", b="F", j="depan+0.3*atas", tp="dalam"),
      *bolak(0.15, 0.2, 4, {"p": A(0.10, -0.36, 1.25)}, {"p": A(0.012, -0.36, 1.25)}),
      k(0.95, p=A(0.10, -0.36, 1.25))],
  cara="Dua tangan F (ibu jari & telunjuk membentuk cincin) bertaut lalu ditarik berpisah, berulang — seperti menyambung kalimat.")

S("POEM", "Puisi", "Budaya", [
    k(0, p=A(-0.02, -0.33, 1.26), a="telapak", b="P", j="depan+0.6*bawah", tp="dalam+0.5*belakang"),
    *bolak(0.15, 0.2, 4, {"p": A(0.06, -0.31, 1.27)}, {"p": A(-0.02, -0.33, 1.26)}),
    k(0.95),
], L=[k(0, p=A(0.10, -0.26, 1.22), a="telapak", b="FLAT", j="dalam+0.4*depan+0.3*atas", tp="belakang")],
  cara="Tangan P diayun bolak-balik di depan lengan bawah kiri (gerak isyarat MUSIC dengan inisial P).")

S("CULTURE", "Budaya", "Budaya",
  lingkar(0.1, 0.9, A(0.03, -0.34, 1.27), 0.045, "depan", "luar", n=8, mulai=0,
          a="telapak", b="C", j="atas+0.2*depan", tp="dalam") + [k(1.05)],
  L=[k(0, p=A(0.03, -0.34, 1.22), a="telunjuk", b="1", j="atas", tp="dalam")],
  cara="Tangan C mengelilingi telunjuk kiri yang tegak satu putaran.")

_r, _l = dua([
    k(0, p=A(-0.035, -0.33, 1.25), a="telapak", b="C", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.45, p=A(-0.15, -0.40, 1.25), tp="depan+0.7*luar"),
    k(0.8, p=A(-0.035, -0.46, 1.25), tp="belakang+0.3*dalam"),
    k(0.95),
])
S("COMMUNITY", "Komunitas", "Budaya", _r, L=_l,
  cara="Dua tangan C berhadapan, berputar keluar membentuk lingkaran sampai bertemu lagi di depan (gerak CLASS/FAMILY dengan inisial C).")

_r, _l = dua([
    k(0, p=A(-0.03, -0.34, 1.24), a="tengah", b="P", j="depan+0.6*bawah", tp="dalam+0.3*bawah"),
    k(0.15),
    k(0.45, p=A(-0.13, -0.29, 1.24)),
    k(0.8, p=A(-0.03, -0.24, 1.24)),
    k(0.95),
])
S("PLACE", "Tempat", "Budaya", _r, L=_l,
  cara="Dua tangan P, ujung jari tengah bersentuhan di depan, bergerak melingkar ke arah badan lalu bersentuhan lagi.")

# ── Teknologi ─────────────────────────────────────────────────────────────

_r, _l = dua([
    k(0, p="netral+0.04*luar+0.06*bawah", a="telapak", b="10", j="depan+0.3*dalam", tp="dalam+0.4*atas"),
])
S("TEXT", "Kirim pesan / SMS", "Teknologi",
  _r + bolak(0.12, 0.15, 6, {"b": "A"}, {"b": "10"}) + [k(1.0)],
  L=_l + bolak(0.12, 0.15, 6, {"b": "10"}, {"b": "A"}) + [k(1.0)],
  cara="Dua tangan seperti memegang ponsel; kedua ibu jari menekan bergantian seperti mengetik pesan.")

S("VIDEOPHONE", "Videophone (VP)", "Teknologi", [
    k(0, p="eja", a="telapak", b="V", j="atas", tp="depan"),
    k(0.3),
    k(0.5, b="P", j="depan+0.9*bawah", tp="dalam+0.5*belakang"),
    k(0.8),
], gloss="VP",
  cara="Dieja leksikal V-P: huruf V lalu langsung P dalam satu gerak — sebutan umum untuk videophone/panggilan video.")

S("PHONE", "Telepon / ponsel", "Teknologi", [
    k(0, p="pipi+0.05*luar+0.06*depan", a="telapak", b="Y", j="depan+0.2*atas", tp="dalam"),
    k(0.2, p="pipi+0.02*luar+0.02*depan"),
    k(0.8),
], cara="Bentuk Y diletakkan di samping wajah: ibu jari dekat telinga, kelingking dekat mulut.")

S("COMPUTER", "Komputer", "Teknologi", [
    k(0, p=A(0.07, -0.30, 1.185), a="sisi_kelingking", b="C", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.35, p=A(0.10, -0.27, 1.20)),
    k(0.5, p=A(0.12, -0.24, 1.185)),
    k(0.7, p=A(0.14, -0.21, 1.20)),
    k(0.85),
], L=[k(0, p=A(0.04, -0.33, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah")],
  cara="Tangan C bergerak melengkung naik menyusuri lengan bawah kiri (telapak kiri menghadap bawah).")
