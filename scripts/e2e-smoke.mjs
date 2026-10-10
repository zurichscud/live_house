import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
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
console.log(`✅ 导航项: ${navCount} 个（首页/收藏/历史/我的/设置）`);
const titleBarText = (
  await page.locator('[data-testid="title-bar"]').textContent()
)?.trim();
const titleBarInputs = await page.locator('[data-testid="title-bar"] input').count();
const appLogo = await page.locator('[data-testid="app-logo"]').count();
console.log(
  `✅ 标题栏: 文本「${titleBarText || '空'}」（输入控件 ${titleBarInputs} 个）/ 侧栏品牌图标: ${appLogo > 0 ? '有' : '无'}`
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
  appLogo === 1 &&
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

// 房间头：标题在头像右侧，主播名 / 人气 / 房间号同一行、icon 分隔（无点）
const roomTitleText = (
  await page.locator('[data-testid="room-title"]').textContent().catch(() => '')
)?.trim();
const roomMetaText = (
  await page.locator('[data-testid="room-meta"]').textContent().catch(() => '')
)?.trim();
const roomMetaIcons = await page
  .locator('[data-testid="room-meta"] svg')
  .count()
  .catch(() => 0);
const roomHeaderOk =
  Boolean(roomTitleText) &&
  Boolean(roomMetaText) &&
  !roomMetaText?.includes('·') &&
  !roomMetaText?.includes('人气') &&
  roomMetaIcons === 3;
console.log(
  `✅ 房间头: 标题「${roomTitleText}」/ 信息行「${roomMetaText}」（icon ${roomMetaIcons} 个，无点与「人气」字样: ${!roomMetaText?.includes('·') && !roomMetaText?.includes('人气') ? '是' : '否'}）`
);

// 侧栏品牌图标：直播间内激活；切到其他 tab 后点它返回刚才的直播间
const appLogoActive = await page
  .locator('[data-testid="app-logo"][aria-current="page"]')
  .count();
await page.locator('[data-testid="nav-favorites"]').click();
await page.waitForSelector('h1:has-text("收藏")', { timeout: 10000 });
const appLogoIdle = await page
  .locator('[data-testid="app-logo"][aria-current="page"]')
  .count();
await page.locator('[data-testid="app-logo"]').click();
await page.waitForSelector('[data-testid="live-player"]', { timeout: 30000 });
const backToRoom = page.url().includes('#/room/');
const appLogoOk = appLogoActive === 1 && appLogoIdle === 0 && backToRoom;
console.log(
  `✅ 侧栏应用图标: 直播间内激活=${appLogoActive === 1}，离开后点击返回直播间=${backToRoom}`
);

// 操作栏直播计时：HH:MM:SS 且逐秒走动
const timerText = (
  await page.locator('[data-testid="live-timer"]').textContent().catch(() => '')
)?.trim();
await wait(2200);
const timerTextNext = (
  await page.locator('[data-testid="live-timer"]').textContent().catch(() => '')
)?.trim();
const timerOk =
  /^\d{2,}:\d{2}:\d{2}$/.test(timerText ?? '') && timerText !== timerTextNext;
console.log(
  `✅ 操作栏直播计时: ${timerText || '无'} → ${timerTextNext || '无'}（走动=${timerText !== timerTextNext}）`
);

// 收藏当前博主（供「收藏」页验证）
await page.locator('[data-testid="room-favorite"]').click();
const favoriteLabel = (
  await page.locator('[data-testid="room-favorite"]').textContent()
)?.trim();
console.log(`✅ 收藏按钮: ${favoriteLabel}（应为「已收藏」）`);

// 3. 播放与弹幕
console.log('\n=== 3. 播放与弹幕（等待 15 秒）===');
await wait(15000);

// 首次加载 / 断流重连可能正好落在采样点：先等画面真正在播（最多 30s），再采样
await page
  .waitForFunction(
    () => {
      const video = document.querySelector('video');
      return Boolean(video && !video.paused && video.currentTime > 1);
    },
    { timeout: 30000 }
  )
  .catch(() => {});

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

// 4.1 暂停：画面定格，不得再显示「正在连接直播流」
await player.hover();
await page.locator('button[aria-label="暂停"]').first().click();
await wait(600);
const pauseState = await page.evaluate(() => {
  const video = document.querySelector('video');
  const playerText =
    document.querySelector('[data-testid="live-player"]')?.innerText ?? '';
  return {
    paused: video?.paused ?? false,
    connectingShown: playerText.includes('正在连接直播流')
  };
});
const pauseOk = pauseState.paused && !pauseState.connectingShown;
console.log(
  `✅ 暂停: ${pauseState.paused ? '已暂停' : '未暂停'}；连接提示 ${pauseState.connectingShown ? '❌ 错误显示' : '未显示'}`
);
await page.screenshot({ path: resolve(shotDir, 'room-paused.png') });
await page.locator('button[aria-label="播放"]').first().click();
await wait(1200);

// 4.2 小窗模式：独立小窗播放，主窗口转为占位；关闭小窗后主窗口恢复
console.log('\n=== 4.2 小窗模式 ===');
const miniWindowPromise = app.waitForEvent('window', { timeout: 15000 });
await page.locator('[data-testid="player-mini"]').click();
const miniWindow = await miniWindowPromise;
await miniWindow.waitForLoadState('domcontentloaded');
await miniWindow.waitForSelector('[data-testid="live-player"]', {
  timeout: 30000
});
await miniWindow
  .waitForFunction(
    () => {
      const video = document.querySelector('video');
      return Boolean(video && !video.paused && video.currentTime > 0);
    },
    { timeout: 30000 }
  )
  .catch(() => {});
const miniState = await miniWindow.evaluate(() => {
  const video = document.querySelector('video');
  return {
    paused: video ? video.paused : true,
    currentTime: video ? Number(video.currentTime.toFixed(1)) : -1
  };
});
const miniPlaceholder = await page
  .locator('text=正在小窗播放')
  .waitFor({ timeout: 10000 })
  .then(() => 1)
  .catch(() => 0);
await miniWindow.screenshot({ path: resolve(shotDir, 'mini-player.png') });
console.log(
  `✅ 小窗: ${!miniState.paused ? `播放中（${miniState.currentTime}s）` : '❌ 未播放'}；主窗口占位 ${miniPlaceholder > 0 ? '已显示' : '❌ 未显示'}`
);

await miniWindow.locator('[data-testid="mini-close"]').click();
await page.waitForSelector('[data-testid="live-player"]', { timeout: 20000 });
await page
  .waitForFunction(
    () => {
      const video = document.querySelector('video');
      return Boolean(video && !video.paused && video.currentTime > 0);
    },
    { timeout: 30000 }
  )
  .catch(() => {});
const mainRestored = await page.evaluate(() => {
  const video = document.querySelector('video');
  return video ? !video.paused && video.currentTime > 0 : false;
});
const miniOk = !miniState.paused && miniPlaceholder > 0 && mainRestored;
console.log(
  `✅ 主窗口恢复: ${mainRestored ? '播放中' : '❌ 未恢复播放'}`
);

// 5. 房间页返回键 + 收藏 / 历史 / 我的 / 设置页
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
// 平台 tab：全部 + 3 平台，切走再切回列表仍完整
const favoriteTabCount = await page
  .locator('[data-testid^="favorites-tab-"]')
  .count();
await page.locator('[data-testid="favorites-tab-bilibili"]').click();
await wait(300);
await page.locator('[data-testid="favorites-tab-all"]').click();
await page
  .locator('[data-testid="favorite-item"]')
  .first()
  .waitFor({ timeout: 10000 });
const favoriteCountAfterTabs = await page
  .locator('[data-testid="favorite-item"]')
  .count();
console.log(
  `✅ 收藏平台 tab: ${favoriteTabCount} 个（全部 + 3 平台），切回「全部」仍有 ${favoriteCountAfterTabs} 个博主`
);
const favoritesOk =
  favoriteCount > 0 &&
  favoritePlatform === '抖音' &&
  Boolean(favoriteLive) &&
  favoriteTabCount === 4 &&
  favoriteCountAfterTabs === favoriteCount;
await page.screenshot({ path: resolve(shotDir, 'favorites.png') });

// 5.1 收藏导出 / 导入：替换原生文件对话框，验证真实读写与去重合并
console.log('\n=== 5.1 收藏导出 / 导入 ===');
const backupFile = resolve(root, '.tmp/e2e/favorites-backup.json');
mkdirSync(dirname(backupFile), { recursive: true });
rmSync(backupFile, { force: true });
await app.evaluate(
  ({ dialog }, filePath) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath });
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [filePath]
    });
  },
  backupFile
);
await page.locator('[data-testid="favorites-export"]').click();
for (let i = 0; i < 50 && !existsSync(backupFile); i += 1) {
  await wait(100);
}
const exportedCount = existsSync(backupFile)
  ? JSON.parse(readFileSync(backupFile, 'utf8')).items.length
  : 0;
