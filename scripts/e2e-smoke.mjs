import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const appDir = resolve(root, 'apps/desktop');
const shotDir = resolve(root, '.tmp/shots');
mkdirSync(shotDir, { recursive: true });

const wait = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
const roomCard = '[data-testid="room-card"]';
const boardSearch = 'input[aria-label="搜索直播间或输入房间号"]';
const liveCard = '[data-testid="following-live-card"]';

console.log('启动 Electron 应用...');
const appPath = process.env.APP_PATH;
const app = appPath
  ? await electron.launch({ executablePath: appPath })
  : await electron.launch({ args: ['.'], cwd: appDir });

const page = await app.firstWindow();

app.process().stdout?.on('data', (data) => {
  const text = data.toString().trim();
  if (text) {
    console.log(`[main] ${text}`);
  }
});
app.process().stderr?.on('data', (data) => {
  const text = data.toString().trim();
  if (text && !text.includes('sandbox_extension')) {
    console.log(`[main:err] ${text}`);
  }
});

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    errors.push(msg.text());
    console.log('[renderer error]', msg.text());
  }
});
page.on('pageerror', (error) => {
  errors.push(error.message);
  console.log('[page error]', error.message);
});

await page.waitForLoadState('domcontentloaded');
console.log('窗口已加载');

/** 首页搜索框支持直接粘贴房间号进入直播间 */
async function enterRoomById(roomId) {
  await page.locator(boardSearch).fill(String(roomId));
  await page.keyboard.press('Enter');
  await page.waitForSelector('[data-testid="live-player"]', { timeout: 40000 });
}

// 0. 顶栏 + 左侧导航
console.log('\n=== 0. 顶栏与左侧导航 ===');
await page.waitForSelector('[data-testid="nav-home"]', { timeout: 40000 });
const navCount = await page.locator('[data-testid^="nav-"]').count();
console.log(`✅ 导航项: ${navCount} 个（首页/收藏/观看记录/我的/设置）`);
const titleBarText = (
  await page.locator('[data-testid="title-bar"]').textContent()
)?.trim();
const titleBarInputs = await page.locator('[data-testid="title-bar"] input').count();
const appName = (
  await page.locator('[data-testid="app-name"]').textContent()
)?.trim();
console.log(
  `✅ 标题栏: 文本「${titleBarText || '空'}」（输入控件 ${titleBarInputs} 个）/ 侧栏品牌: ${appName}`
);

// 1. 首页看板（搜索 + 关注直播，无平台入口、无直播列表）
console.log('\n=== 1. 首页看板 ===');
await page.waitForSelector(liveCard, { timeout: 40000 });
const boardRoomCount = await page.locator(roomCard).count();
console.log(`✅ 首页直播列表: ${boardRoomCount} 个房间卡片（应为 0）`);
const platformCards = await page.locator('[data-testid^="platform-card-"]').count();
console.log(`✅ 平台入口卡片: ${platformCards} 个（应为 0）`);

// 大号搜索框：左侧平台选择器
const siteTrigger = await page.locator('[data-testid="search-site-trigger"]').count();
const siteTriggerText = (
  await page.locator('[data-testid="search-site-trigger"]').textContent().catch(() => '')
)?.trim();
await page.locator('[data-testid="search-site-trigger"]').click();
await page.waitForSelector('[data-testid="menu-item"]', { timeout: 5000 });
const siteOptionCount = await page.locator('[data-testid="menu-item"]').count();
const bilibiliOptionDisabled =
  (await page.locator('[data-testid="menu-item"]').nth(1).getAttribute('data-disabled')) !== null;
await page.keyboard.press('Escape');
await wait(200);
console.log(
  `✅ 大号搜索框: 平台选择器 ${siteTrigger} 个（当前 ${siteTriggerText || '无'}），` +
    `下拉 ${siteOptionCount} 项（B站禁用=${bilibiliOptionDisabled}）`
);

// 关注直播概览（无 Cookie 时应给出登录提示）
const liveCardText = (
  await page.locator('[data-testid="following-live-text"]').textContent().catch(() => '')
)?.trim();
console.log(`✅ 关注直播: ${liveCardText || '未渲染'}`);

const boardOk =
  titleBarInputs === 0 &&
  titleBarText === '' &&
  appName === 'LIVE HOUSE' &&
  boardRoomCount === 0 &&
  platformCards === 0 &&
  siteTrigger === 1 &&
  siteOptionCount === 3 &&
  bilibiliOptionDisabled &&
  Boolean(liveCardText);
await page.screenshot({ path: resolve(shotDir, 'home-board.png') });

// 2. 进入房间：取一个真实房间号，用首页搜索框粘贴进入
console.log('\n=== 2. 进入房间 ===');
const sampleRoom = await page.evaluate(async () => {
  try {
    const result = await window.api.site.getRecommendRooms('douyin', 1);
    const item = result.items.find((room) => room.roomId);
    return item
      ? { roomId: item.roomId, title: item.title, userName: item.userName }
      : null;
  } catch {
    return null;
  }
});
if (!sampleRoom) {
  console.log('❌ 推荐接口未返回可用房间，无法进入直播间');
  await app.close();
  process.exit(1);
}
console.log(
  `   使用房间: ${sampleRoom.userName} - ${sampleRoom.title}（${sampleRoom.roomId}）`
);
await enterRoomById(sampleRoom.roomId);
console.log('✅ 播放器组件已渲染');

