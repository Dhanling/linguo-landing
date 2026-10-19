# Sintesis kata Hanzi slide (ElevenLabs eleven_v4, suara Sarah) + gerbang kontur nada.
# Klip yang nadanya tak cocok dibuat ulang dengan seed lain (maks 4×), dipilih skor terbaik.
import json, hashlib, re, subprocess, urllib.request, math, os, sys
exec(open("nada.py").read().split("for p in sys.argv")[0])
env = open("/Users/muhamadlutfiramadhani/linguo-landing/.env.local").read()
KEY = re.search(r"^ELEVENLABS_API_KEY=(.*)$", env, re.M).group(1).strip().strip('"\'')
SARAH = "EXAVITQu4vr4xnSDxMaL"
kata = json.load(open("kata.json"))
os.makedirs("out", exist_ok=True)
def tts(teks, seed, f):
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{SARAH}?output_format=mp3_44100_128",
        data=json.dumps({"text": teks + ("。" if len(teks) == 1 else ""), "model_id": "eleven_v4", "language_code": "zh", "seed": seed,
                         "voice_settings": {"stability": 0.6, "similarity_boost": 0.8}}).encode(),
        headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    open(f, "wb").write(urllib.request.urlopen(req, timeout=60).read())
def rapikan(i, o):
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",i,"-af",
      "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=0.04,areverse,afade=t=in:d=0.01",
      "-ac","1","-ar","44100","-b:a","96k",o], check=True)
def kontur(p):
    v=[a for a in f0(p) if a]
    if len(v) < 6: return None
    st=[12*math.log2(a/100) for a in v]
    med=[sorted(st[max(0,i-2):i+3])[len(st[max(0,i-2):i+3])//2] for i in range(len(st))]
    m=[s for s,mm in zip(st,med) if abs(s-mm)<4]
    m=m[int(len(m)*.15):int(len(m)*.9)+1]
    return [m[int(i*(len(m)-1)/6)] for i in range(7)]
def skor(t, p):
    if p is None: return -9
    if t == 1: return 3.5 - (max(p) - min(p))
    if t == 2: return (p[-1] - min(p[:4])) - 3
    if t == 3: return (p[0] - min(p)) - 2
    if t == 4: return (max(p[:3]) - p[-1]) - 4
    return 1
peta = {}
for teks, t in kata.items():
    nama = hashlib.sha256(teks.encode()).hexdigest()[:16] + ".mp3"
    peta[teks] = nama
    if os.path.exists(f"out/{nama}"): continue
    terbaik = None
    for seed in (7, 21, 42, 99):
        tts(teks, seed, "mentah.mp3"); rapikan("mentah.mp3", f"c{seed}.mp3")
        p = kontur(f"c{seed}.mp3"); s = skor(t, p)
        if terbaik is None or s > terbaik[0]: terbaik = (s, seed, p)
        if s >= 0: break
    os.replace(f"c{terbaik[1]}.mp3", f"out/{nama}")
    print(f"{teks}\tnada {t}\tseed {terbaik[1]}\tskor {terbaik[0]:+.1f}\t" + (" ".join(f"{x-terbaik[2][0]:+.1f}" for x in terbaik[2]) if terbaik[2] else "-"), flush=True)
json.dump(peta, open("peta.json","w"), ensure_ascii=False)
