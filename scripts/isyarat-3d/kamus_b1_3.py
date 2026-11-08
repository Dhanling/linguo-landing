# [isyarat-b1b2-v1] Kamus isyarat ASL B1.3 "Grammar in Depth — Tata Bahasa Lanjut".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# Kode baru berawalan B13_ (gloss tampil tanpa awalan).
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli, terutama: HABIT, NOTHING, LITTLE-BIT,
#    REFUSE, DURING, CAKE (variasinya banyak), dan bentuk beraspek (WAIT terus-menerus,
#    ASK berulang, GIVE kepada masing-masing) yang di sini hanya contoh satu pola gerak.

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"
_KIRI_DATAR = dict(a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")     # telapak kiri menghadap atas
_KIRI_TEGAK = dict(a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")      # telapak kiri tegak ke kanan


def _dua(keys):
    return keys, cermin(keys)


# ── Sesi 1: verba arah ─────────────────────────────────────────────────────

_r, _l = _dua([
    k(0, p="dagu+0.04*depan+0.03*bawah+0.03*luar", a="telunjuk", b="1", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.55, p="dagu+0.24*depan+0.16*bawah+0.05*luar", j="depan+0.2*atas", tp="bawah+0.3*dalam"),
    k(0.75),
])
_l[0] = k(0, p="dagu+0.12*depan+0.08*bawah+0.05*luar", a="telunjuk", b="1", j="atas+0.3*depan", tp="dalam")
S("B13_ANSWER", "Menjawab / jawaban", "Verba arah", _r, L=_l, gloss="ANSWER",
  cara="Dua telunjuk tegak di depan mulut, lalu dijatuhkan maju ke arah orang yang dijawab (verba berarah).")

S("B13_INVITE", "Mengundang / mengajak", "Verba arah", [
    k(0, p="netral+0.22*depan+0.10*luar", a="telapak", b="FLAT", j="depan+0.4*luar", tp="atas+0.3*dalam"),
    k(0.15),
    k(0.65, p="perut+0.10*depan+0.05*atas+0.03*luar", j="dalam+0.4*depan", tp="atas+0.4*belakang", kurva=True),
    k(0.85),
], wajah="senang",
  cara="Telapak menghadap atas, menyapu dari arah orang yang diundang menuju badan sendiri ('ayo ke sini').")

S("B13_BLAME", "Menyalahkan", "Verba arah", [
    k(0, p=A(0.02, -0.33, 1.235), a="telapak", b="A", j="depan+0.3*dalam", tp="bawah+0.3*dalam"),
    k(0.15),
    k(0.6, p=A(0.0, -0.52, 1.25)),
    k(0.8),
], L=[k(0, p=A(0.03, -0.34, 1.20), a="punggung", b="S", j="dalam+0.6*depan", tp="bawah")],
  wajah="sedih", cara="Kepalan A kanan (ibu jari ke atas) di atas punggung kepalan kiri, didorong maju ke arah orang yang disalahkan.")

# ── Sesi 2: verba spasial & plain ──────────────────────────────────────────

_r = [k(0, p=A(-0.15, -0.34, 1.21), a="ujung", b="FLAT_O", j="depan+0.3*bawah", tp="bawah+0.3*dalam"),
      k(0.15),
      k(0.42, p=A(-0.08, -0.42, 1.31), kurva=True),
      k(0.7, p=A(0.0, -0.46, 1.21), kurva=True),
      k(0.85)]
_l = [k(0, p=A(-0.03, -0.34, 1.21), a="ujung", b="FLAT_O", j="depan+0.3*bawah", tp="bawah+0.3*dalam"),
      k(0.15),
      k(0.42, p=A(0.04, -0.42, 1.31), kurva=True),
      k(0.7, p=A(0.12, -0.46, 1.21), kurva=True),
      k(0.85)]
S("B13_PUT", "Meletakkan / memindahkan", "Verba spasial", _r, L=_l, gloss="PUT",
  cara="Dua tangan O-pipih (seperti memegang benda) diangkat melengkung dari satu tempat dan diturunkan di tempat lain.")

_r, _l = _dua([
    k(0, p="netral+0.06*luar+0.04*belakang+0.03*bawah", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="atas"),
    k(0.15),
    k(0.7, p="netral+0.06*luar+0.22*depan+0.01*bawah", kurva=True),
    k(0.85),
])
S("B13_BRING", "Membawa", "Verba spasial", _r, L=_l, gloss="BRING",
  cara="Dua telapak terbuka menghadap atas (seperti membawa sesuatu) dipindah dari satu tempat ke tempat tujuan.")

S("B13_BELIEVE", "Percaya", "Verba plain", [
    k(0, p=_DAHI + "+0.05*depan", a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang"),
    k(0.2, p=_DAHI),
    k(0.3),
    k(0.75, p=A(0.0, -0.36, 1.235), a="telapak", b="C", j="dalam+0.6*depan", tp="bawah"),
    k(0.95),
], L=[k(0, **IST["L"]), k(0.35, p=A(0.02, -0.36, 1.19), a="telapak", b="C", j="dalam+0.6*depan", tp="atas"), k(0.95)],
  cara="Telunjuk menyentuh dahi (THINK), lalu turun dan tangan kanan menggenggam tangan kiri (telapak saling bertemu).")

# ── Sesi 3: aspek terus-menerus & berulang ─────────────────────────────────

_TUNGGU_R = A(-0.13, -0.40, 1.22)
_TUNGGU_L = A(0.04, -0.47, 1.21)
S("B13_WAIT", "Menunggu", "Verba", [
    k(0, p=_TUNGGU_R, a="telapak", b="5", j="depan+0.5*dalam", tp="atas+0.3*dalam"),
    *bolak(0.12, 0.13, 6, {"b": "5_TEKUK"}, {"b": "5"}),
    k(0.95, b="5"),
], L=[k(0, p=_TUNGGU_L, a="telapak", b="5", j="depan+0.5*dalam", tp="atas+0.3*dalam"),
      *bolak(0.18, 0.13, 6, {"b": "5_TEKUK"}, {"b": "5"}), k(0.95, b="5")],
  cara="Dua tangan 5 telapak ke atas, tangan kiri lebih ke depan; jari-jari digerakkan bergelombang.")

_r = lingkar(0, 1.4, A(-0.13, -0.40, 1.24), 0.05, "depan", "atas", n=12, mulai=90, putaran=2,
             a="telapak", b="5", j="depan+0.5*dalam", tp="atas+0.3*dalam") + [k(1.55)]
_l = lingkar(0, 1.4, A(0.04, -0.47, 1.23), 0.05, "depan", "atas", n=12, mulai=90, putaran=2,
             a="telapak", b="5", j="depan+0.5*dalam", tp="atas+0.3*dalam") + [k(1.55)]
S("B13_WAIT_LAMA", "Menunggu lama sekali (aspek terus-menerus)", "Aspek verba", _r, L=_l, gloss="WAIT[terus-menerus]",
  wajah="sedih", kepala=[(0, 0, 0, 0), (0.4, -4, 0, -6), (1.4, -4, 0, -6), (1.55, 0, 0, 0)],
  cara="Tangan WAIT digerakkan memutar lambat berulang kali, bibir tertarik/tegang dan kepala sedikit miring: menunggu lama.")

_r = [k(0, p="dada+0.10*atas+0.08*depan+0.02*luar", a="telunjuk", b="1", j="atas", tp="depan")]
for _i in range(4):
    _t = 0.12 + _i * 0.26
    _r += [k(_t, p="dada+0.10*atas+0.08*depan+0.02*luar", b="1", j="atas", tp="depan"),
           k(_t + 0.13, p="dada+0.05*atas+0.22*depan+0.02*luar", b="X", j="depan+0.6*atas", tp="bawah+0.5*depan")]
_r.append(k(_r[-1]["t"] + 0.15))
S("B13_ASK_ULANG", "Bertanya berulang-ulang", "Aspek verba", _r, gloss="ASK[berulang]",
  wajah="sedih", cara="ASK diulang cepat beberapa kali ke arah orang yang sama — 'bertanya terus-menerus'.")

# ── Sesi 4: intensitas & distribusi ────────────────────────────────────────

_TITIK_BERI = ["netral+0.20*depan+0.14*luar", "netral+0.24*depan+0.05*dalam", "netral+0.20*depan+0.20*dalam"]
_r = [k(0, p="dada+0.07*depan+0.06*luar+0.03*bawah", a="ujung", b="FLAT_O", j="depan+0.5*atas", tp="dalam+0.4*atas")]
_t = 0.15
for _p in _TITIK_BERI:
    _r += [k(_t, p="dada+0.07*depan+0.03*bawah"), k(_t + 0.2, p=_p + "+0.03*bawah", j="depan+0.2*atas")]
    _t += 0.35
_r.append(k(_t))
S("B13_GIVE_EACH", "Memberi kepada masing-masing (distributif)", "Aspek verba", _r, gloss="GIVE[masing-masing]",
  cara="GIVE satu tangan diulang ke beberapa titik berbeda di ruang isyarat (kanan, tengah, kiri) — satu per satu orang.")

_r, _l = _dua([
    k(0, p=A(-0.012, -0.40, 1.26), a="ujung", b="V", j="depan+0.4*atas+0.2*dalam", tp="bawah+0.4*dalam"),
    k(0.15),
    k(0.6, p=A(-0.17, -0.40, 1.27), j="depan+0.4*atas", tp="bawah", kurva=True),
    k(0.8),
])
S("B13_VERY", "Sangat", "Intensitas", _r, L=_l, gloss="VERY",
  cara="Ujung jari dua tangan bentuk V saling bersentuhan, lalu ditarik melengkung ke samping (bisa diganti penekanan gerak + wajah).")

S("B13_LITTLE_BIT", "Sedikit", "Intensitas", [
    k(0, p="netral+0.10*atas+0.02*depan", a="telunjuk", b="BABY_O", j="atas+0.3*dalam", tp="dalam+0.4*depan"),
    *bolak(0.15, 0.13, 4, {"b": "X"}, {"b": "BABY_O"}),
    k(0.75),
], cara="Ibu jari dan telunjuk hampir bertemu (celah kecil) di depan wajah, digesek kecil; mata menyipit, bibir 'OO'.")

S("B13_HABIT", "Kebiasaan / terbiasa", "Aspek verba", [
    k(0, p=A(-0.01, -0.35, 1.29), a="pergelangan", b="S", j="dalam+0.6*depan", tp="bawah"),
    k(0.15),
    k(0.55, p=A(-0.01, -0.37, 1.19)),
    k(0.75),
], L=[k(0, p=A(0.02, -0.36, 1.25), a="punggung", b="S", j="dalam+0.6*depan", tp="bawah"),
      k(0.15), k(0.55, p=A(0.02, -0.38, 1.15)), k(0.75)],
  cara="Pergelangan kepalan kanan bertumpu di atas kepalan kiri, keduanya ditekan turun bersama (sesuatu yang 'terikat').")

# ── Sesi 5: kosakata topik ─────────────────────────────────────────────────

S("B13_CAKE", "Kue", "Makanan", [
    k(0, p=A(0.06, -0.30, 1.19), a="ujung", b="CLAW", j="depan+0.4*dalam", tp="bawah"),
    k(0.15),
    k(0.55, p=A(0.03, -0.40, 1.19)),
    k(0.75),
], L=[k(0, p=A(0.04, -0.33, 1.15), **_KIRI_DATAR)],
  cara="Ujung jari tangan cakar diletakkan di telapak kiri lalu digeser maju (kue di atas piring). Variasi daerah banyak.")

S("B13_PICTURE", "Foto / gambar", "Benda", [
    k(0, p="mata+0.05*depan+0.04*luar+0.03*bawah", a="sisi_kelingking", b="C", j="atas+0.3*depan", tp="dalam+0.3*depan"),
    k(0.15),
    k(0.6, p=A(0.035, -0.38, 1.26), j="atas", tp="dalam"),
    k(0.8),
], L=[k(0, p=A(0.05, -0.38, 1.26), **_KIRI_TEGAK)],
  cara="Tangan C di samping mata (lensa kamera) turun dan ditempel ke telapak kiri yang tegak (foto tercetak).")

# ── Sesi 6: kondisional ────────────────────────────────────────────────────

_r = [k(0, p=A(-0.10, -0.40, 1.28), a="ujung", b="F", j="depan+0.5*atas", tp="dalam")]
_r += bolak(0.15, 0.17, 4, {"p": A(-0.10, -0.40, 1.22)}, {"p": A(-0.10, -0.40, 1.30)}) + [k(0.85)]
_l = [k(0, p=A(-0.10, -0.40, 1.22), a="ujung", b="F", j="depan+0.5*atas", tp="dalam")]
_l += bolak(0.15, 0.17, 4, {"p": A(-0.10, -0.40, 1.30)}, {"p": A(-0.10, -0.40, 1.22)}) + [k(0.85)]
S("B13_IF", "Jika / kalau", "Penghubung", _r, L=cermin(_l), gloss="IF", wajah="ya_tidak",
  cara="Dua tangan F (telapak saling berhadapan) naik-turun bergantian seperti timbangan; alis naik di bagian syarat.")

S("B13_CANCEL", "Batal / membatalkan", "Kata kerja", [
    k(0, p=A(-0.02, -0.37, 1.30), a="telunjuk", b="1", j="depan+0.4*dalam", tp="bawah+0.4*dalam"),
    k(0.12),
    k(0.35, p=A(0.07, -0.35, 1.23)),
    k(0.45, p=A(0.07, -0.37, 1.30)),
    k(0.7, p=A(-0.02, -0.35, 1.23)),
    k(0.85),
], L=[k(0, p=A(0.05, -0.33, 1.25), a="telapak", b="FLAT", j="atas+0.3*depan", tp="belakang+0.4*dalam")],
  cara="Telunjuk kanan menggores tanda silang (X) di telapak kiri — 'coret, batal'.")

_r, _l = _dua([
    k(0, p="netral+0.04*luar+0.02*atas", a="ujung", b="F", j="depan+0.6*atas", tp="dalam"),
    k(0.15),
    k(0.65, p="netral+0.04*luar+0.06*atas+0.20*depan", j="depan+0.2*atas", kurva=True),
    k(0.85),
])
S("B13_POSTPONE", "Menunda", "Kata kerja", _r, L=_l, gloss="POSTPONE",
  cara="Dua tangan F (seperti mencubit benang) dipindah melengkung ke depan — acara digeser ke waktu nanti.")

# ── Sesi 7: klausa relatif ─────────────────────────────────────────────────

S("B13_THAT", "Itu (yang …) / itulah", "Penunjuk", [
    k(0, p=A(0.02, -0.34, 1.28), a="telapak", b="Y", j="depan+0.4*dalam", tp="bawah"),
    k(0.15),
    k(0.42, p=A(0.02, -0.34, 1.185)),
    k(0.65),
], L=[k(0, p=A(0.04, -0.33, 1.15), **_KIRI_DATAR)], wajah="ya_tidak",
  cara="Tangan Y menghadap bawah dijatuhkan ke telapak kiri; dalam klausa relatif sering hanya Y/telunjuk menunjuk dengan alis naik.")

S("B13_MAN", "Laki-laki", "Orang", [
    k(0, p="dahi+0.03*depan+0.03*luar", a="jempol", b="5", j="atas+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.35, p="dagu+0.10*depan+0.03*luar", kurva=True),
    k(0.55, p="dada+0.01*depan", kurva=True),
    k(0.75),
], cara="Ibu jari tangan 5 menyentuh dahi (FATHER), lalu turun ke dada (FINE).")

S("B13_WOMAN", "Perempuan", "Orang", [
    k(0, p="dagu+0.025*depan+0.01*luar", a="jempol", b="5", j="atas+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p="dada+0.01*depan"),
    k(0.75),
], cara="Ibu jari tangan 5 menyentuh dagu (MOTHER), lalu turun ke dada (FINE).")

S("B13_FIND", "Menemukan", "Kata kerja", [
    k(0, p="netral+0.06*atas+0.06*depan", a="ujung", b="5", j="depan+0.4*bawah", tp="bawah"),
    k(0.15),
    k(0.35, p="netral+0.02*atas+0.06*depan", b="F"),
    k(0.7, p="netral+0.16*atas+0.03*depan", j="depan+0.5*atas", tp="dalam"),
    k(0.85),
], cara="Tangan terbuka di atas 'sesuatu', ibu jari & telunjuk memungut (bentuk F) lalu diangkat.")

# ── Sesi 8: pertanyaan retoris ─────────────────────────────────────────────

S("B13_REASON", "Alasan", "Penghubung",
  lingkar(0, 0.85, "dahi+0.06*depan+0.04*luar", 0.03, "luar", "atas", n=8, mulai=90,
          a="ujung", b="R", j="atas+0.4*dalam", tp="belakang+0.3*dalam") + [k(1.0)],
  cara="Ujung jari bentuk R memutar kecil di depan dahi (inisial R + tempat berpikir).")

# ── Sesi 9: pertanyaan pilihan & konfirmasi ────────────────────────────────

S("B13_CHOOSE", "Memilih", "Kata kerja", [
    k(0, p=A(-0.02, -0.46, 1.28), a="ujung", b="5", j="depan+0.3*dalam", tp="dalam+0.3*bawah"),
    k(0.15, b="F"),
    k(0.55, p=A(-0.04, -0.30, 1.30)),
    k(0.75),
], L=[k(0, p=A(0.04, -0.46, 1.26), a="telapak", b="V", j="atas+0.4*dalam", tp="belakang")],
  cara="Ibu jari & telunjuk kanan (F) 'memetik' salah satu jari tangan kiri lalu ditarik ke badan.")

S("B13_TRUE", "Benar-benar / sungguh", "Penegas", [
    k(0, p="dagu+0.035*depan+0.01*atas", a="sisi_telunjuk", b="1", j="atas+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p="dagu+0.20*depan+0.04*atas", j="atas+0.4*depan"),
    k(0.75),
], kepala=[(0.3, 0, 0, 0), (0.6, 8, 0, 0), (0.8, 0, 0, 0)],
  cara="Sisi telunjuk di depan bibir/dagu digerakkan maju lurus — 'sungguh, betul'.")

# ── Sesi 10: negasi lanjut ─────────────────────────────────────────────────

_r, _l = _dua([
    k(0, p=A(-0.03, -0.38, 1.27), a="ujung", b="O", j="depan+0.4*atas", tp="dalam+0.3*bawah"),
    k(0.15),
    *bolak(0.3, 0.12, 4, {"p": A(-0.11, -0.38, 1.25)}, {"p": A(-0.15, -0.38, 1.24)}),
    k(0.85, p=A(-0.18, -0.38, 1.23)),
])
S("B13_NOTHING", "Tidak ada apa-apa", "Negasi", _r, L=_l, gloss="NOTHING",
  kepala=[(0.1, 0, 0, 0), (0.3, 0, 12, 0), (0.5, 0, -12, 0), (0.7, 0, 10, 0), (0.9, 0, 0, 0)],
  cara="Dua tangan O (angka nol) di tengah, digerakkan ke samping sambil bergoyang, kepala menggeleng.")

S("B13_REFUSE", "Menolak / tidak mau", "Negasi", [
    k(0, p="netral+0.06*luar+0.04*atas+0.06*depan", a="telapak", b="A", j="atas", tp="dalam"),
    k(0.15),
    k(0.45, p="bahu_kanan+0.07*depan+0.04*atas", j="atas+0.5*belakang"),
    k(0.7),
], wajah="sedih", kepala=[(0.2, 0, 0, 0), (0.45, -4, -10, 0), (0.7, 0, 0, 0)],
  cara="Kepalan A (ibu jari ke atas) di depan badan disentak ke belakang dekat bahu, seperti menolak.")

_r, _l = _dua([
    k(0, p="dada+0.06*depan+0.07*luar+0.04*bawah", a="telapak", b="CLAW", j="depan+0.3*atas", tp="atas"),
    k(0.15),
    k(0.55, p="dada+0.16*depan+0.12*luar+0.14*bawah", tp="bawah", j="depan+0.2*bawah"),
    k(0.75),
])
S("B13_DONT_WANT", "Tidak mau", "Negasi", _r, L=_l, gloss="DON'T-WANT",
  kepala=[(0.2, 0, 0, 0), (0.4, 0, 10, 0), (0.6, 0, -10, 0), (0.8, 0, 0, 0)],
  cara="Dua tangan cakar telapak ke atas (WANT) dibalik ke bawah sambil turun ke samping, kepala menggeleng.")

# ── Sesi 11: penanda waktu ─────────────────────────────────────────────────

_r = [k(0, p="netral+0.07*luar+0.05*atas", a="telapak", b="Y", j="depan", tp="atas"),
      k(0.1), k(0.3, p="netral+0.07*luar+0.01*bawah"),
      k(0.45, p=A(-0.03, -0.34, 1.44), a="telunjuk", b="1", j="atas", tp="dalam"),
      k(1.05, p=A(0.10, -0.36, 1.27), j="dalam+0.15*atas"), k(1.2)]
_l = [k(0, p="netral_kiri+0.07*luar+0.05*atas", a="telapak", b="Y", j="depan", tp="atas"),
      k(0.1), k(0.3, p="netral_kiri+0.07*luar+0.01*bawah"),
      k(0.5, p=A(0.07, -0.30, 1.12), a="punggung", b="FLAT", j="dalam+0.2*depan", tp="bawah"), k(1.2)]
S("B13_TODAY", "Hari ini", "Waktu", _r, L=_l, gloss="TODAY",
  cara="Gabungan NOW (dua tangan Y diturunkan) + DAY (telunjuk berayun turun melintasi badan).")

S("B13_UNTIL", "Sampai (waktu)", "Waktu", [
    k(0, p=A(-0.10, -0.30, 1.30), a="telunjuk", b="1", j="depan+0.4*atas", tp="bawah+0.3*dalam"),
    k(0.15),
    k(0.4, p=A(-0.03, -0.38, 1.38), kurva=True),
    k(0.7, p=A(0.04, -0.47, 1.355), j="depan+0.3*dalam", kurva=True),
    k(0.85),
], L=[k(0, p=A(0.04, -0.47, 1.25), a="telunjuk", b="1", j="atas+0.2*depan", tp="dalam")],
  cara="Telunjuk kanan bergerak melengkung ke depan dan menyentuh ujung telunjuk kiri yang tegak (batas waktu).")

_r, _l = _dua([
    k(0, p=A(-0.04, -0.34, 1.26), a="telunjuk", b="1", j="depan", tp="bawah"),
    k(0.15),
    k(0.7, p=A(-0.04, -0.50, 1.21), kurva=True),
    k(0.85),
])
S("B13_DURING", "Selama / sementara", "Waktu", _r, L=_l, gloss="DURING",
  cara="Dua telunjuk sejajar menunjuk ke depan, bergerak maju bersama (dua hal berjalan berdampingan).")

# ── Sesi 12: konjungsi ─────────────────────────────────────────────────────

S("B13_PLUS", "Ditambah / lagi pula", "Penghubung", [
    k(0, p=A(-0.06, -0.40, 1.27), a="telunjuk", b="1", j="dalam", tp="bawah"),
    k(0.15),
    k(0.42, p=A(0.025, -0.39, 1.27)),
    k(0.65),
], L=[k(0, p=A(0.03, -0.40, 1.24), a="telunjuk", b="1", j="atas", tp="dalam")],
  cara="Telunjuk kanan mendatar ditempel melintang pada telunjuk kiri yang tegak, membentuk tanda +.")

_r, _l = _dua([
    k(0, p=A(-0.035, -0.40, 1.25), a="telunjuk", b="1", j="depan", tp="bawah"),
    k(0.12, p=A(-0.012, -0.40, 1.25)),
    k(0.3, p=A(-0.035, -0.40, 1.25)),
    k(0.42, p=A(-0.012, -0.40, 1.25)),
    k(0.6),
])
S("B13_ALSO", "Juga", "Penghubung", _r, L=_l, gloss="ALSO",
  cara="Dua telunjuk menunjuk ke depan, sisi telunjuk saling diketukkan dua kali (sama-sama).")

# ── Sesi 13: perbandingan ──────────────────────────────────────────────────

_r = [k(0, p=A(-0.10, -0.38, 1.30), a="telapak", b="BENT_B", j="atas+0.3*depan", tp="belakang+0.6*dalam")]
_r += bolak(0.15, 0.18, 4, {"tp": "dalam+0.3*belakang", "putar": 25}, {"tp": "belakang+0.6*dalam", "putar": 0}) + [k(0.9)]
_l = [k(0, p=A(-0.10, -0.38, 1.30), a="telapak", b="BENT_B", j="atas+0.3*depan", tp="dalam+0.3*belakang")]
_l += bolak(0.15, 0.18, 4, {"tp": "belakang+0.6*dalam", "putar": 25}, {"tp": "dalam+0.3*belakang", "putar": 0}) + [k(0.9)]
S("B13_COMPARE", "Membandingkan", "Perbandingan", _r, L=cermin(_l), gloss="COMPARE",
  cara="Dua telapak (sedikit menekuk) di depan wajah, diputar bergantian seperti melihat dua benda di tangan.")

S("B13_SMART", "Pintar", "Sifat", [
    k(0, p=_DAHI, a="tengah", b="OPEN_8", j="atas+0.6*dalam+0.3*belakang", tp="belakang+0.4*dalam"),
    k(0.15),
    k(0.45, p=_DAHI + "+0.14*depan+0.03*atas", j="atas+0.5*depan"),
    k(0.65),
], wajah="senang", cara="Ujung jari tengah (8 terbuka) menyentuh dahi lalu dijentik maju — otak yang 'bersinar'.")

_r, _l = _dua([
    k(0, p="netral+0.04*luar+0.05*depan", a="telunjuk", b="1", j="depan", tp="bawah"),
    k(0.15),
    k(0.32, p="netral+0.04*luar+0.02*belakang", b="X"),
    k(0.5),
])
S("B13_FAST", "Cepat", "Sifat", _r, L=_l, gloss="FAST",
  cara="Dua telunjuk (bentuk L atau 1) menunjuk ke depan, lalu ditarik cepat ke belakang sambil telunjuk menekuk (X).")

_r, _l = _dua([
    k(0, p=A(-0.12, -0.38, 1.30), a="telapak", b="CLAW", j="depan+0.3*luar", tp="atas"),
    k(0.15),
    k(0.45, p=A(-0.12, -0.38, 1.17)),
    k(0.7),
])
S("B13_HEAVY", "Berat", "Sifat", _r, L=_l, gloss="HEAVY", wajah="sedih",
  cara="Dua tangan menghadap atas (seperti menyangga beban) turun bersama dengan wajah tertekan.")

# ── Sesi 14: menjelaskan ───────────────────────────────────────────────────

_r = [k(0, p=A(-0.05, -0.38, 1.27), a="ujung", b="F", j="depan", tp="dalam")]
_r += bolak(0.15, 0.17, 4, {"p": A(-0.05, -0.48, 1.27)}, {"p": A(-0.05, -0.36, 1.27)}) + [k(0.85)]
_l = [k(0, p=A(-0.05, -0.48, 1.27), a="ujung", b="F", j="depan", tp="dalam")]
_l += bolak(0.15, 0.17, 4, {"p": A(-0.05, -0.36, 1.27)}, {"p": A(-0.05, -0.48, 1.27)}) + [k(0.85)]
S("B13_EXPLAIN", "Menjelaskan", "Kata kerja", _r, L=cermin(_l), gloss="EXPLAIN",
  cara="Dua tangan F menunjuk ke depan, digerakkan maju-mundur bergantian (menarik benang penjelasan).")

S("B13_MEAN", "Berarti / maksud", "Kata kerja", [
    k(0, p=A(0.02, -0.34, 1.25), a="ujung", b="V", j="bawah+0.3*depan", tp="belakang"),
    k(0.12, p=A(0.02, -0.34, 1.21)),
    k(0.3, p=A(0.02, -0.34, 1.25), putar=90),
    k(0.45, p=A(0.02, -0.34, 1.21)),
    k(0.65),
], L=[k(0, p=A(0.04, -0.33, 1.15), **_KIRI_DATAR)],
  cara="Ujung jari bentuk V menyentuh telapak kiri, diangkat, diputar, lalu menyentuh lagi.")

# ── Sesi 16: aturan permainan ──────────────────────────────────────────────

_r, _l = _dua([
    k(0, p=A(-0.12, -0.36, 1.28), a="telapak", b="A", j="atas", tp="belakang+0.4*dalam"),
    k(0.12, p=A(-0.035, -0.36, 1.28)),
    k(0.28, p=A(-0.12, -0.36, 1.28)),
    k(0.42, p=A(-0.035, -0.36, 1.28)),
    k(0.6),
])
S("B13_GAME", "Permainan / bertanding", "Permainan", _r, L=_l, gloss="GAME",
  cara="Dua kepalan A (ibu jari ke atas, telapak ke diri) diadu ke tengah dua kali.")

S("B13_RULE", "Aturan", "Permainan", [
    k(0, p=A(0.035, -0.37, 1.33), a="telapak", b="R", j="atas+0.4*dalam", tp="dalam+0.3*depan"),
    k(0.12, p=A(0.045, -0.37, 1.31)),
    k(0.3, p=A(0.035, -0.37, 1.25)),
    k(0.42, p=A(0.045, -0.37, 1.23)),
    k(0.6),
], L=[k(0, p=A(0.055, -0.37, 1.28), **_KIRI_TEGAK)],
  cara="Bentuk R kanan diketuk di telapak kiri yang tegak, di atas lalu di bawah (pasal-pasal tertulis).")

S("B13_START", "Mulai", "Permainan", [
    k(0, p=A(0.03, -0.40, 1.26), a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.5, putar=-80),
    k(0.7),
], L=[k(0, p=A(0.045, -0.40, 1.25), a="telapak", b="5", j="atas+0.4*depan", tp="dalam")],
  cara="Ujung telunjuk kanan diselipkan di antara jari kiri, lalu diputar seperti memutar kunci kontak.")

S("B13_LOSE_GAME", "Kalah (bertanding)", "Permainan", [
    k(0, p=A(0.02, -0.36, 1.30), a="ujung", b="BENT_V", j="depan+0.3*dalam", tp="atas+0.3*belakang"),
    k(0.15),
    k(0.42, p=A(0.03, -0.34, 1.19), j="dalam+0.5*depan", tp="bawah"),
    k(0.65),
], L=[k(0, p=A(0.04, -0.33, 1.15), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  wajah="sedih", cara="Bentuk V bengkok (seperti kaki terlipat) dijatuhkan ke telapak kiri — tumbang, kalah. Beda dengan LOSE (kehilangan barang).")
