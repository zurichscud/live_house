import { Gamepad2, Music2, Tv } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SiteId } from '@live-house/core';

export type { SiteId };

export interface SiteInfo {
  id: SiteId;
  /** 完整名称 */
  name: string;
  /** 短名称（tab / 下拉 / 列表徽章等窄空间） */
  shortName: string;
  icon: LucideIcon;
  /** 已接入：可搜索、可进房播放 */
  available: boolean;
  /** 支持账号「关注列表」（我的页） */
  following: boolean;
}

export const SITES: SiteInfo[] = [
  {
    id: 'douyin',
    name: '抖音直播',
    shortName: '抖音',
    icon: Music2,
    available: true,
    following: true
  },
  {
    id: 'bilibili',
    name: '哔哩哔哩',
    shortName: 'B站',
    icon: Tv,
    available: true,
    following: false
  },
  {
    id: 'huya',
    name: '虎牙直播',
    shortName: '虎牙',
    icon: Gamepad2,
    available: true,
    following: false
  }
];

export const DEFAULT_SITE: SiteId = 'douyin';

export function getSite(id: string | undefined): SiteInfo | undefined {
  return SITES.find((site) => site.id === id);
}

export function isSiteId(value: unknown): value is SiteId {
  return typeof value === 'string' && SITES.some((site) => site.id === value);
}
