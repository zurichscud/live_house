import { isSiteId, type SiteId } from '@/lib/sites';

const STORAGE_KEY = 'live-house:last-room';

export interface LastRoom {
  site: SiteId;
  roomId: string;
}

/** 记录最近进入的直播间：侧栏应用图标据此返回「刚才的直播界面」 */
export function saveLastRoom(site: SiteId, roomId: string): void {
  if (!roomId) {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ site, roomId }));
  } catch {
    // 忽略写入失败
  }
}

export function getLastRoom(): LastRoom | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw) as { site?: unknown; roomId?: unknown };
    if (!isSiteId(data.site) || typeof data.roomId !== 'string' || !data.roomId) {
      return null;
    }
    return { site: data.site, roomId: data.roomId };
  } catch {
    return null;
  }
}
