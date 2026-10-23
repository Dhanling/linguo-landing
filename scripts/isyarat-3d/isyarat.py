# [isyarat-3d-v1] Mesin pose isyarat: bentuk tangan, IK lengan analitik, solver
# ibu jari, titik tubuh, dan penulis keyframe. Dipakai tanda.py.
#
# Semua perhitungan di ruang armature (rig di origin tanpa transformasi):
# tokoh menghadap -Y, kanan tokoh = -X. Tangan dominan = kanan.

import bpy, math
from mathutils import Vector as V, Matrix, Quaternion, Euler

R2D = 180 / math.pi
D2R = math.pi / 180

ARAH = {
    "depan": V((0, -1, 0)), "belakang": V((0, 1, 0)), "atas": V((0, 0, 1)), "bawah": V((0, 0, -1)),
    "kiri": V((1, 0, 0)), "kanan": V((-1, 0, 0)),
}

def arah(spec, sisi):
    """'depan+atas' → vektor. 'dalam' = ke garis tengah badan, 'luar' = menjauhinya."""
    if isinstance(spec, V):
        return spec.normalized()
    if not isinstance(spec, str):
        v = V(spec)
        if sisi == "L": v.x = -v.x
        return v.normalized()
    v = V((0, 0, 0))
    for bag in spec.split("+"):
        bag = bag.strip()
        k = 1.0
        if "*" in bag:
            a, b = bag.split("*"); k = float(a); bag = b.strip()
        if bag == "dalam":
            v += V((1, 0, 0)) * k if sisi == "R" else V((-1, 0, 0)) * k
        elif bag == "luar":
            v += V((-1, 0, 0)) * k if sisi == "R" else V((1, 0, 0)) * k
        else:
            v += ARAH[bag] * k
    return v.normalized()

# ── Rig ─────────────────────────────────────────────────────────────────────

class Rig:
    def __init__(self, ob):
        self.ob = ob
        self.rest = {b.name: b.matrix_local.copy() for b in ob.data.bones}
        self.par = {b.name: (b.parent.name if b.parent else None) for b in ob.data.bones}
        self.panjang = {b.name: b.length for b in ob.data.bones}
        self.basis = {n: Matrix.Identity(4) for n in self.rest}
        self._pm = {}

    def reset(self):
        for n in self.basis: self.basis[n] = Matrix.Identity(4)
        self._pm = {}

    def set_basis(self, n, q):
        self.basis[n] = q.to_matrix().to_4x4() if isinstance(q, Quaternion) else q
        self._pm = {}

    def pm(self, n):
        if n in self._pm: return self._pm[n]
        p = self.par[n]
        if p is None:
            m = self.rest[n] @ self.basis[n]
        else:
            m = self.pm(p) @ self.rest[p].inverted() @ self.rest[n] @ self.basis[n]
        self._pm[n] = m
        return m

    def basis_dari_pose(self, n, M):
        """Basis lokal (rotasi) supaya matriks pose tulang n = M (ruang armature)."""
        p = self.par[n]
        acuan = self.pm(p) @ self.rest[p].inverted() @ self.rest[n] if p else self.rest[n]
        return (acuan.inverted() @ M).to_quaternion()

R = None  # Rig aktif (diisi tanda.py)

# ── Bentuk tangan ──────────────────────────────────────────────────────────
# Tiap jari: (mcp, pip, dip, renggang) derajat; renggang + = ke arah ibu jari.
# Ibu jari: dict sasaran untuk solver (lihat sasaran_jempol), atau sudut langsung.

LURUS = (0, 0, 0)
GENGGAM = (88, 100, 62)
KAIT = (15, 85, 70)          # X
TEKUK = (82, 0, 0)           # bent-B
CAKAR = (25, 55, 35)
LENGKUNG_C = (30, 45, 28)
LENGKUNG_O = (48, 62, 42)
PIPIH_O = (58, 18, 8)
SANTAI = (8, 10, 6)

RAPAT = {"index": -3.5, "middle": 0, "ring": 3.0, "pinky": 6.5}
RENGGANG = {"index": 9, "middle": 0, "ring": -7, "pinky": -14}

