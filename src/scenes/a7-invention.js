// A7 - 零的发明 / THE INVENTION OF ZERO.   103.19 -> 114.80
// 修订 2：中文优先；y>=520 让给旁白字幕（scrim 从 528 起）
import {
  C, F, TAU, clamp, lerp, seg, ease, text, measureTracked, ring, donut, line,
  glowDot, glowEllipse, gapRing, tickRing, withA, hash1, hash2, mod, mix,
} from '../engine.js';
import { hud } from '../ui.js';

const DUR = 11.61;
const ST1 = 430, ST2 = 1180, ST3 = 1820;
const BAND = 283;
const AXIS = 478;
const NCOL = 6, NROW = 8, EMPTY = 3;
const TAB = { x: 80, y: 118, w: 700, h: 330 };
const R1 = 7.4825, R2 = 8.5575, R3 = 9.6325;

const breath = (t, ph, amt, sp) => 1 + (amt === undefined ? 0.04 : amt) * Math.sin(t * (sp || 1.1) + ph);
const EMPTYX = TAB.x + (TAB.w / NCOL) * (EMPTY + 0.5);

export default {
  id: 'A7-invention',
  start: 103.19,
  end: 114.80,
  draw(ctx, t, env, p) {
    const W = env.w, H = env.h;
    const T = t + 103.19;
    const mA = Math.min(1, 0.66 + 0.34 * seg(t, 0, 0.42)) * (1 - 0.40 * seg(t, 11.22, DUR));
    if (mA < 0.002) return;
    const lift = 0.80 + 0.20 * ease.outCubic(seg(t, 0, 2.4)) + 0.14 * ease.inOutQuad(seg(t, 8.4, DUR));

    const pan = 540 * ease.inOutCubic(seg(t, 2.55, 4.55))
      + 369 * ease.inOutCubic(seg(t, 5.60, 7.30))
      + 12 * ease.inOutQuad(seg(t, 7.30, DUR))
      + 3 * Math.sin(t * 0.6);
    const camY = -14 + 26 * ease.inOutQuad(seg(t, 0, DUR));
    const camS = 1 + 0.030 * ease.inOutQuad(seg(t, 0, DUR));

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(camS, camS);
    ctx.translate(-W / 2 - pan, -H / 2 - camY);

    // ---------------------------------------------------------------- L0 warm lift
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gw = ctx.createLinearGradient(0, -120, 0, 600);
    gw.addColorStop(0, withA(C.amber, 0.012 * lift));
    gw.addColorStop(0.55, withA(C.amber, 0.030 * lift));
    gw.addColorStop(1, withA(C.amber, 0.044 * lift));
    ctx.fillStyle = gw;
    ctx.fillRect(-420, -220, 2700, 1000);
    glowEllipse(ctx, ST1 + 20, BAND - 20, 470, 300, C.amber, 0.055 * lift * mA, 0);
    const bg2 = ctx.createRadialGradient(ST3, 290, 20, ST3, 290, 470);
    bg2.addColorStop(0, withA(C.amber, 0.055 * lift));
    bg2.addColorStop(1, withA(C.amber, 0));
    ctx.fillStyle = bg2;
    ctx.fillRect(ST3 - 520, -180, 1040, 920);
    ctx.restore();

    for (let i = 0; i < 24; i++) {
      const bx = hash1(i * 5.3 + 2) * 2500;
      const sp = 9 + hash1(i * 2.7 + 9) * 16;
      const yy = mod(BAND + 250 - (t * sp + hash1(i * 8.1) * 620), 660) - 140;
      const a = mA * (0.10 + 0.16 * hash1(i * 3.9 + 4)) * (0.55 + 0.45 * Math.sin(t * 1.6 + i));
      ctx.fillStyle = i % 3 === 0 ? withA(C.cyan, a) : withA(C.amber, a);
      const s = 1 + hash1(i * 1.3) * 1.8;
      ctx.fillRect(bx, yy, s, s);
    }

    rubbing(ctx, t, mA, lift);

    // ---------------------------------------------------------------- time axis + chinese station labels
    const axA = mA * ease.outCubic(seg(t, 0.30, 1.20));
    if (axA > 0.002) {
      line(ctx, -420, AXIS, 2600, AXIS, { color: withA(C.bone, 0.20), w: 1, alpha: axA });
      for (let x = -400; x < 2600; x += 62) {
        const big = x % 310 === 0;
        line(ctx, x, AXIS, x, AXIS + (big ? 9 : 4), { color: withA(C.bone, big ? 0.26 : 0.12), w: 1, alpha: axA });
      }
      const STN = [
        { x: ST1, name: '公元前 · 巴比伦', t0: 0.20 },
        { x: ST2, name: '公元后 · 印度', t0: 3.30 },
        { x: ST3, name: '628 年 · 规则', t0: 6.35 },
      ];
      for (const s of STN) {
        const on = ease.outCubic(seg(t, s.t0, s.t0 + 0.6));
        line(ctx, s.x, AXIS - 8, s.x, AXIS + 14, { color: withA(C.amber, 0.6 * (0.35 + 0.65 * on)), w: 1.4, alpha: axA });
        ring(ctx, s.x, AXIS, 3.4 * breath(t, s.x * 0.01, 0.10), 0, TAU, { color: withA(C.amber, 0.85 * on), w: 1, alpha: axA });
        text(ctx, s.name, s.x, AXIS + 32, {
          size: 28, family: F.serif, color: mix(C.bone3, C.bone, on), align: 'center', tracking: 3,
          alpha: axA * breath(t, s.x * 0.02, 0.04), perChar: (i, n) => ({ alpha: ease.outCubic(seg(t, s.t0 + i * 0.04, s.t0 + 0.5 + i * 0.04)) }),
        });
      }
    }

    drawTablet(ctx, t, mA, lift);

    // ---------------------------------------------------------------- the void leaves the column
    const trav = ease.inOutCubic(seg(t, 2.65, 4.55));
    if (trav > 0 && trav < 1) {
      const vx = lerp(EMPTYX, ST2, trav);
      const vy = BAND - 54 * Math.sin(Math.PI * trav);
      const vr = lerp(42, 16, trav);
      glowEllipse(ctx, vx, vy, vr * 2.6, vr * 2.6, C.amber, 0.05 * mA, 0);
      ctx.save();
      ctx.globalAlpha = mA;
      const vg = ctx.createRadialGradient(vx, vy, 0, vx, vy, vr);
      vg.addColorStop(0, withA(C.void, 1));
      vg.addColorStop(0.70, withA(C.void, 0.94));
      vg.addColorStop(1, withA(C.amber, 0.55));
      ctx.fillStyle = vg;
      ctx.beginPath(); ctx.arc(vx, vy, vr, 0, TAU); ctx.fill();
      ctx.restore();
      ring(ctx, vx, vy, vr + 5, 0, TAU, { color: withA(C.amber, 0.45 * (1 - trav * 0.5)), w: 1.1, alpha: mA, dash: [3, 5] });
      ring(ctx, vx, vy, vr + 13, 0, TAU, { color: withA(C.amber, 0.15), w: 1, alpha: mA });
      for (let k = 1; k <= 6; k++) {
        const u2 = Math.max(0, trav - k * 0.030);
        glowDot(ctx, lerp(EMPTYX, ST2, u2), BAND - 54 * Math.sin(Math.PI * u2), 11 - k * 1.3, C.amber, 0.20 * (1 - k / 7) * mA, true);
      }
    }

    // ---------------------------------------------------------------- the slot at II waits
    const wait = ease.outCubic(seg(t, 3.00, 3.75)) * (1 - ease.outCubic(seg(t, 4.45, 4.72)));
    if (wait > 0.004) {
      const wA = mA * wait;
      ring(ctx, ST2, BAND, 54, 0, TAU, { color: withA(C.amber, 0.16), w: 1, alpha: wA, dash: [3, 7] });
      ring(ctx, ST2, BAND, 54, t * 0.5, t * 0.5 + 1.1, { color: withA(C.amber, 0.36), w: 1.4, alpha: wA });
      for (let i = 0; i < 4; i++) {
        const a = Math.PI * 0.25 + i * Math.PI * 0.5;
        line(ctx, ST2 + Math.cos(a) * 62, BAND + Math.sin(a) * 62, ST2 + Math.cos(a) * 74, BAND + Math.sin(a) * 74,
          { color: withA(C.amber, 0.45), w: 1, alpha: wA });
      }
    }

    // ---------------------------------------------------------------- bindu
    const bin = ease.outCubic(seg(t, 4.55, 4.90));
    if (bin > 0.002) {
      const flash = t > 4.55 ? Math.exp(-(t - 4.55) * 4.2) : 0;
      glowDot(ctx, ST2, BAND, 46 + 30 * flash, C.amberHi, 0.30 * bin * mA, false);
      glowDot(ctx, ST2, BAND, 5.5 + 2 * env.beat(T, 3), C.amberHi, 0.95 * bin * mA * (1 - 0.55 * seg(t, 5.9, 6.8)), true);
      if (flash > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glowEllipse(ctx, ST2, BAND, 150 + 120 * (1 - flash), 150 + 120 * (1 - flash), C.amber, 0.10 * flash * mA, 0);
        ctx.restore();
        const kf = seg(t, 4.55, 5.12);
        ring(ctx, ST2, BAND, 5 + 96 * ease.outQuart(kf), 0, TAU,
          { color: withA(C.amberHi, 0.5 * Math.pow(1 - kf, 1.6)), w: 1.2 + 1.4 * (1 - kf), alpha: mA, glow: 16 });
      }
    }
    if (bin > 0.01 && t < 9.9) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const hr = 150 + 90 * ease.outCubic(seg(t, 4.6, 7.2));
      glowEllipse(ctx, ST2, BAND, hr, hr * 0.78, C.amber, 0.105 * bin * mA, 0);
      ctx.restore();
    }

    // ---------------------------------------------------------------- bindu -> 0, with a plain-language label
    const bnote = ease.outCubic(seg(t, 4.95, 5.55)) * (1 - ease.inOutCubic(seg(t, 7.5, 8.1)));
    if (bnote > 0.004) {
      text(ctx, '空位 → 一个点 → 一个数', ST2, 142, {
        size: 26, family: F.serif, color: C.bone, align: 'center', tracking: 2, alpha: mA * bnote * breath(t, 0.7, 0.035),
        perChar: (i, n) => { const e = ease.outCubic(seg(t, 4.95 + i * 0.055, 5.40 + i * 0.055)); return { alpha: e, dy: (1 - e) * 8 }; },
      });
    }

    let rRing = 0, gRing = 0;
    if (t > 4.90) {
      rRing = lerp(4, 118, ease.outCubic(seg(t, 4.90, 6.10)));
      gRing = lerp(0.30, 0.032, ease.inOutCubic(seg(t, 5.02, 6.20)));
    }
    if (t > 9.85) {
      rRing = lerp(118, 90, ease.inOutCubic(seg(t, 9.85, 10.75)));
      gRing = lerp(0.032, 0.210, ease.inOutQuint(seg(t, 9.92, 10.90)));
    }
    if (rRing > 1) {
      const rot = -Math.PI / 2 + t * 0.12;
      const bloom = ease.inOutCubic(seg(t, 9.85, 10.85));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glowEllipse(ctx, ST2, BAND, rRing * 1.35 + 40, rRing * 1.35 + 40, C.amber, (0.05 + 0.10 * bloom) * mA, 0);
      ctx.restore();
      gapRing(ctx, ST2, BAND, rRing, gRing, rot, {
        color: withA(C.amber, 0.94), w: 2.6 + 0.6 * bloom, glow: 18 + 14 * bloom, glowColor: withA(C.amber, 0.8), alpha: mA,
      });
      ring(ctx, ST2, BAND, rRing * 0.62, rot + 0.7, rot + 2.2, { color: withA(C.amberHi, 0.10), w: 1, alpha: mA });
      if (gRing > 0.01) {
        for (const ea of [rot, rot + TAU * gRing]) {
          line(ctx, ST2 + Math.cos(ea) * rRing * 0.98, BAND + Math.sin(ea) * rRing * 0.98,
            ST2 + Math.cos(ea) * rRing * 1.10, BAND + Math.sin(ea) * rRing * 1.10,
            { color: C.verm, w: 1.3, alpha: mA * 0.55 * (0.5 + 0.5 * Math.sin(t * 3.4)), glow: 7 });
        }
      }
      const wf = seg(t, 5.95, 6.30);
      if (wf > 0 && wf < 1) {
        ring(ctx, ST2, BAND, rRing + 30 * wf, 0, TAU, { color: withA(C.amberHi, 0.35 * (1 - wf)), w: 1, alpha: mA });
      }
    }

    // ---------------------------------------------------------------- station III
    const st3 = ease.outCubic(seg(t, 6.30, 7.10));
    const NBX = ST3 - 250;
    const CN_R = ST3 + 40;
    const MT_L = ST3 + 66;
    const VSEP = ST3 - 112;
    if (st3 > 0.002) {
      const s3a = mA * st3 * (1 - 0.20 * ease.inOutCubic(seg(t, 7.30, 8.10)));
      text(ctx, '628', NBX, 240, {
        size: 110, family: F.latin, weight: 300, color: C.bone, align: 'center', tracking: -3,
        alpha: s3a * breath(t, 1.1, 0.03), glow: 24, glowColor: withA(C.amber, 0.5),
        perChar: (i, n) => { const e = ease.outCubic(seg(t, 6.30 + i * 0.13, 6.95 + i * 0.13)); return { alpha: e, dy: (1 - e) * 26 }; },
      });
      text(ctx, 'CE', NBX, 268, { size: 11, family: F.mono, color: withA(C.amber, 0.9), align: 'center', tracking: 5, alpha: s3a * ease.outCubic(seg(t, 6.70, 7.35)) });
      text(ctx, '婆罗摩笈多', NBX, 300, { size: 26, family: F.serif, color: C.bone2, align: 'center', tracking: 3, alpha: s3a * ease.outCubic(seg(t, 6.90, 7.60)) * breath(t, 2.2, 0.04) });

      const vA = s3a * ease.outCubic(seg(t, 7.30, 7.80));
      line(ctx, VSEP, 326, VSEP, 326 + 114 * ease.outCubic(seg(t, 7.30, 7.95)), { color: withA(C.bone, 0.26), w: 1, alpha: vA });

      const RULES = [
        { zh: '加零不变', math: 'a + 0 = a' },
        { zh: '减自己得零', math: 'a - a = 0' },
        { zh: '乘零得零', math: 'a x 0 = 0' },
      ];
      const RT = [R1, R2, R3];
      for (let i = 0; i < 3; i++) {
        const t0 = RT[i];
        const e = ease.outCubic(seg(t, t0, t0 + 0.30));
        if (e <= 0.002) continue;
        const yy = 344 + i * 42 - (1 - e) * 16;
        const hot = ease.outCubic(seg(t, t0, t0 + 0.20));
        text(ctx, RULES[i].zh, CN_R, yy, {
          size: 26, family: F.serif, color: mix(C.amberHi, C.bone, hot), align: 'right', tracking: 2,
          alpha: mA * e * breath(t, i * 1.9, 0.03),
        });
        text(ctx, RULES[i].math, MT_L, yy, {
          size: 22, family: F.mono, color: mix(C.cyanHi, C.bone2, hot), tracking: 3,
          alpha: mA * e * breath(t, i * 1.9 + 1.1, 0.03),
        });
      }
    }

    // ---------------------------------------------------------------- closing line
    const endA = mA * ease.outCubic(seg(t, 10.70, 11.25));
    if (endA > 0.002) {
      text(ctx, '零，从空缺变成图形。', ST2, 142, {
        size: 26, family: F.serif, color: C.bone, align: 'center', tracking: 3, alpha: endA * breath(t, 0.7, 0.035),
        perChar: (i, n) => { const e = ease.outCubic(seg(t, 10.42 + i * 0.042, 10.86 + i * 0.042)); return { alpha: e, dy: (1 - e) * 9 }; },
      });
    }

    ctx.restore();

    hud(ctx, T, env, { code: 'HZ / A7', label: 'THE INVENTION OF ZERO', accent: C.amber, alpha: 0.94 });
  },
};

