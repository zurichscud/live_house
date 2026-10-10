import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appDir = resolve(root, 'apps/desktop');
const shotDir = resolve(root, '.tmp/shots');
mkdirSync(shotDir, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const app = await electron.launch({ args: ['.'], cwd: appDir });
const page = await app.firstWindow();
await page.waitForLoadState('domcontentloaded');
await page.waitForSelector('[data-testid="following-live-card"]', { timeout: 40000 });
await wait(1200);

// 1. 最小窗口宽度
await app.evaluate(({ BrowserWindow }) => {
  BrowserWindow.getAllWindows()[0]?.setSize(960, 600);
});
await wait(900);
await page.screenshot({ path: resolve(shotDir, 'audit-home-960.png') });
console.log('✅ home @960x600');

await page.locator('[data-testid="nav-history"]').click();
await page.waitForSelector('h1:has-text("历史")', { timeout: 10000 });
await wait(600);
await page.screenshot({ path: resolve(shotDir, 'audit-history-960.png') });
console.log('✅ history @960x600');
await page.locator('[data-testid="nav-home"]').click();
await page.waitForSelector('[data-testid="following-live-card"]', { timeout: 10000 });

// 2. 进入房间 @960（首页搜索框粘贴真实房间号，页面已无推荐列表入口）
const sampleRoomId = await page.evaluate(async () => {
  try {
    const result = await window.api.site.getRecommendRooms('douyin', 1);
    return result.items.find((item) => item.roomId)?.roomId ?? '';
  } catch {
    return '';
  }
});
if (!sampleRoomId) {
  console.log('❌ 推荐接口未返回可用房间');
  await app.close();
  process.exit(1);
}
await page.locator('input[aria-label="搜索直播间或输入房间号"]').fill(sampleRoomId);
await page.keyboard.press('Enter');
await page.waitForSelector('[data-testid="live-player"]', { timeout: 40000 });
await wait(9000);
await page.screenshot({ path: resolve(shotDir, 'audit-room-960.png') });
console.log('✅ room @960x600');

// 3. 恢复尺寸 + 控制条展开
await app.evaluate(({ BrowserWindow }) => {
  BrowserWindow.getAllWindows()[0]?.setSize(1440, 900);
});
await wait(700);
const player = page.locator('[data-testid="live-player"]');
await player.hover();
await wait(600);
await page.screenshot({ path: resolve(shotDir, 'audit-controls.png') });
console.log('✅ player controls');

// 4. 弹幕列表上翻 → 回到最新按钮
const list = page.locator('[data-testid="danmaku-item"]').first();
await list.scrollIntoViewIfNeeded().catch(() => {});
await page.evaluate(() => {
  const items = document.querySelectorAll('[data-testid="danmaku-item"]');
  const scroller = items[0]?.parentElement;
  if (scroller) {
    scroller.scrollTop = 0;
  }
});
await wait(500);
await page.screenshot({ path: resolve(shotDir, 'audit-scroll.png') });
const backBtn = await page.locator('text=回到最新').count();
console.log(`✅ 回到最新按钮: ${backBtn > 0 ? '显示' : '未显示（弹幕不足）'}`);

// 5. 键盘导航 focus ring
await page.keyboard.press('Tab');
await wait(200);
await page.screenshot({ path: resolve(shotDir, 'audit-focus.png') });
console.log('✅ keyboard focus');

await app.close();
console.log('done');
