# [isyarat-b1b2-v1] Kamus isyarat BISINDO B2.1 "Nuansa & Kefasihan".
# Tangan dominan kanan. Format sama dengan kamus_bisindo.py; kode baru berawalan B21_
# (B21_TIUP_LILIN sudah ada di kamus_bisindo_a2_1.py — jangan didefinisikan ulang).
# ⚠️ Kosakata abstrak (KEADILAN, KEBEBASAN, TANGGUNG-JAWAB, ARTI, MAKSUD …) jarang terdokumentasi
#    daring dan bervariasi antardaerah. Hampir semua bentuk di sini ditulis dari prinsip ikonik
#    umum + gerak bibir dan DITANDAI ragu=True — WAJIB dicek pengajar Tuli. Bentuk ASL tidak disalin.
#    Isyarat termodulasi (BESAR-SEKALI, TULIS-TERUS, TUNGGU-LAMA) memperagakan prinsip intensitas/
#    aspek; bentuk persisnya tetap perlu dicek.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # telunjuk ditekuk seperti kait (untuk SAMBUNG — dua kait bertaut)
    "B21_KAIT": (I._jari(_G, index=(20, 85, 60)), "depan_genggam_manis"),
    # ibu jari & telunjuk hampir bertemu (sangat kecil)
    "B21_JEPIT_KECIL": (I._jari(_G, index=(35, 45, 25)), ("ujung", "index")),
})