def _jari(fl, sp=None, **ganti):
    sp = sp or RAPAT
    d = {}
    for f in ("index", "middle", "ring", "pinky"):
        v = ganti.get(f, fl)
        d[f] = (v[0], v[1], v[2], v[3] if len(v) > 3 else sp[f])
    return d

BENTUK = {
    # nama: (jari, ibu_jari)
    "A":      (_jari(GENGGAM), "samping_tegak"),
    "S":      (_jari(GENGGAM), "depan_genggam"),
    "B":      (_jari(LURUS), "lipat_telapak"),
    "FLAT":   (_jari(LURUS), "rapat_telunjuk"),
    "5":      (_jari(LURUS, RENGGANG), "keluar"),
    "C":      (_jari(LENGKUNG_C), "C"),
    "O":      (_jari(LENGKUNG_O), ("ujung", "index")),
    "FLAT_O": (_jari(PIPIH_O), ("ujung", "middle")),
    "1":      (_jari(GENGGAM, index=LURUS), "depan_genggam_tengah"),
    "D":      (_jari(GENGGAM, index=LURUS, middle=(60, 70, 40)), ("ujung", "middle")),
    "L":      (_jari(GENGGAM, index=LURUS), "keluar_L"),
    "V":      (_jari(GENGGAM, index=(0, 0, 0, 10), middle=(0, 0, 0, -6)), "depan_genggam_manis"),
    "U":      (_jari(GENGGAM, index=(0, 0, 0, -3), middle=(0, 0, 0, 2)), "depan_genggam_manis"),
    "R":      (_jari(GENGGAM, index=(0, 0, 0, -9), middle=(0, 0, 0, 10)), "depan_genggam_manis"),
    "K":      (_jari(GENGGAM, index=(0, 0, 0, 6), middle=(45, 0, 0, -4)), ("ujung_tengah_pangkal", "middle")),
    "W":      (_jari(LURUS, RENGGANG, pinky=GENGGAM), ("ujung", "pinky")),
    "3":      (_jari(GENGGAM, index=(0, 0, 0, 10), middle=(0, 0, 0, -6)), "keluar"),
    "4":      (_jari(LURUS, RENGGANG), "lipat_telapak"),
    "Y":      (_jari(GENGGAM, pinky=(0, 0, 0, -18)), "keluar"),
    "I":      (_jari(GENGGAM, pinky=(0, 0, 0, -6)), "depan_genggam"),
    "ILY":    (_jari(GENGGAM, index=(0, 0, 0, 6), pinky=(0, 0, 0, -16)), "keluar"),
    "F":      (_jari(LURUS, RENGGANG, index=(42, 58, 36)), ("ujung", "index")),
    "X":      (_jari(GENGGAM, index=KAIT), "depan_genggam_tengah"),
    "E":      (_jari((70, 105, 75)), "lipat_bawah"),
    "G":      (_jari(GENGGAM, index=LURUS), "sejajar_telunjuk"),
    "H":      (_jari(GENGGAM, index=(0, 0, 0, -3), middle=(0, 0, 0, 2)), "depan_genggam_manis"),
    "M":      (_jari((80, 95, 50), pinky=GENGGAM), "selip_manis"),
    "N":      (_jari((80, 95, 50), ring=GENGGAM, pinky=GENGGAM), "selip_tengah"),
    "T":      (_jari(GENGGAM, index=(75, 90, 45)), "selip_telunjuk"),
    "6":      (_jari(LURUS, RENGGANG, pinky=(40, 55, 35)), ("ujung", "pinky")),
    "7":      (_jari(LURUS, RENGGANG, ring=(40, 55, 35)), ("ujung", "ring")),
    "8":      (_jari(LURUS, RENGGANG, middle=(40, 55, 35)), ("ujung", "middle")),
    "9":      (_jari(LURUS, RENGGANG, index=(42, 58, 36)), ("ujung", "index")),
    "10":     (_jari(GENGGAM), "tegak"),
    "OPEN_8": (_jari(LURUS, RENGGANG, middle=(48, 10, 5)), "keluar"),
    "BENT_B": (_jari(TEKUK), "rapat_telunjuk"),
    "BENT_V": (_jari(GENGGAM, index=(30, 80, 50, 10), middle=(30, 80, 50, -6)), "depan_genggam_manis"),
    "CLAW":   (_jari(CAKAR, RENGGANG), "cakar"),
    "BABY_O": (_jari(GENGGAM, index=(45, 60, 40)), ("ujung", "index")),
    "SANTAI": (_jari(SANTAI, {"index": 2, "middle": 0, "ring": -2, "pinky": -5}), "santai"),
    "BENT_L": (_jari(GENGGAM, index=(0, 70, 40)), "keluar_L"),
    "J":      (_jari(GENGGAM, pinky=(0, 0, 0, -6)), "depan_genggam"),
    "Z":      (_jari(GENGGAM, index=LURUS), "depan_genggam_tengah"),
    "P":      (_jari(GENGGAM, index=(0, 0, 0, 6), middle=(45, 0, 0, -4)), ("ujung_tengah_pangkal", "middle")),
    "Q":      (_jari(GENGGAM, index=LURUS), "sejajar_telunjuk"),
}

