import { useEffect, useRef, useState } from 'react';
import type { SiteId } from '@/lib/sites';

export type LiveStatus = { live: boolean } | { failed: true };

/** 直播状态检查：并发 3、间隔 250ms，避免触发接口限流 */
const CHECK_CONCURRENCY = 3;
const CHECK_INTERVAL = 250;

export const liveStatusKey = (platform: SiteId, roomId: string): string =>
  `${platform}:${roomId}`;

interface RoomRef {
  platform: SiteId;
  roomId: string;
}

/**
 * 逐条查询房间当前是否仍在直播，返回按 `liveStatusKey` 索引的状态。
 * 仅对已实现状态接口的平台生效（当前为抖音）；进入页面或调用 refresh() 时重新查询。
 */
export function useLiveStatuses(rooms: RoomRef[]): {
  statuses: Record<string, LiveStatus>;
  checking: boolean;
  refresh: () => void;
} {
  const [statuses, setStatuses] = useState<Record<string, LiveStatus>>({});
  const [checking, setChecking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;

  useEffect(() => {
    const queue = [...roomsRef.current];
    if (queue.length === 0) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    setStatuses({});

    const runOne = async (room: RoomRef): Promise<void> => {
      const key = liveStatusKey(room.platform, room.roomId);
      try {
        const live = await window.api.site.getLiveStatus(
          room.platform,
          room.roomId
        );
        if (!cancelled) {
          setStatuses((prev) => ({ ...prev, [key]: { live } }));
        }
      } catch {
        if (!cancelled) {
          setStatuses((prev) => ({ ...prev, [key]: { failed: true } }));
        }
      }
    };

    const worker = async (): Promise<void> => {
      for (;;) {
        const room = queue.shift();
        if (!room || cancelled) {
          return;
        }
        await runOne(room);
        if (cancelled) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL));
      }
    };

    void Promise.all(
      Array.from({ length: CHECK_CONCURRENCY }, () => worker())
    ).then(() => {
      if (!cancelled) {
        setChecking(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return {
    statuses,
    checking,
    refresh: () => setRefreshKey((key) => key + 1)
  };
}
