# [isyarat-b1b2-v1] Kamus isyarat ASL B1.1 "Classifiers & Space — Classifier & Ruang Isyarat".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan. Format sama dengan kamus.py.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli (terutama STRIPES, DOTS, CLOUD,
#    BRIDGE, BUILDING, ACROSS, LINE-UP yang variasinya banyak).

from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

# Tangan kiri dasar
_KIRI_ATAS = dict(p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
_KIRI_TEGAK = dict(p=A(0.05, -0.33, 1.27), a="telapak", b="FLAT", j="atas+0.2*depan", tp="dalam")


def _ist_l(t, **kunci):
    """Tangan kiri diam di posisi istirahat lalu masuk ke kunci pada waktu t."""
    return [k(0, **IST["L"]), k(t, **kunci)]


# ── Deskripsi bentuk & ukuran (SASS) ───────────────────────────────────────

S("B11_DESCRIBE", "Menjelaskan / mendeskripsikan", "Classifier", [
    k(0, p=A(-0.05, -0.34, 1.25), a="jempol", b="F", j="depan+0.3*atas", tp="dalam"),
    *bolak(0.15, 0.18, 4, {"p": A(-0.05, -0.42, 1.25)}, {"p": A(-0.05, -0.32, 1.25)}),
    k(0.9),
], L=[
    k(0, p=A(0.05, -0.42, 1.25), a="jempol", b="F", j="depan+0.3*atas", tp="dalam"),
    *bolak(0.15, 0.18, 4, {"p": A(0.05, -0.32, 1.25)}, {"p": A(0.05, -0.42, 1.25)}),
    k(0.9),
], gloss="DESCRIBE", cara="Dua tangan F (telapak saling berhadapan) maju-mundur bergantian, seperti menjelaskan.")

S("B11_STRIPES", "Bergaris (pola garis mendatar)", "Classifier", [
    k(0, p="dada_kiri+0.02*depan+0.04*atas+0.03*dalam", a="telapak", b="4", j="dalam+0.15*bawah", tp="belakang"),
    k(0.15),
    k(0.6, p="dada_kanan+0.03*depan+0.04*atas+0.06*luar"),
    k(0.7, p="dada_kiri+0.03*depan+0.03*bawah+0.03*dalam"),
    k(1.05, p="dada_kanan+0.03*depan+0.03*bawah+0.06*luar"),
    k(1.2),
], gloss="STRIPES", cara="Tangan 4 (jari renggang) diusapkan mendatar melintasi dada — garis-garis pada baju.")

S("B11_DOTS", "Berbintik / polkadot", "Classifier", [
    k(0, p="dada_kiri+0.06*depan+0.05*atas", a="telapak", b="F", j="atas+0.3*dalam", tp="belakang"),
    k(0.15, p="dada_kiri+0.025*depan+0.05*atas"),
    k(0.3, p="dada+0.06*depan+0.03*bawah"),
    k(0.45, p="dada+0.025*depan+0.03*bawah"),
    k(0.6, p="dada_kanan+0.06*depan+0.05*atas"),
    k(0.75, p="dada_kanan+0.025*depan+0.05*atas"),
    k(0.95),
], gloss="DOTS", cara="Lingkaran tangan F ditempelkan di beberapa titik di dada — motif bintik/polkadot.")

S("B11_CL_F", "CL:F — benda kecil bulat pipih (koin, kancing, bintik)", "Classifier", [
    k(0, p="netral+0.08*atas+0.02*dalam", a="telunjuk", b="F", j="depan+0.4*dalam", tp="bawah"),
    k(0.15),
    k(0.35, p="netral+0.02*atas+0.02*dalam"),
    k(0.5, p="netral+0.07*atas+0.06*luar"),
    k(0.7, p="netral+0.02*atas+0.06*luar"),
    k(0.9),
], gloss="CL:F", cara="Lingkaran ibu jari & telunjuk (F) = benda kecil bulat pipih; diletakkan di beberapa titik.")

S("B11_LINE", "CL:I — garis tipis / benang", "Classifier", [
    k(0, p=A(-0.012, -0.38, 1.27), a="kelingking", b="I", j="dalam+0.5*atas", tp="belakang"),
    k(0.15),
    k(0.6, p=A(-0.19, -0.38, 1.27)),
    k(0.75),
], L=cermin([
    k(0, p=A(-0.012, -0.38, 1.27), a="kelingking", b="I", j="dalam+0.5*atas", tp="belakang"),
    k(0.15),
    k(0.6, p=A(-0.19, -0.38, 1.27)),
    k(0.75),
]), gloss="CL:I", cara="Dua kelingking (bentuk I) bersentuhan lalu ditarik berpisah — garis tipis yang panjang.")

S("B11_TINY", "Kecil sekali / mungil", "Classifier", [
    k(0, p="netral+0.08*atas+0.02*dalam", a="telunjuk", b="BABY_O", j="atas+0.3*dalam", tp="depan+0.6*dalam"),
    *bolak(0.15, 0.12, 4, {"p": "netral+0.08*atas+0.03*dalam"}, {"p": "netral+0.08*atas+0.01*dalam"}),
    k(0.7),
], gloss="TINY", cara="Ujung ibu jari & telunjuk hampir bertemu, digoyang kecil; mulut mengerucut (morfem OO = kecil).")

S("B11_HUGE", "Sangat besar / raksasa", "Classifier", [
    k(0, p=A(-0.05, -0.38, 1.26), a="telapak", b="CLAW", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.26, -0.36, 1.32)),
    k(0.8),
], L=cermin([
    k(0, p=A(-0.05, -0.38, 1.26), a="telapak", b="CLAW", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.6, p=A(-0.26, -0.36, 1.32)),
    k(0.8),
]), wajah="senang", gloss="HUGE", cara="Dua tangan cakar saling berhadapan ditarik jauh ke samping; pipi menggembung (morfem CHA = besar).")