function rubbing(ctx, t, mA, lift) {
  const off = mod(t * 7.5, 120);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 23; c++) {
      const bx = c * 120 + off + (r % 2) * 58 - 60;
      const by = 78 + r * 46;
      const h = hash2(c * 3.7 + 1, r * 5.1 + 2);
      const len = 26 + h * 56;
      line(ctx, bx, by, bx + len, by, { color: withA(C.amber, 0.070 * lift), w: 1, alpha: mA });
      if (h > 0.58) line(ctx, bx + 7, by - 3, bx + 7, by + 2, { color: withA(C.amber, 0.058 * lift), w: 1, alpha: mA });
    }
  }
}

function drawTablet(ctx, t, mA, lift) {
  const { x, y, w, h } = TAB;
  const a0 = ease.outCubic(seg(t, 0.02, 0.55)) * mA;
  if (a0 < 0.002) return;

  ctx.save();
  ctx.globalAlpha = mA;
  const g = ctx.createLinearGradient(x, y, x + w * 0.35, y + h);
  g.addColorStop(0, withA(C.slate, 0.96));
  g.addColorStop(0.45, withA(C.ink, 0.97));
  g.addColorStop(1, withA(C.abyss, 0.97));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'lighter';
  const gl = ctx.createLinearGradient(x, y, x + w * 0.7, y + h);
  gl.addColorStop(0, withA(C.amber, 0.050 * lift));
  gl.addColorStop(0.5, withA(C.amber, 0.018 * lift));
  gl.addColorStop(1, withA(C.amber, 0.036 * lift));
  ctx.fillStyle = gl;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  line(ctx, x, y, x + w, y, { color: withA(C.amberD, 0.95), w: 1.8, alpha: a0 });
  line(ctx, x, y + h, x + w, y + h, { color: withA(C.amberD, 0.95), w: 1.8, alpha: a0 });
  line(ctx, x, y, x, y + h, { color: withA(C.amberD, 0.95), w: 1.8, alpha: a0 });
  line(ctx, x + w, y, x + w, y + h, { color: withA(C.amberD, 0.95), w: 1.8, alpha: a0 });
  line(ctx, x + 7, y + 7, x + w - 7, y + 7, { color: withA(C.amberD, 0.30), w: 1, alpha: a0 });
  line(ctx, x + 7, y + h - 7, x + w - 7, y + h - 7, { color: withA(C.amberD, 0.30), w: 1, alpha: a0 });

  const cw = w / NCOL, rh = h / NROW;
  const rx = x + cw * EMPTY;

  const rec = ease.outCubic(seg(t, 0.20, 0.80));
  if (rec > 0.002) {
    ctx.save();
    ctx.globalAlpha = mA;
    const rg = ctx.createLinearGradient(rx, 0, rx + cw, 0);
    rg.addColorStop(0, withA(C.void, 0.74 * rec));
    rg.addColorStop(0.5, withA(C.void, 0.52 * rec));
    rg.addColorStop(1, withA(C.void, 0.74 * rec));
    ctx.fillStyle = rg;
    ctx.fillRect(rx + 1, y + 6, cw - 2, h - 12);
    ctx.restore();
  }

  for (let r = 0; r <= NROW; r++) {
    const p = ease.outCubic(seg(t, 0.22 + r * 0.038, 0.78 + r * 0.038));
    if (p <= 0.002) continue;
    line(ctx, x + 5, y + rh * r, x + 5 + (w - 10) * p, y + rh * r, { color: withA(C.amberD, 0.62), w: 1, alpha: a0 * 0.95 });
  }
  for (let c = 0; c <= NCOL; c++) {
    const p = ease.outCubic(seg(t, 0.30 + c * 0.042, 0.88 + c * 0.042));
    if (p <= 0.002) continue;
    const near = (c === EMPTY || c === EMPTY + 1);
    line(ctx, x + cw * c, y + 5, x + cw * c, y + 5 + (h - 10) * p,
      { color: withA(C.amberD, near ? 0.40 : 0.70), w: 1, alpha: a0 * (near ? 0.85 : 1), dash: near ? [4, 6] : null });
  }

  for (let r = 0; r < NROW; r++) {
    for (let c = 0; c < NCOL; c++) {
      if (c === EMPTY) continue;
      const st = 0.40 + r * 0.044 + c * 0.038;
      const p = ease.outCubic(seg(t, st, st + 0.34));
      if (p <= 0.002) continue;
      const cx = x + cw * c, cy = y + rh * r;
      const n = 2 + Math.floor(hash2(c * 3.1 + 1, r * 5.7 + 2) * 3);
      for (let k = 0; k < n; k++) {
        const f = hash2(c * 7.3 + k, r * 2.9 + k * 1.7);
        const len = (cw - 16) * (0.30 + 0.62 * f);
        const yy = cy + rh * (0.26 + k * 0.19);
        line(ctx, cx + 9, yy, cx + 9 + len * p, yy, { color: withA(C.amber, 0.70), w: 1.6, alpha: a0 * (0.78 + 0.22 * f) });
        if (f > 0.62) line(ctx, cx + 9 + len * p, yy - 3, cx + 9 + len * p, yy + 1, { color: withA(C.amber, 0.50), w: 1, alpha: a0 });
      }
    }
  }

  // ---- the column is named in plain chinese
  const mk = ease.outCubic(seg(t, 1.20, 1.85));
  if (mk > 0.002) {
    const nA = mA * mk;
    ctx.save();
    ctx.globalAlpha = nA * 0.75;
    ctx.setLineDash([6, 7]);
    ctx.strokeStyle = withA(C.verm, 0.85);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(rx + 3, y + 7, cw - 6, h - 14);
    ctx.restore();
    line(ctx, rx + cw * 0.5, y + 12, rx + cw * 0.5, y + h - 12, { color: withA(C.verm, 0.10), w: 10, alpha: nA });
    chevron(ctx, EMPTYX, y + 16, y + 36, C.verm, nA * 0.95);
    chevron(ctx, EMPTYX, y + h - 16, y + h - 36, C.verm, nA * 0.95);
    text(ctx, '这一列，什么都没写', EMPTYX, y - 14, {
      size: 32, family: F.serif, color: C.verm, align: 'center', tracking: 3, alpha: nA * breath(t, 0.4, 0.035),
      perChar: (i, n) => { const e = ease.outCubic(seg(t, 1.20 + i * 0.045, 1.65 + i * 0.045)); return { alpha: e, dy: (1 - e) * 8 }; },
    });
  }

  // ---- the seal comes down on the empty slot
  const sealT = 2.02;
  if (t > sealT - 0.02) {
    const down = ease.inCubic(seg(t, sealT, sealT + 0.36));
    const hit = seg(t, sealT + 0.36, sealT + 0.42);
    const after = seg(t, sealT + 0.36, sealT + 1.0);
    const impr = t > sealT + 0.36 ? 0.85 * (1 - 0.62 * after) : 0.9;
    const sy = lerp(BAND - 190, BAND, down);
    const sc = lerp(1.45, 1, ease.outCubic(seg(t, sealT, sealT + 0.36)));
    const squash = t > sealT + 0.36 ? 1 - 0.22 * Math.exp(-(t - sealT - 0.36) * 18) : 1;
    ctx.save();
    ctx.translate(EMPTYX, sy);
    ctx.scale(sc * (2 - squash), sc * squash);
    ctx.globalAlpha = mA * impr * (t < sealT + 0.36 ? ease.outCubic(seg(t, sealT, sealT + 0.2)) : 1);
    const R = 46;
    ring(ctx, 0, 0, R, 0, TAU, { color: withA(C.verm, 0.9), w: 2.2, alpha: 1 });
    ring(ctx, 0, 0, R * 0.74, 0, TAU, { color: withA(C.verm, 0.7), w: 1.2, alpha: 1 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + 0.2;
      line(ctx, Math.cos(a) * R * 0.76, Math.sin(a) * R * 0.76, Math.cos(a) * R * 0.93, Math.sin(a) * R * 0.93,
        { color: withA(C.verm, 0.8), w: 1.6, alpha: 1 });
    }
    ctx.restore();
    if (t > sealT + 0.36) {
      const k = seg(t, sealT + 0.36, sealT + 1.05);
      if (k < 1) {
        ring(ctx, EMPTYX, BAND, 46 + 90 * ease.outQuart(k), 0, TAU,
          { color: withA(C.vermHi, 0.42 * (1 - k)), w: 1 + 2 * (1 - k), alpha: mA, glow: 12 });
      }
    }
  }
}

function chevron(ctx, x, y0, y1, col, a) {
  const dir = y1 > y0 ? 1 : -1;
  line(ctx, x, y0, x, y1, { color: withA(col, 0.85), w: 1.4, alpha: a });
  line(ctx, x - 7, y1 - dir * 8, x, y1, { color: withA(col, 0.85), w: 1.4, alpha: a });
  line(ctx, x + 7, y1 - dir * 8, x, y1, { color: withA(col, 0.85), w: 1.4, alpha: a });
}
