// A5 - 机制 / MECHANISM: 不是价值变了，是目光挪了。   83.03 -> 96.97
// 修订 2：中文优先；y>=592 留空给旁白字幕
import {
  C, F, TAU, clamp, lerp, seg, ease, text, measureTracked, ring, donut, line,
  glowDot, glowEllipse, gapRing, tickRing, withA, hash1, hash2, mod, mix,
} from '../engine.js';
import { hud } from '../ui.js';

const DUR = 13.94;
const EX = 440, EY = 330;
const ERX = 200, ERY = 120;
const IRIS = 98, PUP = 42;
const CA = { x: 848, y: 176, w: 320, h: 112 };
const CB = { x: 848, y: 330, w: 320, h: 180 };
const T_SNAP = 7.755, T_CLOSE = 12.30;

const ST = [
  { x: 300, zh: '零', en: 'ZERO', t0: 0.7675 },
  { x: 620, zh: '注视', en: 'GAZE', t0: 3.455 },
  { x: 940, zh: '选择', en: 'CHOICE', t0: 10.980 },
];

const breath = (t, ph, amt, sp) => 1 + (amt === undefined ? 0.04 : amt) * Math.sin(t * (sp || 1.10) + ph);

function eyePath(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy);
  ctx.bezierCurveTo(cx - rx * 0.54, cy - ry * 1.06, cx + rx * 0.54, cy - ry * 1.06, cx + rx, cy);
  ctx.bezierCurveTo(cx + rx * 0.54, cy + ry * 1.06, cx - rx * 0.54, cy + ry * 1.06, cx - rx, cy);
  ctx.closePath();
}

function frame(ctx, x, y, w, h, col, a) {
  line(ctx, x, y, x + w, y, { color: withA(col, 0.34), w: 1, alpha: a });
  line(ctx, x, y + h, x + w, y + h, { color: withA(col, 0.20), w: 1, alpha: a });
  line(ctx, x + w, y, x + w, y + h, { color: withA(col, 0.16), w: 1, alpha: a });
  line(ctx, x, y, x, y + h, { color: withA(col, 0.9), w: 2.8, alpha: a });
}

