// A8 — 现实 / REALITY · 三张承诺，每张都少了一半   [v3 · 按 REVISION-2 重排]
// 114.80 → 123.44 (8.64s) · Canvas2D 纯代码，无贴图
// v3：中文优先（品类 28 / 追问 32 / 总结 32）；y ≥ 592 全留空；每卡到场 1s 后有一次反光扫过；
//     三卡下方的总结句 + 一条贯穿右边的细线，避免右侧空成一块。
import {
  C, F, TAU, clamp, lerp, seg, ease, text, measureTracked,
  line, withA, mod, hash1, mulberry32,
} from '../engine.js';
import { hud } from '../ui.js';

const START = 114.8, END = 123.44, DUR = END - START;
const W = 1280, H = 720;
const BEAT = 0.5375, PHASE = 0.485, K0 = 213;
const bt = (m) => PHASE + (K0 + m) * BEAT - START;   // 本镜内第 m 个全局拍点

const PAD = 20;
const NUM_SIZE = 120;          // 数字：REVISION-2 允许 40–120
const CAT_SIZE = 28;           // 品类中文（可读）
const Q_SIZE = 32;             // 追问中文（可读）
const SUM_SIZE = 32;           // 总结句
const SUM_Y = 540;             // 总结基线（y ≥ 592 一律留空）

// ── 预生成的确定性材质（低对比，无贴图） ──────────────────────────
const FIBER = (() => {
  const r = mulberry32(4411), a = [];
  for (let i = 0; i < 190; i++) a.push({
    x: r(), y: r(), l: 9 + r() * 64, a: 0.014 + r() * 0.05,
    d: 0.4 + r() * 1.7, w: r() < 0.12 ? 2 : 1,
  });
  return a;
})();
const BLOTCH = (() => {
  const r = mulberry32(9021), a = [];
  for (let i = 0; i < 22; i++) a.push({ x: r(), y: r(), rx: 12 + r() * 46, ay: 0.02 + r() * 0.05 });
  return a;
})();
const SPEC = (() => {
  const r = mulberry32(7717), a = [];
  for (let i = 0; i < 7; i++) a.push({ p: r(), w: 0.012 + r() * 0.07, a: 0.03 + r() * 0.08, sp: 0.1 + r() * 0.42 });
  return a;
})();
const DOTS = (() => {
  const r = mulberry32(3311), a = [];
  for (let i = 0; i < 96; i++) a.push({ x: r(), y: r(), a: 0.02 + r() * 0.055, s: 1 + r() * 1.5, ph: r() * TAU });
  return a;
})();
// 缺失带里"被删掉的内容"占位：几截短线，极淡
const FILLER = (() => {
  const r = mulberry32(6103), a = [];
  for (let i = 0; i < 4; i++) a.push({ x: 0.02 + i * 0.235, w: 0.10 + r() * 0.09 });
  return a;
})();

const CARDS = [
  { n: '01', kind: 'paper', x: 76, y: 72, w: 392, h: 392, rot: -0.0048, depth: 1.00, ph: 0.0,
    cat: '药效', num: '90%', q: '那 10% 是谁',
    headY: 22, catY: 56, numY: 164, qY: 230, cutOff: 268,
    inAt: 0.10, sweepAt: 1.20, cutAt: bt(5), qAt: 3.28 },
  { n: '02', kind: 'glass', x: 500, y: 108, w: 352, h: 372, rot: 0.0038, depth: 0.66, ph: 1.7,
    cat: '年化收益', num: '8%', q: '亏损的那一半没写',
    headY: 22, catY: 54, numY: 160, qY: 222, cutOff: 252,
    inAt: bt(1), sweepAt: 1.81, cutAt: bt(7), qAt: 4.35 },
  { n: '03', kind: 'screen', x: 884, y: 76, w: 324, h: 372, rot: -0.0086, depth: 0.38, ph: 3.1,
    cat: '模型准确率', num: '99%', q: '那 1% 错在谁身上',
    headY: 22, catY: 56, numY: 160, qY: 224, cutOff: 248,
    inAt: bt(2), sweepAt: 2.35, cutAt: bt(9), qAt: 5.42 },
];

