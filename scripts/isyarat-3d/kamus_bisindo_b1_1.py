# [isyarat-b1b2-v1] Kamus isyarat BISINDO B1.1 "Ruang Isyarat & Tata Bahasa Visual".
# Tangan dominan kanan. Format sama dengan kamus_bisindo.py.
# ⚠️ Rujukan daring kosakata BISINDO B1 sangat sedikit. Isyarat penunjuk & penggambar
#    (classifier) ditulis dari prinsip ikonik umum bahasa isyarat; kosakata lain dari
#    prinsip ikonik BISINDO + gerak bibir dan DITANDAI ragu=True — WAJIB dicek pengajar Tuli
#    (variasi daerah besar). Bentuk ASL sengaja TIDAK disalin.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I


def _sym(keys):
    return dict(R=keys, L=cermin(keys))


# titik ruang (tangan kanan): kanan-depan & kiri-depan
_KANAN = A(-0.20, -0.42, 1.25)
_KIRI = A(0.10, -0.42, 1.25)
# telapak kiri datar menghadap atas di depan badan (alas / patokan)
_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"

# ── Ruang isyarat & penunjuk ───────────────────────────────────────────────

S("B11_TUNJUK_KANAN", "Dia / itu (di titik kanan)", "Ruang isyarat", [
    k(0, p="netral+0.04*atas", a="telunjuk", b="1", j="depan+0.3*luar", tp="bawah"),
    k(0.15),
    k(0.45, p=_KANAN, j="depan+0.6*luar"),
    k(0.55, p=_KANAN + A(0.0, 0.02, 0.0)),
    k(0.65, p=_KANAN),
    k(0.9),
], gloss="TUNJUK-KANAN",
  cara="Telunjuk menunjuk mantap ke titik di kanan-depan — menaruh atau merujuk orang/benda di titik itu; mata ikut melihat titiknya.")

S("B11_TUNJUK_KIRI", "Dia / itu (di titik kiri)", "Ruang isyarat", [
    k(0, p="netral+0.04*atas", a="telunjuk", b="1", j="depan", tp="bawah"),
    k(0.15),
    k(0.45, p=_KIRI, j="depan+0.6*dalam"),
    k(0.55, p=_KIRI + A(0.0, 0.02, 0.0)),
    k(0.65, p=_KIRI),
    k(0.9),
], gloss="TUNJUK-KIRI",
  cara="Telunjuk menunjuk mantap ke titik di kiri-depan — titik kedua dalam ruang isyarat.")

S("B11_DI_SINI", "Di sini", "Ruang isyarat", [
    k(0, p="netral+0.06*atas+0.04*depan", a="telunjuk", b="1", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.3, p="netral+0.06*bawah+0.04*depan"),
    k(0.42, p="netral+0.02*atas+0.04*depan"),
    k(0.55, p="netral+0.06*bawah+0.04*depan"),
    k(0.8),
], gloss="DI-SINI", cara="Telunjuk menunjuk ke bawah di depan badan dan diketuk dua kali — tempat ini.")

S("B11_DI_SANA", "Di sana", "Ruang isyarat", [
    k(0, p="netral+0.06*atas", a="telunjuk", b="1", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.55, p="netral+0.14*atas+0.18*depan+0.04*luar", j="depan+0.45*atas"),
    k(0.85),
], kepala=[(0.15, 0, 0, 0), (0.5, -4, -6, 0)], gloss="DI-SANA",
  cara="Telunjuk menunjuk jauh ke depan-atas, mata memandang ke arah yang sama, kadang mata agak menyipit untuk 'jauh'.")

S("B11_TARUH", "Menaruh / meletakkan", "Ruang isyarat", [
    k(0, p="netral+0.10*atas+0.02*depan", a="ujung", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.55, p=_KANAN + A(0.0, 0.0, -0.02)),
    k(0.85),
], gloss="TARUH", ragu=True,
  cara="Jari menguncup seperti memegang benda kecil, lalu diturunkan mantap di titik ruang — benda ditaruh di situ.")

# ── Kata kerja berarah ─────────────────────────────────────────────────────

