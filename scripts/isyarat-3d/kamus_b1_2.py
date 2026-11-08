# [isyarat-b1b2-v1] Kamus isyarat ASL B1.2 "Role Shift & Narrative — Role Shift & Narasi".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli (terutama CHARACTER, ANALYZE, LEAF,
#    EMBARRASSED, WORRY, RELIEVED, ATTENTION yang variasinya banyak).
# Bentuk tangan pinjaman: A13_H_TEKUK (kamus_a1_3) untuk RABBIT.

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_KIRI_ATAS = dict(p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
_KIRI_TEGAK = dict(p=A(0.05, -0.33, 1.27), a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam")

# ── Struktur cerita ────────────────────────────────────────────────────────

S("B12_BEGIN", "Mulai / awal", "Narasi", [
    k(0, p=A(0.035, -0.40, 1.31), a="telunjuk", b="1", j="dalam+0.4*depan", tp="bawah"),
    k(0.15),
    k(0.5, putar=-70),
    k(0.7),
], L=[k(0, p=A(0.055, -0.37, 1.25), a="telapak", b="FLAT", j="atas+0.4*depan", tp="dalam")],
  gloss="BEGIN", cara="Telunjuk kanan diselipkan di antara jari telunjuk & tengah tangan kiri yang terbuka, lalu diputar — seperti memutar kunci.")

S("B12_END", "Akhir / tamat", "Narasi", [
    k(0, p=A(0.03, -0.29, 1.29), a="sisi_kelingking", b="FLAT", j="depan", tp="dalam+0.3*bawah"),
    k(0.15),
    k(0.5, p=A(0.03, -0.45, 1.29)),
    k(0.7, p=A(0.03, -0.49, 1.21)),
    k(0.85),
], L=[k(0, p=A(0.05, -0.35, 1.24), a="telapak", b="FLAT", j="depan", tp="dalam")],
  gloss="END", cara="Tangan kanan meluncur di sepanjang tepi atas tangan kiri lalu jatuh melewati ujung jarinya — sampai di ujung.")

S("B12_MIDDLE", "Tengah / bagian tengah", "Narasi",
  lingkar(0, 0.6, A(0.04, -0.33, 1.235), 0.035, "luar", "depan", n=8, mulai=90,
          a="ujung", b="FLAT_O", j="bawah+0.2*depan", tp="belakang") +
  [k(0.85, p=A(0.04, -0.32, 1.175)), k(1.0)],
  L=[k(0, **_KIRI_ATAS)],
  gloss="MIDDLE", cara="Ujung jari kanan berputar di atas telapak kiri lalu mendarat di tengahnya.")

_PROB = [
    k(0, p=A(-0.018, -0.38, 1.26), a="buku", b="BENT_V", j="dalam+0.2*depan", tp="bawah"),
    k(0.15),
    *bolak(0.3, 0.2, 3, {"putar": 35}, {"putar": -30}),
    k(0.9, putar=0),
]
S("B12_PROBLEM", "Masalah / konflik", "Narasi", _PROB, L=cermin([
    k(0, p=A(-0.018, -0.38, 1.26), a="buku", b="BENT_V", j="dalam+0.2*depan", tp="bawah"),
    k(0.15),
    *bolak(0.3, 0.2, 3, {"putar": -30}, {"putar": 35}),
    k(0.9, putar=0),
]), wajah="sedih", gloss="PROBLEM", cara="Buku jari dua tangan V bengkok saling bersentuhan dan diputar berlawanan arah.")

S("B12_CHARACTER", "Tokoh / karakter", "Narasi",
  lingkar(0, 0.6, "dada_kiri+0.07*depan+0.02*atas", 0.03, "luar", "atas", n=8, mulai=90,
          a="jempol", b="C", j="atas", tp="dalam+0.3*belakang") +
  [k(0.85, p="dada_kiri+0.015*depan+0.02*atas"), k(1.0)],
  gloss="CHARACTER", cara="Tangan C berputar kecil di depan dada kiri lalu ditempelkan ke dada.")

_WHILE = [
    k(0, p=A(-0.06, -0.30, 1.27), a="telunjuk", b="1", j="depan", tp="bawah"),
    k(0.15),
    k(0.45, p=A(-0.06, -0.40, 1.22), kurva=True),
    k(0.75, p=A(-0.06, -0.50, 1.25), kurva=True),
    k(0.9),
]
S("B12_WHILE", "Sementara / selama", "Waktu", _WHILE, L=cermin(_WHILE),
  gloss="WHILE", cara="Dua telunjuk sejajar menunjuk ke depan, bergerak maju bersama dalam lengkungan — dua hal berjalan bersamaan.")

S("B12_UNTIL", "Sampai / hingga", "Waktu", [
    k(0, p=A(-0.08, -0.32, 1.30), a="telunjuk", b="1", j="depan+0.6*atas", tp="dalam+0.3*bawah"),
    k(0.15),
    k(0.45, p=A(-0.02, -0.40, 1.44), kurva=True),
    k(0.75, p=A(0.045, -0.44, 1.37), j="depan+0.6*dalam+0.2*bawah", kurva=True),
    k(0.95),
], L=[k(0, **IST["L"]), k(0.2, p=A(0.05, -0.44, 1.36), a="telunjuk", b="1", j="atas", tp="dalam"), k(0.95)],
  gloss="UNTIL", cara="Telunjuk kanan melengkung ke depan dan berhenti menyentuh ujung telunjuk kiri yang tegak — sampai titik itu.")

S("B12_CONTINUE", "Berlanjut / terus", "Narasi", [
    k(0, p=A(0.0, -0.31, 1.265), a="jempol", b="A", j="depan+0.4*dalam", tp="dalam+0.6*bawah"),
    k(0.15),
    k(0.7, p=A(0.0, -0.47, 1.245)),
    k(0.85),
], L=[
    k(0, p=A(0.0, -0.31, 1.24), a="jempol", b="A", j="depan+0.4*dalam", tp="dalam+0.6*bawah"),
    k(0.15),
    k(0.7, p=A(0.0, -0.47, 1.22)),
    k(0.85),
], gloss="CONTINUE", cara="Ibu jari kepalan kanan bertumpu di ibu jari kepalan kiri, keduanya bergerak maju bersama.")

S("B12_EXPERIENCE", "Pengalaman", "Narasi", [
    k(0, p="pelipis+0.035*luar+0.01*depan", a="telapak", b="5", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.6, p="pelipis+0.10*luar+0.03*depan+0.02*bawah", b="FLAT_O"),
    k(0.8),
], gloss="EXPERIENCE", cara="Tangan terbuka di pelipis menjauh ke samping sambil mengatup (O-pipih) — mengumpulkan pengalaman.")

# ── Cerita anak & dongeng ──────────────────────────────────────────────────

S("B12_CHILDREN", "Anak-anak", "Dongeng", [
    k(0, p="netral+0.03*bawah+0.02*dalam", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.12, p="netral+0.06*bawah+0.02*dalam"),
    k(0.27, p="netral+0.03*bawah+0.06*luar"),
    k(0.39, p="netral+0.06*bawah+0.06*luar"),
    k(0.54, p="netral+0.03*bawah+0.13*luar"),
    k(0.66, p="netral+0.06*bawah+0.13*luar"),
    k(0.85),
], gloss="CHILDREN", cara="Telapak menghadap bawah menepuk-nepuk 'kepala anak' beberapa kali sambil bergeser ke samping.")

S("B12_KING", "Raja", "Dongeng", [
    k(0, p="bahu_kiri+0.04*depan+0.02*bawah", a="telapak", b="K", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.45, p="dada+0.04*depan+0.06*bawah"),
    k(0.8, p="perut+0.11*luar+0.05*depan+0.02*bawah"),
    k(0.95),
], gloss="KING", cara="Tangan K bergerak dari bahu kiri menyilang turun ke pinggang kanan — selempang raja.")

S("B12_TURTLE", "Kura-kura", "Dongeng", [
    k(0, p=A(0.0, -0.37, 1.215), a="buku", b="A", j="depan+0.3*dalam", tp="dalam+0.3*bawah"),
    *bolak(0.15, 0.15, 5, {"b": "10"}, {"b": "A"}),
    k(0.95),
], L=[k(0, p=A(0.0, -0.37, 1.265), a="telapak", b="C", j="dalam+0.4*depan", tp="bawah")],
  gloss="TURTLE", cara="Kepalan A kanan berlindung di bawah tangan kiri yang melengkung (tempurung); ibu jari keluar-masuk seperti kepala kura-kura.")

_RAB = [
    k(0, p="pelipis+0.01*atas+0.06*luar+0.02*belakang", a="telapak", b="U", j="atas+0.5*belakang", tp="belakang+0.4*dalam"),
    *bolak(0.15, 0.15, 5, {"b": "A13_H_TEKUK"}, {"b": "U"}),
    k(0.95, b="U"),
]
S("B12_RABBIT", "Kelinci", "Dongeng", _RAB, L=cermin(_RAB),
  gloss="RABBIT", cara="Dua tangan U (telunjuk & tengah rapat) di atas samping kepala, jari ditekuk berulang seperti telinga kelinci.")

S("B12_BALL", "Bola", "Dongeng", [
    k(0, p=A(-0.05, -0.38, 1.25), a="ujung", b="CLAW", j="dalam+0.3*depan", tp="dalam"),
    k(0.15),
    *bolak(0.3, 0.15, 4, {"p": A(-0.022, -0.38, 1.25)}, {"p": A(-0.05, -0.38, 1.25)}),
    k(0.85, p=A(-0.022, -0.38, 1.25)),
], L=cermin([
    k(0, p=A(-0.05, -0.38, 1.25), a="ujung", b="CLAW", j="dalam+0.3*depan", tp="dalam"),
    k(0.15),
    *bolak(0.3, 0.15, 4, {"p": A(-0.022, -0.38, 1.25)}, {"p": A(-0.05, -0.38, 1.25)}),
    k(0.85, p=A(-0.022, -0.38, 1.25)),
]), gloss="BALL", cara="Dua tangan cakar saling berhadapan, ujung jarinya bertemu dua kali — membentuk bola.")

S("B12_LEAF", "Daun", "Dongeng", [
    k(0, p=A(-0.02, -0.38, 1.285), a="pergelangan", b="FLAT", j="bawah+0.2*depan", tp="dalam"),
    *bolak(0.15, 0.18, 5, {"j": "bawah+0.5*luar+0.2*depan"}, {"j": "bawah+0.5*dalam+0.2*depan"}),
    k(1.05, j="bawah+0.2*depan"),
], L=[k(0, p=A(-0.015, -0.38, 1.29), a="telunjuk", b="1", j="dalam+0.2*depan", tp="bawah")],
  gloss="LEAF", cara="Tangan kanan menggantung lemas dari ujung telunjuk kiri (tangkai), lalu bergoyang — daun tertiup angin.")

S("B12_KNOCK", "Mengetuk (pintu)", "Dongeng", [
    k(0, p=A(-0.01, -0.33, 1.28), a="buku", b="S", j="dalam+0.2*depan", tp="bawah+0.3*belakang"),
    k(0.12),
    *bolak(0.24, 0.12, 5, {"p": A(0.025, -0.33, 1.28)}, {"p": A(-0.01, -0.33, 1.28)}),
    k(0.9),
], L=[k(0, **_KIRI_TEGAK)],
  gloss="KNOCK", cara="Buku jari kepalan kanan mengetuk telapak kiri yang tegak beberapa kali.")

# ── Emosi dalam cerita ─────────────────────────────────────────────────────

S("B12_EMBARRASSED", "Malu", "Emosi",
  lingkar(0, 0.9, "pipi+0.10*depan+0.07*luar+0.03*bawah", 0.03, "luar", "atas", n=8, mulai=270, putaran=1.5,
          a="telapak", b="5", j="atas+0.2*dalam", tp="belakang") + [k(1.05)],
  L=cermin(lingkar(0, 0.9, "pipi+0.10*depan+0.07*luar+0.03*bawah", 0.03, "luar", "atas", n=8, mulai=90, putaran=1.5,
                   a="telapak", b="5", j="atas+0.2*dalam", tp="belakang") + [k(1.05)]),
  wajah="sedih", gloss="EMBARRASSED", cara="Dua tangan terbuka di depan pipi berputar naik bergantian — muka memerah karena malu.")

S("B12_JEALOUS", "Cemburu / iri", "Emosi", [
    k(0, p="sudut_mulut+0.015*depan", a="kelingking", b="J", j="atas+0.5*dalam", tp="belakang"),
    *bolak(0.15, 0.15, 4, {"putar": -40}, {"putar": 10}),
    k(0.8, putar=0),
], wajah="sedih", gloss="JEALOUS", cara="Ujung kelingking (bentuk J) di sudut mulut, diputar beberapa kali.")

S("B12_FRUSTRATED", "Frustrasi / kesal", "Emosi", [
    k(0, p="dagu+0.07*depan+0.05*bawah", a="punggung", b="FLAT", j="atas", tp="depan"),
    k(0.12),
    k(0.3, p="dagu+0.015*depan+0.05*bawah"),
    k(0.45, p="dagu+0.06*depan+0.05*bawah"),
    k(0.6, p="dagu+0.015*depan+0.05*bawah"),
    k(0.85),
], wajah="sedih", gloss="FRUSTRATED", cara="Punggung tangan datar menepuk dagu dua kali, wajah kesal.")

S("B12_WORRY", "Khawatir / cemas", "Emosi",
  lingkar(0, 1.0, "dahi+0.13*depan+0.08*luar+0.02*bawah", 0.03, "luar", "atas", n=10, mulai=90, putaran=2,
          a="telapak", b="FLAT", j="atas+0.4*dalam", tp="belakang+0.6*dalam") + [k(1.15)],
  L=lingkar(0, 1.0, "dahi+0.13*depan+0.08*luar+0.02*bawah", 0.03, "luar", "atas", n=10, mulai=270, putaran=2,
            a="telapak", b="FLAT", j="atas+0.4*dalam", tp="belakang+0.6*dalam") + [k(1.15)],
  wajah="sedih", gloss="WORRY", cara="Dua tangan datar berputar bergantian di depan dahi — pikiran berputar-putar.")

_LEGA = [
    k(0, p="dada+0.025*depan+0.05*atas+0.04*luar", a="telapak", b="FLAT", j="dalam+0.2*atas", tp="belakang"),
    k(0.15),
    k(0.7, p="perut+0.03*depan+0.04*luar"),
    k(0.85),
]
S("B12_RELIEVED", "Lega", "Emosi", _LEGA, L=cermin(_LEGA), wajah="senang", kepala=[(0.2, 0, 0, 0), (0.6, 6, 0, 0), (0.85, 0, 0, 0)],
  gloss="RELIEVED", cara="Dua telapak di dada diusap turun ke perut sambil menghembuskan napas — rasa lega.")

S("B12_DISAPPOINTED", "Kecewa", "Emosi", [
    k(0, p="dagu+0.04*depan", a="telunjuk", b="1", j="atas+0.4*dalam+0.3*belakang", tp="belakang+0.4*dalam"),
    k(0.15),
    k(0.4, p="dagu+0.006*depan"),
    k(0.75),
], wajah="sedih", gloss="DISAPPOINTED", cara="Ujung telunjuk menyentuh dagu dengan wajah kecewa.")

_CRY_R = [
    k(0, p="mata+0.025*bawah+0.02*luar+0.01*depan", a="telunjuk", b="1", j="atas+0.4*dalam", tp="belakang"),
    k(0.12),
    k(0.35, p="pipi+0.05*bawah+0.01*depan"),
    k(0.5, p="mata+0.025*bawah+0.02*luar+0.01*depan"),
    k(0.75, p="pipi+0.05*bawah+0.01*depan"),
    k(0.9),
]
_CRY_L = [
    k(0, p="mata+0.025*bawah+0.02*luar+0.01*depan", a="telunjuk", b="1", j="atas+0.4*dalam", tp="belakang"),
    k(0.12),
    k(0.25),
    k(0.48, p="pipi+0.05*bawah+0.01*depan"),
    k(0.62, p="mata+0.025*bawah+0.02*luar+0.01*depan"),
    k(0.85, p="pipi+0.05*bawah+0.01*depan"),
    k(0.9),
]
S("B12_CRY", "Menangis", "Emosi", _CRY_R, L=cermin(_CRY_L), wajah="sedih",
  gloss="CRY", cara="Dua telunjuk di bawah mata bergantian mengusap turun di pipi — air mata mengalir.")

# ── Percakapan & umpan balik ───────────────────────────────────────────────

S("B12_REALLY", "Sungguh? / benar-benar", "Umpan balik", [
    k(0, p="mulut+0.012*depan", a="jari_telunjuk", b="1", j="atas+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p="mulut+0.14*depan+0.04*bawah"),
    k(0.75),
], wajah="ya_tidak", gloss="REALLY", cara="Sisi telunjuk tegak di depan bibir digerakkan maju (TRUE); sebagai pertanyaan, alis naik.")

S("B12_OIC", "Oh, begitu", "Umpan balik", [
    k(0, p="netral+0.10*atas+0.04*luar", a="pergelangan", b="Y", j="depan+0.4*dalam", tp="bawah"),
    *bolak(0.15, 0.16, 4, {"p": "netral+0.06*atas+0.04*luar"}, {"p": "netral+0.10*atas+0.04*luar"}),
    k(0.8),
], kepala=[(0.15, 10, 0, 0), (0.31, 0, 0, 0), (0.47, 10, 0, 0), (0.63, 0, 0, 0)],
  gloss="OH-I-SEE", cara="Tangan Y (telapak ke bawah) naik-turun di depan bahu sambil mengangguk — 'oh, begitu'.")

S("B12_INTERRUPT", "Menyela / memotong", "Umpan balik", [
    k(0, p=A(0.02, -0.37, 1.36), a="sisi_kelingking", b="FLAT", j="depan+0.2*dalam", tp="dalam"),
    k(0.12),
    k(0.32, p=A(0.02, -0.37, 1.29)),
    k(0.6),
], L=[k(0, p=A(0.03, -0.36, 1.24), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="belakang")],
  gloss="INTERRUPT", cara="Sisi kelingking tangan kanan diturunkan memotong di sela ibu jari & telunjuk tangan kiri.")

_ATT = [
    k(0, p="mata+0.06*luar+0.03*depan", a="telapak", b="FLAT", j="atas+0.6*depan", tp="dalam"),
    k(0.15),
    k(0.6, p="mata+0.05*luar+0.20*depan+0.05*bawah", j="depan+0.3*atas"),
    k(0.8),
]
S("B12_ATTENTION", "Perhatian / fokus", "Umpan balik", _ATT, L=cermin(_ATT),
  gloss="ATTENTION", cara="Dua telapak di samping mata (seperti kacamata kuda) digerakkan lurus ke depan — fokus pada satu hal.")

_ANA = [
    k(0, p=A(-0.05, -0.38, 1.30), a="ujung", b="BENT_V", j="bawah+0.4*depan", tp="belakang+0.3*bawah"),
    k(0.12),
    k(0.32, p=A(-0.05, -0.38, 1.23)),
    k(0.42, p=A(-0.05, -0.38, 1.29)),
    k(0.62, p=A(-0.05, -0.38, 1.22)),
    k(0.8),
]
S("B12_ANALYZE", "Menganalisis", "Narasi", _ANA, L=cermin(_ANA),
  gloss="ANALYZE", cara="Dua tangan V bengkok berhadapan ditarik turun dua kali — membedah sesuatu.")

S("B12_COPY", "Meniru / menyalin", "Narasi", [
    k(0, p=A(0.02, -0.33, 1.27), a="telapak", b="5", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.55, p=A(-0.10, -0.34, 1.27), a="ujung", b="FLAT_O"),
    k(0.75),
], L=[k(0, **_KIRI_TEGAK)],
  gloss="COPY", cara="Tangan terbuka di telapak kiri ditarik menjauh sambil mengatup — 'mengambil' bentuknya untuk ditiru.")

S("B12_MISUNDERSTAND", "Salah paham", "Narasi", [
    k(0, p="pelipis+0.02*dalam+0.03*atas+0.01*depan", a="ujung", b="V", j="atas+0.6*dalam+0.4*belakang", tp="dalam+0.5*belakang"),
    k(0.15),
    k(0.45, putar=160, p="pelipis+0.02*dalam+0.03*atas+0.015*depan"),
    k(0.7),
], wajah="sedih", gloss="MISUNDERSTAND", cara="Ujung jari V menyentuh dahi, lalu tangan dibalik — pikiran terbalik.")
