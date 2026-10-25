// render.mjs - deterministic frame renderer for 'The Hidden Zero'
// usage:
//   node render.mjs --stills=0,17.2,48.7
//   node render.mjs --contact --keys=48 --from=0 --to=150.4
//   node render.mjs --frames [--from=0] [--to=TOTAL] [--force]
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) args[m[1]] = m[2] === undefined ? true : m[2];
}
const PROJECT = JSON.parse(fs.readFileSync(path.join(__dirname,'project.json'),'utf8'));
const DW = PROJECT.designWidth || PROJECT.width, DH = PROJECT.designHeight || PROJECT.height;
const W = DW, H = DH, FPS = PROJECT.fps, DUR = PROJECT.duration;
const SS = PROJECT.width / DW;
const SUBS = JSON.parse(fs.readFileSync(path.join(__dirname,'src','subtitles.json'),'utf8'));
const TOTAL = Math.round(DUR * FPS);

const engine = await import('./src/engine.js');
const timelineMod = await import('./src/scenes/index.js');
const scenes = timelineMod.default;
const grid = JSON.parse(fs.readFileSync(path.join(__dirname,'audio','grid.json'),'utf8'));
// [startTime, "r,g,b", duration] impact light bursts on major cuts
const IMPACTS = [
  [17.1475, '255,196,120', 0.42],
  [48.67,   '255,225,180', 0.50],
  [103.19,  '255,206,150', 0.55],
  [132.075, '255,232,196', 0.62],
  [148.30,  '255,214,160', 0.40],
];

const canvas = createCanvas(PROJECT.width, PROJECT.height);
const ctx = canvas.getContext('2d');
const envBase = engine.createEnv({ W: DW, H: DH, FPS, DUR, grid, TOTAL, canvas, ctx });

// ---------- narration subtitles (design space 1280x720) ----------
function segmentText(ctx, str, x, y, o) {
  // 「…」 segments are drawn in the highlight colour
  const parts = [];
  let buf = '', hi = false;
  for (const ch of str) {
    if (ch === '「') { if (buf) parts.push([buf, hi]); buf = ''; hi = true; }
    else if (ch === '」') { if (buf) parts.push([buf, hi]); buf = ''; hi = false; }
    else buf += ch;
  }
  if (buf) parts.push([buf, hi]);
  const widths = parts.map(([s]) => engine.measureTracked(ctx, s, o.size, o.family, o.weight, o.tracking));
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = o.align === 'center' ? x - total / 2 : x;
  parts.forEach(([s, h], i) => {
    engine.text(ctx, s, cx, y, {
      size: o.size, family: o.family, weight: o.weight, tracking: o.tracking,
      color: h ? C_AMBERHI : o.color, alpha: o.alpha,
      glow: h ? 12 : 0, glowColor: 'rgba(255,190,120,0.5)',
    });
    cx += widths[i];
  });
  return total;
}

function drawSubs(ctx, t) {
  let cur = null;
  for (const s of SUBS) if (t >= s.s && t <= s.e) { cur = s; break; }
  if (!cur) return;
  const aIn = Math.min(1, (t - cur.s) / 0.22);
  const aOut = Math.min(1, (cur.e - t) / 0.20);
  const a = Math.min(aIn, aOut);
  if (a <= 0.004) return;
  const lines = cur.t.split(String.fromCharCode(10));
  // scrim
  ctx.save();
  const g = ctx.createLinearGradient(0, 566, 0, 720);
  g.addColorStop(0, 'rgba(4,6,10,0)');
  g.addColorStop(0.40, 'rgba(4,6,10,0.44)');
  g.addColorStop(1, 'rgba(4,6,10,0.72)');
  ctx.globalAlpha = a;
  ctx.fillStyle = g; ctx.fillRect(0, 566, 1280, 154);
  ctx.restore();
  // text
  const ys = lines.length === 1 ? [652] : [608, 658];
  lines.forEach((ln, i) => {
    const dy = (1 - aIn) * 9;
    segmentText(ctx, ln, 640, ys[i] + dy, {
      size: lines.length === 1 ? 34 : 31, family: engine.F.sans, weight: 500,
      tracking: 2.2, color: '#F2E8D8', alpha: a, align: 'center',
    });
  });
}
const C_AMBERHI = engine.C.amberHi;

