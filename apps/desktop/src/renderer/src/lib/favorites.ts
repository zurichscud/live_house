import type { SiteId } from '@/lib/sites';

export interface FavoriteItem {
  platform: SiteId;
  /** 直播间号（webRid），用于进入房间与查询直播状态 */
  roomId: string;
  userName: string;
  avatar: string;
  favoritedAt: number;
}

const STORAGE_KEY = 'live-house:favorites';
const MAX_ITEMS = 500;

export function getFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const list = JSON.parse(raw) as FavoriteItem[];
    if (!Array.isArray(list)) {
      return [];
    }
    return list.filter(
      (entry) => entry && typeof entry.roomId === 'string' && entry.roomId
    );
  } catch {
    return [];
  }
}

const isSame = (
  entry: FavoriteItem,
  platform: SiteId,
  roomId: string
): boolean => entry.platform === platform && entry.roomId === roomId;

export function isFavorited(platform: SiteId, roomId: string): boolean {
  return getFavorites().some((entry) => isSame(entry, platform, roomId));
}

export function addFavorite(item: Omit<FavoriteItem, 'favoritedAt'>): void {
  if (!item.roomId) {
    return;
  }
  const list = getFavorites().filter(
    (entry) => !isSame(entry, item.platform, item.roomId)
  );
  list.unshift({ ...item, favoritedAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
}

export function removeFavorite(platform: SiteId, roomId: string): void {
  const list = getFavorites().filter(
    (entry) => !isSame(entry, platform, roomId)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** 切换收藏状态，返回切换后的状态 */
export function toggleFavorite(
  item: Omit<FavoriteItem, 'favoritedAt'>
): boolean {
  if (isFavorited(item.platform, item.roomId)) {
    removeFavorite(item.platform, item.roomId);
    return false;
  }
  addFavorite(item);
  return true;
}
