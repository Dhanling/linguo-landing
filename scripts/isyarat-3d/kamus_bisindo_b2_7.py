# [isyarat-b1b2-v1] Kamus isyarat BISINDO B2.7 "Presentasi Formal & Wacana Publik".
# Register formal, susunan presentasi, alat bantu visual, istilah bidang (hukum, teknologi),
# sambutan, wawancara & berita, kebijakan publik, isu global, keberagaman, tanya jawab,
# memimpin rapat, laporan & ringkasan.
# Tangan dominan = kanan (R), tangan pasif = kiri (L).
#
# ⚠️ Rujukan tertulis BISINDO untuk kosakata B2.7 praktis tidak ada. Bentuk di sini ditulis
#    dari prinsip ikonik umum BISINDO + gerak bibir dan HAMPIR SEMUA ditandai ragu=True —
#    WAJIB dicek pengajar Tuli (variasi daerah besar). Bentuk ASL sengaja TIDAK disalin.
#    Istilah yang di komunitas sering dieja (teknologi, glosarium, agenda, budaya) dibuat
#    sebagai entri eja jari.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # jempol tegak, jari lain menggenggam (pemimpin / atasan)
    "B27_JEMPOL": (I._jari(_G), "tegak"),
})

_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
_DINDING = A(0.05, -0.36, 1.28)
_L_DINDING = [k(0, p=_DINDING, a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")]
_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"
_TELUNJUK_DAHI = dict(a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang")


def _sym(keys):
    return dict(R=keys, L=cermin(keys))


# ── Register formal & presentasi ──────────────────────────────────────────

_RESMI = [
    k(0, p=A(-0.05, -0.27, 1.34), a="telapak", b="A", j="atas", tp="dalam+0.5*belakang"),
    k(0.15),
    k(0.6, p=A(-0.06, -0.28, 1.24)),
    k(0.85),
]
S("B27_RESMI", "Resmi / formal", "Formal", **_sym(_RESMI), gloss="RESMI", ragu=True,
  cara="Dua tangan seperti memegang kerah jas lalu menarik turun merapikan di dada — sikap rapi dan resmi; sambil mengucapkan 'resmi'.")

S("B27_PRESENTASI", "Presentasi", "Formal", [
    k(0, p=_DINDING + A(-0.05, -0.03, 0.04), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.55, p="netral+0.06*atas+0.22*depan+0.04*luar", j="depan+0.3*atas", tp="atas"),
    k(0.8),
], L=_L_DINDING, gloss="PRESENTASI", ragu=True,
  cara="Telapak kiri tegak seperti papan; tangan kanan dari dekat papan bergerak terbuka ke arah penonton — menyajikan isi kepada hadirin.")

S("B27_SAMBUTAN", "Sambutan / pidato", "Formal", [
    k(0, p="mulut+0.08*depan+0.04*bawah", a="telapak", b="S", j="atas", tp="dalam"),
    k(0.15),
    k(0.9),
], L=[k(0, p="netral_kiri+0.06*atas+0.06*depan", a="telapak", b="FLAT", j="depan+0.3*atas", tp="atas"),
      k(0.15), k(0.55, p="netral_kiri+0.08*atas+0.18*depan+0.08*luar"), k(0.9)],
  wajah="senang", gloss="SAMBUTAN", ragu=True,
  cara="Kepalan kanan di depan mulut seperti memegang mikrofon, tangan kiri terbuka menyapa hadirin ke depan-samping.")

S("B27_TUJUAN", "Tujuan / sasaran", "Susunan", [
    k(0, p="netral+0.04*atas+0.02*depan", a="ujung", b="1", j="depan+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.65, p=A(0.02, -0.46, 1.32)),
    k(0.85),
], L=[k(0, p=A(0.05, -0.50, 1.32), a="telapak", b="1", j="atas", tp="dalam")],
  gloss="TUJUAN", ragu=True,
  cara="Telunjuk kiri tegak di depan sebagai sasaran; telunjuk kanan bergerak lurus menuju ke sana, sambil mengucapkan 'tujuan'.")

S("B27_KERANGKA", "Kerangka / susunan bagian", "Susunan", [
    k(0, p=A(-0.06, -0.38, 1.40), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.12),
    k(0.3, p=A(-0.06, -0.38, 1.32)),
    k(0.4),
    k(0.6, p=A(-0.06, -0.38, 1.24)),
    k(0.7),
    k(0.9, p=A(-0.06, -0.38, 1.16)),
    k(1.0),
], L=[k(0, p=A(0.05, -0.36, 1.28), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")],
  gloss="KERANGKA", ragu=True,
  cara="Tangan kanan datar turun bertahap tiga kali di samping telapak kiri yang tegak — bagian-bagian tersusun dari atas ke bawah.")

S("B27_POIN", "Poin / pokok", "Susunan", [
    k(0, p=A(-0.06, -0.44, 1.38), a="ujung", b="1", j="depan", tp="bawah"),
    k(0.1, p=A(-0.06, -0.46, 1.38)),
    k(0.22, p=A(-0.06, -0.42, 1.38)),
    k(0.38, p=A(-0.06, -0.46, 1.30)),
    k(0.5, p=A(-0.06, -0.42, 1.30)),
    k(0.66, p=A(-0.06, -0.46, 1.22)),
    k(0.85),
], gloss="POIN", ragu=True,
  cara="Telunjuk 'menusuk' titik di udara tiga kali berurutan dari atas ke bawah — poin-poin dalam daftar.")

S("B27_PINDAH", "Pindah / transisi", "Susunan", [
    k(0, p="netral_kiri+0.02*atas+0.08*depan", a="ujung", b="FLAT_O", j="bawah+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.45, p="tengah+0.12*atas+0.10*depan"),
    k(0.75, p="netral+0.02*atas+0.08*depan+0.04*luar"),
    k(0.95),
], gloss="PINDAH", ragu=True,
  cara="Tangan kuncup diangkat dari kiri dan diletakkan di kanan melengkung — berpindah ke bagian berikutnya.")

_TUTUP = [
    k(0, p=A(-0.16, -0.38, 1.28), a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam+0.3*depan"),
    k(0.15),
    k(0.55, p=A(-0.02, -0.38, 1.28), tp="dalam"),
    k(0.8),
]
S("B27_TUTUP", "Menutup / penutup", "Susunan", **_sym(_TUTUP), gloss="TUTUP", ragu=True,
  cara="Dua telapak tegak dari samping bergerak ke tengah sampai bertemu — seperti pintu yang ditutup; sambil mengucapkan 'tutup'.")

# ── Alat bantu visual ─────────────────────────────────────────────────────

S("B27_TUNJUK", "Menunjuk (slide/layar)", "Visual", [
    k(0, p="netral+0.06*atas+0.06*depan", a="telapak", b="1", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.5, p="bahu_kanan+0.28*depan+0.12*atas+0.10*luar", j="depan+0.6*luar+0.3*atas", tp="bawah"),
    k(0.8),
], gloss="TUNJUK",
  cara="Telunjuk diarahkan ke samping-atas ke arah layar/slide (mata ikut sebentar), lalu kembali menatap penonton.")

S("B27_GAMBAR", "Gambar", "Visual", [
    k(0, p=_ALAS + A(-0.01, 0.03, 0.03), a="ujung", b="1", j="bawah+0.4*depan", tp="dalam"),
    k(0.12),
    k(0.3, p=_ALAS + A(-0.03, -0.01, 0.025)),
    k(0.48, p=_ALAS + A(0.01, -0.04, 0.025)),
    k(0.66, p=_ALAS + A(-0.03, -0.07, 0.025)),
    k(0.85),
], L=[k(0, p=_ALAS + A(0.0, 0.0, 0.03), a="telapak", b="FLAT", j="atas+0.4*depan", tp="belakang+0.4*atas")],
  gloss="GAMBAR", ragu=True,
  cara="Telunjuk kanan menggambar garis berkelok di telapak kiri — melukis/menggambar; sambil mengucapkan 'gambar'.")

S("B27_KAMERA", "Kamera / memotret", "Visual", [
    k(0, p=A(-0.065, -0.30, 1.55), a="telapak", b="C", j="atas+0.3*depan", tp="dalam"),
    k(0.2),
    k(0.4, b="O"),
    k(0.55, b="C"),
    k(0.85),
], L=[k(0, p=A(0.065, -0.30, 1.55), a="telapak", b="C", j="atas+0.3*depan", tp="dalam"),
      k(0.85)],
  gloss="KAMERA", ragu=True,
  cara="Dua tangan C di samping depan mata seperti memegang kamera; tangan kanan menguncup sebentar seperti menekan tombol.")

# ── Istilah bidang ────────────────────────────────────────────────────────

S("B27_HUKUM", "Hukum", "Istilah", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.12), a="sisi_kelingking", b="S", j="depan+0.3*dalam", tp="dalam"),
    k(0.12),
    k(0.28, p=_ALAS + A(-0.01, -0.01, 0.03)),
    k(0.42, p=_ALAS + A(-0.01, -0.01, 0.10)),
    k(0.58, p=_ALAS + A(-0.01, -0.01, 0.03)),
    k(0.85),
], L=_L_ALAS, wajah="netral", gloss="HUKUM", ragu=True,
  cara="Kepalan kanan mengetuk telapak kiri dua kali seperti palu hakim, sambil mengucapkan 'hukum'.")

S("B27_TEKNOLOGI", "Teknologi", "Istilah", [], gloss="TEKNOLOGI", ragu=True,
  cara="Dieja jari: T-E-K-N-O-L-O-G-I (sering disingkat; tanyakan isyarat lokalnya ke pengajar Tuli).")

S("B27_GLOSARIUM", "Glosarium / daftar istilah", "Istilah", [], gloss="GLOSARIUM", ragu=True,
  cara="Dieja jari: G-L-O-S-A-R-I-U-M (atau KATA + DAFTAR, sesuai kesepakatan kelas).")

S("B27_AGENDA", "Agenda / susunan acara", "Istilah", [], gloss="AGENDA", ragu=True,
  cara="Dieja jari: A-G-E-N-D-A (isyarat lokal berbeda-beda).")

# ── Media & berita ────────────────────────────────────────────────────────

S("B27_WARTAWAN", "Wartawan", "Media", [
    k(0, p="netral+0.04*atas+0.06*depan", a="telapak", b="S", j="atas+0.2*depan", tp="dalam"),
    k(0.15),
    k(0.4, p="netral+0.10*atas+0.26*depan"),
    k(0.55, p="netral+0.04*atas+0.10*depan"),
    k(0.75, p="netral+0.10*atas+0.26*depan"),
    k(0.95),
], gloss="WARTAWAN", ragu=True,
  cara="Kepalan seperti memegang mikrofon disodorkan ke depan dua kali — orang yang meminta keterangan; sambil mengucapkan 'wartawan'.")

S("B27_JAWAB", "Menjawab / jawaban", "Media", [
    k(0, p="mulut+0.05*depan+0.02*bawah", a="ujung", b="1", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.6, p="mulut+0.24*depan+0.10*bawah", j="depan+0.3*atas", tp="dalam+0.3*bawah"),
    k(0.85),
], L=[k(0, p="netral_kiri+0.12*atas+0.03*depan", a="ujung", b="1", j="atas+0.3*depan", tp="dalam"),
      k(0.15), k(0.6, p="netral_kiri+0.06*atas+0.18*depan"), k(0.85)],
  gloss="JAWAB", ragu=True,
  cara="Dua telunjuk dari dekat mulut/dada bergerak maju ke arah penanya — memberi balasan; sambil mengucapkan 'jawab'.")

# ── Kebijakan publik ──────────────────────────────────────────────────────

S("B27_ATURAN", "Aturan / kebijakan", "Kebijakan", [
    k(0, p=_DINDING + A(-0.05, -0.02, 0.10), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.12),
    k(0.3, p=_DINDING + A(-0.05, -0.02, 0.03)),
    k(0.42),
    k(0.6, p=_DINDING + A(-0.05, -0.02, -0.05)),
    k(0.85),
], L=_L_DINDING, gloss="ATURAN", ragu=True,
  cara="Telapak kiri tegak seperti kertas; sisi tangan kanan menandai baris demi baris dari atas ke bawah — pasal-pasal aturan.")

S("B27_PEMERINTAH", "Pemerintah", "Kebijakan", [
    k(0, p="dada+0.06*depan", a="telapak", b="B27_JEMPOL", j="atas+0.2*depan", tp="dalam"),
    k(0.15),
    k(0.45, p="netral+0.16*atas+0.10*depan"),
    *lingkar(0.5, 0.95, "netral+0.16*atas+0.16*depan", 0.05, "luar", "depan", n=6, mulai=180, putaran=1),
    k(1.05),
], gloss="PEMERINTAH", ragu=True,
  cara="Jempol tegak (pimpinan) naik dari dada lalu berputar mendatar di atas — yang mengatur wilayah; sambil mengucapkan 'pemerintah'. Variasi daerah besar.")

_WARGA = [
    k(0, p=A(-0.05, -0.40, 1.22), a="telapak", b="5", j="atas", tp="belakang"),
    k(0.15),
    *bolak(0.25, 0.12, 5, {"p": A(-0.10, -0.42, 1.25)}, {"p": A(-0.15, -0.40, 1.22)}),
    k(0.9),
]
S("B27_WARGA", "Warga / masyarakat", "Kebijakan", **_sym(_WARGA), gloss="WARGA", ragu=True,
  cara="Dua tangan jari terbuka (banyak orang) bergerak ke samping sambil naik-turun bergantian — orang banyak di suatu tempat.")

S("B27_DAMPAK", "Dampak / kena akibat", "Kebijakan", [
    k(0, p="netral+0.06*atas+0.24*depan", a="ujung", b="1", j="dalam+0.4*belakang", tp="bawah"),
    k(0.15),
    k(0.5, p=_DINDING + A(-0.012, -0.02, 0.02)),
    k(0.8),
], L=_L_DINDING, wajah="sedih", gloss="DAMPAK", ragu=True,
  cara="Telunjuk kanan dari depan bergerak menabrak telapak kiri — sesuatu mengenai warga; sambil mengucapkan 'dampak'.")

_USUL = [
    k(0, p=A(-0.05, -0.30, 1.30), a="telapak", b="FLAT", j="depan", tp="atas+0.4*dalam"),
    k(0.15),
    k(0.6, p=A(-0.05, -0.46, 1.34)),
    k(0.85),
]
S("B27_USUL", "Usul / usulan", "Kebijakan", **_sym(_USUL), gloss="USUL", ragu=True,
  cara="Dua telapak menghadap atas setinggi dada didorong ke depan-atas — menyodorkan gagasan; sambil mengucapkan 'usul'.")

S("B27_ADIL", "Adil / seimbang", "Kebijakan", [
    k(0, p=A(-0.10, -0.38, 1.24), a="telapak", b="FLAT", j="depan", tp="atas"),
    *bolak(0.12, 0.14, 4, {"p": A(-0.10, -0.38, 1.28)}, {"p": A(-0.10, -0.38, 1.20)}),
    k(0.75, p=A(-0.10, -0.38, 1.24)),
    k(0.95),
], L=[k(0, p=A(0.10, -0.38, 1.24), a="telapak", b="FLAT", j="depan", tp="atas"),
      *bolak(0.12, 0.14, 4, {"p": A(0.10, -0.38, 1.20)}, {"p": A(0.10, -0.38, 1.28)}),
      k(0.75, p=A(0.10, -0.38, 1.24)), k(0.95)],
  gloss="ADIL", ragu=True,
  cara="Dua telapak menghadap atas naik-turun bergantian seperti timbangan, lalu berhenti sama tinggi — seimbang dan adil.")

# ── Isu global, sumber, nilai ─────────────────────────────────────────────

S("B27_LINGKUNGAN", "Lingkungan", "Isu global", [
    k(0, p=A(-0.02, -0.46, 1.24), a="telapak", b="5", j="depan+0.3*atas", tp="bawah"),
    *lingkar(0.12, 0.85, A(0.0, -0.38, 1.24), 0.09, "luar", "depan", n=8, mulai=270, putaran=1),
    k(0.95),
], gloss="LINGKUNGAN", ragu=True,
  cara="Tangan terbuka telapak ke bawah menyapu satu lingkaran mendatar di depan badan — semua yang ada di sekitar kita.")

S("B27_SUMBER", "Sumber (informasi)", "Isu global", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.02), a="ujung", b="FLAT_O", j="bawah", tp="belakang"),
    k(0.15),
    k(0.6, p=_ALAS + A(-0.01, -0.01, 0.16)),
    k(0.85),
], L=_L_ALAS, gloss="SUMBER", ragu=True,
  cara="Jari kanan kuncup diangkat dari telapak kiri ke atas — mengambil dari asalnya; sambil mengucapkan 'sumber'.")

S("B27_PERCAYA", "Percaya / tepercaya", "Isu global", [
    k(0, p=_DAHI + "+0.04*depan", **_TELUNJUK_DAHI),
    k(0.2, p=_DAHI),
    k(0.35),
    k(0.75, p="dada+0.04*depan", a="telapak", b="S", j="atas+0.3*dalam", tp="belakang"),
    k(1.0),
], kepala=[(0.6, 0, 0, 0), (0.8, 8, 0, 0)], gloss="PERCAYA", ragu=True,
  cara="Telunjuk di pelipis lalu turun menjadi kepalan mantap di dada sambil mengangguk — yakin dan percaya.")

S("B27_AGAMA", "Agama", "Nilai", [
    k(0, p=A(-0.05, -0.32, 1.30), a="telapak", b="FLAT", j="depan+0.4*atas", tp="atas+0.4*belakang"),
    k(0.2),
    k(0.6, p=A(-0.05, -0.33, 1.34)),
    k(0.9),
], L=[k(0, p=A(0.05, -0.32, 1.30), a="telapak", b="FLAT", j="depan+0.4*atas", tp="atas+0.4*belakang"),
      k(0.2), k(0.6, p=A(0.05, -0.33, 1.34)), k(0.9)],
  kepala=[(0.2, 0, 0, 0), (0.6, 6, 0, 0)], gloss="AGAMA", ragu=True,
  cara="Dua telapak menengadah di depan dada seperti berdoa, kepala sedikit menunduk. Isyarat tiap agama berbeda-beda — tanyakan ke pengajar Tuli.")

S("B27_BUDAYA", "Budaya", "Nilai", [], gloss="BUDAYA", ragu=True,
  cara="Dieja jari: B-U-D-A-Y-A (atau isyarat lokal yang disepakati komunitas).")

_RAGAM = [
    k(0, p=A(-0.03, -0.38, 1.26), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.12),
    *bolak(0.2, 0.12, 6, {"p": A(-0.08, -0.38, 1.29), "putar": 25}, {"p": A(-0.13, -0.38, 1.23), "putar": -25}),
    k(0.95, putar=0),
]
S("B27_BERAGAM", "Beragam / keberagaman", "Nilai", **_sym(_RAGAM), gloss="BERAGAM", ragu=True,
  cara="Dua tangan terbuka bergerak menjauh ke samping sambil berayun-ayun naik-turun — banyak hal yang berbeda-beda.")

S("B27_SENSITIF", "Sensitif / peka", "Nilai", [
    k(0, p="dada+0.06*depan+0.02*atas", a="jari_tengah", b="OPEN_8", j="dalam+0.3*depan", tp="belakang"),
    k(0.15),
    k(0.35, p="dada+0.012*depan+0.02*atas"),
    k(0.6, p="dada+0.07*depan+0.02*atas"),
    k(0.85),
], wajah="sedih", gloss="SENSITIF", ragu=True,
  cara="Jari tengah menyentuh dada sangat pelan lalu cepat ditarik, wajah berhati-hati — perkara yang mudah melukai perasaan.")

# ── Rapat, laporan, penilaian ─────────────────────────────────────────────

S("B27_MEMIMPIN", "Memimpin / pemimpin rapat", "Rapat", [
    k(0, p=A(0.0, -0.32, 1.24), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.7, p=A(0.02, -0.50, 1.26)),
    k(0.9),
], L=[k(0, p=A(0.04, -0.30, 1.22), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
      k(0.15), k(0.7, p=A(0.06, -0.48, 1.24)), k(0.9)],
  gloss="MEMIMPIN", ragu=True,
  cara="Tangan kanan seperti menggandeng ujung jari tangan kiri lalu menariknya maju — menuntun orang lain; sambil mengucapkan 'pimpin'.")

S("B27_LAPORAN", "Laporan / melaporkan", "Rapat", [
    k(0, p=_ALAS + A(-0.01, -0.01, 0.03), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.6, p="netral+0.06*atas+0.22*depan", j="depan+0.3*atas", tp="atas"),
    k(0.85),
], L=_L_ALAS, gloss="LAPORAN", ragu=True,
  cara="Tangan kanan datar diangkat dari telapak kiri lalu disodorkan ke depan — menyerahkan lembar laporan; sambil mengucapkan 'laporan'.")

_RINGKAS = [
    k(0, p=A(-0.12, -0.38, 1.28), a="telapak", b="5", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.03, -0.38, 1.27), b="S"),
    k(0.85),
]
S("B27_RINGKAS", "Ringkas / ringkasan", "Rapat", **_sym(_RINGKAS), gloss="RINGKAS", ragu=True,
  cara="Dua tangan terbuka lebar bergerak ke tengah sambil mengepal — yang banyak dipadatkan menjadi inti; sambil mengucapkan 'ringkas'.")

S("B27_NILAI", "Menilai / evaluasi", "Rapat", [
    k(0, p=A(-0.08, -0.38, 1.26), a="ujung", b="F", j="depan+0.3*atas", tp="dalam"),
    *bolak(0.12, 0.14, 4, {"p": A(-0.08, -0.38, 1.30)}, {"p": A(-0.08, -0.38, 1.22)}),
    k(0.8),
], L=[k(0, p=A(0.08, -0.38, 1.26), a="ujung", b="F", j="depan+0.3*atas", tp="dalam"),
      *bolak(0.12, 0.14, 4, {"p": A(0.08, -0.38, 1.22)}, {"p": A(0.08, -0.38, 1.30)}), k(0.8)],
  wajah="wh", gloss="NILAI", ragu=True,
  cara="Dua tangan F (ibu jari-telunjuk melingkar) naik-turun bergantian seperti menimbang, alis berkerut — mempertimbangkan dan menilai.")
