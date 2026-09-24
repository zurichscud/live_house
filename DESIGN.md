---
name: LIVE HOUSE
description: LIVE HOUSE 直播客户端（抖音 / 哔哩哔哩 / 虎牙），克制专业、内容优先的深色界面
colors:
  canvas: "#0a0a0d"
  surface: "#131317"
  raised: "#1d1e22"
  line: "#2b2b31"
  line-strong: "#414249"
  ink: "#f1f1f3"
  ink-2: "#bdbdc1"
  ink-3: "#919297"
  primary: "#f1f1f3"
  primary-hover: "#ffffff"
  primary-ink: "#0a0a0d"
  accent: "#e52751"
  accent-hover: "#fb355d"
  accent-text: "#fe838d"
  accent-soft: "#2a1219"
  live: "#49de78"
  user: "#7cc1e9"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "inherit"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "inherit"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "inherit"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "inherit"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  micro:
    fontFamily: "inherit"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "10px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "34px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "34px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  pill:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  pill-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.primary-ink}"
  badge-live:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-text}"
    typography: "{typography.micro}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  dropdown:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "4px"
  title-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    height: "44px"
  nav-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "6px 8px"
  nav-item-active:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
---

# LIVE HOUSE — Design System

## Overview

桌面端直播客户端（抖音 / 哔哩哔哩 / 虎牙）。核心判断：**画面与弹幕是主角，界面是背景板**。用户晚间在电脑前长时间观看，UI 必须安静、精确、可长时间注视而不疲劳。

风格定位：克制专业（restrained professional）。深色是场景决定的（暗光环境看视频），不是"工具都该是深色"的反射。视觉音量分配：播放器与弹幕列表占视觉主导，导航与卡片退到中性灰阶，品牌红只在"正在直播"、焦点与导航激活指示出现。

信息架构（复刻 skills-deck 布局）：顶部一条中性**标题栏**（高 44，仅窗口拖拽 + 右侧主题切换），其下为**左侧导航**（宽 212，顶部为 logo + 应用名，底部固定设置）+ 内容区（首页看板、收藏列表、观看记录、我的、房间详情、搜索、设置页）。首页看板只提供搜索入口与关注直播概览，不做任何平台的推荐流/内容页；「收藏」是本地收藏的博主，「我的」按平台展示账号关注列表。

明确不做：企业后台感（灰蓝、密集表格）、通用 AI 深色 SaaS 模板感（紫色渐变、玻璃拟态、霓虹发光）。

参考坐标：Linear / Raycast 的克制与精确，Twitch / YouTube Live 的观看场景熟悉度，Bilibili 桌面端的弹幕阅读体验。

## Colors

OKLCH 为唯一事实来源（代码中只写 OKLCH）；frontmatter 中的 hex 为 sRGB 回退值。

| Token | OKLCH | Hex | 用途 |
|---|---|---|---|
| canvas | `oklch(0.145 0.006 285)` | #0a0a0d | 应用背景 |
| surface | `oklch(0.19 0.008 285)` | #131317 | 面板、输入框、卡片 |
| raised | `oklch(0.235 0.009 285)` | #1d1e22 | 悬浮态、下拉菜单 |
| line | `oklch(0.29 0.011 285)` | #2b2b31 | 分隔线、边框 |
| line-strong | `oklch(0.38 0.013 285)` | #414249 | 强调边框、滑块轨道 |
| ink | `oklch(0.96 0.002 285)` | #f1f1f3 | 主文字 |
| ink-2 | `oklch(0.80 0.005 285)` | #bdbdc1 | 次要文字 |
| ink-3 | `oklch(0.66 0.008 285)` | #919297 | 三级文字、占位符（5.9:1 on surface） |
| primary | `oklch(0.96 0.002 285)` | #f1f1f3 | 主按钮背景（白底深字，17.6:1） |
| accent | `oklch(0.60 0.22 16)` | #e52751 | 品牌红：直播圆点、焦点环、指示器 |

| accent-text | `oklch(0.75 0.15 16)` | #fe838d | 深底上的红色文字（8.3:1） |
| accent-soft | `rgba(229,39,81,0.14)` | — | 直播徽章底色 |
| live | `oklch(0.80 0.19 150)` | #49de78 | 弹幕连接正常指示 |
| user | `oklch(0.78 0.09 235)` | #7cc1e9 | 弹幕用户名 |

### 亮色主题