# ── Handling classifier ────────────────────────────────────────────────────

S("B11_HOLD", "CL:S — memegang gagang (tas, sapu, tali)", "Classifier", [
    k(0, p="netral+0.03*atas", a="telapak", b="5", j="depan+0.2*atas", tp="dalam"),
    k(0.15),
    k(0.35, b="S"),
    k(0.7, p="netral+0.12*atas"),
    k(0.85),
], gloss="CL:S", cara="Tangan terbuka menggenggam (S) lalu mengangkat — memegang gagang benda.")

S("B11_PULL", "Menarik (tali)", "Classifier", [
    k(0, p=A(-0.03, -0.46, 1.23), a="telapak", b="S", j="dalam+0.2*depan", tp="bawah+0.3*belakang"),
    k(0.15),
    k(0.45, p=A(-0.03, -0.32, 1.22)),
    k(0.55, p=A(-0.03, -0.44, 1.23)),
    k(0.85, p=A(-0.03, -0.30, 1.22)),
    k(1.0),
], L=[
    k(0, p=A(0.03, -0.54, 1.25), a="telapak", b="S", j="dalam+0.2*depan", tp="bawah+0.3*belakang"),
    k(0.15),
    k(0.45, p=A(0.03, -0.40, 1.24)),
    k(0.55, p=A(0.03, -0.52, 1.25)),
    k(0.85, p=A(0.03, -0.38, 1.24)),
    k(1.0),
], gloss="PULL", cara="Dua kepalan (S) berbaris seperti memegang tali, ditarik ke arah badan dua kali.")

S("B11_DRAW", "Menggambar", "Classifier", [
    k(0, p=A(0.03, -0.33, 1.33), a="kelingking", b="I", j="dalam+0.2*atas", tp="bawah+0.4*belakang"),
    k(0.15),
    k(0.35, p=A(0.03, -0.35, 1.30)),
    k(0.55, p=A(0.03, -0.31, 1.27)),
    k(0.75, p=A(0.03, -0.35, 1.24)),
    k(0.9),
], L=_ist_l(0.12, **_KIRI_TEGAK) + [k(0.9)],
  gloss="DRAW", cara="Kelingking (bentuk I) menggambar garis berkelok ke bawah di telapak kiri yang tegak.")