// 收藏当前博主（供「收藏」页验证）
await page.locator('[data-testid="room-favorite"]').click();
const favoriteLabel = (
  await page.locator('[data-testid="room-favorite"]').textContent()
)?.trim();
console.log(`✅ 收藏按钮: ${favoriteLabel}（应为「已收藏」）`);

// 3. 播放与弹幕
console.log('\n=== 3. 播放与弹幕（等待 15 秒）===');
await wait(15000);

const videoState = await page.evaluate(() => {
  const video = document.querySelector('video');
  if (!video) {
    return null;
  }
  return {
    paused: video.paused,
    currentTime: Number(video.currentTime.toFixed(2)),
    readyState: video.readyState,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight
  };
});
console.log('视频状态:', JSON.stringify(videoState));

const danmakuCount = await page.locator('[data-testid="danmaku-item"]').count();
const onlineText = await page
  .locator('[data-testid="danmaku-online"]')
  .textContent();
console.log(`弹幕条数: ${danmakuCount}`);
console.log(`在线信息: ${onlineText?.trim()}`);

const overlayCanvas = await page.locator('canvas').count();
console.log(`飘屏画布: ${overlayCanvas} 个`);

await page.screenshot({ path: resolve(shotDir, 'room.png') });

// 4. 播放器交互：hover 显示控制条 → 画质菜单
console.log('\n=== 4. 播放器交互 ===');
const player = page.locator('[data-testid="live-player"]');
await player.hover();
await wait(400);
await page.locator('[data-testid="画质-trigger"]').click();
await page.waitForSelector('[data-testid="menu-item"]', { timeout: 5000 });
const qualityOptions = await page.locator('[data-testid="menu-item"]').count();
console.log(`✅ 画质菜单可打开，选项: ${qualityOptions} 个`);
await wait(250);
await page.screenshot({ path: resolve(shotDir, 'room-menu.png') });
await page.keyboard.press('Escape');
await wait(300);

// 5. 房间页返回键 + 收藏 / 观看记录 / 我的 / 设置页
console.log('\n=== 5. 页面导航 ===');
await page.locator('[data-testid="room-back"]').click();
await page.waitForSelector(liveCard, { timeout: 20000 });
console.log('✅ 房间页返回键回到首页');

await page.locator('[data-testid="nav-favorites"]').click();
await page.waitForSelector('h1:has-text("收藏")', { timeout: 10000 });
await page
  .locator('[data-testid="favorite-item"]')
  .first()
  .waitFor({ timeout: 10000 });
const favoriteCount = await page.locator('[data-testid="favorite-item"]').count();
const favoritePlatform = (
  await page
    .locator('[data-testid="favorite-platform"]')
    .first()
    .textContent()
    .catch(() => '')
)?.trim();
await page
  .locator('[data-testid="favorite-live-status"]')
  .first()
  .waitFor({ state: 'visible', timeout: 20000 })
  .catch(() => {});
const favoriteLive = (
  await page
    .locator('[data-testid="favorite-live-status"]')
    .first()
    .textContent()
    .catch(() => '')
)?.trim();
console.log(
  `✅ 收藏: ${favoriteCount} 个博主（平台: ${favoritePlatform || '无'}，` +
    `直播状态: ${favoriteLive || '未返回'}）`
);
const favoritesOk =
  favoriteCount > 0 &&
  favoritePlatform === '抖音' &&
  Boolean(favoriteLive);
await page.screenshot({ path: resolve(shotDir, 'favorites.png') });

await page.locator('[data-testid="nav-mine"]').click();
await page.waitForSelector('h1:has-text("我的")', { timeout: 10000 });
const mineTabCount = await page.locator('[data-testid^="mine-tab-"]').count();
await wait(3000);
const mineNeedsLogin = await page.locator('text=需要登录').count();
console.log(
  `✅ 我的: ${mineTabCount} 个平台 tab；抖音关注列表` +
    (mineNeedsLogin > 0
      ? '需要登录 Cookie（已给出提示与配置入口）'
      : '已返回数据')
);
const mineOk = mineTabCount === 3;
await page.screenshot({ path: resolve(shotDir, 'mine.png') });

await page.locator('[data-testid="nav-history"]').click();
await page.waitForSelector('h1:has-text("观看记录")', { timeout: 10000 });
const historyTabCount = await page
  .locator('[data-testid^="history-tab-"]')
  .count();
await page.locator('[data-testid="history-tab-bilibili"]').click();
await wait(300);
const bilibiliCount = await page.locator('[data-testid="history-item"]').count();
await page.locator('[data-testid="history-tab-douyin"]').click();
await wait(300);
await page
  .locator('[data-testid="history-item"]')
  .first()
  .waitFor({ timeout: 10000 });
