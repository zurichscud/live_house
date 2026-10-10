import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  History,
  Play,
  RotateCw,
  Trash2,
  UserRound,
  X
} from 'lucide-react';
import { PlatformTabs, type PlatformTabId } from '@/components/PlatformTabs';
import { PlatformIcon } from '@/components/PlatformIcon';
import { LiveBadge } from '@/components/Status';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import { liveStatusKey, useLiveStatuses } from '@/hooks/useLiveStatuses';
import {
  clearWatchHistory,
  getWatchHistory,
  removeWatchHistory,
  type WatchHistoryItem
} from '@/lib/history';
import { formatRelativeTime } from '@/lib/format';
import { DEFAULT_SITE, getSite } from '@/lib/sites';

export function HistoryPage() {
  const navigate = useNavigate();
  const [activeSite, setActiveSite] = useState<PlatformTabId>('all');
  const [items, setItems] = useState<WatchHistoryItem[]>(() =>
    getWatchHistory()
  );
  const listRef = useRef<HTMLElement>(null);

  const site = activeSite === 'all' ? undefined : getSite(activeSite);
  const visibleItems = useMemo(
    () =>
      activeSite === 'all'
        ? items
        : items.filter((item) => item.platform === activeSite),
    [items, activeSite]
  );
  /** 直播状态只有抖音可查：全部 / 抖音 tab 下才展示检查入口 */
  const statusCheckable = activeSite === 'all' || activeSite === 'douyin';

  const { statuses: liveMap, checking, refresh } = useLiveStatuses(items);

  // 切换平台后回到列表顶部
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [activeSite]);

  const remove = (item: WatchHistoryItem): void => {
    removeWatchHistory(item.platform, item.roomId);
    setItems(getWatchHistory());
  };

  const clearAll = (): void => {
    clearWatchHistory(activeSite);
    setItems(getWatchHistory());
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 px-5 pb-1 pt-5">
        <h1 className="min-w-0 flex-1 truncate text-title font-semibold text-ink">
          历史
          {visibleItems.length > 0 && (
            <span className="ml-2 text-label font-normal text-ink-3">
              {visibleItems.length} 条
            </span>
          )}
        </h1>
        {/* 动作区固定高度：切换 tab 时按钮显隐不改变标题行高度 */}
        <div className="flex h-8 shrink-0 items-center gap-3">
          {statusCheckable && visibleItems.length > 0 && (
            <Tooltip label="刷新直播状态">
              <Button
                variant="ghost"
                size="icon"
                data-testid="history-refresh"
                aria-label="刷新直播状态"
                onClick={refresh}
              >
                <RotateCw className="size-4" strokeWidth={1.75} />
              </Button>
            </Tooltip>
          )}
          {visibleItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              data-testid="history-clear"
              onClick={clearAll}
            >
              <Trash2 className="size-3.5" strokeWidth={1.75} />
              清空记录
            </Button>
          )}
        </div>
      </div>

      {/* 平台 tab：切换后只显示该平台的历史记录，「全部」按时间倒序汇总 */}
      <div className="flex shrink-0 items-center gap-3 px-5 pt-3">
        <PlatformTabs
          value={activeSite}
          onChange={setActiveSite}
          testIdPrefix="history-tab"
          includeAll
        />
        {checking && statusCheckable && (
          <Spinner label="正在检查直播状态…" />
        )}
      </div>

      <main
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
      >
        {visibleItems.length === 0 ? (
          site && !site.available ? (
            <EmptyState
              icon={History}
              iconSrc={site.icon}
              title={`${site.name}还在开发中`}
              description={`开发完成后，${site.shortName}的历史记录会显示在这里`}
            />
          ) : (
            <EmptyState
              icon={History}
              title={
                activeSite === 'all'
                  ? '还没有历史记录'
                  : `还没有${site?.shortName ?? ''}的历史记录`
              }
              description="进入过的直播间会出现在这里，方便下次快速回到"
            />
          )
        ) : (
          visibleItems.map((item) => {
            const site = getSite(item.platform) ?? getSite(DEFAULT_SITE);
            const status = liveMap[liveStatusKey(item.platform, item.roomId)];
            return (
              <div
                key={`${item.platform}-${item.roomId}`}
                data-testid="history-item"
                className="group/row flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 ease-out-expo hover:bg-surface"
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/room/${item.platform}/${item.roomId}`)
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-label={`进入 ${item.title}`}
                >
                  <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-sm bg-raised">
                    {item.cover ? (
                      <img
                        src={item.cover}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      // 早期记录 / 未被直播接口返回过封面的条目：用平台图标占位，不留黑块
                      <span
                        className="flex size-full items-center justify-center"
                        aria-hidden
                      >
                        <PlatformIcon
                          site={site}
                          fallback={History}
                          className="size-5 opacity-50"
                        />
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover/row:bg-black/35">
                      <Play className="size-4 scale-90 fill-white text-white opacity-0 transition-all duration-200 ease-out-expo group-hover/row:scale-100 group-hover/row:opacity-100" />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-label font-medium leading-[1.45] text-ink">
                      {item.title}
                    </span>
                    <span className="mt-1 flex min-w-0 items-center gap-2 text-caption text-ink-3">
                      <span
                        data-testid="history-platform"
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-raised px-1.5 py-px text-micro font-medium text-ink-2"
                      >
                        <PlatformIcon site={site} fallback={History} className="size-3" />
                        {site?.shortName ?? '未知平台'}
                      </span>
                      <span className="flex min-w-0 items-center gap-1">
                        <UserRound
                          className="size-3.5 shrink-0"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        <span className="truncate">{item.userName}</span>
                      </span>
                      <span className="tnum flex shrink-0 items-center gap-1">
                        <Clock
                          className="size-3.5 shrink-0"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        {formatRelativeTime(item.watchedAt)}
                      </span>
                    </span>
                  </span>
                </button>

                {/* 状态区固定占位：状态返回时行内文字不重排 */}
                <span
                  data-testid="history-live-status"
                  className="flex w-16 shrink-0 items-center justify-end"
                >
                  {status && 'live' in status ? (
                    status.live ? (
                      <LiveBadge />
                    ) : (
                      <span className="text-caption text-ink-3">未开播</span>
                    )
                  ) : null}
                </span>

                <Tooltip label="从记录中移除">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="从记录中移除"
                    className="shrink-0 opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 focus-visible:opacity-100"
                    onClick={() => remove(item)}
                  >
                    <X className="size-4" strokeWidth={1.75} />
                  </Button>
                </Tooltip>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