// 清空本地收藏并重新进入页面，再用导入恢复
await page.evaluate(() => localStorage.removeItem('live-house:favorites'));
await page.locator('[data-testid="nav-history"]').click();
await page.waitForSelector('h1:has-text("历史")', { timeout: 10000 });
await page.locator('[data-testid="nav-favorites"]').click();
await page.waitForSelector('h1:has-text("收藏")', { timeout: 10000 });
const emptiedCount = await page.locator('[data-testid="favorite-item"]').count();
await page.locator('[data-testid="favorites-import-empty"]').click();
await page
  .locator('[data-testid="favorite-item"]')
  .first()
  .waitFor({ timeout: 10000 });
const restoredCount = await page.locator('[data-testid="favorite-item"]').count();
const backupOk =
  exportedCount > 0 && emptiedCount === 0 && restoredCount === exportedCount;
console.log(
  `✅ 收藏导出 / 导入: 导出 ${exportedCount} 条 → 清空后剩 ${emptiedCount} 条 → 导入恢复 ${restoredCount} 条`
);
await page.screenshot({ path: resolve(shotDir, 'favorites-backup.png') });

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
await page.waitForSelector('h1:has-text("历史")', { timeout: 10000 });
const historyTabCount = await page
  .locator('[data-testid^="history-tab-"]')
  .count();