const historyCount = await page.locator('[data-testid="history-item"]').count();
console.log(
  `✅ 平台 tab: ${historyTabCount} 个（切到 B站显示 ${bilibiliCount} 条记录）`
);
const historyPlatform = (
  await page.locator('[data-testid="history-platform"]').first().textContent().catch(() => '')
)?.trim();
const historyIcons = await page
  .locator('[data-testid="history-item"]')
  .first()
  .locator('svg')
  .count()
  .catch(() => 0);
// 直播状态由异步接口查询，等待返回
await page
  .locator('[data-testid="history-live-status"]')
  .first()
  .waitFor({ state: 'visible', timeout: 20000 })
  .catch(() => {});
const historyLive = (
  await page
    .locator('[data-testid="history-live-status"]')
    .first()
    .textContent()
    .catch(() => '')
)?.trim();
console.log(
  `✅ 观看记录: ${historyCount} 条（平台标注: ${historyPlatform || '无'}，` +
    `直播状态: ${historyLive || '未返回'}，行内图标 ${historyIcons} 个）`
);
const historyOk =
  historyTabCount === 3 &&
  bilibiliCount === 0 &&
  historyCount > 0 &&
  Boolean(historyPlatform) &&
  Boolean(historyLive) &&
  historyIcons >= 3;
await page.screenshot({ path: resolve(shotDir, 'history.png') });

await page.locator('[data-testid="nav-settings"]').click();
await page.waitForSelector('h1:has-text("设置")', { timeout: 10000 });
await wait(400);
const hasCookieInput = await page.locator('#cookie-input').count();
const hasVerify = await page.locator('text=验证登录').count();
console.log(
  `✅ 设置页：Cookie 输入框 ${hasCookieInput > 0 ? '有' : '无'} / 验证登录按钮 ${hasVerify > 0 ? '有' : '无'}`
);
await page.screenshot({ path: resolve(shotDir, 'settings.png') });

// 6. 首页搜索入口
console.log('\n=== 6. 首页搜索入口 ===');
await page.locator('[data-testid="nav-home"]').click();
await page.waitForSelector(liveCard, { timeout: 20000 });
await page.locator(boardSearch).fill('游戏');
await page.keyboard.press('Enter');
await page.waitForSelector('input[aria-label="搜索直播间"]', { timeout: 10000 });
await wait(4000);
const searchError = await page.locator('text=登录').count();
console.log(
  searchError > 0
    ? '⚠️ 搜索需要登录 Cookie（已给出提示与配置入口）'
    : '✅ 搜索返回结果'
);
await page.screenshot({ path: resolve(shotDir, 'search.png') });

// 7. 主题切换
console.log('\n=== 7. 主题切换 ===');
await page.locator('[data-testid="nav-home"]').click();
await page.waitForSelector(liveCard, { timeout: 20000 });
await page.locator('[data-testid="theme-toggle"]').click();
await wait(700);
const lightTheme = await page.evaluate(
  () => document.documentElement.dataset.theme
);
console.log(`✅ 切换到亮色: ${lightTheme === 'light' ? '是' : '否'}`);
await page.screenshot({ path: resolve(shotDir, 'home-light.png') });

await enterRoomById(sampleRoom.roomId);
await wait(7000);
await page.screenshot({ path: resolve(shotDir, 'room-light.png') });
await page.locator('[data-testid="room-back"]').click();
await page.waitForSelector(liveCard, { timeout: 20000 });

await page.locator('[data-testid="theme-toggle"]').click();
await wait(500);
const backToDark = await page.evaluate(
  () => document.documentElement.dataset.theme
);
console.log(`✅ 切回暗色: ${backToDark === 'dark' ? '是' : '否'}`);
const themeOk = lightTheme === 'light' && backToDark === 'dark';

// 结果
console.log('\n=== 结果 ===');
const playing = videoState && !videoState.paused && videoState.currentTime > 1;
const hasDanmaku = danmakuCount > 0;
console.log(`顶栏/看板: ${boardOk ? '✅ 正常' : '❌ 异常'}`);
console.log(`播放: ${playing ? '✅ 正常播放' : '❌ 未播放'}`);
console.log(`弹幕: ${hasDanmaku ? '✅ 正常接收' : '❌ 未收到弹幕'}`);
console.log(
  `收藏: ${favoritesOk ? '✅ 可收藏并显示直播状态' : '❌ 收藏链路异常'}`
);
console.log(`我的: ${mineOk ? '✅ 平台 tab 正常' : '❌ 平台 tab 异常'}`);
console.log(
  `观看记录: ${historyOk ? '✅ 已写入（平台 / 图标 / 直播状态）' : '❌ 未写入或缺少平台、直播状态'}`
);
console.log(`主题切换: ${themeOk ? '✅ 正常' : '❌ 异常'}`);
console.log(`渲染错误: ${errors.length} 个`);
console.log(`截图目录: ${shotDir}`);

await app.close();
process.exit(
  boardOk &&
    playing &&
    hasDanmaku &&
    favoritesOk &&
    mineOk &&
    historyOk &&
    themeOk &&
    errors.length === 0
    ? 0
    : 1
);
