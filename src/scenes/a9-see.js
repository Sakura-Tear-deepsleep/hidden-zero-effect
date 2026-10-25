
// A9 - 看见 / put the zero back into the frame. 123.44 -> 132.08
// The frame is what cropped the zero. Widen the frame, and the zero returns.
import { C, F, TAU, clamp, lerp, seg, segE, ease, text, ring, donut, line, poly, rect, glowDot, glowEllipse, tickRing, withA, hash1, hash2, mulberry32, mod } from '../engine.js';
import { hud, sideTitle } from '../ui.js';

const CX = 640, CY = 330, R = 152;
const GAP0 = -0.52;
const GAP1 = GAP0 + TAU * 0.20;

export default {
  id: 'A9-see',
  start: 123.44,
  end: 132.08,
  draw(ctx, t, env, p) {
    const push = 1 + 0.045 * ease.inOutQuad(seg(t, 0, 8.6));
    ctx.save();
    ctx.translate(CX, CY); ctx.scale(push, push); ctx.translate(-CX, -CY);

    const openP = ease.outCubic(seg(t, 2.30, 4.70));
    const over = Math.sin(clamp(seg(t, 4.55, 5.10)) * Math.PI) * 6;
    const wHalf = lerp(118, 640, openP) + over;
    const hHalf = lerp(196, 360, openP) + over * 0.56;
    const fx0 = CX - wHalf, fx1 = CX + wHalf, fy0 = CY - hHalf, fy1 = CY + hHalf;

    // outside the frame: colder + darker
    ctx.save();
    ctx.fillStyle = 'rgba(3,6,11,0.62)';
    ctx.beginPath();
    ctx.rect(0, 0, 1280, 720);
    ctx.moveTo(fx0, fy0); ctx.lineTo(fx0, fy1); ctx.lineTo(fx1, fy1); ctx.lineTo(fx1, fy0); ctx.closePath();
    ctx.fill('evenodd');
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = withA('#1E5A66', 0.10);
    ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();

    // inside the frame
    ctx.save();
    ctx.beginPath(); ctx.rect(fx0, fy0, fx1 - fx0, fy1 - fy0); ctx.clip();
    const ig = ctx.createRadialGradient(CX, CY, 20, CX, CY, Math.max(wHalf, hHalf) * 1.1);
    ig.addColorStop(0, withA('#2A1A0C', 0.55));
    ig.addColorStop(1, 'rgba(4,6,10,0)');
    ctx.fillStyle = ig; ctx.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
    ctx.strokeStyle = withA(C.amber, 0.05);
    ctx.lineWidth = 1;
    const gs = 48, gd = mod(t * 3, gs);
    ctx.beginPath();
    for (let x = fx0 - gs + gd; x < fx1 + gs; x += gs) { ctx.moveTo(x, fy0); ctx.lineTo(x, fy1); }
    for (let y = fy0; y < fy1 + gs; y += gs) { ctx.moveTo(fx0, y); ctx.lineTo(fx1, y); }
    ctx.stroke();

    const arcA = ease.outCubic(seg(t, 0.25, 2.1));
    const complete = ease.outCubic(seg(t, 4.9, 6.1));
    if (arcA > 0.01) {
      ring(ctx, CX, CY, R, GAP1, GAP0 + TAU, { color: withA(C.amber, 0.94), w: 3.2, glow: 22, glowColor: withA(C.amber, 0.8), alpha: arcA });
      ring(ctx, CX, CY, R - 20, GAP1, GAP0 + TAU, { color: withA(C.amber, 0.16), w: 1, alpha: arcA });
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(t * 0.04);
      tickRing(ctx, 0, 0, R + 12, R + 19, 80, { color: withA(C.bone, 0.4), alpha: 0.28 * arcA, w: 1, tickEvery: 5 });
      ctx.restore();
      const edgeA = ease.outCubic(seg(t, 2.6, 3.6));
      if (edgeA > 0.01) {
        const flick = 0.55 + 0.45 * Math.sin(t * 6.2) * Math.sin(t * 2.4);
        for (const a of [GAP0, GAP1]) {
          line(ctx, CX + Math.cos(a) * (R - 20), CY + Math.sin(a) * (R - 20), CX + Math.cos(a) * (R + 2), CY + Math.sin(a) * (R + 2),
            { color: C.verm, w: 2, alpha: 0.8 * edgeA * flick, glow: 14 });
        }
      }
      if (complete > 0.001) {
        donut(ctx, CX, CY, R - 20, R + 1, GAP0, GAP0 + TAU * 0.20 * complete, { color: withA(C.amberHi, 0.78), glow: 16, glowColor: withA(C.amberHi, 0.7) });
        const fl = seg(t, 5.9, 6.35) * (1 - seg(t, 6.35, 7.0));
        if (fl > 0.01) glowEllipse(ctx, CX, CY, R * 2.2, R * 2.2, C.amberHi, 0.16 * fl, 0);
      }
      const coreA = ease.outCubic(seg(t, 4.2, 6.0));
      if (coreA > 0.01) {
        glowDot(ctx, CX, CY, 70 + 6 * Math.sin(t * 1.1), C.amber, 0.10 * coreA, true);
        glowDot(ctx, CX, CY, 2.6, C.white, 0.7 * coreA, true);
        for (let i = 0; i < 26; i++) {
          const a = i * 2.39996 + t * 0.10;
          const rr = 26 + 92 * hash1(i * 3.3);
          ctx.globalAlpha = coreA * 0.24 * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i)));
          ctx.fillStyle = C.amberHi;
          ctx.fillRect(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr, 1.3, 1.3);
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();

    // something is out there, beyond the frame: the zero's name, dim outside / lit inside
    const litP = ease.inOutQuad(seg(t, 2.6, 4.4));
    const outA = 0.16 + 0.70 * litP;
    text(ctx, '73%  获得 0 元', 1006, CY + 6, {
      size: 30, family: F.serif, color: litP > 0.5 ? C.vermHi : C.verm,
      align: 'center', tracking: 4, alpha: outA,
      glow: 10 * litP, glowColor: withA(C.verm, 0.6),
    });
    if (litP < 0.99) {
      text(ctx, 'OUTSIDE THE VISIBLE PHRASE', 1006, CY + 44, { size: 9, family: F.mono, color: withA(C.steel, 0.55), align: 'center', tracking: 3, alpha: 1 - litP });
    }

    // frame chrome
    const chA = ease.outCubic(seg(t, 0.1, 1.1));
    if (chA > 0.01) {
      const L = 22;
      ctx.save();
      ctx.globalAlpha = chA;
      ctx.strokeStyle = withA(C.amber, 0.55);
      ctx.lineWidth = 1.4;
      const corners = [[fx0, fy0, 1, 1], [fx1, fy0, -1, 1], [fx0, fy1, 1, -1], [fx1, fy1, -1, -1]];
      for (const [x, y, sx, sy] of corners) {
        ctx.beginPath();
        ctx.moveTo(x + L * sx, y); ctx.lineTo(x, y); ctx.lineTo(x, y + L * sy);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = chA * 0.45;
      for (let i = 0; i <= 32; i++) {
        const x = fx0 + (fx1 - fx0) * i / 32;
        const th = i % 4 === 0 ? 8 : 4;
        line(ctx, x, fy0 - 10, x, fy0 - 10 + th, { color: withA(C.bone, 0.5), w: 1 });
      }
      ctx.restore();
      const scaleTxt = 'FRAME  ' + (wHalf / 640).toFixed(2) + 'x';
      text(ctx, scaleTxt, fx0, fy0 - 20, { size: 10, family: F.mono, color: withA(C.amber, 0.7), tracking: 3 });
      text(ctx, openP < 0.98 ? 'OUTSIDE THE FRAME' : 'FULL FRAME', fx1, fy0 - 20, { size: 10, family: F.mono, color: withA(openP < 0.98 ? C.verm : C.amber, 0.65), tracking: 3, align: 'right' });
    }

    ctx.restore();

    // copy
    // (hero line removed: the narration subtitle carries it)

    hud(ctx, t, env, { code: 'HZ / 09', label: 'THE FRAME  -  WHAT IT LEFT OUT', accent: C.amber, alpha: 0.8 * ease.outCubic(seg(t, 0.4, 1.6)) });
    sideTitle(ctx, t, env, '看见', { x: 50, y: 232, step: 34, size: 18, alpha: 0.45 * ease.outCubic(seg(t, 0.8, 2.0)), color: C.bone2 });
  },
};
