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

export function addWatchHistory(
  item: Omit<WatchHistoryItem, 'watchedAt'>
): void {
  if (!item.roomId) {
    return;
  }
  const list = getWatchHistory().filter(
    (entry) => !(entry.platform === item.platform && entry.roomId === item.roomId)
  );
  list.unshift({ ...item, watchedAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
}

export function removeWatchHistory(platform: SiteId, roomId: string): void {
  const list = getWatchHistory().filter(
    (entry) => !(entry.platform === platform && entry.roomId === roomId)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** 清空观看记录：传平台只清该平台，传 'all' 或不传则全清 */
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
