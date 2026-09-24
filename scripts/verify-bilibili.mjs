import { bundleCore } from './lib/bundle-core.mjs';

/**
 * B 站站点真实接口自验（联网）：
 *   node scripts/verify-bilibili.mjs [roomId]
 * 依次验证：推荐/分类取在播房间 → 房间详情 → 画质与拉流地址 HTTP 200 →
 * 直播状态一致 → 搜索 → 弹幕连续收 20s。
 */

const core = await bundleCore('verify-bilibili');
const site = new core.BilibiliSite();
const rule = site.streamHeaderRules?.[0] ?? {};
const streamHeaders = {
  'User-Agent': rule.userAgent,
  Referer: rule.referer,
  Origin: rule.origin
};

const results = [];
let first;
let detail;
let qualities = [];
let liveStatus = null;
let searchItems = [];
let chatCount = 0;
let onlineValue = 0;
let onlineSeen = false;
const chatSamples = [];

function record(name, ok, summary) {
  results.push({ name, ok, summary });
  console.log(`${ok ? '✅' : '❌'} ${name}：${summary}`);
}

async function step(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    return await fn();
  } catch (error) {
    record(name, false, error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** HEAD 优先，失败则 GET 并在拿到响应头后立即断开（不下载完整流） */
async function probeUrl(url, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      headers,
      signal: controller.signal
    });
    if (response.status >= 400) {
      response = await fetch(url, { headers, signal: controller.signal });
    }
    const status = response.status;
    if (response.body) {
      try {
        await response.body.cancel();
      } catch {
        // 断开流失败可忽略
      }
    }
    return status;
  } finally {
    clearTimeout(timer);
  }
}

await step('1. 推荐/分类接口取在播房间', async () => {
  const roomIdArg = process.argv[2];
  const recommend = await site.getRecommendRooms(1);
  console.log(
    `推荐房间：hasMore=${recommend.hasMore}, items=${recommend.items.length}`
  );
  if (recommend.items.length === 0) {
    throw new Error('推荐列表为空');
  }

  const categories = await site.getCategores();
  console.log(`分类数：${categories.length}`);
  const firstCategory = categories.find((c) => c.children.length > 0);
  let categoryItems = 0;
  if (firstCategory) {
    const sub = firstCategory.children[1] ?? firstCategory.children[0];
    const categoryRooms = await site.getCategoryRooms(sub, 1);
    categoryItems = categoryRooms.items.length;
    console.log(
      `分区房间（${firstCategory.name}/${sub.name}）：hasMore=${categoryRooms.hasMore}, items=${categoryItems}`
    );
  }

  if (roomIdArg) {
    first = { roomId: roomIdArg, title: '(命令行指定)' };
    console.log(`使用命令行指定房间：${roomIdArg}`);
    return;
  }

  for (const item of recommend.items.slice(0, 8)) {
    const isLive = await site.getLiveStatus(item.roomId);
    if (isLive) {
      first = item;
      break;
    }
  }
  if (!first) {
    throw new Error('推荐列表前 8 个房间均未在播');
  }
  console.log(
    `选中房间：${first.roomId} | ${first.title} | ${first.userName} | online=${first.online}`
  );
  record(
    '1. 推荐/分类接口取在播房间',
    true,
    `推荐 ${recommend.items.length} 条、分类 ${categories.length} 个、分区 ${categoryItems} 条，选中 ${first.roomId}`
  );
});

if (first) {
  await step('2. 房间详情', async () => {
    detail = await site.getRoomDetail(first.roomId);
    console.log(`roomId=${detail.roomId}`);
    console.log(`title=${detail.title}`);
    console.log(`userName=${detail.userName}`);
    console.log(`status=${detail.status}, online=${detail.online}`);
    console.log(`url=${detail.url}`);
    console.log(`cover=${String(detail.cover).slice(0, 90)}`);
    console.log(`avatar=${String(detail.userAvatar).slice(0, 90)}`);
    const cloned = structuredClone(detail.danmakuData);
    console.log(`danmakuData 可结构化克隆：${JSON.stringify(cloned)}`);
    record(
      '2. 房间详情',
      Boolean(detail.roomId && detail.title && detail.userName),
      `roomId=${detail.roomId}, status=${detail.status}, online=${detail.online}`
    );
  });
}

