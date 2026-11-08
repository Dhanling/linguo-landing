# [isyarat-b1b2-v1] Kamus isyarat ASL B2.3 "News, Society & Politics — Berita, Masyarakat & Politik".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# Kode baru berawalan B23_ (gloss tampil tanpa awalan).
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli, terutama VOTE, ROBOT, CAMERA, PROCESS,
#    CL_TREND, EQUAL, SALARY yang variasinya banyak.

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_KIRI_ATAS = dict(p=A(0.03, -0.32, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
_KIRI_TEGAK = dict(p=A(0.035, -0.385, 1.27), a="telapak", b="FLAT", j="atas", tp="dalam")
_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"

# ── Berita & media ─────────────────────────────────────────────────────────

_tulis = [k(0, p=A(0.05, -0.27, 1.18), a="telunjuk", b="BABY_O", j="depan+0.5*bawah+0.3*dalam", tp="dalam")]
for _i, (_x, _z) in enumerate(((0.035, 1.175), (0.04, 1.185), (0.025, 1.175), (0.03, 1.185), (0.015, 1.175))):
    _tulis.append(k(0.15 + 0.13 * _i, p=A(_x, -0.29 - 0.02 * (_i + 1), _z), kurva=True))
_tulis.append(k(0.95))
S("B23_WRITE", "Menulis", "Berita", _tulis, L=[k(0, **_KIRI_ATAS)],
  gloss="WRITE", cara="Telunjuk & ibu jari seperti memegang pena, 'menulis' bergelombang di telapak kiri (+ PERSON = penulis/jurnalis).")

S("B23_CAMERA", "Kamera / merekam", "Berita", [
    k(0, p="mata+0.17*depan+0.07*luar+0.05*bawah", a="telapak", b="L", j="dalam+0.3*atas", tp="depan"),
    *bolak(0.15, 0.15, 4, {"b": "BENT_L"}, {"b": "L"}),
    k(0.8),
], L=cermin([k(0, p="mata+0.17*depan+0.07*luar+0.05*bawah", a="telapak", b="L", j="dalam+0.3*atas", tp="depan")]),
  gloss="CAMERA", cara="Dua tangan L membingkai di depan mata seperti kamera, telunjuk kanan menekan tombol.")

S("B23_TV", "Televisi", "Berita", [], gloss="TV", cara="Dieja jari: T-V.")

# ── Pemerintahan & pemilu ──────────────────────────────────────────────────

S("B23_GOVERNMENT", "Pemerintah", "Politik",
  lingkar(0, 0.45, _DAHI + "+0.07*depan+0.02*luar", 0.022, "luar", "atas", n=6, mulai=90,
          a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang") +
  [k(0.65, p=_DAHI), k(0.85)],
  gloss="GOVERNMENT", cara="Telunjuk membuat lingkaran kecil di dekat pelipis, lalu menyentuh pelipis.")

S("B23_VOTE", "Memilih (pemilu) / pemilihan", "Politik", [
    k(0, p=A(0.03, -0.36, 1.29), a="telunjuk", b="F", j="bawah+0.5*depan+0.3*dalam", tp="dalam", siku="bawah+0.5*luar"),
    *bolak(0.15, 0.15, 4, {"p": A(0.03, -0.36, 1.235)}, {"p": A(0.03, -0.36, 1.28)}),
    k(0.8, p=A(0.03, -0.36, 1.235)),
], L=[k(0, p=A(0.03, -0.36, 1.20), a="telapak", b="O", j="depan+0.2*dalam", tp="dalam")],
  gloss="VOTE", cara="Ujung jari tangan F dimasukkan ke lubang tangan O kiri dua kali, seperti memasukkan surat suara (diulang = ELECTION).")

_presiden = [
    k(0, p="pelipis+0.09*depan+0.04*luar+0.08*bawah", a="telapak", b="C", j="atas+0.3*luar", tp="depan"),
    k(0.15),
    k(0.55, p="pelipis+0.10*depan+0.14*luar+0.02*bawah", b="S"),
    k(0.75),
]
S("B23_PRESIDENT", "Presiden", "Politik", _presiden, L=cermin(_presiden),
  gloss="PRESIDENT", cara="Dua tangan C di samping dahi ditarik ke luar-atas sambil mengepal (seperti tanduk / mahkota).")

S("B23_LEAD", "Memimpin", "Politik", [
    k(0, p=A(0.02, -0.42, 1.245), a="ujung", b="FLAT_O", j="dalam+0.4*depan", tp="bawah+0.3*dalam"),
    k(0.15),
    k(0.6, p=A(-0.01, -0.55, 1.245)),
    k(0.8),
], L=[k(0, p=A(0.03, -0.33, 1.24), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
      k(0.15), k(0.6, p=A(0.0, -0.46, 1.24)), k(0.8)],
  gloss="LEAD", cara="Tangan kanan memegang ujung jari tangan kiri lalu menariknya ke depan (+ PERSON = pemimpin).")

_rakyat = lingkar(0, 1.0, A(-0.08, -0.38, 1.25), 0.035, "depan", "atas", n=8, mulai=90, putaran=2,
                  a="telapak", b="P", j="bawah+0.5*depan", tp="dalam")
S("B23_PEOPLE", "Orang-orang / rakyat / publik", "Politik", _rakyat + [k(1.15)],
  L=cermin(lingkar(0, 1.0, A(-0.08, -0.38, 1.25), 0.035, "depan", "atas", n=8, mulai=270, putaran=2,
                   a="telapak", b="P", j="bawah+0.5*depan", tp="dalam") + [k(1.15)]),
  gloss="PEOPLE", cara="Dua tangan bentuk P berputar bergantian ke depan.")

# ── Hukum & hak ────────────────────────────────────────────────────────────

_sama = [k(0, p=A(-0.06, -0.38, 1.24), a="ujung", b="BENT_B", j="dalam+0.2*depan", tp="bawah", siku="bawah+0.5*luar")]
S("B23_EQUAL", "Setara / adil", "Hukum",
  _sama + bolak(0.15, 0.15, 4, {"p": A(-0.012, -0.38, 1.24)}, {"p": A(-0.05, -0.38, 1.24)}) + [k(0.8, p=A(-0.012, -0.38, 1.24))],
  L=cermin(_sama + bolak(0.15, 0.15, 4, {"p": A(-0.012, -0.38, 1.24)}, {"p": A(-0.05, -0.38, 1.24)}) + [k(0.8, p=A(-0.012, -0.38, 1.24))]),
  gloss="EQUAL", cara="Dua tangan tertekuk (telapak ke bawah), ujung jarinya diketukkan bertemu dua kali — sejajar, setara.")

S("B23_POLICY", "Kebijakan", "Hukum", [
    k(0, p=A(0.035, -0.385, 1.33), a="ujung", b="P", j="atas+0.3*depan", tp="dalam"),
    k(0.15, p=A(0.03, -0.385, 1.31)),
    k(0.3, p=A(0.035, -0.385, 1.29)),
    k(0.5, p=A(0.03, -0.385, 1.24)),
    k(0.75),
], L=[k(0, **_KIRI_TEGAK)],
  gloss="POLICY", cara="Tangan bentuk P ditempelkan ke telapak kiri yang tegak, atas lalu bawah (seperti LAW dengan P).")

S("B23_CRITICIZE", "Mengkritik / kritik", "Hukum", [
    k(0, p=A(0.0, -0.36, 1.32), a="telunjuk", b="1", j="dalam+0.2*depan", tp="bawah"),
    k(0.1, p=A(0.028, -0.36, 1.32)),
    k(0.3, p=A(0.028, -0.42, 1.24)),
    k(0.4, p=A(0.0, -0.42, 1.30)),
    k(0.5, p=A(0.028, -0.42, 1.32)),
    k(0.7, p=A(0.028, -0.36, 1.24)),
    k(0.85),
], L=[k(0, **_KIRI_TEGAK)],
  gloss="CRITICIZE", cara="Telunjuk menggambar tanda X di telapak kiri yang tegak (mencoret).")

S("B23_ANSWER", "Menjawab / menanggapi", "Hukum", [
    k(0, p="mulut+0.03*depan", a="telunjuk", b="1", j="atas", tp="dalam"),
    k(0.15),
    k(0.55, p="mulut+0.20*depan+0.18*bawah", j="depan", tp="bawah"),
    k(0.75),
], L=[k(0, p=A(0.04, -0.24, 1.38), a="telunjuk", b="1", j="atas", tp="dalam"),
      k(0.15), k(0.55, p=A(0.04, -0.40, 1.26), j="depan", tp="bawah"), k(0.75)],
  gloss="ANSWER", cara="Telunjuk kanan di depan mulut (kiri di depannya) diayun maju-turun sampai menunjuk ke depan (ANSWER / RESPOND).")

# ── Ekonomi ────────────────────────────────────────────────────────────────

S("B23_SALARY", "Gaji / penghasilan", "Ekonomi", [
    k(0, p=A(0.02, -0.44, 1.20), a="ujung", b="C", j="dalam", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.55, p=A(0.0, -0.27, 1.20), b="S"),
    k(0.75),
], L=[k(0, p=A(0.035, -0.36, 1.20), a="telapak", b="FLAT", j="depan", tp="dalam")],
  gloss="SALARY / EARN", cara="Tangan C mengeruk sepanjang telapak kiri yang tegak ke arah badan sambil mengepal — mengumpulkan uang.")

S("B23_INCREASE", "Naik / meningkat", "Ekonomi", [
    k(0, p=A(-0.09, -0.38, 1.17), a="telapak", b="H", j="dalam+0.5*depan", tp="atas"),
    k(0.15),
    k(0.38, p=A(-0.04, -0.38, 1.27), tp="dalam"),
    k(0.58, p=A(0.02, -0.38, 1.225), tp="bawah"),
    k(0.8),
], L=[k(0, p=A(0.03, -0.38, 1.20), a="telapak", b="H", j="dalam+0.5*depan", tp="bawah")],
  gloss="INCREASE", cara="Tangan H kanan (telapak ke atas) dibalik dan ditumpuk di atas tangan H kiri — bertambah.")

S("B23_DECREASE", "Turun / berkurang", "Ekonomi", [
    k(0, p=A(0.02, -0.38, 1.225), a="telapak", b="H", j="dalam+0.5*depan", tp="bawah"),
    k(0.15),
    k(0.38, p=A(-0.04, -0.38, 1.27), tp="dalam"),
    k(0.58, p=A(-0.09, -0.38, 1.17), tp="atas"),
    k(0.8),
], L=[k(0, p=A(0.03, -0.38, 1.20), a="telapak", b="H", j="dalam+0.5*depan", tp="bawah")],
  gloss="DECREASE", cara="Kebalikan INCREASE: tangan H kanan diangkat dari atas tangan H kiri lalu dibalik turun.")

S("B23_TAX", "Pajak", "Ekonomi", [], gloss="TAX", cara="Dieja jari: T-A-X (ada juga yang memakai isyarat COST).")

_naik = [k(0.0, p=A(0.10, -0.40, 1.18), a="telunjuk", b="1", j="depan+0.2*atas", tp="bawah")]
for _i, (_x, _z) in enumerate(((0.04, 1.26), (-0.01, 1.22), (-0.07, 1.32), (-0.12, 1.28), (-0.16, 1.38))):
    _naik.append(k(0.15 + 0.17 * (_i + 1), p=A(_x, -0.40, _z)))
_naik.append(k(1.2))
S("B23_CL_TREND", "Classifier garis grafik (naik-turun)", "Data", _naik,
  gloss="CL:1-GRAFIK", cara="Telunjuk menelusuri garis grafik di ruang dari kiri ke kanan, naik-turun mengikuti data.")

# ── Kesehatan masyarakat ───────────────────────────────────────────────────

S("B23_VACCINE", "Vaksin / suntik", "Kesehatan", [
    k(0, p=A(0.19, -0.18, 1.32), a="telunjuk", b="L", j="dalam+0.3*belakang", tp="bawah"),
    k(0.15, p=A(0.20, -0.145, 1.31)),
    k(0.35),
    k(0.55, b="G"),
    k(0.8),
], gloss="VACCINE / SHOT", cara="Tangan L seperti alat suntik ditempelkan ke lengan atas kiri, ibu jari menekan.")

_sebar = [
    k(0, p="netral+0.03*dalam+0.03*atas", a="ujung", b="FLAT_O", j="depan+0.3*bawah", tp="bawah"),
    k(0.15),
    k(0.6, p="netral+0.10*luar+0.14*depan", b="5", j="depan+0.3*luar"),
    k(0.8),
]
S("B23_SPREAD", "Menyebar", "Kesehatan", _sebar, L=cermin(_sebar),
  gloss="SPREAD", cara="Dua tangan O-pipih (telapak ke bawah) bergerak maju menyebar sambil membuka — wabah/kabar menyebar.")

# ── Lingkungan & bencana ──────────────────────────────────────────────────

_banjir = [
    k(0, p=A(-0.10, -0.36, 1.09), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.4, p=A(-0.10, -0.36, 1.16), b="5_TEKUK"),
    k(0.65, p=A(-0.10, -0.36, 1.23), b="5"),
    k(0.9, p=A(-0.10, -0.36, 1.30), b="5_TEKUK"),
    k(1.05),
]
S("B23_FLOOD", "Banjir", "Bencana", _banjir, L=cermin(_banjir),
  gloss="FLOOD", cara="(Didahului WATER) dua tangan 5 telapak ke bawah naik bertahap sambil jari bergerak — air naik.")

_gempa_R = [k(0, p=A(-0.08, -0.38, 1.22), a="telapak", b="S", j="depan+0.3*dalam", tp="bawah")]
_gempa_L = [k(0, p=A(0.08, -0.38, 1.22), a="telapak", b="S", j="depan+0.3*dalam", tp="bawah")]
S("B23_EARTHQUAKE", "Gempa bumi", "Bencana",
  _gempa_R + bolak(0.12, 0.1, 8, {"p": A(-0.05, -0.38, 1.22)}, {"p": A(-0.11, -0.38, 1.22)}) + [k(1.0)],
  L=_gempa_L + bolak(0.12, 0.1, 8, {"p": A(0.11, -0.38, 1.22)}, {"p": A(0.05, -0.38, 1.22)}) + [k(1.0)],
  wajah="sedih", gloss="EARTHQUAKE", cara="(EARTH +) dua kepalan diguncang kiri-kanan bersamaan dengan kuat.")

S("B23_WARN", "Memperingatkan / peringatan", "Bencana", [
    k(0, p=A(0.03, -0.33, 1.27), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.03, -0.33, 1.225)}, {"p": A(0.03, -0.33, 1.26)}),
    k(0.8, p=A(0.03, -0.33, 1.225)),
], L=[k(0, p=A(0.03, -0.33, 1.20), a="punggung", b="FLAT", j="dalam+0.5*depan", tp="bawah")],
  wajah="sedih", gloss="WARN", cara="Telapak kanan menepuk punggung tangan kiri dua kali.")

S("B23_CHANGE", "Berubah / perubahan", "Bencana", [
    k(0, p=A(-0.02, -0.38, 1.25), a="buku", b="X", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.55, putar=150),
    k(0.75),
], L=[k(0, p=A(0.02, -0.38, 1.22), a="buku", b="X", j="depan+0.3*dalam", tp="dalam"),
      k(0.15), k(0.55, putar=150), k(0.75)],
  gloss="CHANGE", cara="Dua tangan X saling berdekatan lalu diputar berlawanan sehingga posisinya bertukar.")

# ── Sains & teknologi ──────────────────────────────────────────────────────

S("B23_SCIENCE", "Sains / ilmu pengetahuan", "Sains",
  lingkar(0, 1.0, A(-0.07, -0.38, 1.30), 0.035, "luar", "depan", n=8, mulai=0, putaran=2,
          a="telapak", b="A", j="depan+0.2*dalam", tp="luar") + [k(1.15)],
  L=cermin(lingkar(0, 1.0, A(-0.07, -0.38, 1.30), 0.035, "luar", "depan", n=8, mulai=180, putaran=2,
                   a="telapak", b="A", j="depan+0.2*dalam", tp="luar") + [k(1.15)]),
  gloss="SCIENCE", cara="Dua tangan A dengan ibu jari ke bawah berputar bergantian seperti menuang cairan di laboratorium.")

_robot = [k(0, p=A(-0.12, -0.32, 1.20), a="telapak", b="S", j="depan", tp="dalam")]
S("B23_ROBOT", "Robot", "Sains",
  _robot + [k(0.15), k(0.3, p=A(-0.12, -0.42, 1.20)), k(0.45), k(0.6, p=A(-0.12, -0.32, 1.20)), k(0.75), k(0.9, p=A(-0.12, -0.42, 1.20)), k(1.05)],
  L=cermin(_robot + [k(0.15, p=A(-0.12, -0.42, 1.20)), k(0.3), k(0.45, p=A(-0.12, -0.32, 1.20)), k(0.6), k(0.75, p=A(-0.12, -0.42, 1.20)), k(0.9), k(1.05)]),
  gloss="ROBOT", cara="Dua kepalan bergerak maju-mundur bergantian dengan kaku seperti lengan robot (banyak juga yang mengeja R-O-B-O-T).")

S("B23_PROCESS", "Proses / berjalan bertahap", "Sains",
  lingkar(0, 1.0, A(-0.03, -0.40, 1.25), 0.04, "depan", "atas", n=10, mulai=90, putaran=2,
          a="telapak", b="BENT_B", j="dalam+0.4*depan", tp="belakang") + [k(1.15)],
  L=cermin(lingkar(0, 1.0, A(-0.03, -0.40, 1.25), 0.04, "depan", "atas", n=10, mulai=270, putaran=2,
                   a="telapak", b="BENT_B", j="dalam+0.4*depan", tp="belakang") + [k(1.15)]),
  gloss="PROCESS", cara="Dua tangan tertekuk berputar bergantian ke depan seperti roda — proses yang berjalan.")

# ── Pendidikan & inklusi ───────────────────────────────────────────────────

_didik = [
    k(0, p="pelipis+0.06*depan+0.05*luar+0.08*bawah", a="ujung", b="E", j="depan+0.6*atas", tp="dalam"),
    *bolak(0.18, 0.18, 3, {"p": "pelipis+0.17*depan+0.05*luar+0.10*bawah"}, {"p": "pelipis+0.06*depan+0.05*luar+0.08*bawah"}),
    k(0.7),
]
S("B23_EDUCATION", "Pendidikan", "Pendidikan", _didik, L=cermin(_didik),
  gloss="EDUCATION", cara="Seperti TEACH dengan dua tangan E: dari samping dahi didorong ke depan dua kali.")

S("B23_INCLUDE", "Melibatkan / inklusi", "Pendidikan", [
    k(0, p=A(-0.13, -0.42, 1.31), a="ujung", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.4, p=A(-0.05, -0.40, 1.33)),
    k(0.65, p=A(0.02, -0.37, 1.225), b="FLAT_O", j="bawah+0.3*depan", tp="belakang", siku="bawah+0.5*luar"),
    k(0.85),
], L=[k(0, p=A(0.035, -0.37, 1.20), a="telapak", b="C", j="depan", tp="dalam")],
  gloss="INCLUDE", cara="Tangan 5 menyapu melengkung lalu masuk ke dalam tangan C kiri sebagai O-pipih — semua masuk.")

# ── Budaya populer ─────────────────────────────────────────────────────────

_terkenal = [
    k(0, p="mulut+0.03*luar+0.03*depan", a="telunjuk", b="1", j="atas+0.4*dalam", tp="belakang"),
    k(0.15),
    k(0.35, p="mulut+0.08*luar+0.09*depan+0.03*atas"),
    k(0.6, p="mulut+0.15*luar+0.16*depan+0.06*atas", j="atas+0.4*depan+0.2*luar"),
    k(0.8),
]
S("B23_FAMOUS", "Terkenal", "Budaya", _terkenal, L=cermin(_terkenal), wajah="senang",
  gloss="FAMOUS", cara="Dua telunjuk dari sisi mulut bergerak keluar-maju menjauh — nama tersebar luas.")

S("B23_FOLLOW", "Mengikuti / lanjutan", "Budaya", [
    k(0, p=A(-0.02, -0.30, 1.24), a="telapak", b="A", j="depan", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.04, -0.44, 1.24)),
    k(0.8),
], L=[k(0, p=A(0.02, -0.38, 1.24), a="telapak", b="A", j="depan", tp="dalam"),
      k(0.15), k(0.6, p=A(0.0, -0.52, 1.24)), k(0.8)],
  gloss="FOLLOW", cara="Dua tangan A (ibu jari tegak), kanan di belakang kiri, bergerak maju bersama — mengikuti.")
