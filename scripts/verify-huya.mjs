/**
 * 虎牙站点自验脚本（真实接口）：
 *   node scripts/verify-huya.mjs [roomId]
 *
 * 依次验证：推荐列表 → 房间详情 → 画质与真实拉流 → 直播状态 → 搜索 → 弹幕（20s）。
 * 结论以退出码表示：0 全通过，1 有失败项。
 */
import { bundleCore } from './lib/bundle-core.mjs';

const DANMAKU_SECONDS = 20;
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

function findRule(site, url) {
  const hostname = new URL(url).hostname;
  for (const rule of site.streamHeaderRules ?? []) {
    if (rule.domains.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
      return rule;
    }
  }
  return undefined;
}

function buildHeaders(rule) {
  const headers = {};
  if (rule) {
    headers.Referer = rule.referer;
    if (rule.origin) headers.Origin = rule.origin;
    if (rule.userAgent) headers['User-Agent'] = rule.userAgent;
  }
  return headers;
}

/** 读取若干字节后主动断开（直播流不会自然结束） */
async function probeStream(url, site) {
  const rule = findRule(site, url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: buildHeaders(rule),
      signal: controller.signal
    });
    if (response.status !== 200) {
      return { ok: false, status: response.status, bytes: 0, kind: 'none' };
    }
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    while (total < 8192) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
    await reader.cancel().catch(() => {});
    const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
    const magic = buffer.subarray(0, 3).toString('latin1');
    const text = buffer.toString('utf8', 0, 128);
    const kind = magic === 'FLV' ? 'FLV' : text.includes('#EXTM3U') ? 'HLS' : 'unknown';
    return { ok: buffer.length > 0 && kind !== 'unknown', status: response.status, bytes: buffer.length, kind };
  } catch (error) {
    return { ok: false, status: 0, bytes: 0, kind: error.message };
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms) {
  return new Promise((done) => setTimeout(done, ms));
}

const core = await bundleCore('verify-huya');
const site = new core.HuyaSite();

let detail;
let qualities = [];

console.log('=== 0. 站点信息 ===');
console.log(`id=${site.id} name=${site.name}`);
console.log(`streamHeaderRules=${JSON.stringify(site.streamHeaderRules)}`);
console.log(`createDanmakuClient=${typeof site.createDanmakuClient === 'function' ? 'yes' : 'no'}`);

// 1. 取一个真实在播房间
console.log('\n=== 1. 推荐房间 ===');
let roomId = process.argv[2] ?? '';
try {
  if (!roomId) {
    const recommend = await site.getRecommendRooms(1);
    console.log(`hasMore=${recommend.hasMore}, items=${recommend.items.length}`);
    if (recommend.items.length === 0) {
      throw new Error('推荐列表为空');
    }
    const first = recommend.items[0];
    console.log(`示例: ${first.roomId} | ${first.title} | ${first.userName} | online=${first.online}`);
    console.log(`封面: ${first.cover}`);
    roomId = first.roomId;
  }
  console.log(`使用房间号: ${roomId}`);
  record('1. 推荐房间', true, `roomId=${roomId}`);
} catch (error) {
  record('1. 推荐房间', false, error.message);
  process.exit(1);
}

// 2. 房间详情
console.log('\n=== 2. 房间详情 ===');
try {
  detail = await site.getRoomDetail(roomId);
  console.log(`roomId=${detail.roomId}`);
  console.log(`title=${detail.title}`);
  console.log(`userName=${detail.userName}`);
  console.log(`status=${detail.status}, online=${detail.online}`);
  console.log(`avatar=${detail.userAvatar}`);
  console.log(`danmakuData=${JSON.stringify(detail.danmakuData)}`);
  console.log(`data.lines=${detail.data?.lines?.length ?? 0}, data.bitRates=${JSON.stringify(detail.data?.bitRates ?? [])}`);
  if (!detail.status) {
    throw new Error('该房间当前未开播，无法验证播放与弹幕');
  }
  record('2. 房间详情', Boolean(detail.roomId && detail.title), `roomId=${detail.roomId}`);
} catch (error) {
  record('2. 房间详情', false, error.message);
}

