# Kontur f0 kasar (autokorelasi) → 6 titik dalam semitone relatif median suara.
import subprocess, struct, sys, math
def f0(path):
    raw = subprocess.run(["ffmpeg","-loglevel","error","-i",path,"-ac","1","-ar","8000","-f","s16le","-"],capture_output=True).stdout
    x = struct.unpack(f"<{len(raw)//2}h", raw)
    N, H = 320, 80; out = []
    for s in range(0, len(x)-N-120, H):
        fr = x[s:s+N]; e = sum(v*v for v in fr)/N
        if e < 4e5: out.append(None); continue
        best, bl = 0, 0
        for lag in range(20, 101):
            c = sum(fr[i]*x[s+i+lag] for i in range(0, N, 2))
            if c > best: best, bl = c, lag
        out.append(8000/bl if best > 0.3*e*N/2 else None)
    return out
for p in sys.argv[1:]:
    v = [a for a in f0(p) if a]
    if len(v) < 4: print(p, "terlalu pendek"); continue
    # buang ujung, ambil 6 titik
    pts = [v[int(i*(len(v)-1)/5)] for i in range(6)]
    ref = sorted(v)[len(v)//2]
    print(f"{p:14s}", " ".join(f"{12*math.log2(a/ref):+5.1f}" for a in pts), f"| {len(v)*10}ms")
