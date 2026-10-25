// A3 — 两个方向 / one trick, two opposite directions.   48.67 -> 65.85   (17.18 s)
// 事件表（本镜局部秒）：
//  0.00 顶部 mono 标签 / 分割线 / 刻度尺 起
//  0.20 青色巨箭头向右生长（指向「以后」）
//  0.60 「现在」「以后」26px 上屏
//  1.33 起 7 块逐块点亮（每 0.5s 一块）+ 等待进度条 + 计数器 0→7 个月
//  5.33 第 3 块变空（虚线）+ 30px「这里本来是 0」
//  7.20 虚线标注线从文字长到空块（状态变化）
//  8.83 空块重新点亮 + 26px「于是人愿意等了」+ 光标从「现在」滑向「以后」
// 11.30 计数器淡出
// 12.33 仪表苏醒 + 轴心出现「0」；13.10–13.45 指针 0.35s 弹向「风险」（落点 1 帧亮环）
// 12.90 / 13.32 「2008 · 更耐心」/「2026 · 更冒险」中文对照上屏
// 14.50 结句「同一个把戏，两个方向。」
import {
  C, F, TAU, clamp, lerp, seg, ease, text, ring, donut, line, rect, poly, tickRing,
  glowDot, glowEllipse, withA, mod, vnoise, revealChars,
} from '../engine.js';

const DIV = 340;
const N = 7, BLK = 34, PITCH = 64, BX0 = 150, BY = 176, GAP_I = 2;
const GX = BX0 + GAP_I * PITCH + BLK / 2;
const GY = BY + BLK / 2;
const BAR_X1 = BX0 + (N - 1) * PITCH + BLK;

export default {
  id: 'A3-two-directions',
  start: 48.67,
  end: 65.85,
  draw(ctx, t, env, p) {
    const q = ease.inOutQuad(seg(t, 0, 17.18));
    ctx.save();
    ctx.translate(640 + Math.sin(t * 0.173) * 3.6 - 9 * q,
                  360 + Math.cos(t * 0.121) * 2.8 + 7 * q);
    ctx.scale(1 + 0.040 * q, 1 + 0.040 * q);
    ctx.translate(-640, -360);
    coolHalf(ctx, t, env);
    warmHalf(ctx, t, env);
    divider(ctx, t, env);
    closing(ctx, t, env);
    ctx.restore();
  },
};

