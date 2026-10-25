// A4 — 实验 / the study as an instrument panel.   65.85 -> 83.03   (17.18 s)
// 事件表（本镜局部秒）：
//  0.00 顶部 mono 信息条 + 计数器 0→197（落位过冲）
//  0.28 轴线生长；0.44 图例（26px 中文）入场；0.45 眼动卡入场
//  1.285 组1「隐藏零」柱生长；1.822 组1「呈现零」柱生长；2.4 提升箭头
//  3.435 组2「隐藏零」柱；3.972 组2「呈现零」柱；3.435 两个选项框
//  6.60–9.40 注视轨迹逐点画出；7.80 热斑呼吸
// 10.15 两组柱上方各出中文结论条（32px）「高风险 上升」「低风险 上升」
// 12.15 热斑汇聚成点；13.30–14.15 一条线连到「呈现零」柱 + 26px「注意力流向这里」
// 14.15 四柱合并成两柱 + 上扬箭头 + 34px「呈现零，选择风险项的人变多」
// 15.50 出处行（y=578，不进字幕带）
import {
  C, F, TAU, clamp, lerp, seg, ease, text, ring, donut, line, rect, poly,
  glowDot, glowEllipse, withA, mod, vnoise, revealChars, mulberry32,
} from '../engine.js';
import { coordGrid } from '../ui.js';

const AXIS_Y = 548;
const BAR_W = 56, BAR_GAP = 24, BAR_MAX = 140;
const G1X = 150, G2X = 400;
const H_HID = 0.58, H_SHO = 0.83;          // 比值 1.43，不标具体百分比
const CARD = { x: 700, y: 176, w: 500, h: 234 };
const MX1 = 300, MX2 = 410, MW = 62;       // 80.0 合并后的两根柱

export default {
  id: 'A4-experiment',
  start: 65.85,
  end: 83.03,
  draw(ctx, t, env, p) {
    const q = ease.inOutQuad(seg(t, 0, 17.18));
    ctx.save();
    ctx.translate(646 + Math.sin(t * 0.157) * 3.4 + 9 * q,
                  356 + Math.cos(t * 0.113) * 2.6 - 5 * q);
    ctx.scale(1 + 0.034 * q, 1 + 0.034 * q);
    ctx.translate(-646, -356);

    ctx.save();
    ctx.globalAlpha = 0.85;
    coordGrid(ctx, t, env, { alpha: 0.5, step: 64, drift: 1.7 });
    ctx.restore();

    strip(ctx, t, env);
    hero(ctx, t, env);
    chart(ctx, t, env);
    eyeCard(ctx, t, env);
    merge(ctx, t, env);
    tail(ctx, t, env);

    ctx.restore();
  },
};

// ───────────────────────────────── 顶部信息条
function strip(ctx, t, env) {
  const ys = 92;
  const items = [[96, 'TWO STUDIES'], [232, 'EYE-TRACKING'], [392, 'COMPUTATIONAL MODEL']];
  const flick = 0.94 + 0.06 * Math.sin(t * 1.7);
  items.forEach(([x, s], i) => {
    const a = ease.outCubic(seg(t, 0 + i * 0.08, 0.40 + i * 0.08)) * flick;
    text(ctx, s, x, ys, {
      size: 11, family: F.mono, tracking: 3.2,
      color: withA(i === 0 ? C.cyan : C.bone2, (i === 0 ? 0.9 : 0.65) * a), alpha: a,
    });
    if (i > 0) line(ctx, x - 22, ys - 9, x - 22, ys + 1, { color: withA(C.bone, 0.14 * a), w: 1 });
  });
  const rl = ease.outCubic(seg(t, 0, 0.62));
  line(ctx, 96, 108, lerp(96, 1184, rl), 108, { color: withA(C.bone, 0.14), w: 1 });
  text(ctx, 'RISKY CHOICE / 2026', 1184, ys, {
    size: 11, family: F.mono, tracking: 3.2, align: 'right',
    color: withA(C.steel, 0.8), alpha: ease.outCubic(seg(t, 0.1, 0.7)),
  });
}