_ALAS = A(0.03, -0.33, 1.17)
_L_ALAS = [k(0, p=_ALAS, a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")]
_LAYAR = A(0.04, -0.36, 1.28)
_L_LAYAR = [k(0, p=_LAYAR, a="telapak", b="FLAT", j="atas", tp="dalam")]
_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"
_TELUNJUK_DAHI = dict(a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang")


def _cm(keys):
    """cermin() + titik yang tak ditangani cermin: bahu_kanan, dan p tuple (Vector, offset) dari lingkar()."""
    out = []
    for kk in cermin(keys):
        p = kk.get("p")
        if isinstance(p, str):
            kk["p"] = p.replace("bahu_kanan", "bahu_kiri")
        elif isinstance(p, tuple) and len(p) == 2 and hasattr(p[0], "x"):
            kk["p"] = (A(-p[0].x, p[0].y, p[0].z), p[1])
        out.append(kk)
    return out


def _sym(keys):
    return dict(R=keys, L=_cm(keys))


# ── Kefasihan & ritme ─────────────────────────────────────────────────────

S("B21_LANCAR", "Lancar / fasih / mengalir", "Kefasihan", [
    k(0, p=A(-0.03, -0.32, 1.26), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.15, p=A(-0.04, -0.36, 1.28)),
    k(0.35, p=A(-0.05, -0.41, 1.24)),
    k(0.55, p=A(-0.06, -0.46, 1.28)),
    k(0.75, p=A(-0.07, -0.50, 1.25)),
    k(0.9),
], wajah="senang",
  cara="Tangan datar telapak ke bawah meluncur maju bergelombang halus tanpa berhenti, sambil mengucapkan 'lancar'.", ragu=True)

_JEDA = [
    k(0, p=A(-0.02, -0.38, 1.26), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.4, p=A(-0.06, -0.38, 1.26)),
    k(0.85),
]
S("B21_JEDA", "Jeda / berhenti sebentar", "Kefasihan", **_sym(_JEDA),
  cara="Dua telapak berhadapan rapat lalu dibuka sedikit dan ditahan — ada celah sebentar di antara isyarat.", ragu=True)

# ── Intensitas ────────────────────────────────────────────────────────────

S("B21_SANGAT", "Sangat / sekali", "Intensitas", [
    k(0, p="dada_kanan+0.08*depan", a="telapak", b="B24_JEMPOL", j="depan+0.2*dalam", tp="dalam"),
    k(0.2),
    k(0.4, p="dada_kanan+0.24*depan+0.02*atas"),
    k(0.75),
], kepala=[(0.2, 0, 0, 0), (0.4, 8, 0, 0), (0.75, 4, 0, 0)],
  cara="Jempol tegak didorong mantap ke depan lalu ditahan, kepala ikut mengangguk tegas; sering intensitas cukup ditunjukkan dengan memperkuat gerak isyarat utamanya.",
  ragu=True)

S("B21_AGAK", "Agak / lumayan / sedikit", "Intensitas", [
    k(0, p="netral+0.10*depan+0.04*atas", a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    *bolak(0.12, 0.13, 5, {"putar": 25}, {"putar": -25}),
    k(0.8, putar=0),
], kepala=[(0.1, 0, 0, 0), (0.35, 0, 0, 8), (0.6, 0, 0, -8), (0.8, 0, 0, 0)],
  cara="Tangan terbuka telapak ke bawah digoyang miring kiri-kanan, kepala sedikit miring — 'ya, lumayan'.", ragu=True)

_BESAR = [
    k(0, p=A(-0.05, -0.38, 1.27), a="telapak", b="CLAW", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.7, p=A(-0.26, -0.36, 1.30)),
    k(1.0),
]
S("B21_BESAR_SEKALI", "Besar sekali / sangat besar", "Intensitas", **_sym(_BESAR), wajah="senang", gloss="BESAR++",
  cara="Dua tangan cakar menjauh pelan dan lebar sekali; pipi menggembung dan mata membesar — gerak lebih lebar & lambat = lebih besar.",
  ragu=True)

S("B21_KECIL_SEKALI", "Kecil sekali / mungil", "Intensitas", [
    k(0, p="netral+0.14*depan+0.10*atas", a="ujung", b="BABY_O", j="atas+0.3*depan", tp="dalam"),
    k(0.2),
    k(0.6, b="B21_JEPIT_KECIL", p="netral+0.16*depan+0.12*atas"),
    k(0.95),
], kepala=[(0.2, 0, 0, 0), (0.6, -4, 0, 0)], wajah="wh", gloss="KECIL++",
  cara="Ibu jari & telunjuk didekatkan sampai hampir bersentuhan, mata menyipit dan bibir mengerut — sangat kecil.",
  ragu=True)

# ── Makna & pilihan isyarat ───────────────────────────────────────────────

S("B21_MIRIP", "Mirip / hampir sama", "Makna", [
    k(0, p=A(-0.012, -0.38, 1.25), a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah+0.4*dalam"),
    *bolak(0.12, 0.13, 5, {"putar": 25}, {"putar": -25}),
    k(0.8, putar=0),
], L=[k(0, p=A(0.012, -0.38, 1.25), a="telunjuk", b="1", j="depan+0.3*dalam", tp="bawah+0.4*dalam")],
  cara="Dua telunjuk berdampingan seperti SAMA, tetapi telunjuk kanan digoyang — sama, tapi tidak persis.", ragu=True)

S("B21_ARTI", "Arti / makna", "Makna", [
    k(0, p=_DAHI + "+0.04*depan", **_TELUNJUK_DAHI),
    k(0.2, p=_DAHI),
    k(0.35),
    k(0.7, p=_ALAS + A(-0.005, -0.01, 0.02), a="ujung", b="1", j="bawah+0.4*depan", tp="belakang"),
    k(0.95),
], L=_L_ALAS,
  cara="Telunjuk menyentuh pelipis lalu turun menunjuk ke tengah telapak kiri — isi di balik sebuah kata; ucapkan 'arti'.",
  ragu=True)

S("B21_MAKSUD", "Maksud / yang dimaksud", "Makna", [
    k(0, p=_DAHI + "+0.04*depan", **_TELUNJUK_DAHI),
    k(0.2, p=_DAHI),
    k(0.35),
    k(0.75, p="netral+0.22*depan+0.10*atas", j="depan+0.2*dalam", tp="bawah+0.4*dalam"),
    k(0.95),
], cara="Telunjuk dari pelipis bergerak lurus ke depan menunjuk sasaran — apa yang dituju pikiran; ucapkan 'maksud'.",
  ragu=True)

S("B21_KONTEKS", "Konteks", "Makna", [], gloss="KONTEKS",
  cara="Umumnya dieja jari K-O-N-T-E-K-S atau dijelaskan dengan SITUASI/KEADAAN; tanyakan isyarat lokal ke pengajar Tuli.",
  ragu=True)

S("B21_UNGKAPAN", "Ungkapan / idiom", "Makna", [
    k(0, p="mulut+0.04*depan", a="ujung", b="FLAT_O", j="atas+0.6*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p="mulut+0.26*depan+0.08*luar+0.10*bawah", b="5", j="depan+0.4*atas", tp="atas+0.3*dalam"),
    k(0.85),
], cara="Jari kuncup di depan mulut bergerak ke depan dan membuka — sebuah ucapan yang dilepaskan; ucapkan 'ungkapan'.",
  ragu=True)

S("B21_TERJEMAH", "Menerjemahkan / terjemahan", "Makna", [
    k(0, p=A(0.02, -0.40, 1.27), a="ujung", b="BABY_O", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.4, p=A(-0.02, -0.44, 1.31)),
    k(0.65, p=A(-0.12, -0.40, 1.27)),
    k(0.9),
], L=[k(0, p=A(0.10, -0.38, 1.25), a="ujung", b="BABY_O", j="depan+0.3*atas", tp="dalam")],
  cara="Dua tangan mencubit; tangan kanan memindahkan 'isi' dari sisi kiri (bahasa asal) melengkung ke sisi kanan (bahasa tujuan).",
  ragu=True)

S("B21_IDE", "Ide / gagasan", "Makna", [
    k(0, p="pelipis+0.03*depan+0.02*luar", a="ujung", b="FLAT_O", j="atas+0.4*dalam", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.55, p="pelipis+0.06*depan+0.04*luar+0.12*atas", b="5", j="atas", tp="depan+0.3*dalam"),
    k(0.85),
], wajah="senang",
  cara="Jari kuncup di pelipis naik sambil membuka — seperti lampu yang menyala di kepala.", ragu=True)

S("B21_UTAMA", "Utama / pokok", "Makna", [
    k(0, p=A(0.03, -0.37, 1.36), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="bawah"),
    k(0.15, p=A(0.03, -0.37, 1.315)),
    k(0.3, p=A(0.03, -0.37, 1.36)),
    k(0.45, p=A(0.03, -0.37, 1.315)),
    k(0.75),
], L=[k(0, p=A(0.03, -0.37, 1.25), a="telapak", b="B24_JEMPOL", j="dalam+0.4*depan", tp="dalam+0.3*belakang")],
  cara="Jempol kiri tegak (yang pertama); telapak kanan menepuk ujungnya dua kali — hal yang paling pokok.", ragu=True)

S("B21_KALIMAT", "Kalimat", "Makna", [
    k(0, p=A(-0.01, -0.38, 1.27), a="ujung", b="BABY_O", j="depan+0.3*dalam", tp="depan"),
    k(0.15),
    k(0.65, p=A(-0.17, -0.38, 1.27)),
    k(0.85),
], L=[k(0, p=A(0.01, -0.38, 1.27), a="ujung", b="BABY_O", j="depan+0.3*dalam", tp="depan")],
  cara="Dua tangan mencubit berdekatan; tangan kanan ditarik ke samping seperti merentangkan untaian kata.", ragu=True)

# ── Aspek & cara ──────────────────────────────────────────────────────────

S("B21_SEDANG", "Sedang (berlangsung)", "Aspek",
  lingkar(0, 0.9, A(-0.05, -0.40, 1.22), 0.035, "depan", "atas", n=10, mulai=270, putaran=2,
          a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas+0.3*dalam") + [k(1.05)],
  L=_cm(lingkar(0, 0.9, A(-0.05, -0.40, 1.22), 0.035, "depan", "atas", n=10, mulai=270, putaran=2,
                a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas+0.3*dalam") + [k(1.05)]),
  cara="Dua telapak menghadap atas berputar kecil maju berulang di depan badan — kegiatan yang sedang berjalan; ucapkan 'sedang'.",
  ragu=True)

S("B21_TULIS_TERUS", "Menulis terus-menerus", "Aspek",
  [k(0, p=_ALAS + A(-0.01, -0.02, 0.03), a="ujung", b="BABY_O", j="depan+0.4*bawah+0.3*dalam", tp="bawah")] +
  lingkar(0.1, 1.4, _ALAS + A(-0.01, -0.02, 0.035), 0.03, "depan", "luar", n=12, mulai=90, putaran=3) + [k(1.55)],
  L=_L_ALAS, wajah="sedih", gloss="TULIS-TERUS",
  cara="Isyarat TULIS di telapak kiri diulang dengan gerak melingkar panjang dan berirama, wajah lelah — kegiatan yang berlangsung lama tanpa henti.",
  ragu=True)

_TUNGGU = [
    k(0, p=A(-0.06, -0.38, 1.22), a="telapak", b="5", j="depan+0.3*dalam", tp="atas"),
    *bolak(0.12, 0.13, 9, {"b": "CLAW"}, {"b": "5"}),
    k(1.35),
]
S("B21_TUNGGU_LAMA", "Menunggu lama", "Aspek", **_sym(_TUNGGU), wajah="sedih", gloss="TUNGGU-LAMA",
  kepala=[(0.1, 0, 0, 0), (0.5, 0, 0, 10), (1.3, 0, 0, 10)],
  cara="Dua tangan terbuka menghadap atas, jari bergerak-gerak berulang lama; kepala miring dan wajah bosan — makin lama gerak diulang, makin lama menunggunya.",
  ragu=True)

# ── Konsep abstrak ────────────────────────────────────────────────────────

S("B21_KEADILAN", "Keadilan / adil", "Abstrak", [
    k(0, p=A(-0.10, -0.38, 1.24), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
    k(0.15, p=A(-0.10, -0.38, 1.28)),
    k(0.35, p=A(-0.10, -0.38, 1.20)),
    k(0.55, p=A(-0.10, -0.38, 1.25)),
    k(0.8, p=A(-0.10, -0.38, 1.24)),
    k(1.0),
], L=[k(0, p=A(0.10, -0.38, 1.24), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas"),
      k(0.15, p=A(0.10, -0.38, 1.20)), k(0.35, p=A(0.10, -0.38, 1.28)), k(0.55, p=A(0.10, -0.38, 1.23)),
      k(0.8, p=A(0.10, -0.38, 1.24)), k(1.0)],
  cara="Dua telapak menghadap atas naik-turun bergantian seperti timbangan lalu berhenti sejajar — seimbang dan adil.",
  ragu=True)

S("B21_KEBEBASAN", "Kebebasan / bebas", "Abstrak", [
    k(0, p=A(-0.015, -0.38, 1.24), a="pergelangan", b="S", j="atas+0.5*dalam", tp="belakang"),
    k(0.2),
    k(0.6, p=A(-0.20, -0.36, 1.34), b="5", j="atas+0.4*luar", tp="depan"),
    k(0.9),
], L=[k(0, p=A(0.015, -0.385, 1.24), a="pergelangan", b="S", j="atas+0.5*dalam", tp="belakang"),
      k(0.2),
      k(0.6, p=A(0.20, -0.36, 1.34), b="5", j="atas+0.4*luar", tp="depan"),
      k(0.9)],
  wajah="senang",
  cara="Dua kepalan bersilang di pergelangan (terikat), lalu dilepas ke samping atas sambil membuka — lepas dan bebas.", ragu=True)

S("B21_TANGGUNG_JAWAB", "Tanggung jawab", "Abstrak", [
    k(0, p="bahu_kiri+0.12*depan+0.10*atas", a="telapak", b="BENT_B", j="bawah+0.3*belakang+0.2*luar", tp="bawah+0.3*belakang"),
    k(0.15),
    k(0.4, p="bahu_kiri+0.05*depan+0.03*atas+0.03*dalam"),
    k(0.55, p="bahu_kiri+0.07*depan+0.07*atas+0.03*dalam"),
    k(0.7, p="bahu_kiri+0.05*depan+0.03*atas+0.03*dalam"),
    k(0.95),
], kepala=[(0.3, 0, 0, 0), (0.55, 0, 0, 4)], gloss="TANGGUNG-JAWAB",
  cara="Tangan kanan bengkok diletakkan di pundak kiri dan ditekan dua kali — beban yang dipikul di pundak; ucapkan 'tanggung jawab'.",
  ragu=True)

S("B21_CONTOH", "Contoh / misalnya", "Abstrak", [
    k(0, p=_LAYAR + A(-0.07, -0.03, 0.0), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam"),
    k(0.15),
    k(0.5, p=_LAYAR + A(-0.07, -0.10, 0.02)),
    k(0.75),
], L=[k(0, p=_LAYAR, a="telapak", b="FLAT", j="atas", tp="dalam"),
      k(0.15), k(0.5, p=_LAYAR + A(0, -0.07, 0.02)), k(0.75)],
  cara="Dua telapak berhadapan tegak lalu bersama-sama didorong ke depan — menyodorkan satu hal untuk dilihat; ucapkan 'contoh'.",
  ragu=True)

S("B21_JELASKAN", "Menjelaskan / penjelasan", "Abstrak", [
    k(0, p=A(-0.05, -0.38, 1.26), a="telapak", b="FLAT", j="depan+0.2*dalam", tp="dalam"),
    *bolak(0.12, 0.15, 4, {"p": A(-0.05, -0.46, 1.26)}, {"p": A(-0.05, -0.38, 1.26)}),
    k(0.75),
], L=_cm([
    k(0, p=A(-0.05, -0.46, 1.26), a="telapak", b="FLAT", j="depan+0.2*dalam", tp="dalam"),
    *bolak(0.12, 0.15, 4, {"p": A(-0.05, -0.38, 1.26)}, {"p": A(-0.05, -0.46, 1.26)}),
    k(0.75),
]), cara="Dua telapak berhadapan bergerak maju-mundur bergantian — menata dan menguraikan isi satu per satu.", ragu=True)

# ── Sopan santun & percakapan ─────────────────────────────────────────────

S("B21_PANGGIL", "Memanggil / menarik perhatian", "Percakapan", [
    k(0, p="netral+0.20*depan+0.04*atas", a="telapak", b="FLAT", j="depan+0.4*atas", tp="bawah"),
    *bolak(0.1, 0.12, 6, {"p": "netral+0.22*depan+0.00*atas"}, {"p": "netral+0.20*depan+0.08*atas"}),
    k(0.85),
], cara="Telapak melambai naik-turun di bidang pandang lawan bicara — cara sopan memanggil orang Tuli (atau menepuk pelan bahunya).")

S("B21_PAMIT", "Pamit / permisi pulang", "Percakapan", [
    k(0, p="dada_kanan+0.05*depan", a="telapak", b="FLAT", j="atas+0.5*dalam", tp="belakang"),
    k(0.2),
    k(0.55, p="netral+0.18*depan+0.04*atas", j="atas+0.2*dalam", tp="depan"),
    *bolak(0.65, 0.12, 3, {"putar": 25}, {"putar": -25}),
    k(1.05, putar=0),
], kepala=[(0.1, 0, 0, 0), (0.4, 10, 0, 0), (0.6, 0, 0, 0)], wajah="senang",
  cara="Telapak di dada sambil sedikit menunduk (permisi), lalu tangan maju dan melambai — berpamitan; ucapkan 'pamit'.",
  ragu=True)

S("B21_SOPAN", "Sopan / santun", "Percakapan", [
    k(0, p="dada+0.04*depan+0.06*atas", a="telapak", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    k(0.15),
    k(0.6, p="dada+0.04*depan+0.08*bawah"),
    k(0.85),
], kepala=[(0.15, 0, 0, 0), (0.55, 8, 0, 0), (0.85, 3, 0, 0)], wajah="senang",
  cara="Telapak mengusap pelan dada dari atas ke bawah sambil sedikit menunduk — sikap halus dan santun.", ragu=True)

S("B21_SALAH_PAHAM", "Salah paham", "Percakapan", [
    k(0, p=_DAHI + "+0.04*depan", **_TELUNJUK_DAHI),
    k(0.2, p=_DAHI),
    k(0.35),
    k(0.7, p=A(-0.01, -0.40, 1.30), a="jari_telunjuk", b="1", j="atas+0.9*dalam", tp="depan+0.4*dalam"),
    k(0.95),
], L=[k(0, p=A(0.10, -0.38, 1.22), a="jari_telunjuk", b="1", j="atas+0.4*dalam", tp="depan"),
      k(0.35),
      k(0.7, p=A(0.01, -0.395, 1.30), a="jari_telunjuk", b="1", j="atas+0.9*dalam", tp="depan+0.4*dalam"),
      k(0.95)],
  kepala=[(0.4, 0, 0, 0), (0.7, 0, 0, 8)], wajah="wh",
  cara="Telunjuk dari pelipis lalu dua telunjuk bersilang di depan wajah, alis berkerut — pikiran yang tidak bertemu.",
  ragu=True)

S("B21_OH_BEGITU", "Oh, begitu / oh, paham", "Percakapan", [
    k(0, p="netral+0.10*depan+0.12*atas", a="telapak", b="FLAT", j="atas+0.3*depan", tp="depan+0.4*dalam"),
    k(0.15),
    k(0.35, p="netral+0.10*depan+0.05*atas", j="depan+0.3*atas", tp="bawah+0.3*depan"),
    k(0.5, p="netral+0.10*depan+0.09*atas"),
    k(0.65, p="netral+0.10*depan+0.05*atas"),
    k(0.9),
], kepala=[(0.1, 0, 0, 0), (0.3, 10, 0, 0), (0.45, 2, 0, 0), (0.6, 10, 0, 0), (0.85, 0, 0, 0)], wajah="senang",
  cara="Tangan datar mengangguk turun dua kali bersama anggukan kepala, mulut membentuk 'oh' — tanda mengikuti cerita.",
  ragu=True)

S("B21_PERHATIAN", "Perhatian / fokus", "Percakapan", [
    k(0, p="mata+0.05*depan+0.06*luar", a="telapak", b="FLAT", j="atas+0.4*depan", tp="dalam"),
    k(0.15),
    k(0.6, p="mata+0.20*depan+0.04*luar"),
    k(0.85),
], L=[k(0, p="mata_kiri+0.05*depan+0.06*luar", a="telapak", b="FLAT", j="atas+0.4*depan", tp="dalam"),
      k(0.15), k(0.6, p="mata_kiri+0.20*depan+0.04*luar"), k(0.85)],
  cara="Dua telapak di samping mata seperti penutup samping, lalu maju lurus ke depan — pandangan hanya ke satu arah.",
  ragu=True)

S("B21_TOPIK", "Topik / pokok bahasan", "Percakapan", [
    k(0, p=_LAYAR + A(-0.03, -0.02, 0.10), a="ujung", b="1", j="dalam+0.4*bawah", tp="bawah"),
    k(0.15, p=_LAYAR + A(-0.012, -0.01, 0.08)),
    k(0.3, p=_LAYAR + A(-0.03, -0.02, 0.10)),
    k(0.45, p=_LAYAR + A(-0.012, -0.01, 0.08)),
    k(0.75),
], L=_L_LAYAR,
  cara="Telapak kiri tegak (halaman); telunjuk kanan mengetuk bagian atasnya dua kali — judul yang dibicarakan; banyak orang juga mengeja T-O-P-I-K.",
  ragu=True)

S("B21_SAMBUNG", "Menyambung / terhubung", "Percakapan", [
    k(0, p=A(-0.08, -0.38, 1.26), a="jari_telunjuk", b="B21_KAIT", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.55, p=A(-0.01, -0.38, 1.26)),
    k(0.85),
], L=[k(0, p=A(0.08, -0.38, 1.27), a="jari_telunjuk", b="B21_KAIT", j="dalam+0.3*depan", tp="atas"),
      k(0.15), k(0.55, p=A(0.01, -0.38, 1.27)), k(0.85)],
  cara="Dua telunjuk ditekuk seperti kait bergerak mendekat lalu saling bertaut — dua bagian yang tersambung.", ragu=True)

S("B21_HALUS", "Halus / mulus", "Kefasihan", [
    k(0, p=A(-0.005, -0.31, 1.205), a="telapak", b="FLAT", j="dalam+0.4*depan", tp="bawah"),
    k(0.15),
    k(0.7, p=A(-0.03, -0.43, 1.205)),
    k(0.9),
], L=[k(0, p=A(0.03, -0.35, 1.18), a="punggung", b="FLAT", j="dalam+0.5*depan", tp="bawah")],
  wajah="senang", cara="Telapak kanan mengusap pelan punggung tangan kiri dari pangkal ke ujung — licin tanpa hambatan.", ragu=True)

_BAKU = [
    k(0, p=A(-0.06, -0.38, 1.36), a="sisi_kelingking", b="FLAT", j="depan+0.2*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.06, -0.38, 1.16)),
    k(0.85),
]
S("B21_BAKU", "Baku / resmi / formal", "Kefasihan", **_sym(_BAKU),
  cara="Dua tangan datar sejajar (telapak berhadapan) turun lurus dan tegas — mengikuti aturan yang lurus; ucapkan 'baku'.",
  ragu=True)