const TRACE_T = bt(11);     // 6.085 三条朱红细线同时勾出缺失带
const SUM_T = bt(12);       // 6.6225 总结句
const DIM_T = bt(13);       // 7.16   数字让位

const MAT_EDGE = {
  paper: [C.bone2, 0.20],
  glass: [C.cyanHi, 0.24],
  screen: [C.cyan, 0.28],
};

export default {
  id: 'A8-reality',
  start: START,
  end: END,
  fadeIn: 0.24,
  fadeOut: 0.34,
  draw(ctx, t, env, p) {
    const OA = ctx.globalAlpha;
    ctx.globalAlpha = 1;
    const aa = (v) => clamp(v, 0, 1) * OA;

    const push = 1 + 0.028 * ease.inOutQuad(seg(t, 0, DUR));
    const panX = lerp(-26, 30, ease.inOutQuad(seg(t, 0, DUR)));
    const beat = env.beat(START + t, 3);

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(push, push);
    ctx.translate(-W / 2, -H / 2);

    for (const c of CARDS) drawCard(ctx, c, t, env, panX, aa, beat);
    drawSummary(ctx, t, aa, panX, beat);

    ctx.restore();

    hud(ctx, START + t, env, {
      alpha: 0.60 * OA, code: 'HZ / 08', label: 'FIGURES ILLUSTRATIVE', accent: C.amber,
    });
  },
};

