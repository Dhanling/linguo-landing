# [isyarat-bisindo-a1a2-v1] Kamus isyarat BISINDO A2.2 "Di Kota & Perjalanan".
# Tangan dominan kanan (R), tangan pasif kiri (L). Format sama dengan kamus_bisindo.py.
# ⚠️ Sebagian besar isyarat di sini ditulis dari bentuk ikonik yang umum (menggambar benda/
# gerak) — rujukan teks BISINDO per kata tidak ditemukan, jadi hampir semua ragu=True dan
# WAJIB dicek pengajar Tuli. Nama kota (Bandung, Surabaya, Medan) & singkatan (ATM, BANK,
# HOTEL) dibuat sebagai ejaan jari karena isyarat lokalnya bervariasi antardaerah.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # B22_JEPIT: ibu jari & telunjuk menjepit (kartu/tiket), jari lain menggenggam
    "B22_JEPIT": (I._jari(_G, index=(40, 50, 30)), ("ujung", "index")),
})

# Posisi tangan kiri yang sering dipakai
L_ATAS = dict(p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
L_TEGAK = dict(p=A(0.03, -0.33, 1.22), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")
L_KEPAL = dict(p=A(0.04, -0.31, 1.17), a="punggung", b="S", j="dalam+0.5*depan", tp="bawah")

def _L(d, t=0, **lain):
    x = dict(d); x.update(lain); return k(t, **x)

def _sim(keys):
    """Kunci kanan + cerminannya untuk tangan kiri (isyarat simetris)."""
    return dict(R=keys, L=cermin(keys))

def _eja(kode, arti, kat, kata, cara_tambah=""):
    S(kode, arti, kat, [], cara=f"Dieja jari: {'-'.join(kata)}." + (" " + cara_tambah if cara_tambah else ""))

GELENG = [(0.1, 0, 0, 0), (0.3, 0, 14, 0), (0.5, 0, -14, 0), (0.7, 0, 10, 0), (0.85, 0, 0, 0)]

# ── Arah & jalan ───────────────────────────────────────────────────────────

S("PEREMPATAN", "Perempatan", "Arah", [
    k(0, p=A(-0.05, -0.36, 1.27), a="jari_telunjuk", b="1", j="depan", tp="bawah"),
    k(0.15),
    k(0.45, p=A(-0.01, -0.36, 1.235)),
    k(0.7),
], L=[k(0, p=A(0.06, -0.38, 1.22), a="jari_telunjuk", b="1", j="dalam", tp="bawah")],
  ragu=True, cara="Telunjuk kiri mendatar menyamping, telunjuk kanan mendatar ke depan turun menyilang di atasnya — dua jalan bersilang (+).")

S("LAMPU_MERAH", "Lampu merah (lalu lintas)", "Arah", [
    k(0, p="mulut+0.02*depan", a="telunjuk", b="1", j="atas+0.4*dalam", tp="belakang"),
    k(0.12, p="mulut+0.01*depan+0.02*bawah"),
    k(0.4, p="netral+0.34*atas+0.08*luar+0.06*depan", a="ujung", b="FLAT_O", j="bawah", tp="belakang"),
    k(0.6, b="5"),
    k(0.75, b="FLAT_O"),
    k(0.9, b="5"),
    k(1.05),
], ragu=True, cara="Telunjuk mengusap bibir (MERAH), lalu tangan kuncup di atas kepala membuka-tutup seperti lampu menyala.")

S("SEBERANG", "Seberang (jalan)", "Arah", [
    k(0, p=A(-0.02, -0.28, 1.20), a="ujung", b="BENT_V", j="bawah+0.4*depan", tp="belakang"),
    k(0.12),
    k(0.4, p=A(0.0, -0.38, 1.26)),
    k(0.65, p=A(0.0, -0.46, 1.20)),
    k(0.8),
], L=[_L(L_ATAS, p=A(0.04, -0.37, 1.16), j="dalam", tp="bawah")],
  ragu=True, cara="Tangan kiri mendatar sebagai jalan; dua jari kanan (orang berjalan) melompat melengkung dari sisi dekat ke sisi seberang.")

S("SAMPING", "Samping / sebelah", "Arah", [
    k(0, p=A(0.0, -0.36, 1.24), a="telapak", b="FLAT", j="depan", tp="luar"),
    k(0.12),
    k(0.45, p=A(-0.17, -0.36, 1.24)),
    k(0.65),
], L=[k(0, p=A(0.03, -0.36, 1.24), a="telapak", b="FLAT", j="depan", tp="luar")],
  ragu=True, cara="Dua telapak tegak berdampingan; tangan kanan bergeser ke samping kanan — di sebelah.")

# ── Transportasi ───────────────────────────────────────────────────────────

S("BUS", "Bus", "Transportasi", **_sim([
    k(0, p="tengah+0.15*luar+0.04*bawah", a="telapak", b="S", j="depan+0.3*dalam", tp="dalam+0.5*bawah"),
    *bolak(0.15, 0.2, 4, {"p": "tengah+0.15*luar+0.02*atas+0.03*depan"}, {"p": "tengah+0.15*luar+0.08*bawah"}),
    k(0.9),
]), ragu=True, cara="Dua kepalan memegang setir besar yang mendatar, diputar naik-turun bergantian (setir bus).")

S("STASIUN", "Stasiun", "Transportasi", [
    *lingkar(0, 0.6, "netral+0.06*luar", 0.05, "depan", "atas", n=8, mulai=90, putaran=2,
             a="ujung", b="FLAT", j="depan", tp="dalam"),
    k(0.75, p="netral+0.06*luar+0.02*bawah", b="FLAT", j="depan", tp="bawah"),
    k(0.9, p="netral+0.06*luar+0.06*bawah"),
    k(1.05),
], ragu=True, cara="Tangan datar berputar di samping seperti roda kereta, lalu ditekan ke bawah (tempat) — 'tempat kereta'.")

S("HALTE", "Halte", "Transportasi", [
    k(0, p="netral+0.12*luar+0.04*depan", a="telapak", b="FLAT", j="depan+0.3*luar", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": "netral+0.12*luar+0.04*depan+0.05*bawah"}, {"p": "netral+0.12*luar+0.04*depan"}),
    k(0.8),
], ragu=True, cara="Tangan datar menelungkup di samping, ditepuk-tepuk ke bawah seperti menyetop bus — tempat menunggu bus.")

S("TIKET", "Tiket / karcis", "Transportasi", [
    k(0, p=A(0.02, -0.33, 1.175), a="ujung", b="B22_JEPIT", j="bawah+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.5, p="netral+0.10*atas+0.10*depan", j="atas+0.5*depan"),
    k(0.7),
], L=[_L(L_ATAS)],
  ragu=True, cara="Ibu jari & telunjuk kanan menjepit 'kartu kecil' dari telapak kiri lalu menunjukkannya ke depan.")

S("BERANGKAT", "Berangkat", "Transportasi", [
    k(0, p="dada+0.10*depan+0.04*luar", a="telapak", b="FLAT", j="depan", tp="bawah"),
    k(0.12),
    k(0.45, p="netral+0.24*depan+0.04*atas+0.06*luar", j="depan+0.2*atas"),
    k(0.65),
], ragu=True, cara="Tangan datar menelungkup meluncur cepat dari dekat badan ke depan menjauh, sambil mengucapkan 'berangkat'.")

S("SAMPAI", "Sampai / tiba", "Transportasi", [
    k(0, p=A(-0.06, -0.26, 1.24), a="telunjuk", b="1", j="depan", tp="bawah"),
    k(0.12),
    k(0.45, p=A(0.025, -0.38, 1.24)),
    k(0.7),
], L=[k(0, p=A(0.04, -0.395, 1.24), a="telapak", b="FLAT", j="atas", tp="belakang")],
  ragu=True, cara="Telunjuk kanan maju lalu berhenti menyentuh telapak kiri yang tegak — sudah sampai di batas tujuan.")

S("TERLAMBAT", "Terlambat", "Transportasi", [
    k(0, p=A(0.06, -0.30, 1.21), a="telunjuk", b="1", j="dalam+0.4*depan", tp="bawah"),
    *bolak(0.12, 0.12, 2, {"p": A(0.06, -0.30, 1.185)}, {"p": A(0.06, -0.30, 1.21)}),
    k(0.45, p="bahu_kanan+0.10*depan+0.06*atas", a="telapak", b="FLAT", j="atas", tp="belakang"),
    k(0.7, p="bahu_kanan+0.02*depan+0.08*atas+0.04*luar", j="atas+0.6*belakang"),
    k(0.85),
], L=[_L(L_KEPAL, p=A(0.06, -0.30, 1.16))], wajah="sedih",
  ragu=True, cara="Telunjuk mengetuk pergelangan kiri (jam), lalu tangan datar dikibaskan ke belakang bahu — waktunya sudah lewat.")

# ── Warung & restoran ──────────────────────────────────────────────────────

S("MENU", "Menu", "Makanan", [
    k(0, p=A(0.02, -0.33, 1.28), a="telunjuk", b="1", j="dalam+0.3*bawah", tp="dalam"),
    k(0.12),
    k(0.35, p=A(0.02, -0.33, 1.24)),
    k(0.58, p=A(0.02, -0.33, 1.20)),
    k(0.75),
], L=[_L(L_TEGAK, p=A(0.04, -0.345, 1.24), tp="dalam+0.4*belakang")],
  ragu=True, cara="Telapak kiri seperti lembar menu; telunjuk kanan turun menelusuri daftar dari atas ke bawah.")

S("PESAN", "Memesan", "Makanan", [
    k(0, p="netral+0.04*atas+0.08*luar", a="telunjuk", b="1", j="atas", tp="depan"),
    k(0.15, p="netral+0.20*atas+0.10*luar"),
    *bolak(0.3, 0.13, 3, {"p": "netral+0.20*atas+0.10*luar+0.04*depan"}, {"p": "netral+0.20*atas+0.10*luar"}),
    k(0.75),
], ragu=True, cara="Telunjuk diangkat setinggi kepala dan sedikit digerakkan ke depan (memanggil penjual), sambil mengucapkan 'pesan'.")

S("BUNGKUS", "Bungkus (dibawa pulang)", "Makanan",
  lingkar(0, 0.8, A(0.02, -0.33, 1.20), 0.05, "depan", "atas", n=8, mulai=90, putaran=1.5,
          a="telapak", b="FLAT", j="dalam", tp="bawah") + [k(0.95)],
  L=[_L(L_KEPAL, p=A(0.03, -0.33, 1.17))],
  ragu=True, cara="Tangan datar kanan berputar membungkus kepalan kiri, seperti membungkus nasi dengan kertas.")

S("PIRING", "Piring", "Makanan", **_sim([
    k(0, p="tengah+0.02*luar+0.06*bawah", a="sisi_kelingking", b="C", j="depan", tp="atas+0.4*dalam"),
    k(0.12),
    k(0.4, p="tengah+0.10*luar+0.06*bawah+0.03*belakang", j="depan+0.4*luar"),
    k(0.6, p="tengah+0.06*luar+0.06*bawah+0.08*belakang", j="dalam+0.3*belakang"),
    k(0.75),
]), ragu=True, cara="Dua tangan melengkung (telapak ke atas) menggambar lingkaran piring di depan perut.")

S("GELAS", "Gelas", "Makanan", [
    k(0, p=A(0.04, -0.31, 1.185), a="tumit", b="C", j="atas", tp="dalam"),
    k(0.15),
    k(0.5, p=A(0.04, -0.31, 1.26)),
    k(0.7),
], L=[_L(L_ATAS)],
  ragu=True, cara="Tangan C (seperti memegang gelas) berdiri di atas telapak kiri, lalu diangkat — tinggi gelas.")

S("AIR", "Air", "Makanan", [
    k(0, p="netral+0.10*luar+0.08*atas", a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.12, 5, {"b": "CLAW", "p": "netral+0.05*luar+0.05*atas"}, {"b": "5", "p": "netral+0.0*luar+0.02*atas"}),
    k(0.8),
], ragu=True, cara="Tangan terbuka menelungkup bergerak menyamping sambil jari bergoyang seperti air mengalir; bibir mengucapkan 'air'.")

S("BAYAR", "Bayar", "Belanja", [
    k(0, p=A(0.02, -0.31, 1.185), a="ujung", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.5, p="netral+0.06*atas+0.18*depan", b="FLAT", j="depan", tp="atas"),
    k(0.7),
], L=[_L(L_ATAS)],
  ragu=True, cara="Tangan kanan seperti memegang uang di atas telapak kiri, lalu disodorkan ke depan (menyerahkan uang).")

# ── Belanja ────────────────────────────────────────────────────────────────

S("TOKO", "Toko", "Belanja", [
    k(0, p=A(-0.03, -0.34, 1.33), a="ujung", b="FLAT", j="atas+0.8*dalam", tp="dalam+0.5*bawah"),
    k(0.15),
    k(0.45, p="netral+0.10*luar+0.02*bawah", a="punggung", j="depan", tp="atas"),
    k(0.7, p="netral+0.10*luar+0.02*bawah+0.08*depan"),
    k(0.85),
], L=cermin([
    k(0, p=A(-0.03, -0.34, 1.33), a="ujung", b="FLAT", j="atas+0.8*dalam", tp="dalam+0.5*bawah"),
    k(0.15),
    k(0.45, p="netral+0.10*luar+0.02*bawah", a="punggung", j="depan", tp="atas"),
    k(0.7, p="netral+0.10*luar+0.02*bawah+0.08*depan"),
    k(0.85),
]), ragu=True, cara="Dua telapak membentuk atap (bangunan), lalu turun membuka ke atas dan disodorkan ke depan (menawarkan barang).")

S("UKURAN", "Ukuran", "Belanja", **_sim([
    k(0, p="tengah+0.04*luar", a="telapak", b="FLAT", j="depan", tp="dalam"),
    *bolak(0.15, 0.16, 4, {"p": "tengah+0.12*luar"}, {"p": "tengah+0.06*luar"}),
    k(0.85),
]), ragu=True, cara="Dua telapak berhadapan, didekatkan-dijauhkan seperti mengukur besar benda.")

S("DISKON", "Diskon / potongan harga", "Belanja", [
    k(0, p=A(-0.01, -0.36, 1.33), a="sisi_kelingking", b="FLAT", j="dalam+0.4*depan", tp="bawah"),
    k(0.15),
    k(0.55, p=A(-0.01, -0.36, 1.20)),
    k(0.75),
], L=[_L(L_TEGAK, p=A(0.035, -0.36, 1.26), j="atas", tp="dalam")],
  ragu=True, cara="Tangan kanan menelungkup turun menyusuri telapak kiri yang tegak — harga turun.")

S("COCOK", "Cocok / pas", "Belanja", [
    k(0, p=A(-0.06, -0.34, 1.26), a="jari_telunjuk", b="1", j="depan", tp="bawah+0.5*dalam"),
    k(0.15),
    k(0.45, p=A(-0.012, -0.34, 1.26)),
    k(0.55),
    k(0.7, p=A(-0.012, -0.36, 1.26)),
    k(0.85),
], L=[k(0, p=A(0.012, -0.34, 1.26), a="jari_telunjuk", b="1", j="depan", tp="bawah+0.5*dalam")],
  wajah="senang", ragu=True, cara="Telunjuk kanan mendekat dan menempel sejajar di samping telunjuk kiri — dua hal pas/serasi.")

S("GANTI", "Ganti / tukar", "Belanja", [
    k(0, p="tengah+0.08*luar+0.03*depan", a="telapak", b="A", j="depan", tp="dalam"),
    k(0.12),
    k(0.35, p="tengah+0.08*depan+0.03*atas", kurva=True),
    k(0.6, p="tengah+0.08*dalam+0.03*belakang", kurva=True),
    k(0.75),
], L=[
    k(0, p=A(0.08, -0.37, 1.24), a="telapak", b="A", j="depan", tp="dalam"),
    k(0.12),
    k(0.35, p=A(0.0, -0.32, 1.22), kurva=True),
    k(0.6, p=A(-0.08, -0.37, 1.24), kurva=True),
    k(0.75),
], ragu=True, cara="Dua kepalan saling bertukar tempat, satu memutar di depan yang lain.")

S("COBA", "Coba", "Belanja", [
    k(0, p="pelipis+0.03*depan", a="telunjuk", b="1", j="atas+0.5*dalam", tp="depan"),
    k(0.15),
    k(0.45, p="netral+0.12*atas+0.12*depan", a="ujung", b="FLAT_O", j="depan", tp="bawah"),
    k(0.6, p="netral+0.10*atas+0.16*depan"),
    k(0.75),
], ragu=True, cara="Telunjuk di pelipis, lalu tangan kuncup maju sedikit seperti 'mencicipi' — mencoba; bibir mengucapkan 'coba'.")

# ── Bank & uang ────────────────────────────────────────────────────────────

_eja("BANK", "Bank", "Uang", "BANK", "Sebagian daerah memakai isyarat lokal — tanyakan ke pengajar Tuli.")
_eja("ATM", "ATM", "Uang", "ATM")

S("TABUNG", "Menabung", "Uang", [
    k(0, p=A(0.03, -0.31, 1.29), a="ujung", b="B22_JEPIT", j="dalam+0.6*bawah", tp="belakang"),
    k(0.15),
    k(0.45, p=A(0.03, -0.31, 1.215)),
    k(0.55, b="5"),
    k(0.75, p=A(0.03, -0.31, 1.29), b="B22_JEPIT"),
    k(0.95, p=A(0.03, -0.31, 1.215)),
    k(1.05, b="5"),
    k(1.15),
], L=[_L(L_KEPAL, p=A(0.03, -0.31, 1.17), a="telapak", tp="dalam+0.3*depan", j="depan")],
  ragu=True, cara="Jari kanan seperti menjepit koin lalu memasukkannya ke celah di atas kepalan kiri (celengan), dua kali.")

S("TRANSFER", "Transfer (uang)", "Uang", [
    k(0, p="netral+0.04*atas+0.06*luar", a="ujung", b="FLAT_O", j="depan", tp="bawah"),
    k(0.12),
    k(0.4, p="tengah+0.12*atas+0.08*depan", kurva=True),
    k(0.65, p="netral_kiri+0.04*atas+0.10*depan", b="5"),
    k(0.85),
], ragu=True, cara="Tangan kuncup bergerak melengkung dari kanan ke kiri lalu membuka — uang berpindah ke rekening lain.")

S("KIRIM", "Kirim", "Uang", [
    k(0, p="dada+0.08*depan+0.04*luar", a="ujung", b="FLAT_O", j="depan", tp="bawah"),
    k(0.12),
    k(0.45, p="netral+0.10*atas+0.22*depan", b="5", j="depan+0.3*atas"),
    k(0.65),
], ragu=True, cara="Tangan kuncup di depan dada dilempar ke depan sambil membuka — mengirim sesuatu ke orang lain.")

# ── Kesehatan ──────────────────────────────────────────────────────────────

S("DEMAM", "Demam", "Kesehatan", [
    k(0, p="dahi+0.012*bawah+0.06*depan", a="punggung", b="FLAT", j="dalam", tp="depan"),
    k(0.15, p="dahi+0.012*bawah+0.012*depan"),
    k(0.35, p="dahi+0.012*bawah+0.05*depan"),
    k(0.5, p="dahi+0.012*bawah+0.012*depan"),
    k(0.8),
], kepala=[(0.2, 6, 0, 0), (0.8, 6, 0, 0)], wajah="sedih",
  ragu=True, cara="Punggung tangan ditempelkan ke dahi dua kali (memeriksa panas) dengan wajah lemas.")

S("BATUK", "Batuk", "Kesehatan", [
    k(0, p="mulut+0.05*depan+0.02*bawah", a="buku", b="S", j="dalam+0.3*atas", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "mulut+0.02*depan+0.02*bawah"}, {"p": "mulut+0.06*depan+0.03*bawah"}),
    k(0.8),
], kepala=[(0.15, 8, 0, 0), (0.3, 0, 0, 0), (0.45, 8, 0, 0), (0.7, 0, 0, 0)], wajah="sedih",
  ragu=True, cara="Kepalan di depan mulut, kepala & tangan tersentak kecil dua kali seperti batuk.")

S("PUSING", "Pusing", "Kesehatan",
  lingkar(0, 0.85, "pelipis+0.05*depan+0.02*luar", 0.03, "depan", "atas", n=8, mulai=90, putaran=2,
          a="telunjuk", b="1", j="atas+0.5*dalam", tp="dalam+0.4*belakang") + [k(1.0)],
  kepala=[(0.3, 0, 0, 6), (0.7, 0, 0, -4), (1.0, 0, 0, 0)], wajah="sedih",
  ragu=True, cara="Telunjuk memutar-mutar di dekat pelipis, kepala sedikit oleng, wajah tidak nyaman.")

S("PERIKSA", "Periksa (dokter)", "Kesehatan", [
    k(0, p="dada_kiri+0.03*depan", a="ujung", b="BENT_V", j="atas+0.3*dalam", tp="belakang"),
    k(0.15, p="dada_kiri+0.012*depan"),
    k(0.4, p="dada_kanan+0.03*depan"),
    k(0.55, p="dada_kanan+0.012*depan"),
    k(0.8, p="dada+0.012*depan+0.05*bawah"),
    k(0.95),
], ragu=True, cara="Jari menempel berpindah-pindah di dada seperti stetoskop dokter memeriksa.")

S("ISTIRAHAT", "Istirahat", "Kesehatan", [
    k(0, p="netral+0.04*atas", a="telapak", b="FLAT", j="atas+0.6*dalam", tp="belakang"),
    k(0.15),
    k(0.5, p="dada_kiri+0.04*depan+0.03*atas", j="dalam+0.6*atas"),
    k(0.85),
], L=[
    k(0, p="netral_kiri+0.04*atas", a="telapak", b="FLAT", j="atas+0.6*dalam", tp="belakang"),
    k(0.15),
    k(0.5, p="dada_kanan+0.07*depan+0.03*atas", j="dalam+0.6*atas"),
    k(0.85),
], kepala=[(0.6, 4, 0, 0)], ragu=True,
  cara="Dua tangan datar menyilang di depan dada, badan santai — beristirahat.")

# ── Darurat ────────────────────────────────────────────────────────────────

S("BAHAYA", "Bahaya", "Darurat", [
    k(0, p=A(-0.04, -0.36, 1.37), a="jari_telunjuk", b="1", j="atas+0.8*dalam", tp="depan"),
    k(0.15),
    k(0.4, p=A(0.012, -0.40, 1.37)),
    k(0.55, p=A(0.012, -0.42, 1.37)),
    k(0.7, p=A(0.012, -0.40, 1.37)),
    k(0.85),
], L=[
    k(0, p=A(0.04, -0.36, 1.37), a="jari_telunjuk", b="1", j="atas+0.8*dalam", tp="depan"),
    k(0.15),
    k(0.4, p=A(-0.012, -0.38, 1.37)),
    k(0.55, p=A(-0.012, -0.40, 1.37)),
    k(0.7, p=A(-0.012, -0.38, 1.37)),
    k(0.85),
], wajah="sedih", ragu=True,
  cara="Dua telunjuk bersilang membentuk X di depan wajah dan didorong tegas ke depan, wajah waspada — tanda bahaya.")

S("AMAN", "Aman", "Darurat", **_sim([
    k(0, p="tengah+0.03*luar+0.04*atas", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.55, p="tengah+0.16*luar", j="depan"),
    k(0.75),
]), wajah="senang", ragu=True,
  cara="Dua telapak menelungkup bergerak mendatar ke samping dengan tenang — keadaan aman/tenang.")

S("KEBAKARAN", "Kebakaran", "Darurat", **_sim([
    k(0, p="tengah+0.06*luar+0.08*bawah", a="ujung", b="5", j="atas", tp="belakang"),
    *bolak(0.12, 0.12, 6, {"b": "CLAW", "p": "tengah+0.06*luar+0.0*bawah"}, {"b": "5", "p": "tengah+0.06*luar+0.08*atas"}),
    k(0.9),
]), wajah="sedih", ragu=True,
  cara="Dua tangan terbuka, jari bergoyang sambil naik seperti api yang berkobar.")

S("KECELAKAAN", "Kecelakaan", "Darurat", [
    k(0, p="tengah+0.16*luar", a="telapak", b="S", j="depan", tp="dalam"),
    k(0.12),
    k(0.4, p="tengah+0.025*luar"),
    k(0.5, p="tengah+0.05*luar+0.02*atas"),
    k(0.7),
], L=[
    k(0, p=A(0.16, -0.34, 1.24), a="telapak", b="S", j="depan", tp="dalam"),
    k(0.12),
    k(0.4, p=A(0.025, -0.34, 1.24)),
    k(0.5, p=A(0.05, -0.34, 1.26)),
    k(0.7),
], wajah="sedih", ragu=True, cara="Dua kepalan (dua kendaraan) bergerak cepat saling bertabrakan di depan badan.")

S("GEMPA", "Gempa bumi", "Darurat", **_sim([
    k(0, p="tengah+0.08*luar+0.04*bawah", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.1, 7, {"p": "tengah+0.11*luar+0.04*bawah"}, {"p": "tengah+0.05*luar+0.04*bawah"}),
    k(0.9),
]), wajah="sedih", ragu=True,
  cara="Dua telapak menelungkup (tanah) diguncang cepat ke kiri-kanan.")

# ── Posisi & letak ─────────────────────────────────────────────────────────

S("ATAS", "Atas", "Posisi", [
    k(0, p="netral+0.06*atas", a="telunjuk", b="1", j="atas", tp="depan"),
    k(0.12),
    k(0.4, p="netral+0.20*atas"),
    k(0.6),
], cara="Telunjuk menunjuk ke atas dan sedikit diangkat.")

S("BAWAH", "Bawah", "Posisi", [
    k(0, p="netral+0.02*bawah", a="telunjuk", b="1", j="bawah", tp="belakang"),
    k(0.12),
    k(0.4, p="netral+0.12*bawah"),
    k(0.6),
], cara="Telunjuk menunjuk ke bawah dan sedikit diturunkan.")

S("DALAM", "Dalam / di dalam", "Posisi", [
    k(0, p=A(0.0, -0.33, 1.32), a="ujung", b="FLAT_O", j="bawah", tp="belakang"),
    k(0.15),
    k(0.45, p=A(0.0, -0.33, 1.25)),
    k(0.65),
], L=[k(0, p=A(0.012, -0.33, 1.24), a="telapak", b="C", j="depan+0.3*dalam", tp="dalam")],
  ragu=True, cara="Ujung jari kanan yang kuncup dimasukkan ke dalam lengkung tangan kiri (bentuk C).")

S("LUAR", "Luar / di luar", "Posisi", [
    k(0, p=A(0.0, -0.33, 1.25), a="ujung", b="FLAT_O", j="bawah", tp="belakang"),
    k(0.15),
    k(0.45, p=A(-0.08, -0.36, 1.32), j="bawah+0.4*luar"),
    k(0.65),
], L=[k(0, p=A(0.012, -0.33, 1.24), a="telapak", b="C", j="depan+0.3*dalam", tp="dalam")],
  ragu=True, cara="Ujung jari kanan keluar dari lengkung tangan kiri (bentuk C) menjauh ke samping atas.")

S("DEPAN", "Depan", "Posisi", [
    k(0, p="netral+0.08*atas+0.02*belakang", a="telapak", b="FLAT", j="atas", tp="belakang"),
    k(0.12),
    k(0.45, p="netral+0.08*atas+0.16*depan"),
    k(0.65),
], ragu=True, cara="Telapak tegak menghadap diri sendiri didorong ke depan wajah — di depan.")

S("BELAKANG", "Belakang", "Posisi", [
    k(0, p="bahu_kanan+0.14*depan+0.04*atas", a="jempol", b="A", j="atas", tp="dalam"),
    k(0.12),
    k(0.45, p="bahu_kanan+0.03*depan+0.10*atas+0.02*luar", j="atas+0.4*dalam", tp="dalam+0.5*depan"),
    k(0.65),
], cara="Ibu jari (kepalan A) menunjuk ke belakang melewati bahu.")

# ── Rekreasi ───────────────────────────────────────────────────────────────

S("PANTAI", "Pantai", "Tempat", [
    k(0, p="netral+0.10*luar+0.02*bawah", a="telapak", b="FLAT", j="depan+0.4*dalam", tp="bawah"),
    k(0.12),
    k(0.3, p="netral+0.04*luar+0.04*atas", kurva=True),
    k(0.5, p="netral+0.02*dalam+0.0*bawah", kurva=True),
    k(0.7, p="netral+0.08*dalam+0.04*atas", kurva=True),
    k(0.9, p="netral+0.12*dalam+0.0*bawah", kurva=True),
    k(1.0),
], ragu=True, cara="Tangan datar menelungkup bergerak bergelombang mendatar seperti ombak laut di tepi pantai.")

S("GUNUNG", "Gunung", "Tempat", **_sim([
    k(0, p="tengah+0.012*luar+0.16*atas", a="ujung", b="FLAT", j="atas+0.8*dalam", tp="dalam+0.5*bawah"),
    k(0.15),
    k(0.6, p="tengah+0.18*luar+0.0*atas", j="atas+0.5*dalam"),
    k(0.8),
]), ragu=True, cara="Ujung dua tangan datar bertemu di atas (puncak), lalu bergerak turun ke samping membentuk lereng gunung.")

S("TAMAN", "Taman", "Tempat", **_sim([
    k(0, p="tengah+0.04*luar+0.04*bawah", a="ujung", b="FLAT_O", j="atas", tp="dalam"),
    k(0.12),
    k(0.4, p="tengah+0.08*luar+0.05*atas", b="5"),
    k(0.55, p="tengah+0.14*luar+0.04*bawah", b="FLAT_O"),
    k(0.8, p="tengah+0.18*luar+0.05*atas", b="5"),
    k(0.95),
]), ragu=True, cara="Dua tangan kuncup naik sambil membuka di beberapa tempat, seperti tanaman & bunga yang tumbuh.")

S("MAL", "Mal / pusat belanja", "Tempat", **_sim([
    k(0, p="tengah+0.08*luar+0.08*bawah", a="telapak", b="FLAT", j="atas", tp="dalam"),
    k(0.15),
    k(0.6, p="tengah+0.08*luar+0.18*atas"),
    k(0.8),
]), ragu=True, cara="Dua telapak berhadapan naik tinggi (gedung besar), sambil mengucapkan 'mal'.")

S("AKHIR_PEKAN", "Akhir pekan", "Waktu", [
    k(0, p=A(0.075, -0.285, 1.178), a="sisi_kelingking", b="FLAT", j="depan+0.4*dalam", tp="dalam"),
    k(0.12),
    k(0.45, p=A(-0.005, -0.38, 1.178)),
    k(0.6, p=A(-0.005, -0.40, 1.15), j="depan+0.3*bawah"),
    k(0.75),
], L=[_L(L_ATAS)],
  ragu=True, cara="Sisi tangan kanan meluncur di atas telapak kiri sampai jatuh di ujung jarinya (akhir), sambil mengucapkan 'akhir pekan'.")

S("MUDIK", "Mudik / pulang kampung", "Tempat", [
    k(0, p="dada+0.06*depan+0.06*luar", a="ujung", b="FLAT", j="depan", tp="bawah"),
    k(0.12),
    k(0.45, p="netral+0.12*atas+0.16*depan+0.08*luar", kurva=True),
    k(0.8, p="netral+0.04*atas+0.30*depan+0.16*luar", kurva=True),
    k(0.95),
], ragu=True, cara="Tangan datar menelungkup bergerak melengkung jauh ke depan-samping — perjalanan jauh pulang ke kampung.")

S("KAMPUNG", "Kampung / desa", "Tempat", [
    k(0, p=A(-0.03, -0.34, 1.30), a="ujung", b="FLAT", j="atas+0.8*dalam", tp="dalam+0.5*bawah"),
    k(0.12),
    k(0.35, p=A(-0.03, -0.34, 1.26)),
    k(0.55, p=A(-0.09, -0.36, 1.30)),
    k(0.75, p=A(-0.09, -0.36, 1.26)),
    k(0.9),
], L=[
    k(0, p=A(0.03, -0.34, 1.30), a="ujung", b="FLAT", j="atas+0.8*dalam", tp="dalam+0.5*bawah"),
    k(0.12),
    k(0.35, p=A(0.03, -0.34, 1.26)),
    k(0.55, p=A(0.09, -0.36, 1.30)),
    k(0.75, p=A(0.09, -0.36, 1.26)),
    k(0.9),
], ragu=True, cara="Dua telapak membentuk atap rumah, diulang sambil bergeser — banyak rumah kecil (kampung).")

_eja("HOTEL", "Hotel", "Tempat", "HOTEL")

# ── Kota & negara ──────────────────────────────────────────────────────────

S("INDONESIA", "Indonesia", "Tempat", [
    k(0, p="netral+0.10*atas", a="telapak", b="FLAT", j="atas", tp="depan"),
    k(0.15),
    k(0.45, p="dada_kiri+0.02*depan+0.03*atas", j="dalam+0.6*atas", tp="belakang"),
    k(0.75),
], ragu=True, cara="Bentuk berbeda antardaerah — di sini: tangan datar diletakkan di dada kiri (tanah air); WAJIB tanyakan isyarat yang dipakai di daerahmu.")

S("NEGARA", "Negara", "Tempat",
  lingkar(0, 0.8, A(0.03, -0.33, 1.20), 0.045, "dalam", "depan", n=8, mulai=0,
          a="telapak", b="FLAT", j="depan+0.4*dalam", tp="bawah") + [k(0.95)],
  L=[_L(L_ATAS)],
  ragu=True, cara="Tangan kanan menelungkup memutar di atas telapak kiri — wilayah sebuah negara.")

S("KOTA", "Kota", "Tempat", [
    k(0, p=A(-0.03, -0.34, 1.34), a="ujung", b="FLAT", j="atas+0.5*dalam", tp="dalam+0.3*bawah"),
    k(0.12),
    k(0.3, p=A(-0.03, -0.34, 1.30)),
    k(0.5, p=A(-0.10, -0.36, 1.27)),
    k(0.7, p=A(-0.10, -0.36, 1.23)),
    k(0.85),
], L=[
    k(0, p=A(0.03, -0.34, 1.34), a="ujung", b="FLAT", j="atas+0.5*dalam", tp="dalam+0.3*bawah"),
    k(0.12),
    k(0.3, p=A(0.03, -0.34, 1.30)),
    k(0.5, p=A(0.10, -0.36, 1.27)),
    k(0.7, p=A(0.10, -0.36, 1.23)),
    k(0.85),
], ragu=True, cara="Ujung dua telapak bertemu tinggi (gedung) lalu diulang bergeser ke samping — banyak bangunan.")

_eja("BANDUNG", "Bandung", "Tempat", "BANDUNG", "Isyarat kota ini berbeda antardaerah — tanyakan isyarat lokalnya ke pengajar Tuli.")
_eja("SURABAYA", "Surabaya", "Tempat", "SURABAYA", "Isyarat kota ini berbeda antardaerah — tanyakan isyarat lokalnya ke pengajar Tuli.")
_eja("MEDAN", "Medan", "Tempat", "MEDAN", "Isyarat kota ini berbeda antardaerah — tanyakan isyarat lokalnya ke pengajar Tuli.")

# ── Meminta & bertanya ─────────────────────────────────────────────────────

S("MINTA", "Minta / memohon", "Bantuan", **_sim([
    k(0, p="tengah+0.025*luar+0.14*depan", a="punggung", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.5, p="tengah+0.025*luar+0.02*depan+0.02*atas", j="depan+0.3*atas"),
    k(0.7),
]), ragu=True, cara="Dua telapak menengadah berdampingan di depan, ditarik ke arah badan — meminta sesuatu.")

S("BUTUH", "Butuh / perlu", "Bantuan", [
    k(0, p="dada+0.10*depan", a="ujung", b="5", j="depan", tp="bawah"),
    k(0.12),
    k(0.4, p="dada+0.04*depan", b="FLAT_O", j="belakang+0.4*bawah"),
    k(0.55, p="dada+0.012*depan"),
    k(0.75),
], ragu=True, cara="Tangan terbuka di depan dada menguncup dan ditarik ke dada — sangat membutuhkan; bibir mengucapkan 'butuh'.")

S("YANG_MANA", "Yang mana", "Kata tanya", [
    k(0, p="netral+0.06*atas+0.08*luar+0.06*depan", a="telunjuk", b="1", j="depan+0.4*luar", tp="bawah"),
    *bolak(0.15, 0.18, 4, {"p": "netral+0.06*atas+0.08*dalam+0.06*depan", "j": "depan+0.4*dalam"},
           {"p": "netral+0.06*atas+0.08*luar+0.06*depan", "j": "depan+0.4*luar"}),
    k(0.9),
], wajah="wh", ragu=True, cara="Telunjuk menunjuk bergantian ke dua pilihan di kiri & kanan, alis berkerut.")

S("BERAPA_LAMA", "Berapa lama", "Kata tanya", [
    k(0, p=A(0.06, -0.30, 1.21), a="telunjuk", b="1", j="dalam+0.4*depan", tp="bawah"),
    *bolak(0.12, 0.12, 2, {"p": A(0.06, -0.30, 1.185)}, {"p": A(0.06, -0.30, 1.21)}),
    k(0.45, p=A(-0.02, -0.36, 1.21), a="telapak", b="5", j="atas+0.3*dalam", tp="atas"),
    *bolak(0.6, 0.12, 3, {"b": "CLAW"}, {"b": "5"}),
    k(1.0),
], L=[_L(L_KEPAL, p=A(0.06, -0.30, 1.16))], wajah="wh",
  ragu=True, cara="Telunjuk mengetuk pergelangan kiri (jam), lalu tangan menengadah dengan jari bergerak seperti menghitung (BERAPA), alis berkerut.")

S("UNTUK", "Untuk (tujuan)", "Kata tanya", [
    k(0, p="pelipis+0.03*depan", a="telunjuk", b="1", j="atas+0.4*dalam", tp="dalam+0.3*depan"),
    k(0.15),
    k(0.5, p="netral+0.12*atas+0.18*depan", j="depan", tp="bawah"),
    k(0.7),
], ragu=True, cara="Telunjuk dari pelipis bergerak maju menunjuk ke depan (tujuan), sambil mengucapkan 'untuk'.")