// ───────────────────────────────────────── 上半：2008 / 更耐心
function coolHalf(ctx, t, env) {
  ctx.save();
  glowEllipse(ctx, 250 + Math.sin(t * 0.131) * 48, 178 + Math.cos(t * 0.097) * 18,
    470, 180, C.cyan, 0.040 + 0.008 * Math.sin(t * 0.46), -0.10);
  glowEllipse(ctx, 1046 + Math.sin(t * 0.077 + 1.3) * 38, 120 + Math.cos(t * 0.113) * 14,
    320, 112, C.cyanD, 0.14 + 0.03 * Math.sin(t * 0.37), 0.16);

  const drift = mod(t * 7.5, 26);
  ctx.save();
  ctx.strokeStyle = withA(C.cyan, 0.055);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -26 + drift; x < 1300; x += 26) {
    const h = 12 + 30 * vnoise(x * 0.021 + t * 0.05, 3.7);
    ctx.moveTo(x, DIV - 8);
    ctx.lineTo(x, DIV - 8 - h);
  }
  ctx.stroke();
  ctx.restore();

  const ag = ease.outExpo(seg(t, 0.20, 1.85));
  if (ag > 0.001) {
    const bp = env.barPhase(env.t);
    bigArrow(ctx, {
      x1: 700 + Math.sin(t * 0.233) * 4, y1: 152 + Math.cos(t * 0.191) * 3,
      x2: 1164, y2: 126,
      head: 128 * (1 + 0.012 * Math.sin(t * 0.62)), shaft: 14,
      color: C.cyan, alpha: 0.15 + 0.02 * Math.pow(1 - bp, 2), grow: ag, flow: t,
    });
  }

  const axisIn = ease.outCubic(seg(t, 0.32, 1.10));
  if (axisIn > 0.001) {
    line(ctx, BX0 - 30, 226, lerp(BX0 - 30, BAR_X1, axisIn), 226, { color: withA(C.bone, 0.16), w: 1 });
  }
  for (let i = 0; i < N; i++) {
    const t0 = 1.33 + i * 0.50;
    const base = ease.outCubic(seg(t, t0, t0 + 0.28));
    const empty = i === GAP_I ? ease.inOutQuad(seg(t, 5.33, 5.90)) : 0;
    const relit = i === GAP_I ? ease.outCubic(seg(t, 8.83, 9.25)) : 0;
    const lit = i === GAP_I ? lerp(base * (1 - empty), 1, relit) : base;
    const inP = ease.outCubic(seg(t, 0.50 + i * 0.05, 0.85 + i * 0.05));
    if (inP <= 0.001) continue;
    const bx = BX0 + i * PITCH;
    const bob = Math.sin(t * 1.9 + i * 0.9) * 0.8 + Math.sin(t * 0.73 + i * 2.1) * 0.6;
    const y = BY + bob;
    if (empty > 0.01 && lit < 0.99) {
      dashedBox(ctx, bx, y, BLK, BLK, C.cyan, 0.5 * inP * (1 - relit), [3, 4 + 2 * Math.sin(t * 3 + i)]);
    }
    if (lit > 0.01) {
      const pulse = 0.92 + 0.08 * Math.sin(t * 3.1 + i);
      rect(ctx, bx, y, BLK, BLK, { fill: withA(C.amber, 0.90 * lit * pulse), alpha: inP });
      rect(ctx, bx, y, BLK, BLK, { stroke: withA(C.amberHi, 0.7 * lit), w: 1, alpha: inP });
    } else if (inP > 0.01) {
      rect(ctx, bx, y, BLK, BLK, { fill: withA(C.slate, 0.55 * inP), stroke: withA(C.cyan, 0.22 * inP), w: 1 });
    }
    const pp = seg(t, t0, t0 + 0.6);
    if (i !== GAP_I && pp > 0 && pp < 1) {
      ring(ctx, bx + BLK / 2, GY, 12 + 26 * ease.outCubic(pp), 0, TAU, {
        color: C.amberHi, w: 1, alpha: 0.22 * (1 - pp), glow: 8,
      });
    }
  }

  const prog = seg(t, 1.33, 4.33);
  if (prog > 0.001) {
    const e = ease.inOutQuad(prog);
    line(ctx, BX0, 226, lerp(BX0, BAR_X1, e), 226, { color: withA(C.amber, 0.78), w: 2 });
    glowDot(ctx, lerp(BX0, BAR_X1, e), 226, 10 + 4 * env.beat(env.t, 2), C.amberHi, 0.5, true);
  }

  const lab = ease.outCubic(seg(t, 0.60, 1.25));
  text(ctx, '现在', BX0 - 4, 262, {
    size: 26, family: F.sans, tracking: 3, color: withA(C.bone, 0.9), alpha: lab, align: 'center',
  });
  text(ctx, '以后', BAR_X1, 262, {
    size: 26, family: F.sans, tracking: 3, color: withA(C.bone, 0.9), alpha: lab, align: 'center',
  });

  const c1 = ease.outCubic(seg(t, 5.33, 6.05)) * (1 - ease.inOutQuad(seg(t, 8.83, 9.45)));
  if (c1 > 0.001) {
    text(ctx, '这里本来是 0', GX, 154, {
      size: 30, family: F.serif, tracking: 4, align: 'center',
      color: withA(C.vermHi, 0.96), glow: 14, glowColor: withA(C.verm, 0.4), alpha: c1,
      perChar: revealChars(t, 5.33, 0.55, 0.42, 2.7, 'up'),
    });
    const cl = ease.outCubic(seg(t, 7.20, 7.85));
    if (cl > 0.001) {
      ctx.save();
      ctx.globalAlpha = c1 * 0.8;
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = withA(C.verm, 0.6);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(GX, 162);
      ctx.lineTo(GX, lerp(162, BY - 4, cl));
      ctx.stroke();
      ctx.restore();
    }
  }

  const c2 = ease.outCubic(seg(t, 8.83, 9.60));
  if (c2 > 0.001) {
    text(ctx, '于是人愿意等了', BX0 - 4, 306, {
      size: 26, family: F.serif, tracking: 4,
      color: withA(C.bone, 0.95), glow: 10, glowColor: withA(C.amber, 0.3), alpha: c2,
      perChar: revealChars(t, 8.83, 0.6, 0.5, 5.1, 'up'),
    });
  }

  const curIn = ease.outCubic(seg(t, 1.10, 1.70));
  if (curIn > 0.001) {
    const glide = seg(t, 8.83, 11.90);
    const cx = lerp(BX0 - 96, BAR_X1, ease.inOutCubic(glide)) + Math.sin(t * 0.93) * 0.9;
    const warm = ease.inOutQuad(seg(t, 8.83, 9.5));
    const col = warm > 0.5 ? C.amber : C.cyan;
    const beat = env.beat(env.t, 3);
    ctx.save();
    ctx.globalAlpha = curIn;
    line(ctx, cx, 158, cx, 222, { color: withA(col, 0.5 + 0.1 * beat), w: 1.4, glow: 10, glowColor: withA(col, 0.5) });
    poly(ctx, [[cx - 5, 150], [cx + 5, 150], [cx, 160]], { fill: withA(col, 0.9) });
    glowDot(ctx, cx, 222, 8 + 3 * beat, col, 0.35, true);
    ctx.restore();
  }

  text(ctx, 'MAGEN, DWECK & GROSS', 96, 92, {
    size: 11, family: F.mono, tracking: 3.2, color: withA(C.bone2, 0.7),
    alpha: ease.outCubic(seg(t, 0, 0.6)),
  });
  text(ctx, 'INTERTEMPORAL CHOICE / 2008', 96, 110, {
    size: 11, family: F.mono, tracking: 3.2, color: withA(C.steel, 0.75),
    alpha: ease.outCubic(seg(t, 0.1, 0.75)),
  });
  ctx.restore();
}

