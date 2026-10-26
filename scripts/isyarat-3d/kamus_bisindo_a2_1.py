# [isyarat-bisindo-a1a2-v1] Kamus isyarat BISINDO A2.1 "Kehidupan Sehari-hari".
# Tangan dominan kanan (R), pasif kiri (L). Format = kamus_bisindo.py (S/k/lingkar/bolak/cermin).
#
# ⚠️ AKURASI: hampir semua bentuk di sini ditulis dari pengetahuan umum isyarat BISINDO yang
# ikonik (dialek Jakarta yang paling banyak beredar di video komunitas) — BELUM dicek pengajar
# Tuli. Semua yang tidak yakin / bervariasi antardaerah diberi ragu=True. Satu-satunya bentuk
# dengan rujukan tertulis: KECIL (ujung ibu jari bertemu ujung jari manis, tiga jari lain
# terbuka ke atas, dijentikkan — dideskripsikan dalam artikel jurnal KEMBARA UMM tentang
# morfologi BISINDO). Kata yang di komunitas umumnya dieja jari (PAMAN/OM, SEPUPU, PR, INGGRIS)
# ditulis tanpa gerak → dieja otomatis di slide.

from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # Ibu jari bertemu ujung jari manis, telunjuk/tengah/kelingking terbuka (KECIL)
    "B21_KECIL": (I._jari(I.LURUS, I.RENGGANG, ring=(48, 62, 40)), ("ujung", "ring")),
    # Paruh: telunjuk melengkung bertemu ibu jari, jari lain menggenggam (AYAM)
    "B21_PARUH": (I._jari(_G, index=(40, 55, 35)), ("ujung", "index")),
    # Cakar terbuka setengah (memegang bola)
    "B21_BOLA": (I._jari((30, 30, 20), I.RENGGANG), "C"),
})