S("B11_PICTURE", "Gambar / foto", "Classifier", [
    k(0, p="pipi+0.06*depan+0.03*luar", a="telapak", b="C", j="atas", tp="depan"),
    k(0.15),
    k(0.6, p=A(0.0, -0.36, 1.28), tp="dalam"),
    k(0.85),
], L=_ist_l(0.3, **_KIRI_TEGAK) + [k(0.85)],
  gloss="PICTURE", cara="Tangan C di samping wajah (seperti kamera), lalu ditempelkan ke telapak kiri yang tegak.")

S("B11_SUMMARIZE", "Merangkum / meringkas", "Classifier", [
    k(0, p=A(-0.02, -0.38, 1.38), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.02, -0.38, 1.29), b="S"),
    k(0.8),
], L=[
    k(0, p=A(0.02, -0.38, 1.14), a="telapak", b="5", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.6, p=A(0.02, -0.38, 1.23), b="S"),
    k(0.8),
], gloss="SUMMARIZE", cara="Dua tangan terbuka (atas-bawah) saling mendekat sambil menggenggam — banyak isi dipadatkan.")

# ── Ruangan & bangunan ─────────────────────────────────────────────────────

S("B11_WINDOW", "Jendela", "Rumah", [
    k(0, p=A(0.0, -0.38, 1.36), a="sisi_kelingking", b="FLAT", j="dalam", tp="belakang"),
    k(0.15),
    k(0.32, p=A(0.0, -0.38, 1.275)),
    k(0.47, p=A(0.0, -0.38, 1.33)),
    k(0.62, p=A(0.0, -0.38, 1.275)),
    k(0.85),
], L=[k(0, p=A(0.0, -0.375, 1.27), a="sisi_telunjuk", b="FLAT", j="dalam", tp="belakang")],
  gloss="WINDOW", cara="Dua tangan datar bertumpuk (telapak ke badan); tangan atas turun mengetuk tangan bawah dua kali — jendela ditutup.")

S("B11_WALL", "Dinding", "Rumah", [
    k(0, p=A(-0.02, -0.44, 1.30), a="sisi_telunjuk", b="FLAT", j="atas", tp="depan"),
    k(0.15),
    k(0.6, p=A(-0.20, -0.42, 1.30)),
    k(0.75),
], L=cermin([
    k(0, p=A(-0.02, -0.44, 1.30), a="sisi_telunjuk", b="FLAT", j="atas", tp="depan"),
    k(0.15),
    k(0.6, p=A(-0.20, -0.42, 1.30)),
    k(0.75),
]), gloss="WALL", cara="Dua telapak tegak menghadap depan, berdampingan lalu ditarik ke samping — permukaan dinding.")

S("B11_FLOOR", "Lantai", "Rumah", [
    k(0, p=A(-0.02, -0.38, 1.14), a="sisi_telunjuk", b="FLAT", j="depan", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.22, -0.36, 1.14)),
    k(0.75),
], L=cermin([
    k(0, p=A(-0.02, -0.38, 1.14), a="sisi_telunjuk", b="FLAT", j="depan", tp="bawah"),
    k(0.15),
    k(0.6, p=A(-0.22, -0.36, 1.14)),
    k(0.75),
]), gloss="FLOOR", cara="Dua telapak menghadap bawah, berdampingan setinggi pinggang, ditarik ke samping — lantai yang datar.")