// ───────────────────────────────────────── 下半：2026 / 更冒险 + 仪表
function warmHalf(ctx, t, env) {
  ctx.save();
  const beat = env.beat(env.t, 2);
  glowEllipse(ctx, 1000 + Math.sin(t * 0.111) * 40, 470 + Math.cos(t * 0.089) * 16,
    320, 150, C.amber, 0.030 + 0.008 * Math.sin(t * 0.41), 0.10);
  glowEllipse(ctx, 420 + Math.sin(t * 0.071 + 2.1) * 52, 470 + Math.cos(t * 0.093) * 12,
    340, 120, C.amberD, 0.10 + 0.02 * Math.sin(t * 0.33), -0.08);

  ctx.save();
  for (let i = 0; i < 6; i++) {
    const y0 = 366 + i * 20;
    const u = mod(t * (0.048 + i * 0.0035) + i * 0.137, 1);
    const x = lerp(1320, -300, u);
    const len = 70 + 150 * vnoise(i * 3.1, 1.7);
    const yy = y0 + Math.sin(t * 0.42 + i * 1.7) * 2.4;
    line(ctx, x, yy, x + len, yy, { color: withA(C.amber, 0.05), w: 1 });
  }
  ctx.restore();

  const ag = ease.outExpo(seg(t, 12.33, 13.70));
  if (ag > 0.001) {
    bigArrow(ctx, {
      x1: 792 + Math.sin(t * 0.207) * 4, y1: 392 + Math.cos(t * 0.177) * 3,
      x2: 452, y2: 412,
      head: 104 * (1 + 0.014 * Math.sin(t * 0.55)), shaft: 12,
      color: C.amber, alpha: 0.14 + 0.02 * beat, grow: ag, flow: t * 0.9 + 0.4,
    });
  }

  const hb = ease.outCubic(seg(t, 0.35, 1.05));
  text(ctx, 'LIANG, GUO, XU ET AL.', 96, 376, {
    size: 11, family: F.mono, tracking: 3.2, color: withA(C.bone2, 0.7), alpha: hb,
  });
  text(ctx, 'RISKY CHOICE / 2026', 96, 394, {
    size: 11, family: F.mono, tracking: 3.2, color: withA(C.steel, 0.75), alpha: hb,
  });

  const fade = 1 - ease.inOutQuad(seg(t, 11.30, 12.10));
  const cnt = ease.outCubic(seg(t, 1.33, 4.33));
  if (t > 1.3 && fade > 0.01) {
    const n = Math.round(7 * cnt);
    const bump = 1 + 0.03 * Math.exp(-Math.abs(t - 4.33) * 3) * Math.sin(t * 14);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(1152, 508);
    ctx.scale(bump, bump);
    text(ctx, String(n), 0, 0, {
      size: 96, family: F.latin, weight: 300, align: 'right', tracking: -2,
      color: C.amberHi, glow: 16, glowColor: withA(C.amber, 0.35),
    });
    ctx.restore();
    text(ctx, '个月', 1152, 546, {
      size: 26, family: F.sans, tracking: 4, align: 'right',
      color: withA(C.bone2, 0.85 * fade), alpha: fade,
    });
  }

  const cx = 900, cy = 505, R = 100;
  const aRisk = 200 * Math.PI / 180, aSure = 340 * Math.PI / 180;
  const wake = ease.outCubic(seg(t, 12.33, 13.10));
  const arcA = (0.13 + 0.21 * wake) * (0.92 + 0.08 * beat);

  donut(ctx, cx, cy, R - 18, R, aRisk, aSure, { color: withA(C.amber, 0.028 + 0.045 * wake) });
  ring(ctx, cx, cy, R, aRisk, aSure, { color: withA(C.amber, arcA), w: 2.4 });
  tickRing(ctx, cx, cy, R - 13, R - 4, 13, {
    color: withA(C.amber, 0.12 + 0.30 * wake), alpha: 0.9, w: 1, a0: aRisk, a1: aSure,
  });
  const sp = mod(t * 0.030, 1);
  tickRing(ctx, cx, cy, R + 7, R + 12, 30, {
    color: withA(C.bone, 0.08 + 0.10 * wake), alpha: 0.55, w: 1,
    a0: aRisk + sp * 0.5, a1: aSure + sp * 0.5,
  });
  if (wake < 0.99) {
    const rs = aRisk + mod(t * 0.16, 1) * (aSure - aRisk);
    const ra = 0.45 * (1 - wake);
    line(ctx, cx + Math.cos(rs) * 18, cy + Math.sin(rs) * 18,
      cx + Math.cos(rs) * (R - 5), cy + Math.sin(rs) * (R - 5),
      { color: withA(C.amberHi, ra * 0.55), w: 1 });
  }

  const selfTest = ease.outCubic(seg(t, 12.33, 13.05));
  const parkAng = lerp(aRisk, aSure, selfTest);
  const SW0 = 13.10, SW1 = 13.45;
  const raw = seg(t, SW0, SW1);
  const sw = raw <= 0 ? 0 : (raw >= 1 ? 1 : ease.outElastic(raw));
  const ang = lerp(parkAng, aRisk, clamp(sw, 0, 1.08)) + Math.sin(t * 2.3) * 0.006;
  if (Math.abs(ang - aSure) > 0.03 && wake > 0.3) {
    donut(ctx, cx, cy, R - 17, R - 6, Math.min(ang, aSure), Math.max(ang, aSure), {
      color: withA(C.amber, 0.13 + 0.05 * wake), alpha: 1,
    });
  }
  if (wake > 0.001) {
    ctx.save();
    ctx.globalAlpha = wake;
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    poly(ctx, [[-8, 0], [-2, -3.2], [R - 10, -0.9], [R + 3, 0], [R - 10, 0.9], [-2, 3.2]], {
      fill: withA(C.amberHi, 0.94), alpha: 1,
    });
    poly(ctx, [[R - 24, -1.5], [R + 2, 0], [R - 24, 1.5]], { fill: C.verm, alpha: 0.5 });
    ctx.restore();
  }
  glowDot(ctx, cx, cy, 18, C.amber, (0.05 + 0.22 * wake) * (0.9 + 0.1 * beat), true);
  ring(ctx, cx, cy, 4 + 0.6 * Math.sin(t * 2.4), 0, TAU, {
    color: withA(C.amberHi, 0.85), w: 1.2, alpha: 0.2 + 0.75 * wake,
  });

  {
    const ex = cx + Math.cos(aRisk) * R, ey = cy + Math.sin(aRisk) * R;
    if (Math.abs(t - 13.45) < 0.015) {
      ring(ctx, ex, ey, 20, 0, TAU, { color: C.amberHi, w: 2, alpha: 0.5, glow: 16 });
      glowDot(ctx, ex, ey, 38, C.amberHi, 0.28, true);
    }
    const gl = seg(t, 13.45, 13.95);
    if (gl > 0 && gl < 1) {
      ring(ctx, ex, ey, 5 + 26 * ease.outCubic(gl), 0, TAU, {
        color: C.amberHi, w: 1.2, alpha: 0.28 * (1 - gl), glow: 10,
      });
    }
  }

  const zeroIn = ease.outCubic(seg(t, 13.05, 13.40));
  if (zeroIn > 0.001) {
    text(ctx, '0', cx, cy - 12, {
      size: 26, family: F.latin, align: 'center',
      color: withA(C.verm, 0.92 * zeroIn), glow: 14, glowColor: withA(C.verm, 0.5),
    });
    for (let k = 0; k < 2; k++) {
      const pp = seg(t, 13.05 + k * 0.16, 13.9 + k * 0.16);
      if (pp > 0 && pp < 1) {
        ring(ctx, cx, cy, 10 + 26 * ease.outCubic(pp), 0, TAU, {
          color: C.verm, w: 1, alpha: 0.22 * (1 - pp), glow: 8,
        });
      }
    }
  }

  text(ctx, '风险', 776, 492, {
    size: 26, family: F.sans, align: 'right', tracking: 3,
    color: withA(C.amberHi, 0.92 * wake), alpha: wake,
  });
  text(ctx, '稳妥', 1026, 492, {
    size: 26, family: F.sans, align: 'left', tracking: 3,
    color: withA(C.bone2, 0.7 * wake), alpha: wake,
  });
  ctx.restore();
}