S("B11_MEMANGGIL", "Memanggil (ke arah sini)", "Kata kerja berarah", [
    k(0, p=_KANAN + A(0.0, 0.0, 0.06), a="telapak", b="FLAT", j="depan+0.3*luar", tp="bawah"),
    *bolak(0.15, 0.13, 4, {"b": "BENT_B"}, {"b": "FLAT"}),
    k(0.7, p="netral+0.06*atas+0.02*depan", b="BENT_B"),
    k(0.9),
], gloss="MEMANGGIL", ragu=True,
  cara="Telapak menghadap bawah, jari dikibas-kibaskan ke arah badan (gaya memanggil orang Indonesia), dari titik orangnya ke diri sendiri.")

S("B11_MEMINJAM", "Meminjam (dari dia ke aku)", "Kata kerja berarah", [
    k(0, p=_KANAN, a="telapak", b="5", j="depan+0.3*atas", tp="bawah+0.4*dalam"),
    k(0.15),
    k(0.3, b="S"),
    k(0.7, p="dada+0.10*depan", j="atas+0.4*depan", tp="belakang+0.4*dalam"),
    k(0.9),
], gloss="PINJAM", ragu=True,
  cara="Tangan terbuka di titik orang lain menggenggam lalu ditarik ke dada — arah gerak menunjukkan siapa meminjam dari siapa.")

S("B11_MENATAP", "Melihat ke arah / menatap", "Kata kerja berarah", [
    k(0, p="mata+0.05*depan+0.01*bawah", a="telapak", b="V", j="depan", tp="bawah"),
    k(0.15),
    k(0.6, p=_KANAN + A(0.0, 0.0, 0.08), j="depan+0.5*luar"),
    k(0.9),
], kepala=[(0.15, 0, 0, 0), (0.55, 0, -10, 0)], gloss="LIHAT-KE", ragu=True,
  cara="Jari V (dua mata) dari depan mata diarahkan ke titik yang dilihat; kepala ikut menoleh.")

# ── Penggambar: bentuk & ukuran ────────────────────────────────────────────

S("B11_TEBAL", "Tebal", "Penggambar", [
    k(0, p="netral+0.06*atas+0.04*depan", a="telapak", b="C", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.35, p="netral+0.06*atas+0.06*depan"),
    k(0.55, p="netral+0.06*atas+0.04*depan"),
    k(0.85),
], wajah="ya_tidak", gloss="TEBAL", ragu=True,
  cara="Ibu jari dan jari-jari melengkung (bentuk C) berjarak lebar seperti menjepit benda tebal, pipi agak menggembung.")

S("B11_TIPIS", "Tipis", "Penggambar", [
    k(0, p="netral+0.06*atas+0.04*depan", a="telapak", b="G", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.35, p="netral+0.06*atas+0.06*depan"),
    k(0.55, p="netral+0.06*atas+0.04*depan"),
    k(0.85),
], gloss="TIPIS", ragu=True,
  cara="Ibu jari dan telunjuk sejajar hampir bersentuhan seperti menjepit kertas tipis; bibir dirapatkan.")

_LEBAR = [
    k(0, p=A(-0.05, -0.38, 1.24), a="telapak", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.20, -0.38, 1.24)),
    k(0.85),
]
S("B11_LEBAR", "Lebar / luas", "Penggambar", **_sym(_LEBAR), gloss="LEBAR", wajah="senang", ragu=True,
  cara="Dua telapak berhadapan di depan badan lalu menjauh ke samping — makin jauh makin lebar.")

_SEMPIT = [
    k(0, p=A(-0.14, -0.38, 1.24), a="telapak", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.035, -0.38, 1.24)),
    k(0.85),
]
S("B11_SEMPIT", "Sempit", "Penggambar", **_sym(_SEMPIT), gloss="SEMPIT", wajah="sedih", ragu=True,
  cara="Dua telapak berhadapan saling mendekat sampai jaraknya sempit, wajah agak meringis.")

