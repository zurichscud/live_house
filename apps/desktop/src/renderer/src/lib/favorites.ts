import { isSiteId, type SiteId } from '@/lib/sites';

export interface FavoriteItem {
  platform: SiteId;
  /** 直播间号（webRid），用于进入房间与查询直播状态 */
  roomId: string;
  userName: string;
  avatar: string;
  favoritedAt: number;
}

/** 导出文件标识：导入时据此判断是不是本应用导出的收藏文件 */
export const FAVORITES_FILE_TYPE = 'live-house-favorites';
const FILE_VERSION = 1;

export interface FavoritesFile {
  type: typeof FAVORITES_FILE_TYPE;
  version: number;
  exportedAt: number;
  items: FavoriteItem[];
}

export interface ImportSummary {
  /** 新加入的条数 */
  added: number;
  /** 已存在（平台 + 房间号相同）而跳过的条数 */
  duplicated: number;
  /** 缺少必要字段而忽略的条数 */
  invalid: number;
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

/** 生成导出文件内容（JSON 文本，带类型 / 版本标记） */
export function exportFavorites(): string {
  const payload: FavoritesFile = {
    type: FAVORITES_FILE_TYPE,
    version: FILE_VERSION,
    exportedAt: Date.now(),
    items: getFavorites()
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

/** 校验并规整导入的单条数据；不合法返回 null */
function parseFavorite(value: unknown): FavoriteItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const entry = value as Record<string, unknown>;
  if (!isSiteId(entry.platform)) {
    return null;
  }
  if (typeof entry.roomId !== 'string' || !entry.roomId.trim()) {
    return null;
  }
  return {
    platform: entry.platform,
    roomId: entry.roomId.trim(),
    userName:
      typeof entry.userName === 'string' && entry.userName
        ? entry.userName
        : '未知主播',
    avatar: typeof entry.avatar === 'string' ? entry.avatar : '',
    favoritedAt:
      typeof entry.favoritedAt === 'number' && Number.isFinite(entry.favoritedAt)
        ? entry.favoritedAt
        : Date.now()
  };
}

/** 从导入文件内容里取出条目数组（兼容裸数组）；结构不对直接抛错 */
function parseFavoritesFile(text: string): unknown[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('文件不是有效的 JSON，无法导入');
  }
  const candidate = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
      ? (data as { items?: unknown }).items
      : undefined;
  if (!Array.isArray(candidate)) {
    throw new Error('文件格式不正确，缺少收藏列表');
  }
  return candidate;
}

/**
 * 导入收藏：与现有收藏按「平台 + 房间号」去重合并，已存在的条目保持不变。
 * JSON 结构错误抛异常；单条数据不合法只计数跳过。
 */
export function importFavorites(text: string): ImportSummary {
  const raw = parseFavoritesFile(text);
  const existing = getFavorites();
  const keys = new Set(
    existing.map((entry) => `${entry.platform}:${entry.roomId}`)
  );
  const merged = [...existing];
  let duplicated = 0;
  let invalid = 0;

  for (const value of raw) {
    const item = parseFavorite(value);
    if (!item) {
      invalid += 1;
      continue;
    }
    const key = `${item.platform}:${item.roomId}`;
    if (keys.has(key)) {
      duplicated += 1;
      continue;
    }
    keys.add(key);
    merged.push(item);
  }

  const added = merged.length - existing.length;
  if (added > 0) {
    merged.sort((a, b) => b.favoritedAt - a.favoritedAt);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(merged.slice(0, MAX_ITEMS))
    );
  }
  return { added, duplicated, invalid };
}
