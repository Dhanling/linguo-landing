import json, hashlib, sys, math
src=open("gen.py").read()
exec(src.split("peta = {}")[0].replace('teks + ("。" if len(teks) == 1 else "")','teks'))
def datar(p):
    q=p[1:]; med=sorted(q)[len(q)//2]; q=[x for x in q if abs(x-med)<8]
    return max(q)-min(q), q
for teks in sys.argv[1:]:
    nama=hashlib.sha256(teks.encode()).hexdigest()[:16]+".mp3"; best=None
    for seed in (1,2,3,5,8,13):
        tts(teks, seed, "mentah.mp3"); rapikan("mentah.mp3", f"c{seed}.mp3")
        p=kontur(f"c{seed}.mp3")
        if not p: continue
        r,q=datar(p)
        print(teks, seed, f"{r:.1f}", " ".join(f"{x-q[0]:+.1f}" for x in q))
        if best is None or r<best[0]: best=(r,seed)
    import os; os.replace(f"c{best[1]}.mp3", f"out/{nama}"); print("pilih",teks,best)