_KOTAK = [
    k(0, p=A(-0.03, -0.40, 1.30), a="telapak", b="FLAT", j="depan", tp="bawah"),
    k(0.12),
    k(0.4, p=A(-0.12, -0.40, 1.30)),
    k(0.5, p=A(-0.12, -0.40, 1.30), j="depan", tp="dalam"),
    k(0.8, p=A(-0.12, -0.40, 1.18)),
    k(1.0),
]
S("B11_KOTAK", "Kotak / berbentuk kotak", "Penggambar", **_sym(_KOTAK), gloss="KOTAK", ragu=True,
  cara="Dua tangan datar menggambar sisi atas kotak (bergerak ke samping), lalu berputar dan turun menggambar sisi kanan-kiri.")

_BENTUK = [
    k(0, p=A(-0.02, -0.40, 1.34), a="telunjuk", b="1", j="depan+0.4*atas", tp="bawah"),
    k(0.12),
    k(0.4, p=A(-0.13, -0.40, 1.30)),
    k(0.65, p=A(-0.13, -0.40, 1.18)),
    k(0.85, p=A(-0.02, -0.40, 1.16)),
    k(1.0),
]
S("B11_BENTUK", "Bentuk (menggambar garis luar)", "Penggambar", **_sym(_BENTUK), gloss="BENTUK", ragu=True,
  cara="Dua telunjuk mulai dari tengah-atas lalu menelusuri garis luar benda di udara sampai bertemu di bawah.")

# ── Penggambar: lokasi & isi ruangan ───────────────────────────────────────

_LEMARI = [
    k(0, p=A(-0.03, -0.38, 1.32), a="telapak", b="FLAT", j="atas", tp="depan"),
    k(0.12),
    k(0.4, p=A(-0.03, -0.38, 1.14)),
    k(0.5),
    k(0.85, p=A(-0.15, -0.34, 1.20), tp="depan+0.9*dalam"),
    k(1.0),
]
S("B11_LEMARI", "Lemari", "Ruangan", **_sym(_LEMARI), gloss="LEMARI", ragu=True,
  cara="Dua telapak tegak berdampingan turun (pintu lemari yang tinggi), lalu membuka ke samping seperti dua daun pintu lemari.")

S("B11_TEMPAT_TIDUR", "Tempat tidur / kasur", "Ruangan", [
    k(0, p="pipi+0.012*depan", a="telapak", b="FLAT", j="atas+0.3*belakang", tp="dalam"),
    k(0.25),
    k(0.45, p=A(-0.02, -0.40, 1.18), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.8, p=A(-0.20, -0.36, 1.18)),
    k(0.95),
], kepala=[(0, 0, 0, 0), (0.12, 0, 0, -12), (0.35, 0, 0, -12), (0.55, 0, 0, 0)], gloss="TEMPAT-TIDUR", ragu=True,
  cara="Telapak di pipi dengan kepala miring (TIDUR), lalu telapak datar menyapu ke samping menggambar permukaan kasur.")

S("B11_JENDELA", "Jendela", "Ruangan", [
    k(0, p=A(-0.03, -0.40, 1.34), a="telapak", b="FLAT", j="atas", tp="belakang"),
    k(0.15),
    k(0.6, p=A(-0.13, -0.42, 1.34), tp="belakang+1.2*dalam"),
    k(0.85),
], L=cermin([
    k(0, p=A(-0.03, -0.40, 1.34), a="telapak", b="FLAT", j="atas", tp="belakang"),
    k(0.15),
    k(0.6, p=A(-0.13, -0.42, 1.34), tp="belakang+1.2*dalam"),
    k(0.85),
]), gloss="JENDELA", ragu=True,
  cara="Dua telapak tegak menghadap badan setinggi bahu, lalu dibuka ke depan-samping seperti daun jendela.")

S("B11_PINTU", "Pintu", "Ruangan", [
    k(0, p=A(-0.02, -0.40, 1.27), a="sisi_telunjuk", b="FLAT", j="atas", tp="depan"),
    k(0.15),
    k(0.6, p=A(-0.04, -0.33, 1.27), j="atas", tp="dalam+0.3*depan"),
    k(0.75),
    k(0.95, p=A(-0.02, -0.40, 1.27), tp="depan"),
], L=[k(0, p=A(0.03, -0.40, 1.27), a="sisi_telunjuk", b="FLAT", j="atas", tp="depan")],
  gloss="PINTU", ragu=True,
  cara="Dua telapak tegak berdampingan; tangan kanan berayun membuka ke arah badan seperti daun pintu pada engselnya, lalu menutup lagi.")

