# [isyarat-b1b2-v1] Kamus isyarat ASL B2.6 "Academic & Professional ASL — ASL Akademik & Profesional".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli (terutama THEORY, RESULT, PROCESS,
#    AUDIENCE, PERCENT, EVALUATE yang variasinya banyak / sering dieja).

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

# Telapak kiri menghadap atas sebagai alas (dipakai banyak isyarat)
_ALAS = dict(p=A(0.03, -0.33, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
# Telapak kiri tegak (jari ke depan, telapak ke kanan/dalam)
_TEGAK = dict(p=A(0.04, -0.36, 1.22), a="telapak", b="FLAT", j="depan+0.2*dalam", tp="dalam")
_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"


def _dua(keys):
    """Isyarat simetris: (R, L) dari kunci tangan kanan."""
    return keys, cermin(keys)


# ── Akademik ───────────────────────────────────────────────────────────────

_teori = [k(0, p="pelipis+0.06*depan+0.07*luar", a="buku", b="T", j="atas+0.2*dalam", tp="dalam+0.6*depan")]
for _i in range(4):
    _u = (_i + 1) / 4
    _teori.append(k(0.15 + 0.17 * (_i + 1), p=f"pelipis+{0.06 + 0.10 * _u:.3f}*depan+{0.08 * _u:.3f}*atas+{0.09 if _i % 2 else 0.07:.3f}*luar",
                    kurva=True))
_teori.append(k(1.0))
S("B26_THEORY", "Teori", "Akademik", _teori, gloss="THEORY",
  cara="Tangan bentuk T di dekat dahi bergerak maju-naik sambil berputar kecil (IMAGINE dengan huruf T).")

S("B26_RESEARCH", "Riset / penelitian", "Akademik", [
    k(0, p=A(0.035, -0.30, 1.175), a="ujung", b="R", j="bawah+0.6*depan+0.2*dalam", tp="belakang"),
    *bolak(0.15, 0.17, 5, {"p": A(0.035, -0.38, 1.175)}, {"p": A(0.035, -0.30, 1.175)}),
    k(1.0),
], L=[k(0, **_ALAS)],
  cara="Ujung jari bentuk R mengusap telapak kiri ke depan berulang (INVESTIGATE dengan huruf R).")

_ana = [
    k(0, p=A(-0.05, -0.38, 1.32), a="ujung", b="BENT_V", j="dalam+0.6*bawah", tp="bawah"),
    k(0.2, p=A(-0.06, -0.38, 1.27), b="V"),
    k(0.35, p=A(-0.06, -0.38, 1.25), b="BENT_V"),
    k(0.55, p=A(-0.07, -0.38, 1.20), b="V"),
    k(0.7, p=A(-0.07, -0.38, 1.18), b="BENT_V"),
    k(0.9),
]
S("B26_ANALYZE", "Menganalisis", "Akademik", *_dua(_ana), gloss="ANALYZE",
  cara="Dua tangan V bengkok, ujung jari saling menghadap, bergerak turun sambil jari menekuk-lurus berulang (memilah-milah).")

S("B26_IDEA", "Ide / gagasan", "Akademik", [
    k(0, p="pelipis+0.025*depan+0.01*atas", a="kelingking", b="I", j="atas+0.2*dalam", tp="belakang+0.4*dalam"),
    k(0.15),
    k(0.6, p="pelipis+0.08*depan+0.13*atas+0.04*luar", j="atas+0.3*depan"),
    k(0.8),
], cara="Kelingking (bentuk I) di dekat pelipis bergerak naik menjauh dari kepala.")

S("B26_REASON", "Alasan", "Akademik",
  lingkar(0, 0.9, "pelipis+0.05*depan+0.01*dalam", 0.025, "depan", "atas", n=8, mulai=270, putaran=1,
          a="ujung", b="R", j="atas+0.4*dalam", tp="belakang+0.6*dalam") + [k(1.05)],
  cara="Ujung jari bentuk R berputar kecil di dekat dahi.")

_bandingkan = [
    k(0, p=A(-0.09, -0.40, 1.30), a="telapak", b="C", j="atas+0.2*depan", tp="belakang+0.8*dalam"),
    *bolak(0.18, 0.18, 4, {"putar": 30}, {"putar": -25}),
    k(0.95, putar=0),
]
S("B26_COMPARE", "Membandingkan", "Akademik", _bandingkan,
  L=cermin([
    k(0, p=A(-0.09, -0.40, 1.30), a="telapak", b="C", j="atas+0.2*depan", tp="belakang+0.8*dalam"),
    *bolak(0.18, 0.18, 4, {"putar": -25}, {"putar": 30}),
    k(0.95, putar=0),
  ]), gloss="COMPARE",
  cara="Dua tangan melengkung, telapak menghadap diri, diputar bergantian seperti menimbang dua hal.")

S("B26_PAPER", "Kertas / makalah", "Akademik", [
    k(0, p=A(0.035, -0.29, 1.19), a="telapak", b="FLAT", j="dalam+0.4*depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.035, -0.33, 1.178)}, {"p": A(0.035, -0.29, 1.19)}),
    k(0.8, p=A(0.035, -0.33, 1.178)),
], L=[k(0, **_ALAS)],
  cara="Pangkal telapak kanan menyapu pangkal telapak kiri dua kali.")

S("B26_PRACTICE", "Berlatih", "Akademik", [
    k(0, p=A(0.0, -0.36, 1.235), a="buku", b="A", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.13, 6, {"p": A(0.06, -0.36, 1.235)}, {"p": A(0.0, -0.36, 1.235)}),
    k(0.95),
], L=[k(0, p=A(0.09, -0.37, 1.20), a="telunjuk", b="1", j="dalam+0.15*depan", tp="belakang")],
  cara="Buku jari kepalan A mengusap telunjuk kiri (mendatar) maju-mundur berulang.")

# ── Proses & sebab-akibat ──────────────────────────────────────────────────

_sebab = [
    k(0, p=A(-0.10, -0.24, 1.20), a="telapak", b="S", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.6, p=A(-0.06, -0.48, 1.24), b="5"),
    k(0.8),
]
S("B26_CAUSE", "Menyebabkan / sebab", "Proses", *_dua(_sebab), gloss="CAUSE",
  cara="Dua kepalan (telapak ke atas) di dekat badan didorong maju sambil membuka menjadi tangan 5.")

S("B26_RESULT", "Hasil / akibat", "Proses", [
    k(0, p=A(-0.05, -0.36, 1.33), a="ujung", b="R", j="atas+0.4*depan", tp="dalam"),
    k(0.15),
    k(0.4, p=A(0.0, -0.40, 1.30), j="depan+0.3*atas"),
    k(0.65, p=A(0.03, -0.40, 1.215), j="depan+0.4*bawah", tp="bawah"),
    k(0.85),
], L=[k(0, p=A(0.04, -0.36, 1.19), a="punggung", b="FLAT", j="dalam+0.6*depan", tp="bawah")],
  cara="Tangan bentuk R melengkung ke depan lalu mendarat di punggung tangan kiri (END dengan huruf R).")

_proses = lingkar(0, 1.0, A(-0.02, -0.40, 1.25), 0.05, "depan", "atas", n=10, mulai=90, putaran=2,
                  a="ujung", b="P", j="dalam+0.6*depan", tp="bawah+0.3*dalam") + [k(1.15)]
S("B26_PROCESS", "Proses / prosedur", "Proses", _proses,
  L=cermin(lingkar(0, 1.0, A(-0.02, -0.40, 1.25), 0.05, "depan", "atas", n=10, mulai=270, putaran=2,
                   a="ujung", b="P", j="dalam+0.6*depan", tp="bawah+0.3*dalam") + [k(1.15)]),
  gloss="PROCESS", cara="Dua tangan bentuk P berputar maju saling mengelilingi (langkah yang terus berlanjut).")

S("B26_CHANGE", "Mengubah / berubah", "Proses", [
    k(0, p=A(-0.02, -0.38, 1.27), a="telunjuk", b="X", j="depan+0.4*atas", tp="dalam"),
    k(0.15),
    k(0.55, p=A(-0.02, -0.38, 1.22), j="depan+0.4*atas", tp="dalam", putar=170),
    k(0.75),
], L=[k(0, p=A(0.02, -0.38, 1.22), a="telunjuk", b="X", j="depan+0.4*atas", tp="dalam"),
      k(0.15), k(0.55, p=A(0.02, -0.38, 1.27), putar=170), k(0.75)],
  cara="Dua tangan X saling berhadapan diputar sehingga posisi atas-bawahnya bertukar.")

S("B26_CONTINUE", "Melanjutkan / terus", "Proses", [
    k(0, p=A(-0.02, -0.28, 1.22), a="jempol", b="A", j="depan+0.3*dalam", tp="dalam+0.6*bawah"),
    k(0.15),
    k(0.65, p=A(-0.02, -0.46, 1.20)),
    k(0.85),
], L=[k(0, p=A(0.0, -0.34, 1.21), a="jempol", b="A", j="depan+0.3*dalam", tp="dalam+0.6*bawah"),
      k(0.15), k(0.65, p=A(0.0, -0.52, 1.19)), k(0.85)],
  cara="Dua kepalan A, ibu jari kanan di belakang ibu jari kiri, bersama-sama bergerak maju.")

S("B26_START", "Mulai / pembuka", "Proses", [
    k(0, p=A(0.045, -0.35, 1.25), a="telunjuk", b="1", j="depan+0.2*bawah", tp="dalam"),
    k(0.2),
    k(0.5, putar=-80),
    k(0.75),
], L=[k(0, p=A(0.05, -0.38, 1.24), a="telapak", b="5", j="depan+0.3*atas", tp="dalam")],
  cara="Telunjuk diselipkan di antara telunjuk & jari tengah tangan kiri lalu diputar (seperti memutar kunci).")

S("B26_END", "Akhir / penutup", "Proses", [
    k(0, p=A(0.02, -0.30, 1.235), a="telapak", b="FLAT", j="depan+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.45, p=A(0.02, -0.46, 1.235)),
    k(0.65, p=A(0.02, -0.50, 1.17)),
    k(0.85),
], L=[k(0, p=A(0.04, -0.37, 1.20), a="sisi_kelingking", b="FLAT", j="depan+0.2*dalam", tp="dalam")],
  cara="Tangan datar kanan meluncur di sepanjang tangan kiri lalu jatuh ke bawah dari ujungnya.")

S("B26_INCREASE", "Meningkat / naik", "Proses", [
    k(0, p=A(-0.07, -0.36, 1.18), a="ujung", b="H", j="dalam+0.3*depan", tp="atas"),
    k(0.15),
    k(0.45, p=A(-0.02, -0.37, 1.27), tp="dalam+0.5*atas"),
    k(0.7, p=A(0.03, -0.37, 1.235), tp="bawah"),
    k(0.9),
], L=[k(0, p=A(0.04, -0.37, 1.21), a="punggung", b="H", j="dalam+0.3*depan", tp="bawah")],
  cara="Tangan H kanan (telapak atas) dibalik dan mendarat di atas tangan H kiri (bertambah).")

S("B26_DECREASE", "Menurun / berkurang", "Proses", [
    k(0, p=A(0.03, -0.37, 1.235), a="ujung", b="H", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.45, p=A(-0.02, -0.37, 1.30), tp="dalam+0.5*atas"),
    k(0.7, p=A(-0.08, -0.36, 1.25), tp="atas"),
    k(0.9),
], L=[k(0, p=A(0.04, -0.37, 1.21), a="punggung", b="H", j="dalam+0.3*depan", tp="bawah")],
  cara="Tangan H kanan di atas tangan H kiri diangkat dan dibalik menjauh (berkurang).")

S("B26_PERCENT", "Persen", "Proses", [
    k(0, p="netral+0.12*atas+0.02*dalam", a="ujung", b="O", j="atas+0.3*dalam", tp="dalam+0.5*depan"),
    k(0.15),
    k(0.4, p="netral+0.12*atas+0.06*luar"),
    k(0.7, p="netral+0.02*atas+0.03*dalam"),
    k(0.85),
], cara="Tangan bentuk O bergerak ke samping lalu turun miring, seperti menggambar tanda %.")

# ── Presentasi & penjelasan ────────────────────────────────────────────────

_jelas = [
    k(0, p=A(-0.03, -0.36, 1.25), a="telunjuk", b="F", j="depan+0.2*atas", tp="dalam"),
    *bolak(0.15, 0.16, 5, {"p": A(-0.03, -0.46, 1.25)}, {"p": A(-0.03, -0.32, 1.25)}),
    k(1.0),
]
S("B26_EXPLAIN", "Menjelaskan", "Presentasi", _jelas,
  L=cermin([
    k(0, p=A(-0.03, -0.46, 1.25), a="telunjuk", b="F", j="depan+0.2*atas", tp="dalam"),
    *bolak(0.15, 0.16, 5, {"p": A(-0.03, -0.32, 1.25)}, {"p": A(-0.03, -0.46, 1.25)}),
    k(1.0),
  ]), gloss="EXPLAIN",
  cara="Dua tangan F (telapak saling berhadapan) bergantian maju-mundur.")

S("B26_SUMMARIZE", "Merangkum / ringkasan", "Presentasi", [
    k(0, p=A(-0.03, -0.38, 1.36), a="telapak", b="CLAW", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.55, p=A(-0.03, -0.38, 1.27), b="S"),
    k(0.75),
], L=[k(0, p=A(0.03, -0.38, 1.12), a="telapak", b="CLAW", j="depan+0.3*dalam", tp="atas"),
      k(0.15), k(0.55, p=A(0.03, -0.38, 1.20), b="S"), k(0.75)],
  cara="Dua tangan cakar (kanan di atas, kiri di bawah) saling mendekat dan menggenggam menjadi S (memadatkan isi).")

_kutip = [
    k(0, p="pelipis+0.20*depan+0.07*luar+0.10*bawah", a="ujung", b="V", j="atas", tp="depan"),
    *bolak(0.18, 0.16, 4, {"b": "BENT_V"}, {"b": "V"}),
    k(0.85, b="BENT_V"),
]
S("B26_QUOTE", "Kutipan / judul / topik", "Presentasi", *_dua(_kutip), gloss="QUOTE",
  cara="Dua tangan V di samping kepala, jari ditekuk dua kali seperti tanda petik di udara (juga TITLE / TOPIC).")

_saji = [
    k(0, p=A(-0.10, -0.28, 1.18), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.6, p=A(-0.10, -0.46, 1.25)),
    k(0.8),
]
S("B26_PRESENT", "Menyajikan / mengusulkan", "Presentasi", *_dua(_saji), gloss="PRESENT",
  cara="Dua tangan datar telapak ke atas didorong maju ke arah penonton (menyajikan; serupa OFFER/SUGGEST).")

S("B26_LECTURE", "Ceramah / pidato", "Presentasi", [
    k(0, p="pelipis+0.10*luar+0.08*depan+0.08*bawah", a="telapak", b="FLAT", j="atas", tp="depan+0.6*dalam"),
    *bolak(0.15, 0.15, 6, {"p": "pelipis+0.10*luar+0.16*depan+0.08*bawah", "putar": 10},
           {"p": "pelipis+0.10*luar+0.08*depan+0.08*bawah", "putar": -5}),
    k(1.1, putar=0),
], gloss="LECTURE",
  cara="Tangan datar tegak di samping kepala (telapak ke depan) digerakkan maju-mundur berulang (SPEECH / LECTURE).")

S("B26_AUDIENCE", "Penonton / hadirin", "Presentasi", [
    k(0, p=A(-0.12, -0.48, 1.20), a="telapak", b="CLAW", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.10, -0.36, 1.20)),
    k(0.8),
], L=cermin([
    k(0, p=A(-0.12, -0.48, 1.20), a="telapak", b="CLAW", j="depan+0.3*atas", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.10, -0.36, 1.20)),
    k(0.8),
]), cara="Dua tangan 5 bengkok, telapak ke bawah, bergerak dari depan ke arah penutur (barisan orang yang menonton).")

S("B26_FOCUS", "Fokus / perhatian", "Presentasi", [
    k(0, p="mata+0.07*luar+0.06*depan+0.05*bawah", a="telapak", b="FLAT", j="depan+0.6*atas", tp="dalam"),
    k(0.15),
    k(0.6, p="mata+0.03*luar+0.24*depan+0.09*bawah", j="depan+0.2*atas"),
    k(0.8),
], L=cermin([
    k(0, p="mata+0.07*luar+0.06*depan+0.05*bawah", a="telapak", b="FLAT", j="depan+0.6*atas", tp="dalam"),
    k(0.15),
    k(0.6, p="mata+0.03*luar+0.24*depan+0.09*bawah", j="depan+0.2*atas"),
    k(0.8),
]), gloss="FOCUS", cara="Dua tangan datar di samping mata (seperti kacamata kuda) bergerak lurus ke depan (ATTENTION / FOCUS).")

_terang = [
    k(0, p=A(-0.03, -0.36, 1.28), a="ujung", b="FLAT_O", j="atas+0.3*dalam", tp="depan"),
    k(0.15),
    k(0.6, p=A(-0.16, -0.38, 1.38), b="5", j="atas+0.3*luar"),
    k(0.8),
]
S("B26_CLEAR", "Jelas", "Presentasi", *_dua(_terang), gloss="CLEAR", wajah="senang",
  cara="Dua tangan O-pipih bertemu di depan dada lalu membuka ke atas-samping menjadi 5 (terang, jelas).")

S("B26_ANSWER", "Menjawab / jawaban", "Presentasi", [
    k(0, p="mulut+0.05*depan", a="telunjuk", b="1", j="atas", tp="dalam"),
    k(0.15),
    k(0.55, p="mulut+0.25*depan+0.12*bawah", j="depan+0.4*atas", tp="bawah"),
    k(0.75),
], L=[k(0, p="dagu+0.10*depan+0.10*bawah+0.06*kiri", a="telunjuk", b="1", j="atas", tp="dalam"),
      k(0.15), k(0.55, p="dagu+0.30*depan+0.22*bawah+0.06*kiri", j="depan+0.4*atas", tp="bawah"), k(0.75)],
  cara="Dua telunjuk tegak (kanan di depan mulut, kiri di depannya) diayun bersama ke depan-bawah.")

# ── Rapat, kerja & layanan ─────────────────────────────────────────────────

S("B26_DISCUSS", "Berdiskusi / membahas", "Kerja", [
    k(0, p=A(0.03, -0.36, 1.21), a="telunjuk", b="1", j="depan+0.3*dalam", tp="dalam"),
    *bolak(0.12, 0.13, 6, {"p": A(0.03, -0.36, 1.175)}, {"p": A(0.03, -0.36, 1.21)}),
    k(0.95, p=A(0.03, -0.36, 1.175)),
], L=[k(0, **_ALAS)],
  cara="Sisi telunjuk kanan mengetuk telapak kiri berulang-ulang (membahas poin satu per satu).")

_putus = [
    k(0, p=_DAHI + "+0.04*depan", a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang"),
    k(0.18, p=_DAHI),
    k(0.32),
    k(0.5, p=A(-0.07, -0.42, 1.34), b="F", j="depan", tp="dalam"),
    k(0.75, p=A(-0.07, -0.42, 1.22)),
    k(0.9),
]
S("B26_DECIDE", "Memutuskan / keputusan", "Kerja", _putus,
  L=[k(0, **IST["L"]), k(0.45, p=A(0.07, -0.42, 1.34), a="telunjuk", b="F", j="depan", tp="dalam"),
     k(0.75, p=A(0.07, -0.42, 1.22)), k(0.9)],
  kepala=[(0.5, 0, 0, 0), (0.75, 10, 0, 0), (0.9, 3, 0, 0)], gloss="DECIDE",
  cara="Telunjuk menyentuh dahi, lalu dua tangan F turun bersama dengan tegas (keputusan dijatuhkan).")

S("B26_VOTE", "Memilih (pemungutan suara)", "Kerja", [
    k(0, p=A(0.04, -0.37, 1.30), a="ujung", b="F", j="bawah", tp="dalam"),
    *bolak(0.15, 0.17, 4, {"p": A(0.04, -0.37, 1.235)}, {"p": A(0.04, -0.37, 1.30)}),
    k(0.85, p=A(0.04, -0.37, 1.235)),
], L=[k(0, p=A(0.04, -0.37, 1.19), a="telapak", b="O", j="depan+0.3*dalam", tp="dalam+0.3*atas")],
  cara="Ujung jari tangan F dimasukkan ke lingkaran tangan O kiri dua kali (memasukkan surat suara).")

S("B26_TEAM", "Tim", "Kerja",
  [k(0, p=A(-0.03, -0.44, 1.26), a="telapak", b="T", j="atas", tp="depan"),
   k(0.15),
   k(0.45, p=A(-0.13, -0.38, 1.26), kurva=True),
   k(0.75, p=A(-0.03, -0.30, 1.26), tp="belakang"),
   k(0.9)],
  L=cermin([k(0, p=A(-0.03, -0.44, 1.26), a="telapak", b="T", j="atas", tp="depan"),
            k(0.15),
            k(0.45, p=A(-0.13, -0.38, 1.26), kurva=True),
            k(0.75, p=A(-0.03, -0.30, 1.26), tp="belakang"),
            k(0.9)]),
  cara="Dua tangan bentuk T bertemu di depan, lalu melingkar ke samping dan bertemu lagi di dekat badan (kelompok dengan huruf T).")

S("B26_RESPONSIBLE", "Bertanggung jawab", "Kerja", [
    k(0, p="bahu_kanan+0.07*depan+0.08*atas", a="ujung", b="BENT_B", j="bawah+0.6*belakang+0.3*dalam", tp="belakang", siku="bawah+0.5*luar"),
    k(0.15),
    k(0.5, p="bahu_kanan+0.07*depan+0.04*atas"),
    k(0.75),
], L=[k(0, **IST["L"]), k(0.15, p="bahu_kanan+0.07*depan+0.08*atas+0.06*kiri", a="ujung", b="BENT_B", j="bawah+0.6*belakang", tp="belakang"),
      k(0.5, p="bahu_kanan+0.07*depan+0.04*atas+0.06*kiri"), k(0.75)],
  cara="Ujung jari dua tangan bengkok menekan bahu kanan ke bawah (beban di pundak).")

S("B26_EXPERIENCE", "Pengalaman", "Kerja", [
    k(0, p="pipi+0.02*depan+0.01*luar", a="ujung", b="5", j="atas+0.4*belakang", tp="belakang+0.5*dalam"),
    k(0.12),
    k(0.4, p="pipi+0.06*depan+0.06*luar", b="FLAT_O"),
    k(0.55, p="pipi+0.02*depan+0.01*luar", b="5"),
    k(0.85, p="pipi+0.06*depan+0.06*luar", b="FLAT_O"),
    k(1.0),
], cara="Tangan 5 di pipi/pelipis ditarik keluar sambil mengatup menjadi O-pipih, dua kali.")

S("B26_SKILL", "Keahlian / terampil", "Kerja", [
    k(0, p=A(0.02, -0.38, 1.18), a="telapak", b="C", j="atas+0.2*depan", tp="dalam+0.5*belakang"),
    k(0.15),
    k(0.55, p=A(0.02, -0.50, 1.17), b="A"),
    k(0.75),
], L=[k(0, p=A(0.04, -0.36, 1.22), a="sisi_kelingking", b="FLAT", j="depan+0.2*dalam", tp="dalam")],
  wajah="senang", cara="Tangan kanan menggenggam sisi kelingking tangan kiri yang tegak, lalu ditarik maju menutup menjadi A.")

S("B26_PROBLEM", "Masalah", "Kerja", [
    k(0, p=A(-0.012, -0.40, 1.25), a="ujung", b="BENT_V", j="dalam+0.3*depan", tp="belakang"),
    *bolak(0.15, 0.18, 4, {"putar": 35}, {"putar": -20}),
    k(0.9, putar=0),
], L=cermin([
    k(0, p=A(-0.012, -0.40, 1.25), a="ujung", b="BENT_V", j="dalam+0.3*depan", tp="belakang"),
    *bolak(0.15, 0.18, 4, {"putar": -20}, {"putar": 35}),
    k(0.9, putar=0),
]), wajah="sedih", cara="Dua tangan V bengkok, buku jari saling bertemu dan diputar berlawanan (sesuatu yang bergesekan).")

S("B26_COMPLAIN", "Mengeluh / keluhan", "Layanan", [
    k(0, p="dada+0.06*depan", a="ujung", b="CLAW", j="belakang+0.3*atas", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"p": "dada+0.012*depan"}, {"p": "dada+0.06*depan"}),
    k(0.75, p="dada+0.012*depan"),
], wajah="sedih", cara="Ujung jari tangan cakar mengetuk dada dua kali, wajah tidak puas.")

_betul = [
    k(0, p=A(-0.012, -0.40, 1.25), a="ujung", b="FLAT_O", j="atas+0.6*dalam", tp="depan"),
    k(0.2, p=A(-0.012, -0.40, 1.25), putar=-30),
    k(0.4, putar=20),
    k(0.6, putar=-30),
    k(0.8, putar=0),
]
S("B26_FIX", "Memperbaiki / solusi", "Layanan", _betul,
  L=[k(0, p=A(0.012, -0.40, 1.25), a="ujung", b="FLAT_O", j="atas+0.6*dalam", tp="belakang"),
     k(0.2, putar=30), k(0.4, putar=-20), k(0.6, putar=30), k(0.8, putar=0)],
  gloss="FIX", cara="Dua tangan O-pipih, ujung jari saling bersentuhan, diusapkan bergantian berulang (memperbaiki).")

S("B26_SUPPORT", "Mendukung", "Layanan", [
    k(0, p=A(0.03, -0.38, 1.12), a="buku", b="S", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.55, p=A(0.03, -0.38, 1.22)),
    k(0.75),
], L=[k(0, p=A(0.03, -0.38, 1.17), a="telapak", b="S", j="dalam+0.4*depan", tp="bawah"),
      k(0.15), k(0.55, p=A(0.03, -0.38, 1.27)), k(0.75)],
  cara="Kepalan kanan mendorong ke atas kepalan kiri dari bawah (menopang).")

S("B26_RESPECT", "Menghormati", "Layanan", [
    k(0, p="dahi+0.05*depan+0.04*luar", a="ujung", b="R", j="atas+0.4*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p="dagu+0.22*depan+0.10*bawah+0.04*luar", j="atas+0.6*depan"),
    k(0.8),
], kepala=[(0.15, 0, 0, 0), (0.6, 8, 0, 0), (0.85, 2, 0, 0)],
  cara="Tangan bentuk R di dekat dahi melengkung turun ke depan, kepala sedikit menunduk.")

S("B26_WELCOME", "Selamat datang / mempersilakan", "Layanan", [
    k(0, p=A(-0.22, -0.40, 1.20), a="telapak", b="FLAT", j="luar+0.6*depan", tp="atas"),
    k(0.15),
    k(0.65, p=A(-0.05, -0.24, 1.18), j="dalam+0.5*depan"),
    k(0.85),
], wajah="senang", cara="Tangan datar telapak ke atas mengayun dari samping ke arah badan (mengundang masuk).")

S("B26_EVALUATE", "Menilai / evaluasi", "Kerja", [
    k(0, p=A(-0.08, -0.40, 1.27), a="ujung", b="E", j="atas+0.3*depan", tp="depan"),
    *bolak(0.15, 0.17, 5, {"p": A(-0.08, -0.40, 1.21)}, {"p": A(-0.08, -0.40, 1.29)}),
    k(1.0),
], L=cermin([
    k(0, p=A(-0.08, -0.40, 1.21), a="ujung", b="E", j="atas+0.3*depan", tp="depan"),
    *bolak(0.15, 0.17, 5, {"p": A(-0.08, -0.40, 1.29)}, {"p": A(-0.08, -0.40, 1.21)}),
    k(1.0),
]), gloss="EVALUATE",
  cara="Dua tangan bentuk E naik-turun bergantian seperti timbangan.")

# ── Tambahan umum (dipakai di dialog) ──────────────────────────────────────

S("B26_HAVE", "Punya / ada", "Umum", [
    k(0, p="dada+0.10*depan+0.06*luar", a="ujung", b="BENT_B", j="belakang+0.4*dalam", tp="belakang+0.3*bawah"),
    k(0.15),
    k(0.45, p="dada+0.015*depan+0.06*luar"),
    k(0.7),
], L=cermin([
    k(0, p="dada+0.10*depan+0.06*luar", a="ujung", b="BENT_B", j="belakang+0.4*dalam", tp="belakang+0.3*bawah"),
    k(0.15),
    k(0.45, p="dada+0.015*depan+0.06*luar"),
    k(0.7),
]), gloss="HAVE", cara="Ujung jari dua tangan bengkok bergerak mendekat dan menyentuh dada (milik sendiri).")

_tunggu_r = [k(0, p=A(-0.13, -0.30, 1.20), a="telapak", b="5", j="depan+0.3*dalam+0.2*atas", tp="atas")]
_tunggu_r += bolak(0.12, 0.12, 7, {"b": "CLAW"}, {"b": "5"})
_tunggu_r.append(k(1.0, b="5"))
_tunggu_l = [k(0, p=A(-0.06, -0.42, 1.21), a="telapak", b="5", j="depan+0.3*dalam+0.2*atas", tp="atas")]
_tunggu_l += bolak(0.12, 0.12, 7, {"b": "5"}, {"b": "CLAW"})
_tunggu_l.append(k(1.0, b="5"))
S("B26_WAIT", "Menunggu", "Umum", _tunggu_r, L=cermin(_tunggu_l), gloss="WAIT",
  cara="Dua tangan 5 telapak ke atas (kiri lebih depan), jari-jari digerak-gerakkan seperti menunggu.")
