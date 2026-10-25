
import subprocess, re, sys, json, os
FF = r"F:\deepseek harness\tools\ffmpeg\bin\ffmpeg.exe"
src = sys.argv[1] if len(sys.argv) > 1 else r"F:\deepseek harness\vibe-zero\out\the-hidden-zero.mp4"
p = subprocess.run([FF, "-hide_banner", "-v", "info", "-i", src, "-vf",
    "tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG",
    "-an", "-f", "null", "-"], capture_output=True, text=True, errors="ignore")
vals = [float(m) for m in re.findall(r"signalstats\.YAVG=([0-9.]+)", p.stderr)]
if not vals:
    print("NO DATA", p.stderr[-1500:]); sys.exit(1)
n = len(vals)
sm = sorted(vals)
import statistics
print("frames_compared", n)
print("mean_diff %.3f  median %.3f  p05 %.3f  min %.3f  max %.3f" % (statistics.mean(vals), sm[n//2], sm[int(n*0.05)], sm[0], sm[-1]))
dead = [(i+1, v) for i, v in enumerate(vals) if v < 0.30]
low  = [(i+1, v) for i, v in enumerate(vals) if v < 0.80]
print("dead(<0.30):", len(dead), dead[:20])
print("low(<0.80):", len(low), low[:30])
# longest run of dead
best = cur = 0; bestat = 0
for i, v in enumerate(vals):
    if v < 0.30:
        cur += 1
        if cur > best: best = cur; bestat = i - cur + 1
    else:
        cur = 0
print("longest_dead_run_frames", best, "at", bestat, "=> %.2f s" % (best/30.0))
json.dump({"n": n, "mean": statistics.mean(vals), "min": sm[0], "dead": dead[:200], "low": low[:400]},
          open(os.path.join(os.path.dirname(src), "qc_diff.json"), "w"))
