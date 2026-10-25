# 《隐藏零效应》视觉与制作规范 v1（导演锁定版）

> 这是全片的制作合同。任何场景都必须遵守；违反的话会在审片时被打回。
> 参考实现：`src/scenes/a0-gap.js`（开场，已达交付水准）。要抄结构就抄它。

## 0. 片子是什么

- **主题**：认知心理学「隐藏零效应」（the hidden-zero effect）
- **一句话**：被省略的那个「0」，正在替你做出选择。
- **基调**：冷静、精密、有一点点不安；不是欢快的科普卡通风，也不是恐怖片。像一份很美的实验报告，也像一部克制的情感片。
- **科学依据（不许编）**：
  - Liang, Guo, Xu, Liu, Zhang & Zhou (2026). *Does zero mean nothing? Investigating the attentional mechanism of the hidden-zero effect in risky decision-making.* Psychonomic Bulletin & Review, 33, 157–173. N=197，两个研究，行为+眼动+计算建模。
  - 结论：**呈现零结果会显著提高选择风险选项的比例**（高风险 5%–30% 与低风险 70%–95% 条件下都成立）。
  - 机制：**不是价值重估，而是注意分配**——呈现零使注意力从确定选项转向风险选项的非零部分，注意力更多的选项被更多选择。
  - 经典前作：Magen, Dweck & Gross (2008) 的隐藏零效应（跨期选择：显式化零结果降低冲动选择）。
  - 历史锚点：零作为「占位符」最早见于巴比伦泥板；作为「数」在印度成形（婆罗摩笈多 628 年给出零的运算规则）。
- 用户要求：**不要真人配音、不要旁白**。只有画面 + 音乐。所有信息靠字幕/图形传达。

## 1. 规格

| 项 | 值 |
|---|---|
| 分辨率 | 1280×720 |
| 帧率 | 30 fps |
| 总时长 | 150.40 s（4512 帧） |
| 音乐 | `audio/bed_150.wav`（0–150.4s，尾部淡出） |
| 节拍栅格 | 每拍 0.5375 s（≈111.6 BPM），每小节 2.15 s；`env.beat(t)` / `env.beatPhase(t)` / `env.barStartOf(k)` |
| 色调 | 近黑蓝底 + 琥珀暖光 + 青色冷光 + 极少量朱红警示 |

## 2. 调色板（只能从这里取色）

```
void #04060A   abyss #050A10   ink #0A1119   slate #111A24
steel #6F8494  steelD #3D4E5C
bone #EFE3CE   bone2 #C9BCA8  bone3 #8C8578     ← 文字主色
amber #F5A34A  amberHi #FFD79A amberD #8A4E17   ← 暖 / 已知 / 确定
cyan  #63D6D6  cyanHi #C4F7F2  cyanD #1B5257    ← 冷 / 数据 / 注意力
verm  #E8452B  vermHi #FF8B72                   ← 只用于「零 / 缺失 / 危险」，全片出现面积 < 3%
```
**配比**：黑底占 70–85%，暖色 10–20%，冷色 5–10%，朱红 ≤3%。
**禁止**：饱和度爆表的纯红/纯绿/纯蓝；渐变彩虹；纯白大面积（最亮只用 #EFE3CE）。

## 3. 字体

| 用途 | family | 用法 |
|---|---|---|
| 大数字 / 英文标题 | `F.latin`（Georgia） | size 90–320，weight 300–400，负字距，可加 ambers 微光 |
| 中文主句 | `F.serif`（SimSun 宋体） | size 36–64，tracking 4–8。宋体的横细竖粗就是「电影感」来源 |
| 数据 / 标签 / HUD | `F.mono`（Consolas） | size 10–22，tracking 2–5，全大写英文 + 数字 |
| 中文副标（少用） | `F.sans`（微软雅黑） | size 12–20 |

