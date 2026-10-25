
import numpy as np, os, sys
from PIL import Image
d = r"F:\deepseek harness\vibe-zero\frames"
N = len([f for f in os.listdir(d) if f.endswith('.jpg')])
print("frames", N)
prev = None
diffs = []
W = 640
for i in range(N):
    im = Image.open(os.path.join(d, "f%05d.jpg" % i)).convert("L").resize((W, 360), Image.BILINEAR)
    a = np.asarray(im, dtype=np.float32)
    if prev is not None:
        diffs.append(float(np.abs(a - prev).mean()))
    prev = a
diffs = np.array(diffs)
print("per-pixel mean-abs-diff over consecutive frames:")
print("  mean %.3f  median %.3f  p01 %.3f  min %.3f  max %.2f" % (diffs.mean(), np.median(diffs), np.percentile(diffs,1), diffs.min(), diffs.max()))
for th in (0.05, 0.15, 0.30, 0.60):
    print("  < %.2f : %d frames" % (th, (diffs < th).sum()))
best=cur=0;at=0
for i,v in enumerate(diffs):
    if v < 0.30:
        cur+=1
        if cur>best: best=cur; at=i-cur+2
    else: cur=0
print("longest run <0.30 : %d frames (%.2fs) at frame %d (%.2fs)" % (best, best/30, at, at/30))
best=cur=0;at=0
for i,v in enumerate(diffs):
    if v < 0.10:
        cur+=1
        if cur>best: best=cur; at=i-cur+2
    else: cur=0
print("longest run <0.10 : %d frames (%.2fs) at frame %d (%.2fs)" % (best, best/30, at, at/30))
idx = np.argsort(diffs)[:15]
print("lowest diffs:", [(round((i+1)/30.0,2), round(float(diffs[i]),3)) for i in idx])
