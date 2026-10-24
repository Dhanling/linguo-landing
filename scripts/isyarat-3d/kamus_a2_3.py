# [isyarat-asl-a1a2-v1] Kamus isyarat ASL A2.3 "Storytelling — Bercerita".
# Bentuk sitasi (Lifeprint/HandSpeak), tangan dominan kanan.
# ⚠️ Ditulis dari kamus umum — perlu dicek pengajar Tuli.
from kamus import S, k, A, lingkar, bolak, cermin, IST
import isyarat as I

_G = I.GENGGAM
I.BENTUK.update({
    # H/U bengkok (kaki duduk) untuk SIT
    "A23_BENT_H": (I._jari(_G, index=(20, 85, 50, -3), middle=(20, 85, 50, 2)), "depan_genggam_manis"),
    # V bengkok (kaki menekuk) untuk CL:V
    "A23_BENT_V": (I._jari(_G, index=(25, 70, 40, 10), middle=(25, 70, 40, -6)), "depan_genggam_manis"),
})

# Titik tangan kiri sebagai "pelampung" daftar (bentuk 3, telapak ke diri sendiri)
_DAFTAR = [k(0, p=A(0.07, -0.30, 1.24), a="pergelangan", b="3", j="atas+0.35*dalam", tp="belakang+0.3*dalam")]

# ── Penanda waktu ──────────────────────────────────────────────────────────

S("RECENTLY", "Baru-baru ini / tadi", "Waktu", [
    k(0, p="pipi+0.012*depan+0.01*bawah", a="telunjuk", b="X", j="atas+0.3*depan", tp="belakang+0.5*dalam"),
    *bolak(0.15, 0.15, 4, {"b": "1"}, {"b": "X"}),
    k(0.75),
], cara="Telunjuk bengkok (X) di pipi dekat dagu, ditekuk-luruskan kecil ke belakang dua kali.")

S("LONG_AGO", "Dahulu kala / lama sekali", "Waktu", [
    k(0, p="bahu_kanan+0.22*depan+0.08*atas+0.02*dalam", a="telapak", b="5", j="atas+0.3*depan", tp="belakang+0.3*dalam"),
    k(0.15),
    k(0.75, p="bahu_kanan+0.03*depan+0.15*atas+0.03*luar", j="atas+0.6*belakang", tp="belakang+0.4*bawah"),
    k(0.95),
], kepala=[(0.15, 0, 0, 0), (0.75, -6, 0, 0)],
  cara="Tangan terbuka di depan bahu bergerak melengkung ke belakang melewati bahu (masa lalu yang jauh).")

S("NOT_YET", "Belum", "Waktu", [
    k(0, p="perut+0.13*luar+0.07*depan+0.05*bawah", a="telapak", b="FLAT", j="bawah", tp="belakang+0.3*luar", siku="bawah+0.4*belakang"),
    *bolak(0.15, 0.16, 4, {"j": "bawah+0.7*belakang"}, {"j": "bawah"}),
    k(0.8),
], kepala=[(0.1, 0, 0, 0), (0.3, 0, 10, 0), (0.5, 0, -10, 0), (0.7, 0, 0, 0)],
  cara="Tangan datar di samping pinggang, telapak ke belakang, dikibas ke belakang dua kali; kepala menggeleng kecil.")

_SINCE = [
    k(0, p="bahu_kanan+0.10*depan+0.03*atas+0.02*dalam", a="telunjuk", b="1", j="belakang+0.5*atas", tp="dalam+0.3*atas"),
    k(0.15),
    k(0.65, p="netral+0.20*depan+0.04*luar+0.02*bawah", j="depan+0.2*atas", tp="atas+0.3*dalam"),
    k(0.85),
]
S("SINCE", "Sejak", "Waktu", _SINCE, L=cermin([dict(x, p=x["p"].replace("bahu_kanan", "bahu_kiri")) if "p" in x else x for x in _SINCE]),
  cara="Dua telunjuk mulai di bahu menunjuk ke belakang, lalu melengkung maju sampai menunjuk ke depan (dari dulu sampai sekarang).")