// ───────────────────────────────────────── 分割线 + 年份
function divider(ctx, t, env) {
  const inP = ease.outCubic(seg(t, 0, 0.48));
  line(ctx, 64, DIV, lerp(64, 1216, inP), DIV, { color: withA(C.bone, 0.18), w: 1 });

  const hp = mod(t * 0.075, 1);
  const hx = lerp(-40, 1320, hp);
  const g = ctx.createLinearGradient(hx - 130, 0, hx + 130, 0);
  g.addColorStop(0, withA(C.cyan, 0));
  g.addColorStop(0.42, withA(C.cyanHi, 0.24));
  g.addColorStop(0.62, withA(C.amberHi, 0.20));
  g.addColorStop(1, withA(C.amber, 0));
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(hx - 130, DIV - 0.9, 260, 1.8);
  ctx.restore();

  const dd = mod(t * 5.4, 34);
  ctx.save();
  ctx.strokeStyle = withA(C.bone, 0.10);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 64 + dd; x < 1216; x += 34) {
    ctx.moveTo(x, DIV + 3);
    ctx.lineTo(x, DIV + 8);
  }
  ctx.stroke();
  ctx.restore();

  const yIn = ease.outCubic(seg(t, 0.5, 1.2));
  if (yIn > 0.001) {
    line(ctx, 96, DIV - 4, 96, DIV - 11, { color: withA(C.cyan, 0.5 * yIn), w: 1 });
    text(ctx, '2008', 96, 330, {
      size: 11, family: F.mono, tracking: 4, color: withA(C.cyan, 0.8 * yIn), alpha: yIn,
    });
    line(ctx, 1184, DIV + 3, 1184, DIV + 10, { color: withA(C.amber, 0.5 * yIn), w: 1 });
    text(ctx, '2026', 1184, DIV + 22, {
      size: 11, family: F.mono, tracking: 4, align: 'right', color: withA(C.amber, 0.8 * yIn), alpha: yIn,
    });
  }
}

