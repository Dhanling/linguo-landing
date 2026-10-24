# [isyarat-asl-a1a2-v1] Kamus isyarat ASL A2.4 "Opinions & Community — Pendapat & Komunitas Tuli".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli (terutama INTERVIEW, COMPANY, EMAIL,
#    VIDEO, CAPTION, ACCESS, NEWS yang variasinya banyak).

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

# Titik sentuh telunjuk di sisi dahi (THINK dan turunannya: AGREE, DISAGREE, GOAL, DREAM)
_DAHI = "pelipis+0.02*dalam+0.02*atas+0.006*depan"
_PIKIR = dict(a="telunjuk", b="1", j="atas+0.7*dalam+0.45*belakang", tp="dalam+0.5*belakang")


def _pikir(t_sentuh=0.25):
    """Awal THINK: telunjuk mendekat lalu menyentuh sisi dahi."""
    return [k(0, p=_DAHI + "+0.05*depan", **_PIKIR), k(t_sentuh, p=_DAHI)]


# ── Pendapat ───────────────────────────────────────────────────────────────

S("THINK", "Berpikir / menurut saya", "Pendapat", [
    *_pikir(0.25),
    k(0.5),
    k(0.7, p=_DAHI + "+0.03*depan"),
], cara="Ujung telunjuk menyentuh sisi dahi (tempat pikiran).")

S("FEEL", "Merasa", "Pendapat", [
    k(0, p="dada+0.04*bawah+0.008*depan", a="tengah", b="OPEN_8", j="atas+0.2*dalam", tp="belakang"),
    k(0.3, p="dada+0.04*atas+0.012*depan"),
    k(0.42, p="dada+0.04*bawah+0.02*depan"),
    k(0.72, p="dada+0.04*atas+0.012*depan"),
    k(0.9),
], cara="Ujung jari tengah (bentuk 8 terbuka) mengusap dada ke atas dua kali.")

S("OPINION", "Pendapat / opini", "Pendapat", [
    k(0, p="dahi+0.09*depan+0.03*luar+0.03*bawah", a="telunjuk", b="O", j="atas+0.6*dalam", tp="belakang+0.5*dalam"),
    *bolak(0.15, 0.15, 4, {"p": "dahi+0.15*depan+0.03*luar+0.03*bawah"}, {"p": "dahi+0.09*depan+0.03*luar+0.03*bawah"}),
    k(0.75),
], cara="Tangan bentuk O di depan dahi digerakkan maju-mundur kecil dua kali.")

S("AGREE", "Setuju", "Pendapat", [
    *_pikir(0.2),
    k(0.3),
    k(0.7, p=A(-0.016, -0.44, 1.20), j="depan", tp="bawah"),
    k(0.9),
], L=[k(0, **IST["L"]), k(0.3, p=A(0.016, -0.44, 1.20), a="telunjuk", b="1", j="depan", tp="bawah"), k(0.9)],
  kepala=[(0.4, 0, 0, 0), (0.65, 10, 0, 0), (0.9, 2, 0, 0)],
  cara="Telunjuk menyentuh dahi (THINK), lalu turun sejajar telunjuk kiri — dua telunjuk menunjuk ke depan (SAME).")

S("DISAGREE", "Tidak setuju", "Pendapat", [
    *_pikir(0.2),
    k(0.3),
    k(0.55, p=A(-0.02, -0.42, 1.22), j="dalam+0.2*depan", tp="bawah"),
    k(0.85, p=A(-0.16, -0.42, 1.22)),
    k(1.0),
], L=[k(0, **IST["L"]), k(0.35, p=A(0.02, -0.42, 1.22), a="telunjuk", b="1", j="dalam+0.2*depan", tp="bawah"),
      k(0.55), k(0.85, p=A(0.16, -0.42, 1.22)), k(1.0)],
  kepala=[(0.5, 0, 0, 0), (0.7, 0, 12, 0), (0.85, 0, -12, 0), (1.0, 0, 0, 0)],
  cara="Telunjuk menyentuh dahi (THINK), lalu dua telunjuk saling menunjuk dan ditarik berlawanan (OPPOSITE), sambil menggeleng.")