S("B11_BUILDING", "Gedung / bangunan", "Rumah", [
    k(0, p=A(-0.03, -0.38, 1.18), a="telapak", b="FLAT", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.3, p=A(-0.03, -0.38, 1.26)),
    k(0.5),
    k(0.65, p=A(-0.03, -0.38, 1.34)),
    k(0.8, p=A(-0.09, -0.38, 1.36), j="atas", tp="dalam"),
    k(1.15, p=A(-0.09, -0.38, 1.44)),
    k(1.3),
], L=[
    k(0, p=A(0.03, -0.38, 1.22), a="punggung", b="FLAT", j="dalam+0.3*depan", tp="bawah"),
    k(0.15),
    k(0.3),
    k(0.5, p=A(0.03, -0.38, 1.30)),
    k(0.65),
    k(0.8, p=A(0.09, -0.38, 1.36), a="telapak", j="atas", tp="dalam"),
    k(1.15, p=A(0.09, -0.38, 1.44)),
    k(1.3),
], gloss="BUILDING", cara="Dua tangan datar bergantian bertumpuk naik (lantai demi lantai), lalu tegak berhadapan naik ke atas.")

S("B11_BRIDGE", "Jembatan", "Lingkungan", [
    k(0, p=A(-0.05, -0.38, 1.17), a="ujung", b="V", j="atas", tp="belakang"),
    k(0.15),
    k(0.3, p=A(-0.05, -0.38, 1.205)),
    k(0.55, p=A(0.07, -0.36, 1.19)),
    k(0.7, p=A(0.07, -0.36, 1.215)),
    k(0.9),
], L=[k(0, p=A(-0.06, -0.38, 1.24), a="pergelangan", b="S", j="dalam", tp="bawah")],
  gloss="BRIDGE", cara="Lengan kiri mendatar (jalan di atas jembatan); ujung jari V kanan menyentuh bawah pergelangan lalu dekat siku (tiang jembatan).")

# ── Jalan, lalu lintas & arah ──────────────────────────────────────────────

_ST = [
    k(0, p=A(-0.08, -0.28, 1.20), a="telapak", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.65, p=A(-0.08, -0.48, 1.20)),
    k(0.8),
]
S("B11_STREET", "Jalan (raya)", "Lingkungan", _ST, L=cermin(_ST),
  gloss="STREET", cara="Dua telapak sejajar saling berhadapan, digerakkan lurus ke depan — badan jalan.")

S("B11_INTERSECTION", "Persimpangan", "Lingkungan", [
    k(0, p=A(0.0, -0.40, 1.27), a="jari_telunjuk", b="1", j="depan", tp="bawah"),
    k(0.15),
    k(0.32, p=A(0.0, -0.40, 1.237)),
    k(0.47, p=A(0.0, -0.40, 1.26)),
    k(0.62, p=A(0.0, -0.40, 1.237)),
    k(0.85),
], L=[k(0, p=A(0.0, -0.40, 1.22), a="jari_telunjuk", b="1", j="dalam", tp="bawah")],
  gloss="INTERSECTION", cara="Telunjuk kanan (menunjuk ke depan) menyilang di atas telunjuk kiri (mendatar) — dua jalan bersilangan.")

_FAST = [
    k(0, p=A(-0.08, -0.40, 1.22), a="pergelangan", b="L", j="depan", tp="dalam"),
    k(0.15),
    k(0.28, b="X", p=A(-0.08, -0.34, 1.22)),
    k(0.55),
]
S("B11_FAST", "Cepat", "Lalu lintas", _FAST, L=cermin(_FAST),
  gloss="FAST", cara="Dua tangan L (telunjuk ke depan) cepat ditarik sedikit sambil telunjuk menekuk — gerak sekejap.")

S("B11_STOP", "Berhenti", "Lalu lintas", [
    k(0, p=A(0.035, -0.33, 1.33), a="sisi_kelingking", b="FLAT", j="depan", tp="dalam"),
    k(0.12),
    k(0.32, p=A(0.035, -0.33, 1.178)),
    k(0.6),
], L=[k(0, **_KIRI_ATAS)],
  gloss="STOP", cara="Sisi kelingking tangan datar kanan dihentakkan ke telapak kiri — berhenti.")

