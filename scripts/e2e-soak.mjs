import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const appDir = resolve(root, 'apps/desktop');
const shotDir = resolve(root, '.tmp/shots');
mkdirSync(shotDir, { recursive: true });

const durationMin = Number(process.env.DURATION_MIN ?? 10);
const sampleIntervalMs = 30000;
const appPath = process.env.APP_PATH;

console.log(`长播稳定性测试：${durationMin} 分钟，每 ${sampleIntervalMs / 1000}s 采样`);

const app = appPath
  ? await electron.launch({ executablePath: appPath })
  : await electron.launch({ args: ['.'], cwd: appDir });

const page = await app.firstWindow();
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    errors.push(`console: ${msg.text()}`);
  }
});

await page.waitForLoadState('domcontentloaded');
await page.waitForSelector('[data-testid="following-live-card"]', { timeout: 40000 });
const sampleRoomId = await page.evaluate(async () => {
  try {
    const result = await window.api.site.getRecommendRooms('douyin', 1);
    return result.items.find((item) => item.roomId)?.roomId ?? '';
  } catch {
    return '';
  }
});
if (!sampleRoomId) {
  console.log('❌ 推荐接口未返回可用房间，无法开始长播测试');
  await app.close();
  process.exit(1);
}
await page
  .locator('input[aria-label="搜索直播间或输入房间号"]')
  .fill(sampleRoomId);
await page.keyboard.press('Enter');
await page.waitForSelector('[data-testid="live-player"]', { timeout: 40000 });
await page.waitForTimeout(6000);

const roomTitle = await page.locator('[data-testid="room-title"]').textContent();
console.log(`测试房间: ${roomTitle}`);

const samples = [];
const startedAt = Date.now();

async function sample(index) {
  const state = await page.evaluate(() => {
    const video = document.querySelector('video');
    return {
      currentTime: video ? Number(video.currentTime.toFixed(1)) : -1,
      paused: video ? video.paused : null,
      readyState: video ? video.readyState : null,
      droppedFrames: null,
      danmakuCount: document.querySelectorAll('[data-testid="danmaku-item"]').length,
      online: document.querySelector('[data-testid="danmaku-online"]')?.textContent?.trim() ?? '',
      rendererHeapMB: (() => {
        const memory = performance.memory;
        return memory
          ? Number((memory.usedJSHeapSize / 1024 / 1024).toFixed(1))
          : -1;
      })()
    };
  });
  const mainHeapMB = await app.evaluate(() =>
    Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1))
  );
  const item = {
    index,
    elapsedSec: Math.round((Date.now() - startedAt) / 1000),
    ...state,
    mainHeapMB
  };
  samples.push(item);
  console.log(
    `[${item.elapsedSec}s] time=${item.currentTime} paused=${item.paused} rs=${item.readyState} ` +
      `danmaku=${item.danmakuCount} mainHeap=${item.mainHeapMB}MB rendererHeap=${item.rendererHeapMB}MB ${item.online}`
  );
}

const totalSamples = Math.floor((durationMin * 60 * 1000) / sampleIntervalMs);
for (let i = 0; i < totalSamples; i++) {
  await page.waitForTimeout(sampleIntervalMs);
  try {
    await sample(i + 1);
  } catch (error) {
    console.log(`采样失败: ${error.message}`);
    errors.push(`sample: ${error.message}`);
    break;
  }
}

// 汇总
console.log('\n=== 汇总 ===');
const first = samples[1] ?? samples[0];
const last = samples[samples.length - 1];
const timeGrowth = last.currentTime - first.currentTime;
const expectedGrowth = (last.elapsedSec - first.elapsedSec) * 0.95;
const playing = timeGrowth > expectedGrowth * 0.9;
console.log(
  `播放进度: ${first.currentTime}s -> ${last.currentTime}s（增长 ${timeGrowth.toFixed(1)}s）`
);
console.log(`播放连续性: ${playing ? '✅ 正常（无卡死）' : '❌ 异常'}`);
console.log(`主进程堆内存: ${first.mainHeapMB}MB -> ${last.mainHeapMB}MB`);
console.log(`渲染进程堆: ${first.rendererHeapMB}MB -> ${last.rendererHeapMB}MB`);
console.log(`弹幕累计: ${last.danmakuCount} 条`);
console.log(`错误数: ${errors.length}`);
for (const error of errors.slice(0, 5)) {
  console.log(`  - ${error}`);
}

await page.screenshot({ path: resolve(shotDir, 'soak-end.png') });
await app.close();
process.exit(playing && errors.length < 5 ? 0 : 1);
