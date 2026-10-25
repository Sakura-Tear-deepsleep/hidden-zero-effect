
// A2 - 隐藏 / the frame is what cropped the zero. 31.39 -> 48.67
// r(t) is ONE continuous rect timeline : no state jumps, ever.
import { C, F, TAU, clamp, lerp, seg, segE, smoothstep, ease, text, measureTracked, ring, donut, line, poly, rect, glowDot, glowEllipse, tickRing, withA, hash1, hash2, mulberry32, mod } from '../engine.js';
import { hud } from '../ui.js';

const LX = 96;
const Y1L = 216, Y1 = 268;
const Y2L = 360, Y2 = 412;
const X2B = 548;

// the four crop states (left, top, right, bottom)
const FULL  = [0, 0, 1280, 720];
const LINE1 = [LX - 30, Y1L - 46, 900, Y1 + 46];
const LINE12= [LX - 30, Y1L - 46, 900, Y2 + 46];
const CUT   = [LX - 30, Y1L - 46, 740, Y2 + 46];
const WIDE  = [LX - 30, Y1L - 46, 1214, Y2 + 46];
// piecewise, shares the value at every joint -> C0 continuous by construction
const RKF = [
  [0.00, FULL], [2.60, FULL], [4.40, LINE1], [7.20, LINE1], [9.20, LINE12],
  [10.90, LINE12], [11.90, CUT], [12.90, CUT], [14.40, WIDE], [15.20, WIDE], [16.40, FULL],
];
function rectAt(t) {
  for (let i = 1; i < RKF.length; i++) {
    const a = RKF[i - 1], b = RKF[i];
    if (t < b[0]) {
      const span = Math.max(0.0001, b[0] - a[0]);
      const k = ease.inOutCubic(clamp((t - a[0]) / span));
      return a[1].map((v, j) => lerp(v, b[1][j], k));
    }
  }
  return FULL.slice();
}