// ───────────────────────────────── 197
function hero(ctx, t, env) {
  const cu = ease.outCubic(seg(t, 0.0, 1.55));
  const n = Math.round(197 * cu);
  const over = t > 1.55 ? Math.exp(-(t - 1.55) * 5.5) * Math.sin((t - 1.55) * 16) * 0.045 : 0;
  const pulse = 1 + over + 0.005 * Math.sin(t * 1.15);
  ctx.save();
  ctx.translate(96, 250);
  ctx.scale(pulse, pulse);
  text(ctx, String(n), 0, 0, {
    size: 168, family: F.latin, weight: 300, tracking: -4,
    color: C.bone, glow: 18, glowColor: withA(C.cyan, 0.26),
  });
  ctx.restore();
  text(ctx, 'PARTICIPANTS', 104, 274, {
    size: 11, family: F.mono, tracking: 5, color: withA(C.bone2, 0.92),
    alpha: ease.outCubic(seg(t, 0.9, 1.5)),
  });
}

// ───────────────────────────────── 柱状图
function chart(ctx, t, env) {
  const beat = env.beat(env.t, 2);
  const mg = ease.inOutQuad(seg(t, 14.15, 14.62));     // 14.15 起合并
  const grpA = 1 - mg;                                  // 两组柱的可见度

  const ax = ease.outCubic(seg(t, 0.28, 1.02));
  if (ax > 0.001) {
    line(ctx, 120, AXIS_Y, lerp(120, 620, ax), AXIS_Y, { color: withA(C.bone, 0.24), w: 1 });
  }

  // 图例（中文 26px，英文 11 装饰）
  const lg = ease.outCubic(seg(t, 0.44, 1.12)) * grpA;
  if (lg > 0.004) {
    const legend = (x, swatch, zh, en) => {
      ctx.save();
      ctx.globalAlpha = lg;
      ctx.fillStyle = withA(swatch, 0.8);
      ctx.fillRect(x, 304, 12, 12);
      ctx.restore();
      text(ctx, zh, x + 22, 318, {
        size: 26, family: F.sans, tracking: 2, color: withA(C.bone, 0.92), alpha: lg,
      });
      text(ctx, en, x + 22 + zh.length * 26 + 18, 318, {
        size: 11, family: F.mono, tracking: 2.6, color: withA(C.steel, 0.9), alpha: lg,
      });
    };
    legend(150, C.steel, '隐藏零', 'HIDDEN ZERO');
    legend(372, C.amber, '呈现零', 'SHOWN ZERO');
  }

  // 两组柱 + 中文结论条
  const groups = [
    { x: G1X, cond: '高风险', range: 'HIGH RISK · 5–30%', t0: 1.285, t1: 1.822 },
    { x: G2X, cond: '低风险', range: 'LOW RISK · 70–95%', t0: 3.435, t1: 3.972 },
  ];
  for (const g of groups) {
    // 条件（英文装饰）
    const la = ease.outCubic(seg(t, g.t0 - 0.45, g.t0 + 0.10)) * grpA;
    text(ctx, g.range, g.x, 354, {
      size: 11, family: F.mono, tracking: 3, color: withA(C.bone2, 0.85 * la), alpha: la,
    });
    // 中文结论条：10.15 起
    const ba = ease.outCubic(seg(t, 10.15, 10.95)) * grpA;
    if (ba > 0.004) {
      const cx = g.x + BAR_W + BAR_GAP / 2;
      text(ctx, g.cond + '  上升', cx, 392, {
        size: 32, family: F.serif, tracking: 3, align: 'center',
        color: withA(C.amberHi, 0.97), glow: 12, glowColor: withA(C.amber, 0.35), alpha: ba,
      });
      const rw = 96 * ease.outCubic(seg(t, 10.15, 11.1));
      line(ctx, cx - rw, 402, cx + rw, 402, { color: withA(C.amber, 0.5 * ba), w: 1 });
      // 上扬小箭头
      const aa = ba * (0.7 + 0.3 * beat);
      ctx.save();
      ctx.globalAlpha = aa;
      ctx.strokeStyle = C.amberHi;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      const ax2 = g.x + BAR_W * 2 + BAR_GAP + 12, ay2 = 392;
      ctx.beginPath();
      ctx.moveTo(ax2, ay2); ctx.lineTo(ax2, ay2 - 20);
      ctx.moveTo(ax2, ay2 - 20); ctx.lineTo(ax2 - 5, ay2 - 12);
      ctx.moveTo(ax2, ay2 - 20); ctx.lineTo(ax2 + 5, ay2 - 12);
      ctx.stroke();
      ctx.restore();
    }
    // 柱
    const p1 = ease.outCubic(seg(t, g.t0, g.t0 + 0.52));
    const h1 = H_HID * BAR_MAX * (1 + 0.008 * Math.sin(t * 0.9 + g.x));
    bar(ctx, g.x, h1, p1 * grpA, C.steel, 0.7);
    const p2 = ease.outCubic(seg(t, g.t1, g.t1 + 0.52));
    const h2 = H_SHO * BAR_MAX * (1 + 0.008 * Math.sin(t * 0.9 + g.x + 1.7));
    bar(ctx, g.x + BAR_W + BAR_GAP, h2, p2 * grpA, C.amber, 1);
    if (p1 > 0 && p1 < 1 && grpA > 0.5) {
      glowDot(ctx, g.x + BAR_W / 2, AXIS_Y - h1 * p1, 18, C.cyanHi, 0.18 * (1 - p1), true);
    }
    if (p2 > 0 && p2 < 1 && grpA > 0.5) {
      glowDot(ctx, g.x + BAR_W * 1.5 + BAR_GAP, AXIS_Y - h2 * p2, 22, C.amberHi, 0.22 * (1 - p2), true);
    }
    // 提升箭头
    const lift = ease.outCubic(seg(t, g.t1 + 0.42, g.t1 + 1.05)) * grpA;
    if (lift > 0.004) {
      liftArrow(ctx, g.x + BAR_W + BAR_GAP / 2, AXIS_Y - h1 - 4, AXIS_Y - h2 - 12, lift, beat);
    }
  }

  // 轴标签
  const al = ease.outCubic(seg(t, 1.1, 1.9));
  text(ctx, 'CHOICE SHARE', 120, AXIS_Y + 22, {
    size: 11, family: F.mono, tracking: 3, color: withA(C.steel, 0.7), alpha: al,
  });
  text(ctx, '示意 · 仅示方向，不标具体百分比', 262, AXIS_Y + 22, {
    size: 11, family: F.sans, tracking: 2, color: withA(C.bone2, 0.5), alpha: al,
  });
}