**字阶（不要出现中间值）**：320 / 220 / 140 / 96 / 64 / 46 / 32 / 22 / 15 / 11。
**对比度**：任何要读的字，与背景对比 ≥ 4.5:1。字压在杂背景上必须加 scrim（半透明黑条）或压暗背景。

## 4. 构图

- 安全边距 40px；主信息不出 84px 边距。
- **禁止正中对称的死板构图**。主体锚点用三分法：x ∈ {300, 640, 980}，y ∈ {200, 360, 520}，每镜换一个锚点。
- 每帧必须有一个**明确的主体**（1 个）和一个**次级层**（1–2 个），其余是纹理。
- **尺度对比**：每镜至少有一组 >10 倍大小差（例：320px 的「0」旁边 11px 的注释；一个占满画面的弧 + 一个 2px 的点）。
- **深色呼吸**：四角比中心暗，任何镜头的亮度重心不要落在正中心。

## 5. 运动铁律（最重要，审片第一条）

1. **绝对不能有死帧**。相邻帧必须有可见变化。
2. **任何静态元素静止不得超过 0.4 秒**。必须给它「微动」之一：
   - 呼吸缩放（±0.3%–0.8%，周期 2–5 s）
   - 极慢位移（0.2–1.5 px/s）
   - 透明度脉动（±3%–8%）
   - 描边发光强度的低频抖动
   - 位置随 `env.beat(t)` 轻微脉冲
3. **相机永远在动**：每镜都有缓慢推/拉/移（总幅度 2%–12%），或镜头内元素的反向位移制造视觉位移。
4. 允许「极短停顿」做强调，但停顿期间必须有**微动**（背景纹理流动、光斑呼吸、扫描线偏移、尘埃漂移）。
5. **入场用缓动**：`ease.outCubic` / `outExpo` / `outQuint`，时长 0.25–0.8 s。禁止线性硬切入场（除了故意的高速冲击）。
6. **切点卡拍**：镜头切换点落在 `0.485 + k×0.5375` 的拍点上（或小节线 `0.485 + k×2.15`）。蒙太奇快切段可以每 2 拍一切。
7. 文字上屏要有**逐字错峰**（stagger 0.05–0.16 s/字），不要整块冒出。

## 6. 层次预算（单帧最多 6 层）

```
L0 ambient  背景光场 + 尘埃（engine 已提供，永远在动）
L1 field    次级场：网格 / 数据点阵 / 大号幽灵字 / 光斑
L2 subject  主体（1 个）
L3 type     文字
L4 annot    HUD / 标注 / 尺寸线 / callout（用 src/ui.js）
L5 post     颗粒 + 暗角 + 扫描带（engine.post 已提供）
```
**「不臃肿」判据**：如果一帧里超过 2 个元素在争夺注意力 → 删掉一个或压暗一个。
**「不单调」判据**：连续 3 秒内必须有 ≥1 次视觉状态变化（新元素入场 / 元素状态改变 / 明显位移）。

## 7. 场景 API

在 `src/scenes/<id>.js` 里：

```js
import { C, F, TAU, ease, seg, segE, text, ring, donut, line, withA, ... } from '../engine.js';
import { hud, callout, measure, coordGrid, ghostNumeral, sideTitle } from '../ui.js';

export default {
  id: 'A1-two-options',
  start: 17.18,
  end: 31.39,
  fadeIn: 0.30,      // 秒，与相邻镜头交叉叠化（可选）
  fadeOut: 0.30,
  draw(ctx, t, env, p) {
    // t = 本镜内局部时间（秒）；p = 0..1 进度
    // env: {w,h,fps,duration,t,beat(t),beatPhase,barStartOf,energy(t),dust,grainTiles,pal}
  }
};
```