S("CORRECT", "Benar / tepat", "Pendapat", [
    k(0, p=A(-0.005, -0.44, 1.28), a="telunjuk", b="1", j="depan", tp="dalam"),
    k(0.15),
    k(0.42, p=A(-0.005, -0.44, 1.208)),
    k(0.65),
], L=[k(0, p=A(-0.005, -0.43, 1.17), a="telunjuk", b="1", j="depan", tp="dalam")],
  cara="Dua tangan bentuk 1 menunjuk ke depan; tangan kanan turun dan mendarat di atas tangan kiri.")

S("WRONG", "Salah", "Pendapat", [
    k(0, p="dagu+0.06*depan+0.01*bawah", a="telapak", b="Y", j="atas+0.8*dalam", tp="belakang"),
    k(0.15),
    k(0.38, p="dagu+0.025*depan+0.01*bawah"),
    k(0.7),
], wajah="sedih", cara="Tangan bentuk Y, telapak ke diri sendiri, buku jari tengah ditempelkan ke dagu.")

S("SAME", "Sama", "Pendapat", [
    k(0, p=A(-0.12, -0.44, 1.20), a="telunjuk", b="1", j="depan", tp="bawah"),
    k(0.15),
    k(0.5, p=A(-0.016, -0.44, 1.20)),
    k(0.7),
], L=cermin([
    k(0, p=A(-0.12, -0.44, 1.20), a="telunjuk", b="1", j="depan", tp="bawah"),
    k(0.15),
    k(0.5, p=A(-0.016, -0.44, 1.20)),
    k(0.7),
]), cara="Dua telunjuk menunjuk ke depan, saling mendekat sampai berdampingan.")

S("DIFFERENT", "Berbeda", "Pendapat", [
    k(0, p=A(0.02, -0.42, 1.30), a="telunjuk", b="1", j="atas+0.5*dalam+0.3*depan", tp="depan"),
    k(0.15),
    k(0.55, p=A(-0.18, -0.42, 1.27), j="atas+0.2*luar+0.3*depan"),
    k(0.75),
], L=[k(0, p=A(-0.02, -0.38, 1.30), a="telunjuk", b="1", j="atas+0.5*dalam+0.3*depan", tp="depan"),
      k(0.15), k(0.55, p=A(0.18, -0.38, 1.27), j="atas+0.2*luar+0.3*depan"), k(0.75)],
  cara="Dua telunjuk bersilang di depan badan, lalu ditarik berpisah ke samping.")

# ── Cita-cita & rencana ────────────────────────────────────────────────────

S("FUTURE", "Masa depan", "Waktu", [
    k(0, p="pelipis+0.05*luar+0.01*depan+0.09*bawah", a="telapak", b="FLAT", j="atas", tp="dalam"),
    k(0.15),
    k(0.65, p="pelipis+0.06*luar+0.22*depan+0.07*bawah", j="atas+0.7*depan"),
    k(0.85),
], cara="Tangan datar di samping kepala (telapak ke samping) bergerak maju jauh ke depan.")

S("GOAL", "Tujuan / target", "Cita-cita", [
    *_pikir(0.2),
    k(0.3),
    k(0.7, p=A(0.03, -0.38, 1.42), j="depan+0.25*dalam", tp="bawah"),
    k(0.9),
], L=[k(0, **IST["L"]), k(0.35, p=A(0.04, -0.47, 1.44), a="telunjuk", b="1", j="atas+0.2*depan", tp="dalam"), k(0.9)],
  cara="Telunjuk dari dahi bergerak maju menunjuk telunjuk kiri yang tegak di depan (sasaran).")

_mimpi = [k(0, p=_DAHI + "+0.03*depan", a="telunjuk", b="1", j="atas+0.4*dalam+0.2*belakang", tp="dalam+0.3*depan"),
          k(0.15, p=_DAHI + "+0.008*depan")]
