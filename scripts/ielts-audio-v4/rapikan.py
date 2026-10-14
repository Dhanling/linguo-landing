# Potong ekor tiap klip: berhenti 0.2 dtk sesudah kata terakhir (whisper) + fade-out 80 ms; cetak transkrip.
import sys, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
for f in sys.argv[1:]:
    x = np.frombuffer(subprocess.check_output(["ffmpeg","-loglevel","error","-i",f,"-ac","1","-ar","16000","-f","f32le","pipe:1"]), np.float32)
    segs,_ = m.transcribe(x, word_timestamps=True, condition_on_previous_text=False, language="en")
    ws = [w for s in segs for w in s.words]
    dur = len(x)/16000; end = min(dur, ws[-1].end + 0.2) if ws else dur
    out = f.rsplit(".",1)[0] + ".rapi.wav"
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f,"-af",f"atrim=0:{end:.3f},afade=t=out:st={max(0,end-0.08):.3f}:d=0.08","-ac","1","-ar","44100","-c:a","pcm_s16le",out],check=True)
    print(f"{f.split('/')[-1]} {dur:.2f}->{end:.2f} | {''.join(w.word for w in ws).strip()}", flush=True)