S("B11_PASS", "Menyalip / melewati", "Lalu lintas", [
    k(0, p=A(-0.03, -0.27, 1.22), a="sisi_telunjuk", b="A", j="depan", tp="dalam"),
    k(0.15),
    k(0.7, p=A(-0.03, -0.52, 1.22)),
    k(0.85),
], L=[k(0, p=A(0.03, -0.40, 1.22), a="sisi_telunjuk", b="A", j="depan", tp="dalam")],
  gloss="PASS", cara="Dua kepalan A (ibu jari ke atas) berdampingan; tangan kanan dari belakang maju melewati tangan kiri.")

S("B11_PARK", "Parkir", "Lalu lintas", [
    k(0, p=A(0.0, -0.40, 1.27), a="sisi_kelingking", b="3", j="depan", tp="dalam"),
    k(0.15),
    k(0.5, p=A(0.03, -0.33, 1.178)),
    k(0.8),
], L=[k(0, **_KIRI_ATAS)],
  gloss="PARK-CAR", cara="Tangan 3 (kendaraan) diletakkan mantap di telapak kiri — mobil diparkir.")

S("B11_NEAR", "Dekat", "Arah", [
    k(0, p=A(-0.02, -0.26, 1.24), a="punggung", b="BENT_B", j="atas+0.4*dalam", tp="belakang"),
    k(0.15),
    k(0.35, p=A(-0.02, -0.355, 1.24)),
    k(0.45, p=A(-0.02, -0.31, 1.24)),
    k(0.65, p=A(-0.02, -0.355, 1.24)),
    k(0.85),
], L=[k(0, p=A(0.02, -0.38, 1.24), a="telapak", b="BENT_B", j="atas+0.4*dalam", tp="belakang")],
  gloss="NEAR", cara="Dua tangan menekuk (telapak ke badan); punggung tangan kanan didekatkan ke telapak kiri dua kali.")

S("B11_FAR", "Jauh", "Arah", [
    k(0, p=A(-0.015, -0.36, 1.22), a="sisi_telunjuk", b="A", j="depan", tp="dalam"),
    k(0.15),
    k(0.45, p=A(-0.05, -0.48, 1.27), kurva=True),
    k(0.75, p=A(-0.09, -0.60, 1.23), kurva=True),
    k(0.9),
], L=[k(0, p=A(0.015, -0.36, 1.22), a="sisi_telunjuk", b="A", j="depan", tp="dalam")],
  wajah="ya_tidak", gloss="FAR", cara="Dua kepalan A berdampingan; tangan kanan melengkung jauh ke depan.")

S("B11_ACROSS", "Seberang / di seberang", "Arah", [
    k(0, p=A(0.03, -0.31, 1.195), a="sisi_kelingking", b="FLAT", j="dalam+0.5*depan", tp="dalam+0.3*bawah"),
    k(0.15),
    k(0.6, p=A(0.04, -0.49, 1.195)),
    k(0.75),
], L=[k(0, p=A(0.04, -0.40, 1.18), a="punggung", b="FLAT", j="dalam+0.2*depan", tp="bawah")],
  gloss="ACROSS", cara="Sisi kelingking tangan kanan meluncur melintasi punggung tangan kiri ke depan — ke seberang.")

S("B11_LINE_UP", "Antre / berbaris", "Orang", [
    k(0, p=A(-0.01, -0.25, 1.25), a="telapak", b="4", j="atas", tp="dalam"),
    k(0.15),
    k(0.7, p=A(-0.01, -0.33, 1.25)),
    k(0.85),
], L=[
    k(0, p=A(0.01, -0.35, 1.25), a="telapak", b="4", j="atas", tp="dalam"),
    k(0.15),
    k(0.7, p=A(0.01, -0.47, 1.25)),
    k(0.85),
], gloss="LINE-UP", cara="Dua tangan 4 (jari = orang-orang) berbaris depan-belakang, bergerak maju bersama — antrean.")

