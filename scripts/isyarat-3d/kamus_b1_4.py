# [isyarat-b1b2-v1] Kamus isyarat ASL B1.4 "Faces & Fingers — Ekspresi Wajah & Abjad Jari Lanjut".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# Kode baru berawalan B14_ (gloss tampil tanpa awalan).
# Catatan: morfem mulut (MM, OO, CHA, CS, TH, PAH, pipi menggembung) TIDAK bisa diperagakan
# avatar (WAJAH hanya netral/senang/ya_tidak/wh/sedih/tidur) — dijelaskan di `cara` & di slide.
# Fingerspelling leksikal (#BACK, #JOB, …) tidak masuk kamus: di dek ditulis "#KATA" (dieja otomatis).
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli, terutama: THIN, THICK, ABBREVIATE,
#    DISCOUNT, EXPRESSION, CROWD, TWO-HOUR (inkorporasi angka), dan HALF.

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_KIRI_DATAR = dict(a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")     # telapak kiri menghadap atas
_KIRI_TEGAK = dict(a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")      # telapak kiri tegak ke kanan
_KIRI_SAMPING = A(0.04, -0.33, 1.15)


def _dua(keys):
    return keys, cermin(keys)


# ── Sesi 1: peta penanda nonmanual ────────────────────────────────────────

S("B14_FACE", "Wajah", "Tubuh",
  lingkar(0, 0.9, "hidung+0.12*depan+0.02*bawah", 0.05, "luar", "atas", n=10, mulai=90,
          a="telunjuk", b="1", j="belakang+0.6*atas", tp="dalam+0.5*bawah") + [k(1.05)],
  cara="Telunjuk menggambar lingkaran di depan wajah.")

_r = [k(0, p="mata+0.12*depan+0.06*luar+0.02*atas", a="buku", b="X", j="atas", tp="depan")]
_r += bolak(0.15, 0.17, 4, {"p": "mata+0.12*depan+0.06*luar+0.08*bawah"}, {"p": "mata+0.12*depan+0.06*luar+0.03*atas"}) + [k(0.85)]
_l = [k(0, p="mata_kiri+0.12*depan+0.06*luar+0.08*bawah", a="buku", b="X", j="atas", tp="depan")]
_l += bolak(0.15, 0.17, 4, {"p": "mata_kiri+0.12*depan+0.06*luar+0.03*atas"}, {"p": "mata_kiri+0.12*depan+0.06*luar+0.08*bawah"}) + [k(0.85)]
S("B14_EXPRESSION", "Ekspresi (wajah)", "Tubuh", _r, L=_l, gloss="EXPRESSION", wajah="senang",
  cara="Dua tangan X (telunjuk bengkok) di kiri-kanan wajah, naik-turun bergantian — wajah yang berubah-ubah.")

S("B14_MIRROR", "Cermin", "Benda", [
    k(0, p="hidung+0.22*depan+0.12*luar+0.10*bawah", a="telapak", b="FLAT", j="atas+0.2*dalam", tp="belakang+0.3*dalam"),
    *bolak(0.15, 0.15, 4, {"putar": 30}, {"putar": -20}),
    k(0.85, putar=0),
], cara="Telapak datar menghadap wajah seperti cermin, diputar bolak-balik kecil di pergelangan.")

# ── Sesi 2: MM & OO ────────────────────────────────────────────────────────

S("B14_WRITE", "Menulis", "Kata kerja", [
    k(0, p=A(0.07, -0.30, 1.19), a="ujung", b="BABY_O", j="depan+0.4*dalam+0.4*bawah", tp="bawah+0.4*dalam"),
    k(0.12),
    *bolak(0.22, 0.13, 4, {"p": A(0.03, -0.36, 1.185)}, {"p": A(0.01, -0.40, 1.195)}),
    k(0.8, p=A(-0.01, -0.42, 1.185)),
    k(0.95),
], L=[k(0, p=_KIRI_SAMPING, **_KIRI_DATAR)],
  cara="Tangan seperti memegang pena menggores bergelombang di atas telapak kiri.")

_r, _l = _dua([
    k(0, p=A(-0.02, -0.33, 1.20), a="tumit", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
    k(0.12),
    k(0.3, p=A(-0.02, -0.28, 1.20)),
    k(0.42, p=A(-0.02, -0.33, 1.20)),
    k(0.6, p=A(-0.02, -0.28, 1.20)),
    k(0.75),
])
_l = [k(0, p=A(0.03, -0.33, 1.17), a="tumit", b="FLAT", j="dalam+0.5*depan", tp="atas")]
S("B14_PAPER", "Kertas", "Benda", _r, L=_l, gloss="PAPER",
  cara="Pangkal telapak kanan menyapu pangkal telapak kiri (menghadap atas) ke arah badan dua kali.")

_r, _l = _dua([
    k(0, p=A(-0.012, -0.40, 1.26), a="kelingking", b="I", j="depan+0.3*dalam", tp="bawah+0.3*belakang"),
    k(0.15),
    k(0.65, p=A(-0.16, -0.40, 1.26)),
    k(0.85),
])
S("B14_THIN", "Tipis / ramping (garis, benang)", "Ukuran", _r, L=_l, gloss="THIN", wajah="senang",
  cara="Ujung kelingking dua tangan bertemu lalu ditarik ke samping — garis tipis; bibir 'OO' (kecil, tipis).")

# ── Sesi 3: CHA, CS, TH ────────────────────────────────────────────────────

S("B14_NEAR", "Dekat", "Ukuran", [
    k(0, p=A(-0.03, -0.32, 1.24), a="punggung", b="BENT_B", j="dalam+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.5, p=A(-0.005, -0.40, 1.24)),
    k(0.7),
], L=[k(0, p=A(0.03, -0.44, 1.24), a="telapak", b="BENT_B", j="dalam+0.3*depan", tp="belakang")],
  cara="Tangan kanan (B bengkok) bergerak mendekati punggung tangan kiri; morfem CS (bahu & pipi didekatkan) = sangat dekat.")

S("B14_CARELESS", "Ceroboh / sembarangan", "Sifat", [
    k(0, p="dahi+0.12*depan+0.06*luar", a="ujung", b="V", j="atas+0.2*dalam", tp="dalam"),
    *bolak(0.15, 0.17, 4, {"p": "dahi+0.12*depan+0.07*dalam"}, {"p": "dahi+0.12*depan+0.06*luar"}),
    k(0.85),
], wajah="sedih", cara="Tangan V (ujung ke atas) di depan dahi, diayun ke kiri-kanan melintasi mata; lidah 'TH' = tanpa perhatian.")

S("B14_THICK", "Tebal", "Ukuran", [
    k(0, p=A(0.0, -0.34, 1.21), a="jempol", b="C", j="dalam+0.6*depan", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.45, p=A(0.0, -0.36, 1.19)),
    k(0.75),
], L=[k(0, p=A(0.04, -0.35, 1.17), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah")],
  cara="Ibu jari & telunjuk (bentuk C) menjepit tepi tangan kiri seperti mengukur ketebalan; pipi menggembung / 'CHA' = tebal sekali.")

# ── Sesi 4: PAH, pipi menggembung, STA-STA ─────────────────────────────────

_r, _l = _dua([
    k(0, p=A(-0.10, -0.32, 1.30), a="telunjuk", b="1", j="atas+0.3*depan", tp="belakang+0.4*dalam"),
    k(0.12),
    k(0.35, p=A(-0.13, -0.38, 1.38), j="atas+0.6*depan", kurva=True),
    k(0.55, p=A(-0.13, -0.36, 1.40), j="atas+0.3*depan", kurva=True),
    k(0.8, p=A(-0.16, -0.42, 1.50), j="atas+0.5*depan", kurva=True),
    k(1.0),
])
S("B14_SUCCESS", "Berhasil / sukses", "Kata kerja", _r, L=_l, gloss="SUCCESS", wajah="senang",
  cara="Dua telunjuk (telapak ke diri) naik melengkung dua tahap ke atas-depan; sering ditemani morfem 'PAH!' (akhirnya berhasil).")

_r, _l = _dua([
    k(0, p=A(-0.10, -0.28, 1.20), a="ujung", b="CLAW", j="depan+0.3*luar", tp="bawah"),
    k(0.15),
    *bolak(0.25, 0.15, 4, {"p": A(-0.10, -0.38, 1.19)}, {"p": A(-0.10, -0.46, 1.20)}),
    k(0.9, p=A(-0.10, -0.50, 1.19)),
])
S("B14_CROWD", "Banyak orang / kerumunan", "Classifier", _r, L=_l, gloss="CL:5-KERUMUNAN",
  cara="Dua tangan cakar menghadap bawah (banyak kepala) bergerak maju bersama; pipi menggembung = banyak sekali.")

_r, _l = _dua([
    k(0, p="pipi+0.03*depan+0.01*luar", a="ujung", b="CLAW", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.5, p="pipi+0.05*depan+0.08*luar"),
    k(0.75),
])
_l = cermin(_r)
S("B14_FAT", "Gemuk", "Ukuran", _r, L=_l, gloss="FAT",
  cara="Dua tangan cakar di pipi bergerak ke samping (pipi melebar) sambil pipi menggembung.")

# ── Sesi 5: mouthing vs morfem mulut ───────────────────────────────────────

S("B14_LIPREAD", "Membaca gerak bibir", "Komunikasi",
  lingkar(0, 0.9, "mulut+0.07*depan+0.01*bawah", 0.022, "luar", "atas", n=8, mulai=90,
          a="ujung", b="BENT_V", j="atas+0.2*dalam", tp="belakang+0.3*dalam") + [k(1.05)],
  cara="Ujung V bengkok (dua mata) memutar kecil di depan mulut — mata 'membaca' bibir.")

S("B14_TALK", "Berbicara (suara)", "Komunikasi", [
    k(0, p="mulut+0.02*depan+0.02*luar", a="telunjuk", b="1", j="atas+0.3*dalam", tp="dalam"),
    *bolak(0.15, 0.15, 4, {"p": "mulut+0.10*depan+0.02*luar"}, {"p": "mulut+0.02*depan+0.02*luar"}),
    k(0.8),
], cara="Telunjuk di depan mulut digerakkan maju-mundur — kata-kata keluar dari mulut.")

S("B14_VOICE", "Suara / bersuara", "Komunikasi", [
    k(0, p="leher+0.03*depan", a="ujung", b="BENT_V", j="atas+0.2*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="dagu+0.06*depan+0.03*bawah", j="atas+0.5*depan"),
    k(0.75),
], cara="Ujung V bengkok di leher (pita suara) bergerak ke atas-depan.")

# ── Sesi 6: membaca abjad jari cepat ───────────────────────────────────────

S("B14_WORD", "Kata", "Bahasa", [
    k(0, p=A(0.01, -0.38, 1.33), a="ujung", b="BABY_O", j="dalam+0.3*depan", tp="belakang"),
    k(0.12, p=A(0.025, -0.38, 1.33)),
    k(0.28, p=A(0.01, -0.38, 1.33)),
    k(0.4, p=A(0.025, -0.38, 1.33)),
    k(0.6),
], L=[k(0, p=A(0.04, -0.38, 1.27), a="telunjuk", b="1", j="atas+0.2*depan", tp="dalam")],
  cara="Ibu jari & telunjuk kanan (G pendek) disentuhkan ke ujung telunjuk kiri yang tegak — 'sepotong' kata.")

S("B14_PRACTICE", "Berlatih", "Belajar", [
    k(0, p=A(0.02, -0.38, 1.24), a="buku", b="A", j="dalam+0.6*depan", tp="bawah"),
    *bolak(0.12, 0.13, 6, {"p": A(0.06, -0.38, 1.24)}, {"p": A(0.0, -0.38, 1.24)}),
    k(0.9),
], L=[k(0, p=A(0.03, -0.38, 1.21), a="telunjuk", b="1", j="dalam+0.6*depan", tp="bawah")],
  cara="Buku jari kepalan A digosok bolak-balik di atas telunjuk kiri yang mendatar.")

# ── Sesi 8: nama, merek, istilah ───────────────────────────────────────────

_r = []
_t = 0.0
for _i, _x in enumerate((0.0, -0.08, -0.16)):
    _r += [k(_t, p=A(_x - 0.03, -0.38, 1.36), a="ujung", b="FLAT", j="atas+0.7*dalam", tp="dalam+0.6*bawah"),
           k(_t + 0.12, p=A(_x - 0.03, -0.38, 1.33))]
    _t += 0.28
_r.append(k(_t))
_l = []
_t = 0.0
for _i, _x in enumerate((0.0, -0.08, -0.16)):
    _l += [k(_t, p=A(_x + 0.03, -0.38, 1.36), a="ujung", b="FLAT", j="atas+0.7*dalam", tp="dalam+0.6*bawah"),
           k(_t + 0.12, p=A(_x + 0.03, -0.38, 1.33))]
    _t += 0.28
_l.append(k(_t))
S("B14_CITY", "Kota", "Tempat", _r, L=_l, gloss="CITY",
  cara="Ujung jari dua tangan datar bersentuhan membentuk atap, diulang sambil bergeser ke samping — deretan atap rumah.")

S("B14_ABBREVIATE", "Menyingkat / singkatan", "Bahasa", [
    k(0, p=A(0.0, -0.36, 1.30), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(0.5, p=A(0.0, -0.36, 1.21), b="BENT_B"),
    k(0.7),
], L=[k(0, p=A(0.03, -0.36, 1.17), **_KIRI_DATAR), k(0.15), k(0.5, b="BENT_B"), k(0.7)],
  cara="Tangan kanan menekan turun ke tangan kiri seperti 'memadatkan' kata menjadi pendek.")

# ── Sesi 9: uang & harga ───────────────────────────────────────────────────

S("B14_THOUSAND", "Ribu", "Angka", [
    k(0, p=A(0.0, -0.38, 1.27), a="ujung", b="BENT_B", j="dalam+0.4*depan+0.3*bawah", tp="belakang+0.5*bawah"),
    k(0.15),
    k(0.42, p=A(0.04, -0.34, 1.19)),
    k(0.65),
], L=[k(0, p=A(0.04, -0.33, 1.17), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam+0.4*atas")],
  cara="Ujung jari tangan B bengkok mendarat di telapak kiri (sekali). 2.000 = TWO + THOUSAND.")

S("B14_MILLION", "Juta", "Angka", [
    k(0, p=A(0.0, -0.36, 1.27), a="ujung", b="BENT_B", j="dalam+0.4*depan+0.3*bawah", tp="belakang+0.5*bawah"),
    k(0.12, p=A(0.04, -0.32, 1.19)),
    k(0.3, p=A(0.0, -0.40, 1.26)),
    k(0.45, p=A(0.035, -0.37, 1.19)),
    k(0.65),
], L=[k(0, p=A(0.04, -0.33, 1.17), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam+0.4*atas")],
  cara="Seperti THOUSAND tetapi diketuk dua kali, bergerak dari pangkal ke ujung telapak kiri.")

_r = [k(0, p=A(-0.01, -0.38, 1.32), a="telapak", b="BENT_B", j="dalam+0.5*depan", tp="bawah"),
      k(0.15), k(0.55, p=A(-0.01, -0.38, 1.24)), k(0.75)]
_l = [k(0, p=A(0.02, -0.38, 1.18), a="telapak", b="BENT_B", j="dalam+0.5*depan", tp="atas"), k(0.75)]
S("B14_DISCOUNT", "Diskon / potongan harga", "Uang", _r, L=_l, gloss="DISCOUNT",
  cara="Dua tangan B bengkok berhadapan atas-bawah; tangan atas turun mendekat — jaraknya (harga) mengecil.")

# ── Sesi 10: waktu & durasi (angka menyatu) ────────────────────────────────

S("B14_TWO_WEEK", "Dua minggu", "Waktu", [
    k(0, p=A(0.035, -0.30, 1.20), a="jari_tengah", b="V", j="depan+0.5*dalam", tp="bawah+0.3*dalam"),
    k(0.15),
    k(0.55, p=A(0.0, -0.46, 1.20)),
    k(0.75),
], L=[k(0, p=A(0.045, -0.36, 1.17), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas+0.3*luar")],
  cara="Seperti WEEK, tetapi memakai angka 2 (bentuk V) yang digeser di telapak kiri — angka menyatu dengan isyarat.")

S("B14_TWO_HOUR", "Dua jam", "Waktu",
  [k(0, p=A(0.035, -0.38, 1.32), a="ujung", b="V", j="dalam+0.6*atas", tp="dalam")]
  + lingkar(0.12, 0.95, A(0.035, -0.385, 1.27), 0.045, "dalam", "atas", n=8, mulai=90,
            a="ujung", b="V", j="dalam+0.6*atas", tp="dalam")
  + [k(1.1)],
  L=[k(0, p=A(0.05, -0.37, 1.27), **_KIRI_TEGAK)],
  cara="Seperti HOUR (jarum memutar telapak kiri), tetapi memakai angka 2 (V) — 'dua jam'.")

S("B14_SCHEDULE", "Jadwal", "Waktu", [
    k(0, p=A(0.02, -0.38, 1.33), a="ujung", b="4", j="dalam+0.3*depan", tp="belakang+0.6*dalam"),
    k(0.15),
    k(0.4, p=A(0.02, -0.38, 1.22)),
    k(0.5, p=A(0.0, -0.36, 1.30), j="atas+0.3*depan", tp="dalam"),
    k(0.8, p=A(0.04, -0.36, 1.21), j="atas+0.3*depan", tp="dalam"),
    k(0.95),
], L=[k(0, p=A(0.05, -0.37, 1.27), **_KIRI_TEGAK)],
  cara="Jari-jari bentuk 4 menggores telapak kiri ke bawah, lalu melintang — membentuk tabel/kisi.")

# ── Sesi 11: persen, pecahan, naik-turun ───────────────────────────────────

S("B14_PERCENT", "Persen", "Angka", [
    k(0, p="angka+0.02*atas", a="telapak", b="O", j="atas", tp="dalam+0.3*depan"),
    k(0.15),
    k(0.32, p="angka+0.05*luar+0.03*atas"),
    k(0.65, p="angka+0.01*dalam+0.08*bawah", kurva=True),
    k(0.85),
], cara="Tangan O (dekat posisi angka) bergerak sedikit ke samping lalu turun miring, seperti menulis garis miring %.")

S("B14_HALF", "Setengah / ½", "Angka", [
    k(0, p="angka+0.04*atas", a="telapak", b="1", j="atas", tp="belakang+0.15*dalam"),
    k(0.15),
    k(0.45, p="angka+0.06*bawah", b="V"),
    k(0.7),
], cara="Pecahan: angka 1 di atas lalu turun berubah menjadi 2 — 'satu per dua'.")

S("B14_INCREASE", "Naik / bertambah", "Angka", [
    k(0, p=A(-0.06, -0.38, 1.22), a="ujung", b="H", j="depan+0.5*dalam", tp="atas"),
    k(0.15),
    k(0.5, p=A(0.0, -0.40, 1.29), tp="bawah", kurva=True),
    k(0.7),
], L=[k(0, p=A(0.02, -0.40, 1.24), a="ujung", b="H", j="dalam+0.6*depan", tp="bawah")],
  cara="Bentuk H kanan (telapak ke atas) dibalik dan mendarat di atas H kiri — tumpukan bertambah.")

S("B14_DECREASE", "Turun / berkurang", "Angka", [
    k(0, p=A(0.0, -0.40, 1.27), a="ujung", b="H", j="dalam+0.6*depan", tp="bawah"),
    k(0.15),
    k(0.5, p=A(-0.07, -0.38, 1.22), tp="atas", kurva=True),
    k(0.7),
], L=[k(0, p=A(0.02, -0.40, 1.24), a="ujung", b="H", j="dalam+0.6*depan", tp="bawah")],
  cara="Kebalikan INCREASE: H kanan di atas H kiri diangkat dan dibalik menjauh — tumpukan berkurang.")

# ── Sesi 12: peringkat & ukuran ────────────────────────────────────────────

S("B14_CHAMPION", "Juara", "Peringkat", [
    k(0, p=A(0.03, -0.40, 1.40), a="telapak", b="CLAW", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.45, p=A(0.04, -0.40, 1.32)),
    k(0.7),
], L=[k(0, **IST["L"]), k(0.15, p=A(0.04, -0.40, 1.22), a="telunjuk", b="1", j="atas", tp="dalam"), k(0.7)],
  wajah="senang", cara="Tangan cakar (mahkota) diturunkan ke ujung telunjuk kiri yang tegak (orangnya).")

S("B14_WEIGHT", "Berat badan / menimbang", "Ukuran", [
    k(0, p=A(0.0, -0.40, 1.27), a="jari_tengah", b="H", j="dalam+0.5*depan", tp="bawah+0.3*belakang"),
    *bolak(0.15, 0.15, 4, {"putar": 15, "p": A(0.0, -0.40, 1.265)}, {"putar": -15, "p": A(0.0, -0.40, 1.27)}),
    k(0.8, putar=0),
], L=[k(0, p=A(0.03, -0.40, 1.245), a="jari_telunjuk", b="H", j="dalam+0.6*depan", tp="belakang+0.3*bawah")],
  cara="Jari tengah bentuk H kanan bertumpu di atas H kiri lalu bergoyang seperti jarum timbangan.")

_r = [k(0, p=A(-0.03, -0.36, 1.24), a="telapak", b="A", j="depan+0.4*atas", tp="dalam"),
      k(0.15), k(0.65, p=A(-0.06, -0.58, 1.27), kurva=True), k(0.85)]
_l = [k(0, p=A(0.03, -0.36, 1.24), a="telapak", b="A", j="depan+0.4*atas", tp="dalam"), k(0.85)]
S("B14_FAR", "Jauh", "Ukuran", _r, L=_l, gloss="FAR",
  cara="Dua kepalan A berdampingan, tangan kanan bergerak jauh ke depan; mulut 'AH' / mata menyipit = jauh sekali.")
