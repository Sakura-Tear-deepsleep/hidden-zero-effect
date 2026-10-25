
import json, os, wave
import numpy as np
outdir = r"F:\deepseek harness\vibe-zero\audio"
w=wave.open(os.path.join(outdir,"bed.wav"),"rb"); sr=w.getframerate(); n=w.getnframes()
x=np.frombuffer(w.readframes(n),dtype=np.int16).astype(np.float32)/32768.0
dur=n/sr
hop=256; win=2048
nframes=1+(len(x)-win)//hop
freqs=np.fft.rfftfreq(win,1.0/sr); window=np.hanning(win).astype(np.float32)
mag=np.empty((nframes,len(freqs)),dtype=np.float32)
for i in range(nframes):
    mag[i]=np.abs(np.fft.rfft(x[i*hop:i*hop+win]*window))
bands=64; edges=np.logspace(np.log10(30),np.log10(10000),bands+1); bidx=np.searchsorted(freqs,edges)
mel=np.zeros((nframes,bands),dtype=np.float32)
for b in range(bands):
    lo,hi=bidx[b],max(bidx[b+1],bidx[b]+1); mel[:,b]=mag[:,lo:hi].mean(1)
logmel=np.log1p(mel*20)
flux=np.maximum(0,np.diff(logmel,axis=0,prepend=logmel[:1])).sum(1)
flux=(flux-flux.min())/(flux.max()-flux.min()+1e-9)
t=np.arange(nframes)*hop/sr
# peak pick
pk=[]
for i in range(1,nframes-1):
    if flux[i]>0.10 and flux[i]>=flux[i-1] and flux[i]>flux[i+1]:
        if pk and t[i]-t[pk[-1]]<0.18:
            if flux[i]>flux[pk[-1]]: pk[-1]=i
        else: pk.append(i)
tp=t[pk]
print("peaks",len(tp), tp[:12])
# grid search period & phase
best=None
for period in np.arange(0.505,0.575,0.0005):
    for ph in np.arange(0,period,0.005):
        g=np.round((tp-ph)/period)
        err=np.abs(tp-(ph+g*period))
        score=np.sum(np.exp(-(err/0.02)**2))
        if best is None or score>best[0]: best=(score,period,ph)
score,period,ph=best
warp = period
print("GRID period %.4f s (%.2f BPM) phase %.4f score %.1f"%(period,60/period,ph,score))
# align to flux mass: comb response
comb=np.zeros(nframes)
for k in range(int((dur-ph)/period)+1):
    tt=ph+k*period
    i=int(tt*sr/hop)
    if 0<=i<nframes: comb[i]+=flux[i]
print("comb mean on-grid", round(float(comb[comb>0].mean()),3), "vs global", round(float(flux.mean()),3))
# downbeat: among 4 beat phases, pick the one with most low-freq energy (bass/kick)
low = np.log1p(mag[:, :int(200/(sr/win))].sum(1))
sub=[]
for j in range(4):
    idxs=[int((ph+(k*4+j)*period)/period*0+ (ph+k*period*4+ j*period)*sr/hop) for k in range(int(dur/(period*4))+1)]
    idxs=[i for i in idxs if 0<=i<len(low)]
    sub.append(float(np.mean(low[idxs])) if idxs else 0)
print("phase energies(beat within bar):", [round(s,3) for s in sub])
jbest=int(np.argmax(sub))
print("downbeat phase", jbest)
bar=period*4
print("bar=%.4f  total bars=%.2f"%(bar, dur/bar))
# bar energy table
rows=[]
for k in range(int(dur/bar)+1):
    a=int((ph+jbest*period+k*bar)*sr); b=min(int(a+bar*sr),len(x))
    if a>=len(x) or b-a<100: break
    seg=x[a:b]; e=float(20*np.log10(np.sqrt(np.mean(seg**2))+1e-8))
    rows.append((k, round(ph+jbest*period+k*bar,2), round(e,1)))
print("BAR ENERGY (bar, start, dB):")
for r in rows: print(r)
json.dump({"period":float(period),"bpm":float(60/period),"phase":float(ph),"downbeat_offset":int(jbest),
  "bar":float(bar),"duration":float(dur),"bars":rows,
  "beat_times":[round(float(ph+k*period+jbest*period),4) for k in range(int((dur-ph)/period))]},
  open(os.path.join(outdir,"grid.json"),"w"), indent=1)
print("saved grid.json")