for _i in range(6):
    _u = (_i + 1) / 6
    _mimpi.append(k(0.15 + 0.15 * (_i + 1), p=_DAHI + f"+{0.008 + 0.10 * _u:.3f}*depan+{0.11 * _u:.3f}*atas+{0.07 * _u:.3f}*luar",
                    b="X" if _i % 2 == 0 else "1"))
_mimpi.append(k(1.2))
S("DREAM", "Mimpi / cita-cita", "Cita-cita", _mimpi, wajah="senang",
  cara="Telunjuk dari dahi bergerak menjauh ke atas sambil ditekuk-luruskan berulang (pikiran melayang).")

S("HOPE", "Berharap", "Cita-cita", [
    k(0, p="pelipis+0.07*luar+0.05*depan", a="telapak", b="FLAT", j="atas", tp="dalam+1.4*depan"),
    *bolak(0.2, 0.18, 4, {"b": "BENT_B"}, {"b": "FLAT"}),
    k(0.95, b="BENT_B"),
], L=[k(0, **IST["L"]), k(0.2, p=A(0.10, -0.42, 1.38), a="telapak", b="FLAT", j="atas", tp="dalam+1.4*belakang"),
      *bolak(0.38, 0.18, 3, {"b": "BENT_B"}, {"b": "FLAT"}), k(0.95, b="BENT_B")],
  wajah="senang", cara="Tangan kanan di samping dahi, tangan kiri di depan; keduanya saling berhadapan dan jari menekuk dua kali.")

S("TRY", "Mencoba / berusaha", "Cita-cita", [
    k(0, p=A(-0.11, -0.30, 1.26), a="telapak", b="S", j="depan+0.3*dalam", tp="dalam+0.6*bawah"),
    k(0.15),
    k(0.4, p=A(-0.12, -0.40, 1.28)),
    k(0.65, p=A(-0.12, -0.47, 1.20)),
    k(0.8),
], L=cermin([
    k(0, p=A(-0.11, -0.30, 1.26), a="telapak", b="S", j="depan+0.3*dalam", tp="dalam+0.6*bawah"),
    k(0.15),
    k(0.4, p=A(-0.12, -0.40, 1.28)),
    k(0.65, p=A(-0.12, -0.47, 1.20)),
    k(0.8),
]), cara="Dua kepalan (S) didorong maju melengkung ke depan-bawah, seperti mendorong dengan usaha.")

# ── Pekerjaan ──────────────────────────────────────────────────────────────

S("JOB", "Pekerjaan", "Pekerjaan", [
    k(0, p=A(0.03, -0.31, 1.25), a="telapak", b="S", j="dalam+0.6*depan", tp="bawah"),
    *bolak(0.15, 0.15, 4, {"p": A(0.03, -0.31, 1.205)}, {"p": A(0.03, -0.31, 1.25)}),
    k(0.7, p=A(0.03, -0.31, 1.205)),
], L=[k(0, p=A(0.045, -0.31, 1.175), a="punggung", b="S", j="dalam+0.6*depan", tp="bawah")],
  cara="Sama dengan WORK: kepalan kanan mengetuk punggung kepalan kiri dua kali (bisa juga dieja J-O-B).")

S("INTERVIEW", "Wawancara", "Pekerjaan", [
    k(0, p="dagu+0.10*depan+0.12*bawah+0.07*luar", a="telapak", b="I", j="depan+0.6*dalam", tp="dalam+0.4*belakang"),
    *bolak(0.15, 0.2, 4, {"p": "dagu+0.24*depan+0.13*bawah+0.07*luar"}, {"p": "dagu+0.10*depan+0.12*bawah+0.07*luar"}),
    k(0.9),
], L=cermin([
    k(0, p="dagu+0.24*depan+0.13*bawah+0.07*luar", a="telapak", b="I", j="depan+0.6*dalam", tp="dalam+0.4*belakang"),
    *bolak(0.15, 0.2, 4, {"p": "dagu+0.10*depan+0.12*bawah+0.07*luar"}, {"p": "dagu+0.24*depan+0.13*bawah+0.07*luar"}),
    k(0.9),
]), cara="Dua tangan bentuk I di depan dagu bergantian maju-mundur, seperti tanya-jawab dua arah.")