export default {
  id: 'A2-erase',
  start: 31.39,
  end: 48.67,
  fadeIn: 0.30,
  fadeOut: 0.30,
  draw(ctx, t, env, p) {
    const T = env.t === undefined ? 31.39 + t : env.t;
    const r0 = rectAt(t);
    const isFull = r0[0] <= 0.6 && r0[1] <= 0.6 && r0[2] >= 1279.4 && r0[3] >= 719.4;
    const cropped = !isFull;
    const brA = 1.4 * seg(t, 2.6, 2.9) * (1 - seg(t, 15.4, 16.2));
    const breathe = Math.sin(t * 1.05) * brA;
    const x0 = r0[0] - breathe * 0.5, y0 = r0[1] - breathe;
    const x1 = r0[2] + breathe * 0.5, y1 = r0[3] + breathe;
    const gz = ease.outCubic(seg(t, 14.6, 15.7));
    const cutNow = t > 11.95 && t < 14.2;
    const pulse0 = seg(t, 5.40, 5.75) * (1 - seg(t, 5.95, 6.45)); // 5.4s : the zero lights up

    // outside ghost
    drawCopy(ctx, t, env, { alpha: cropped ? 0.20 : 1, glowZero: gz, pulse0 });
    if (cropped) {
      ctx.save();
      ctx.fillStyle = 'rgba(3,6,11,0.55)';
      ctx.beginPath();
      ctx.rect(0, 0, 1280, 720);
      ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y0); ctx.closePath();
      ctx.fill('evenodd');
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = withA('#1E5A66', 0.06); ctx.fillRect(0, 0, 1280, 720); ctx.restore();
      // 框外其实还写着 : the cropped words survive, dim but readable
      drawCopy(ctx, t, env, {
        alpha: 0.13 + 0.30 * (seg(t, 11.95, 12.15) * (1 - seg(t, 12.55, 13.10))),
        glowZero: gz, pulse0,
      });

      ctx.save();
      ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
      const ig = ctx.createLinearGradient(x0, y0, x1, y1);
      ig.addColorStop(0, withA('#2C1B0B', 0.30));
      ig.addColorStop(1, 'rgba(4,6,10,0)');
      ctx.fillStyle = ig; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const sw = 260;
      const sx = x0 - sw + mod(t * 230, (x1 - x0) + sw * 2);
      const shg = ctx.createLinearGradient(sx, y0, sx + sw, y1);
      shg.addColorStop(0, 'rgba(255,214,158,0)');
      shg.addColorStop(0.45, 'rgba(255,214,158,0.055)');
      shg.addColorStop(0.55, 'rgba(255,228,190,0.075)');
      shg.addColorStop(1, 'rgba(255,214,158,0)');
      ctx.fillStyle = shg; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      const by = y0 + mod(t * 26, y1 - y0);
      ctx.fillStyle = 'rgba(255,220,170,0.05)';
      ctx.fillRect(x0, by, x1 - x0, 1.4);
      ctx.restore();
      drawCopy(ctx, t, env, { alpha: 1 - 0.72 * gz, glowZero: gz, pulse0 });
      ctx.restore();

      const chA = ease.outCubic(seg(t, 2.6, 3.4)) * (1 - 0.92 * gz);
      ctx.save();
      ctx.globalAlpha = chA;
      ctx.strokeStyle = withA(C.amber, 0.55);
      ctx.lineWidth = 1.3;
      const L = 26;
      const cs = [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]];
      for (const [x, y, sx2, sy2] of cs) {
        ctx.beginPath(); ctx.moveTo(x + L * sx2, y); ctx.lineTo(x, y); ctx.lineTo(x, y + L * sy2); ctx.stroke();
      }
      ctx.restore();

      text(ctx, 'CROP  01', x0 + 10, y0 - 10, { size: 10, family: F.mono, color: withA(C.amber, 0.7), tracking: 3, alpha: chA });

      // the sentence edge IS the frame edge
      if (cutNow) {
        text(ctx, 'SENTENCE EDGE = FRAME EDGE', x1 - 10, y0 - 10, {
          size: 10, family: F.mono, color: withA(C.vermHi, 0.8), tracking: 2, align: 'right', alpha: chA,
        });
      } else {
        text(ctx, 'FRAME', x1 - 10, y0 - 10, { size: 10, family: F.mono, color: withA(C.amber, 0.75), tracking: 2, align: 'right', alpha: chA });
      }

      let hx = x1, hy = (y0 + y1) / 2, active = false;
      if (t > 2.0 && t < 4.8) { hx = x1; hy = (y0 + y1) / 2; active = true; }
      else if (t > 6.8 && t < 9.6) { hx = (x0 + x1) / 2; hy = y1; active = true; }
      else if (t > 11.7 && t < 14.3) { hx = x1; hy = (y0 + y1) / 2; active = true; }
      if (active) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 7.5);
        glowDot(ctx, hx, hy, 16 + 6 * pulse, C.amberHi, 0.22 + 0.14 * pulse, true);
        ctx.save(); ctx.strokeStyle = withA(C.amberHi, 0.9); ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(hx - 7, hy - 7); ctx.lineTo(hx + 7, hy - 7); ctx.lineTo(hx + 7, hy + 7); ctx.lineTo(hx - 7, hy + 7); ctx.closePath();
        ctx.stroke(); ctx.restore();
      }

      if (cutNow) {
        const ha = ease.outCubic(seg(t, 11.95, 12.35)) * (1 - seg(t, 13.5, 14.1));
        line(ctx, x1, y0 + 8, x1, y1 - 8, { color: C.verm, w: 1.4, alpha: 0.65 * ha, glow: 8 });
        text(ctx, '被框切掉了', x1 + 14, Y2 + 38, {
          size: 26, family: F.serif, weight: 400, color: C.vermHi, tracking: 2,
          alpha: ha, glow: 10, glowColor: withA(C.verm, 0.5),
        });
      }
    }

    // the giant zero finale
    if (gz > 0.01) {
      ctx.save();
      ctx.globalAlpha = 0.55 * gz;
      ctx.fillStyle = '#04060A'; ctx.fillRect(0, 0, 1280, 720);
      ctx.restore();
      const s = 1 + 0.05 * Math.sin(t * 1.1);
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t * 1.6));
      glowEllipse(ctx, 660, 340, 250 * s, 250 * s, C.amber, 0.06 * gz * pulse, 0);
      text(ctx, '0', 660, 372, {
        size: 300 * gz * s, family: F.latin, weight: 300, color: C.vermHi, align: 'center',
        alpha: gz, glow: 26 * gz, glowColor: withA(C.verm, 0.55),
      });
      text(ctx, '零一直都在', 660, 470, {
        size: 28, family: F.serif, weight: 400, color: C.bone, align: 'center', tracking: 3,
        alpha: gz * 0.95,
      });
      text(ctx, 'THE ZERO WAS THERE ALL ALONG', 660, 502, {
        size: 10, family: F.mono, color: withA(C.vermHi, 0.75), align: 'center', tracking: 4.4, alpha: gz,
      });
    }

    hud(ctx, T, env, { code: 'HZ / 02', label: 'HIDDEN  -  WHAT THE FRAME CROPS', accent: C.amber, alpha: 0.8 * ease.outCubic(seg(t, 0.5, 1.8)) });

  },
};

