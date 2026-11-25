# XPLANC 项目说明

XPLANC 是一个使用 React、TypeScript 和 Vite 的静态门户。首屏展示标题和 Canvas 星空，入口卡片通过手势或尖角按钮切屏显示。

## 开发与验证

- `npm ci` 安装锁定的依赖。
- `npm run dev` 启动本地开发服务器。
- `npm run build` 运行 TypeScript 检查并生成 `dist/`。
- `npm run lint` 运行 ESLint，`npm run preview` 预览生产构建。
- 修改布局或交互后，用桌面和手机尺寸检查相关流程。涉及切屏时，验证滚轮、触屏、键盘和尖角按钮。

## 代码位置

- `index.html` 管理页面元数据和挂载点，`src/main.tsx` 启动 React。
- `src/App.tsx` 组合首屏、分组后的卡片页和 HUD。可复用的界面组件放在 `src/components/`。
- `src/deck.ts` 存放入口配置和环境配色。卡片图标位于 `src/assets/portals/`。
- `src/hooks/useDeckPages.ts` 处理输入、响应式分组和页码。`src/hooks/useDeckAnimation.ts` 管理 Canvas、准星和遥测共用的帧循环。
- `src/animation/` 分别实现背景星空、卡片动效和环境渐变。`src/index.css` 管理全局样式，`src/App.css` 管理页面和组件样式。
- `vercel.json` 管理现有部署路由的重定向与重写。

## 修改入口与动效

- 在 `PORTALS` 中添加入口。配置键直接作为字符串 ID，卡片由同一个 `PortalCard` 组件生成。
- 每条入口配置标题、标签、描述、目标 URL、本地图标、动效、区域文案、边框起始角度和主副色。用 `createPalette` 从十六进制颜色生成绘制所需的通道值。
- 卡片的 `animation` 可选 `lattice`（晶格）、`waveform`（波形）或 `orbit`（轨道粒子）。绘制逻辑在 `src/animation/portalVisuals.ts`。
- 环境配色按 Cyber、Void、Solar、Matrix 循环。卡片以各自的配色绘制，悬停时曲速光效跟随卡片色。
- 通过现有帧循环更新逐帧数据。React 状态用于卡片悬停、切屏和复制反馈等界面变化。

## 布局与交互

- 页面固定在视口内，用 CSS 位移过渡切换首屏和卡片页。宽屏（大于 1120px）每页 6 张、每行 3 张，中等宽度（768–1120px）每页 4 张、每行 2 张，窄屏每页 1 张。
- 首屏底部的尖角打开卡片页。卡片上方和下方的无边框尖角用于翻页，末页隐藏向下尖角。图标按钮保留可访问名称。
- 右上角显示巡航或曲速状态，右下角显示速度。长链接单行显示，空间不足时用省略号，复制按钮使用完整地址。