// ──────────────────────────────────────────────────────────────── 单张卡
function drawCard(ctx, c, t, env, panX, aa, beat) {
  const ein = ease.outCubic(seg(t, c.inAt, c.inAt + 0.74));
  if (ein < 0.002) return;

  const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  const sc = (0.976 + 0.024 * ein) * (1 + 0.0032 * Math.sin(t * 1.02 + c.ph));
  const dx = panX * c.depth + Math.sin(t * 0.41 + c.ph) * 1.7;
  const dy = (1 - ein) * 34 + Math.sin(t * 0.73 + c.ph) * 1.6 + 0.9 * Math.sin(t * 0.31 + c.ph * 2);

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.translate(cx + dx, cy + dy);
  ctx.scale(sc, sc);
  ctx.rotate(c.rot + Math.sin(t * 0.19 + c.ph) * 0.0012);
  ctx.translate(-cx, -cy);

  const al = (v) => aa(clamp(v * 1.15, 0, 1) * ein);

  // 缺失带的下切位置：入场时是整张卡，到自己的拍点被"切掉"
  const cp = ease.outCubic(seg(t, c.cutAt, c.cutAt + 0.58));
  const cutY = lerp(c.y + c.h, c.y + c.cutOff, cp);

  // 投影 + 底板
  ctx.save();
  ctx.shadowColor = withA(C.void, 0.85);
  ctx.shadowBlur = 26 + 6 * Math.sin(t * 0.5 + c.ph);
  ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 13;
  ctx.fillStyle = withA(C.ink, al(0.94));
  ctx.fillRect(c.x, c.y, c.w, cutY - c.y);
  ctx.restore();

  // 材质（裁切在卡片可见区域内）
  ctx.save();
  ctx.beginPath();
  ctx.rect(c.x, c.y, c.w, Math.max(1, cutY - c.y));
  ctx.clip();
  if (c.kind === 'paper') matPaper(ctx, c, cutY, t, al);
  else if (c.kind === 'glass') matGlass(ctx, c, cutY, t, al);
  else matScreen(ctx, c, cutY, t, al);
  lightSweep(ctx, c, cutY, t, al);
  // 底部内侧压暗，让"被切"更立体
  const dg = ctx.createLinearGradient(0, cutY - 52, 0, cutY);
  dg.addColorStop(0, withA(C.void, 0)); dg.addColorStop(1, withA(C.void, al(0.52)));
  ctx.fillStyle = dg; ctx.fillRect(c.x, cutY - 52, c.w, 52);
  ctx.restore();

  // 边框
  const [ec, ea] = MAT_EDGE[c.kind];
  line(ctx, c.x, c.y, c.x + c.w, c.y, { color: withA(ec, al(ea + 0.10)), w: 1 });
  line(ctx, c.x, c.y, c.x, cutY, { color: withA(ec, al(ea)), w: 1 });
  line(ctx, c.x + c.w, c.y, c.x + c.w, cutY, { color: withA(ec, al(ea)), w: 1 });

  // 切边：扫过去时最亮；材质不同，断口不同
  const cutFlash = Math.max(0, 1 - Math.abs(cp - 0.45) * 2.6);
  if (c.kind === 'paper') {
    ctx.save();
    ctx.strokeStyle = withA(ec, al(0.34 + 0.5 * cutFlash));
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const px = c.x + (c.w * i) / 26;
      const py = cutY + (hash1(i * 3.7 + 1.3) - 0.5) * 2.2;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    for (let i = 0; i < 22; i++) {
      const px = c.x + hash1(i * 9.1 + 2.2) * c.w;
      const ln = 3 + hash1(i * 5.3 + 7.7) * 9;
      line(ctx, px, cutY + 1, px + (hash1(i * 2.9) - 0.5) * 3, cutY + 1 + ln,
        { color: withA(C.bone2, al(0.16)), w: 1 });
    }
    ctx.restore();
  } else if (c.kind === 'screen') {
    line(ctx, c.x, cutY, c.x + c.w, cutY, {
      color: withA(ec, al(0.36 + 0.5 * cutFlash)), w: 1, glow: 10 + 14 * cutFlash,
    });
    line(ctx, c.x, cutY - 2, c.x + c.w, cutY - 2, { color: withA(ec, al(0.10)), w: 1 });
  } else {
    line(ctx, c.x, cutY, c.x + c.w, cutY, {
      color: withA(ec, al(0.40 + 0.5 * cutFlash)), w: 1, glow: 8 * cutFlash,
    });
    line(ctx, c.x + c.w * 0.62, cutY, c.x + c.w * 0.78, cutY,
      { color: withA(C.bone, al(0.30)), w: 1, glow: 10 });
  }

  // ── 缺失带：一块"被删掉"的空白
  const voidTop = cutY, voidBot = c.y + c.h;
  if (voidBot - voidTop > 8) {
    // 比卡片更"没有东西"的一层
    const vg = ctx.createLinearGradient(0, voidTop, 0, voidBot);
    vg.addColorStop(0, withA(C.void, al(0.34)));
    vg.addColorStop(0.5, withA(C.void, al(0.50)));
    vg.addColorStop(1, withA(C.void, al(0.36)));
    ctx.fillStyle = vg;
    ctx.fillRect(c.x + 1, voidTop, c.w - 2, voidBot - voidTop);
    // 透光
    const leak = 0.07 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.92 + c.ph))
      + 0.16 * Math.exp(-Math.max(0, t - c.cutAt - 0.5) * 2.4) * seg(t, c.cutAt + 0.45, c.cutAt + 0.75);
    const lg = ctx.createLinearGradient(0, voidTop, 0, voidTop + 90);
    lg.addColorStop(0, withA(C.amber, al(leak)));
    lg.addColorStop(0.42, withA(C.amberD, al(leak * 0.5)));
    lg.addColorStop(1, withA(C.amberD, 0));
    ctx.fillStyle = lg;
    ctx.fillRect(c.x + 1, voidTop, c.w - 2, Math.min(90, voidBot - voidTop));
    // 被删掉的内容：几截极淡的占位短线
    const vmid = voidTop + (voidBot - voidTop) * 0.56;
    for (const f of FILLER) {
      const fx = c.x + 22 + f.x * (c.w - 44);
      line(ctx, fx, vmid, fx + f.w * (c.w - 44), vmid,
        { color: withA(C.bone3, al(0.17 + 0.06 * Math.sin(t * 0.7 + f.x * 9))), w: 1 });
    }
    // 侧轨 + 底边：把条带的轮廓压得很淡地勾出来
    const railA = seg(cp, 0.5, 1) * 0.08;
    if (railA > 0.001) {
      line(ctx, c.x, voidTop, c.x, voidBot, { color: withA(ec, al(railA)), w: 1 });
      line(ctx, c.x + c.w, voidTop, c.x + c.w, voidBot, { color: withA(ec, al(railA)), w: 1 });
      line(ctx, c.x, voidBot, c.x + c.w, voidBot, { color: withA(ec, al(railA * 0.7)), w: 1 });
    }
  }

  // ── 内容：品类中文 + 巨大数字 + 朱红追问
  const dim = 1 - 0.42 * seg(t, DIM_T, DIM_T + 0.75);
  text(ctx, 'PROMISE / ' + c.n, c.x + PAD, c.y + c.headY, {
    size: 11, family: F.mono, color: withA(C.bone2, al(0.44 * dim)), tracking: 4,
  });
  // 品类（左上）
  text(ctx, c.cat, c.x + PAD, c.y + c.catY, {
    size: CAT_SIZE, family: F.serif, color: withA(C.bone, al(0.88 * dim)), tracking: 3,
  });
  // 「示意」（右上，同一条基线）—— 中文，26 号可读
  text(ctx, '示意', c.x + c.w - PAD, c.y + c.catY, {
    size: 26, family: F.sans, color: withA(C.bone2, al(0.66 * dim)), tracking: 2, align: 'right',
  });
  // 数字
  const numY = c.y + c.numY;
  text(ctx, c.num, c.x + PAD, numY, {
    size: NUM_SIZE, family: F.latin, weight: 300, color: withA(C.bone, al(0.96 * dim)),
    tracking: -3, glow: 10 + 16 * beat, glowColor: withA(C.amber, al(0.45 * dim)),
  });
  // 数字下的细线
  const uw = (c.w - PAD * 2) * ease.outCubic(seg(t, c.inAt + 0.5, c.inAt + 1.3));
  line(ctx, c.x + PAD, numY + 18, c.x + PAD + uw, numY + 18,
    { color: withA(C.amber, al(0.32 * dim)), w: 1 });

  // 追问：坐在缺失带上方，字号 32
  const qp = ease.outCubic(seg(t, c.qAt, c.qAt + 0.34));
  if (qp > 0.001) {
    const qy = c.y + c.qY;
    line(ctx, c.x + PAD - 11, qy - 20, c.x + PAD - 11, qy + 2,
      { color: withA(C.verm, al(0.78 * qp)), w: 2 });
    text(ctx, c.q, c.x + PAD, qy, {
      size: Q_SIZE, family: F.serif, color: withA(C.bone, al(0.96 * qp)), tracking: 2,
      glow: 9, glowColor: withA(C.verm, al(0.30 * qp)),
      perChar: (i) => {
        const st = c.qAt + i * 0.045;
        const q = ease.outCubic(seg(t, st, st + 0.3));
        return { alpha: q, dy: (1 - q) * 10 };
      },
    });
  }

  // 朱红细线：三条同时勾出缺失带的顶边
  const tp = ease.outCubic(seg(t, TRACE_T, TRACE_T + 0.62));
  if (tp > 0.001) {
    const ta = al(0.76 + 0.14 * beat);
    const x0 = c.x + 12, x1 = c.x + c.w - 12;
    const ly = c.y + c.cutOff;
    line(ctx, x0, ly, x0 + (x1 - x0) * tp, ly, { color: withA(C.verm, ta), w: 1 });
    if (tp > 0.55) {
      const e = (tp - 0.55) / 0.45;
      const by = c.y + c.h;
      const dy = (by - ly) * e;
      line(ctx, x0, ly, x0, ly + dy, { color: withA(C.verm, ta * 0.5), w: 1 });
      line(ctx, x1, ly, x1, ly + dy, { color: withA(C.verm, ta * 0.5), w: 1 });
      if (e > 0.9) {
        line(ctx, x0, by, x0 + (x1 - x0) * ((e - 0.9) / 0.1), by,
          { color: withA(C.verm, ta * 0.42), w: 1 });
      }
    }
  }

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────── 反光扫过
function lightSweep(ctx, c, cutY, t, al) {
  const q = seg(t, c.sweepAt, c.sweepAt + 0.95);
  if (q <= 0 || q >= 1) return;
  const e = ease.inOutCubic(q);
  const h = Math.max(1, cutY - c.y);
  const amp = c.kind === 'glass' ? 0.22 : (c.kind === 'screen' ? 0.13 : 0.17);
  ctx.save();
  ctx.translate(c.x + c.w / 2, c.y + h / 2);
  ctx.rotate(-0.20);
  ctx.translate(-(c.x + c.w / 2), -(c.y + h / 2));
  const x = c.x - c.w * 0.45 + (c.w * 1.9) * e;
  const bw = c.w * 0.26;
  const g = ctx.createLinearGradient(x - bw, 0, x + bw, 0);
  g.addColorStop(0, withA(C.bone, 0));
  g.addColorStop(0.42, withA(C.bone, al(amp * 0.55)));
  g.addColorStop(0.5, withA(C.bone, al(amp)));
  g.addColorStop(0.58, withA(C.bone, al(amp * 0.55)));
  g.addColorStop(1, withA(C.bone, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - bw, c.y - 60, bw * 2, h + 120);
  ctx.restore();
}

// ──────────────────────────────────────────────────────────────── 三卡下方总结
function drawSummary(ctx, t, aa, panX, beat) {
  const q = ease.outCubic(seg(t, SUM_T, SUM_T + 0.7));
  if (q <= 0.001) return;
  const a = aa(q);
  const dx = panX * 1.0 + Math.sin(t * 0.37) * 1.2;
  ctx.save();
  ctx.translate(dx, 0);
  // 朱红短线
  line(ctx, 62, SUM_Y - 22, 62, SUM_Y + 2, { color: withA(C.verm, aa(0.8 * q)), w: 2 });
  text(ctx, '省掉的那一半，最后由谁承担？', 76, SUM_Y, {
    size: SUM_SIZE, family: F.serif, color: withA(C.bone, a), tracking: 5,
    glow: 10, glowColor: withA(C.amber, aa(0.20 * q)),
    perChar: (i) => {
      const st = SUM_T + i * 0.048;
      const p2 = ease.outCubic(seg(t, st, st + 0.45));
      return { alpha: p2, dy: (1 - p2) * 12 };
    },
  });
  // 贯穿到右边的细线：把右半边的空白压住
  const w0 = 640, w1 = 1208;
  const lq = ease.outCubic(seg(t, SUM_T + 0.25, SUM_T + 1.15));
  if (lq > 0.001) {
    line(ctx, w0, SUM_Y - 8, w0 + (w1 - w0) * lq, SUM_Y - 8,
      { color: withA(C.bone, aa(0.16 * lq)), w: 1 });
    // 末端一个小方块
    if (lq > 0.2) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = withA(C.verm, aa(0.55 * seg(lq, 0.9, 1)));
      ctx.fillRect(w1 - 3, SUM_Y - 11, 4, 4);
      ctx.restore();
    }
    for (let i = 1; i <= 6; i++) {
      const x = w0 + (w1 - w0) * (i / 7);
      line(ctx, x, SUM_Y - 11, x, SUM_Y - 8, { color: withA(C.bone, aa(0.14 * lq)), w: 1 });
    }
  }
  ctx.restore();
}