export default {
  id: 'A5-mechanism',
  start: 83.03,
  end: 96.97,
  draw(ctx, t, env, p) {
    const W = env.w, H = env.h;
    const T = t + 83.03;
    const mA = Math.min(1, seg(t, 0, 0.26)) * (1 - 0.52 * seg(t, 13.28, DUR));
    if (mA < 0.002) return;

    const push = 1 + 0.050 * ease.inOutQuad(seg(t, 0, DUR)) + 0.009 * Math.sin(t * 0.61);
    const dq = t - T_SNAP;
    const punch = dq > 0 ? 0.052 * Math.exp(-dq * 6.2) * Math.cos(dq * 19.0) : 0;
    const camX = 6 * Math.sin(t * 0.19) + 3 * Math.sin(t * 0.083 + 1.2);
    const camY = -9 * ease.inOutQuad(seg(t, 0, DUR)) + 4 * Math.cos(t * 0.23);

    ctx.save();
    ctx.translate(EX, EY); ctx.scale(1 + punch, 1 + punch); ctx.translate(-EX, -EY);
    ctx.translate(W / 2, H / 2);
    ctx.scale(push, push);
    ctx.translate(-W / 2 + camX, -H / 2 + camY);

    const halo = mA * ease.outCubic(seg(t, 1.10, 3.10)) * (1 - ease.inOutCubic(seg(t, 12.45, 13.15)));
    if (halo > 0.002) {
      ring(ctx, EX, EY, 248, 0, TAU, { color: withA(C.steel, 0.075), w: 1, alpha: halo });
      const a0 = t * 0.19;
      ring(ctx, EX, EY, 276, a0, a0 + 1.05, { color: withA(C.cyan, 0.20), w: 1.2, alpha: halo, glow: 8 });
      ring(ctx, EX, EY, 276, a0 + Math.PI, a0 + Math.PI + 0.42, { color: withA(C.cyan, 0.10), w: 1, alpha: halo });
      tickRing(ctx, EX, EY, 224, 231, 64, { color: withA(C.steel, 0.55), alpha: halo * 0.38, w: 1, a0: -2.55, a1: 0.72 });
      for (let i = 0; i < 6; i++) {
        const bx = 150 + hash1(i * 3.1 + 11) * 1120;
        const by = 130 + hash1(i * 7.7 + 3) * 440;
        const dx = mod(bx + t * 5.5, 1360) - 60;
        const a = halo * 0.16 * (0.55 + 0.45 * Math.sin(t * 0.9 + i));
        line(ctx, dx - 3, by, dx + 3, by, { color: withA(C.cyan, 0.8), w: 1, alpha: a });
        line(ctx, dx, by - 3, dx, by + 3, { color: withA(C.cyan, 0.8), w: 1, alpha: a });
      }
    }

    const preA = (1 - ease.outCubic(seg(t, 0.85, 1.95)));
    if (preA > 0.004) {
      const shrink = ease.inOutCubic(seg(t, 0.23, 1.32));
      const rr = lerp(168, IRIS, shrink);
      const ga = lerp(0.27, 0.095, shrink);
      const rot = -Math.PI / 2 + t * 0.10;
      gapRing(ctx, EX, EY, rr, ga, rot, { color: withA(C.amber, 0.90), w: 2.2, glow: 16, glowColor: withA(C.amber, 0.7), alpha: preA * mA });
      donut(ctx, EX, EY, rr * 0.94, rr * 1.0, rot, rot + TAU * ga, { color: C.void, alpha: preA * mA * 0.9 });
      glowDot(ctx, EX, EY, 4.6 + 1.6 * env.beat(T, 3), C.amberHi, 0.75 * preA * mA, true);
      if (shrink < 0.02) ring(ctx, EX, EY, 200, 0, TAU, { color: withA(C.bone, 0.10), w: 1, alpha: preA * mA });
    }

    const open = ease.outQuint(seg(t, 0.23, 1.30));
    const close = ease.inOutCubic(seg(t, T_CLOSE, 12.96));
    const lid = open * (1 - close);

    let iox = 0, ioy = 0;
    iox = lerp(iox, 10, ease.inOutCubic(seg(t, 3.30, 4.10)));
    ioy = lerp(ioy, -4, ease.inOutCubic(seg(t, 3.30, 4.10)));
    iox = lerp(iox, 13, ease.inOutCubic(seg(t, 5.60, 6.35)));
    ioy = lerp(ioy, 9, ease.inOutCubic(seg(t, 5.60, 6.35)));
    iox = lerp(iox, 0, ease.inOutCubic(seg(t, 11.85, 12.45)));
    ioy = lerp(ioy, 0, ease.inOutCubic(seg(t, 11.85, 12.45)));

    let pupS = 1 + 0.045 * Math.sin(t * 1.7 + 0.4) + 0.022 * env.beat(T, 2);
    if (t < T_SNAP) {
      pupS += 0.13 * ease.inQuad(seg(t, 6.70, T_SNAP));
    } else {
      const sq = ease.inExpo(seg(t, T_SNAP, T_SNAP + 0.13));
      const rel = ease.outElastic(seg(t, T_SNAP + 0.13, T_SNAP + 0.80));
      pupS = lerp(lerp(1.13, 0.42, sq), 1.0, rel) + 0.03 * Math.sin(t * 1.55);
    }
    const ir = IRIS;

    if (lid > 0.030) {
      const rx = ERX * (0.80 + 0.20 * lid);
      const ry = ERY * lid;
      ctx.save();
      eyePath(ctx, EX, EY, rx, ry);
      ctx.clip();

      const sg = ctx.createRadialGradient(EX, EY, 8, EX, EY, ERX * 1.05);
      sg.addColorStop(0, withA(C.slate, 0.95));
      sg.addColorStop(0.55, withA(C.ink, 0.95));
      sg.addColorStop(1, withA(C.abyss, 0.92));
      ctx.globalAlpha = mA;
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.rect(EX - ERX - 8, EY - ERY - 8, ERX * 2 + 16, ERY * 2 + 16); ctx.fill();

      const ig = ctx.createRadialGradient(EX + iox, EY + ioy, ir * 0.12, EX + iox, EY + ioy, ir * 1.02);
      ig.addColorStop(0, withA(C.amberD, 0.44));
      ig.addColorStop(0.62, withA(C.amber, 0.104));
      ig.addColorStop(0.93, withA(C.amber, 0.272));
      ig.addColorStop(1, withA(C.amber, 0.04));
      ctx.globalAlpha = mA;
      ctx.fillStyle = ig;
      ctx.beginPath(); ctx.arc(EX + iox, EY + ioy, ir, 0, TAU); ctx.fill();

      ctx.globalAlpha = mA * 0.5;
      ctx.strokeStyle = withA(C.amber, 0.20);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 54; i++) {
        const a = (i / 54) * TAU + t * 0.06;
        const r0 = ir * (0.42 + 0.05 * hash1(i));
        const r1 = ir * (0.86 + 0.10 * hash1(i + 31));
        ctx.moveTo(EX + iox + Math.cos(a) * r0, EY + ioy + Math.sin(a) * r0);
        ctx.lineTo(EX + iox + Math.cos(a) * r1, EY + ioy + Math.sin(a) * r1);
      }
      ctx.stroke();

      const garc = 0.085 + 0.050 * ease.inOutCubic(seg(t, 5.2, 7.4)) + 0.105 * ease.inOutCubic(seg(t, 12.5, 13.5));
      const grot = -Math.PI / 2 + t * 0.085;
      gapRing(ctx, EX + iox, EY + ioy, ir, garc, grot, {
        color: withA(C.amber, 0.92), w: 2.2, glow: 10, glowColor: withA(C.amber, 0.6), alpha: mA,
      });
      const gs = ctx.createRadialGradient(EX + iox, EY + ioy, ir * 0.34, EX + iox, EY + ioy, ir * 1.09);
      gs.addColorStop(0, withA(C.void, 0));
      gs.addColorStop(0.72, withA(C.void, 0.16));
      gs.addColorStop(1, withA(C.void, 0.62));
      ctx.save();
      ctx.globalAlpha = mA;
      ctx.fillStyle = gs;
      ctx.beginPath();
      ctx.arc(EX + iox, EY + ioy, ir * 1.09, grot, grot + TAU * garc);
      ctx.arc(EX + iox, EY + ioy, ir * 0.34, grot + TAU * garc, grot, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const vf = 0.55 + 0.45 * Math.sin(t * 4.1) * Math.sin(t * 1.7);
      for (const ea of [grot, grot + TAU * garc]) {
        line(ctx, EX + iox + Math.cos(ea) * ir * 0.97, EY + ioy + Math.sin(ea) * ir * 0.97,
          EX + iox + Math.cos(ea) * ir * 1.12, EY + ioy + Math.sin(ea) * ir * 1.12,
          { color: C.verm, w: 1.2, alpha: mA * 0.55 * (0.4 + 0.6 * vf), glow: 7 });
      }

      const pr = PUP * pupS;
      const pg = ctx.createRadialGradient(EX + iox, EY + ioy, pr * 0.2, EX + iox, EY + ioy, pr);
      pg.addColorStop(0, C.void);
      pg.addColorStop(0.90, C.abyss);
      pg.addColorStop(1, withA(C.steelD, 0.30));
      ctx.globalAlpha = mA;
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(EX + iox, EY + ioy, pr, 0, TAU); ctx.fill();
      ring(ctx, EX + iox, EY + ioy, pr, 0, TAU, { color: withA(C.amberHi, 0.62), w: 1.3, alpha: mA });
      ring(ctx, EX + iox, EY + ioy, pr + 2.2, 0, TAU, { color: withA(C.amberD, 0.55), w: 1.6, alpha: mA });

      let sa = -1.24;
      sa = lerp(sa, -0.56, ease.inOutCubic(seg(t, 3.35, 4.15)));
      sa = lerp(sa, 0.34, ease.inOutCubic(seg(t, 5.65, 6.40)));
      sa = lerp(sa, -1.10, ease.inOutCubic(seg(t, 12.4, 13.5)));
      sa += 0.03 * Math.sin(t * 0.83);
      const sr = ir * 0.52;
      const sx = EX + iox + Math.cos(sa) * sr, sy = EY + ioy + Math.sin(sa) * sr * 0.92;
      const sAmp = 0.42 + 0.34 * ease.outCubic(seg(t, 5.9, 7.1)) + 0.14 * env.beat(T, 2);
      ctx.globalAlpha = mA;
      glowDot(ctx, sx, sy, 38 + 11 * env.beat(T, 3), C.cyan, 0.20 * sAmp, false);
      glowDot(ctx, sx, sy, 8.0, C.cyanHi, 0.92 * sAmp, true);
      line(ctx, sx - 7, sy, sx + 7, sy, { color: withA(C.cyanHi, 0.55), w: 1, alpha: mA * 0.7 });
      line(ctx, sx, sy - 7, sx, sy + 7, { color: withA(C.cyanHi, 0.55), w: 1, alpha: mA * 0.7 });

      ctx.restore();

      ctx.save();
      eyePath(ctx, EX, EY, rx, ry);
      ctx.globalAlpha = mA;
      ctx.strokeStyle = withA(C.bone, 0.42 * (0.30 + 0.70 * lid));
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    const back = ease.outCubic(seg(t, 12.80, 13.15));
    if (back > 0.004) {
      const k2 = ease.inOutCubic(seg(t, 13.00, 13.95));
      const rr = lerp(96, 168, k2);
      const ga = lerp(0.16, 0.25, ease.inOutCubic(seg(t, 12.90, 13.70)));
      const rot = -Math.PI / 2 + t * 0.10;
      gapRing(ctx, EX, EY, rr, ga, rot, { color: withA(C.amber, 0.90), w: 2.3, glow: 16, glowColor: withA(C.amber, 0.7), alpha: back * mA });
      glowDot(ctx, EX, EY, 4.2 + 1.4 * env.beat(T, 3), C.amberHi, 0.55 * back * mA, true);
    }

    if (dq > 0 && dq < 0.85) {
      const k = seg(t, T_SNAP, T_SNAP + 0.78);
      ring(ctx, EX + iox, EY + ioy, 22 + 132 * ease.outQuart(k), 0, TAU,
        { color: withA(C.cyanHi, 0.55 * Math.pow(1 - k, 1.4)), w: 1.1 + 2.2 * (1 - k), alpha: mA, glow: 14 });
      const k2 = seg(t, T_SNAP + 0.10, T_SNAP + 0.62);
      if (k2 > 0 && k2 < 1) ring(ctx, EX + iox, EY + ioy, 14 + 74 * ease.outQuart(k2), 0, TAU,
        { color: withA(C.amber, 0.34 * (1 - k2)), w: 1, alpha: mA });
    }

    drawGaze(ctx, t, mA, 0, EX + ERX - 6, EY - 8, CA.x - 8, 232, 3.40, 3.95);
    drawGaze(ctx, t, mA, 1, EX + ERX - 6, EY + 16, CB.x - 8, 420, 5.58, 6.02);

    const aA = ease.outCubic(seg(t, 1.50, 2.40));
    const aB = ease.outCubic(seg(t, 2.10, 3.02));
    const dimA = 1 - 0.55 * ease.inOutCubic(seg(t, 5.75, 6.60));
    const dimB = 1 - 0.42 * ease.inOutCubic(seg(t, 12.15, 13.30));

    if (aA > 0.002) {
      const recoil = 1 - 0.05 * ease.inOutCubic(seg(t, 5.75, 6.55));
      ctx.save();
      ctx.translate(CA.x + CA.w / 2, CA.y + CA.h / 2); ctx.scale(recoil, recoil);
      ctx.translate(-CA.x - CA.w / 2, -CA.y - CA.h / 2);
      const a = mA * aA * dimA;
      const hitA = t > 3.95 ? Math.exp(-(t - 3.95) * 3.6) : 0;
      frame(ctx, CA.x, CA.y, CA.w, CA.h, C.amber, a);
      line(ctx, CA.x, CA.y, CA.x + CA.w, CA.y, { color: withA(C.amberHi, 0.55 * hitA), w: 1.6, alpha: a });
      text(ctx, '确定选项', CA.x + 16, CA.y + 44, { size: 30, family: F.serif, color: C.amberHi, tracking: 3, alpha: a * breath(t, 0.3, 0.04) });
      text(ctx, '100% 得 98 元', CA.x + 16, CA.y + 88, { size: 26, family: F.serif, color: C.bone, tracking: 2, alpha: a * breath(t, 1.4, 0.04) });
      text(ctx, 'CERTAIN', CA.x + CA.w - 14, CA.y + 24, { size: 11, family: F.mono, color: withA(C.amber, 0.6), align: 'right', tracking: 3, alpha: a });
      const sc = seg(t, 4.30, 5.30);
      if (sc > 0 && sc < 1) {
        const sy = CA.y + CA.h * ease.inOutQuad(sc);
        line(ctx, CA.x + 2, sy, CA.x + CA.w - 2, sy, { color: withA(C.amber, 0.55 * (1 - sc * 0.7)), w: 1, alpha: a, glow: 8 });
      }
      ctx.restore();
    }

    if (aB > 0.002) {
      const bump = (1 + 0.06 * ease.outCubic(seg(t, 5.95, 6.75)))
        * (1 + (t > 10.98 ? 0.05 * Math.exp(-(t - 10.98) * 7.5) * Math.cos((t - 10.98) * 13) : 0));
      ctx.save();
      ctx.translate(CB.x + CB.w / 2, CB.y + CB.h / 2); ctx.scale(bump, bump);
      ctx.translate(-CB.x - CB.w / 2, -CB.y - CB.h / 2);
      const a = mA * aB * dimB;
      const flash = t > 10.98 ? Math.exp(-(t - 10.98) * 7.0) : 0;
      const nz = ease.outCubic(seg(t, 5.95, 6.95));

      frame(ctx, CB.x, CB.y, CB.w, CB.h, C.cyan, a);
      text(ctx, '风险选项', CB.x + 16, CB.y + 40, { size: 30, family: F.serif, color: mix(C.steel, C.cyanHi, nz), tracking: 3, alpha: a * breath(t, 2.1, 0.04) });
      text(ctx, 'RISKY', CB.x + CB.w - 14, CB.y + 24, { size: 11, family: F.mono, color: withA(C.cyan, 0.6), align: 'right', tracking: 3, alpha: a });

      if (nz > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glowEllipse(ctx, CB.x + CB.w * 0.5, CB.y + 70, 220, 74, C.cyan, 0.11 * nz * a, 0);
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.rect(CB.x + 2, CB.y + 50, CB.w - 4, 62); ctx.clip();
        for (let i = 0; i < 3; i++) {
          const yy = CB.y + 50 + mod(t * 46 + i * 31, 62);
          line(ctx, CB.x + 2, yy, CB.x + CB.w - 2, yy, { color: withA(C.cyanHi, 0.18 * nz), w: 1, alpha: a });
        }
        ctx.restore();
      }
      text(ctx, '27% 得 367 元', CB.x + 16, CB.y + 96, { size: 26, family: F.serif, color: mix(C.bone2, C.cyanHi, nz), tracking: 2, alpha: a * breath(t, 3.1, 0.04) });

      line(ctx, CB.x, CB.y + 114, CB.x + CB.w, CB.y + 114, { color: withA(C.bone, 0.16), w: 1, alpha: a });
      ctx.save();
      ctx.fillStyle = withA(C.void, 0.5);
      ctx.globalAlpha = a;
      ctx.fillRect(CB.x + 2, CB.y + 116, CB.w - 4, CB.h - 118);
      ctx.restore();
      text(ctx, '73% 得 ', CB.x + 16, CB.y + 152, { size: 26, family: F.serif, color: C.bone3, tracking: 2, alpha: a * breath(t, 4.2, 0.04) });
      const w73 = measureTracked(ctx, '73% 得 ', 26, F.serif, 400, 2);
      text(ctx, '0 元', CB.x + 16 + w73, CB.y + 152, { size: 26, family: F.serif, color: C.verm, tracking: 2, alpha: a * (0.78 + 0.2 * Math.sin(t * 2.3)) });
      line(ctx, CB.x + CB.w - 66, CB.y + 162, CB.x + CB.w - 16, CB.y + 162, { color: withA(C.verm, 0.55), w: 1, alpha: a });
      text(ctx, 'ZERO', CB.x + 16, CB.y + 172, { size: 11, family: F.mono, color: withA(C.verm, 0.6), tracking: 3, alpha: a });

      if (flash > 0.02) {
        line(ctx, CB.x - 1, CB.y - 1, CB.x + CB.w + 1, CB.y - 1, { color: C.cyanHi, w: 1.8, alpha: a * flash });
        line(ctx, CB.x + CB.w + 1, CB.y - 1, CB.x + CB.w + 1, CB.y + CB.h + 1, { color: withA(C.cyanHi, 0.75), w: 1.6, alpha: a * flash });
        line(ctx, CB.x - 1, CB.y - 1, CB.x - 1, CB.y + CB.h + 1, { color: C.cyanHi, w: 3.4, alpha: a * flash });
      }
      const scan = seg(t, 10.98, 11.30);
      if (scan > 0 && scan < 1) {
        const yy = CB.y + CB.h * ease.inOutQuad(scan);
        line(ctx, CB.x + 2, yy, CB.x + CB.w - 2, yy, { color: withA(C.cyanHi, 0.75 * (1 - scan * 0.5)), w: 1.4, alpha: a, glow: 12 });
      }
      ctx.restore();
    }

    const noteA = ease.outCubic(seg(t, 3.95, 4.60)) * (1 - ease.inOutCubic(seg(t, 5.55, 6.20)));
    if (noteA > 0.004) {
      const nx = 670, ny = 302;
      glowDot(ctx, 762, 262, 4, C.cyan, 0.7 * noteA * mA, true);
      line(ctx, 762, 266, 742, 288, { color: withA(C.cyan, 0.42), w: 1, alpha: noteA * mA });
      text(ctx, '目光停在这儿', nx, ny, {
        size: 26, family: F.serif, color: C.cyanHi, tracking: 2, alpha: noteA * mA * breath(t, 0.9, 0.03),
        perChar: (i, n) => { const e = ease.outCubic(seg(t, 3.95 + i * 0.05, 4.35 + i * 0.05)); return { alpha: e, dy: (1 - e) * 10 }; },
      });
    }

    drawStages(ctx, t, mA);

    const fa = ease.outCubic(seg(t, 8.85, 9.60)) * (1 - 0.85 * ease.inOutCubic(seg(t, 11.95, 12.80)));
    if (fa > 0.002) {
      line(ctx, 244, 468, 372, 468, { color: withA(C.bone, 0.18), w: 1, alpha: mA * fa });
      text(ctx, 'THETA(RISK) > THETA(CERTAIN)', 244, 488, {
        size: 13, family: F.mono, color: C.bone3, tracking: 2, alpha: mA * fa * 0.9 * breath(t, 0.5, 0.035),
      });
      text(ctx, '=> P(CHOOSE RISK) UP', 244, 506, {
        size: 13, family: F.mono, color: withA(C.cyan, 0.75), tracking: 2, alpha: mA * fa * 0.9 * breath(t, 2.6, 0.035),
      });
    }

    ctx.restore();

    hud(ctx, T, env, { code: 'HZ / A5', label: 'MECHANISM', accent: C.amber, alpha: 0.92 });
  },
};

function gazeCone(ctx, x0, y0, x1, y1, w1, a, col) {
  const dx = x1 - x0, dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const w0 = 16;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const mx = (x0 + x1) * 0.5, my = (y0 + y1) * 0.5;
  const g = ctx.createLinearGradient(mx + nx * w1, my + ny * w1, mx - nx * w1, my - ny * w1);
  g.addColorStop(0, withA(col, 0));
  g.addColorStop(0.5, withA(col, 0.052 * a));
  g.addColorStop(1, withA(col, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0 + nx * w0, y0 + ny * w0);
  ctx.lineTo(x1 + nx * w1, y1 + ny * w1);
  ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
  ctx.lineTo(x0 - nx * w0, y0 - ny * w0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGaze(ctx, t, mA, i, x1, y1, x2, y2, t0, t1) {
  mA *= 1 - ease.inOutCubic(seg(t, 11.55, 12.55));
  const on = ease.outCubic(seg(t, t0, t1));
  const off = i === 0 ? 1 - 0.72 * ease.inOutCubic(seg(t, 5.65, 6.45)) : 1;
  const a = mA * on * off;
  if (a < 0.004) return;
  const g = ease.outCubic(seg(t, t0, t1 + 0.2));
  const ex = lerp(x1, x2, g), ey = lerp(y1, y2, g);
  const col = i === 0 ? C.amber : C.cyan;
  gazeCone(ctx, x1, y1, x2, y2, 46, a, col);
  line(ctx, x1, y1, ex, ey, { color: withA(col, 0.55), w: 1.1, alpha: a, dash: [5, 7], glow: 6 });
  const pk = mod(t * 0.62 + i * 0.5, 1);
  glowDot(ctx, lerp(x1, x2, pk), lerp(y1, y2, pk), 9, col, 0.55 * a, true);
  glowDot(ctx, lerp(x1, x2, pk), lerp(y1, y2, pk), 2.2, C.bone, 0.85 * a, true);
  const la = a * seg(t, t1 - 0.15, t1 + 0.25);
  line(ctx, x2, y2 - 14, x2, y2 + 14, { color: withA(col, 0.7), w: 1, alpha: la });
  line(ctx, x2, y2, x2 + 8, y2, { color: withA(col, 0.35), w: 1, alpha: la });
}

function drawStages(ctx, t, mA) {
  const y = 76;
  const x0 = ST[0].x, x1 = ST[2].x;
  line(ctx, x0, y, x1, y, { color: withA(C.bone, 0.13), w: 1, alpha: mA });
  let f = 0;
  f = Math.max(f, 0.5 * ease.outCubic(seg(t, 3.46, 4.42)));
  f = Math.max(f, 1.0 * ease.outCubic(seg(t, 10.98, 11.92)));
  if (f > 0.002) line(ctx, x0, y, x0 + (x1 - x0) * f, y, { color: withA(C.cyan, 0.50), w: 1, alpha: mA });
  for (let i = 0; i < ST.length; i++) {
    const s = ST[i];
    const on = ease.outCubic(seg(t, s.t0, s.t0 + 0.45));
    const pulse = seg(t, s.t0, s.t0 + 0.95);
    const lit = 0.32 + 0.68 * on;
    glowDot(ctx, s.x, y, 15 * lit, C.cyan, 0.16 * on * mA, false);
    ring(ctx, s.x, y, 4.6 * breath(t, i * 2.1, 0.10, 1.6), 0, TAU, { color: withA(on > 0.4 ? C.cyanHi : C.steel, 0.78 * lit), w: 1.2, alpha: mA * breath(t, i * 2.1 + 0.8, 0.07) });
    if (pulse > 0 && pulse < 1) ring(ctx, s.x, y, 7 + 20 * ease.outQuart(pulse), 0, TAU, { color: withA(C.cyanHi, 0.45 * (1 - pulse)), w: 1, alpha: mA });
    text(ctx, s.zh, s.x, y + 44, { size: 28, family: F.serif, color: on > 0.5 ? C.bone : C.bone2, align: 'center', tracking: 4, alpha: mA * (0.55 + 0.45 * on) * breath(t, i * 1.7, 0.04) });
    text(ctx, s.en, s.x, y + 62, { size: 11, family: F.mono, color: withA(C.steel, 0.9), align: 'center', tracking: 3, alpha: mA * (0.45 + 0.55 * on) });
  }
}