function bar(ctx, x, h, grow, color, alpha) {
  const bh = Math.max(0, h * grow);
  if (bh <= 0.6) return;
  const y = AXIS_Y - bh;
  ctx.save();
  const g = ctx.createLinearGradient(0, AXIS_Y, 0, y);
  g.addColorStop(0, withA(color, 0.26 * alpha));
  g.addColorStop(0.55, withA(color, 0.62 * alpha));
  g.addColorStop(1, withA(color, 0.94 * alpha));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, BAR_W, bh);
  ctx.fillStyle = withA(color === C.steel ? C.cyanHi : C.amberHi, alpha);
  ctx.fillRect(x, y, BAR_W, 1);
  ctx.fillStyle = withA(color === C.steel ? C.cyan : C.amberHi, 0.35 * alpha);
  ctx.fillRect(x, y + 1, BAR_W, 5);
  ctx.restore();
}

function liftArrow(ctx, cx, yLow, yHigh, p, boost) {
  const y1 = lerp(yLow, yHigh, p);
  ctx.save();
  ctx.globalAlpha = clamp(0.55 * p * (0.85 + 0.15 * boost));
  ctx.strokeStyle = C.amberHi;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, yLow);
  ctx.lineTo(cx, y1 + 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx, y1);
  ctx.lineTo(cx - 4, y1 + 8);
  ctx.moveTo(cx, y1);
  ctx.lineTo(cx + 4, y1 + 8);
  ctx.stroke();
  ctx.restore();
}