// ──────────────────────────────────────────────────────────────── 三种材质
function matPaper(ctx, c, cutY, t, al) {
  const x = c.x, y = c.y, w = c.w, h = Math.max(2, cutY - y);
  const g = ctx.createLinearGradient(x, y, x + w * 0.30, y + h * 1.2);
  g.addColorStop(0, withA(C.bone, al(0.105)));
  g.addColorStop(0.40, withA(C.bone2, al(0.072)));
  g.addColorStop(1, withA(C.slate, al(0.34)));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  for (const b of BLOTCH) {
    const bx = x + b.x * w, by = y + b.y * h, rr = b.rx * 1.7;
    const rg = ctx.createRadialGradient(bx, by, 0, bx, by, rr);
    rg.addColorStop(0, withA(C.amberD, al(b.ay * 0.5)));
    rg.addColorStop(1, withA(C.amberD, 0));
    ctx.fillStyle = rg; ctx.fillRect(bx - rr, by - rr, rr * 2, rr * 2);
  }
  for (const f of FIBER) {
    const fy = y + f.y * h, fx = x + f.x * w;
    const edge = clamp(Math.min(fx - x, x + w - fx) / 16);
    const tw = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.55 + f.x * 11 + f.y * 4));
    ctx.strokeStyle = withA(C.bone, al(f.a * tw * edge * 1.7));
    ctx.lineWidth = f.w;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + f.l, fy + (f.y - 0.5) * 1.4);
    ctx.stroke();
  }
  for (let i = 0; i < 40; i++) {
    const f = FIBER[i * 4];
    const fy = y + f.y * h + 1.6, fx = x + f.x * w;
    ctx.strokeStyle = withA(C.slate, al(f.a * 0.8));
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + f.l * 0.8, fy); ctx.stroke();
  }
}

