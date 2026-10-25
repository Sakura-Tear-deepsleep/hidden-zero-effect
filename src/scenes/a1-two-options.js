// A1 - 两个选项 / the two options of the real stimulus.  17.18 -> 31.39  (14.21s)
//   A : 100%  ->  ¥98    certain  - a warm bar filled all the way
//   B : 27%   ->  ¥367   only 27% has substance; the other 73% is a hole in the row
// Chinese labels carry the meaning; English is decoration only (<=13px).
import {
  C, F, TAU, clamp, lerp, seg, segE, smoothstep, ease, text, measureTracked, ring, donut, line,
  rect, glowDot, withA, hash1, hash2, mod, mulberry32, revealChars,
} from '../engine.js';
import { hud, coordGrid } from '../ui.js';

const X0 = 330, X1 = 900;          // probability axis  0% .. 100%
const SPAN = X1 - X0;              // 570
const YA = 250, YB = 440;          // row centres
const BH_A = 24, BH_B = 42;
const CUT = X0 + SPAN * 0.27;      // 483.9 : the 27% ends -> the cut edge
const LOCK = 11.255;               // bar line (local) : the cursor commits to B
const LBLX = 100;                  // Chinese label column

const KF = [[5.80, 0], [6.60, 0], [7.50, 1], [8.70, 1], [9.60, 0], [10.40, 0], [11.20, 1]];
function selAt(t) {
  if (t <= KF[0][0]) return 0;
  let v = 0;
  for (let i = 1; i < KF.length; i++) {
    const a = KF[i - 1], b = KF[i];
    if (t >= b[0]) { v = b[1]; continue; }
    v = lerp(a[1], b[1], ease.inOutCubic(seg(t, a[0], b[0])));
    break;
  }
  return v;
}