function drawCopy(ctx, t, env, o) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  const gz = o.glowZero || 0;
  const p0 = o.pulse0 || 0;
  if (a <= 0.002) return;
  const l1 = ease.outCubic(seg(t, 0.55, 1.7));
  if (l1 > 0.01) {
    // 28px Chinese label : what this writing leaves out
    text(ctx, '只告诉你赢的部分', LX, Y1L, {
      size: 28, family: F.serif, weight: 400, color: C.bone2, tracking: 2, alpha: a * l1,
    });
    text(ctx, 'HIDDEN', LX + 238 + 18, Y1L, {
      size: 10, family: F.mono, color: withA(C.steel, 0.8), tracking: 4, alpha: a * l1,
    });
    text(ctx, '27% 获得 367 元', LX, Y1, {
      size: 38, family: F.serif, color: C.bone, tracking: 5, alpha: a * l1,
      perChar: (i) => ({ alpha: ease.outCubic(seg(t, 0.55 + i * 0.05, 1.5 + i * 0.05)) }),
    });
  }
  const l2 = ease.outCubic(seg(t, 1.5, 2.7));
  if (l2 > 0.01) {
    text(ctx, '把输的部分也写出来', LX, Y2L, {
      size: 28, family: F.serif, weight: 400, color: C.bone2, tracking: 2, alpha: a * l2,
    });
    text(ctx, 'EXPLICIT', LX + 268 + 18, Y2L, {
      size: 10, family: F.mono, color: withA(C.steel, 0.8), tracking: 4, alpha: a * l2,
    });
    text(ctx, '27% 获得 367 元', LX, Y2, {
      size: 38, family: F.serif, color: C.bone, tracking: 5, alpha: a * l2,
      perChar: (i) => ({ alpha: ease.outCubic(seg(t, 1.5 + i * 0.05, 2.5 + i * 0.05)) }),
    });
    text(ctx, '73% 获得 0 元', X2B, Y2, {
      size: 38, family: F.serif, color: (gz > 0.3 || p0 > 0.2) ? C.vermHi : C.verm, tracking: 5,
      alpha: a * l2,
      glow: 16 * gz + 26 * p0, glowColor: withA(C.verm, 0.7),
      perChar: (i) => {
        const st = 2.0 + i * 0.06;
        return { alpha: ease.outCubic(seg(t, st, st + 0.9)) };
      },
    });
  }
  const dv = ease.outCubic(seg(t, 2.4, 3.4));
  if (dv > 0.01) line(ctx, LX, Y2 - 46, LX + 620 * dv, Y2 - 46, { color: withA(C.bone, 0.12), w: 1, alpha: a * dv });
}