// ───────────────────────────────────────── 结句 + 中文对照
function closing(ctx, t, env) {
  const a1 = ease.outCubic(seg(t, 12.90, 13.55));
  if (a1 > 0.001) {
    text(ctx, '2008 · 更耐心', 96, 424, {
      size: 30, family: F.serif, tracking: 4, color: withA(C.cyanHi, 0.95), alpha: a1,
      glow: 10, glowColor: withA(C.cyan, 0.25),
      perChar: revealChars(t, 12.90, 0.5, 0.4, 3.3, 'up'),
    });
  }
  const a2 = ease.outCubic(seg(t, 13.32, 13.97));
  if (a2 > 0.001) {
    text(ctx, '2026 · 更冒险', 96, 470, {
      size: 30, family: F.serif, tracking: 4, color: withA(C.amberHi, 0.96), alpha: a2,
      glow: 10, glowColor: withA(C.amber, 0.3),
      perChar: revealChars(t, 13.32, 0.5, 0.4, 7.1, 'up'),
    });
  }

  const p = ease.outCubic(seg(t, 14.50, 15.35));
  if (p > 0.001) {
    ctx.save();
    const g = ctx.createRadialGradient(330, 528, 10, 330, 528, 360);
    g.addColorStop(0, withA(C.void, 0.7 * p));
    g.addColorStop(0.6, withA(C.void, 0.3 * p));
    g.addColorStop(1, withA(C.void, 0));
    ctx.translate(330, 528); ctx.scale(1.3, 0.34); ctx.translate(-330, -528);
    ctx.fillStyle = g;
    ctx.fillRect(-120, 430, 940, 300);
    ctx.restore();
    text(ctx, '同一个把戏，两个方向。', 96, 540, {
      size: 32, family: F.serif, weight: 400, tracking: 6,
      color: withA(C.bone, 0.98), glow: 14, glowColor: withA(C.amber, 0.26),
      perChar: revealChars(t, 14.50, 0.5, 0.88, 6.1, 'up'),
    });
  }
}