// ───────────────────────────────── 眼动卡
function eyeCard(ctx, t, env) {
  const inP = ease.outCubic(seg(t, 0.45, 1.25));
  if (inP <= 0.001) return;
  const { x, y, w, h } = CARD;
  const beat = env.beat(env.t, 3);

  ctx.save();
  ctx.globalAlpha = inP;
  ctx.fillStyle = withA(C.ink, 0.55);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = withA(C.cyan, 0.20);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const cm = 7;
  ctx.strokeStyle = withA(C.cyan, 0.5);
  [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(px + sx * cm, py); ctx.lineTo(px, py); ctx.lineTo(px, py + sy * cm);
    ctx.stroke();
  });
  ctx.restore();

  // 中文标题 26px + 英文 11 装饰
  text(ctx, '眼动追踪', x + 18, y + 46, {
    size: 26, family: F.sans, tracking: 3, color: withA(C.cyanHi, 0.9), alpha: inP,
  });
  text(ctx, 'EYE-TRACKING / GAZE', x + 18, y + 20, {
    size: 11, family: F.mono, tracking: 3, color: withA(C.cyan, 0.75), alpha: inP,
  });
  text(ctx, 'FIXATION MAP', x + w - 18, y + 20, {
    size: 11, family: F.mono, tracking: 3, align: 'right', color: withA(C.steel, 0.85), alpha: inP,
  });

  // 两个选项框
  const boxIn = ease.outCubic(seg(t, 3.435, 4.20));
  optionBox(ctx, x + 18, y + 62, 218, 126, 'OPTION A', '100%', '得 98 元', null, boxIn, false);
  optionBox(ctx, x + 264, y + 62, 218, 126, 'OPTION B', '27%', '得 367 元', '73% 得 0 元', ease.outCubic(seg(t, 3.72, 4.48)), true);

  // 注视轨迹
  const gp = seg(t, 6.60, 9.40);
  gaze(ctx, t, gp, inP);

  // 热斑：先呼吸，12.15 起汇聚成一个点
  const heatIn = ease.outCubic(seg(t, 7.80, 8.80));
  const conv = ease.inOutQuad(seg(t, 12.15, 13.30));
  if (heatIn > 0.001) {
    const br = 1 + 0.055 * Math.sin(t * 1.62) + 0.02 * Math.sin(t * 3.7);
    const hx = x + 362 + Math.sin(t * 0.31) * 5 * (1 - conv), hy = y + 54 + Math.cos(t * 0.27) * 4;
    const rx = lerp(78 * br, 9, conv), ry = lerp(56 * br, 7, conv);
    glowEllipse(ctx, hx, hy, rx, ry, C.amber, (0.15 + 0.22 * conv) * heatIn * (0.8 + 0.2 * beat), 0.2);
    if (conv > 0.05) {
      glowEllipse(ctx, hx, hy, 34 * br * (1 - conv) + 5, 26 * br * (1 - conv) + 4, C.amberHi, 0.11 * heatIn * (1 - conv), 0.2);
      // 汇聚后的亮点
      glowDot(ctx, hx, hy, 7 + 4 * beat, C.amberHi, 0.5 * conv * heatIn, true);
      ring(ctx, hx, hy, 12 + 30 * conv, 0, TAU, { color: C.amberHi, w: 1, alpha: 0.35 * conv * (1 - conv) * 2, glow: 8 });
    }
    if (conv < 0.02) {
      text(ctx, 'ATTENTION', hx + 2, CARD.y + CARD.h - 20, {
        size: 11, family: F.mono, tracking: 3, align: 'center',
        color: withA(C.amber, 0.7 * heatIn), alpha: heatIn,
      });
    }
  }

  // 卡片里的慢速扫描线
  const sy = y + mod(t * 26, h);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const gs = ctx.createLinearGradient(0, sy - 26, 0, sy + 26);
  gs.addColorStop(0, withA(C.cyan, 0));
  gs.addColorStop(0.5, withA(C.cyan, 0.05 * inP));
  gs.addColorStop(1, withA(C.cyan, 0));
  ctx.fillStyle = gs;
  ctx.fillRect(x + 1, sy - 26, w - 2, 52);
  ctx.restore();
}