// 3. 画质 + 每个画质首条线路的真实拉流
console.log('\n=== 3. 画质与拉流 ===');
try {
  qualities = await site.getPlayQualites(detail);
  if (qualities.length === 0) {
    throw new Error('画质列表为空');
  }
  const checks = [];
  for (const quality of qualities) {
    const urls = Array.isArray(quality.data) ? quality.data : [];
    console.log(`画质 ${quality.quality} (sort=${quality.sort}) 线路数=${urls.length}`);
    console.log(`  线路1: ${String(urls[0] ?? '').slice(0, 140)}`);
    const stream = await probeStream(urls[0], site);
    checks.push(stream.ok);
    console.log(`  → HTTP ${stream.status}, ${stream.bytes} 字节, 类型=${stream.kind}`);
  }
  const okCount = checks.filter(Boolean).length;
  record('3. 画质与拉流', okCount === qualities.length, `${okCount}/${qualities.length} 个画质可拉流`);
} catch (error) {
  record('3. 画质与拉流', false, error.message);
}

// 4. 直播状态
console.log('\n=== 4. 直播状态 ===');
try {
  const liveStatus = await site.getLiveStatus(detail.roomId);
  console.log(`getLiveStatus(${detail.roomId})=${liveStatus}, detail.status=${detail.status}`);
  record('4. 直播状态', liveStatus === detail.status, `${liveStatus} === ${detail.status}`);
} catch (error) {
  record('4. 直播状态', false, error.message);
}

// 5. 搜索
console.log('\n=== 5. 搜索「英雄联盟」 ===');
try {
  const search = await site.searchRooms('英雄联盟', 1);
  console.log(`hasMore=${search.hasMore}, items=${search.items.length}`);
  for (const item of search.items.slice(0, 5)) {
    console.log(`  ${item.roomId} | ${item.title} | ${item.userName} | online=${item.online}`);
  }
  record('5. 搜索', search.items.length > 0, `${search.items.length} 条`);
} catch (error) {
  record('5. 搜索', false, error.message);
}

// 6. 弹幕 20 秒
console.log(`\n=== 6. 弹幕（连续 ${DANMAKU_SECONDS}s） ===`);
try {
  if (!detail?.danmakuData) {
    throw new Error('danmakuData 缺失');
  }
  if (typeof site.createDanmakuClient !== 'function') {
    throw new Error('站点未实现 createDanmakuClient');
  }
  const client = site.createDanmakuClient();
  const chats = [];
  let online = 0;
  let ready = false;
  let closeReason = '';
  client.onReady = () => {
    ready = true;
  };
  client.onClose = (reason) => {
    closeReason = reason;
  };
  client.onMessage = (message) => {
    if (message.type === 'chat') {
      chats.push(message);
      if (chats.length <= 3) {
        console.log(`  [chat] ${message.userName}: ${message.message}`);
      }
    } else if (message.type === 'online') {
      online = message.online;
    }
  };
  client.start(detail.danmakuData);
  const started = Date.now();
  while (Date.now() - started < DANMAKU_SECONDS * 1000) {
    await sleep(1000);
    process.stdout.write(
      `\r  进度 ${Math.round((Date.now() - started) / 1000)}s：chat=${chats.length} online=${online} ready=${ready}`
    );
  }
  process.stdout.write('\n');
  client.stop();
  console.log(`  共收到 chat=${chats.length} 条，最后一次 online=${online}${closeReason ? `，close=${closeReason}` : ''}`);
  record('6. 弹幕', chats.length >= 1, `chat=${chats.length}, online=${online}`);
} catch (error) {
  record('6. 弹幕', false, error.message);
}

// 汇总
console.log('\n=== 汇总 ===');
const failed = results.filter((item) => !item.ok);
for (const item of results) {
  console.log(`${item.ok ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
}
console.log(failed.length === 0 ? '全部通过 ✅' : `${failed.length} 项失败 ❌`);
process.exit(failed.length === 0 ? 0 : 1);
