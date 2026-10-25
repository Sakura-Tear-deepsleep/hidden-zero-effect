
// Coda - title. 148.30 -> 150.40
import { C, F, TAU, seg, segE, ease, text, line, withA } from '../engine.js';

export default {
  id: 'coda-title',
  start: 148.30,
  end: 150.40,
  draw(ctx, t, env, p) {
    const out = 1 - ease.inQuad(seg(t, 1.55, 2.10));
    ctx.save();
    ctx.globalAlpha = out;

    // a thin horizon that is always breathing
    const hy = 402 + Math.sin(t * 1.3) * 1.6;
    line(ctx, 380, hy, 900, hy, { color: withA(C.amber, 0.30), w: 1 });

    text(ctx, '隐藏零效应', 640, 372, {
      size: 62, family: F.serif, color: C.bone, align: 'center', tracking: 14,
      alpha: ease.outCubic(seg(t, 0.10, 1.05)),
      glow: 18, glowColor: withA(C.amber, 0.35),
      perChar: (i) => {
        const q = ease.outCubic(seg(t, 0.10 + i * 0.09, 0.85 + i * 0.09));
        return { alpha: q, dy: (1 - q) * 10 };
      },
    });
    text(ctx, 'THE HIDDEN ZERO EFFECT', 640, 430, {
      size: 10, family: F.mono, color: withA(C.bone2, 0.62), align: 'center', tracking: 6.4,
      alpha: ease.outCubic(seg(t, 0.75, 1.5)),
    });
    text(ctx, 'LIANG, GUO, XU, LIU, ZHANG & ZHOU 2026  ·  PSYCHON. BULL. REV. 33:157-173', 640, 470, {
      size: 8, family: F.mono, color: withA(C.steel, 0.55), align: 'center', tracking: 2.6,
      alpha: ease.outCubic(seg(t, 1.0, 1.7)) * 0.9,
    });
    // the dot that closes the film
    const dotA = ease.outCubic(seg(t, 1.1, 1.7));
    ctx.globalAlpha = out * dotA;
    ctx.fillStyle = C.amberHi;
    const ds = 2.2 + 0.5 * Math.sin(t * 6);
    ctx.beginPath(); ctx.arc(640, 516, ds, 0, TAU); ctx.fill();
    ctx.restore();
  },
};
