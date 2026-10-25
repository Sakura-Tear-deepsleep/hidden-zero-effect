
// engine.js - the visual system for "The Hidden Zero"
import { createCanvas } from '@napi-rs/canvas';

export const TAU = Math.PI * 2;
export const C = {
  void:   '#04060A',
  abyss:  '#050A10',
  ink:    '#0A1119',
  slate:  '#111A24',
  steel:  '#6F8494',
  steelD: '#3D4E5C',
  bone:   '#EFE3CE',
  bone2:  '#C9BCA8',
  bone3:  '#8C8578',
  amber:  '#F5A34A',
  amberHi:'#FFD79A',
  amberD: '#8A4E17',
  cyan:   '#63D6D6',
  cyanHi: '#C4F7F2',
  cyanD:  '#1B5257',
  verm:   '#E8452B',
  vermHi: '#FF8B72',
  white:  '#FFFFFF',
};
export const F = {
  serif: '"SimSun", "STSong", serif',
  sans:  '"Microsoft YaHei", "SimHei", sans-serif',
  mono:  '"Consolas", "Cascadia Mono", monospace',
  latin: '"Georgia", "Times New Roman", serif',
};

// ---------------------------------------------------------------- math
export const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const map=(v,a,b,c,d)=>c+(d-c)*((v-a)/(b-a));
export const sat=(v)=>clamp(v,0,1);
export const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const seg=(t,a,b)=>sat((t-a)/(b-a));
export const segE=(t,a,b,easeFn)=>easeFn(sat((t-a)/(b-a)));
export const mod=(a,b)=>((a%b)+b)%b;

export const ease = {
  linear: t=>t,
  inQuad: t=>t*t,
  outQuad: t=>1-(1-t)*(1-t),
  inOutQuad: t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,
  inCubic: t=>t*t*t,
  outCubic: t=>1-Math.pow(1-t,3),
  inOutCubic: t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
  outQuart: t=>1-Math.pow(1-t,4),
  outQuint: t=>1-Math.pow(1-t,5),
  inOutQuint: t=>t<.5?16*t*t*t*t*t:1-Math.pow(-2*t+2,5)/2,
  outExpo: t=>t>=1?1:1-Math.pow(2,-10*t),
  inExpo: t=>t<=0?0:Math.pow(2,10*t-10),
  outBack: t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);},
  outElastic: t=>{if(t<=0)return 0;if(t>=1)return 1;const c=TAU/3;return Math.pow(2,-10*t)*Math.sin((t*10-.75)*c)+1;},
  smooth: t=>t*t*(3-2*t),
};

// ---------------------------------------------------------------- rng / noise
export function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function hash1(n){n=Math.sin(n*127.1+311.7)*43758.5453;return n-Math.floor(n);}
export function hash2(x,y){const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
export function vnoise(x,seed=0){
  const i=Math.floor(x), f=x-i;
  const a=hash1(i+seed*97.13), b=hash1(i+1+seed*97.13);
  const u=f*f*(3-2*f);
  return lerp(a,b,u);
}
export function fbm1(x,seed=0,oct=3){
  let v=0,amp=.5,fr=1;
  for(let i=0;i<oct;i++){v+=amp*vnoise(x*fr,seed+i*13.7);amp*=.5;fr*=2.03;}
  return v;
}

// ---------------------------------------------------------------- color
export function withA(hex,a){
  const h=hex.replace('#','');
  const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  return 'rgba('+r+','+g+','+b+','+clamp(a).toFixed(3)+')';
}
export function mix(h1,h2,t){
  const p=h=>{const s=h.replace('#','');return [parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)];};
  const a=p(h1),b=p(h2);
  return 'rgb('+Math.round(lerp(a[0],b[0],t))+','+Math.round(lerp(a[1],b[1],t))+','+Math.round(lerp(a[2],b[2],t))+')';
}