function matGlass(ctx, c, cutY, t, al) {
  const x = c.x, y = c.y, w = c.w, h = Math.max(2, cutY - y);
  const g = ctx.createLinearGradient(x, y, x + w * 0.8, y + h);
  g.addColorStop(0, withA(C.slate, al(0.44)));
  g.addColorStop(0.5, withA(C.ink, al(0.84)));
  g.addColorStop(1, withA(C.steelD, al(0.30)));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const drift = Math.sin(t * 0.26) * 0.028;
  for (let i = 0; i < 3; i++) {
    const bx = x + (0.26 + i * 0.235 + drift * (1 - i * 0.3)) * w;
    const bw = w * (0.05 + i * 0.014);
    const sk = 0.26 * w;
    const lg = ctx.createLinearGradient(bx - bw, 0, bx + bw, 0);
    lg.addColorStop(0, withA(C.bone, 0));
    lg.addColorStop(0.5, withA(C.bone, al(0.075 - i * 0.013)));
    lg.addColorStop(1, withA(C.bone, 0));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(bx - bw + sk, y); ctx.lineTo(bx + bw + sk, y);
    ctx.lineTo(bx + bw, cutY); ctx.lineTo(bx - bw, cutY);
    ctx.closePath(); ctx.fillStyle = lg; ctx.fill();
    ctx.restore();
  }
  for (const s of SPEC) {
    const shift = Math.sin(t * s.sp + s.p * TAU) * 0.12;
    const px = x + clamp(s.p + shift, 0.02, 0.98) * w;
    const bw = s.w * w * 0.5;
    const lg = ctx.createLinearGradient(px - bw, 0, px + bw, 0);
    lg.addColorStop(0, withA(C.bone, 0));
    lg.addColorStop(0.5, withA(C.bone, al(s.a * 0.34)));
    lg.addColorStop(1, withA(C.bone, 0));
    ctx.fillStyle = lg; ctx.fillRect(px - bw, y, bw * 2, h);
  }
  line(ctx, x, y + 1, x + w, y + 1, { color: withA(C.bone, al(0.15)), w: 1 });
  const cg = ctx.createLinearGradient(0, cutY, 0, cutY - 80);
  cg.addColorStop(0, withA(C.cyan, al(0.09))); cg.addColorStop(1, withA(C.cyan, 0));
  ctx.fillStyle = cg; ctx.fillRect(x, cutY - 80, w, 80);
}