// 切到空平台 tab 时标题行按钮消失，tab 行不得因此上移（动作区固定高度）
const historyTabRowY = (
  await page.locator('[data-testid="history-tab-all"]').boundingBox()
)?.y;
await page.locator('[data-testid="history-tab-bilibili"]').click();
await wait(300);
const bilibiliCount = await page.locator('[data-testid="history-item"]').count();
const historyTabRowYAfter = (
  await page.locator('[data-testid="history-tab-all"]').boundingBox()
)?.y;
const historyLayoutStable =
  historyTabRowY !== undefined &&
  historyTabRowYAfter !== undefined &&
  Math.abs(historyTabRowYAfter - historyTabRowY) < 1;
console.log(
  `✅ 切换平台无位移: ${historyLayoutStable ? '是' : `否（${historyTabRowY} → ${historyTabRowYAfter}）`}`
);
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
  `✅ 历史: ${historyCount} 条（平台标注: ${historyPlatform || '无'}，` +
    `直播状态: ${historyLive || '未返回'}，行内图标 ${historyIcons} 个）`
);
const historyOk =
  historyTabCount === 3 &&
  bilibiliCount === 0 &&
  historyCount > 0 &&
  Boolean(historyPlatform) &&
  Boolean(historyLive) &&
  historyIcons >= 3 &&
  historyLayoutStable;
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

