import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleCore } from './lib/bundle-core.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Cookie 文件候选：项目内 .tmp/cookie.txt（已 gitignore）优先，其次兼容旧仓库路径 */
const COOKIE_FILES = [
  resolve(root, '.tmp/cookie.txt'),
  resolve(root, '../tools/douyin_follow_demo/cookie.txt')
];

function loadCookie() {
  if (process.env.DOUYIN_COOKIE) {
    return process.env.DOUYIN_COOKIE.trim();
  }
  for (const file of COOKIE_FILES) {
    try {
      const value = readFileSync(file, 'utf8').trim();
      if (value) {
        return value;
      }
    } catch {
      // 换下一个位置
    }
  }
  return '';
}

const cookie = loadCookie();
if (!cookie) {
  console.log(
    '未找到 Cookie：设置 DOUYIN_COOKIE 环境变量，或把完整 Cookie 写入 .tmp/cookie.txt'
  );
  process.exit(0);
}
console.log(`Cookie 已加载（长度 ${cookie.length}，内容不输出）\n`);

const core = await bundleCore('verify-following');
const site = new core.DouyinSite({ cookie });

console.log('=== 1. 登录态校验（profile/self） ===');
const self = await site.getSelfInfo();
console.log(
  `✅ 登录成功 · 关注 ${self.followingCount} · 粉丝 ${self.followerCount}（昵称不输出）`
);

console.log('\n=== 2. 关注列表（following/list 第一页） ===');
const first = await site.getFollowingList(self.secUid, '0');
console.log(`✅ 返回 ${first.items.length} 个用户，hasMore=${first.hasMore}`);
if (first.items.length === 0) {
  console.log('关注列表为空，跳过直播状态检查');
  process.exit(0);
}

console.log('\n=== 3. 直播状态（profile/other，前 3 个） ===');
for (const user of first.items.slice(0, 3)) {
  const status = await site.getUserLiveStatus(user.secUid);
  console.log(
    status.liveStatus
      ? `✅ 直播中 · webRid=${status.webRid ? '有' : '无'} · 在线 ${status.online}`
      : `✅ 未开播`
  );
  await new Promise((resolve) => setTimeout(resolve, 300));
}

console.log('\n=== 4. 分页参数校验（max_time = 上一页 min_time） ===');
if (first.hasMore && first.minTime && first.minTime !== '0') {
  const second = await site.getFollowingList(self.secUid, first.minTime);
  const overlap = second.items.filter((item) =>
    first.items.some((prev) => prev.secUid === item.secUid)
  ).length;
  console.log(
    `✅ 第二页返回 ${second.items.length} 个用户，与第一页重复 ${overlap} 个（应为 0）`
  );
} else {
  console.log('（只有一页，跳过）');
}

console.log('\n全部通过');