# ── Aspek verba ────────────────────────────────────────────────────────────

S("REGULARLY", "Secara rutin / teratur", "Waktu",
  lingkar(0, 1.2, A(0.005, -0.37, 1.255), 0.032, "depan", "atas", n=12, mulai=270, putaran=2,
          a="sisi_kelingking", b="1", j="depan+0.4*dalam", tp="dalam+0.3*bawah") + [k(1.35)],
  L=[k(0, p=A(0.02, -0.36, 1.21), a="sisi_telunjuk", b="1", j="depan+0.4*dalam", tp="dalam+0.3*atas")],
  cara="Dua telunjuk sejajar menunjuk ke depan; telunjuk kanan berputar maju dan mengusap telunjuk kiri berulang-ulang.")

S("WORK_CONT", "Bekerja terus-menerus", "Aspek",
  lingkar(0, 1.8, A(0.03, -0.335, 1.24), 0.035, "depan", "atas", n=15, mulai=270, putaran=3,
          a="telapak", b="S", j="dalam+0.6*depan", tp="bawah") + [k(1.95)],
  L=[k(0, p=A(0.045, -0.31, 1.175), a="punggung", b="S", j="dalam+0.6*depan", tp="bawah")],
  kepala=[(0.0, 0, 0, 0), (0.3, 5, 0, 0), (0.6, 0, 0, 0), (0.9, 5, 0, 0), (1.2, 0, 0, 0), (1.5, 5, 0, 0), (1.8, 0, 0, 0)],
  wajah="sedih", gloss="WORK++",
  cara="Isyarat WORK diulang dengan gerak melingkar lambat dan berat (kepalan kanan memutar & menyentuh kepalan kiri berkali-kali).")

def _study_cont():
    ks = lingkar(0, 1.8, A(0.04, -0.33, 1.255), 0.035, "depan", "atas", n=15, mulai=270, putaran=3,
                 a="ujung", b="5", j="bawah+0.6*depan+0.3*dalam", tp="belakang+0.3*bawah")
    for i, x in enumerate(ks):
        x["b"] = "5" if i % 2 == 0 else "5_TEKUK"
    return ks + [k(1.95, b="5")]