// ───────────────────────────────────────── 小工具
function bigArrow(ctx, o) {
  const ang = Math.atan2(o.y2 - o.y1, o.x2 - o.x1);
  const len = Math.hypot(o.x2 - o.x1, o.y2 - o.y1);
  const grow = clamp(o.grow === undefined ? 1 : o.grow);
  if (grow <= 0.001 || len < 2) return;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const tipD = len * grow;
  const tx = o.x1 + ca * tipD, ty = o.y1 + sa * tipD;
  const hh = o.head * (0.16 + 0.84 * Math.min(1, grow * 1.25));
  const hl = Math.min(hh * 0.78, tipD * 0.92);
  const bx = tx - ca * hl, by = ty - sa * hl;
  const nx = -sa, ny = ca;

  ctx.save();
  ctx.globalAlpha = clamp(o.alpha * 0.55);
  ctx.strokeStyle = o.color;
  ctx.lineWidth = o.shaft;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(o.x1, o.y1);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(bx + nx * hh * 0.52, by + ny * hh * 0.52);
  ctx.lineTo(bx - nx * hh * 0.52, by - ny * hh * 0.52);
  ctx.closePath();
  ctx.fillStyle = o.color;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = clamp(o.alpha * 3.4);
  ctx.strokeStyle = o.color;
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(bx + nx * hh * 0.52, by + ny * hh * 0.52);
  ctx.lineTo(bx - nx * hh * 0.52, by - ny * hh * 0.52);
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = clamp(o.alpha * 3.0);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(o.x1, o.y1);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.restore();

  if (grow > 0.85 && o.flow !== undefined) {
    const s = o.head * 0.070;
    for (let k = 0; k < 4; k++) {
      const u = mod(o.flow * 0.33 + k / 4, 1);
      const px = lerp(o.x1, bx, u), py = lerp(o.y1, by, u);
      const aa = o.alpha * 2.2 * (1 - Math.abs(u - 0.45) * 1.5);
      if (aa <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = clamp(aa);
      ctx.strokeStyle = o.color;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px - ca * s + nx * s * 1.4, py - sa * s + ny * s * 1.4);
      ctx.lineTo(px + ca * s * 1.6, py + sa * s * 1.6);
      ctx.lineTo(px - ca * s - nx * s * 1.4, py - sa * s - ny * s * 1.4);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function dashedBox(ctx, x, y, w, h, color, alpha, dash) {
  if (alpha <= 0.004) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.setLineDash(dash || [3, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}