S("BOSS", "Atasan / bos", "Pekerjaan", [
    k(0, p=A(-0.15, -0.13, 1.44), a="ujung", b="CLAW", j="bawah+0.6*belakang+0.2*dalam", tp="bawah+0.3*belakang"),
    *bolak(0.15, 0.15, 4, {"p": A(-0.15, -0.11, 1.41)}, {"p": A(-0.15, -0.13, 1.44)}),
    k(0.7, p=A(-0.15, -0.11, 1.41)),
], cara="Tangan cakar (5 bengkok) mengetuk bahu kanan dua kali, seperti tanda pangkat di bahu.")

S("MEETING", "Rapat / pertemuan", "Pekerjaan", [
    k(0, p=A(-0.10, -0.40, 1.30), a="ujung", b="5", j="atas+0.3*depan", tp="dalam"),
    k(0.3, p=A(-0.014, -0.40, 1.30), b="FLAT_O"),
    k(0.5, p=A(-0.10, -0.40, 1.30), b="5"),
    k(0.8, p=A(-0.014, -0.40, 1.30), b="FLAT_O"),
    k(1.0),
], L=cermin([
    k(0, p=A(-0.10, -0.40, 1.30), a="ujung", b="5", j="atas+0.3*depan", tp="dalam"),
    k(0.3, p=A(-0.014, -0.40, 1.30), b="FLAT_O"),
    k(0.5, p=A(-0.10, -0.40, 1.30), b="5"),
    k(0.8, p=A(-0.014, -0.40, 1.30), b="FLAT_O"),
    k(1.0),
]), cara="Dua tangan terbuka (jari ke atas) saling mendekat dan jari mengatup bertemu, dua kali — orang-orang berkumpul.")

S("COMPANY", "Perusahaan", "Pekerjaan", [
    k(0, p="netral+0.06*atas+0.02*depan", a="pergelangan", b="C", j="atas", tp="dalam"),
    *bolak(0.13, 0.13, 5, {"putar": -28}, {"putar": 22}),
    k(0.85, putar=0),
], cara="Tangan bentuk C (telapak ke samping) diputar bolak-balik di pergelangan. Banyak juga yang mengeja C-O.")

# ── Teknologi & media ──────────────────────────────────────────────────────

S("INTERNET", "Internet", "Teknologi", [
    k(0, p=A(-0.006, -0.42, 1.24), a="tengah", b="OPEN_8", j="atas+0.2*depan", tp="dalam"),
    *bolak(0.15, 0.15, 5, {"putar": 25}, {"putar": -20}),
    k(0.9, putar=0),
], L=cermin([
    k(0, p=A(-0.006, -0.42, 1.24), a="tengah", b="OPEN_8", j="atas+0.2*depan", tp="dalam"),
    *bolak(0.15, 0.15, 5, {"putar": -20}, {"putar": 25}),
    k(0.9, putar=0),
]), cara="Dua tangan 8-terbuka, ujung jari tengah saling bersentuhan, diputar bolak-balik (jaringan yang terhubung).")