// ---------------------------------------------------------------- env
export function createEnv(p){
  const { W,H,FPS,DUR,grid,canvas,ctx } = p;
  const TOTAL = p.TOTAL || Math.round(DUR*FPS);
  const bars = (grid.bars||[]).map(b=>[b[1], b[2]]);
  const dBmin = -18, dBmax = -8.6;
  const energyArr = bars.map(b=>clamp((b[1]-dBmin)/(dBmax-dBmin)));
  // parallax dust
  const rnd = mulberry32(20261024);
  const dust = [];
  for(let i=0;i<230;i++){
    dust.push({ x:rnd()*W, y:rnd()*H, z:.25+rnd()*1.1, s:.4+rnd()*1.7, ph:rnd()*TAU, tw:.4+rnd()*2.2, hue:rnd() });
  }
  // grain tiles
  const grainTiles = [];
  const tile = 192;
  for(let k=0;k<7;k++){
    const c = createCanvas(tile,tile); const g=c.getContext('2d');
    const id=g.createImageData(tile,tile);
    const r2 = mulberry32(9001+k*77);
    for(let i=0;i<tile*tile;i++){
      const v = 40 + r2()*215;
      id.data[i*4]=v; id.data[i*4+1]=v; id.data[i*4+2]=v; id.data[i*4+3]=255;
    }
    g.putImageData(id,0,0);
    grainTiles.push(c);
  }
  // vignette cache
  const vc = createCanvas(W,H); const vg = vc.getContext('2d');
  const rg = vg.createRadialGradient(W*0.5,H*0.48,H*0.18, W*0.5,H*0.5,H*0.86);
  rg.addColorStop(0,'rgba(0,0,0,0)');
  rg.addColorStop(0.66,'rgba(0,0,0,0.10)');
  rg.addColorStop(1,'rgba(0,0,0,0.46)');
  vg.fillStyle=rg; vg.fillRect(0,0,W,H);
  const env = {
    w:W,h:H,fps:FPS,duration:DUR,total:TOTAL,canvas,ctx,
    grid, dust, grainTiles, vignette:vc,
    pal: C,
    energy: (t)=>{ const bi=Math.max(0,Math.min(bars.length-1, Math.floor((t-grid.phase)/grid.bar))); return energyArr[bi]!==undefined?energyArr[bi]:0.6; },
    beatIdx: (t)=>Math.floor((t-grid.phase)/grid.period),
    beatTime: (k)=>grid.phase+k*grid.period,
    beatPhase: (t)=>mod((t-grid.phase)/grid.period,1),
    beat: (t,sharp=3)=>{ const fr=mod((t-grid.phase)/grid.period,1); return Math.pow(1-fr,sharp); },
    barPhase: (t)=>mod((t-grid.phase)/grid.bar,1),
    barIdx: (t)=>Math.floor((t-grid.phase)/grid.bar),
    barStartOf: (k)=>grid.phase+k*grid.bar,
  };
  return env;
}

// ---------------------------------------------------------------- text
export function setFont(ctx,size,family,weight){
  ctx.font = (weight||400)+' '+size+'px '+(family||F.sans);
}
export function measureTracked(ctx,str,size,family,weight,tracking){
  setFont(ctx,size,family,weight);
  let w=0; for(const ch of str) w+=ctx.measureText(ch).width;
  return w + tracking*(str.length-1);
}
// o: {size,family,weight,color,tracking,align,alpha,glow,glowColor,dy,shadow,perChar(i,n)->{dx,dy,alpha,scale}}
export function text(ctx,str,x,y,o){
  o=o||{};
  const size=o.size||40, family=o.family||F.sans, weight=o.weight||400;
  const tracking=o.tracking||0, alpha=o.alpha===undefined?1:o.alpha;
  if(alpha<=0.001) return 0;
  const total=measureTracked(ctx,str,size,family,weight,tracking);
  let cx=x;
  if(o.align==='center') cx=x-total/2;
  else if(o.align==='right') cx=x-total;
  ctx.save();
  setFont(ctx,size,family,weight);
  ctx.textAlign='left'; ctx.textBaseline=o.baseline||'alphabetic';
  if(o.glow){ ctx.shadowColor=o.glowColor||o.color||C.bone; ctx.shadowBlur=o.glow; }
  const n=str.length;
  for(let i=0;i<n;i++){
    const ch=str[i];
    const cw=ctx.measureText(ch).width;
    const pc=o.perChar?o.perChar(i,n):null;
    const a=(alpha)*(pc&&pc.alpha!==undefined?pc.alpha:1);
    if(a>0.003 && ch!==' '){
      ctx.globalAlpha=a;
      if(pc&&pc.scale&&pc.scale!==1){
        ctx.save();
        ctx.translate(cx+cw/2+(pc.dx||0), y+(pc.dy||0)+(o.dy||0));
        ctx.scale(pc.scale,pc.scale);
        ctx.fillStyle=o.color||C.bone;
        ctx.fillText(ch,-cw/2,0);
        ctx.restore();
      } else {
        ctx.fillStyle=o.color||C.bone;
        ctx.fillText(ch, cx+(pc&&pc.dx||0), y+(pc&&pc.dy||0)+(o.dy||0));
      }
    }
    cx += cw + tracking;
  }
  ctx.restore();
  return total;
}
// character reveal helper: returns perChar fn
export function revealChars(t,t0,dur,stagger,jitterSeed,dir){
  return (i,n)=>{
    const st = t0 + (i/n)*stagger;
    const p = seg(t, st, st+dur);
    const e = ease.outCubic(p);
    const j = jitterSeed? (hash2(i,jitterSeed)-.5) : 0;
    return {
      alpha: e,
      dy: (1-e)*(dir==='up'?-1:1)*18 + j*3*(1-e),
      dx: j*2*(1-e),
    };
  };
}

