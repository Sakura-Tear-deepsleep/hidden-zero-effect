
// A0 - 钩子：两个按钮 / the hook. 0.00 -> 17.18
import { C, F, TAU, clamp, lerp, seg, segE, ease, text, measureTracked, ring, donut, line, poly, rect, glowDot, glowEllipse, gapRing, tickRing, withA, hash1, hash2, mod, mulberry32 } from '../engine.js';
import { hud } from '../ui.js';

const AX0 = 96, AX1 = 596, BX0 = 684, BX1 = 1184;
const PY0 = 236, PY1 = 452;
const rrect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

function money(ctx, x, y, num, unit, o) {
  const w = text(ctx, num, x, y, { size: 76, family: F.latin, color: o.color, glow: o.glow, glowColor: o.glowColor });
  text(ctx, unit, x + w + 16, y - 12, { size: 34, family: F.sans, color: o.color, alpha: 0.92, tracking: 2 });
}

export default {
  id: 'A0-hook',
  start: 0,
  end: 17.18,
  fadeOut: 0.45,
  draw(ctx, t, env, p) {
    const push = 1 + 0.055 * ease.inOutQuad(seg(t, 0.4, 16.8));
    ctx.save();
    ctx.translate(640, 344); ctx.scale(push, push); ctx.translate(-640, -344);

    // ---------- impact: a light streak across the frame at 0.35 ----------
    const strk = seg(t, 0.30, 0.62) * (1 - seg(t, 0.70, 1.20));
    if (strk > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createLinearGradient(80, 0, 1200, 0);
      lg.addColorStop(0, withA(C.amberHi, 0));
      lg.addColorStop(0.5, withA(C.amberHi, 0.55 * strk));
      lg.addColorStop(1, withA(C.amberHi, 0));
      ctx.fillStyle = lg; ctx.fillRect(80, 341 + 1.5 * Math.sin(t * 9), 1120, 3);
      ctx.restore();
    }

    // ---------- the two buttons ----------
    const slam = ease.outCubic(seg(t, 0.55, 1.45));
    const over = 1 + 0.055 * Math.sin(clamp(seg(t, 1.30, 1.90)) * Math.PI);
    const pairA = ease.outCubic(seg(t, 0.55, 1.55)) * (1 - seg(t, 11.2, 12.4));
    if (pairA > 0.01) {
      const sc = (0.94 + 0.06 * slam) * over;
      ctx.save();
      ctx.globalAlpha = pairA;
      ctx.translate(640, 344); ctx.scale(sc, sc); ctx.translate(-640, -344);
      // ---- A : certain
      const aPulse = 1 + 0.006 * Math.sin(t * 1.6);
      ctx.save();
      const ag = ctx.createLinearGradient(AX0, PY0, AX1, PY1);
      ag.addColorStop(0, withA('#F0A24A', 0.34));
      ag.addColorStop(0.55, withA('#FFC97A', 0.46));
      ag.addColorStop(1, withA('#C97A28', 0.30));
      rrect(ctx, AX0, PY0, AX1 - AX0, PY1 - PY0, 16); ctx.fillStyle = ag; ctx.fill();
      ctx.strokeStyle = withA(C.amberHi, 0.85); ctx.lineWidth = 2; ctx.stroke();
      // travelling sheen
      ctx.save(); rrect(ctx, AX0, PY0, AX1 - AX0, PY1 - PY0, 16); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      const sx = AX0 - 220 + mod(t * 190, (AX1 - AX0) + 440);
      const shg = ctx.createLinearGradient(sx, PY0, sx + 220, PY1);
      shg.addColorStop(0, 'rgba(255,236,200,0)'); shg.addColorStop(0.5, 'rgba(255,236,200,0.16)'); shg.addColorStop(1, 'rgba(255,236,200,0)');
      ctx.fillStyle = shg; ctx.fillRect(AX0, PY0, AX1 - AX0, PY1 - PY0);
      ctx.restore();
      ctx.restore();
      text(ctx, 'A', AX0 + 30, PY0 + 62, { size: 40, family: F.latin, color: C.amberHi, alpha: 0.95 });
      text(ctx, '100% 拿到', AX0 + 30, PY0 + 112, { size: 30, family: F.sans, color: C.bone, tracking: 3 });
      money(ctx, AX0 + 30, PY0 + 190, '100', '元', { color: C.bone, glow: 14, glowColor: withA(C.amber, 0.45) });
      text(ctx, '稳拿', AX1 - 132, PY0 + 190, { size: 16, family: F.sans, color: withA(C.bone2, 0.85), tracking: 4, align: 'right' });
      text(ctx, 'CERTAIN', AX1 - 30, PY0 + 190, { size: 11, family: F.mono, color: withA(C.bone2, 0.6), tracking: 3, align: 'right' });

      // ---- B : 80%
      const bg = ctx.createLinearGradient(BX0, PY0, BX1, PY1);
      bg.addColorStop(0, withA('#1C5257', 0.42));
      bg.addColorStop(1, withA('#0C2B30', 0.55));
      rrect(ctx, BX0, PY0, BX1 - BX0, PY1 - PY0, 16); ctx.fillStyle = bg; ctx.fill();
      ctx.strokeStyle = withA(C.cyan, 0.80); ctx.lineWidth = 2; ctx.stroke();
      // 80% fill
      const fillP = ease.outCubic(seg(t, 2.6, 4.2));
      ctx.save(); rrect(ctx, BX0, PY0, BX1 - BX0, PY1 - PY0, 16); ctx.clip();
      const fg = ctx.createLinearGradient(BX0, 0, BX1, 0);
      fg.addColorStop(0, withA(C.cyan, 0.46)); fg.addColorStop(1, withA(C.cyanHi, 0.30));
      ctx.fillStyle = fg;
      ctx.fillRect(BX0, PY0, (BX1 - BX0) * 0.8 * fillP, PY1 - PY0);
      // the missing 20%: turns into a hole
      const holeP = ease.inOutCubic(seg(t, 5.6, 7.4));
      if (holeP > 0) {
        ctx.fillStyle = 'rgba(2,4,8,' + (0.92 * holeP).toFixed(3) + ')';
        ctx.fillRect(BX0 + (BX1 - BX0) * 0.8, PY0, (BX1 - BX0) * 0.2 + 1, PY1 - PY0);
        // dust falling through the hole
        for (let i = 0; i < 16; i++) {
          const px = BX0 + (BX1 - BX0) * (0.80 + 0.20 * hash1(i * 3.1));
          const ph = mod(t * (0.25 + 0.35 * hash1(i * 7.7)) + hash1(i * 5.3), 1);
          ctx.globalAlpha = pairA * 0.75 * (1 - ph);
          ctx.fillStyle = i % 3 === 0 ? C.vermHi : C.amberHi;
          ctx.fillRect(px, PY0 + (PY1 - PY0) * ph, 1.6, 2.6);
        }
        ctx.globalAlpha = pairA;
      }
      ctx.restore();
      text(ctx, 'B', BX0 + 30, PY0 + 62, { size: 40, family: F.latin, color: C.cyanHi, alpha: 0.95 });
      text(ctx, '80% 拿到', BX0 + 30, PY0 + 112, { size: 30, family: F.sans, color: C.bone, tracking: 3 });
      money(ctx, BX0 + 30, PY0 + 190, '100', '元', { color: C.bone, glow: 14, glowColor: withA(C.cyan, 0.4) });
      // the 20% callout
      const callA = ease.outCubic(seg(t, 6.2, 7.4));
      if (callA > 0.01) {
        const hx = BX0 + (BX1 - BX0) * 0.90;
        text(ctx, '20%', hx, PY0 - 18, { size: 34, family: F.latin, color: C.vermHi, align: 'center', alpha: callA, glow: 14, glowColor: withA(C.verm, 0.6) });
        text(ctx, '这里是什么？', hx, PY1 + 44, { size: 26, family: F.sans, color: withA(C.vermHi, 0.95), align: 'center', alpha: callA, tracking: 2 });
        line(ctx, hx, PY0 - 6, hx, PY0 + 4, { color: C.verm, w: 1.4, alpha: callA });
      }
      ctx.restore();
    }

    // ---------- the zero rises inside the hole ----------
    const zeroA = ease.outCubic(seg(t, 8.2, 9.6)) * (1 - seg(t, 11.4, 12.6));
    if (zeroA > 0.01) {
      const hx = BX0 + (BX1 - BX0) * 0.90;
      const s = 1 + 0.04 * Math.sin(t * 1.4);
      glowEllipse(ctx, hx, 344, 120 * s, 120 * s, C.verm, 0.10 * zeroA, 0);
      text(ctx, '0', hx, 344 + 46, { size: 150 * s, family: F.latin, weight: 300, color: C.vermHi, align: 'center', alpha: zeroA, glow: 22, glowColor: withA(C.verm, 0.7) });
      text(ctx, '元', hx, 344 + 96, { size: 26, family: F.sans, color: withA(C.vermHi, 0.9), align: 'center', alpha: zeroA, tracking: 3 });
    }

    // ---------- the two panels fold into the gap ring ----------
    const ringA = ease.outCubic(seg(t, 11.6, 13.2));
    if (ringA > 0.01) {
      const R = 150 + 22 * ease.outCubic(seg(t, 12.6, 17.0));
      const rot = -Math.PI / 2 + t * 0.05;
      glowEllipse(ctx, 640, 344, R * 2.1, R * 2.1, C.amber, 0.045 * ringA, 0);
      ring(ctx, 640, 344, R, 0, TAU, { color: withA(C.bone, 0.10), w: 1, alpha: ringA });
      gapRing(ctx, 640, 344, R, 0.20 * ringA, rot, { color: withA(C.amber, 0.94), w: 2.8, glow: 20, glowColor: withA(C.amber, 0.8) });
      tickRing(ctx, 640, 344, R + 11, R + (mod(t, 3) < 1.5 ? 18 : 15), 84, { color: withA(C.steel, 0.5), alpha: 0.30 * ringA, w: 1 });
      // the hole edge
      const e0 = rot, e1 = rot + TAU * 0.20;
      const flick = 0.5 + 0.5 * Math.sin(t * 6.7) * Math.sin(t * 2.9);
      for (const a of [e0, e1]) {
        line(ctx, 640 + Math.cos(a) * (R - 22), 344 + Math.sin(a) * (R - 22), 640 + Math.cos(a) * (R + 1.5), 344 + Math.sin(a) * (R + 1.5), { color: C.verm, w: 2, alpha: 0.85 * ringA * flick, glow: 14 });
      }
    }

    // ---------- the question, big and central ----------
    // (question line removed: the narration subtitle carries it)
    ctx.restore();

    hud(ctx, t, env, { code: 'HZ / 00', label: 'A CHOICE  -  TWO BUTTONS', accent: C.amber, alpha: 0.9 * ease.outCubic(seg(t, 1.2, 2.4)) });
  },
};