_KAMAR = [
    k(0, p=A(-0.06, -0.48, 1.24), a="telapak", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.45, p=A(-0.06, -0.30, 1.24)),
    k(0.55, p=A(-0.10, -0.46, 1.24), j="dalam", tp="belakang"),
    k(0.85, p=A(-0.10, -0.30, 1.24), tp="depan"),
    k(1.0),
]
S("B11_KAMAR", "Kamar / ruangan", "Ruangan", **_sym(_KAMAR), gloss="KAMAR", ragu=True,
  cara="Dua telapak menggambar dinding kanan-kiri, lalu dinding depan dan belakang — empat dinding sebuah ruangan.")

S("B11_DAPUR", "Dapur", "Ruangan",
  [k(0, p=_ALAS + A(-0.01, -0.01, 0.06), a="ujung", b="A", j="bawah+0.3*depan", tp="belakang")] +
  lingkar(0.12, 0.8, _ALAS + A(-0.01, -0.01, 0.06), 0.035, "depan", "dalam", n=8, mulai=0, putaran=2) + [k(0.95)],
  L=[k(0, p=_ALAS + A(0.0, 0.0, -0.01), a="telapak", b="C", j="dalam+0.5*depan", tp="atas")],
  gloss="DAPUR", ragu=True,
  cara="Tangan kiri seperti wajan, tangan kanan menggenggam sodet dan mengaduk melingkar (MASAK) — tempat memasak; ucapkan 'dapur'.")

S("B11_TANGGA", "Tangga", "Ruangan", [
    k(0, p=A(-0.04, -0.34, 1.14), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.12),
    k(0.25, p=A(-0.04, -0.39, 1.14)),
    k(0.33, p=A(-0.04, -0.39, 1.20)),
    k(0.46, p=A(-0.04, -0.44, 1.20)),
    k(0.54, p=A(-0.04, -0.44, 1.26)),
    k(0.67, p=A(-0.04, -0.49, 1.26)),
    k(0.9),
], gloss="TANGGA", ragu=True,
  cara="Telapak datar menghadap bawah bergerak naik bertahap seperti anak tangga — maju, naik, maju, naik.")

# ── Penggambar: gerak & jalur ──────────────────────────────────────────────

S("B11_KENDARAAN", "Kendaraan (penggambar mobil/motor)", "Penggambar", [
    k(0, p=A(-0.06, -0.30, 1.20), a="telapak", b="FLAT", j="depan", tp="bawah"),
    k(0.15),
    k(0.7, p=A(-0.06, -0.50, 1.20)),
    k(0.9),
], gloss="KENDARAAN-JALAN", ragu=True,
  cara="Tangan datar telapak ke bawah mewakili kendaraan, didorong maju lurus ke depan; jalur gerak = jalur kendaraan.")

S("B11_BERHENTI", "Berhenti", "Penggambar", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.16), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.4, p=_ALAS + A(-0.01, -0.01, 0.012)),
    k(0.75),
], L=_L_ALAS, gloss="BERHENTI", ragu=True,
  cara="Sisi kelingking tangan kanan dijatuhkan tegas ke telapak kiri — gerak terhenti mendadak.")

S("B11_MENYALIP", "Menyalip", "Penggambar", [
    k(0, p=A(-0.05, -0.28, 1.19), a="telapak", b="FLAT", j="depan", tp="bawah"),
    k(0.15),
    k(0.4, p=A(-0.09, -0.38, 1.20)),
    k(0.7, p=A(-0.03, -0.52, 1.19)),
    k(0.9),
], L=[k(0, p=A(0.04, -0.36, 1.19), a="telapak", b="FLAT", j="depan", tp="bawah"),
      k(0.15), k(0.7, p=A(0.04, -0.42, 1.19)), k(0.9)],
  gloss="MENYALIP", ragu=True,
  cara="Dua tangan datar = dua kendaraan; tangan kanan dari belakang berbelok keluar, melewati tangan kiri, lalu masuk lagi di depannya.")