if (detail) {
  await step('3. 画质与拉流地址', async () => {
    qualities = await site.getPlayQualites(detail);
    console.log(`画质数：${qualities.length}`);
    let allOk = qualities.length > 0;
    for (const quality of qualities) {
      const urls = Array.isArray(quality.data) ? quality.data : [];
      const mcdnTail = urls.length > 0 && urls.slice(0, -1).every((u) => !u.includes('mcdn'));
      console.log(
        `  ${quality.quality} (sort=${quality.sort}) data.length=${urls.length} mcdn垫底=${mcdnTail}`
      );
      for (const url of urls.slice(0, 3)) {
        console.log(`    - ${url.slice(0, 120)}`);
      }
      const status = urls[0] ? await probeUrl(urls[0], streamHeaders) : 0;
      console.log(`    data[0] HTTP ${status}`);
      if (status !== 200) {
        allOk = false;
      }
    }
    record(
      '3. 画质与拉流地址',
      allOk,
      `画质 ${qualities.length} 个，每个画质 data[0] 均需 HTTP 200`
    );
  });

  await step('4. 直播状态一致', async () => {
    liveStatus = await site.getLiveStatus(detail.roomId);
    console.log(
      `getLiveStatus(${detail.roomId})=${liveStatus}, detail.status=${detail.status}`
    );
    record(
      '4. 直播状态一致',
      liveStatus === detail.status,
      `接口=${liveStatus}，详情=${detail.status}`
    );
  });

  await step('6. 弹幕连续 20s', async () => {
    const client = site.createDanmakuClient();
    const closed = [];
    client.onReady = () => console.log('弹幕连接就绪');
    client.onClose = (reason) => {
      closed.push(reason);
      console.log(`弹幕连接关闭：${reason}`);
    };
    client.onMessage = (message) => {
      if (message.type === 'chat') {
        chatCount++;
        if (chatSamples.length < 3) {
          chatSamples.push(`${message.userName}: ${message.message}`);
        }
      } else if (message.type === 'online') {
        onlineSeen = true;
        onlineValue = Math.max(onlineValue, message.online);
      }
    };
    console.log(`开始接收弹幕（roomId=${detail.roomId}）...`);
    client.start(detail.danmakuData);
    await sleep(20000);
    client.stop();
    console.log(`20 秒收到 chat 消息 ${chatCount} 条`);
    console.log(`在线人气：${onlineSeen ? onlineValue : '(20s 内未收到)'}`);
    for (const sample of chatSamples) {
      console.log(`  示例：${sample}`);
    }
    record(
      '6. 弹幕连续 20s',
      chatCount >= 1,
      `chat=${chatCount} 条，online=${onlineSeen ? onlineValue : '未收到'}`
    );
  });
}

await step('5. 搜索直播间', async () => {
  const search = await site.searchRooms('游戏', 1);
  searchItems = search.items;
  console.log(`hasMore=${search.hasMore}, items=${search.items.length}`);
  for (const item of search.items.slice(0, 5)) {
    console.log(
      `  ${item.roomId} | ${item.title.slice(0, 40)} | ${item.userName} | online=${item.online}`
    );
  }
  record('5. 搜索直播间', search.items.length > 0, `返回 ${search.items.length} 条`);
});

console.log('\n================ 汇总 ================');
for (const item of results) {
  console.log(`${item.ok ? '✅' : '❌'} ${item.name}：${item.summary}`);
}
console.log('------------------------------------');
console.log(`房间号：${detail?.roomId ?? first?.roomId ?? '(无)'}`);
console.log(`画质：${qualities.length} 个`);
console.log(`搜索条数：${searchItems.length}`);
console.log(`弹幕 chat：${chatCount} 条，online=${onlineSeen ? onlineValue : '未收到'}`);
const failed = results.filter((item) => !item.ok);
console.log(failed.length === 0 ? '✅ 全部通过' : `❌ ${failed.length} 项失败`);
process.exit(failed.length === 0 ? 0 : 1);