通过 `:root[data-theme='light']` 覆盖同一组语义变量（Tailwind v4 工具类全部走 `var(--color-*)`，因此整套 UI 自动跟随），并切换 `color-scheme`。同一份契约，两套取值：

| Token | 暗色 | 亮色 |
|---|---|---|
| canvas | `oklch(0.145 0.006 285)` | `oklch(0.965 0.003 285)` |
| surface | `oklch(0.19 0.008 285)` | `oklch(0.995 0.002 285)` |
| raised | `oklch(0.235 0.009 285)` | `oklch(0.93 0.005 285)` |
| line / line-strong | `0.29 / 0.38` | `0.885 / 0.75` |
| ink / ink-2 / ink-3 | `0.96 / 0.80 / 0.66` | `0.22 / 0.44 / 0.51` |
| primary（按钮底） | `oklch(0.96 …)` 近白 | `oklch(0.25 …)` 近黑 |
| accent | `oklch(0.60 0.22 16)` | `oklch(0.55 0.22 16)` |
| accent-text | `oklch(0.75 0.15 16)` | `oklch(0.5 0.2 16)` |
| live / warning / user | `0.80 / 0.80 / 0.78` | `0.60 / 0.62 / 0.50` |

两套取值都经过脚本校验：正文对比度 ≥ 4.5:1（亮色下 ink-3 取 L=0.51 才能在 raised 底上达标），非文本图形 ≥ 3:1。亮色画布刻意用**中性冷灰**（chroma 0.003），不用暖白/米色。

主题偏好存 `localStorage`（`live-house:theme`），默认暗色；切换入口在标题栏右侧（太阳/月亮）。窗口底色由主进程随主题同步（`settings:setWindowTheme`），避免启动闪深色。

规则：
- **品牌红是动词，不是形容词**。它只标记"正在发生的事"（直播中、连接中、焦点）、主操作强调，以及侧边导航激活项的 2px 左侧指示条；此外不做装饰填充。
- 主按钮用 ink 底 + canvas 字（深色界面上的反色按钮），保证 17.6:1 对比度，同时避免整屏红色。
- 文字对比度全部 ≥ 4.5:1（ink-3 为最低档，实测 5.9:1），占位符使用 ink-3 而非更浅的灰。
- 状态色：成功 `live`，错误用 `accent-text` + `accent-soft` 底，警告 `oklch(0.80 0.14 85)`。

## Typography

单一系统字体族（中文优先），不引入第二字族。层级靠字重与字号，不靠字体变化。

```
-apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", "Microsoft YaHei", sans-serif
```

固定 rem 阶梯（product 场景不做流体字号）：11 / 12 / 13 / 14 / 16 / 20px。比例约 1.15–1.25，避免夸张对比。

- 数字（在线人数、时长）一律 `font-variant-numeric: tabular-nums`，避免刷新时抖动。
- 弹幕列表正文 13px，行高 1.55；标题两行截断。
- 正文行长在说明性文本（设置页提示）限制 ≤ 65ch。

## Elevation

深色界面不用"阴影表达层级"，用**表面亮度 + 1px 描边**表达：

- Level 0（canvas）：页面背景。
- Level 1（surface + line 描边）：面板、卡片、输入框。
- Level 2（raised + line-strong 描边 + 阴影）：下拉菜单、tooltip。
- Level 3（raised + 大阴影 + 遮罩）：对话框，遮罩 `rgba(0,0,0,0.6)`。

阴影仅用于 Level 2/3：`0 12px 32px rgba(0,0,0,0.5)`、`0 24px 64px rgba(0,0,0,0.6)`。卡片 hover 用亮度提升（surface → raised）而不是投影。

Z-index 语义阶梯：dropdown 30 → sticky 20 → modal-backdrop 40 → modal 50 → toast 60 → tooltip 70。

## Components

统一词汇：所有图标按钮 32×32、圆角 6、ghost 底、hover 提亮；所有主按钮 34 高、ink 底；所有弹层用 Radix 语义（DropdownMenu / Dialog / Tooltip / Slider）。