JARI = ("index", "middle", "ring", "pinky")

def sisi_t(sisi):  # +X = sisi ibu jari untuk tangan kanan
    return 1.0 if sisi == "R" else -1.0

def pasang_jari(sisi, jari):
    t = sisi_t(sisi)
    for f in JARI:
        mcp, pip, dip, sp = jari[f]
        R.set_basis(f"{f}1_{sisi}", Euler((mcp * D2R, 0, -sp * t * D2R), "XYZ").to_quaternion())
        R.set_basis(f"{f}2_{sisi}", Euler((pip * D2R, 0, 0), "XYZ").to_quaternion())
        R.set_basis(f"{f}3_{sisi}", Euler((dip * D2R, 0, 0), "XYZ").to_quaternion())

# ── Titik di tangan (koordinat lokal tulang hand) ───────────────────────────

def lokal_tangan(sisi, titik_pose):
    return R.pm(f"hand_{sisi}").inverted() @ titik_pose

def ujung(sisi, f, bantalan=True):
    """Ujung jari (bantalan = sisi telapak) di ruang armature."""
    n = f"{f}3_{sisi}" if f != "thumb" else f"thumb3_{sisi}"
    m = R.pm(n)
    L = R.panjang[n]
    r = 0.009
    return m @ V((0, L * 0.80, r * 0.85 if bantalan else 0))

def ruas(sisi, f, i, k=0.5, z=0.0):
    n = f"{f}{i}_{sisi}"
    return R.pm(n) @ V((0, R.panjang[n] * k, z))

# ── Solver ibu jari ─────────────────────────────────────────────────────────

BATAS_JEMPOL = [(-35, 80), (-45, 55), (-50, 70), (-10, 75), (-15, 85)]

def pasang_jempol(sisi, th):
    a1x, a1z, a1y, a2x, a3x = th
    R.set_basis(f"thumb1_{sisi}", Euler((a1x * D2R, a1y * D2R, a1z * D2R), "XYZ").to_quaternion())
    R.set_basis(f"thumb2_{sisi}", Euler((a2x * D2R, 0, 0), "XYZ").to_quaternion())
    R.set_basis(f"thumb3_{sisi}", Euler((a3x * D2R, 0, 0), "XYZ").to_quaternion())

