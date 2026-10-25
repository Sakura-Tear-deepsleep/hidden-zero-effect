
// A6 - 归零 / the silence. 96.97 -> 103.19  (music drops out here)
import { C, F, TAU, clamp, lerp, seg, segE, ease, text, ring, donut, line, glowDot, glowEllipse, withA, hash1, mulberry32, mod } from '../engine.js';
import { hud, sideTitle } from '../ui.js';

export default {
  id: 'A6-zero',
  start: 96.97,
  end: 103.19,
  fadeIn: 0.30,
  fadeOut: 0.40,
  draw(ctx, t, env, p) {
    // ---- black veil comes up over everything
    const veil = ease.inOutQuad(seg(t, 0.0, 0.55));
    ctx.save();
    ctx.globalAlpha = 0.94 * veil;
    ctx.fillStyle = '#03050A';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();

    // a slow drifting haze so even the darkest beat keeps moving
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const hx = 520 + Math.sin(t * 0.21) * 190, hy = 300 + Math.cos(t * 0.17) * 120;
    const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 420);
    hg.addColorStop(0, withA('#173A45', 0.09 + 0.03 * Math.sin(t * 0.8)));
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();

    const CX = 660, CY = 330;
    // ---- the zero: a circle that draws itself, then grows
    const drawIn = ease.inOutCubic(seg(t, 0.12, 1.95));
    const R = lerp(74, 232, ease.inOutCubic(seg(t, 0.9, 4.6)));
    const lw = lerp(7.5, 2.6, seg(t, 1.4, 4.8));
    const rot = -Math.PI / 2 - 0.30 + t * 0.045;

    if (drawIn > 0.001) {
      // two counter-rotating arcs that meet
      const sweep = TAU * 0.5 * drawIn;
      const a0 = rot, a1 = rot + sweep;
      const b0 = rot + Math.PI, b1 = rot + Math.PI + sweep;
      ring(ctx, CX, CY, R, a0, a1, { color: withA(C.bone, 0.92), w: lw, glow: 16, glowColor: withA(C.amber, 0.5) });
      ring(ctx, CX, CY, R, b0, b1, { color: withA(C.bone, 0.92), w: lw, glow: 16, glowColor: withA(C.amber, 0.5) });
      // closing flash when the circle completes
      const close = seg(t, 2.0, 2.5) * (1 - seg(t, 2.5, 3.2));
      if (close > 0.01) glowEllipse(ctx, CX, CY, R * 1.9, R * 1.9, C.amberHi, 0.10 * close, 0);
    }

    // ---- inside the zero: a void with depth, clipped
    const insideA = seg(t, 2.6, 3.6);
    if (insideA > 0) {
      ctx.save();
      ctx.beginPath(); ctx.arc(CX, CY, R - lw * 1.6, 0, TAU); ctx.clip();
      // deep gradient
      const g = ctx.createRadialGradient(CX - R * 0.25, CY - R * 0.2, 0, CX, CY, R);
      g.addColorStop(0, withA('#0A141C', 0.9 * insideA));
      g.addColorStop(1, '#010204');
      ctx.fillStyle = g; ctx.fillRect(CX - R, CY - R, R * 2, R * 2);
      // slow parallax stars (they drift, never still)
      const rnd = mulberry32(4242);
      for (let i = 0; i < 90; i++) {
        const sx = rnd(), sy = rnd(), sz = 0.3 + rnd() * 0.9, ph = rnd() * TAU;
        const dx = mod(sx * 2 * R + t * 6 * sz, 2 * R);
        const dy = mod(sy * 2 * R - t * 2.2 * sz + Math.sin(t * 0.6 + ph) * 4, 2 * R);
        const a = insideA * (0.10 + 0.5 * sz) * (0.5 + 0.5 * Math.sin(t * 0.9 + ph));
        ctx.globalAlpha = a; ctx.fillStyle = i % 9 === 0 ? C.amberHi : C.bone;
        ctx.fillRect(CX - R + dx, CY - R + dy, 1 + sz, 1 + sz);
      }
      ctx.globalAlpha = 1;
      // faint inner rim light
      const rg = ctx.createRadialGradient(CX, CY, R * 0.72, CX, CY, R);
      rg.addColorStop(0, withA(C.amber, 0));
      rg.addColorStop(1, withA(C.amber, 0.10 * insideA));
      ctx.fillStyle = rg; ctx.fillRect(CX - R, CY - R, R * 2, R * 2);
      ctx.restore();
    }

    // ---- two lines
    const L1 = ease.outCubic(seg(t, 2.9, 4.0));
    if (L1 > 0) {
      text(ctx, '0', 96, 520, { size: 96, family: F.latin, weight: 300, color: withA(C.bone, 0.9 * L1), glow: 16, glowColor: withA(C.amber, 0.4) });
      text(ctx, 'ZERO', 200, 500, { size: 12, family: F.mono, color: withA(C.steel, 0.8 * L1), tracking: 5 });
      text(ctx, 'NOT NOTHING', 200, 520, { size: 12, family: F.mono, color: withA(C.steel, 0.65 * L1), tracking: 5 });
    }

    // ---- the vertical hairline that will become A7's tablet column
    const drop = ease.inOutCubic(seg(t, 5.35, 6.10));
    if (drop > 0) {
      line(ctx, CX, CY + R + 6, CX, lerp(CY + R + 6, 760, drop), { color: withA(C.amber, 0.35), w: 1, alpha: 0.8 });
      glowDot(ctx, CX, CY + R + 6, 4, C.amberHi, 0.8 * drop, true);
    }

    hud(ctx, t, env, { code: 'HZ / 06', label: 'SILENCE  ·  ZERO AS A PLACE', accent: C.bone2, alpha: 0.55 * ease.outCubic(seg(t, 0.6, 1.6)) });
    sideTitle(ctx, t, env, '归零', { x: 46, y: 214, step: 30, size: 17, alpha: 0.5 * ease.outCubic(seg(t, 1.2, 2.4)), color: C.bone2 });
  },
};
