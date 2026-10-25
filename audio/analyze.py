
import sys, json, subprocess, os, wave
import numpy as np
FF = r"F:\deepseek harness\tools\ffmpeg\bin\ffmpeg.exe"
outdir = r"F:\deepseek harness\vibe-zero\audio"
wav = os.path.join(outdir, "bed.wav")
w = wave.open(wav, "rb"); sr = w.getframerate(); n = w.getnframes()
x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32)/32768.0
dur = n/sr
hop=512; win=2048
nframes = 1 + (len(x)-win)//hop
freqs = np.fft.rfftfreq(win, 1.0/sr); window=np.hanning(win).astype(np.float32)
S = np.empty((nframes,len(freqs)),dtype=np.float32)
for i in range(nframes):
    S[i] = np.abs(np.fft.rfft(x[i*hop:i*hop+win]*window))
bands=48; edges=np.logspace(np.log10(40),np.log10(8000),bands+1); bidx=np.searchsorted(freqs,edges)
mel=np.zeros((nframes,bands),dtype=np.float32)
for b in range(bands):
    lo,hi=bidx[b],max(bidx[b+1],bidx[b]+1); mel[:,b]=S[:,lo:hi].mean(axis=1)
logmel=np.log1p(mel*10)
flux=np.maximum(0,np.diff(logmel,axis=0,prepend=logmel[:1])).sum(axis=1); flux/= (flux.max()+1e-9)
tframe=np.arange(nframes)*hop/sr
cent=(S*freqs[None,:]).sum(1)/(S.sum(1)+1e-9)
rms_hop=int(sr*0.1); nrms=len(x)//rms_hop
rms=np.sqrt(np.mean(x[:nrms*rms_hop].reshape(nrms,rms_hop)**2,1)); trms=np.arange(nrms)*0.1
rms_f = np.interp(tframe, trms, rms)
F=np.stack([logmel.mean(1), cent/1000.0, np.log1p(rms_f*100)],1)
F=(F-F.mean(0))/(F.std(0)+1e-9)
K=16
Fk=np.array([F[i:i+K].mean(0) for i in range(nframes-K)])
def nov(i):
    a=Fk[max(0,i-K):i]; b=Fk[i:i+K]
    if len(a)<2 or len(b)<2: return 0.0
    return float(np.linalg.norm(a.mean(0)-b.mean(0)))
novs=[(round(tframe[i+K],2),round(nov(i),3)) for i in range(0,nframes-K,4)]
top=sorted(novs,key=lambda z:-z[1])[:40]
peaks=[]
for t,v in sorted(top,key=lambda z:z[0]):
    if v>0.45 and all(abs(t-p[0])>4 for p in peaks): peaks.append((t,v))
print("NOVELTY PEAKS:"); print(json.dumps(peaks))
# onset peaks for beat grid
bpm=112.35
print("BPM 112.35 -> beat", round(60/bpm,4), "bar(4/4)", round(4*60/bpm,4))
# per-2s table
twos=[]
for s in range(0,int(dur),2):
    a=int(s*sr); b=min(int((s+2)*sr),len(x)); seg=x[a:b]
    if len(seg)<100: break
    r=float(np.sqrt(np.mean(seg**2)))
    sp=np.abs(np.fft.rfft(seg*np.hanning(len(seg))))
    fr=np.fft.rfftfreq(len(seg),1.0/sr)
    c=float((sp*fr).sum()/(sp.sum()+1e-9))
    twos.append([s, round(20*np.log10(r+1e-8),1), round(c/1000,2)])
print("2s: sec,dB,centroidK")
for row in twos: print(row[0], row[1], row[2])
json.dump({"duration":dur,"bpm":bpm,"novelty_peaks":peaks,
  "flux":[round(float(v),4) for v in flux[::2]],
  "flux_dt":hop*2/sr,
  "rms_db":[[round(float(tframe[i]),2), round(float(20*np.log10(rms_f[i]+1e-8)),1)] for i in range(0,nframes,8)],
  "cent":[round(float(v),0) for v in cent[::8]],
  "twos":twos}, open(os.path.join(outdir,"analysis.json"),"w"), indent=1)
print("OK saved")
