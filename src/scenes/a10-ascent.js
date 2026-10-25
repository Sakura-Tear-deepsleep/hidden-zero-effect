
// A10 - 升华 / ascent. 132.08 -> 148.30
// one choice is one dot among thousands; zoom into it and it is the same choice again.
import { C, F, TAU, clamp, lerp, seg, segE, ease, text, ring, donut, line, poly, rect, glowDot, glowEllipse, tickRing, withA, hash1, hash2, mulberry32, mod } from '../engine.js';
import { hud } from '../ui.js';

const CX = 640, CY = 344, N = 620;

export default {
  id: 'A10-ascent',
  start: 132.08,
  end: 148.30,
  fadeIn: 0.30,
  draw(ctx, t, env, p) {
    const collapse = ease.inCubic(seg(t, 14.35, 15.9));
    const zoomOut = ease.inOutCubic(seg(t, 8.30, 9.30));      // the opened frame becomes a dot again
    const S = (1 - 0.30 * ease.inOutCubic(seg(t, 0.4, 7.0))) * (1 - 0.95 * collapse);
    const alphaAll = 1 - seg(t, 15.75, 16.2);

    // ---------- depth fog ----------
    ctx.save();
    const fg = ctx.createRadialGradient(CX, CY, 40, CX, CY, 620);
    fg.addColorStop(0, withA('#0B1A22', 0.50));
    fg.addColorStop(1, withA('#04060A', 0));
    ctx.fillStyle = fg; ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alphaAll;
    ctx.translate(CX, CY + 40 * collapse);
    ctx.scale(S, S);
    ctx.translate(-CX, -CY);

    const spin = t * 0.036;
    const grow = ease.inOutCubic(seg(t, 0.5, 7.5));
    const beatSwell = Math.pow(1 - ((t / 0.5375) % 1), 2.4) * ease.inOutQuad(seg(t, 1.2, 2.6));
    const innerR = (128 + 46 * grow) * (1 - 0.012 * beatSwell);
    const outerR = (330 + 170 * grow) * (1 + 0.020 * beatSwell);

    // ---------- annulus glow ----------
    const ga = ease.inOutQuad(seg(t, 0.9, 4.4)) * (1 - 0.35 * seg(t, 8.4, 10.0));
    if (ga > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.save(); ctx.translate(CX, CY); ctx.scale(1, 0.82);
      const gg = ctx.createRadialGradient(0, 0, innerR * 0.55, 0, 0, outerR * 1.05);
      gg.addColorStop(0, withA(C.amber, 0));
      gg.addColorStop(0.44, withA(C.amber, 0.040 * ga));
      gg.addColorStop(0.72, withA(C.amberHi, 0.090 * ga));
      gg.addColorStop(0.90, withA(C.amber, 0.042 * ga));
      gg.addColorStop(1, withA(C.amber, 0));
      ctx.fillStyle = gg; ctx.fillRect(-outerR * 1.2, -outerR * 1.2, outerR * 2.4, outerR * 2.4);
      ctx.restore(); ctx.restore();
    }

    // ---------- beat shockwaves ----------
    const beatA = ease.inOutQuad(seg(t, 1.4, 2.6)) * (1 - seg(t, 11.6, 12.8));
    if (beatA > 0.01) {
      for (let b = 0; b < 4; b++) {
        const tb = (Math.floor((t - env.grid.phase) / env.grid.period) - b) * env.grid.period + env.grid.phase;
        const age = t - tb;
        if (age < 0 || age > 2.2) continue;
        const q = age / 2.2;
        const rr = lerp(innerR * 0.55, outerR * 1.26, ease.outCubic(q));
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ring(ctx, CX, CY, rr, 0, TAU, { color: withA(C.amberHi, 0.070 * beatA * (1 - q) * (1 - q)), w: 1.6 });
        ctx.restore();
      }
    }

    // ---------- the dot field ----------
    const wave = ease.inOutQuad(seg(t, 8.8, 11.2));
    for (let k = 0; k < N; k++) {
      const st = 0.25 + (k / N) * 2.8;
      const ap = ease.outCubic(seg(t, st, st + 0.9));
      if (ap <= 0.01) continue;
      const h1 = hash1(k * 3.71), h2 = hash1(k * 9.13), h3 = hash1(k * 5.37);
      const baseR = lerp(innerR, outerR, Math.sqrt(h1));
      const drift = 7 * Math.sin(t * 0.5 + k * 1.7) * (0.3 + h2);
      const ang = k * 2.39996 + spin * (0.7 + 0.6 * h3);
      const rr = baseR + drift;
      const x = CX + Math.cos(ang) * rr;
      const y = CY + Math.sin(ang) * rr * 0.82;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + h2 * 2.2) + k));
      const sz = (0.9 + h3 * 2.2) * (0.85 + 0.35 * tw);
      const a = ap * (0.42 + 0.58 * h2) * (0.60 + 0.40 * tw);
      ctx.globalAlpha = a * alphaAll;
      ctx.fillStyle = h3 > 0.94 ? C.verm : (h3 > 0.78 ? C.amberHi : C.amber);
      ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      // every 9th dot: a tiny broken ring; its missing wedge flares in waves
      if (k % 9 === 0) {
        const waveHit = wave > 0 ? Math.max(0, Math.sin(ang * 3.0 + t * 1.4)) * wave : 0;
        const mr = 5.0 + 4 * h2;
        ctx.globalAlpha = a * 0.70 * alphaAll;
        ring(ctx, x, y, mr, ang, ang + TAU * 0.76, { color: withA(C.bone, 0.55), w: 1 });
        if (waveHit > 0.02) {
          ctx.globalAlpha = a * 0.75 * waveHit * alphaAll;
          ctx.fillStyle = C.vermHi;
          ctx.fillRect(x - 1.4, y - 1.4, 2.8, 2.8);
        }
        ctx.globalAlpha = a * alphaAll;
      }
    }
    ctx.globalAlpha = alphaAll;

    // ---------- focal stars ----------
    const fsA = ease.outCubic(seg(t, 3.0, 4.6));
    if (fsA > 0.01) {
      const focals = [[0.16, 0.20, 3.0], [0.86, 0.15, 2.2], [0.74, 0.84, 2.6], [0.13, 0.78, 1.8]];
      for (let i = 0; i < focals.length; i++) {
        const [fx, fy, fs] = focals[i];
        const px = CX + (fx - 0.5) * outerR * 1.5 + Math.sin(t * 0.3 + i) * 8;
        const py = CY + (fy - 0.5) * outerR * 1.1 + Math.cos(t * 0.26 + i) * 7;
        glowDot(ctx, px, py, 16 * fs * (0.85 + 0.15 * Math.sin(t * 1.2 + i * 2)), C.amberHi, 0.18 * fsA, true);
        glowDot(ctx, px, py, 2.0 * fs, C.white, 0.85 * fsA, true);
      }
    }

    // ---------- the ribbon of choices crossing the frame (2.4 -> 6.2) ----------
    const ribA = ease.outCubic(seg(t, 2.4, 3.4)) * (1 - seg(t, 6.4, 7.4));
    if (ribA > 0.01) {
      const span = 1500;
      const head = lerp(1360, -240, ease.inOutCubic(seg(t, 2.4, 6.6)));
      for (let i = 0; i < 7; i++) {
        const fx = head + i * 186;
        if (fx < -140 || fx > 1340) continue;
        const w = 128, h = 78;
        ctx.save();
        ctx.globalAlpha = ribA * (0.55 + 0.45 * Math.sin(i * 1.9 + t * 2));
        ctx.strokeStyle = withA(C.bone, 0.30); ctx.lineWidth = 1;
        ctx.strokeRect(fx - w / 2, CY - h / 2, w, h);
        // A / B mini pair
        ctx.fillStyle = withA(C.amber, 0.55); ctx.fillRect(fx - w / 2 + 8, CY - 12, 30, 24);
        ctx.fillStyle = withA(C.cyan, 0.55); ctx.fillRect(fx + 8, CY - 12, 20, 24);
        ctx.restore();
      }
    }

    // ---------- one frame opens (5.4 -> 8.4) then becomes a dot again ----------
    const openP = ease.outCubic(seg(t, 5.4, 6.6));
    if (openP > 0.01) {
      const w = lerp(128, 420, openP) * (1 - 0.94 * zoomOut);
      const h2 = lerp(78, 250, openP) * (1 - 0.94 * zoomOut);
      const dimOther = 1 - 0.55 * openP * (1 - zoomOut);
      ctx.save();
      ctx.globalAlpha = alphaAll * (1 - seg(t, 8.3, 8.9));
      // scrim behind the opened frame
      if (openP > 0.5) {
        ctx.globalAlpha *= 0.9;
        ctx.fillStyle = 'rgba(3,6,11,' + (0.55 * (openP - 0.5) * 2 * (1 - zoomOut)).toFixed(3) + ')';
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = alphaAll;
      }
      ctx.strokeStyle = withA(C.amberHi, 0.55); ctx.lineWidth = 1.4;
      ctx.strokeRect(CX - w / 2, CY - h2 / 2, w, h2);
      // corner ticks
      const L = Math.min(18, w * 0.12);
      ctx.strokeStyle = withA(C.amber, 0.9); ctx.lineWidth = 2;
      for (const [x, y, sx, sy] of [[CX - w / 2, CY - h2 / 2, 1, 1], [CX + w / 2, CY - h2 / 2, -1, 1], [CX - w / 2, CY + h2 / 2, 1, -1], [CX + w / 2, CY + h2 / 2, -1, -1]]) {
        ctx.beginPath(); ctx.moveTo(x + L * sx, y); ctx.lineTo(x, y); ctx.lineTo(x, y + L * sy); ctx.stroke();
      }
      // the two options inside, legible
      if (openP > 0.75) {
        const ta = (openP - 0.75) / 0.25 * (1 - seg(t, 7.45, 7.75));
        ctx.globalAlpha = alphaAll * ta;
        ctx.save();
        ctx.translate(CX, CY); ctx.scale(w / 420, w / 420); ctx.translate(-CX, -CY);
        const lx = CX - 168, rx = CX + 21;
        text(ctx, 'A', lx, CY - h2 * 0.20, { size: 30, family: F.latin, color: C.amberHi });
        text(ctx, '100% 得 98 元', lx + 34, CY - h2 * 0.17, { size: 24, family: F.sans, color: C.bone, tracking: 1 });
        text(ctx, 'B', rx, CY + h2 * 0.22, { size: 30, family: F.latin, color: C.cyanHi });
        text(ctx, '27% 得 367 元', rx + 34, CY + h2 * 0.25, { size: 24, family: F.sans, color: C.bone, tracking: 1 });
        text(ctx, '73% 得 0 元', rx + 34, CY + h2 * 0.25 + 34, { size: 22, family: F.sans, color: withA(C.vermHi, 0.95), tracking: 1 });
        ctx.restore();
        ctx.globalAlpha = alphaAll;
      }
      ctx.restore();
      // after it collapses back into a dot, a single bright point remains
      if (zoomOut > 0.6) glowDot(ctx, CX, CY, 26 * (1 - zoomOut) + 4, C.white, 0.9 * zoomOut, true);
    }

    // ---------- the giant ghost 零 behind ----------
    const gzA = ease.outCubic(seg(t, 11.0, 12.6)) * (1 - seg(t, 14.4, 15.4));
    if (gzA > 0.01) {
      text(ctx, '零', CX, CY + 150, { size: 430, family: F.serif, color: withA(C.bone, 0.055 * gzA), align: 'center', tracking: 30 });
    }

    // ---------- collapse flash ----------
    const fl = seg(t, 14.85, 15.35) * (1 - seg(t, 15.35, 15.9));
    if (fl > 0.01) {
      glowDot(ctx, CX, CY, 280 * (1 + 0.5 * fl), C.amberHi, 0.50 * fl, true);
      glowDot(ctx, CX, CY, 10, C.white, 0.95 * fl, true);
    }
    ctx.restore();

    hud(ctx, t, env, { code: 'HZ / 10', label: 'ASCENT  -  ONE DOT AMONG THOUSANDS', accent: C.amber, alpha: 0.85 * (1 - seg(t, 14.6, 15.4)) });
  },
};
