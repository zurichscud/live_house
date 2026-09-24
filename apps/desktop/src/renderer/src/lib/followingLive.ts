import type { DouyinFollowingUser, DouyinSelfInfo } from '@live-house/core';

/** 首页看板的「关注直播」概览 */
export interface FollowingLiveSummary {
  account: DouyinSelfInfo;
  /** 已统计的关注数（受分页上限限制，可能少于总关注数） */
  checked: number;
  /** 直播中人数 */
  live: number;
  /** 是否已覆盖全部关注 */
  complete: boolean;
}

/** 与关注页一致的抓取上限与限流间隔 */
const FIRST_PAGE_LIMIT = 5;
const PAGE_INTERVAL = 1500;
const CACHE_TTL = 3 * 60 * 1000;

let cached: { at: number; summary: FollowingLiveSummary } | null = null;
let inflight: Promise<FollowingLiveSummary> | null = null;

export function getCachedFollowingLive(): FollowingLiveSummary | null {
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return cached.summary;
  }
  return null;
}

/**
 * 拉取关注列表并统计其中正在直播的人数（直播状态由列表接口直接带回）。
 * 结果缓存 3 分钟；未覆盖全部关注时不写缓存。
 */
export async function loadFollowingLiveSummary(
  onProgress: (live: number, checked: number) => void
): Promise<FollowingLiveSummary> {
  const hit = getCachedFollowingLive();
  if (hit) {
    return hit;
  }
  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    const account = await window.api.following.getSelfInfo();

    const users: DouyinFollowingUser[] = [];
    let maxTime = '0';
    let more = true;
    for (let page = 0; page < FIRST_PAGE_LIMIT && more; page++) {
      const result = await window.api.following.getList(
        account.secUid,
        maxTime
      );
      users.push(...result.items);
      maxTime = result.minTime;
      more = result.hasMore && result.items.length > 0;
      onProgress(users.filter((user) => user.liveStatus).length, users.length);
      if (more) {
        await new Promise((resolve) => setTimeout(resolve, PAGE_INTERVAL));
      }
    }

    const summary: FollowingLiveSummary = {
      account,
      checked: users.length,
      live: users.filter((user) => user.liveStatus).length,
      // 关注列表被截断时不写缓存
      complete: !more
    };
    if (summary.complete) {
      cached = { at: Date.now(), summary };
    }
    return summary;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