def sasaran_jempol(sisi, kind):
    """Titik sasaran bantalan ibu jari (ruang armature) + bobot, untuk bentuk tertentu."""
    H = R.pm(f"hand_{sisi}")
    t = sisi_t(sisi)
    L = lambda x, y, z: H @ V((x * t, y, z))
    if isinstance(kind, tuple):
        jenis, f = kind
        if jenis == "ujung":
            return ujung(sisi, f) + (H.to_3x3() @ V((0.004 * t, 0, 0.002))), 1.0
        if jenis == "ujung_tengah_pangkal":
            return ruas(sisi, "middle", 1, 0.55, 0.012), 1.0
    return {
        "samping_tegak":       (L(0.036, 0.083, 0.004), 1.0),
        "tegak":               (L(0.045, 0.120, -0.004), 1.0),
        "depan_genggam":       (ruas(sisi, "middle", 2, 0.4, -0.012), 1.0),
        "depan_genggam_tengah": (ruas(sisi, "middle", 2, 0.5, -0.011), 1.0),
        "depan_genggam_manis": (ruas(sisi, "ring", 2, 0.5, -0.011), 1.0),
        "lipat_telapak":       (L(-0.012, 0.068, 0.030), 1.0),
        "lipat_bawah":         (L(-0.004, 0.072, 0.034), 1.0),
        "rapat_telunjuk":      (L(0.034, 0.090, 0.006), 1.0),
        "keluar":              (L(0.092, 0.088, 0.012), 0.6),
        "keluar_L":            (L(0.098, 0.060, 0.004), 0.6),
        "C":                   (L(0.020, 0.105, 0.072), 1.0),
        "cakar":               (L(0.070, 0.090, 0.040), 0.6),
        "santai":              (L(0.060, 0.080, 0.028), 0.4),
        "sejajar_telunjuk":    (L(0.030, 0.130, 0.012), 1.0),
        "selip_telunjuk":      (ruas(sisi, "index", 2, 0.2, 0.004), 1.0),
        "selip_tengah":        (ruas(sisi, "middle", 2, 0.1, 0.004) + H.to_3x3() @ V((0.006 * t, 0, 0)), 1.0),
        "selip_manis":         (ruas(sisi, "ring", 2, 0.1, 0.004) + H.to_3x3() @ V((0.006 * t, 0, 0)), 1.0),
    }[kind]

def _biaya_jempol(sisi, th, sasaran, bobot):
    pasang_jempol(sisi, th)
    p = ujung(sisi, "thumb")
    c = (p - sasaran).length_squared * 1e4 * bobot
    c += sum((a * D2R) ** 2 for a in th) * 0.002
    # Jangan menembus telapak: titik ruas ibu jari di dalam kotak telapak
    H = R.pm(f"hand_{sisi}").inverted()
    t = sisi_t(sisi)
    for i in (1, 2, 3):
        for k in (0.5, 1.0):
            q = H @ ruas(sisi, "thumb", i, k)
            if abs(q.x) < 0.040 and 0.0 < q.y < 0.095 and -0.012 < q.z < 0.024:
                c += (0.024 - q.z) ** 2 * 3e3
    # Jangan menembus jari yang menggenggam
    return c

_cache_jempol = {}

def solve_jempol(sisi, kind, kunci_bentuk):
    key = (sisi, kunci_bentuk)
    if key in _cache_jempol:
        pasang_jempol(sisi, _cache_jempol[key]); return _cache_jempol[key]
    sasaran, bobot = sasaran_jempol(sisi, kind)
    best = None
    for awal in ([20, 10, 10, 20, 20], [50, -10, 30, 30, 40], [0, 30, 0, 5, 5], [40, 20, 40, 50, 60], [-10, 40, -20, 10, 10]):
        th = list(awal)
        c = _biaya_jempol(sisi, th, sasaran, bobot)
        langkah = 16.0
        while langkah > 0.25:
            maju = False
            for i in range(5):
                for d in (langkah, -langkah):
                    uj = list(th)
                    uj[i] = max(BATAS_JEMPOL[i][0], min(BATAS_JEMPOL[i][1], uj[i] + d))
                    cu = _biaya_jempol(sisi, uj, sasaran, bobot)
                    if cu < c:
                        th, c, maju = uj, cu, True
            if not maju:
                langkah *= 0.5
        if best is None or c < best[1]:
            best = (th, c)
    _cache_jempol[key] = best[0]
    pasang_jempol(sisi, best[0])
    return best[0]

def pasang_bentuk(sisi, nama):
    jari, jempol = BENTUK[nama]
    pasang_jari(sisi, jari)
    if isinstance(jempol, (list, tuple)) and len(jempol) == 5 and all(isinstance(a, (int, float)) for a in jempol):
        pasang_jempol(sisi, jempol)
    else:
        solve_jempol(sisi, jempol, nama)

def sudut_bentuk(sisi, nama):
    """Semua sudut jari (urutan tetap) — untuk interpolasi antarbentuk."""
    jari, _ = BENTUK[nama]
    pasang_bentuk(sisi, nama)
    th = _cache_jempol.get((sisi, nama))
    if th is None:
        _, jp = BENTUK[nama]; th = list(jp)
    out = []
    for f in JARI: out += list(jari[f])
    return out + list(th)