export default {
  id: 'A1-two-options',
  start: 17.18,
  end: 31.39,
  fadeIn: 0.30,
  fadeOut: 0.35,

  draw(ctx, t, env, p) {
    const T = env.t === undefined ? 17.18 + t : env.t;

    // ---------------- camera
    const cam = 1 + 0.042 * ease.inOutCubic(seg(t, 0, 14.21));
    const drx = -6 + 13 * ease.inOutQuad(seg(t, 0, 14.21)) + Math.sin(t * 0.27) * 1.5;
    const dry = -4 + 6 * ease.inOutQuad(seg(t, 0, 14.21)) + Math.sin(t * 0.19 + 1.2) * 2.2;
    ctx.save();
    ctx.translate(640, 360);
    ctx.scale(cam, cam);
    ctx.translate(-640 + drx, -360 + dry);

    // ---------------- L1 : instrument field
    coordGrid(ctx, t, env, { alpha: 0.45, step: 80, drift: 1.9, color: C.cyan });
    ghostZeros(ctx, t);

    // ---------------- ruler (event 1)
    const rulA = ease.outCubic(seg(t, 0.00, 0.60));
    if (rulA > 0) {
      line(ctx, X0, 150, X0 + SPAN * rulA, 150, { color: withA(C.bone, 0.22), w: 1 });
      for (let k = 0; k <= 20; k++) {
        const x = X0 + SPAN * k / 20;
        if (x > X0 + SPAN * rulA + 0.5) break;
        const big = k % 5 === 0;
        line(ctx, x, 150, x, 150 + (big ? 7 : 3.5), {
          color: withA(C.bone, (big ? 0.26 : 0.13) * rulA), w: 1,
        });
        if (big && k % 10 === 0) {
          text(ctx, String(k * 5), x, 141, {
            size: 11, family: F.mono, color: withA(C.bone2, 0.55), align: 'center', tracking: 1,
            alpha: rulA * (0.45 + 0.55 * Math.abs(Math.sin(t * 0.6 + k))),
          });
        }
      }
    }

    // ---------------- row A  (events 2, 3 : rails, fill)
    const rowAIn = ease.outCubic(seg(t, 0.00, 0.40));
    if (rowAIn > 0) {
      const bl = 0.5 + 0.5 * Math.sin(t * 0.9);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rg = ctx.createRadialGradient(560, YA, 10, 560, YA, 430);
      rg.addColorStop(0, withA(C.amber, (0.048 + 0.018 * bl) * rowAIn));
      rg.addColorStop(1, withA(C.amber, 0));
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.restore();
      drawRow(ctx, t, {
        y: YA, bh: BH_A, col: C.amber, colHi: C.amberHi,
        extX: X0 + SPAN * rowAIn,
        fillW: SPAN * ease.outQuint(seg(t, 0.05, 1.00)),
        pct: '100%', pctX: X1 - 14, tickA: rowAIn,
      });
    }
    // ---------------- row B  (event 4, 5 : rails, 27% fill)
    const rowBIn = ease.outCubic(seg(t, 1.90, 2.80));
    if (rowBIn > 0) {
      drawRow(ctx, t, {
        y: YB, bh: BH_B, col: C.cyan, colHi: C.cyanHi,
        extX: X0 + SPAN * rowBIn,
        fillW: SPAN * ease.outQuint(seg(t, 2.45, 3.55)) * 0.27,
        pct: '27%', pctX: CUT - 12, tickA: rowBIn,
      });
    }

    // ---------------- the hole (event 6)
    if (rowBIn > 0) {
      const holeIn = ease.outCubic(seg(t, 3.55, 4.55));
      if (holeIn > 0) {
        const hy = YB - BH_B / 2, hh = BH_B, hx0 = CUT, hw = X1 - CUT;
        ctx.save();
        const hg = ctx.createLinearGradient(0, hy, 0, hy + hh);
        hg.addColorStop(0, withA(C.void, 0.97 * holeIn));
        hg.addColorStop(0.55, withA(C.void, 0.93 * holeIn));
        hg.addColorStop(1, withA(C.void, 0.82 * holeIn));
        ctx.fillStyle = hg;
        ctx.fillRect(hx0, hy, hw, hh);
        // warm lip : light catches the upper inner edge of the slot (strengthened)
        const lg = ctx.createLinearGradient(hx0, 0, X1, 0);
        lg.addColorStop(0, withA(C.amberHi, 0.72 * holeIn));
        lg.addColorStop(0.30, withA(C.amber, 0.34 * holeIn));
        lg.addColorStop(1, withA(C.amberD, 0.0));
        ctx.fillStyle = lg;
        ctx.fillRect(hx0, hy, hw, 1.6);
        ctx.fillRect(hx0, hy + 1.6, hw, 4);
        // inner shadow under the lip
        const sg2 = ctx.createLinearGradient(0, hy, 0, hy + 11);
        sg2.addColorStop(0, withA(C.void, 0.6 * holeIn));
        sg2.addColorStop(1, withA(C.void, 0));
        ctx.fillStyle = sg2;
        ctx.fillRect(hx0, hy + 1, hw, 10);
        // light leaking down through the hole : 7 motes, always falling
        for (let k = 0; k < 7; k++) {
          const life = mod(t * 0.38 + hash1(k * 7.3) * 4.7, 1);
          const px = hx0 + 26 + (hw - 60) * hash1(k * 3.7 + 1.3) + Math.sin(t * 0.9 + k) * 2.5;
          const py = hy - 14 + life * (hh + 30);
          const aa = Math.sin(Math.PI * life) * 0.62 * holeIn;
          glowDot(ctx, px, py, 6.5, C.amberHi, aa * 0.5, true);
          ctx.save();
          ctx.globalAlpha = aa;
          ctx.fillStyle = C.amberHi;
          ctx.fillRect(px - 0.7, py - 0.7, 1.5, 1.5);
          ctx.restore();
        }
        ctx.restore();
      }
      // the 73% line, vermilion, on its own scrim (event 7)
      const labA = ease.outCubic(seg(t, 4.40, 5.30));
      if (labA > 0) {
        const s = '73% 的概率：0 元';
        const w = measureTracked(ctx, s, 32, F.serif, 400, 2);
        const bob = Math.sin(t * 1.1) * 1.2;
        const sgc = ctx.createLinearGradient(CUT - 30, 0, CUT + w + 30, 0);
        sgc.addColorStop(0, withA(C.void, 0));
        sgc.addColorStop(0.14, withA(C.void, 0.6 * labA));
        sgc.addColorStop(0.86, withA(C.void, 0.6 * labA));
        sgc.addColorStop(1, withA(C.void, 0));
        ctx.fillStyle = sgc;
        ctx.fillRect(CUT - 30, 358 + bob, w + 60, 52);
        text(ctx, s, CUT, 396 + bob, {
          size: 32, family: F.serif, weight: 400, color: C.vermHi, tracking: 2,
          alpha: labA, glow: 12, glowColor: withA(C.verm, 0.55),
        });
      }
      // dotted measure line through the emptiness
      const dIn = ease.outCubic(seg(t, 2.80, 3.80));
      if (dIn > 0) {
        ctx.save();
        ctx.setLineDash([1, 7]);
        ctx.strokeStyle = withA(C.bone, 0.30);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(CUT + 30, YB + BH_B / 2 + 11);
        ctx.lineTo(X0 + SPAN * rowBIn, YB + BH_B / 2 + 11);
        ctx.stroke();
        ctx.restore();
        line(ctx, X1, YB - 34, X1, YB + 16, { color: withA(C.steel, 0.6), w: 1, alpha: dIn });
        line(ctx, X1 - 4, YB - 34, X1, YB - 34, { color: withA(C.steel, 0.6), w: 1, alpha: dIn });
      }
    }

    // ---------------- Chinese labels for the two options
    const labIn = ease.outCubic(seg(t, 0.20, 0.90));
    const labIn2 = ease.outCubic(seg(t, 2.20, 2.90));
    const settle = 1 + 0.004 * Math.sin(t * 1.7);
    if (labIn > 0) {
      text(ctx, '选项 A', LBLX, 236, { size: 28, family: F.serif, color: withA(C.bone2, 0.95), tracking: 3, alpha: labIn });
      text(ctx, '稳拿 98 元', LBLX, 274, {
        size: 30, family: F.serif, color: C.bone, tracking: 2, alpha: labIn * settle,
        glow: 8, glowColor: withA(C.amber, 0.3),
      });
    }
    if (labIn2 > 0) {
      text(ctx, '选项 B', LBLX, 426, { size: 28, family: F.serif, color: withA(C.bone2, 0.95), tracking: 3, alpha: labIn2 });
      text(ctx, '27% 拿 367 元', LBLX, 464, {
        size: 30, family: F.serif, color: C.bone, tracking: 2, alpha: labIn2 * settle,
        glow: 8, glowColor: withA(C.cyan, 0.3),
      });
    }

    // ---------------- the payoffs (98 small / 367 big, event 8 : 367 zooms once more)
    const pa = ease.outCubic(seg(t, 1.10, 1.80));
    if (pa > 0) {
      const fl = Math.sin(t * 0.82) * 2.2;
      text(ctx, '¥98', 946, 272 + fl, {
        size: 64, family: F.latin, weight: 400, color: C.amberHi, tracking: -1,
        alpha: pa, glow: 12, glowColor: withA(C.amber, 0.45),
        perChar: (i) => {
          const q = ease.outCubic(seg(t, 1.10 + i * 0.1, 1.80 + i * 0.1));
          return { alpha: q, dy: (1 - q) * 14 };
        },
      });
    }
    const pb = ease.outCubic(seg(t, 2.80, 3.80));
    if (pb > 0) {
      const fl = Math.cos(t * 0.63) * 2.6;
      const hit = t > LOCK ? Math.exp(-(t - LOCK) * 3.0) : 0;
      const zoom = ease.outCubic(seg(t, 12.40, 12.90)) * (1 - ease.inOutCubic(seg(t, 13.30, 14.10)));
      const lk = 1 + 0.006 * Math.sin(t * 2.1) + 0.024 * hit + 0.11 * zoom;
      ctx.save();
      ctx.translate(1200, 500 + fl);
      ctx.scale(lk, lk);
      text(ctx, '¥367', 0, 0, {
        size: 140, family: F.latin, weight: 300, color: C.cyanHi, align: 'right', tracking: -3,
        alpha: pb, glow: 16 + 14 * zoom, glowColor: withA(C.cyan, 0.32 + 0.2 * zoom),
      });
      ctx.restore();
    }

    // ---------------- selection cursor (events 9, 10, 11)
    const selP = selAt(t);
    const selA = ease.outCubic(seg(t, 5.75, 6.50)) * (1 - 0.4 * ease.smooth(seg(t, 13.4, 14.1)));
    if (selA > 0.002) {
      const selY = lerp(YA, YB, selP);
      const moving = selP > 0.02 && selP < 0.98;
      const trem = Math.sin(t * 2.3) * 1.0 + Math.sin(t * 5.7) * 0.5;
      const y = selY + trem * (moving ? 2.4 : 0.9);
      const col = mixRGB(C.amber, C.cyan, selP);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(520, y);
      ctx.scale(1, 48 / 420);
      for (const [hx, w] of [[C.amber, 1 - selP], [C.cyan, selP]]) {
        if (w < 0.02) continue;
        const pg = ctx.createRadialGradient(0, 0, 10, 0, 0, 420);
        pg.addColorStop(0, withA(hx, 0.05 * selA * w));
        pg.addColorStop(0.55, withA(hx, 0.02 * selA * w));
        pg.addColorStop(1, withA(hx, 0));
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(0, 0, 420, 0, TAU); ctx.fill();
      }
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = selA * 0.95;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(72, y - 9); ctx.lineTo(82, y); ctx.lineTo(72, y + 9);
      ctx.stroke();
      ctx.restore();
      const bx0 = 74, bx1 = 922, hh = 48, LR = 22;
      line(ctx, bx0, y - hh, bx0 + LR, y - hh, { color: col, w: 1.3, alpha: selA * 0.5 });
      line(ctx, bx0, y - hh, bx0, y - hh + LR, { color: col, w: 1.3, alpha: selA * 0.5 });
      line(ctx, bx0, y + hh, bx0 + LR, y + hh, { color: col, w: 1.3, alpha: selA * 0.5 });
      line(ctx, bx0, y + hh, bx0, y + hh - LR, { color: col, w: 1.3, alpha: selA * 0.5 });
      line(ctx, bx1, y - hh, bx1 - LR, y - hh, { color: col, w: 1.3, alpha: selA * 0.35 });
      line(ctx, bx1, y - hh, bx1, y - hh + LR, { color: col, w: 1.3, alpha: selA * 0.35 });
      line(ctx, bx1, y + hh, bx1 - LR, y + hh, { color: col, w: 1.3, alpha: selA * 0.35 });
      line(ctx, bx1, y + hh, bx1, y + hh - LR, { color: col, w: 1.3, alpha: selA * 0.35 });
      if (t > LOCK - 0.01) {
        const hp = seg(t, LOCK - 0.01, LOCK + 0.05) * (1 - seg(t, LOCK + 0.09, LOCK + 0.36));
        for (let k = 0; k < 2; k++) {
          const lp = seg(t, LOCK + k * 0.22, LOCK + 0.72 + k * 0.22);
          if (lp > 0 && lp < 1) {
            ring(ctx, 922, y, 18 + 78 * ease.outCubic(lp), 0, TAU, {
              color: withA(C.cyan, 1), w: 1.1, alpha: (1 - lp) * 0.5 * selA,
            });
          }
        }
        if (hp > 0.002) {
          const fw = SPAN * 0.27;
          ctx.save();
          ctx.beginPath();
          ctx.rect(X0, YB - BH_B / 2, fw, BH_B);
          ctx.clip();
          ctx.globalAlpha = hp;
          ctx.fillStyle = withA(C.cyanHi, 0.34);
          ctx.fillRect(X0, YB - BH_B / 2, fw, BH_B);
          ctx.restore();
        }
      }
    }

    // ---------------- decoration : the study reference
    text(ctx, 'LIANG ET AL. 2026   PSYCHON. BULL. REV. 33:157-173', 1200, 96, {
      size: 11, family: F.mono, color: withA(C.steel, 0.9), align: 'right', tracking: 2.4,
      alpha: ease.outCubic(seg(t, 2.2, 3.0)) * 0.5,
    });

    ctx.restore();

    hud(ctx, T, env, {
      act: 1, code: 'HZ / 01', label: 'TWO OPTIONS', accent: C.amber,
      alpha: ease.outCubic(seg(t, 0.15, 0.95)) * 0.95,
    });
  },
};

