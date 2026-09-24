import type { SiteId } from '@live-house/core';

/** 格式化在线人数：12345 -> 1.2万 */
export function formatOnline(online: number): string {
  if (!Number.isFinite(online) || online <= 0) {
    return '0';
  }
  if (online >= 100000000) {
    return `${(online / 100000000).toFixed(1)}亿`;
  }
  if (online >= 10000) {
    return `${(online / 10000).toFixed(1)}万`;
  }
  return String(online);
}

/** 各平台直播间链接 → 房间号（可从链接识别平台） */
const SITE_URL_RULES: Array<{ site: SiteId; pattern: RegExp }> = [
  { site: 'douyin', pattern: /live\.douyin\.com\/(\d+)/ },
  { site: 'bilibili', pattern: /live\.bilibili\.com\/(?:blanc\/)?(\d+)/ },
  { site: 'huya', pattern: /(?:www\.)?huya\.com\/(\d+)/ }
];

/** 解析搜索框输入：支持各平台完整链接与纯数字房间号 */
export function parseRoomInput(input: string): {
  site?: SiteId;
  roomId: string;
} {
  const text = input.trim();
  if (!text) {
    return { roomId: '' };
  }
  for (const rule of SITE_URL_RULES) {
    const match = text.match(rule.pattern);
    if (match) {
      return { site: rule.site, roomId: match[1] };
    }
  }
  const numberMatch = text.match(/^\d{5,}$/);
  return numberMatch ? { roomId: numberMatch[0] } : { roomId: '' };
}

/** 相对时间：刚刚 / X 分钟前 / X 小时前 / X 天前 / YYYY-MM-DD */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) {
    return '刚刚';
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`;
  }
  if (diff < 7 * day) {
    return `${Math.floor(diff / day)} 天前`;
  }
  const date = new Date(timestamp);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