function renderAt(t) {
  const env = Object.assign({}, envBase, { t: t });
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.fillStyle = engine.C.void;
  ctx.fillRect(0,0,PROJECT.width,PROJECT.height);
  ctx.setTransform(SS,0,0,SS,0,0);
  engine.ambientField(ctx, t, env, {});
  for (const s of scenes) {
    if (t < s.start || t >= s.end) continue;
    const local = t - s.start;
    const p = Math.min(1, Math.max(0, local / (s.end - s.start)));
    let a = 1;
    const fi = s.fadeIn || 0, fo = s.fadeOut || 0;
    if (fi > 0) a = Math.min(a, local / fi);
    if (fo > 0) a = Math.min(a, (s.end - t) / fo);
    if (a <= 0) continue;
    ctx.save();
    ctx.globalAlpha = a;
    try {
      s.draw(ctx, local, env, p);
    } catch (err) {
      if (!renderAt._errs) renderAt._errs = new Set();
      const key = s.id + ':' + err.message;
      if (!renderAt._errs.has(key)) { renderAt._errs.add(key); console.error('[scene error]', key); }
    }
    ctx.restore();
  }
  drawSubs(ctx, t);
  engine.post(ctx, t, env, {});
  // impact flashes on major act cuts (defined in project.json)
  for (const f of IMPACTS) {
    const dt = t - f[0];
    if (dt >= 0 && dt < f[2]) {
      const q = 1 - dt / f[2];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(W/2, H*0.52, 0, W/2, H*0.52, W*0.62); // design space
      const pa = 0.26 * q * q;
      g.addColorStop(0, 'rgba(' + f[1] + ',' + pa.toFixed(3) + ')');
      g.addColorStop(0.30, 'rgba(' + f[1] + ',' + (pa * 0.30).toFixed(3) + ')');
      g.addColorStop(0.62, 'rgba(' + f[1] + ',' + (pa * 0.05).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + f[1] + ',0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      ctx.restore();
    }
  }
  return canvas;
}

function contactSheet(times, outPath, cols, tileW) {
  const tw = tileW, th = Math.round(tileW * H / W);
  const rows = Math.ceil(times.length / cols);
  const sheet = createCanvas(cols*tw, rows*th);
  const sctx = sheet.getContext('2d');
  sctx.fillStyle = '#000'; sctx.fillRect(0,0,sheet.width, sheet.height);
  const tmp = createCanvas(tw, th);
  const tctx = tmp.getContext('2d');
  times.forEach((t, i) => {
    renderAt(t);
    tctx.clearRect(0,0,tw,th);
    tctx.drawImage(canvas, 0,0, tw, th);
    const x = (i%cols)*tw, y = Math.floor(i/cols)*th;
    sctx.drawImage(tmp, x, y);
    sctx.fillStyle = 'rgba(0,0,0,0.6)';
    sctx.fillRect(x, y, 74, 20);
    sctx.fillStyle = '#FFD79A';
    sctx.font = '13px Consolas';
    sctx.fillText(t.toFixed(1)+'s', x+6, y+15);
    sctx.strokeStyle = 'rgba(255,255,255,0.10)';
    sctx.strokeRect(x+0.5,y+0.5,tw-1,th-1);
  });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, sheet.toBuffer('image/png'));
  console.log('CONTACT', outPath, cols + 'x' + rows);
}

const t0 = Date.now();
if (args.contact !== undefined) {
  const n = parseInt(args.keys || '48', 10);
  const f = parseFloat(args.from || '0'), to = parseFloat(args.to || String(DUR));
  const times = [];
  for (let i = 0; i < n; i++) times.push(f + (to - f) * (i + 0.5) / n);
  const out = typeof args.out === 'string' ? args.out : path.join(__dirname, 'out', 'contact.png');
  contactSheet(times, out, parseInt(args.cols || '8',10), parseInt(args.tile || '260',10));
} else if (args.stills !== undefined) {
  const times = String(args.stills).split(',').map(s => parseFloat(s));
  fs.mkdirSync(path.join(__dirname,'out','stills'), { recursive: true });
  times.forEach(t => {
    renderAt(t);
    const p = path.join(__dirname,'out','stills', 't' + t.toFixed(2) + '.png');
    fs.writeFileSync(p, canvas.toBuffer('image/png'));
    console.log('STILL', p);
  });
} else if (args.frames !== undefined || args.video !== undefined) {
  const from = parseInt(args.from || '0', 10);
  const to = Math.min(TOTAL, parseInt(args.to || String(TOTAL), 10));
  const dir = path.join(__dirname, 'frames');
  fs.mkdirSync(dir, { recursive: true });
  const q = parseInt(args.q || '95', 10);
  let wrote = 0;
  for (let i = from; i < to; i++) {
    const p = path.join(dir, 'f' + String(i).padStart(5,'0') + '.jpg');
    if (!args.force && fs.existsSync(p)) continue;
    renderAt(i / FPS);
    fs.writeFileSync(p, canvas.toBuffer('image/jpeg', q));
    wrote++;
    if (wrote % 150 === 0) {
      const el = (Date.now() - t0) / 1000;
      const per = el / Math.max(1, wrote);
      console.log('frames', i, el.toFixed(0) + 's', '| ' + per.toFixed(3) + ' s/frame | eta ' + ((to - i) * per).toFixed(0) + 's');
    }
  }
  console.log('FRAMES DONE', wrote, 'new, range', to-from, ((Date.now()-t0)/1000).toFixed(1)+'s');
}
console.log('elapsed', ((Date.now()-t0)/1000).toFixed(1)+'s');