# ── Penampilan orang ───────────────────────────────────────────────────────

S("B11_FACE", "Wajah", "Penampilan",
  lingkar(0, 0.8, "hidung+0.13*depan", 0.075, "luar", "atas", n=8, mulai=90,
          a="telunjuk", b="1", j="atas+0.3*belakang", tp="belakang+0.3*dalam") + [k(0.95)],
  gloss="FACE", cara="Telunjuk memutari wajah sekali.")

S("B11_GLASSES", "Kacamata", "Penampilan", [
    k(0, p="mata+0.015*depan+0.045*luar", a="telunjuk", b="G", j="depan+0.3*dalam", tp="dalam+0.2*belakang"),
    k(0.15),
    k(0.4, p="mata+0.03*belakang+0.075*luar"),
    k(0.5, p="mata+0.015*depan+0.045*luar"),
    k(0.75, p="mata+0.03*belakang+0.075*luar"),
    k(0.9),
], gloss="GLASSES", cara="Tangan G (ibu jari & telunjuk sejajar) di sudut luar mata, digeser ke arah telinga dua kali — gagang kacamata.")

S("B11_BEARD", "Janggut / jenggot", "Penampilan", [
    k(0, p="rahang+0.02*depan+0.02*atas", a="ujung", b="CLAW", j="atas+0.3*dalam", tp="belakang+0.6*dalam"),
    k(0.15),
    k(0.6, p="dagu+0.03*depan+0.04*bawah", b="FLAT_O", j="atas+0.2*depan"),
    k(0.8),
], gloss="BEARD", cara="Tangan cakar mengusap rahang turun ke dagu lalu mengatup — janggut.")

_curly = [k(0, p="telinga+0.06*luar+0.03*atas", a="telunjuk", b="1", j="atas+0.3*dalam", tp="dalam+0.3*belakang")]
import math as _m
for _i in range(10):
    _a = _m.radians(36 * (_i + 1))
    _curly.append(k(0.1 + 0.08 * (_i + 1),
                    p=f"telinga+{0.06 + 0.02 * _m.cos(_a):.4f}*luar+{0.02 * _m.sin(_a):.4f}*depan+{0.03 - 0.012 * (_i + 1):.4f}*atas",
                    kurva=True))
_curly.append(k(1.1))
S("B11_CURLY", "Rambut keriting", "Penampilan", _curly,
  gloss="CURLY", cara="Telunjuk berputar spiral turun di samping kepala — rambut ikal/keriting.")

S("B11_LONG_HAIR", "CL:B — rambut panjang", "Penampilan", [
    k(0, p="telinga+0.035*luar+0.01*depan+0.05*bawah", a="telapak", b="FLAT", j="bawah+0.2*depan", tp="dalam", siku="bawah+0.5*luar"),
    k(0.15),
    k(0.7, p="bahu_kanan+0.045*luar+0.06*bawah+0.02*depan"),
    k(0.85),
], gloss="CL:B rambut", cara="Tangan datar menyusuri sisi kepala turun melewati bahu — panjang rambut sampai di sini.")

S("B11_LOOK_FOR", "Mencari", "Penampilan",
  lingkar(0, 1.0, "dagu+0.20*depan+0.05*luar+0.01*atas", 0.045, "luar", "atas", n=10, mulai=0, putaran=2,
          a="telapak", b="C", j="atas", tp="belakang") + [k(1.15)],
  wajah="wh", gloss="LOOK-FOR", cara="Tangan C di depan wajah (telapak ke wajah) berputar dua kali — mencari ke sana kemari.")

# ── Alam & cuaca ───────────────────────────────────────────────────────────