def pasang_sudut(sisi, sd):
    jari = {}
    for i, f in enumerate(JARI):
        jari[f] = tuple(sd[i * 4:(i + 1) * 4])
    pasang_jari(sisi, jari)
    pasang_jempol(sisi, sd[16:21])

# ── Titik tubuh (ruang armature) ────────────────────────────────────────────

HC = V((0, -0.012, 1.615))

def muka(ux, uz, maju=0.010):
    """Titik di permukaan wajah: ux, uz koordinat satuan elipsoid kepala."""
    sx = 0.098 * (1.0 - 0.28 * max(0.0, -uz) ** 1.6)
    sy = 0.108 * (1.0 - 0.10 * max(0.0, -uz))
    uy = -math.sqrt(max(0.0, 1 - ux * ux - uz * uz))
    p = V((ux * sx, uy * sy, uz * 0.128)) + HC
    n = V((ux / sx, uy / sy, uz / 0.128)).normalized()
    return p + n * maju

TITIK = {
    "dahi":        lambda: muka(0.0, 0.55, 0.012),
    "pelipis":     lambda: muka(-0.62, 0.42, 0.012),
    "pelipis_kiri": lambda: muka(0.62, 0.42, 0.012),
    "mata":        lambda: muka(-0.37, 0.12, 0.03),
    "mata_kiri":   lambda: muka(0.37, 0.12, 0.03),
    "pipi_kiri":   lambda: muka(0.55, -0.30, 0.012),
    "rahang_kiri": lambda: muka(0.50, -0.62, 0.012),
    "hidung":      lambda: muka(0.0, -0.05, 0.03),
    "pipi":        lambda: muka(-0.55, -0.30, 0.012),
    "telinga":     lambda: HC + V((-0.110, -0.010, 0.0)),
    "mulut":       lambda: muka(0.0, -0.50, 0.012),
    "sudut_mulut": lambda: muka(-0.30, -0.50, 0.012),
    "dagu":        lambda: muka(0.0, -0.80, 0.014),
    "rahang":      lambda: muka(-0.50, -0.62, 0.012),
    "leher":       lambda: V((0, -0.070, 1.47)),
    "dada":        lambda: V((0, -0.135, 1.31)),
    "dada_kanan":  lambda: V((-0.075, -0.132, 1.32)),
    "dada_kiri":   lambda: V((0.075, -0.132, 1.32)),
    "bahu_kanan":  lambda: V((-0.150, -0.075, 1.40)),
    "bahu_kiri":   lambda: V((0.150, -0.075, 1.40)),
    "perut":       lambda: V((0, -0.145, 1.13)),
    "netral":      lambda: V((-0.06, -0.36, 1.24)),
    "netral_kiri": lambda: V((0.06, -0.36, 1.24)),
    "tengah":      lambda: V((0, -0.34, 1.24)),
    "samping":     lambda: V((-0.22, -0.30, 1.28)),
    "istirahat_R": lambda: V((-0.022, -0.215, 1.050)),
    "istirahat_L": lambda: V((0.022, -0.200, 1.032)),
    "eja":         lambda: V((-0.115, -0.31, 1.355)),
    "angka":       lambda: V((-0.125, -0.30, 1.375)),
}

def titik(spec, sisi="R"):
    """'dagu' | 'dagu+0.03*depan' | (x,y,z)."""
    if isinstance(spec, V):
        return spec.copy()
    if isinstance(spec, tuple) and len(spec) == 2 and isinstance(spec[0], (str, V, tuple)):
        # (dasar, offset absolut) atau (dasar, ["0.03*luar", …])
        base = titik(spec[0], sisi)
        if isinstance(spec[1], list):
            for b in spec[1]:
                kf, d = b.split("*")
                base = base + arah(d.strip(), sisi) * float(kf)
            return base
        return base + V(spec[1])
    if not isinstance(spec, str):
        v = V(spec)
        if sisi == "L": v.x = -v.x
        return v
    bag = spec.split("+")
    p = TITIK[bag[0].strip()]()
    for b in bag[1:]:
        k, d = b.split("*")
        p = p + arah(d.strip(), sisi) * float(k)
    return p

# ── Lengan: IK dua tulang + pilih putaran siku ──────────────────────────────