S("B11_BERPAPASAN", "Berpapasan (dua orang)", "Penggambar", [
    k(0, p=A(-0.06, -0.52, 1.24), a="pergelangan", b="1", j="atas", tp="belakang"),
    k(0.15),
    k(0.8, p=A(-0.06, -0.28, 1.24)),
    k(0.95),
], L=[k(0, p=A(0.03, -0.28, 1.24), a="pergelangan", b="1", j="atas", tp="depan"),
      k(0.15), k(0.8, p=A(0.03, -0.52, 1.24)), k(0.95)],
  gloss="BERPAPASAN", ragu=True,
  cara="Dua telunjuk tegak = dua orang; satu datang dari depan, satu dari dekat badan, lalu saling melewati.")

S("B11_CEPAT", "Cepat", "Penggambar", [
    k(0, p="netral+0.08*atas", a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah"),
    k(0.12),
    k(0.28, p="netral+0.08*atas+0.14*depan+0.06*dalam"),
    k(0.6),
], wajah="ya_tidak", gloss="CEPAT", ragu=True,
  cara="Telunjuk dilesatkan cepat ke depan dalam satu gerak tajam, bibir seperti mengucap 'wus'.")

# ── Wajah, bibir & membaca ─────────────────────────────────────────────────

S("B11_EKSPRESI", "Ekspresi wajah", "Wajah",
  [k(0, p="hidung+0.08*depan+0.10*luar", a="telunjuk", b="1", j="atas+0.4*depan", tp="dalam")] +
  lingkar(0.12, 0.85, "hidung+0.08*depan+0.01*bawah", 0.10, "luar", "atas", n=10, mulai=0, putaran=1) + [k(1.0)],
  wajah="senang", gloss="EKSPRESI", ragu=True,
  cara="Telunjuk menelusuri lingkar wajah (dahi–pipi–dagu) dari jarak dekat — wajah ikut berubah-ubah.")

S("B11_GERAK_BIBIR", "Gerak bibir (mouthing)", "Wajah", [
    k(0, p="mulut+0.05*depan+0.03*luar", a="telunjuk", b="1", j="dalam+0.3*atas", tp="belakang"),
    k(0.12),
    *bolak(0.22, 0.14, 4, {"p": "mulut+0.05*depan+0.03*dalam"}, {"p": "mulut+0.05*depan+0.03*luar"}),
    k(0.85),
], gloss="GERAK-BIBIR", ragu=True,
  cara="Telunjuk menyapu bolak-balik di depan bibir yang bergerak mengucap kata tanpa suara.")

S("B11_MEMBACA", "Membaca", "Wajah", [
    k(0, p=_ALAS + A(-0.01, -0.02, 0.10), a="ujung", b="V", j="bawah+0.4*depan", tp="belakang"),
    k(0.15),
    *bolak(0.25, 0.16, 4, {"p": _ALAS + A(-0.01, -0.02, 0.05)}, {"p": _ALAS + A(-0.01, -0.06, 0.08)}),
    k(0.95),
], L=[k(0, p=_ALAS + A(0, 0, 0.02), a="telapak", b="FLAT", j="atas+0.6*depan", tp="belakang+0.4*atas")],
  gloss="MEMBACA", ragu=True,
  cara="Telapak kiri seperti buku; dua jari V (mata) menyusuri baris-baris di telapak kiri ke bawah.")

S("B11_TENTANG", "Tentang / soal", "Topik", [
    k(0, p=_ALAS + A(-0.01, -0.03, 0.06), a="ujung", b="FLAT_O", j="dalam+0.3*bawah", tp="belakang"),
    *lingkar(0.12, 0.72, _ALAS + A(-0.01, -0.03, 0.06), 0.03, "depan", "dalam", n=8, mulai=0, putaran=1.5),
    k(0.9),
], L=[k(0, p=_ALAS + A(0, 0, 0.03), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="dalam")],
  gloss="TENTANG", ragu=True,
  cara="Jari kanan menguncup berputar mengelilingi telapak kiri — membicarakan hal di sekitar satu topik; ucapkan 'tentang'.")

# ── Aspek & waktu ──────────────────────────────────────────────────────────

S("B11_BERKALI_KALI", "Berkali-kali / berulang", "Aspek", [
    k(0, p=_ALAS + A(-0.01, 0.03, 0.06), a="ujung", b="BENT_B", j="bawah+0.3*depan", tp="belakang"),
    k(0.1, p=_ALAS + A(-0.01, 0.03, 0.012)),
    k(0.22, p=_ALAS + A(-0.01, 0.0, 0.06)),
    k(0.32, p=_ALAS + A(-0.01, 0.0, 0.012)),
    k(0.44, p=_ALAS + A(-0.01, -0.03, 0.06)),
    k(0.54, p=_ALAS + A(-0.01, -0.03, 0.012)),
    k(0.66, p=_ALAS + A(-0.01, -0.06, 0.06)),
    k(0.76, p=_ALAS + A(-0.01, -0.06, 0.012)),
    k(0.95),
], L=_L_ALAS, gloss="BERKALI-KALI", ragu=True,
  cara="Ujung jari kanan mengetuk telapak kiri berkali-kali sambil bergeser maju — setiap ketukan satu kejadian.")

S("B11_MENUNGGU", "Menunggu", "Aspek", [
    k(0, p=A(-0.07, -0.32, 1.20), a="telapak", b="5", j="depan+0.4*dalam", tp="atas"),
    *bolak(0.15, 0.18, 5, {"b": "CLAW"}, {"b": "5"}),
    k(1.0),
], L=cermin([k(0, p=A(-0.07, -0.32, 1.20), a="telapak", b="5", j="depan+0.4*dalam", tp="atas")]),
  kepala=[(0.1, 0, 0, 0), (0.4, 0, 0, 6), (0.9, 0, 0, 6)], wajah="sedih", gloss="MENUNGGU", ragu=True,
  cara="Dua tangan terbuka menghadap atas di depan badan, jari-jari bergerak pelan berulang; kepala agak miring dan wajah jenuh.")

S("B11_RENCANA", "Rencana", "Waktu", [
    k(0, p=A(-0.06, -0.32, 1.24), a="telapak", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.35, p=A(-0.06, -0.38, 1.22)),
    k(0.55, p=A(-0.06, -0.44, 1.24)),
    k(0.75, p=A(-0.06, -0.50, 1.22)),
    k(0.9),
], L=cermin([
    k(0, p=A(-0.06, -0.32, 1.24), a="telapak", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.35, p=A(-0.06, -0.38, 1.22)),
    k(0.55, p=A(-0.06, -0.44, 1.24)),
    k(0.75, p=A(-0.06, -0.50, 1.22)),
    k(0.9),
]), gloss="RENCANA", ragu=True,
  cara="Dua telapak sejajar berhadapan bergerak maju bertahap ke depan — langkah-langkah ke masa depan; ucapkan 'rencana'.")

S("B11_MINGGU_DEPAN", "Minggu depan", "Waktu", [
    k(0, p=_ALAS + A(0.03, 0.04, 0.012), a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah"),
    k(0.12),
    k(0.4, p=_ALAS + A(-0.05, -0.05, 0.012)),
    k(0.75, p="bahu_kanan+0.30*depan+0.02*atas", j="depan+0.3*atas"),
    k(0.95),
], L=_L_ALAS, gloss="MINGGU-DEPAN", ragu=True,
  cara="Telunjuk menyusuri telapak kiri (satu minggu), lalu melengkung maju ke depan — waktu yang akan datang ada di depan.")

S("B11_MINGGU_LALU", "Minggu lalu", "Waktu", [
    k(0, p=_ALAS + A(0.03, 0.04, 0.012), a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah"),
    k(0.12),
    k(0.4, p=_ALAS + A(-0.05, -0.05, 0.012)),
    k(0.75, p="bahu_kanan+0.04*depan+0.06*atas", a="telunjuk", b="1", j="belakang+0.6*atas", tp="dalam"),
    k(0.95),
], L=_L_ALAS, gloss="MINGGU-LALU", ragu=True,
  cara="Telunjuk menyusuri telapak kiri (satu minggu), lalu menunjuk ke belakang lewat bahu — waktu yang sudah lewat ada di belakang.")

# ── Jumlah & kelompok ──────────────────────────────────────────────────────

S("B11_SEBAGIAN", "Sebagian", "Jumlah", [
    k(0, p=_ALAS + A(0.0, 0.02, 0.10), a="sisi_kelingking", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.45, p=_ALAS + A(0.0, 0.02, 0.012)),
    k(0.75, p=_ALAS + A(-0.08, -0.04, 0.03)),
    k(0.9),
], L=_L_ALAS, gloss="SEBAGIAN", ragu=True,
  cara="Sisi kelingking kanan memotong telapak kiri di tengah lalu menyisihkan satu bagian ke samping.")

_KELOMPOK = lingkar(0, 0.85, A(-0.06, -0.40, 1.22), 0.07, "depan", "luar", n=10, mulai=270, putaran=0.5,
                    a="telapak", b="CLAW", j="bawah+0.4*depan", tp="bawah+0.5*dalam") + [k(1.0)]
S("B11_KELOMPOK", "Kelompok / grup", "Jumlah", **_sym(_KELOMPOK), gloss="KELOMPOK", ragu=True,
  cara="Dua tangan cakar menghadap bawah dari depan bergerak melingkar ke arah badan — melingkari sekumpulan orang.")

# ── Membandingkan ──────────────────────────────────────────────────────────

S("B11_BANDING", "Membandingkan", "Bandingkan", [
    k(0, p=A(-0.13, -0.38, 1.24), a="telapak", b="FLAT", j="depan", tp="atas"),
    *bolak(0.15, 0.17, 4, {"p": A(-0.13, -0.38, 1.29)}, {"p": A(-0.13, -0.38, 1.20)}),
    k(0.9, p=A(-0.13, -0.38, 1.24)),
], L=cermin([
    k(0, p=A(-0.13, -0.38, 1.24), a="telapak", b="FLAT", j="depan", tp="atas"),
    *bolak(0.15, 0.17, 4, {"p": A(-0.13, -0.38, 1.20)}, {"p": A(-0.13, -0.38, 1.29)}),
    k(0.9, p=A(-0.13, -0.38, 1.24)),
]), kepala=[(0.15, 0, 6, 0), (0.5, 0, -6, 0), (0.85, 0, 0, 0)], gloss="BANDING", ragu=True,
  cara="Dua telapak menghadap atas di kanan & kiri naik-turun bergantian seperti timbangan; mata melirik ke kedua sisi.")

S("B11_JELAS", "Jelas", "Klarifikasi", [
    k(0, p="dada+0.18*depan+0.08*atas+0.04*luar", a="ujung", b="FLAT_O", j="atas+0.4*depan", tp="depan"),
    k(0.15),
    k(0.55, p="dada+0.20*depan+0.14*atas+0.16*luar", b="5", j="atas+0.4*luar"),
    k(0.85),
], L=cermin([
    k(0, p="dada+0.18*depan+0.08*atas+0.04*luar", a="ujung", b="FLAT_O", j="atas+0.4*depan", tp="depan"),
    k(0.15),
    k(0.55, p="dada+0.20*depan+0.14*atas+0.16*luar", b="5", j="atas+0.4*luar"),
    k(0.85),
]), wajah="senang", gloss="JELAS", ragu=True,
  cara="Dua tangan kuncup di depan dada atas lalu membuka lebar ke samping — terang dan jelas terlihat.")

S("B11_MAKSUD", "Maksud / maksudnya", "Klarifikasi", [
    k(0, p=_DAHI + "+0.04*depan", a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang"),
    k(0.18, p=_DAHI),
    k(0.3),
    k(0.7, p="netral+0.10*atas+0.10*depan", a="telunjuk", b="1", j="depan+0.3*atas", tp="dalam"),
    k(0.9),
], wajah="wh", gloss="MAKSUD", ragu=True,
  cara="Telunjuk menyentuh pelipis lalu diarahkan ke depan (ke lawan bicara), alis berkerut — 'maksudnya apa?'; ucapkan 'maksud'.")

S("B11_GAMBAR", "Menggambar / gambar", "Proyek", [
    k(0, p=_ALAS + A(0.0, -0.02, 0.03), a="telunjuk", b="1", j="bawah+0.5*depan", tp="belakang"),
    k(0.12),
    k(0.3, p=_ALAS + A(-0.04, -0.05, 0.015)),
    k(0.48, p=_ALAS + A(0.02, -0.08, 0.015)),
    k(0.66, p=_ALAS + A(-0.03, -0.10, 0.015)),
    k(0.9),
], L=[k(0, p=_ALAS + A(0, 0, 0.0), a="telapak", b="FLAT", j="depan+0.5*dalam", tp="atas+0.3*belakang")],
  gloss="GAMBAR", ragu=True,
  cara="Telunjuk kanan bergerak berkelok di atas telapak kiri seperti menggambar di kertas.")

# ── Kata umum pendukung dialog B1.1 ─────────────────────────────────────────

S("B11_ADA", "Ada / punya", "Umum", [
    k(0, p="netral+0.10*atas+0.04*depan", a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.45, p="netral+0.02*atas+0.04*depan", b="S"),
    k(0.75),
], kepala=[(0.2, 0, 0, 0), (0.45, 6, 0, 0), (0.7, 0, 0, 0)], gloss="ADA", ragu=True,
  cara="Tangan terbuka menghadap bawah turun sedikit sambil menggenggam mantap dan mengangguk kecil; ucapkan 'ada'.")

S("B11_MASUK", "Masuk", "Umum", [
    k(0, p=A(-0.06, -0.26, 1.27), a="ujung", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.6, p=A(0.0, -0.44, 1.25)),
    k(0.85),
], L=[k(0, p=A(0.04, -0.38, 1.25), a="telapak", b="C", j="depan+0.4*dalam", tp="dalam")],
  gloss="MASUK", ragu=True,
  cara="Tangan kiri membentuk lubang (C); tangan kanan datar meluncur maju masuk melewatinya; ucapkan 'masuk'.")

S("B11_BARU", "Baru", "Umum", [
    k(0, p=_ALAS + A(-0.01, -0.02, 0.03), a="ujung", b="FLAT_O", j="atas", tp="dalam"),
    k(0.15),
    k(0.55, p=_ALAS + A(-0.01, -0.02, 0.14), b="5", j="atas+0.2*depan"),
    k(0.85),
], L=_L_ALAS, wajah="senang", gloss="BARU", ragu=True,
  cara="Jari kuncup di atas telapak kiri naik sambil mekar terbuka — sesuatu yang baru muncul; ucapkan 'baru'.")

_PINDAH = [
    k(0, p=A(-0.16, -0.40, 1.22), a="ujung", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.45, p=A(-0.06, -0.42, 1.30)),
    k(0.75, p=A(0.04, -0.40, 1.22)),
    k(0.95),
]
S("B11_PINDAH", "Pindah", "Umum", R=_PINDAH,
  L=[{**kk, "p": kk["p"] + A(0.10, 0, 0)} if "p" in kk else kk for kk in _PINDAH],
  gloss="PINDAH", ragu=True,
  cara="Dua tangan kuncup seperti mengangkat barang, dipindahkan melengkung dari titik kanan ke titik kiri.")

_TERANG = [
    k(0, p=A(-0.08, -0.32, 1.46), a="ujung", b="FLAT_O", j="depan+0.4*bawah", tp="bawah"),
    k(0.15),
    k(0.55, p=A(-0.20, -0.36, 1.36), b="5", j="depan+0.5*bawah+0.4*luar"),
    k(0.85),
]
S("B11_TERANG", "Terang", "Umum", **_sym(_TERANG), wajah="senang", gloss="TERANG", ragu=True,
  cara="Dua tangan kuncup di depan atas wajah lalu membuka ke bawah-samping seperti cahaya memancar.")