- **Button**：primary（ink 底）/ secondary（surface + 描边）/ ghost（透明，hover 提亮）/ danger（accent-soft 底 + accent-text）。状态：default / hover / focus-visible（2px accent 环）/ disabled（40% 不透明度）/ loading（spinner 替换图标，宽度锁定）。
- **IconButton**：32×32，必须带 Tooltip，图标统一 lucide，stroke-width 1.75。
- **Input**：surface 底 + line 描边，focus 时描边转 accent + 1px 外环；占位符 ink-3。
- **Pill（分类）**：默认 raised 底 + ink-2 文字；active 为 ink 底 + canvas 文字；hover 提亮。二级分类用描边 pill，active 为 accent-text 文字 + accent 描边。
- **RoomCard**：封面 16:9 圆角 10；hover 时封面轻微放大（1.03）+ 显示中心播放按钮 + 标题提亮；右下角人数为深色半透明胶囊（白字）；标题两行截断；主播名 12px ink-3。
- **TitleBar（标题栏）**：高 44，独占窗口首行（全宽），surface 底 + 底部 line 描边，整条可拖动窗口。左侧留出 macOS 红绿灯（`pl-[86px]`）；右侧只有**主题切换**图标按钮（28×28，双图标常驻 DOM 交叉淡入，tooltip 说明目标模式）。标题栏不承载品牌，也不放搜索或任何页面操作；Windows 下颜色与 surface 一致（`titleBarOverlay` 随主题更新）。
- **Sidebar（左侧导航）**：位于标题栏之下，宽 212px，surface 底 + 右侧 line 描边。顶部为 **logo（20px 应用图标位图，圆角 6，`ring-1 ring-line` 描边；资源 `src/renderer/src/assets/app-icon.png`，与 Electron 应用图标同源）+ 应用名**（16px semibold，`tracking-tight`）；导航项为紧凑行（14px 图标 + 13px 标签，`gap-2 px-2 py-1.5`），激活态为 **2px 品牌红左侧指示条 + raised 底 + ink 文字**（语义上标 `aria-current="page"`），非激活 ink-2、hover 用 raised/60 底并提亮文字；**设置固定在底部**，其余项（首页 / 收藏 / 观看记录 / 我的）在顶部。
- **首页看板**：看板自上而下只有「大号搜索框」+「关注直播概览」两项，不放平台入口卡片、不展示任何平台的直播列表或内容页入口。平台只通过搜索框的平台选择器体现。
- **看板搜索框**：高 48，是内容区里体量最大的操作元素，也是进入直播间的唯一入口（关键词搜索 / 粘贴房间号 / 粘贴链接）。左侧为平台选择器（平台图标 + 短名 + 下拉箭头，下拉用 Radix 单选菜单，未开发平台项禁用并标「即将上线」），其后一条 1px 分隔线，再是搜索图标 + 无边框输入（14px）+ 右侧 ⌘K 提示；焦点态由容器统一给 accent 描边 + 2px 环，输入自身不出边框。选择平台决定搜索与粘贴房间号/链接的默认平台（抖音 / 哔哩哔哩 / 虎牙均已接入；链接自带平台时以链接为准）。
- **收藏页**：本地收藏的博主列表（头像 + 昵称 + 平台徽章 + 时钟图标 + 收藏时间，右侧为固定宽度的直播状态区与悬停出现的「取消收藏」）。点行进入直播间；空态为「还没有收藏的博主 / 在直播间点「收藏」，博主会出现在这里」。收藏入口在房间信息行右侧，按钮在「收藏」（ghost）与「已收藏」（secondary + 实心星）之间切换。
- **我的页**：标题下方为平台 tab（与观看记录共用 `PlatformTabs`，等宽恒定字重）。抖音 tab 为关注列表：账号行（昵称 + 关注数 + 刷新）→ 全部/直播中过滤（分段控件）→ 列表行（头像 + 昵称/抖音号 + 右侧直播中徽章 + 在线人数 / 未开播 + 悬停外链图标，未开播点行打开抖音主页）；不支持账号关注列表的平台 tab 显示「XX 关注列表还在开发中」空态（当前仅抖音实现）。切换 tab 时已支持的面板保持挂载，不重复拉取关注列表。
- **列表行状态占位（观看记录 / 收藏）**：右侧直播状态区固定 64px 宽、右对齐并常驻渲染（未知状态时留空），状态异步返回时不得改变行内文字宽度；检查进度指示器放在 tab 行右侧，不要放在标题行，避免推挤「刷新 / 清空记录」按钮。
- **关注直播概览**：搜索框下方整行卡片（图标块 +「关注直播」+ 说明文字 + chevron），说明格式为「X 人正在直播 · 共 N 个关注」，0 人时显示「当前没有关注的直播」。统计沿用关注页的分页上限（5 页 / 100 个）与限流（并发 3 + 250ms），统计中显示进度文案，结果缓存 3 分钟；超过统计上限时标注「已统计最近 N 个」。未登录显示「配置 Cookie 后统计关注直播」（点击进设置），失败显示「暂时无法获取关注列表」（点击进我的页）。
- **房间页结构（自上而下）**：全局顶栏（应用名）→ 房间标题行（内容区：左侧 32×32 ghost 返回键 + 带 tooltip，右侧房间标题一行截断、16px semibold）→ 直播信息行（头像 + 主播名 + 人气 · 房间号）→ 播放器（`flex-1` 填满剩余高度，`object-contain` 居中）→ 平铺操作栏。返回键只在房间标题行，不出现在左侧导航栏。
- **Player controls**：窗口模式为播放器下方的**平铺操作栏**（无边框、无底色，与信息行同宽同内边距）；全屏模式切换为**浮层控制条**（底部渐变遮罩，2.5s 自动隐藏，鼠标移动/键盘聚焦重现）。两种形态共用同一套控件与顺序：播放/暂停 · 音量（图标 + 悬停展开滑块）· 分隔线 · 画质（下拉，radio 语义）· 线路（下拉）· 刷新 · 弹幕开关 · 画中画 · 全屏 · 分隔线 · 浏览器打开。
- **Danmaku overlay**：Canvas 飘屏，15px / 500 字重，白字 + 深色阴影；轨道高度 30px；开关切换时清空画布。
- **Danmaku list**：13px 行；用户名 user 色 + 消息 ink；hover 行提亮；自动滚底，用户上翻时出现"回到最新"按钮。
- **Skeleton**：surface 底 + 微光扫过（reduced-motion 时静态）；卡片、列表、播放器各有形态。
- **EmptyState**：lucide 图标（32px, ink-3）+ 标题（14px ink-2）+ 说明（13px ink-3）+ 可选动作按钮。用于无弹幕、搜索无结果、无观看记录、未登录等。
- **列表行（我的 · 关注列表 / 观看记录 / 收藏）**：无卡片容器，行高约 60px，hover 用 surface 底；右侧为状态区（直播中徽章 / 未开播 / 悬停出现的图标），行内次要操作（移除 / 取消收藏）默认隐藏、hover 或键盘聚焦时出现。观看记录的元信息行固定为「平台徽章（平台图标 + 短名，raised 胶囊）→ 用户图标 + 主播名 → 时钟图标 + 相对时间」，平台徽章与该行图标均为 12–14px、ink-2/ink-3；右侧状态区显示当前是否仍在直播（进入页面后并发 3、间隔 250ms 逐条查询，未知/失败不占位），标题行提供「刷新直播状态」按钮。
- **观看记录平台 tab**：标题行下方为平台切换（`PlatformTabs`，与我的页共用：图标 + 短名，surface 底胶囊容器，激活项 ink 底 + canvas 字），切换后只显示该平台记录并回到列表顶部；空记录展示「还没有XX的观看记录」空态（平台未接入时才显示「还在开发中」）；「清空记录」只清空当前平台。tab 必须等宽且字重恒定（激活只换颜色，不改字号/字重），否则切换时会出现像素级抖动。
- **Dialog**：Radix Dialog，遮罩模糊为 0（保持内容清晰），居中，最大宽 520。