S("B11_RIVER", "Sungai", "Alam", [
    k(0, p="dagu+0.03*depan", a="telunjuk", b="W", j="atas", tp="dalam"),
    *bolak(0.12, 0.12, 3, {"p": "dagu+0.004*depan"}, {"p": "dagu+0.03*depan"}),
    k(0.55, p=A(-0.07, -0.30, 1.20), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.75, p=A(-0.07, -0.37, 1.23), kurva=True),
    k(0.95, p=A(-0.07, -0.44, 1.19), kurva=True),
    k(1.15, p=A(-0.07, -0.51, 1.22), kurva=True),
    k(1.3),
], L=[
    k(0, **IST["L"]),
    k(0.55, p=A(0.07, -0.30, 1.20), a="telapak", b="5", j="depan+0.3*dalam", tp="bawah"),
    k(0.75, p=A(0.07, -0.37, 1.23), kurva=True),
    k(0.95, p=A(0.07, -0.44, 1.19), kurva=True),
    k(1.15, p=A(0.07, -0.51, 1.22), kurva=True),
    k(1.3),
], gloss="RIVER", cara="WATER (tangan W mengetuk dagu), lalu dua tangan terbuka menghadap bawah bergelombang ke depan — air mengalir.")

S("B11_WAVE", "Ombak", "Alam", [
    k(0, p=A(-0.06, -0.28, 1.20), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.12),
    k(0.4, p=A(-0.06, -0.38, 1.32), j="depan+0.4*atas", kurva=True),
    k(0.6, p=A(-0.06, -0.46, 1.22), j="depan+0.5*bawah", kurva=True),
    k(0.85, p=A(-0.06, -0.52, 1.30), j="depan+0.4*atas", kurva=True),
    k(1.05, p=A(-0.06, -0.58, 1.21), j="depan+0.5*bawah", kurva=True),
    k(1.2),
], gloss="WAVE", cara="Tangan datar menghadap bawah bergerak maju naik-turun melengkung — ombak bergulung.")

S("B11_WIND", "Angin", "Alam", [
    k(0, p=A(-0.14, -0.34, 1.36), a="telapak", b="5", j="atas+0.2*depan", tp="dalam"),
    *bolak(0.15, 0.22, 4, {"p": A(-0.04, -0.34, 1.38), "j": "atas+0.4*dalam"}, {"p": A(-0.16, -0.34, 1.36), "j": "atas+0.2*luar"}),
    k(1.1),
], L=[
    k(0, p=A(0.10, -0.34, 1.36), a="telapak", b="5", j="atas+0.2*depan", tp="dalam"),
    *bolak(0.15, 0.22, 4, {"p": A(0.18, -0.34, 1.36), "j": "atas+0.4*luar"}, {"p": A(0.06, -0.34, 1.38), "j": "atas+0.2*dalam"}),
    k(1.1),
], gloss="WIND", cara="Dua tangan terbuka di samping kepala diayun bersama ke kiri-kanan — angin bertiup.")

S("B11_CLOUD", "Awan", "Alam",
  lingkar(0, 1.0, A(-0.17, -0.30, 1.68), 0.035, "luar", "atas", n=10, mulai=90, putaran=2,
          a="telapak", b="C", j="depan+0.4*atas", tp="dalam") + [k(1.15)],
  L=lingkar(0, 1.0, A(0.17, -0.30, 1.68), 0.035, "luar", "atas", n=10, mulai=270, putaran=2,
            a="telapak", b="C", j="depan+0.4*atas", tp="dalam") + [k(1.15)],
  gloss="CLOUD", cara="Dua tangan C melengkung di atas samping kepala, berputar bergumpal — awan.")

S("B11_SKY", "Langit", "Alam", [
    k(0, p=A(0.06, -0.40, 1.74), a="telapak", b="FLAT", j="atas+0.5*dalam", tp="depan+0.3*bawah"),
    k(0.15),
    k(0.5, p=A(-0.08, -0.38, 1.80), j="atas+0.1*dalam", kurva=True),
    k(0.85, p=A(-0.22, -0.32, 1.70), j="atas+0.4*luar", kurva=True),
    k(1.0),
], gloss="SKY", cara="Tangan datar menyapu melengkung di atas depan kepala ke samping kanan — bentangan langit.")