S("EMAIL", "Surel / email", "Teknologi", [
    k(0, p=A(-0.06, -0.28, 1.25), a="ujung", b="E", j="depan+0.4*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p=A(0.02, -0.48, 1.25)),
    k(0.8),
], L=[k(0, p=A(0.05, -0.38, 1.25), a="telapak", b="C", j="depan+0.3*atas", tp="dalam")],
  cara="Tangan kanan bentuk E didorong maju menembus lingkaran tangan C kiri, seperti surat masuk ke kotak.")

S("VIDEO", "Video", "Teknologi",
  lingkar(0, 0.9, A(0.035, -0.37, 1.26), 0.022, "depan", "atas", n=8, mulai=90, putaran=2,
          a="ujung", b="V", j="dalam+0.6*atas", tp="dalam") + [k(1.05)],
  L=[k(0, p=A(0.05, -0.37, 1.26), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")],
  cara="Ujung jari bentuk V menyentuh telapak kiri yang tegak dan bergerak memutar (layar yang berputar).")

S("CAPTION", "Takarir / teks (caption)", "Teknologi", [
    k(0, p=A(-0.012, -0.40, 1.22), a="telunjuk", b="F", j="atas+0.6*depan", tp="dalam"),
    k(0.3, p=A(-0.13, -0.40, 1.22)),
    k(0.45, p=A(-0.012, -0.40, 1.22)),
    k(0.75, p=A(-0.13, -0.40, 1.22)),
    k(0.9),
], L=cermin([
    k(0, p=A(-0.012, -0.40, 1.22), a="telunjuk", b="F", j="atas+0.6*depan", tp="dalam"),
    k(0.3, p=A(-0.13, -0.40, 1.22)),
    k(0.45, p=A(-0.012, -0.40, 1.22)),
    k(0.75, p=A(-0.13, -0.40, 1.22)),
    k(0.9),
]), cara="Dua tangan bentuk F bertemu di tengah lalu ditarik ke samping dua kali, seperti baris teks yang memanjang.")

# ── Kesehatan ──────────────────────────────────────────────────────────────

S("EXERCISE", "Olahraga / latihan fisik", "Kesehatan", [
    k(0, p=A(-0.19, -0.22, 1.42), a="telapak", b="S", j="atas", tp="depan+0.6*dalam"),
    *bolak(0.15, 0.2, 4, {"p": A(-0.19, -0.22, 1.52)}, {"p": A(-0.19, -0.22, 1.42)}),
    k(0.95),
], L=cermin([
    k(0, p=A(-0.19, -0.22, 1.42), a="telapak", b="S", j="atas", tp="depan+0.6*dalam"),
    *bolak(0.15, 0.2, 4, {"p": A(-0.19, -0.22, 1.52)}, {"p": A(-0.19, -0.22, 1.42)}),
    k(0.95),
]), cara="Dua kepalan di depan bahu diangkat naik-turun dua kali, seperti mengangkat beban.")

S("HEALTHY", "Sehat", "Kesehatan", [
    k(0, p="dada_kanan+0.012*depan", a="telapak", b="CLAW", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p="dada_kanan+0.15*depan", b="S"),
    k(0.8),
], L=cermin([
    k(0, p="dada_kanan+0.012*depan", a="telapak", b="CLAW", j="atas+0.3*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p="dada_kanan+0.15*depan", b="S"),
    k(0.8),
]), wajah="senang", cara="Dua tangan cakar di dada ditarik maju sambil mengepal menjadi S (tubuh kuat & sehat).")

S("STRONG", "Kuat", "Kesehatan", [
    k(0, p=A(-0.14, -0.18, 1.40), a="telapak", b="S", j="atas", tp="belakang"),
    k(0.15),
    k(0.45, p=A(-0.15, -0.30, 1.27), j="atas+0.3*depan"),
    k(0.7),
], L=cermin([
    k(0, p=A(-0.14, -0.18, 1.40), a="telapak", b="S", j="atas", tp="belakang"),
    k(0.15),
    k(0.45, p=A(-0.15, -0.30, 1.27), j="atas+0.3*depan"),
    k(0.7),
]), kepala=[(0.15, 0, 0, 0), (0.45, 6, 0, 0), (0.7, 2, 0, 0)],
  cara="Dua kepalan di depan bahu digerakkan tegas ke depan-bawah, wajah mantap.")

S("WEAK", "Lemah", "Kesehatan", [
    k(0, p=A(0.03, -0.33, 1.178), a="ujung", b="5", j="bawah+0.25*depan", tp="belakang"),
    *bolak(0.2, 0.2, 4, {"b": "CLAW", "p": A(0.03, -0.33, 1.172)}, {"b": "5", "p": A(0.03, -0.33, 1.178)}),
    k(1.0, b="CLAW", p=A(0.03, -0.33, 1.172)),
], L=[k(0, p=A(0.03, -0.33, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  wajah="sedih", cara="Ujung jari tangan 5 berdiri di telapak kiri, jari-jari tertekuk lemas dua kali.")

# ── Alam & lingkungan ──────────────────────────────────────────────────────

S("TREE", "Pohon", "Alam", [
    k(0, p=A(-0.11, -0.33, 1.37), a="pergelangan", b="5", j="atas", tp="dalam+0.4*belakang"),
    *bolak(0.15, 0.15, 5, {"putar": -25}, {"putar": 25}),
    k(0.9, putar=0),
], L=[k(0, p=A(-0.09, -0.31, 1.12), a="ujung", b="FLAT", j="dalam+0.2*depan", tp="bawah")],
  cara="Siku kanan bertumpu di punggung tangan kiri, lengan bawah tegak dan tangan 5 digoyang seperti pohon tertiup angin.")

S("FLOWER", "Bunga", "Alam", [
    k(0, p="hidung+0.03*luar+0.04*depan+0.02*bawah", a="ujung", b="FLAT_O", j="atas+0.8*belakang+0.2*dalam", tp="dalam+0.3*belakang"),
    k(0.15, p="hidung+0.022*luar+0.004*depan"),
    k(0.3),
    k(0.6, p="hidung+0.022*dalam+0.004*depan"),
    k(0.85),
], cara="Ujung jari bentuk O-pipih menyentuh satu sisi hidung lalu sisi lainnya, seperti mencium bunga.")

S("EARTH", "Bumi", "Alam", [
    k(0, p=A(0.03, -0.32, 1.195), a="tengah", b="OPEN_8", j="depan+0.4*dalam", tp="bawah"),
    *bolak(0.15, 0.18, 4, {"putar": -22}, {"putar": 22}),
    k(0.9, putar=0),
], L=[k(0, p=A(0.03, -0.32, 1.165), a="punggung", b="S", j="dalam+0.4*depan", tp="bawah")],
  cara="Ibu jari & jari tengah kanan memegang punggung kepalan kiri, lalu tangan kanan bergoyang kiri-kanan (bumi berputar).")

S("CLEAN", "Bersih", "Alam", [
    k(0, p=A(0.075, -0.265, 1.182), a="telapak", b="FLAT", j="dalam+0.4*depan", tp="bawah"),
    k(0.12),
    k(0.5, p=A(-0.03, -0.38, 1.182)),
    k(0.65),
], L=[k(0, p=A(0.03, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  wajah="senang", cara="Telapak kanan mengusap telapak kiri dari pangkal ke ujung jari, sekali (sama dengan NICE).")

S("DIRTY", "Kotor", "Alam", [
    k(0, p="dagu+0.035*bawah+0.03*depan", a="punggung", b="5", j="dalam+0.2*depan", tp="bawah"),
    *bolak(0.12, 0.13, 6, {"b": "CLAW"}, {"b": "5"}),
    k(0.95),
], wajah="sedih", cara="Punggung tangan 5 di bawah dagu, jari-jari digerakkan bergelombang.")

# ── Hak & aksesibilitas ────────────────────────────────────────────────────

S("ACCESS", "Akses", "Hak", [
    k(0, p=A(-0.03, -0.25, 1.16), a="telapak", b="A", j="depan+0.3*dalam", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.02, -0.47, 1.17)),
    k(0.8),
], L=[k(0, p=A(0.0, -0.35, 1.225), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="bawah")],
  cara="Kepalan A kanan meluncur maju masuk di bawah telapak kiri yang menghadap bawah (masuk / mendapat jalan).")

S("RIGHTS", "Hak", "Hak", [
    k(0, p=A(0.03, -0.27, 1.178), a="sisi_kelingking", b="FLAT", j="depan+0.4*atas", tp="dalam"),
    k(0.15),
    k(0.45, p=A(0.03, -0.39, 1.178)),
    k(0.7, p=A(0.01, -0.46, 1.27), j="atas+0.3*depan"),
    k(0.85),
], L=[k(0, p=A(0.03, -0.33, 1.16), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas")],
  cara="Sisi kelingking tangan datar kanan meluncur di atas telapak kiri lalu naik ke depan (sama dengan ALL-RIGHT).")

S("LAW", "Hukum / undang-undang", "Hak", [
    k(0, p=A(0.035, -0.38, 1.33), a="telapak", b="L", j="atas", tp="dalam"),
    k(0.15, p=A(0.03, -0.38, 1.31)),
    k(0.3, p=A(0.035, -0.38, 1.29)),
    k(0.5, p=A(0.03, -0.38, 1.24)),
    k(0.75),
], L=[k(0, p=A(0.03, -0.38, 1.27), a="telapak", b="FLAT", j="atas", tp="dalam")],
  cara="Tangan bentuk L ditempelkan ke telapak kiri yang tegak, di bagian atas lalu bawah.")

# ── Seni & dunia ───────────────────────────────────────────────────────────

_seni = [k(0, p=A(0.035, -0.38, 1.33), a="kelingking", b="I", j="dalam+0.4*bawah", tp="belakang+0.3*bawah")]
for _i, _x in enumerate((0.02, -0.02, 0.02, -0.02)):
    _seni.append(k(0.2 + 0.18 * _i, p=A(0.035, -0.38 + _x, 1.31 - 0.03 * (_i + 1)), kurva=True))
_seni.append(k(1.05))
S("ART", "Seni / menggambar", "Seni", _seni,
  L=[k(0, p=A(0.045, -0.38, 1.26), a="telapak", b="FLAT", j="atas", tp="dalam")],
  cara="Ujung kelingking (bentuk I) menggambar garis bergelombang turun di telapak kiri.")

S("THEATER", "Teater / berakting", "Seni",
  lingkar(0, 1.0, "dada_kanan+0.035*depan+0.02*bawah", 0.035, "depan", "atas", n=10, mulai=270, putaran=2,
          a="jempol", b="A", j="atas+0.3*dalam", tp="dalam+0.3*belakang") + [k(1.15)],
  L=cermin(lingkar(0, 1.0, "dada_kanan+0.035*depan+0.02*bawah", 0.035, "depan", "atas", n=10, mulai=90, putaran=2,
                   a="jempol", b="A", j="atas+0.3*dalam", tp="dalam+0.3*belakang") + [k(1.15)]),
  cara="Dua kepalan A, ibu jari bergantian berputar mengusap dada ke bawah.")

S("WORLD", "Dunia", "Seni",
  lingkar(0, 0.9, A(0.0, -0.36, 1.24), 0.055, "depan", "atas", n=10, mulai=90, putaran=1,
          a="telapak", b="W", j="atas+0.2*depan", tp="dalam") + [k(1.05)],
  L=[k(0, p=A(0.025, -0.36, 1.22), a="telapak", b="W", j="atas+0.2*depan", tp="dalam")],
  cara="Tangan W kanan berputar maju mengelilingi tangan W kiri lalu mendarat di atasnya.")

# ── Keharusan & penegasan ──────────────────────────────────────────────────

S("MUST", "Harus", "Keharusan", [
    k(0, p="netral+0.10*atas", a="pergelangan", b="X", j="depan", tp="bawah"),
    k(0.15),
    k(0.38, p="netral+0.06*atas", j="bawah+0.6*depan", tp="belakang"),
    k(0.75),
], kepala=[(0.15, 0, 0, 0), (0.38, 10, 0, 0), (0.75, 3, 0, 0)],
  cara="Telunjuk bengkok (X) ditekuk ke bawah dengan tegas satu kali, kepala ikut mengangguk.")

S("SHOULD", "Sebaiknya / seharusnya", "Keharusan", [
    k(0, p="netral+0.09*atas", a="pergelangan", b="X", j="depan", tp="bawah"),
    *bolak(0.16, 0.16, 4, {"j": "bawah+0.6*depan", "tp": "belakang"}, {"j": "depan", "tp": "bawah"}),
    k(0.8, j="bawah+0.6*depan", tp="belakang"),
], cara="Telunjuk bengkok (X) ditekuk ke bawah dua kali dengan ringan (sama dengan NEED).")

S("IMPORTANT", "Penting", "Keharusan", [
    k(0, p=A(-0.10, -0.36, 1.13), a="telunjuk", b="F", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.45, p=A(-0.09, -0.40, 1.24), tp="atas+0.6*dalam"),
    k(0.7, p=A(-0.012, -0.40, 1.30), j="depan+0.4*dalam", tp="dalam"),
    k(0.9),
], L=cermin([
    k(0, p=A(-0.10, -0.36, 1.13), a="telunjuk", b="F", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.45, p=A(-0.09, -0.40, 1.24), tp="atas+0.6*dalam"),
    k(0.7, p=A(-0.012, -0.40, 1.30), j="depan+0.4*dalam", tp="dalam"),
    k(0.9),
]), cara="Dua tangan F mulai di bawah, melengkung naik dan bertemu di atas (lingkaran jari bersentuhan).")

S("ACTUALLY", "Sebenarnya / benar-benar", "Keharusan", [
    k(0, p="dagu+0.035*depan+0.01*atas", a="jari_telunjuk", b="1", j="atas+0.5*dalam", tp="dalam"),
    k(0.15),
    k(0.55, p="dagu+0.17*depan", j="atas+0.4*depan"),
    k(0.75),
], cara="Sisi telunjuk tegak di depan dagu/bibir bergerak maju (sama dengan TRUE/REALLY).")

# ── Berita ─────────────────────────────────────────────────────────────────

S("NEWS", "Berita / informasi", "Berita", [
    k(0, p="dahi+0.02*depan+0.03*luar", a="ujung", b="FLAT_O", j="atas+0.5*dalam+0.2*belakang", tp="belakang"),
    k(0.15),
    k(0.6, p="dahi+0.24*depan+0.20*bawah+0.09*luar", b="5", j="depan+0.4*atas", tp="atas"),
    k(0.8),
], L=[k(0, p="dagu+0.06*depan+0.10*bawah+0.05*luar", a="ujung", b="FLAT_O", j="atas+0.5*dalam", tp="belakang"),
      k(0.15), k(0.6, p="dagu+0.24*depan+0.18*bawah+0.06*luar", b="5", j="depan+0.4*atas", tp="atas"), k(0.8)],
  cara="Dua tangan O-pipih di dahi dan dagu bergerak maju sambil membuka (pengetahuan disebarkan; serupa INFORM).")

S("ANNOUNCE", "Mengumumkan", "Berita", [
    k(0, p="mulut+0.035*luar+0.03*depan", a="telunjuk", b="1", j="dalam+0.6*atas", tp="belakang"),
    k(0.15),
    k(0.6, p="mulut+0.20*luar+0.10*depan+0.08*atas", j="luar+0.6*atas+0.3*depan", tp="depan"),
    k(0.8),
], L=cermin([
    k(0, p="mulut+0.035*luar+0.03*depan", a="telunjuk", b="1", j="dalam+0.6*atas", tp="belakang"),
    k(0.15),
    k(0.6, p="mulut+0.20*luar+0.10*depan+0.08*atas", j="luar+0.6*atas+0.3*depan", tp="depan"),
    k(0.8),
]), wajah="senang", cara="Dua telunjuk di sisi mulut diputar ke luar dan menjauh ke samping atas (menyebarkan kabar).")