- 画布尺寸 1280×720，坐标系原点左上。**必须自己 ctx.save()/restore() 成对使用。**
- 场景默认**不铺满整屏**：底层的 ambient 已经画好了。要换成纯黑/纯色底时自己 `fillRect`，但之后必须自己补上持续运动。
- 结束后**不要**自己加颗粒/暗角（`render.mjs` 统一加）。
- 所有随机数必须用 `mulberry32(seed)` / `hash1` / `hash2`，**禁止 Math.random()**（会破坏确定性）。
- **禁止读墙钟**（Date.now / performance.now）。时间只能来自参数 `t`。
- 注册：在 `src/scenes/index.js` 里 import 并加入数组（按时间顺序）。**每人只改自己那一行，避免冲突。**

## 8. 工具速查（engine.js 已导出的）

- 数学：`clamp lerp map sat smoothstep seg segE mod ease.{...}`
- 随机：`mulberry32 hash1 hash2 vnoise fbm1`
- 颜色：`withA(hex,alpha) mix(h1,h2,t)`
- 文字：`text(ctx,str,x,y,{size,family,weight,color,align,tracking,alpha,glow,glowColor,depth,perChar(i,n)=>…})`；`measureTracked(...)`；`revealChars(t,t0,dur,stagger,seed,dir)`
- 图形：`ring donut line poly rect tickRing masked glowDot glowEllipse`
- 母题：`gapRing(ctx,cx,cy,r,gapArc,gapRot,{color,w,glow})` ← 全片签名图形，带缺口的环
- 层：`ambientField dustField post`
- UI：`hud sideTitle measure callout coordGrid ghostNumeral`

## 9. 预览与自检（必须做）

```powershell
cd "F:\deepseek harness\vibe-zero"
# 单帧（快，先看构图）
node render.mjs --stills=20.0,24.5,29.0
# 联系表（看整段节奏，一次读一张图）
node render.mjs --contact --from=17.18 --to=31.39 --keys=16 --cols=4 --tile=320 --out=out/contact-A1.png
```
**交付前必须自己读一遍联系表**（用 read_image 打开 png），确认：
① 每一格都有事发生 ② 没有糊掉/过曝/全黑 ③ 文字可读 ④ 主体清楚。

## 10. 全片结构表（锁定）

| Act | 起 | 止 | 时长 | 内容 |
|---|---|---|---|---|
| A0 | 0.00 | 17.18 | 17.18 | 缺口：80% 出现 → 那 20% 呢 |
| A1 | 17.18 | 31.39 | 14.21 | 两个选项：100% 得 98 元 / 27% 得 367 元（真实实验刺激） |
| A2 | 31.39 | 48.67 | 17.28 | 隐藏：同一个选项的两种写法，零被抹掉的过程 |
| A3 | 48.67 | 65.85 | 17.18 | 两个方向：2008 显式零→更耐心；2026 显式零→更冒险 |
| A4 | 65.85 | 83.03 | 17.18 | 实验：N=197、眼动、高风险与低风险双条件，选择比例抬升 |
| A5 | 83.03 | 96.97 | 13.94 | 机制：注意力→选择；公式；不是价值变了 |
| A6 | 96.97 | 103.19 | 6.22 | 归零（音乐留白段）：零不是没有 |
| A7 | 103.19 | 114.80 | 11.61 | 零的发明：巴比伦泥板 → 印度 → 628 年规则 |
| A8 | 114.80 | 123.44 | 8.64 | 现实：药效 90% / 基金 8% / AI 99%，每个都少了一半 |
| A9 | 123.44 | 132.08 | 8.64 | 看见：把零放回去，框才完整 |
| A10 | 132.08 | 148.30 | 16.22 | 升华：拉远——选的人也在框里 |
| Coda | 148.30 | 150.40 | 2.10 | 标题 + 淡出 |

## 11. 审片标准（导演会按这个打回）

1. 有没有死帧 / 静止超 0.4s？
2. 主体是否明确、构图是否不对称、有没有尺度对比？
3. 文字是否可读（字号/对比/遮罩）？
4. 是否符合调色板与字阶？
5. 信息是否科学准确、有没有编造数据？
6. 是否与相邻镜头的视觉语言连贯（不跳戏）？
7. 与音乐的卡点是否成立（切点是否落在拍上）？