## Do's and Don'ts

**Do**
- 用 ink-3 作为文字对比度下限，任何正文不浅于它。
- 数字用 tabular-nums；状态同时用颜色 + 文字表达。
- 图标按钮一律带 tooltip；弹层一律 Esc 可关、焦点可循环。
- 动效 150–250ms，ease-out 指数曲线；全部提供 reduced-motion 退化。
- 加载用骨架屏（结构可预期时）而不是居中 spinner。

**Don't**
- 不要玻璃拟态、渐变文字、霓虹发光、装饰性动效。
- 不要给卡片加左侧色条；不要在每段标题上加小号大写 eyebrow。
- 不要在顶栏放搜索框、标题或任何操作；顶栏只有 logo + 应用名。
- 文字层级一律用 ink / ink-2 / ink-3 的亮度阶梯（两套主题自动取反），不要写死颜色。
- 新增颜色必须同时给暗/亮两套取值并跑对比度校验；播放器浮层（渐变、白字、黑底）例外——它们始终叠在视频上。
- 不要在非直播状态使用品牌红；不要让红色成为大面积填充（顶栏、侧栏一律中性底色）。
- 不要自定义滚动条样式（依赖 `color-scheme: dark` 的原生滚动条）。
- 不要发明新的交互形态：下拉、对话框、滑块一律用 Radix 标准语义。
