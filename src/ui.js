
// ui.js - persistent information layer: HUD, brackets, annotations
import { C, F, TAU, clamp, seg, segE, ease, text, line, rect, withA, mod } from './engine.js';

// thin corner brackets + edge annotations. opts:{act, label, code, accent, alpha}
export function hud(ctx, t, env, o) {
  o = o || {};
  const W = env.w, H = env.h;
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.001) return;
  const m = 40;
  const len = 26;
  const ac = o.accent || C.amber;
  const col = withA(ac, 0.52);
  ctx.save();
  ctx.globalAlpha = a;
  // corner brackets
  const br = (x, y, sx, sy) => {
    line(ctx, x, y, x + len * sx, y, { color: col, w: 1 });
    line(ctx, x, y, x, y + len * sy, { color: col, w: 1 });
  };
  br(m, m, 1, 1); br(W - m, m, -1, 1); br(m, H - m, 1, -1); br(W - m, H - m, -1, -1);
  // top-left act code
  const code = o.code || 'HZ / 00';
  text(ctx, code, m + 14, m + 22, { size: 11, family: F.mono, color: withA(ac, 0.85), tracking: 4 });
  // top-right label
  if (o.label) text(ctx, o.label, W - m - 14, m + 22, { size: 11, family: F.mono, color: withA(C.bone2, 0.68), tracking: 3, align: 'right' });
  // bottom-left: running time
  const tt = Math.max(0, t);
  const mm = Math.floor(tt / 60), ss = tt - mm * 60;
  const tc = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss.toFixed(1).padStart(4, '0');
  text(ctx, tc, m + 14, H - m - 6, { size: 10, family: F.mono, color: withA(C.bone2, 0.30), tracking: 3 });
  // bottom-right: tick strip progress
  const total = env.duration || 150.4;
  const pw = 168;
  const x0 = W - m - 14 - pw, y0 = H - m - 12;
  line(ctx, x0, y0, x0 + pw, y0, { color: withA(C.bone, 0.10), w: 1 });
  line(ctx, x0, y0, x0 + pw * clamp(t / total), y0, { color: withA(ac, 0.55), w: 1 });
  for (let i = 0; i <= 8; i++) line(ctx, x0 + pw * i / 8, y0 - 3, x0 + pw * i / 8, y0 + 1, { color: withA(C.bone, 0.14), w: 1 });
  ctx.restore();
}

// vertical serif strip on the left edge
export function sideTitle(ctx, t, env, str, o) {
  o = o || {};
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.001) return;
  const x = o.x || 62, y0 = o.y || 150;
  ctx.save(); ctx.globalAlpha = a;
  const step = o.step || 30;
  for (let i = 0; i < str.length; i++) {
    const q = ease.outCubic(seg(t, (o.delay || 0) + i * 0.07, (o.delay || 0) + i * 0.07 + 0.7));
    text(ctx, str[i], x, y0 + i * step, { size: o.size || 19, family: F.serif, color: withA(o.color || C.bone, 0.55), alpha: q, align: 'center' });
  }
  ctx.restore();
}

// a thin measurement line with label, gives scale
export function measure(ctx, x1, y1, x2, y2, label, o) {
  o = o || {};
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.001) return;
  const col = withA(o.color || C.bone, 0.30);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
  ctx.save(); ctx.globalAlpha = a;
  line(ctx, x1, y1, x2, y2, { color: col, w: 1 });
  for (const [px, py] of [[x1, y1], [x2, y2]]) {
    line(ctx, px - nx * 5, py - ny * 5, px + nx * 5, py + ny * 5, { color: col, w: 1 });
  }
  if (label) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const lw = label.length * 7.2;
    ctx.fillStyle = 'rgba(4,6,10,0.72)';
    ctx.fillRect(mx - lw / 2 - 5, my - 8, lw + 10, 16);
    text(ctx, label, mx, my + 4, { size: 10, family: F.mono, color: withA(o.color || C.bone, 0.62), tracking: 2, align: 'center' });
  }
  ctx.restore();
}

// a callout: dot -> elbow line -> mono label
export function callout(ctx, x, y, tx, ty, label, o) {
  o = o || {};
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.001) return;
  const col = withA(o.color || C.amber, 0.55);
  const grow = o.grow === undefined ? 1 : o.grow;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, o.dot || 2.4, 0, TAU); ctx.fill();
  const ex = x + (tx - x) * grow, ey = y + (ty - y) * grow;
  const elbowX = x + (tx > x ? 1 : -1) * Math.min(Math.abs(tx - x), 34);
  ctx.strokeStyle = col; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(elbowX, ey); ctx.lineTo(ex, ey); ctx.stroke();
  if (grow > 0.7) text(ctx, label, ex + (tx > x ? 8 : -8), ey + 3.5, { size: 11, family: F.mono, color: withA(o.color || C.amber, 0.85), tracking: 1.4, align: tx > x ? 'left' : 'right', alpha: (grow - 0.7) / 0.3 });
  ctx.restore();
}

// fine coordinate grid, very low contrast; adds "instrument" texture
export function coordGrid(ctx, t, env, o) {
  o = o || {};
  const a = o.alpha === undefined ? 1 : o.alpha;
  if (a <= 0.001) return;
  const step = o.step || 64;
  const col = withA(o.color || C.cyan, 0.055 * a);
  ctx.save();
  ctx.strokeStyle = col; ctx.lineWidth = 1;
  const ox = mod(t * (o.drift === undefined ? 2.2 : o.drift), step);
  ctx.beginPath();
  for (let x = -step + ox; x < env.w + step; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, env.h); }
  for (let y = 0; y < env.h + step; y += step) { ctx.moveTo(0, y); ctx.lineTo(env.w, y); }
  ctx.stroke();
  // crosshair marks every 4 cells
  if (o.marks !== false) {
    ctx.strokeStyle = withA(o.color || C.cyan, 0.10 * a);
    for (let x = -step * 4 + ox; x < env.w + step * 4; x += step * 4) {
      for (let y = step * 2; y < env.h; y += step * 4) {
        ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// soft big ghost numeral for depth, cropped by the frame
export function ghostNumeral(ctx, t, env, str, o) {
  o = o || {};
  const a = o.alpha === undefined ? 0.05 : o.alpha;
  if (a <= 0.001) return;
  const x = o.x || 980, y = o.y || 620;
  const s = o.size || 520;
  const wob = Math.sin(t * 0.21) * (o.wob === undefined ? 14 : o.wob);
  text(ctx, str, x + wob, y + Math.cos(t * 0.17) * 8, { size: s, family: F.latin, color: withA(o.color || C.bone, a), align: o.align || 'right', tracking: -6 });
}
