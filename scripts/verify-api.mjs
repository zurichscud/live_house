import { bundleCore } from './lib/bundle-core.mjs';

const core = await bundleCore('verify-api');
const site = new core.DouyinSite();

async function step(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    await fn();
  } catch (e) {
    console.log(`❌ ${name} 失败: ${e.message}`);
  }
}

let first;
let detail;

await step('1. 推荐房间', async () => {
  const recommend = await site.getRecommendRooms(1);
  console.log(`hasMore=${recommend.hasMore}, items=${recommend.items.length}`);
  if (recommend.items.length === 0) {
    throw new Error('推荐列表为空');
  }
  first = recommend.items[0];
  console.log(
    `示例: ${first.roomId} | ${first.title} | ${first.userName} | online=${first.online}`
  );
});

await step('2. 房间详情', async () => {
  detail = await site.getRoomDetail(first.roomId);
  console.log(`roomId=${detail.roomId}`);
  console.log(`title=${detail.title}`);
  console.log(`userName=${detail.userName}`);
  console.log(`status=${detail.status}, online=${detail.online}`);
  console.log(`avatar=${String(detail.userAvatar).slice(0, 70)}`);
});

await step('3. 画质', async () => {
  const qualities = await site.getPlayQualites(detail);
  console.log(`qualities=${qualities.length}`);
  for (const q of qualities) {
    const urls = q.data;
    const kinds = urls.map((u) =>
      u.includes('.flv') ? 'FLV' : u.includes('.m3u8') ? 'HLS' : '?'
    );
    console.log(`  ${q.quality} (sort=${q.sort}) [${kinds.join('+')}]`);
  }
});

await step('4. 播放地址', async () => {
  const qualities = await site.getPlayQualites(detail);
  if (qualities.length === 0) {
    throw new Error('无可用画质');
  }
  const playUrl = site.getPlayUrls(detail, qualities[0]);
  console.log(`urls=${playUrl.urls.length}`);
  console.log(`  首选: ${playUrl.urls[0]?.slice(0, 130)}`);
});

await step('5. 分类', async () => {
  const categories = await site.getCategores();
  console.log(`categories=${categories.length}`);
  for (const c of categories.slice(0, 6)) {
    console.log(`  ${c.name} (id=${c.id}, subs=${c.children.length})`);
  }
  const game = categories.find((c) => c.name === '游戏');
  if (game && game.children.length > 3) {
    console.log(`  游戏子分类示例: ${game.children.slice(0, 4).map((s) => s.name).join(', ')}`);
  }
});

await step('6. 类目房间（游戏-竞技游戏）', async () => {
  const categories = await site.getCategores();
  const game = categories.find((c) => c.name === '游戏');
  const sub = game?.children.find((s) => s.name === '竞技游戏');
  if (!sub) {
    throw new Error('未找到竞技游戏分类');
  }
  const result = await site.getCategoryRooms(sub, 1);
  console.log(`hasMore=${result.hasMore}, items=${result.items.length}`);
  for (const item of result.items.slice(0, 3)) {
    console.log(`  ${item.roomId} | ${item.title} | ${item.userName}`);
  }
});

await step('7. 搜索', async () => {
  const search = await site.searchRooms('游戏', 1);
  console.log(`items=${search.items.length}`);
  for (const item of search.items.slice(0, 3)) {
    console.log(`  ${item.roomId} | ${item.title} | ${item.userName}`);
  }
});

await step('8. 直播状态', async () => {
  const liveStatus = await site.getLiveStatus(first.roomId);
  console.log(`liveStatus=${liveStatus}`);
});