// ------------------------------------------------------------------ helpers
function mixRGB(h1, h2, t) {
  const p = (h) => {
    const s = h.replace('#', '');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  const a = p(h1), b = p(h2);
  return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
}

function drawRow(ctx, t, o) {
  const y = o.y, bh = o.bh;
  const extX = o.extX;
  const fillW = Math.max(0, o.fillW);
  const ry0 = y - bh / 2 - 11, ry1 = y + bh / 2 + 11;

  if (extX > X0 + 1) {
    const solidEnd = Math.min(extX, X0 + fillW + 24);
    line(ctx, X0, ry0, solidEnd, ry0, { color: withA(o.col, 0.20), w: 1 });
    line(ctx, X0, ry1, solidEnd, ry1, { color: withA(o.col, 0.20), w: 1 });
  }
  for (let k = 1; k <= 10; k++) {
    const x = X0 + SPAN * k / 10;
    if (x > extX + 0.5) break;
    const big = k % 5 === 0;
    const inVoid = x > X0 + fillW + 1;
    line(ctx, x, ry1, x, ry1 + (big ? 7 : 4), {
      color: withA(C.bone, (inVoid ? 0.09 : 0.22) * o.tickA), w: 1,
    });
  }
  if (fillW > 0.6) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(X0, y - bh / 2, fillW, bh);
    ctx.clip();
    const g = ctx.createLinearGradient(X0, 0, X0 + SPAN, 0);
    g.addColorStop(0, withA(o.col, 0.80));
    g.addColorStop(0.5, withA(o.col, 0.96));
    g.addColorStop(1, withA(o.colHi, 1));
    ctx.fillStyle = g;
    ctx.fillRect(X0, y - bh / 2, fillW, bh);
    ctx.fillStyle = withA(C.white, 0.14);
    ctx.fillRect(X0, y - bh / 2, fillW, 1.6);
    const sh = mod(t * 82, SPAN + 360) - 180;
    const gs = ctx.createLinearGradient(X0 + sh - 100, 0, X0 + sh + 100, 0);
    gs.addColorStop(0, withA(C.white, 0));
    gs.addColorStop(0.5, withA(C.white, 0.11));
    gs.addColorStop(1, withA(C.white, 0));
    ctx.fillStyle = gs;
    ctx.fillRect(X0, y - bh / 2, fillW, bh);
    const q = ease.outCubic(seg(t, 1.2, 2.0));
    text(ctx, o.pct, o.pctX, y + 8, {
      size: 22, family: F.mono, color: C.void, alpha: 0.92 * q, align: 'right', tracking: 2,
    });
    ctx.restore();
    line(ctx, X0 + fillW, y - bh / 2 - 9, X0 + fillW, y + bh / 2 + 9, {
      color: o.colHi, w: 1.6, alpha: 0.92, glow: 12, glowColor: o.col,
    });
  }
}

function ghostZeros(ctx, t) {
  const rnd = mulberry32(20261024);
  for (let i = 0; i < 18; i++) {
    const bx = rnd() * 1500 - 110, by = rnd() * 860 - 70;
    const dz = 0.2 + rnd() * 0.9, ph = rnd() * TAU;
    const sz = 22 + rnd() * 70 * dz;
    const x = mod(bx + t * 4.2 * dz + Math.sin(t * 0.2 + ph) * 16, 1560) - 140;
    const yy = by + Math.sin(t * 0.34 + ph) * 14 * dz;
    const a = 0.016 + 0.022 * dz * (0.6 + 0.4 * Math.abs(Math.sin(t * 0.5 + ph)));
    text(ctx, '0', x, yy, { size: sz, family: F.latin, color: C.steel, alpha: a, align: 'center' });
  }
}