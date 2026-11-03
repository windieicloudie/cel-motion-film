# 可重复制作流程

## 依赖与路径

脚本参数中的 `SKILL` 指当前读到的本 Skill 目录；不要假设某个用户名或以前的项目仍然存在。需要 Python + NumPy、Node + Playwright、Chrome 和 FFmpeg。可先用 Codex 的 `load_workspace_dependencies` 找本机打包的 Python/Node/Playwright；`NODE_PATH` 可指向其 node_modules，或在项目中 `npm install`。

`render.cjs` 自动寻找标准 macOS Chrome；其他位置设置 `MG_CHROME`。没有本机 Chrome 时可安装 Playwright Chromium。若无 FFmpeg，可在当前任务 work 内安装 `imageio-ffmpeg` 并把其 `get_ffmpeg_exe()` 返回的路径传给 `--ffmpeg`。不保存开发这项 Skill 时的绝对依赖路径。遵循当前环境权限机制；本地服务和 Chrome 在部分沙箱里需执行权限提升。

## 初始化和配置

```bash
python3 "$SKILL/scripts/prepare.py" work/film --content work/content-patch.json
```

省略 `--content` 生成原作默认配置。目标目录已存在则拒绝覆盖；只应用新配置时：

```bash
python3 "$SKILL/scripts/prepare.py" work/film --content work/content-patch.json --update
```

更新前先保留本次任务需要的历史版本。`--update` 只修改 content.json/content.js 与字母 cue，不覆盖 scene.js 的角色改动。修改过标题布局或字幕支持范围时，按新布局调整配置验证逻辑；不要悄悄截断用户文字。

配置补丁仅需列出要变的字段，例如：

```json
{
  "title": ["GOOD", "VIBES"],
  "brand": ["SUNNY", "CLUB"],
  "header": "SUNNY CLUB",
  "tagline": "MAKE A LITTLE JOY.",
  "opening": ["ONE", "TINY", "SPARK."],
  "dance": ["GOT", "A LITTLE", "JOY."],
  "palette": {"red": "#DC503B", "yellow": "#EDBC42"}
}
```

字段与位置：

| 字段 | 用途 |
|---|---|
| title | 结尾两行大标题，starter 每行 2–7 个 A–Z 字母 |
| brand | 道具上两行品牌名 |
| header / subheader | 顶部左右角小标题 |
| footerLeft / footerRight | 页脚文案 |
| opening / dance | 开场／舞动旁的三行短句 |
| heroLeft / heroRight | 高潮两侧的两行短句 |
| endNote | 结尾右侧三行短句 |
| tagline | 结尾下方副标题 |
| palette | paper / ink / red / yellow / warm，六位十六进制色值 |

改品牌时一起检查道具、角标和结尾，不只改最大标题。副文案尽量短；缩放成手机大小也需可读。变更标题字数会自动重新安排 letter cue，音频按实际 cue 数量生成。

## 渲染与母带

```bash
node "$SKILL/scripts/render.cjs" work/film --stills
# 通过 view_image 或可用的图片查看工具实际检查 frames 中关键帧。
node "$SKILL/scripts/render.cjs" work/film
python3 work/film/audio.py
python3 "$SKILL/scripts/finalize.py" work/film --output outputs --ffmpeg /actual/path/to/ffmpeg
```

也可运行项目内复制的 render.cjs：`node work/film/render.cjs work/film`。渲染器先等待 `window.__ready`，将完整分辨率 Canvas 导出 PNG，再以不同时序重复访问相同时间点检查确定性。默认 240 帧；`--stills` 只生成 12 帧，因此不能直接接最终编码。

`finalize.py` 先测 raw WAV，做两遍 loudnorm，以 −1.5 dBTP 为母带余量，编码 AAC 后循环校正综合响度，最多 4 次。校正后如果真峰值超出 −1 dBTP，不以“差不多”交付；把母带 TP 目标降低，再重做。它输出 verification.json 和完整解码日志，并在指标不通过时报错。不要复制以前成片的 +0.20 dB 数字；每条新声音都独立测量。

报告技术字段以 verification.json/log 为准，再人工检查文字、构图和快动作。脚本检验不能代替视觉查看或音频试听；没有试听条件就诚实说明，不声称完成独立监听。生成一张关键帧联系表和结尾海报以便用户快速审阅。

## 中文、特殊字符及不同故事

现有字库含 A–Z、空格和 `0 1 2 4 . , ! ' - /`。默认所有可见标题都不依赖系统字体。遇到中文：

- 保留中文语义和原文，重新计算版面。短主标题可手绘路径，长正文使用许可明确的中文字体。
- 用 FontFace 加载项目内字体，等待 load / document.fonts.ready，再设置 __ready；检查实际字符覆盖，必要时用 fontTools 查 cmap。记录许可证。`document.fonts.check` 不能单独证明所有字形都存在。
- Canvas 文字层也应有微小的多版本轮廓/错版变化，避免只有角色手绘而标题像默认网页字体。
- 新主角可复用 brush/shape/line/puff/star 函数，但需重写角色轮廓、至少数个不同姿态、表情、与道具互动的动作。与主题不符的火柴盒应一起替换。
- 对烟火变字尽量让残片成为字母笔画，不用交叉淡化隐藏无法衔接的动作。

## 交付

交付 video.mp4 和简短报告；有用时再附关键帧与 source.zip。源代码包包含 content.json、content.js、cues.json、scene.js、index.html、audio.py、render.cjs、package.json、制作／编码命令和 CREDITS.md；不包含 node_modules、帧序列、缓存或本机硬编码路径。保留音频源码即可；是否附锁定母带由用户复现需要决定。