function optionBox(ctx, x, y, w, h, tag, pct, amount, zero, a, hot) {
  if (a <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = withA(C.slate, 0.5);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = withA(hot ? C.amber : C.cyan, hot ? 0.32 : 0.22);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
  text(ctx, tag, x + 12, y + 20, {
    size: 11, family: F.mono, tracking: 3, color: withA(C.steel, 0.9), alpha: a,
  });
  text(ctx, pct, x + 12, y + 62, {
    size: 32, family: F.mono, tracking: 1, color: withA(hot ? C.amberHi : C.bone, 0.95), alpha: a,
  });
  text(ctx, amount, x + 14, y + 96, {
    size: 26, family: F.sans, tracking: 1.5, color: withA(C.bone2, 0.92), alpha: a,
  });
  if (zero) {
    text(ctx, zero, x + 14, y + 118, {
      size: 26, family: F.sans, tracking: 1, color: withA(C.bone3, 0.95), alpha: a,
    });
  }
}

// 注视轨迹
function gaze(ctx, t, p, alpha) {
  if (p <= 0.001) return;
  const pts = [
    [800, 254], [860, 270], [920, 252], [980, 266], [1040, 260],
    [1096, 254], [1136, 272], [1104, 292], [1040, 296], [984, 284],
    [1038, 264], [1100, 260], [1140, 276],
  ];
  const N = 46;
  ctx.save();
  ctx.globalAlpha = alpha;
  const head = Math.min(pts.length - 1, p * (pts.length - 1));
  ctx.beginPath();
  for (let i = 0; i <= Math.floor(head); i++) {
    const q = pts[i];
    if (i === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
  }
  ctx.strokeStyle = withA(C.cyan, 0.32);
  ctx.lineWidth = 1;
  ctx.stroke();
  const rnd = mulberry32(7717);
  const jit = [];
  for (let i = 0; i < N; i++) jit.push([rnd() - 0.5, rnd() - 0.5, rnd()]);
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    if (u > p) break;
    const segI = u * (pts.length - 1);
    const i0 = Math.floor(segI), f = segI - i0;
    const a0 = pts[Math.min(i0, pts.length - 1)], a1 = pts[Math.min(i0 + 1, pts.length - 1)];
    const px = lerp(a0[0], a1[0], f) + jit[i][0] * 9;
    const py = lerp(a0[1], a1[1], f) + jit[i][1] * 9;
    const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 2.6 + jit[i][2] * 6.28));
    ctx.globalAlpha = alpha * (0.26 + 0.50 * tw);
    ctx.fillStyle = C.cyanHi;
    ctx.beginPath(); ctx.arc(px, py, 1.0 + jit[i][2] * 1.3, 0, TAU); ctx.fill();
  }
  ctx.restore();
  if (p < 0.999) {
    const last = Math.floor(Math.min(pts.length - 1, p * (pts.length - 1)));
    const cur = pts[last];
    glowDot(ctx, cur[0], cur[1], 16, C.cyanHi, 0.25 * alpha, true);
  }
}

