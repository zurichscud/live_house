# AGENTS.md

LIVE HOUSE：桌面端多平台直播客户端（抖音 / 哔哩哔哩 / 虎牙 的接口 + 弹幕 + 播放）。Electron + React 19 + Tailwind 4 + TypeScript，pnpm workspace 单仓。

## 结构

- `packages/core`：纯 TS（无 Electron 依赖）。`api/site.ts` 是站点契约（`LiveSite` / `DanmakuClient` / `StreamHeaderRule`），各平台实现 `api/{douyin,bilibili,huya}.ts` + `danmaku/*`；`sign/`（a_bogus / webms 签名 JS）、`model/types.ts`（跨进程共享类型）。
- `apps/desktop`：`src/main`（窗口 / IPC / 站点注册表 / 请求头注入）、`src/preload`（`window.api` 契约）、`src/renderer`（React 页面与组件）。
- 命令全部在本目录下执行：

```bash
pnpm install
pnpm dev            # electron-vite 开发（HMR）
pnpm typecheck      # core + desktop 两处 tsc
pnpm build          # 产出 apps/desktop/out/{main,preload,renderer}

pnpm e2e            # 构建 + Playwright 冒烟：首页 → 进房 → 播放 + 弹幕
pnpm e2e:soak       # 长播稳定性（DURATION_MIN 分钟，默认 10）
pnpm package:mac    # dmg/zip；package:win 需 Windows 或 wine
```

## 架构铁律

- **新增平台**：core 实现 `LiveSite` → `apps/desktop/src/main/site.ts` 注册表 → `apps/desktop/src/renderer/src/lib/sites.ts` 打开能力开关（`available` 可搜索可播放、`following` 有账号关注列表）。房间路由是 `/room/:site/:roomId`，搜索页 `/search?site=&kw=`。
- **IPC**：渲染进程只用 `window.api`（`site.*` 通用站点能力、`danmaku.*`、`following.*` 抖音账号能力、`settings.*`）。`danmaku:start` 的参数必须是可结构化克隆的纯对象。
- **播放约定**：`getPlayQualites()` 返回的每个 `quality.data` 必须是可直接播放的 URL `string[]`（按线路优先级排序，播放器的「线路」下拉按数组下标切），播放器不会再调 `getPlayUrls`；拉流/图片所需的 Referer/UA/CORS 由各站点 `streamHeaderRules` 声明、主进程 `webRequest` 注入。
- `packages/core/src/sign/js/*` 是从 Dart 侧（simple_live_core）提取的签名 JS，**已提交、运行不需要外部仓库**；只有更新签名算法时才用 `SIMPLE_LIVE_CORE_DIR=/path/to/simple_live_core pnpm extract:sign` 重新生成。

## 已踩过的坑

- `ws` 必须留在 `apps/desktop/package.json` 的 `dependencies`（被打包器 external）。一旦打进 bundle，其可选原生依赖会变成坏 stub，发弹幕时报 `bufferUtil.mask is not a function`。
- 签名 JS 只能在**非严格模式**下执行（脚本内有 `document = {}` 隐式全局赋值），`packages/core/src/sign/runtime.ts` 用 `node:vm` 是有意为之。
- 播放流必须由主进程 `webRequest` 注入 `Referer`/`UA` **并注入 CORS 响应头**；渲染进程无法自己设置这些头。
- `apps/desktop/src/renderer/index.html` 的 CSP 必须保留 `blob:`（mpegts.js 的 worker）与 `http:` 媒体源，删掉会静默不播放。
- Radix `asChild` 的自定义子组件必须透传 props/ref，否则弹层点击无响应。
- 自定义字号（`text-micro|caption|label|body|title|display`）必须在 `lib/cn.ts` 的 `extendTailwindMerge` 中声明，否则 tailwind-merge 会把它当颜色类，丢掉 `text-ink` 等颜色（表现为按钮白底黑字/白字）。
- Electron 二进制未安装时（`node_modules/.pnpm/electron@*/node_modules/electron/dist` 缺失）：进该目录手动 `node install.js`；`.npmrc` 已配国内镜像。
- 主进程日志（含弹幕连接）走 stdout；Playwright 需转发 `app.process().stdout` 才能看到。
- 抖音：搜索与「关注」列表需要登录态（无 Cookie 时搜索返回 `2483`）；Cookie 在设置页粘贴，存于 Electron userData 的 `settings.json`。搜索接口**必须带用户 Cookie**（只带 HEAD 拿到的动态 ttwid 会回 2483），`searchRooms` 里是 `this.cookie || dyCookie`。「关注」接口与直播接口不是同一套：需 `https://www.douyin.com/` 的 referer + 完整 Cookie + a_bogus 签名，分页用上一页 `min_time` 作下一页 `max_time`（`offset` 无效），页间隔 ≥1.5s。关注用户的**直播状态直接来自 `following/list` 每条的 `live_status` + `room_data`**（含 `owner.web_rid` / `user_count`），不要再逐个请求 `user/profile/other`（该接口对非浏览器请求已风控：HTTP 444 + `Access Denied` HTML）。
- B 站：分区房间接口 `second/getList` 已被风控（-352），改用 `second/getListByArea` + `parent_area_id/area_id`；匿名弹幕 op3 人气恒回占位值 `1`（实现里已做 `>1` 才上报，UI 回落到房间详情人气）；部分高清晰度需要完整 Cookie。
- 虎牙：拉流地址靠 WUP 签名（`getCndTokenInfoEx` + anticode），签名有效约 15 分钟，失败时兜底用房间页 anticode（仅默认码率）；HEVC/HDR 画质已过滤（mpegts.js 播不了）；官方赛事房匿名弹幕只推在线人数、不推聊天。

## 测试策略

- **不要主动跑测试**：E2E（`pnpm e2e` / `e2e:soak` / `visual-audit`）、协议验证（`pnpm verify:sign|api|danmaku|following|bilibili|huya`）只在开发者明确要求时执行；开发过程中不自行发起，静态检查（`pnpm typecheck`）除外。
- 开发者要求跑测试时，**优先 E2E，把它当作唯一测试手段**：用真实应用（`pnpm dev` 或构建产物）跑完整流程；收尾必须留下可重跑、可复现的工件（脚本 / 报告 / 截图，放 `.tmp/shots/`）。
- `pnpm e2e` 跑的是**构建产物**（`apps/desktop/out/`）：单独跑 `node scripts/e2e-smoke.mjs` 前必须先 `pnpm build`；`APP_PATH=<打包后的可执行文件>` 可测安装包。
- **不要新增其他测试框架**。协议层改动（core 的签名 / 接口 / 弹幕）的被测手段是上面的 `verify:*` 脚本。

## 文档索引

- `PRODUCT.md` / `DESIGN.md`：产品定位与设计系统（色板、字号、组件、布局规范的唯一事实来源，UI 改动前先读）。
- `scripts/verify-*.mjs`：真实接口回归脚本（`verify:bilibili|huya` 可传房间号，如 `node scripts/verify-huya.mjs 660000`）。
- `apps/desktop/electron-builder.yml`：打包配置（appId / productName / 平台目标）。