# Tangan kiri dasar
L_ATAS = dict(p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")
L_TEGAK = dict(p=A(0.03, -0.33, 1.22), a="telapak", b="FLAT", j="atas+0.3*depan", tp="dalam")

def _L(d, t=0, **lain):
    x = dict(d); x.pop("t", None); x.update(lain); return k(t, **x)

def _cermin(keys):
    """cermin() + bahu_kanan → bahu_kiri (cermin() bawaan tidak menukar bahu)."""
    out = cermin(keys)
    for d in out:
        if isinstance(d.get("p"), str): d["p"] = d["p"].replace("bahu_kanan", "bahu_kiri")
    return out

def _dua(kode, arti, kat, R, cara, **kw):
    """Isyarat dua tangan simetris (kiri = cermin kanan)."""
    S(kode, arti, kat, R, L=_cermin(R), cara=cara, **kw)

GELENG = [(0.1, 0, 0, 0), (0.3, 0, 12, 0), (0.5, 0, -12, 0), (0.7, 0, 8, 0), (0.85, 0, 0, 0)]
ANGGUK = [(0.1, 0, 0, 0), (0.3, 10, 0, 0), (0.5, 0, 0, 0), (0.7, 8, 0, 0), (0.85, 0, 0, 0)]

# ── Sapaan lanjutan ─────────────────────────────────────────────────────────

S("LAMA", "Lama (waktu)", "Waktu", [
    k(0, p="netral+0.10*atas+0.02*belakang", a="telunjuk", b="1", j="atas+0.4*depan", tp="dalam"),
    k(0.12),
    k(0.45, p="netral+0.13*atas+0.10*depan+0.03*luar", j="depan+0.5*atas", kurva=True),
    k(0.85, p="netral+0.08*atas+0.20*depan+0.06*luar", j="depan+0.2*atas", kurva=True),
    k(1.0),
], ragu=True, cara="Telunjuk tegak di depan bahu bergerak pelan melengkung jauh ke depan, sambil bibir mengucapkan 'lamaa' tanpa suara.")

_R = [
    k(0, p=A(-0.12, -0.34, 1.26), a="telapak", b="1", j="atas", tp="dalam"),
    k(0.12),
    k(0.48, p=A(-0.022, -0.36, 1.26)),
    k(0.7),
]
_dua("BERTEMU", "Bertemu", "Orang", _R, wajah="senang",
     cara="Dua telunjuk tegak dari kiri-kanan saling mendekat sampai bertemu di tengah, seperti dua orang bertemu.")

# ── Keluarga besar ─────────────────────────────────────────────────────────

_TONGKAT = [
    k(0.55, p="netral+0.02*bawah", a="telapak", b="S", j="dalam+0.3*depan", tp="belakang+0.3*dalam"),
    k(0.75, p="netral+0.06*bawah"), k(0.9, p="netral+0.01*bawah"), k(1.05, p="netral+0.06*bawah"), k(1.2),
]
S("KAKEK", "Kakek", "Keluarga", [
    k(0, p="mulut+0.025*atas+0.012*depan+0.02*luar", a="jari_telunjuk", b="1", j="dalam+0.7*atas", tp="belakang+0.6*bawah", siku="bawah"),
    k(0.1), k(0.35, p="mulut+0.025*atas+0.012*depan+0.04*dalam"), k(0.45),
    *_TONGKAT,
], ragu=True,
  cara="Telunjuk mendatar mengusap atas bibir (kumis = laki-laki), lalu kepalan bergerak turun-naik seperti memegang tongkat (tua).")

S("NENEK", "Nenek", "Keluarga", [
    k(0, p="telinga+0.025*bawah+0.03*depan+0.01*luar", a="telunjuk", b="B21_PARUH", j="atas+0.2*dalam", tp="dalam+0.4*belakang", siku="bawah"),
    k(0.1), k(0.3, p="telinga+0.045*bawah+0.03*depan+0.01*luar"), k(0.45),
    *_TONGKAT,
], ragu=True,
  cara="Ibu jari & telunjuk mencubit cuping telinga (anting = perempuan), lalu kepalan bergerak turun-naik seperti memegang tongkat (tua).")

S("PAMAN", "Paman / om", "Keluarga", [], gloss="OM", ragu=True,
  cara="Di banyak daerah dieja jari O-M (atau P-A-M-A-N); isyarat lokal berbeda-beda — tanyakan ke pengajar Tuli.")
S("BIBI", "Bibi / tante", "Keluarga", [], gloss="TANTE", ragu=True,
  cara="Di banyak daerah dieja jari T-A-N-T-E (atau B-I-B-I); isyarat lokal berbeda-beda — tanyakan ke pengajar Tuli.")
S("SEPUPU", "Sepupu", "Keluarga", [], ragu=True,
  cara="Umumnya dieja jari S-E-P-U-P-U; tanyakan ke pengajar Tuli apakah ada isyarat lokal.")

S("CUCU", "Cucu", "Keluarga", [
    k(0, p="dada+0.20*depan+0.05*luar", a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.12), k(0.35, p="dada+0.22*depan+0.05*luar+0.08*bawah"), k(0.45),
    k(0.7, p="dada+0.24*depan+0.06*luar+0.17*bawah"), k(0.85),
], ragu=True,
  cara="Telapak datar menghadap bawah (anak kecil) diturunkan dua tingkat ke depan — dua generasi di bawahmu.")

_CINCIN_L = [k(0, p=A(0.07, -0.33, 1.21), a="telapak", b="5", j="dalam+0.5*depan", tp="bawah")]
_CINCIN_R = [
    k(0, p=A(0.03, -0.40, 1.24), a="telunjuk", b="B21_PARUH", j="dalam+0.6*bawah", tp="dalam+0.6*bawah"),
    k(0.12), k(0.4, p=A(0.035, -0.395, 1.215)), k(0.6, p=A(0.05, -0.385, 1.215)), k(0.75),
]
S("MENIKAH", "Menikah", "Keluarga", _CINCIN_R, L=_CINCIN_L, wajah="senang", ragu=True,
  cara="Ibu jari & telunjuk kanan seolah memasang cincin di jari manis tangan kiri yang menghadap bawah.")

def _plus_cincin(t0):
    return [dict(kk, t=kk["t"] + t0) for kk in _CINCIN_R]

S("SUAMI", "Suami", "Keluarga", [
    k(0, p="mulut+0.025*atas+0.012*depan+0.02*luar", a="jari_telunjuk", b="1", j="dalam+0.7*atas", tp="belakang+0.6*bawah", siku="bawah"),
    k(0.1), k(0.3, p="mulut+0.025*atas+0.012*depan+0.04*dalam"), k(0.4),
    *_plus_cincin(0.5),
], L=[_L(IST["L"]), _L(_CINCIN_L[0], t=0.45)], ragu=True,
  cara="Telunjuk mengusap atas bibir (laki-laki), lalu 'memasang cincin' di jari manis kiri (menikah).")

S("ISTRI", "Istri", "Keluarga", [
    k(0, p="telinga+0.025*bawah+0.03*depan+0.01*luar", a="telunjuk", b="B21_PARUH", j="atas+0.2*dalam", tp="dalam+0.4*belakang", siku="bawah"),
    k(0.1), k(0.3, p="telinga+0.045*bawah+0.03*depan+0.01*luar"), k(0.4),
    *_plus_cincin(0.5),
], L=[_L(IST["L"]), _L(_CINCIN_L[0], t=0.45)], ragu=True,
  cara="Ibu jari & telunjuk mencubit cuping telinga (perempuan), lalu 'memasang cincin' di jari manis kiri (menikah).")

_R = [
    k(0, p=A(-0.015, -0.36, 1.24), a="telapak", b="1", j="depan+0.3*atas", tp="dalam"),
    k(0.15),
    k(0.55, p=A(-0.17, -0.36, 1.22), j="depan+0.3*atas+0.4*luar"),
    k(0.75),
]
_dua("CERAI", "Bercerai", "Keluarga", _R, wajah="sedih", ragu=True,
     cara="Dua telunjuk berdampingan di tengah, lalu ditarik berpisah ke kanan dan kiri, wajah sedih.")

# ── Rutinitas & frekuensi ──────────────────────────────────────────────────

S("SETIAP_HARI", "Setiap hari", "Waktu", [
    k(0, p="pipi+0.03*depan+0.02*luar", a="telunjuk", b="1", j="atas+0.3*depan", tp="dalam"),
    k(0.1), k(0.3, p="pipi+0.14*depan+0.04*luar", j="depan+0.4*atas"),
    k(0.42, p="pipi+0.03*depan+0.02*luar", j="atas+0.3*depan"),
    k(0.62, p="pipi+0.14*depan+0.04*luar", j="depan+0.4*atas"),
    k(0.74, p="pipi+0.03*depan+0.02*luar", j="atas+0.3*depan"),
    k(0.94, p="pipi+0.14*depan+0.04*luar", j="depan+0.4*atas"), k(1.05),
], gloss="SETIAP-HARI", ragu=True,
  cara="Telunjuk dari samping pipi didorong ke depan berulang tiga kali (hari demi hari) — pengulangan = 'setiap'.")

S("SELALU", "Selalu", "Waktu", [
    k(0, p=A(0.03, -0.30, 1.20), a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
    k(0.12),
    k(0.7, p=A(0.0, -0.50, 1.20)),
    k(0.85),
], L=[k(0, p=A(0.04, -0.30, 1.17), a="punggung", b="FLAT", j="depan+0.3*dalam", tp="bawah"),
      k(0.12), k(0.7, p=A(0.04, -0.42, 1.17)), k(0.85)], ragu=True,
  cara="Telapak kanan di atas punggung tangan kiri, keduanya meluncur lurus dan mantap ke depan tanpa putus.")

S("SERING", "Sering", "Waktu", [
    k(0, p=A(0.035, -0.32, 1.215), a="telunjuk", b="1", j="bawah+0.5*depan+0.3*dalam", tp="belakang"),
    *bolak(0.1, 0.1, 6, {"p": A(0.035, -0.32, 1.172)}, {"p": A(0.035, -0.32, 1.215)}),
    k(0.75, p=A(0.035, -0.32, 1.172)),
], L=[_L(L_ATAS)], ragu=True,
  cara="Ujung telunjuk kanan mengetuk telapak kiri cepat berulang-ulang.")

S("KADANG_KADANG", "Kadang-kadang", "Waktu", [
    k(0, p=A(0.035, -0.32, 1.23), a="telunjuk", b="1", j="bawah+0.5*depan+0.3*dalam", tp="belakang"),
    k(0.15), k(0.3, p=A(0.035, -0.32, 1.172)), k(0.45, p=A(0.035, -0.32, 1.23)),
    k(0.85), k(1.0, p=A(0.02, -0.34, 1.172)), k(1.15, p=A(0.02, -0.34, 1.23)), k(1.3),
], L=[_L(L_ATAS)], gloss="KADANG-KADANG", ragu=True,
  cara="Ujung telunjuk kanan mengetuk telapak kiri dua kali dengan jeda yang jelas di antaranya.")

S("JARANG", "Jarang", "Waktu", [
    k(0, p=A(0.035, -0.32, 1.25), a="telunjuk", b="1", j="bawah+0.5*depan+0.3*dalam", tp="belakang"),
    k(0.2), k(0.5, p=A(0.035, -0.32, 1.172)), k(0.65),
    k(1.05, p=A(-0.06, -0.38, 1.27), j="depan+0.3*atas"), k(1.2),
], L=[_L(L_ATAS)], kepala=GELENG, ragu=True,
  cara="Telunjuk kanan mengetuk telapak kiri SEKALI dengan pelan lalu menjauh, sambil menggeleng kecil.")

# ── Pakaian ────────────────────────────────────────────────────────────────

_R = [
    k(0, p="perut+0.11*luar+0.12*bawah+0.03*depan", a="telapak", b="FLAT", j="bawah+0.2*depan", tp="dalam+0.5*belakang"),
    k(0.12),
    k(0.55, p="perut+0.11*luar+0.02*bawah+0.03*depan"),
    k(0.7),
]
_dua("CELANA", "Celana", "Pakaian", _R, ragu=True,
     cara="Dua telapak di samping pinggul ditarik ke atas, seperti menaikkan celana.")

S("SEPATU", "Sepatu", "Pakaian", [
    k(0, p=A(-0.03, -0.42, 1.18), a="ujung", b="FLAT", j="belakang+0.3*bawah", tp="bawah"),
    k(0.12), k(0.5, p=A(0.03, -0.33, 1.17)), k(0.7),
], L=[k(0, p=A(0.04, -0.34, 1.16), a="telapak", b="C", j="depan+0.3*dalam", tp="dalam+0.5*bawah")], ragu=True,
  cara="Tangan kanan datar (kaki) didorong masuk ke tangan kiri bentuk C (sepatu), seperti memakai sepatu.")

S("TOPI", "Topi", "Pakaian", [
    k(0, p="dahi+0.08*depan+0.01*atas+0.02*luar", a="telunjuk", b="B21_PARUH", j="depan+0.6*dalam+0.3*atas", tp="bawah+0.5*dalam", siku="bawah"),
    k(0.12), k(0.45, p="dahi+0.05*depan+0.02*bawah+0.02*luar"), k(0.6, p="dahi+0.06*depan+0.02*bawah+0.02*luar"), k(0.75),
], ragu=True, cara="Ibu jari & telunjuk memegang 'pinggiran topi' di depan dahi lalu menariknya sedikit turun, seperti memakai topi.")

S("BATIK", "Batik", "Pakaian", [
    k(0, p=A(0.03, -0.33, 1.20), a="telunjuk", b="B21_PARUH", j="bawah+0.5*depan", tp="dalam+0.3*belakang"),
    *lingkar(0.12, 0.9, A(0.035, -0.32, 1.18), 0.025, "dalam", "depan", n=8, putaran=1.5),
    k(1.0),
], L=[_L(L_ATAS)], ragu=True,
  cara="Jari kanan seperti memegang canting, menggambar motif melengkung kecil di atas telapak kiri (kain).")

_R = [
    k(0, p="perut+0.08*luar+0.03*bawah+0.05*depan", a="telapak", b="S", j="dalam+0.3*bawah", tp="belakang+0.5*bawah"),
    k(0.12),
    k(0.35, p="perut+0.04*luar+0.03*bawah+0.07*depan", j="dalam+0.6*bawah", tp="belakang"),
    k(0.6, p="perut+0.02*luar+0.06*bawah+0.05*depan", j="bawah+0.4*dalam", tp="belakang+0.4*atas"),
    k(0.75),
]
_dua("SARUNG", "Sarung", "Pakaian", _R, ragu=True,
     cara="Dua kepalan di depan pinggang memegang kain lalu melipat-menggulungnya ke bawah, seperti mengikat sarung.")

_R = [
    k(0, p="pelipis+0.10*atas+0.03*luar+0.01*depan", a="telapak", b="FLAT", j="dalam+0.3*depan", tp="dalam+0.5*bawah"),
    k(0.12),
    k(0.5, p="pelipis+0.06*atas+0.015*luar+0.01*depan"),
    k(0.7),
]
_dua("PECI", "Peci / kopiah", "Pakaian", _R, ragu=True,
     cara="Dua telapak di sisi atas kepala bergerak turun sedikit, seperti memasang peci.")

_R = [
    k(0, p="dada+0.09*luar+0.06*atas+0.05*depan", a="telapak", b="S", j="dalam+0.3*bawah", tp="belakang", siku="bawah+0.3*luar"),
    k(0.12),
    k(0.55, p="dada+0.09*luar+0.12*bawah+0.04*depan"),
    k(0.7),
]
_dua("PAKAI", "Memakai (baju)", "Pakaian", _R, ragu=True,
     cara="Dua kepalan di dada atas ditarik turun ke perut, seperti mengenakan baju.")

# ── Sekolah & kampus ───────────────────────────────────────────────────────

_R = [
    k(0, p=A(-0.03, -0.42, 1.25), a="telapak", b="FLAT", j="atas+0.4*depan", tp="dalam"),
    k(0.12),
    k(0.4, p=A(-0.14, -0.38, 1.25)),
    k(0.75, p=A(-0.14, -0.26, 1.25), j="atas+0.1*depan", tp="dalam+0.3*depan"),
    k(0.9),
]
_dua("KELAS", "Kelas", "Sekolah", _R, ragu=True,
     cara="Dua telapak tegak dari depan bergerak ke samping lalu ke belakang, menggambarkan sebuah ruangan.")

S("UJIAN", "Ujian", "Sekolah", [
    k(0, p=A(0.0, -0.33, 1.21), a="telunjuk", b="1", j="bawah+0.5*depan+0.3*dalam", tp="belakang"),
    k(0.12),
    k(0.3, p=A(0.02, -0.33, 1.175)),
    k(0.55, p=A(0.07, -0.30, 1.20)),
    k(0.75),
], L=[_L(L_ATAS)], ragu=True,
  cara="Telunjuk kanan membuat tanda centang (✓) di atas telapak kiri, seperti memeriksa jawaban ujian.")

S("PR", "PR (pekerjaan rumah)", "Sekolah", [], ragu=True,
  cara="Umumnya dieja jari P-R; sebagian orang memakai RUMAH + TULIS.")

S("KULIAH", "Kuliah", "Sekolah", [
    k(0, p="dahi+0.09*atas+0.05*depan+0.04*luar", a="telapak", b="FLAT", j="dalam+0.3*depan", tp="bawah", siku="bawah+0.5*luar"),
    k(0.15),
    *bolak(0.35, 0.15, 4, {"p": "dahi+0.075*atas+0.03*depan+0.01*luar"}, {"p": "dahi+0.10*atas+0.03*depan+0.01*luar"}),
    k(0.95),
], ragu=True,
  cara="Telapak datar ditepukkan dua kali di atas kepala seperti topi toga (mahasiswa) — isyarat KULIAH berbeda-beda per daerah.")

_R = [
    k(0, p=A(-0.012, -0.36, 1.26), a="jari_telunjuk", b="1", j="dalam+0.3*atas", tp="belakang"),
    *bolak(0.12, 0.14, 4, {"p": A(-0.05, -0.36, 1.27)}, {"p": A(-0.012, -0.36, 1.26)}),
    k(0.7),
]
S("MATEMATIKA", "Matematika", "Sekolah", _R,
  L=[k(0, p=A(0.0, -0.37, 1.26), a="jari_telunjuk", b="1", j="atas+0.2*dalam", tp="depan")], ragu=True,
  cara="Telunjuk kanan mendatar dan telunjuk kiri tegak bersilang membentuk tanda tambah (+), diketuk dua kali.")

S("BAHASA_INGGRIS", "Bahasa Inggris", "Sekolah", [], gloss="INGGRIS", ragu=True,
  cara="Umumnya BAHASA + nama INGGRIS dieja jari I-N-G-G-R-I-S; isyarat untuk 'Inggris' bervariasi — tanyakan ke pengajar Tuli.")

# ── Olahraga ───────────────────────────────────────────────────────────────

S("OLAHRAGA", "Olahraga", "Olahraga", [
    k(0, p="bahu_kanan+0.12*depan+0.12*bawah", a="telapak", b="S", j="atas+0.3*dalam", tp="belakang+0.5*dalam"),
    *bolak(0.12, 0.18, 4, {"p": "bahu_kanan+0.10*depan+0.02*atas"}, {"p": "bahu_kanan+0.12*depan+0.12*bawah"}),
    k(0.85),
], L=_cermin([
    k(0, p="bahu_kanan+0.10*depan+0.02*atas", a="telapak", b="S", j="atas+0.3*dalam", tp="belakang+0.5*dalam"),
    *bolak(0.12, 0.18, 4, {"p": "bahu_kanan+0.12*depan+0.12*bawah"}, {"p": "bahu_kanan+0.10*depan+0.02*atas"}),
    k(0.85),
]), ragu=True,
  cara="Dua kepalan di depan bahu bergantian naik-turun seperti mengangkat beban.")

_A = {"p": "dada+0.13*luar+0.05*bawah+0.14*depan", "j": "atas+0.6*depan"}
_B = {"p": "dada+0.13*luar+0.12*bawah+0.0*depan", "j": "atas+0.3*belakang"}
S("LARI", "Lari", "Olahraga", [
    k(0, a="telapak", b="S", tp="dalam", **_A), *bolak(0.1, 0.16, 5, _B, _A), k(0.9),
], L=cermin([k(0, a="telapak", b="S", tp="dalam", **_B), *bolak(0.1, 0.16, 5, _A, _B), k(0.9)]), ragu=True,
  cara="Dua kepalan di samping badan berayun maju-mundur bergantian, seperti orang berlari.")

_R = [
    k(0, p="dada+0.02*luar+0.05*bawah+0.10*depan", a="ujung", b="FLAT", j="depan+0.2*dalam", tp="bawah+0.6*luar"),
    k(0.1),
    k(0.4, p="dada+0.03*luar+0.05*bawah+0.30*depan"),
    k(0.7, p="dada+0.22*luar+0.05*bawah+0.20*depan", j="depan+0.6*luar"),
    k(0.85),
]
_dua("RENANG", "Berenang", "Olahraga", _R,
     cara="Dua telapak dari depan dada didorong maju lalu dibuka ke samping, seperti gaya dada.")

_R = [
    k(0, p="dada+0.07*luar+0.05*depan+0.06*atas", a="telapak", b="B21_BOLA", j="atas+0.3*belakang", tp="atas+0.4*dalam"),
    k(0.15),
    k(0.4, p="dada+0.07*luar+0.30*depan+0.18*atas", j="atas+0.2*depan", tp="atas+0.4*dalam+0.3*depan"),
    k(0.6, p="dahi+0.08*atas+0.38*depan+0.07*luar", j="atas+0.5*depan", tp="depan+0.2*dalam"),
    k(0.75),
]
_dua("BASKET", "Bola basket", "Olahraga", _R, ragu=True,
     cara="Dua tangan seperti memegang bola di depan dada, lalu didorong ke atas-depan seperti menembak ke ring.")

S("MENANG", "Menang", "Olahraga", [
    k(0, p="dada_kanan+0.10*depan", a="telapak", b="S", j="atas", tp="dalam+0.3*belakang"),
    k(0.12),
    k(0.5, p="pelipis+0.20*atas+0.12*luar+0.10*depan"),
    *bolak(0.6, 0.12, 3, {"p": "pelipis+0.17*atas+0.12*luar+0.10*depan"}, {"p": "pelipis+0.20*atas+0.12*luar+0.10*depan"}),
    k(1.0),
], wajah="senang", ragu=True,
  cara="Kepalan diangkat tinggi ke atas kepala dan digoyang kecil, wajah gembira — seperti juara.")

S("KALAH", "Kalah", "Olahraga", [
    k(0, p=A(0.03, -0.33, 1.30), a="sisi_kelingking", b="FLAT", j="atas", tp="dalam"),
    k(0.15),
    k(0.55, p=A(0.04, -0.34, 1.19), j="dalam+0.3*depan", tp="bawah"),
    k(0.75),
], L=[_L(L_ATAS)], wajah="sedih", kepala=[(0.2, 0, 0, 0), (0.6, 8, 0, 0)], ragu=True,
  cara="Tangan kanan tegak (orang) roboh dan jatuh telentang ke telapak kiri, wajah kecewa.")

_R = [
    k(0, p="dada+0.07*luar+0.10*depan", a="telapak", b="S", j="atas+0.3*dalam", tp="belakang"),
    *bolak(0.1, 0.14, 5, {"p": "dada+0.07*luar+0.22*depan"}, {"p": "dada+0.07*luar+0.10*depan"}),
    k(0.85),
]
S("LATIHAN", "Latihan / berlatih", "Olahraga", _R, L=cermin([
    k(0, p="dada+0.07*luar+0.22*depan", a="telapak", b="S", j="atas+0.3*dalam", tp="belakang"),
    *bolak(0.1, 0.14, 5, {"p": "dada+0.07*luar+0.10*depan"}, {"p": "dada+0.07*luar+0.22*depan"}),
    k(0.85),
]), ragu=True,
  cara="Dua kepalan di depan dada bergantian didorong maju-mundur berulang — gerak yang diulang-ulang = berlatih.")

# ── Hewan ──────────────────────────────────────────────────────────────────

_A = {"p": "dada+0.08*luar+0.07*bawah+0.14*depan"}
_B = {"p": "dada+0.08*luar+0.07*bawah+0.24*depan"}
S("HEWAN", "Hewan / binatang", "Hewan", [
    k(0, a="ujung", b="CLAW", j="depan+0.6*bawah", tp="bawah", **_A), *bolak(0.1, 0.15, 5, _B, _A), k(0.9),
], L=cermin([k(0, a="ujung", b="CLAW", j="depan+0.6*bawah", tp="bawah", **_B), *bolak(0.1, 0.15, 5, _A, _B), k(0.9)]),
  ragu=True, cara="Dua tangan cakar menghadap bawah 'melangkah' bergantian ke depan, seperti kaki hewan berjalan.")

_R = [
    k(0, p="sudut_mulut+0.03*luar+0.015*depan", a="telunjuk", b="B21_PARUH", j="atas+0.6*luar", tp="depan+0.5*dalam"),
    *bolak(0.12, 0.16, 4, {"p": "sudut_mulut+0.11*luar+0.03*depan"}, {"p": "sudut_mulut+0.03*luar+0.015*depan"}),
    k(0.8, p="sudut_mulut+0.11*luar+0.03*depan"),
]
S("KUCING", "Kucing", "Hewan", _R, L=cermin(_R), ragu=True,
  cara="Ibu jari & telunjuk kedua tangan di samping mulut ditarik keluar dua kali, seperti kumis kucing.")

_A = {"p": "dada+0.06*luar+0.04*bawah+0.12*depan"}
_B = {"p": "dada+0.06*luar+0.08*bawah+0.13*depan"}
S("ANJING", "Anjing", "Hewan", [
    k(0, a="telapak", b="BENT_B", j="depan+0.6*bawah", tp="bawah+0.5*belakang", **_A), *bolak(0.1, 0.14, 4, _B, _A), k(0.75),
], L=cermin([k(0, a="telapak", b="BENT_B", j="depan+0.6*bawah", tp="bawah+0.5*belakang", **_A), *bolak(0.1, 0.14, 4, _B, _A), k(0.75)]),
  ragu=True, cara="Dua tangan menekuk di depan dada seperti kaki depan anjing yang 'meminta', digerakkan naik-turun kecil.")

S("AYAM", "Ayam", "Hewan", [
    k(0, p=A(0.03, -0.33, 1.23), a="telunjuk", b="B21_PARUH", j="bawah+0.4*depan", tp="dalam+0.3*belakang"),
    *bolak(0.1, 0.13, 6, {"p": A(0.035, -0.33, 1.175)}, {"p": A(0.03, -0.33, 1.23)}),
    k(0.85),
], L=[_L(L_ATAS)], ragu=True,
  cara="Ibu jari & telunjuk kanan (paruh) mematuk-matuk telapak kiri, seperti ayam makan.")

S("IKAN", "Ikan", "Hewan", [
    k(0, p="netral+0.04*atas+0.02*dalam", a="telapak", b="FLAT", j="depan+0.2*dalam", tp="dalam"),
    *bolak(0.08, 0.12, 7, {"putar": -25, "p": "netral+0.04*atas+0.02*dalam+0.05*depan"}, {"putar": 25, "p": "netral+0.04*atas+0.02*dalam+0.10*depan"}),
    k(0.95, putar=0, p="netral+0.04*atas+0.02*dalam+0.16*depan"),
], cara="Telapak datar tegak menyamping, ujung jari ke depan, berlenggok kiri-kanan sambil maju seperti ikan berenang.")

_R = [
    k(0, p="bahu_kanan+0.10*depan+0.02*bawah", a="pergelangan", b="FLAT", j="luar+0.3*depan", tp="bawah", siku="bawah"),
    *bolak(0.1, 0.15, 5, {"j": "luar+0.6*atas+0.3*depan", "tp": "bawah+0.5*luar"},
           {"j": "luar+0.5*bawah+0.3*depan", "tp": "bawah+0.5*dalam"}),
    k(0.9),
]
_dua("BURUNG", "Burung", "Hewan", _R, ragu=True,
     cara="Dua telapak di samping bahu dikepak-kepakkan naik-turun seperti sayap burung.")

_R = [
    k(0, p="pelipis+0.03*luar+0.01*depan", a="telapak", b="1", j="atas+0.5*luar", tp="dalam+0.2*depan", siku="bawah+0.5*luar"),
    k(0.12),
    *bolak(0.25, 0.18, 3, {"p": "pelipis+0.05*luar+0.03*atas+0.01*depan"}, {"p": "pelipis+0.03*luar+0.01*depan"}),
    k(0.85),
]
_dua("SAPI", "Sapi", "Hewan", _R, ragu=True,
     cara="Dua telunjuk di pelipis mencuat ke atas-samping seperti tanduk sapi.")

S("KAMBING", "Kambing", "Hewan", [
    k(0, p="dagu+0.015*depan", a="telunjuk", b="B21_PARUH", j="atas+0.6*dalam", tp="belakang+0.4*dalam"),
    k(0.1), k(0.35, p="dagu+0.07*bawah+0.03*depan"), k(0.45, p="dagu+0.015*depan"),
    k(0.7, p="dagu+0.07*bawah+0.03*depan"), k(0.8),
], ragu=True,
  cara="Ibu jari & telunjuk mencubit dagu lalu ditarik turun dua kali, seperti janggut kambing.")

# ── Perasaan lanjutan ──────────────────────────────────────────────────────

_R = [
    k(0, p="dada+0.05*luar+0.16*depan+0.05*atas", a="telapak", b="5", j="atas+0.3*dalam", tp="depan"),
    k(0.12),
    k(0.4, p="dada+0.05*luar+0.06*depan+0.07*atas"),
    *bolak(0.5, 0.07, 6, {"p": "dada+0.06*luar+0.06*depan+0.07*atas"}, {"p": "dada+0.04*luar+0.06*depan+0.07*atas"}),
    k(1.0),
]
_dua("TAKUT", "Takut", "Perasaan", _R, wajah="sedih", kepala=[(0.2, 0, 0, 0), (0.45, -6, 0, 0), (0.9, -6, 0, 0)], ragu=True,
     cara="Dua tangan terbuka ditarik mendekat ke dada lalu gemetar, badan sedikit mundur, wajah takut.")

S("BOSAN", "Bosan", "Perasaan", [
    k(0, p="dagu+0.06*bawah+0.05*depan", a="buku", b="S", j="dalam+0.5*atas", tp="atas+0.5*belakang", siku="bawah"),
    k(0.15),
    k(0.45, p="dagu+0.03*bawah+0.01*depan"),
    k(1.0),
], kepala=[(0.3, 0, 0, 0), (0.6, -4, 0, 10), (1.0, -4, 0, 10)], wajah="tidur", ragu=True,
  cara="Dagu ditopang kepalan tangan, kepala miring, mata sayu — wajah malas/bosan yang membawa makna.")

S("BANGGA", "Bangga", "Perasaan", [
    k(0, p="dada+0.012*depan+0.08*bawah", a="jempol", b="10", j="atas", tp="dalam+0.3*belakang"),
    k(0.12),
    k(0.55, p="dada+0.012*depan+0.07*atas"),
    k(0.75),
], kepala=[(0.2, 0, 0, 0), (0.6, -8, 0, 0)], wajah="senang", ragu=True,
  cara="Ibu jari (kepalan dengan jempol tegak) menyusur dada dari bawah ke atas, dada membusung, dagu sedikit terangkat.")

_A = {"b": "5"}
_B = {"b": "5_TEKUK"}
_R = [
    k(0, p="perut+0.05*luar+0.10*depan+0.04*atas", a="telapak", b="5", j="dalam+0.3*atas", tp="belakang"),
    *bolak(0.1, 0.08, 9, _B, _A), k(0.9),
]
_dua("GUGUP", "Gugup / grogi", "Perasaan", _R, wajah="sedih", ragu=True,
     cara="Dua tangan terbuka di depan perut, jari-jari bergetar cepat (perut 'mulas'), wajah tegang.")

_R = [
    k(0, p="dada+0.06*luar+0.15*depan+0.10*atas", a="telapak", b="S", j="atas", tp="depan+0.3*dalam"),
    k(0.15),
    k(0.3, p="dada+0.12*luar+0.18*depan+0.18*atas", b="5"),
    k(0.7),
]
_dua("KAGET", "Kaget / terkejut", "Perasaan", _R, wajah="ya_tidak",
     kepala=[(0.15, 0, 0, 0), (0.3, -8, 0, 0), (0.7, -6, 0, 0)], ragu=True,
     cara="Dua kepalan di depan badan tiba-tiba terbuka lebar ke atas-samping, mata membelalak, kepala tersentak ke belakang.")

S("KECEWA", "Kecewa", "Perasaan", [
    k(0, p="dada+0.012*depan+0.06*atas", a="telapak", b="FLAT", j="dalam+0.3*atas", tp="belakang"),
    k(0.15),
    k(0.65, p="perut+0.02*depan+0.05*bawah", j="dalam+0.3*bawah"),
    k(0.85),
], wajah="sedih", kepala=[(0.2, 0, 0, 0), (0.7, 8, 0, 0), (0.9, 8, 0, 0)], ragu=True,
  cara="Telapak di dada turun pelan ke perut (hati 'jatuh'), kepala tertunduk, wajah sedih.")

# ── Mengajak & menolak ─────────────────────────────────────────────────────

S("AYO", "Ayo", "Ajakan", [
    k(0, p="netral+0.08*atas+0.10*depan", a="telapak", b="FLAT", j="depan+0.4*atas", tp="atas"),
    *bolak(0.12, 0.14, 4, {"b": "BENT_B", "p": "netral+0.08*atas+0.06*depan"}, {"b": "FLAT", "p": "netral+0.08*atas+0.10*depan"}),
    k(0.75, b="BENT_B"),
], wajah="senang", ragu=True,
  cara="Telapak menghadap atas, jari-jari dilambaikan ke arah diri sendiri dua kali (memanggil), wajah antusias.")

S("IKUT", "Ikut", "Ajakan", [
    k(0, p=A(-0.05, -0.30, 1.24), a="telapak", b="1", j="atas+0.3*depan", tp="dalam"),
    k(0.12),
    k(0.65, p=A(-0.03, -0.45, 1.24)),
    k(0.8),
], L=[k(0, p=A(-0.02, -0.36, 1.24), a="telapak", b="1", j="atas+0.3*depan", tp="dalam"),
      k(0.12), k(0.65, p=A(0.0, -0.51, 1.24)), k(0.8)], ragu=True,
  cara="Telunjuk kanan tegak berada di belakang telunjuk kiri, lalu keduanya bergerak maju — yang kanan mengikuti yang kiri.")

_A = {"p": "dada+0.08*luar+0.14*depan+0.04*bawah", "j": "dalam+0.3*depan"}
_B = {"p": "dada+0.03*luar+0.14*depan+0.04*bawah", "j": "dalam+0.6*depan"}
S("SIBUK", "Sibuk", "Ajakan", [
    k(0, a="telapak", b="FLAT", tp="bawah", **_A), *bolak(0.1, 0.11, 7, _B, _A), k(0.9),
], L=cermin([k(0, a="telapak", b="FLAT", tp="bawah", **_B), *bolak(0.1, 0.11, 7, _A, _B), k(0.9)]), ragu=True,
  cara="Dua telapak menghadap bawah bergerak cepat bergantian ke kiri-kanan di depan badan, seperti banyak pekerjaan.")

_A = {"p": "dada+0.10*luar+0.16*depan+0.02*bawah"}
_B = {"p": "dada+0.10*luar+0.16*depan+0.08*bawah"}
S("MUNGKIN", "Mungkin", "Ajakan", [
    k(0, a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas", **_A), *bolak(0.1, 0.16, 4, _B, _A), k(0.8),
], L=cermin([k(0, a="telapak", b="FLAT", j="depan+0.3*dalam", tp="atas", **_B), *bolak(0.1, 0.16, 4, _A, _B), k(0.8)]),
  kepala=[(0.1, 0, 0, 0), (0.4, 0, 0, 8), (0.8, 0, 0, -6)], ragu=True,
  cara="Dua telapak menghadap atas naik-turun bergantian seperti timbangan, kepala sedikit miring — belum pasti.")

S("LAIN_KALI", "Lain kali", "Ajakan", [
    k(0, p="bahu_kanan+0.10*depan+0.02*bawah", a="telapak", b="FLAT", j="atas+0.2*depan", tp="depan"),
    k(0.12),
    k(0.6, p="bahu_kanan+0.30*depan+0.05*atas+0.04*luar", j="depan+0.6*atas", kurva=True),
    k(0.8),
], wajah="senang", kepala=[(0.2, 0, 0, 0), (0.5, 6, 0, 0), (0.8, 0, 0, 0)], gloss="LAIN-KALI", ragu=True,
  cara="Telapak di depan bahu didorong melengkung ke depan (ke waktu yang akan datang) sambil tersenyum dan mengangguk kecil — menolak dengan sopan.")

# ── Kalender ───────────────────────────────────────────────────────────────

S("BULAN", "Bulan (kalender)", "Waktu", [
    k(0, p="netral+0.30*atas+0.12*depan+0.03*luar", a="telunjuk", b="B21_PARUH", j="atas+0.4*depan", tp="dalam"),
    k(0.1),
    *lingkar(0.15, 0.7, "netral+0.24*atas+0.14*depan+0.05*luar", 0.06, "atas", "luar", n=6, mulai=90, putaran=-0.5),
    k(0.85),
], ragu=True,
  cara="Ibu jari & telunjuk menggambar bulan sabit di udara sambil bibir mengucapkan 'bulan'; isyarat 'bulan (kalender)' bisa berbeda per daerah.")

S("TAHUN", "Tahun", "Waktu",
  lingkar(0, 0.9, "netral+0.06*atas+0.06*depan", 0.06, "luar", "atas", n=10, mulai=-90,
          a="telunjuk", b="1", j="depan+0.4*atas", tp="bawah+0.3*dalam") + [k(1.05)], ragu=True,
  cara="Telunjuk menggambar satu lingkaran besar di depan badan (satu putaran = satu tahun) sambil bibir mengucapkan 'tahun'.")

S("TANGGAL", "Tanggal", "Waktu", [
    k(0, p=A(0.03, -0.33, 1.26), a="telunjuk", b="1", j="dalam+0.5*depan", tp="belakang"),
    k(0.12), k(0.3, p=A(0.03, -0.32, 1.225)), k(0.45, p=A(0.03, -0.33, 1.26)),
    k(0.6, p=A(0.035, -0.32, 1.19)), k(0.75),
], L=[_L(L_TEGAK)], ragu=True,
  cara="Telunjuk kanan menunjuk kotak-kotak di telapak kiri yang tegak, seperti menunjuk tanggal di kalender.")

# ── Ulang tahun & perayaan ─────────────────────────────────────────────────

S("ULANG_TAHUN", "Ulang tahun", "Perayaan", [
    k(0, p="dada+0.02*depan", a="telunjuk", b="1", j="belakang+0.3*bawah", tp="dalam"),
    k(0.12), k(0.25, p="dada+0.10*depan", j="atas+0.4*depan", tp="dalam"),
    *lingkar(0.3, 0.9, "netral+0.12*atas+0.06*depan", 0.05, "luar", "atas", n=8, mulai=-90),
    k(1.05),
], wajah="senang", gloss="ULANG-TAHUN", ragu=True,
  cara="Telunjuk menyentuh dada (aku), lalu berputar satu lingkaran ke depan (hari lahir berulang) — banyak variasi lokal.")

_R = [
    k(0, p="bahu_kanan+0.10*depan+0.08*atas+0.04*luar", a="telapak", b="5", j="atas", tp="depan"),
    *bolak(0.1, 0.12, 7, {"putar": -30}, {"putar": 25}),
    k(0.95, putar=0),
]
_dua("PESTA", "Pesta", "Perayaan", _R, wajah="senang", ragu=True,
     cara="Dua tangan terbuka diangkat di samping kepala dan digoyang-goyang di pergelangan, seperti bersorak gembira.")

_R = [
    k(0, p="dada+0.10*luar+0.10*depan", a="telapak", b="FLAT", j="depan", tp="dalam"),
    k(0.15),
    k(0.6, p="dada+0.10*luar+0.30*depan+0.02*atas"),
    k(0.8),
]
_dua("HADIAH", "Hadiah / kado", "Perayaan", _R, wajah="senang", ragu=True,
     cara="Dua telapak saling berhadapan seperti memegang kotak kado, lalu didorong ke depan (memberikan).")

S("KUE", "Kue", "Perayaan", [
    k(0, p=A(0.06, -0.27, 1.19), a="sisi_kelingking", b="FLAT", j="depan+0.3*dalam", tp="dalam"),
    k(0.1), k(0.35, p=A(0.03, -0.38, 1.18)), k(0.45, p=A(0.03, -0.27, 1.19)),
    k(0.7, p=A(0.0, -0.38, 1.18)), k(0.8),
], L=[_L(L_ATAS)], ragu=True,
  cara="Sisi kelingking tangan kanan 'memotong' di atas telapak kiri dua kali, seperti memotong kue.")

S("B21_TIUP_LILIN", "Tiup lilin", "Perayaan", [
    k(0, p="dagu+0.06*bawah+0.26*depan+0.04*luar", a="ujung", b="5", j="atas+0.3*dalam", tp="belakang+0.5*dalam", siku="bawah"),
    k(0.3),
    k(0.6, b="FLAT_O"),
    k(0.8),
], L=[k(0, p="dagu+0.12*bawah+0.24*depan", a="telunjuk", b="1", j="atas", tp="belakang+0.3*luar")],
  kepala=[(0.1, 0, 0, 0), (0.35, 6, 0, 0), (0.6, 0, 0, 0)], gloss="TIUP-LILIN", ragu=True,
  cara="Telunjuk kiri tegak di depan mulut (lilin), bibir meniup, lalu tangan kanan terbuka mengatup (api padam).")

# ── Jumlah ─────────────────────────────────────────────────────────────────

_R = [
    k(0, p="dada+0.04*luar+0.16*depan", a="telapak", b="S", j="atas+0.3*depan", tp="dalam+0.3*depan"),
    k(0.12),
    k(0.4, p="dada+0.16*luar+0.20*depan+0.05*atas", b="5", tp="depan+0.5*luar"),
    *bolak(0.5, 0.08, 4, {"b": "5_TEKUK"}, {"b": "5"}),
    k(0.9),
]
_dua("BANYAK", "Banyak", "Jumlah", _R, ragu=True,
     cara="Dua kepalan di depan badan membuka menjadi tangan 5 sambil bergerak ke samping, jari-jari bergerak-gerak.")

S("SEDIKIT", "Sedikit", "Jumlah", [
    k(0, p="netral+0.10*atas+0.05*depan", a="telunjuk", b="BENT_L", j="atas+0.3*dalam", tp="depan+0.6*dalam"),
    k(0.15),
    k(0.4, b="B21_PARUH"),
    *bolak(0.5, 0.1, 3, {"putar": -12}, {"putar": 12}),
    k(0.85, putar=0),
], kepala=[(0.2, 0, 0, 0), (0.45, 0, 0, 5)], ragu=True,
  cara="Ibu jari & telunjuk hampir bertemu (jarak kecil), mata sedikit menyipit — sedikit.")

S("SEMUA", "Semua", "Jumlah",
  lingkar(0, 0.85, "netral+0.06*atas+0.12*depan+0.04*dalam", 0.10, "luar", "depan", n=10, mulai=180,
          a="telapak", b="FLAT", j="depan+0.3*dalam", tp="bawah") + [k(1.0)], ragu=True,
  cara="Telapak datar menghadap bawah menyapu satu lingkaran mendatar di depan badan — mencakup semuanya.")

S("BEBERAPA", "Beberapa", "Jumlah", [
    k(0, p="netral+0.08*atas+0.04*depan", a="telapak", b="5", j="atas", tp="atas+0.5*belakang"),
    k(0.12),
    k(0.3, b="4"), k(0.48, b="W"), k(0.66, b="V"), k(0.84, b="1"), k(1.0),
], ragu=True,
  cara="Telapak menghadap atas, jari-jari dilipat satu per satu dari kelingking ke telunjuk, seperti menghitung beberapa.")

# ── Ukuran & bentuk ────────────────────────────────────────────────────────

_R = [
    k(0, p="dada+0.05*luar+0.18*depan", a="telapak", b="CLAW", j="depan+0.3*atas", tp="dalam"),
    k(0.12),
    k(0.55, p="dada+0.24*luar+0.18*depan+0.02*atas"),
    k(0.75),
]
_dua("BESAR", "Besar", "Ukuran", _R, kepala=[(0.2, 0, 0, 0), (0.55, -5, 0, 0)],
     cara="Dua tangan saling berhadapan di depan badan ditarik menjauh lebar ke samping, pipi menggembung.")

S("KECIL", "Kecil", "Ukuran", [
    k(0, p="dada+0.04*luar+0.12*depan+0.04*atas", a="telapak", b="B21_KECIL", j="atas", tp="depan+0.4*dalam"),
    *bolak(0.12, 0.13, 5, {"b": "5"}, {"b": "B21_KECIL"}),
    k(0.85),
], cara="Di depan dada, ujung ibu jari bertemu ujung jari manis (tiga jari lain tegak), lalu dijentikkan berulang.")

_R = [
    k(0, p="dada+0.03*luar+0.18*depan", a="telunjuk", b="1", j="depan+0.6*dalam", tp="bawah"),
    k(0.12),
    k(0.75, p="dada+0.32*luar+0.18*depan"),
    k(0.9),
]
_dua("PANJANG", "Panjang", "Ukuran", _R,
     cara="Dua telunjuk berdekatan di tengah lalu ditarik pelan menjauh ke kanan-kiri — makin jauh, makin panjang.")

S("BULAT", "Bulat", "Ukuran",
  lingkar(0, 0.85, "netral+0.08*atas+0.08*depan+0.02*dalam", 0.06, "luar", "atas", n=10, mulai=90,
          a="telunjuk", b="1", j="depan+0.5*atas", tp="bawah+0.4*dalam") + [k(1.0)],
  cara="Telunjuk menggambar lingkaran di udara di depan badan.")

S("FAVORIT", "Favorit / paling suka", "Perasaan", [
    k(0, p="dada+0.012*depan", a="punggung", b="10", j="dalam+0.3*atas", tp="belakang"),
    k(0.15),
    k(0.55, p="dada+0.20*depan+0.06*atas", j="atas+0.2*dalam", tp="dalam"),
    *bolak(0.6, 0.12, 2, {"p": "dada+0.20*depan+0.09*atas"}, {"p": "dada+0.20*depan+0.06*atas"}),
    k(0.95),
], wajah="senang", ragu=True,
  cara="Kepalan dengan jempol menempel di dada, lalu didorong ke depan dan jempol tegak diangkat kecil dua kali — 'nomor satu buatku'.")