S("STUDY_CONT", "Belajar terus-menerus", "Aspek", _study_cont(),
  L=[k(0, p=A(0.04, -0.31, 1.165), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  kepala=[(0.0, 0, 0, 0), (0.45, 5, 0, 0), (0.9, 0, 0, 0), (1.35, 5, 0, 0), (1.8, 0, 0, 0)],
  wajah="sedih", gloss="STUDY++",
  cara="Isyarat STUDY (jari kanan bergetar mengarah ke telapak kiri) diulang dengan gerak melingkar lambat dan berat.")

# ── Daftar di tangan kiri ──────────────────────────────────────────────────

def _ketuk(nama, arti, anchor_kiri, cara):
    # Titik ujung jari kiri dicari dengan menaruh anchor jari itu di titik tetap.
    titik = A(0.055, -0.31, 1.345)
    L = [dict(_DAFTAR[0], p=titik, a=anchor_kiri), k(0.9)]
    S(nama, arti, "Urutan", [
        k(0, p=(titik, ["0.05*luar", "0.03*atas", "0.02*depan"]), a="telunjuk", b="1", j="dalam+0.3*atas+0.2*belakang", tp="bawah+0.3*belakang"),
        k(0.2),
        k(0.42, p=(titik, ["0.012*luar", "0.006*depan"])),
        k(0.62, p=(titik, ["0.06*luar", "0.02*atas", "0.03*depan"])),
        k(0.8),
    ], L=L, cara=cara)

_ketuk("FIRST", "Pertama (dalam daftar)", "jempol",
       "Tangan kiri menunjukkan jumlah hal (bentuk 3, telapak ke diri sendiri); telunjuk kanan menyentuh ibu jari kiri.")
_ketuk("SECOND", "Kedua (dalam daftar)", "telunjuk",
       "Tangan kiri tetap bentuk 3; telunjuk kanan menyentuh ujung telunjuk kiri.")
_ketuk("THIRD", "Ketiga (dalam daftar)", "tengah",
       "Tangan kiri tetap bentuk 3; telunjuk kanan menyentuh ujung jari tengah kiri.")

_UJ_I = A(0.035, -0.36, 1.27)
S("LAST", "Terakhir", "Urutan", [
    k(0, p=(_UJ_I, ["0.06*atas", "0.015*luar"]), a="kelingking", b="I", j="dalam+0.3*bawah", tp="bawah+0.3*belakang"),
    k(0.15),
    k(0.4, p=(_UJ_I, ["0.006*atas", "0.008*luar"])),
    k(0.6, p=(_UJ_I, ["0.08*bawah", "0.02*luar"])),
    k(0.78),
], L=[k(0, p=_UJ_I, a="kelingking", b="I", j="atas+0.6*depan+0.3*dalam", tp="dalam+0.3*belakang")],
  cara="Kelingking kanan (bentuk I) memukul turun melewati ujung kelingking kiri (bentuk I).")

# ── Kata penghubung ────────────────────────────────────────────────────────

S("BUT", "Tetapi", "Penghubung", [
    k(0, p=A(0.0, -0.36, 1.25), a="jari_telunjuk", b="1", j="atas+0.8*dalam", tp="depan+0.3*bawah"),
    k(0.15),
    k(0.55, p=A(-0.11, -0.36, 1.25), j="atas+0.4*dalam"),
    k(0.75),
], L=[k(0, p=A(0.0, -0.385, 1.25), a="jari_telunjuk", b="1", j="atas+0.8*dalam", tp="depan+0.3*bawah"),
      k(0.15), k(0.55, p=A(0.11, -0.385, 1.25), j="atas+0.4*dalam"), k(0.75)],
  cara="Dua telunjuk bersilang di depan dada, telapak ke depan, lalu ditarik berpisah ke samping.")

# Tangan kiri bentuk L: ibu jari ke atas, telunjuk ke depan (dipakai OR & THEN)
_L_KIRI = dict(p=A(0.045, -0.31, 1.22), a="pergelangan", b="L", j="depan+0.25*dalam", tp="dalam")
_JEMPOL_KIRI = A(0.04, -0.37, 1.30)    # perkiraan ujung ibu jari kiri (lihat render)
_TELUNJUK_KIRI = A(0.02, -0.43, 1.245)  # perkiraan ujung telunjuk kiri

S("OR", "Atau", "Penghubung", [
    k(0, p=(_JEMPOL_KIRI, ["0.012*atas", "0.01*luar"]), a="telunjuk", b="1", j="dalam+0.5*bawah", tp="bawah+0.3*belakang"),
    *bolak(0.2, 0.2, 4, {"p": (_TELUNJUK_KIRI, ["0.015*atas", "0.01*luar"])}, {"p": (_JEMPOL_KIRI, ["0.012*atas", "0.01*luar"])}),
    k(1.0),
], L=[k(0, **_L_KIRI)],
  cara="Tangan kiri bentuk L; telunjuk kanan menyentuh ujung ibu jari dan ujung telunjuk kiri bergantian (pilih ini atau itu).")

S("THEN", "Lalu / kemudian", "Penghubung", [
    k(0, p=(_JEMPOL_KIRI, ["0.012*atas", "0.01*luar", "0.02*belakang"]), a="telunjuk", b="1", j="dalam+0.5*bawah", tp="bawah+0.3*belakang"),
    k(0.15),
    k(0.4, p=(_JEMPOL_KIRI, ["0.05*atas", "0.03*depan", "0.01*luar"])),
    k(0.65, p=(_TELUNJUK_KIRI, ["0.012*atas", "0.01*luar"])),
    k(0.85),
], L=[k(0, **_L_KIRI)],
  cara="Tangan kiri bentuk L; telunjuk kanan melompat dari ibu jari kiri ke ujung telunjuk kiri (dari langkah satu ke berikutnya).")

S("BECAUSE", "Karena", "Penghubung", [
    k(0, p="dahi+0.02*luar+0.004*depan", a="telunjuk", b="1", j="dalam+0.4*atas+0.3*belakang", tp="belakang+0.3*bawah"),
    k(0.15),
    k(0.6, p="pelipis+0.10*luar+0.12*depan+0.12*bawah", a="telapak", b="10", j="atas+0.2*luar", tp="dalam"),
    k(0.8),
], cara="Telunjuk menyentuh dahi, lalu bergerak naik ke samping sambil berubah menjadi kepalan dengan ibu jari tegak.")

S("SUPPOSE", "Misalkan / kalau", "Penghubung", [
    k(0, p="pelipis+0.035*depan", a="kelingking", b="I", j="atas+0.4*dalam+0.3*depan", tp="belakang"),
    *bolak(0.15, 0.16, 4, {"p": "pelipis+0.008*depan"}, {"p": "pelipis+0.06*depan"}),
    k(0.78),
], wajah="ya_tidak",
  cara="Ujung kelingking (bentuk I) di pelipis, digerakkan maju dua kali kecil; alis naik.")

# ── Classifier & posisi tubuh ──────────────────────────────────────────────

S("CL_V", "CL:V — orang (kaki) bergerak", "Classifier", [
    k(0, p="netral+0.09*bawah+0.06*luar+0.04*belakang", a="ujung", b="V", j="bawah+0.15*depan", tp="belakang", siku="bawah+0.3*luar"),
    k(0.15),
    *bolak(0.3, 0.18, 5, {"b": "A23_BENT_V", "p": "netral+0.11*bawah+0.01*dalam+0.03*depan"},
           {"b": "V", "p": "netral+0.08*bawah+0.04*dalam+0.08*depan"}),
    k(1.25, b="V", p="netral+0.11*bawah+0.08*dalam+0.14*depan"),
], gloss="CL:V", cara="Bentuk V terbalik (dua jari = dua kaki) bergerak dalam ruang; jari bisa menekuk untuk melompat, jatuh, atau berjalan.")

S("CL_2", "CL:2 — dua orang berjalan bersama", "Classifier", [
    k(0, p="netral+0.03*atas+0.08*belakang", a="telapak", b="V", j="atas", tp="belakang+0.2*luar"),
    k(0.15),
    k(0.4, p="netral+0.05*atas+0.0*belakang"),
    k(0.65, p="netral+0.03*atas+0.07*depan"),
    k(0.9, p="netral+0.05*atas+0.14*depan"),
    k(1.05),
], gloss="CL:2", cara="Bentuk V tegak (dua jari = dua orang berdampingan) digerakkan maju dengan sedikit memantul.")

S("STAND", "Berdiri", "Classifier", [
    k(0, p=A(0.03, -0.32, 1.27), a="ujung", b="V", j="bawah+0.1*depan", tp="belakang", siku="bawah+0.3*luar"),
    k(0.15),
    k(0.5, p=A(0.03, -0.32, 1.185)),
    k(0.75),
], L=[k(0, p=A(0.04, -0.31, 1.16), a="telapak", b="FLAT", j="dalam+0.5*depan", tp="atas")],
  cara="Ujung dua jari bentuk V terbalik mendarat dan berdiri di atas telapak kiri.")

S("SIT", "Duduk", "Classifier", [
    k(0, p=A(0.02, -0.33, 1.27), a="jari_telunjuk", b="A23_BENT_H", j="dalam+0.6*depan", tp="bawah"),
    k(0.15),
    k(0.5, p=A(0.02, -0.33, 1.212)),
    k(0.75),
], L=[k(0, p=A(0.025, -0.33, 1.19), a="jari_telunjuk", b="H", j="dalam+0.6*depan", tp="bawah")],
  cara="Dua jari bengkok kanan (seperti kaki menekuk) ditaruh sekali di atas dua jari kiri yang mendatar (bentuk H).")

S("WALK", "Berjalan", "Classifier", [
    k(0, p="netral+0.07*bawah+0.02*luar", a="telapak", b="FLAT", j="depan", tp="bawah"),
    *bolak(0.1, 0.2, 5, {"p": "netral+0.07*bawah+0.02*luar+0.06*depan", "j": "depan+0.5*bawah"},
           {"p": "netral+0.04*bawah+0.02*luar+0.02*belakang", "j": "depan+0.3*atas"}),
    k(1.1),
], L=cermin([
    k(0, p="netral+0.04*bawah+0.02*luar+0.02*belakang", a="telapak", b="FLAT", j="depan+0.3*atas", tp="bawah"),
    *bolak(0.1, 0.2, 5, {"p": "netral+0.04*bawah+0.02*luar+0.02*belakang", "j": "depan+0.3*atas"},
           {"p": "netral+0.07*bawah+0.02*luar+0.06*depan", "j": "depan+0.5*bawah"}),
    k(1.1),
]), cara="Dua tangan datar menghadap bawah bergantian melangkah maju seperti telapak kaki.")

# ── Kata kerja berarah ─────────────────────────────────────────────────────

S("SHOW", "Menunjukkan", "Kata kerja", [
    k(0, p=A(0.06, -0.33, 1.26), a="telunjuk", b="1", j="dalam+0.2*depan", tp="bawah"),
    k(0.15),
    k(0.6, p=A(0.04, -0.47, 1.26)),
    k(0.8),
], L=[k(0, p=A(0.075, -0.33, 1.25), a="telapak", b="FLAT", j="atas", tp="dalam"),
      k(0.15), k(0.6, p=A(0.055, -0.47, 1.25)), k(0.8)],
  cara="Telunjuk kanan menempel di telapak kiri yang tegak; keduanya bergerak bersama ke arah orang yang diberi tahu.")

S("TELL", "Memberi tahu / bilang ke", "Kata kerja", [
    k(0, p="dagu+0.012*depan+0.005*bawah", a="telunjuk", b="1", j="atas+0.4*dalam", tp="belakang"),
    k(0.15),
    k(0.55, p="dagu+0.22*depan+0.10*bawah", j="depan+0.3*atas", tp="atas+0.3*dalam"),
    k(0.75),
], cara="Telunjuk mulai di dagu lalu berayun maju ke arah orang yang diberi tahu (arah gerak = kepada siapa).")

S("INFORM", "Memberi informasi / mengabarkan", "Kata kerja", [
    k(0, p="dahi+0.05*depan+0.03*luar", a="ujung", b="FLAT_O", j="atas+0.4*dalam", tp="belakang"),
    k(0.15),
    k(0.6, p="netral+0.20*depan+0.04*atas", a="telapak", b="5", j="depan+0.3*luar", tp="atas"),
    k(0.8),
], L=[k(0, p="netral_kiri+0.05*atas+0.04*depan", a="ujung", b="FLAT_O", j="atas+0.4*depan", tp="dalam+0.3*belakang"),
      k(0.15), k(0.6, p="netral_kiri+0.20*depan+0.0*atas", a="telapak", b="5", j="depan+0.3*luar", tp="atas"), k(0.8)],
  cara="Tangan kanan (O pipih) di dahi dan tangan kiri di depan dada, keduanya maju sambil membuka, telapak ke atas.")

S("LOOK_AT", "Memandang / melihat ke", "Kata kerja", [
    k(0, p="mata+0.10*depan+0.06*bawah+0.02*luar", a="ujung", b="V", j="depan+0.1*dalam", tp="bawah"),
    k(0.15),
    k(0.55, p="mata+0.26*depan+0.10*bawah+0.0*luar"),
    k(0.75),
], cara="Bentuk V (dua mata) di bawah mata, ujung jari menunjuk ke depan, digerakkan ke arah yang dipandang.")

# ── Cerita masa kecil ──────────────────────────────────────────────────────

S("GROW_UP", "Tumbuh besar / dibesarkan", "Cerita", [
    k(0, p="perut+0.22*depan+0.07*luar+0.04*bawah", a="telapak", b="FLAT", j="depan+0.4*dalam", tp="bawah"),
    k(0.15),
    k(0.8, p="dada+0.24*depan+0.13*luar+0.20*atas"),
    k(0.95),
], cara="Telapak datar menghadap bawah naik dari setinggi pinggang ke atas (tinggi badan bertambah).")

_YOUNG = [
    k(0, p="dada_kanan+0.05*bawah+0.008*depan", a="ujung", b="BENT_B", j="atas+0.2*dalam+0.4*belakang", tp="belakang+0.3*atas"),
    *bolak(0.15, 0.18, 4, {"p": "dada_kanan+0.04*atas+0.008*depan"}, {"p": "dada_kanan+0.05*bawah+0.008*depan"}),
    k(0.85),
]
S("YOUNG", "Muda", "Cerita", _YOUNG, L=cermin(_YOUNG), wajah="senang",
  cara="Ujung jari kedua tangan yang tertekuk mengusap dada atas ke atas dua kali.")

_JEMPOL_A = A(0.025, -0.33, 1.24)
S("REMEMBER", "Ingat", "Cerita", [
    k(0, p="dahi+0.03*luar+0.006*depan", a="jempol", b="10", j="atas+0.3*dalam", tp="dalam+0.4*belakang"),
    k(0.15),
    k(0.65, p=(_JEMPOL_A, ["0.008*atas"]), j="depan+0.6*bawah", tp="dalam"),
    k(0.85),
], L=[k(0, p=_JEMPOL_A, a="jempol", b="10", j="atas+0.2*belakang", tp="dalam")],
  cara="Ibu jari kepalan kanan menyentuh dahi, lalu turun dan menempel di ibu jari kepalan kiri.")

S("FORGET", "Lupa", "Cerita", [
    k(0, p="dahi+0.05*dalam+0.008*depan", a="telapak", b="FLAT", j="dalam+0.15*atas", tp="belakang"),
    k(0.12),
    k(0.5, p="pelipis+0.06*luar+0.04*depan", b="FLAT"),
    k(0.75, p="pelipis+0.12*luar+0.10*depan+0.10*bawah", b="10", j="atas+0.2*luar"),
    k(0.9),
], cara="Telapak mengusap dahi dari kiri ke kanan lalu menutup menjadi kepalan di samping kepala (ingatan terhapus).")

# ── Lucu & mengejutkan ─────────────────────────────────────────────────────

S("FUNNY", "Lucu", "Perasaan", [
    k(0, p="hidung+0.008*depan+0.01*atas", a="ujung", b="U", j="atas+0.5*dalam", tp="belakang"),
    *bolak(0.15, 0.16, 4, {"p": "hidung+0.04*depan+0.04*bawah", "j": "atas+0.3*dalam+0.4*depan"},
           {"p": "hidung+0.008*depan+0.01*atas", "j": "atas+0.5*dalam"}),
    k(0.8),
], wajah="senang", cara="Ujung telunjuk & jari tengah (bentuk U) mengusap ujung hidung ke bawah dua kali, wajah tersenyum.")

_SURPRISE = [
    k(0, p="mata+0.05*luar+0.03*depan", a="telunjuk", b="BABY_O", j="atas+0.4*dalam", tp="dalam+0.4*belakang"),
    k(0.15),
    k(0.4, p="mata+0.07*luar+0.05*depan+0.02*atas", b="L"),
    k(0.75),
]
S("SURPRISE", "Terkejut / kejutan", "Perasaan", _SURPRISE, L=cermin(_SURPRISE),
  kepala=[(0.15, 0, 0, 0), (0.4, -8, 0, 0), (0.75, -6, 0, 0)], wajah="ya_tidak",
  cara="Telunjuk & ibu jari kedua tangan yang mencubit di samping mata menjentik terbuka; mata melebar.")

S("WOW", "Wah! / wow", "Perasaan", [
    k(0, p="netral+0.05*atas+0.02*luar", a="pergelangan", b="5", j="atas+0.3*depan", tp="belakang+0.3*dalam"),
    *bolak(0.12, 0.11, 6, {"j": "depan+0.2*bawah+0.3*luar", "tp": "bawah"}, {"j": "atas+0.3*depan", "tp": "belakang+0.3*dalam"}),
    k(0.85),
], kepala=[(0.1, 0, 0, 0), (0.4, -6, 0, 4), (0.85, 0, 0, 0)], wajah="ya_tidak",
  cara="Tangan terbuka yang lemas dikibas-kibaskan dari pergelangan di depan dada, mulut membentuk 'wow'.")

_LAUGH = [
    k(0, p="mulut+0.035*luar+0.012*depan+0.006*bawah", a="telunjuk", b="L", j="atas+0.25*dalam", tp="belakang+0.3*dalam"),
    *bolak(0.15, 0.16, 4, {"p": "mulut+0.065*luar+0.05*atas+0.012*depan"}, {"p": "mulut+0.035*luar+0.012*depan+0.006*bawah"}),
    k(0.8),
]
S("LAUGH", "Tertawa", "Perasaan", _LAUGH, L=cermin(_LAUGH), wajah="senang",
  kepala=[(0.1, 0, 0, 0), (0.4, -6, 0, 0), (0.8, 0, 0, 0)],
  cara="Telunjuk kedua tangan bentuk L di sudut mulut, diusap naik ke pipi berulang kali, wajah tertawa.")

# ── Menggambarkan kejadian ─────────────────────────────────────────────────

_HAPPEN = [
    k(0, p="netral+0.04*luar+0.03*bawah", a="telunjuk", b="1", j="depan+0.3*dalam", tp="atas"),
    k(0.15),
    k(0.5, p="netral+0.04*luar+0.03*bawah+0.04*depan", tp="bawah"),
    k(0.7),
]
S("HAPPEN", "Terjadi", "Kejadian", _HAPPEN, L=cermin(_HAPPEN),
  cara="Dua telunjuk menunjuk ke depan dengan telapak ke atas, lalu diputar sehingga telapak menghadap bawah.")

_SUDDENLY = [
    k(0, p="netral+0.04*luar", a="telapak", b="S", j="atas+0.5*depan", tp="belakang"),
    k(0.2),
    k(0.32, p="netral+0.06*luar+0.07*depan", b="1", j="depan+0.4*atas+0.2*luar", tp="bawah+0.3*dalam"),
    k(0.6),
]
S("SUDDENLY", "Tiba-tiba", "Kejadian", _SUDDENLY, L=cermin(_SUDDENLY), wajah="ya_tidak",
  kepala=[(0.2, 0, 0, 0), (0.32, -6, 0, 0), (0.6, -4, 0, 0)],
  cara="Kepalan kedua tangan menjentikkan telunjuk keluar dengan cepat dan tajam, mata melebar.")

_FINALLY = [
    k(0, p="dada_kanan+0.12*depan+0.04*atas", a="kelingking", b="I", j="atas+0.2*dalam", tp="belakang"),
    k(0.2),
    k(0.45, p="dada_kanan+0.22*depan+0.06*bawah", j="depan+0.4*bawah", tp="bawah+0.4*dalam"),
    k(0.7),
]
S("FINALLY", "Akhirnya", "Kejadian", _FINALLY, L=cermin(_FINALLY),
  kepala=[(0.2, -4, 0, 0), (0.45, 8, 0, 0), (0.7, 4, 0, 0)],
  cara="Dua tangan bentuk I (kelingking tegak) di depan dada, dihentakkan sekali ke depan-bawah.")

S("SAY", "Berkata / bilang", "Kata kerja",
  lingkar(0, 0.5, "dagu+0.04*depan+0.01*atas", 0.018, "depan", "atas", n=6, mulai=180,
          a="telunjuk", b="1", j="atas+0.3*dalam+0.3*depan", tp="belakang+0.3*dalam") +
  [k(0.75, p="dagu+0.14*depan+0.02*bawah", j="atas+0.6*depan+0.2*dalam"), k(0.9)],
  cara="Telunjuk di depan mulut/dagu membuat putaran kecil ke depan, lalu sedikit maju.")
