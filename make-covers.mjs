
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import fs from 'node:fs';

const SERIF = '"SimSun", serif', SANS = '"Microsoft YaHei", sans-serif', MONO = '"Consolas", monospace';
const AMBER = '#F5A34A', BONE = '#EFE3CE', AMBERHI = '#FFD79A', VERM = '#FF8B72';

function tracked(ctx, str, x, y, o) {
  ctx.font = (o.weight||400) + ' ' + o.size + 'px ' + (o.family||SANS);
  let total = 0; for (const ch of str) total += ctx.measureText(ch).width;
  total += (o.tracking||0) * (str.length - 1);
  let cx = x;
  if (o.align === 'center') cx = x - total/2;
  if (o.align === 'right') cx = x - total;
  for (const ch of str) {
    const w = ctx.measureText(ch).width;
    if (o.glow) { ctx.shadowColor = o.glowColor||AMBER; ctx.shadowBlur = o.glow; }
    ctx.fillStyle = o.color || BONE;
    ctx.globalAlpha = o.alpha===undefined?1:o.alpha;
    ctx.fillText(ch, cx, y);
    cx += w + (o.tracking||0);
  }
  ctx.shadowBlur = 0;
  return total;
}

const W = 1920, H = 1080;
function base(src) {
  const c = createCanvas(W, H); const x = c.getContext('2d');
  return loadImage(src).then(img => { x.drawImage(img, 0, 0, W, H); return { c, x }; });
}

// ---------- Cover A : the eye ----------
async function coverA(src, out) {
  const { c, x } = await base(src);
  const g = x.createLinearGradient(0, 0, W*0.78, H);
  g.addColorStop(0, 'rgba(3,5,9,0.92)');
  g.addColorStop(0.52, 'rgba(3,5,9,0.72)');
  g.addColorStop(1, 'rgba(3,5,9,0.05)');
  x.fillStyle = g; x.fillRect(0,0,W,H);
  tracked(x, '隐藏零效应', 120, 420, { size: 132, family: SERIF, tracking: 16, color: BONE, glow: 26, glowColor: 'rgba(245,163,74,0.55)' });
  x.fillStyle = AMBER; x.fillRect(124, 452, 660, 3);
  tracked(x, '你没看见的那 20%', 124, 540, { size: 56, family: SANS, weight: 500, tracking: 6, color: AMBERHI });
  tracked(x, '正在替你做出选择', 124, 616, { size: 56, family: SANS, weight: 500, tracking: 6, color: AMBERHI });
  tracked(x, 'THE  HIDDEN  ZERO  EFFECT', 124, 720, { size: 20, family: MONO, tracking: 10, color: 'rgba(201,188,168,0.75)' });
  fs.writeFileSync(out, c.toBuffer('image/jpeg', 94));
  console.log('coverA', out);
}

// ---------- Cover B : two buttons ----------
async function coverB(src, out) {
  const { c, x } = await base(src);
  x.fillStyle = 'rgba(3,5,9,0.34)'; x.fillRect(0,0,W,H);
  const g = x.createLinearGradient(0, 640, 0, H);
  g.addColorStop(0, 'rgba(3,5,9,0)'); g.addColorStop(1, 'rgba(3,5,9,0.90)');
  x.fillStyle = g; x.fillRect(0,600,W,H-600);
  tracked(x, '隐藏零效应', W/2, 800, { size: 116, family: SERIF, tracking: 18, color: BONE, align: 'center', glow: 24, glowColor: 'rgba(245,163,74,0.5)' });
  tracked(x, '选 A 还是选 B？—— 你的答案已经被写好了', W/2, 900, { size: 42, family: SANS, weight: 500, tracking: 4, color: AMBERHI, align: 'center' });
  tracked(x, 'THE  HIDDEN  ZERO  EFFECT', W/2, 968, { size: 18, family: MONO, tracking: 9, color: 'rgba(201,188,168,0.7)', align: 'center' });
  fs.writeFileSync(out, c.toBuffer('image/jpeg', 94));
  console.log('coverB', out);
}

// ---------- Cover C : three cards ----------
async function coverC(src, out) {
  const { c, x } = await base(src);
  const g = x.createLinearGradient(0, 520, 0, H);
  g.addColorStop(0, 'rgba(3,5,9,0)'); g.addColorStop(1, 'rgba(3,5,9,0.92)');
  x.fillStyle = g; x.fillRect(0,480,W,H-480);
  tracked(x, '都少了一半', W/2, 840, { size: 150, family: SERIF, tracking: 22, color: BONE, align: 'center', glow: 30, glowColor: 'rgba(245,163,74,0.6)' });
  tracked(x, '药效 90% · 年化 8% · 准确率 99%', W/2, 936, { size: 44, family: SANS, weight: 500, tracking: 5, color: AMBERHI, align: 'center' });
  tracked(x, '隐藏零效应', W/2, 1002, { size: 30, family: SERIF, tracking: 10, color: 'rgba(239,227,206,0.85)', align: 'center' });
  fs.writeFileSync(out, c.toBuffer('image/jpeg', 94));
  console.log('coverC', out);
}

await coverA('frames/f02645.jpg', 'out//publish/cover-A-eye.jpg');
await coverB('frames/f00198.jpg', 'out//publish/cover-B-buttons.jpg');
await coverC('frames/f03570.jpg', 'out//publish/cover-C-cards.jpg');