function matScreen(ctx, c, cutY, t, al) {
  const x = c.x, y = c.y, w = c.w, h = Math.max(2, cutY - y);
  ctx.fillStyle = withA(C.ink, al(0.88)); ctx.fillRect(x, y, w, h);
  const wg = ctx.createLinearGradient(0, y, 0, y + h);
  wg.addColorStop(0, withA(C.cyanD, al(0.35)));
  wg.addColorStop(0.6, withA(C.cyanD, al(0.12)));
  wg.addColorStop(1, withA(C.ink, al(0.2)));
  ctx.fillStyle = wg; ctx.fillRect(x, y, w, h);
  const off = mod(t * 16, 3);
  ctx.fillStyle = withA(C.void, al(0.30));
  for (let yy = y + off; yy < cutY; yy += 3) ctx.fillRect(x, yy, w, 1);
  const ry = y + mod(t * 46, h + 100) - 50;
  const rg = ctx.createLinearGradient(0, ry - 24, 0, ry + 24);
  rg.addColorStop(0, withA(C.cyan, 0));
  rg.addColorStop(0.5, withA(C.cyanHi, al(0.075)));
  rg.addColorStop(1, withA(C.cyan, 0));
  ctx.fillStyle = rg; ctx.fillRect(x, ry - 24, w, 48);
  for (const d of DOTS) {
    const tw = 0.5 + 0.5 * Math.sin(t * 1.7 + d.ph);
    ctx.fillStyle = withA(C.cyan, al(d.a * tw));
    ctx.fillRect(x + d.x * w, y + d.y * h, d.s, d.s);
  }
  line(ctx, x, y + 1, x + w, y + 1, { color: withA(C.cyan, al(0.14)), w: 1 });
}