def matriks_tangan(jari_arah, telapak, sisi, putar=0.0):
    f = arah(jari_arah, sisi)
    n = arah(telapak, sisi)
    n = (n - f * n.dot(f))
    if n.length < 1e-4:
        n = V((0, -1, 0)) - f * f.y
    n.normalize()
    X = f.cross(n)
    M = Matrix((X, f, n)).transposed()
    if putar:
        M = M @ Matrix.Rotation(putar * D2R, 3, "Y")
    return M

def anchor_lokal(sisi, anchor):
    """Offset titik kontak dalam ruang lokal tulang hand (bentuk jari sudah terpasang)."""
    H = R.pm(f"hand_{sisi}")
    Hi = H.inverted()
    t = sisi_t(sisi)
    if anchor == "pergelangan": return V((0, 0, 0))
    if anchor == "telapak": return V((0, 0.050, 0.020))
    if anchor == "punggung": return V((0, 0.050, -0.020))
    if anchor == "buku": return V((0, 0.092, -0.012))
    if anchor == "sisi_telunjuk": return V((0.045 * t, 0.060, 0))
    if anchor == "sisi_kelingking": return V((-0.042 * t, 0.055, 0))
    if anchor == "tumit": return V((0, 0.010, 0.018))
    if anchor == "jari_telunjuk": return Hi @ ruas(sisi, "index", 2, 0.3, 0.0)
    if anchor == "jari_tengah": return Hi @ ruas(sisi, "middle", 2, 0.3, 0.0)
    if anchor == "jari_kelingking": return Hi @ ruas(sisi, "pinky", 1, 0.8, 0.0)
    if anchor in ("telunjuk", "middle_tip", "jempol", "kelingking", "tengah", "manis"):
        f = {"telunjuk": "index", "tengah": "middle", "manis": "ring", "kelingking": "pinky", "jempol": "thumb"}.get(anchor, "middle")
        return Hi @ ujung(sisi, f, bantalan=False)
    if anchor == "ujung":
        # rata-rata ujung jari yang paling lurus
        pts = []
        for f in JARI:
            pts.append((R.basis[f"{f}1_{sisi}"].to_quaternion().angle + R.basis[f"{f}2_{sisi}"].to_quaternion().angle, f))
        pts.sort()
        lurus = [f for a, f in pts if a < pts[0][0] + 0.35]
        acc = V((0, 0, 0))
        for f in lurus: acc += Hi @ ujung(sisi, f, bantalan=False)
        return acc / len(lurus)
    raise KeyError(anchor)

