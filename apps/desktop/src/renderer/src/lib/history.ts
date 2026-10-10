import { DEFAULT_SITE, getSite, type SiteId } from '@/lib/sites';

export interface WatchHistoryItem {
  platform: SiteId;
  roomId: string;
  title: string;
  userName: string;
  cover: string;
  avatar: string;
  watchedAt: number;
}

const STORAGE_KEY = 'live-house:watch-history';
const MAX_ITEMS = 200;

export function getWatchHistory(): WatchHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const list = JSON.parse(raw) as WatchHistoryItem[];
    if (!Array.isArray(list)) {
      return [];
    }
    return list
      .filter((entry) => entry && typeof entry.roomId === 'string' && entry.roomId)
      .map((entry) => ({
        ...entry,
        // 早期记录没有平台字段，按抖音回填
        platform: getSite(entry.platform) ? entry.platform : DEFAULT_SITE
      }));
  } catch {
    return [];
  }
}

export function getWatchHistoryItem(
  platform: SiteId,
  roomId: string
): WatchHistoryItem | undefined {
  return getWatchHistory().find(
    (entry) => entry.platform === platform && entry.roomId === roomId
  );
}

export function addWatchHistory(
  item: Omit<WatchHistoryItem, 'watchedAt'>
): void {
  if (!item.roomId) {
    return;
  }
  const list = getWatchHistory();
  const previous = list.find(
    (entry) => entry.platform === item.platform && entry.roomId === item.roomId
  );
  // 未开播的房间详情可能缺少封面 / 头像 / 标题：保留上一次的有效值，避免历史里封面变黑
  const merged: WatchHistoryItem = {
    ...item,
    title: item.title || previous?.title || '',
    userName: item.userName || previous?.userName || '',
    cover: item.cover || previous?.cover || '',
    avatar: item.avatar || previous?.avatar || '',
    watchedAt: Date.now()
  };
  const rest = list.filter(
    (entry) => !(entry.platform === item.platform && entry.roomId === item.roomId)
  );
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([merged, ...rest].slice(0, MAX_ITEMS))
  );
}

export function removeWatchHistory(platform: SiteId, roomId: string): void {
  const list = getWatchHistory().filter(
    (entry) => !(entry.platform === platform && entry.roomId === roomId)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** 清空历史记录：传平台只清该平台，传 'all' 或不传则全清 */
export function clearWatchHistory(platform?: SiteId | 'all'): void {
  const list =
    platform && platform !== 'all'
      ? getWatchHistory().filter((entry) => entry.platform !== platform)
      : [];
  if (list.length === 0) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