// ---------------------------------------------------------------- primitives
export function glowDot(ctx,x,y,r,color,alpha,hard){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0, withA(color, alpha));
  g.addColorStop(hard?0.55:0.28, withA(color, alpha*0.42));
  g.addColorStop(1, withA(color, 0));
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill();
}
export function glowEllipse(ctx,x,y,rx,ry,color,alpha,rot){
  ctx.save(); ctx.translate(x,y); if(rot) ctx.rotate(rot); ctx.scale(1,ry/rx);
  const g=ctx.createRadialGradient(0,0,0,0,0,rx);
  g.addColorStop(0, withA(color, alpha)); g.addColorStop(.3, withA(color,alpha*.4)); g.addColorStop(1, withA(color,0));
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,rx,0,TAU); ctx.fill(); ctx.restore();
}
export function ring(ctx,cx,cy,r,a0,a1,o){
  o=o||{};
  ctx.save();
  ctx.strokeStyle=o.color||C.bone; ctx.lineWidth=o.w||2;
  ctx.globalAlpha=(o.alpha===undefined?1:o.alpha);
  if(o.glow){ctx.shadowColor=o.glowColor||o.color||C.bone;ctx.shadowBlur=o.glow;}
  if(o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath(); ctx.arc(cx,cy,r,a0,a1); ctx.stroke();
  ctx.restore();
}
export function donut(ctx,cx,cy,r0,r1,a0,a1,o){
  o=o||{};
  ctx.save(); ctx.globalAlpha=(o.alpha===undefined?1:o.alpha);
  if(o.glow){ctx.shadowColor=o.glowColor||o.color||C.bone;ctx.shadowBlur=o.glow;}
  ctx.fillStyle=o.color||C.bone;
  ctx.beginPath();
  ctx.arc(cx,cy,r1,a0,a1); ctx.arc(cx,cy,r0,a1,a0,true); ctx.closePath(); ctx.fill();
  ctx.restore();
}
export function line(ctx,x1,y1,x2,y2,o){
  o=o||{};
  ctx.save(); ctx.strokeStyle=o.color||C.bone; ctx.lineWidth=o.w||1.5;
  ctx.globalAlpha=(o.alpha===undefined?1:o.alpha);
  if(o.glow){ctx.shadowColor=o.glowColor||o.color||C.bone;ctx.shadowBlur=o.glow;}
  if(o.dash) ctx.setLineDash(o.dash);
  if(o.cap) ctx.lineCap=o.cap;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore();
}
export function poly(ctx,pts,o){
  o=o||{};
  ctx.save(); ctx.beginPath();
  pts.forEach((p,i)=> i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
  if(o.close!==false) ctx.closePath();
  if(o.fill){ctx.fillStyle=o.fill; if(o.alpha!==undefined)ctx.globalAlpha=o.alpha; ctx.fill();}
  if(o.stroke){ctx.strokeStyle=o.stroke; ctx.lineWidth=o.w||1.5; if(o.alpha!==undefined)ctx.globalAlpha=o.alpha; ctx.stroke();}
  ctx.restore();
}
export function rect(ctx,x,y,w,h,o){
  o=o||{};
  ctx.save(); if(o.alpha!==undefined)ctx.globalAlpha=o.alpha;
  if(o.fill){ctx.fillStyle=o.fill; ctx.fillRect(x,y,w,h);}
  if(o.stroke){ctx.strokeStyle=o.stroke; ctx.lineWidth=o.w||1; ctx.strokeRect(x+.5,y+.5,w-1,h-1);}
  ctx.restore();
}
export function tickRing(ctx,cx,cy,r0,r1,n,o){
  o=o||{};
  ctx.save(); ctx.globalAlpha=(o.alpha===undefined?1:o.alpha); ctx.strokeStyle=o.color||C.bone; ctx.lineWidth=o.w||1;
  for(let i=0;i<n;i++){
    const a=o.a0!==undefined?o.a0:0, a1=o.a1!==undefined?o.a1:TAU;
    const ang=a+(a1-a)*i/n;
    const rr1=(o.tickEvery&&i%o.tickEvery===0)?r1+((o.long||6)):r1;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(ang)*r0, cy+Math.sin(ang)*r0);
    ctx.lineTo(cx+Math.cos(ang)*rr1, cy+Math.sin(ang)*rr1);
    ctx.stroke();
  }
  ctx.restore();
}
// clipped reveal: dir 'up'|'left'|'right'|'down'
export function masked(ctx,x,y,w,h,p,dir){
  p=clamp(p);
  if(p<=0) return false;
  ctx.save();
  if(dir==='left'){ ctx.beginPath(); ctx.rect(x,y,w*p,h); ctx.clip(); }
  else if(dir==='right'){ ctx.beginPath(); ctx.rect(x+w*(1-p),y,w*p,h); ctx.clip(); }
  else if(dir==='down'){ ctx.beginPath(); ctx.rect(x,y,w,h*p); ctx.clip(); }
  else { ctx.beginPath(); ctx.rect(x,y,w,h*(1-p)); ctx.clip(); }
  return true;
}

// ---------------------------------------------------------------- ambient (always-alive layer)
export function ambientField(ctx,t,env,o){
  o=o||{};
  const W=env.w,H=env.h;
  const warm=o.warm===undefined?1:o.warm;
  ctx.save();
  // base wash
  const g0=ctx.createLinearGradient(0,0,W*0.4,H);
  g0.addColorStop(0,'#070B12'); g0.addColorStop(.45,'#05080D'); g0.addColorStop(1,'#04060A');
  ctx.fillStyle=g0; ctx.fillRect(0,0,W,H);
  // three drifting light fields (never repeat: irrational frequencies)
  const fields=[
    {cx:W*0.30+Math.sin(t*0.0431)*W*0.20+Math.sin(t*0.0117)*W*0.08, cy:H*0.34+Math.cos(t*0.0367)*H*0.22, r:W*0.52, c:'#2A6E7A', a:0.13},
    {cx:W*0.74+Math.cos(t*0.0287)*W*0.18, cy:H*0.62+Math.sin(t*0.0513)*H*0.20, r:W*0.46, c:'#7A3A18', a:0.15*warm},
    {cx:W*0.50+Math.sin(t*0.0191+2.1)*W*0.26, cy:H*0.50+Math.cos(t*0.0241+1.2)*H*0.26, r:W*0.70, c:'#123040', a:0.16},
  ];
  const breath=0.86+0.14*Math.sin(t*0.55)+0.05*Math.sin(t*1.37);
  for(const f of fields){
    const g=ctx.createRadialGradient(f.cx,f.cy,0,f.cx,f.cy,f.r);
    g.addColorStop(0, withA(f.c,f.a*breath)); g.addColorStop(1, withA(f.c,0));
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }
  // horizon haze band
  const hy=H*(0.62+0.03*Math.sin(t*0.033));
  const gh=ctx.createLinearGradient(0,hy-H*0.22,0,hy+H*0.30);
  gh.addColorStop(0,withA('#000000',0)); gh.addColorStop(.5,withA('#0C1A22',0.30)); gh.addColorStop(1,withA('#000000',0));
  ctx.fillStyle=gh; ctx.fillRect(0,0,W,H);
  ctx.restore();
  dustField(ctx,t,env,{alpha:o.dust===undefined?1:o.dust});
}

export function dustField(ctx,t,env,o){
  o=o||{};
  const W=env.w,H=env.h;
  const base=o.alpha===undefined?1:o.alpha;
  if(base<=0) return;
  ctx.save();
  for(const d of env.dust){
    const px=mod(d.x + t*(4.0+d.z*9.0)*d.z, W+40)-20;
    const py=mod(d.y - t*(2.2+d.z*5.0)*d.z + Math.sin(t*0.7+d.ph)*8*d.z, H+40)-20;
    const tw=0.35+0.65*Math.abs(Math.sin(t*d.tw+d.ph));
    const a=base*(0.10+0.34*d.z)*tw;
    const col = d.hue>0.72? C.amber : (d.hue<0.4? C.cyan : C.bone);
    ctx.globalAlpha=a;
    ctx.fillStyle=col;
    const s=d.s*(0.6+d.z*0.8);
    ctx.fillRect(px,py,s,s);
  }
  ctx.restore();
}

// bloom: cheap downsample blur added back with 'lighter'
let _bloomC = null, _bloomX = null;
function bloomPass(ctx, env, amount) {
  const W = env.w, H = env.h;
  const bw = Math.round(W / 3), bh = Math.round(H / 3);
  if (!_bloomC) { _bloomC = createCanvas(bw, bh); _bloomX = _bloomC.getContext('2d'); }
  const bx = _bloomX;
  bx.setTransform(1,0,0,1,0,0);
  bx.globalCompositeOperation = 'source-over';
  bx.clearRect(0,0,bw,bh);
  try { bx.filter = 'brightness(0.72) contrast(1.45) blur(2px)'; } catch (e) {}
  bx.drawImage(env.canvas, 0, 0, bw, bh);
  bx.filter = 'none';
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = amount;
  ctx.drawImage(_bloomC, 0, 0, W, H);
  ctx.restore();
}
// ---------------------------------------------------------------- post
export function post(ctx,t,env,o){
  o=o||{};
  const W=env.w,H=env.h;
  bloomPass(ctx, env, o.bloom===undefined?0.30:o.bloom);
  // subtle warm/cool split grade
  const gr=ctx.createLinearGradient(0,0,W,H);
  gr.addColorStop(0,'rgba(0,40,60,0.10)');
  gr.addColorStop(0.55,'rgba(0,0,0,0)');
  gr.addColorStop(1,'rgba(90,40,0,0.12)');
  ctx.save(); ctx.globalCompositeOperation='overlay'; ctx.fillStyle=gr; ctx.fillRect(0,0,W,H); ctx.restore();
  // vignette
  ctx.save(); ctx.globalAlpha=(o.vig===undefined?0.55:o.vig); ctx.drawImage(env.vignette,0,0); ctx.restore();
  // grain (cycling tiles, random offset per frame)
  const fi=Math.round(t*env.fps);
  const tile=env.grainTiles[fi%env.grainTiles.length];
  let pat=null;
  try{ pat=ctx.createPattern(tile,'repeat'); }catch(e){}
  if(pat){
    const ox=(fi*37.7)%192, oy=(fi*61.3)%192;
    ctx.save(); ctx.globalAlpha=o.grain===undefined?0.075:o.grain;
    ctx.globalCompositeOperation='overlay';
    ctx.translate(ox,oy); ctx.fillStyle=pat;
    ctx.fillRect(-ox,-oy,W+192,H+192);
    ctx.restore();
  }
  // slow scan band
  const sy=mod(t*38, H+420)-210;
  const gs=ctx.createLinearGradient(0,sy-160,0,sy+160);
  gs.addColorStop(0,withA(C.cyan,0)); gs.addColorStop(.5,withA(C.cyan,0.022)); gs.addColorStop(1,withA(C.cyan,0));
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=gs; ctx.fillRect(0,sy-160,W,320); ctx.restore();
  // scanlines (2px period, very light)
  ctx.save(); ctx.globalAlpha=0.035; ctx.fillStyle='#000';
  for(let y=0;y<H;y+=3) ctx.fillRect(0,y,W,1);
  ctx.restore();
  if(o.flash){ // white flash on hard cuts
    ctx.save(); ctx.globalAlpha=o.flash; ctx.fillStyle='#FFE9CF'; ctx.fillRect(0,0,W,H); ctx.restore();
  }
  if(o.black){ ctx.save(); ctx.globalAlpha=o.black; ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H); ctx.restore(); }
}

// ---------------------------------------------------------------- signature motif
// A ring with a gap; gapArc 0..1 of the circle missing, starting at gapRot
export function gapRing(ctx,cx,cy,r,gapArc,gapRot,o){
  o=o||{};
  const a1=gapRot+(TAU*(1-gapArc));
  ring(ctx,cx,cy,r,gapRot,a1,o);
  if(o.fillGap){
    donut(ctx,cx,cy,o.inner||r*0.55,r,gapRot,gapRot+TAU*gapArc,{color:o.fillGap,alpha:o.fillGapA===undefined?1:o.fillGapA});
  }
}
// probability arc: a filled arc of sweep p*TAU from -PI/2, with a tail glow
export function probArc(ctx,cx,cy,r0,r1,p,o){
  o=o||{};
  const a0=-Math.PI/2;
  donut(ctx,cx,cy,r0,r1,a0,a0+TAU*p,{color:o.color||C.amber,alpha:o.alpha,glow:o.glow});
  if(o.tick){
    tickRing(ctx,cx,cy,r1+6,r1+14,60,{color:o.tickColor||withA(C.bone,0.35),alpha:.5,w:1,tickEvery:5});
  }
}
