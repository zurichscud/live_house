import type {
  DouyinFollowingUser,
  DouyinSelfInfo,
  DouyinUserLiveStatus
} from '@live-house/core';

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

const countLive = (statuses: Map<string, DouyinUserLiveStatus>): number => {
  let live = 0;
  for (const status of statuses.values()) {
    if (status.liveStatus) {
      live += 1;
    }
  }
  return live;
};

/**
 * 拉取关注列表并逐个统计直播状态（并发 3 + 250ms，见 main/following.ts）。
 * 结果缓存 3 分钟；未覆盖全部关注或被取消时不写缓存。
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
      if (more) {
        await new Promise((resolve) => setTimeout(resolve, PAGE_INTERVAL));
      }
    }

    const statuses = new Map<string, DouyinUserLiveStatus>();
    const off = window.api.following.onLiveStatus((status) => {
      if (statuses.has(status.secUid)) {
        return;
      }
      statuses.set(status.secUid, status);
      onProgress(countLive(statuses), statuses.size);
    });
    try {
      await window.api.following.checkLives(users.map((user) => user.secUid));
      // 等状态事件收尾，避免结算时漏掉最后几条
      await new Promise((resolve) => setTimeout(resolve, 100));
    } finally {
      off();
    }

    const summary: FollowingLiveSummary = {
      account,
      checked: users.length,
      live: countLive(statuses),
      // 关注列表被截断，或状态事件有缺失（被关注页取消）时不写缓存
      complete: !more && statuses.size >= users.length
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