def ik_lengan(sisi, W, Mh, phi_prev=None, siku=None):
    """Pasang clavicle/upperarm/forearm/hand sehingga pergelangan di W dan
    orientasi tangan Mh. Mengembalikan sudut putar siku terpilih."""
    cl, ua, fa, hd = f"clavicle_{sisi}", f"upperarm_{sisi}", f"forearm_{sisi}", f"hand_{sisi}"
    acuan_u = R.pm(cl) @ R.rest[cl].inverted() @ R.rest[ua]
    S = acuan_u.translation.copy()
    L1, L2 = R.panjang[ua], R.panjang[fa]
    d = W - S
    dist = d.length
    dist = max(abs(L1 - L2) + 1e-3, min(L1 + L2 - 1e-4, dist))
    u = d.normalized()
    a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist)
    h = math.sqrt(max(0.0, L1 * L1 - a * a))
    Wn = S + u * dist
    # basis tegak lurus u: e1 = ke bawah, e2 = e1 × u
    turun = V((0, 0, -1))
    e1 = turun - u * turun.dot(u)
    if e1.length < 1e-3: e1 = V((0, 1, 0)) - u * u.y
    e1.normalize()
    e2 = u.cross(e1).normalized()
    t = sisi_t(sisi)
    Yh = Mh.col[1].to_3d() if False else V((Mh[0][1], Mh[1][1], Mh[2][1]))

    def siku_di(phi):
        r = e1 * math.cos(phi) + e2 * math.sin(phi)
        return S + u * a + r * h

    turun_luar = (V((0, 0, -1)) + V((-t * 0.45, 0.12, 0))).normalized()

    def biaya(phi):
        E = siku_di(phi)
        Yf = (Wn - E).normalized()
        r = (E - S - u * a)
        r = r.normalized() if r.length > 1e-6 else e1
        c = (1 - Yf.dot(Yh)) * 1.2                  # tekuk pergelangan
        c += (1 - r.dot(turun_luar)) * 0.9            # siku jatuh alami: ke bawah-luar
        luar = (E.x - S.x) * (-t)                    # + = siku ke luar badan
        c += max(0.0, -luar + 0.03) ** 2 * 400       # siku masuk ke badan
        c += max(0.0, E.z - S.z + 0.05) ** 2 * 260   # siku di atas bahu
        c += max(0.0, E.y - S.y - 0.10) ** 2 * 200   # siku terlalu mundur
        c += max(0.0, luar - 0.30) ** 2 * 120        # siku terlalu melebar
        if siku is not None:
            c += (1 - r.dot(arah(siku, sisi))) * 1.5
        if phi_prev is not None:
            dp = math.atan2(math.sin(phi - phi_prev), math.cos(phi - phi_prev))
            c += dp * dp * 0.8
        return c

    best = min((biaya(p * D2R), p * D2R) for p in range(-180, 180, 6))[1]
    lo, hi = best - 6 * D2R, best + 6 * D2R
    for _ in range(18):
        m1 = lo + (hi - lo) / 3; m2 = hi - (hi - lo) / 3
        if biaya(m1) < biaya(m2): hi = m2
        else: lo = m1
    phi = (lo + hi) / 2
    E = siku_di(phi)

    Yu = (E - S).normalized()
    Yf = (Wn - E).normalized()
    eng = Yu.cross(Yf)
    if eng.length < 1e-4:
        eng = Yu.cross(V((0, -1, 0)))
    eng.normalize()
    # Pastikan sumbu engsel searah X istirahat (tekuk siku = rotasi +X)
    Xu_rest = R.rest[ua].to_3x3() @ V((1, 0, 0))
    Xu = eng
    U = Matrix((Xu, Yu, Xu.cross(Yu))).transposed()
    F = Matrix((Xu, Yf, Xu.cross(Yf))).transposed()
    # Puntiran tangan dibagi: setengah ke lengan bawah
    rel = (F.inverted() @ Mh).to_quaternion()
    tw = 2 * math.atan2(rel.y, rel.w)
    tw = math.atan2(math.sin(tw), math.cos(tw))
    F = F @ Matrix.Rotation(tw * 0.55, 3, "Y")
    def m4(M3, p):
        M = M3.to_4x4(); M.translation = p; return M
    R.set_basis(ua, R.basis_dari_pose(ua, m4(U, S)))
    R.set_basis(fa, R.basis_dari_pose(fa, m4(F, E)))
    R.set_basis(hd, R.basis_dari_pose(hd, m4(Mh, Wn)))
    return phi

# ── Kepala & wajah ─────────────────────────────────────────────────────────

def pasang_kepala(angguk=0.0, geleng=0.0, miring=0.0):
    q = Euler((angguk * D2R * 0.6, geleng * D2R * 0.6, -miring * D2R * 0.6), "XYZ").to_quaternion()
    R.set_basis("head", q)
    R.set_basis("neck", Euler((angguk * D2R * 0.4, geleng * D2R * 0.4, -miring * D2R * 0.4), "XYZ").to_quaternion())

# ── Penulis keyframe ───────────────────────────────────────────────────────

_q_prev = {}

def terapkan(rig_ob, nama_tulang=None):
    """Salin basis ke pose bone (tanpa keyframe)."""
    for n in (nama_tulang or R.basis.keys()):
        b = rig_ob.pose.bones[n]
        b.rotation_mode = "QUATERNION"
        b.rotation_quaternion = R.basis[n].to_quaternion()

def tulis_kunci(rig_ob, nama_tulang, frame, awal=False):
    pb = rig_ob.pose.bones
    for n in nama_tulang:
        b = pb[n]
        b.rotation_mode = "QUATERNION"
        q = R.basis[n].to_quaternion()
        # Kontinuitas belahan kuaternion antar-frame (q dan -q = rotasi sama)
        prev = None if awal else _q_prev.get(n)
        if prev is not None and prev.dot(q) < 0:
            q.negate()
        _q_prev[n] = q.copy()
        b.rotation_quaternion = q
        b.keyframe_insert("rotation_quaternion", frame=frame, group=n)