// ───────────────────────────────── 78s 后的热斑连线 + 80s 合并总览
function merge(ctx, t, env) {
  const beat = env.beat(env.t, 2);

  // 热斑 → 「呈现零」柱 的连线
  const ln = ease.outCubic(seg(t, 13.30, 14.15));
  if (ln > 0.001 && t < 14.9) {
    const out = 1 - ease.inOutQuad(seg(t, 14.35, 14.9));
    const x0 = CARD.x + 362, y0 = CARD.y + 54;
    const x1 = G1X + BAR_W + BAR_GAP + BAR_W / 2, y1 = AXIS_Y - H_SHO * BAR_MAX - 6;
    const ex = lerp(x0, x1, ln), ey = lerp(y0, y1, ln);
    ctx.save();
    ctx.globalAlpha = 0.55 * out;
    ctx.strokeStyle = C.amberHi;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    if (ln > 0.9) {
      glowDot(ctx, x1, y1, 22, C.amberHi, 0.3 * out, true);
      text(ctx, '注意力流向这里', 300, 430, {
        size: 26, family: F.sans, tracking: 3,
        color: withA(C.bone, 0.95), glow: 10, glowColor: withA(C.amber, 0.3),
        alpha: ease.outCubic(seg(t, 13.9, 14.6)) * out,
        perChar: revealChars(t, 13.9, 0.5, 0.45, 3.7, 'up'),
      });
    }
  }

  // 80.0 合并总览：两根柱 + 一条上扬箭头 + 34px 结论
  const mg = ease.outCubic(seg(t, 14.15, 14.95));
  if (mg > 0.001) {
    const h1 = H_HID * BAR_MAX, h2 = H_SHO * BAR_MAX;
    bar(ctx, MX1, h1, ease.outCubic(seg(t, 14.15, 14.75)), C.steel, 0.8);
    bar(ctx, MX2, h2, ease.outCubic(seg(t, 14.35, 14.95)), C.amber, 1);
    // 上扬箭头（矢量，粗一点）
    const ap = ease.outCubic(seg(t, 14.75, 15.5));
    if (ap > 0.001) {
      const xa = 330, ya = 528, xb = 512, yb = 398;
      const ex = lerp(xa, xb, ap), ey = lerp(ya, yb, ap);
      const ang = Math.atan2(yb - ya, xb - xa);
      ctx.save();
      ctx.globalAlpha = 0.85 * mg;
      ctx.strokeStyle = C.amberHi;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(xa, ya);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // 箭头头
      const hx = Math.cos(ang), hy = Math.sin(ang);
      const nx = -hy, ny = hx;
      ctx.beginPath();
      ctx.moveTo(ex + hx * 22, ey + hy * 22);
      ctx.lineTo(ex + nx * 22, ey + ny * 22);
      ctx.lineTo(ex - nx * 22, ey - ny * 22);
      ctx.closePath();
      ctx.fillStyle = C.amberHi;
      ctx.fill();
      ctx.restore();
      glowDot(ctx, ex + hx * 16, ey + hy * 16, 26 + 6 * beat, C.amberHi, 0.26 * mg, true);
    }
    // 34px 结论
    const ca = ease.outCubic(seg(t, 14.60, 15.35));
    if (ca > 0.001) {
      text(ctx, '呈现零，选择风险项的人变多', 96, 372, {
        size: 34, family: F.serif, tracking: 3,
        color: withA(C.bone, 0.98), glow: 14, glowColor: withA(C.amber, 0.3), alpha: ca,
        perChar: revealChars(t, 14.60, 0.6, 0.95, 8.1, 'up'),
      });
    }
  }
}

// ───────────────────────────────── 出处
function tail(ctx, t, env) {
  const c = ease.outCubic(seg(t, 15.50, 16.20));
  if (c > 0.001) {
    text(ctx, 'LIANG ET AL. 2026 · PSYCHON. BULL. REV. 33:157-173', 1184, 578, {
      size: 11, family: F.mono, tracking: 2.2, align: 'right',
      color: withA(C.bone3, 0.85), alpha: c,
    });
  }
}