// 8. 历史封面兜底：未开播房间详情缺封面时，不得把历史里已有的封面覆盖为空
console.log('\n=== 8. 历史封面兜底 ===');
const coverGuardRoom = 'e2e-offline-cover-guard';
const coverGuardCover =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz4=';
await page.evaluate(
  ({ roomId, cover }) => {
    const key = 'live-house:watch-history';
    const list = JSON.parse(localStorage.getItem(key) ?? '[]');
    const rest = list.filter((entry) => entry.roomId !== roomId);
    localStorage.setItem(
      key,
      JSON.stringify([
        {
          platform: 'douyin',
          roomId,
          title: '历史标题',
          userName: '历史主播',
          cover,
          avatar: '',
          watchedAt: Date.now()
        },
        ...rest
      ])
    );
  },
  { roomId: coverGuardRoom, cover: coverGuardCover }
);
// 主进程层面模拟「未开播房间」：详情没有封面 / 标题 / 头像
await app.evaluate(({ ipcMain }) => {
  ipcMain.removeHandler('site:getRoomDetail');
  ipcMain.handle('site:getRoomDetail', (_event, _site, roomId) => ({
    roomId,
    title: '',
    cover: '',
    userName: '',
    userAvatar: '',
    online: 0,
    status: false,
    url: `https://live.douyin.com/${roomId}`,
    introduction: '',
    notice: '',
    data: {}
  }));
});
await page.evaluate((roomId) => {
  window.location.hash = `#/room/douyin/${roomId}`;
}, coverGuardRoom);
await wait(1500);
const coverGuardValue = await page.evaluate((roomId) => {
  const list = JSON.parse(
    localStorage.getItem('live-house:watch-history') ?? '[]'
  );
  return list.find((entry) => entry.roomId === roomId)?.cover ?? '';
}, coverGuardRoom);
const coverGuardOk = coverGuardValue === coverGuardCover;
console.log(
  `✅ 未开播回访: ${coverGuardOk ? '历史封面保留' : '❌ 封面被覆盖为空'}`
);

// 结果
console.log('\n=== 结果 ===');
const playing = videoState && !videoState.paused && videoState.currentTime > 1;
const hasDanmaku = danmakuCount > 0;
console.log(`顶栏/看板: ${boardOk ? '✅ 正常' : '❌ 异常'}`);
console.log(
  `侧栏应用图标: ${appLogoOk ? '✅ 直播间激活 / 可返回' : '❌ 激活或返回异常'}`
);
console.log(
  `直播计时: ${timerOk ? '✅ 显示且逐秒走动' : '❌ 未显示或未走动'}`
);
console.log(
  `房间头: ${roomHeaderOk ? '✅ 标题贴头像右侧、信息行 icon 分隔' : '❌ 标题 / 信息行不符合预期'}`
);
console.log(`播放: ${playing ? '✅ 正常播放' : '❌ 未播放'}`);
console.log(
  `暂停: ${pauseOk ? '✅ 定格且不显示连接提示' : '❌ 暂停误显连接提示或未暂停'}`
);
console.log(
  `小窗: ${miniOk ? '✅ 小窗播放、主窗口占位并恢复' : '❌ 小窗链路异常'}`
);
console.log(`弹幕: ${hasDanmaku ? '✅ 正常接收' : '❌ 未收到弹幕'}`);
console.log(
  `收藏: ${favoritesOk ? '✅ 可收藏并显示直播状态' : '❌ 收藏链路异常'}`
);
console.log(
  `收藏导出/导入: ${backupOk ? '✅ 备份并恢复' : '❌ 导出或导入异常'}`
);
console.log(`我的: ${mineOk ? '✅ 平台 tab 正常' : '❌ 平台 tab 异常'}`);
console.log(
  `历史: ${historyOk ? '✅ 已写入（平台 / 图标 / 直播状态）' : '❌ 未写入或缺少平台、直播状态'}`
);
console.log(`主题切换: ${themeOk ? '✅ 正常' : '❌ 异常'}`);
console.log(
  `历史封面兜底: ${coverGuardOk ? '✅ 未开播不覆盖封面' : '❌ 封面被清空'}`
);
console.log(`渲染错误: ${errors.length} 个`);
console.log(`截图目录: ${shotDir}`);

await app.close();
process.exit(
  boardOk &&
    roomHeaderOk &&
    appLogoOk &&
    timerOk &&
    playing &&
    pauseOk &&
    miniOk &&
    hasDanmaku &&
    favoritesOk &&
    backupOk &&
    mineOk &&
    historyOk &&
    themeOk &&
    coverGuardOk &&
    errors.length === 0
    ? 0
    : 1
);
