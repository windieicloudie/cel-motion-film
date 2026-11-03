# 手绘动态短片 · Cel Motion Film

可复用的 Codex Skill：输入主题、标题、品牌文案和故事内容，生成暖纸底、手绘抖线、逐帧角色与烟火特效的 10 秒短片。

![风格参考](assets/reference-poster.jpg)

## 使用

将这个仓库作为 Skill 安装到 Codex 后，直接提出要求：

> 用 $cel-motion-film 做一支咖啡主题短片，主角换成咖啡豆，标题“早安咖啡”，沿用手绘抖线风格。

可以只换标题、品牌、字幕、配色；也可以换角色和故事，由 Codex 调整画面与声音。英文短标题可直接通过内容配置修改；中文标题需要字形与版式适配，Skill 已包含相应说明。

## 默认输出

- 1920×1080，24 fps，240 帧，10 秒。
- H.264 MP4，AAC 双声道 48 kHz。
- 综合响度目标 −14 LUFS，真峰值不超过 −1 dBTP。
- 成片、制作报告、关键帧与可重建源码。

## 内容与工具

`SKILL.md` 是技能入口；`assets/starter/` 是可配置动画和音频源码；`scripts/` 包含项目初始化、逐帧渲染和母带验收工具；`references/production.md` 说明配置与制作流程。

运行需要 Node.js、Playwright、Chrome、Python + NumPy 和 FFmpeg。Skill 不打包这些运行时，也不要求上传素材到外部生成服务。

画面、字形、纸纹和声音使用程序生成。原始提示词参考与来源说明见 [provenance.md](references/provenance.md)。示例片基于火灵与火柴盒；更换故事时应连同角色和道具一起调整。
