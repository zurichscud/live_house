import type { DouyinUserLiveStatus } from '@live-house/core';
import { douyinSite } from './site.js';

let checkToken = 0;

export function cancelFollowLives(): void {
  checkToken++;
}

/**
 * 逐个查询关注用户的直播状态。
 * 查询频率沿用接口调研时实测的安全值：并发 3 + 每次 250ms 间隔。
 */
export async function checkFollowLives(
  secUids: string[],
  onResult: (status: DouyinUserLiveStatus) => void
): Promise<void> {
  const token = ++checkToken;
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (token === checkToken) {
      const index = cursor++;
      if (index >= secUids.length) {
        return;
      }
      let status: DouyinUserLiveStatus;
      try {
        status = await douyinSite().getUserLiveStatus(secUids[index]);
      } catch (error) {
        console.warn('[live-house] 直播状态查询失败', secUids[index], error);
        status = {
          secUid: secUids[index],
          liveStatus: false,
          webRid: '',
          roomId: '',
          online: 0
        };
      }
      if (token !== checkToken) {
        return;
      }
      onResult(status);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(3, secUids.length) }, () => worker())
  );
}
