import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, RotateCw, Star, X } from 'lucide-react';
import { LiveBadge } from '@/components/Status';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import { liveStatusKey, useLiveStatuses } from '@/hooks/useLiveStatuses';
import { getFavorites, removeFavorite, type FavoriteItem } from '@/lib/favorites';
import { formatRelativeTime } from '@/lib/format';
import { DEFAULT_SITE, getSite } from '@/lib/sites';

/** 收藏：本地收藏的博主列表，按当前是否在直播标注 */
export function FavoritesPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [items, setItems] = useState<FavoriteItem[]>(() => getFavorites());
  const { statuses, checking, refresh } = useLiveStatuses(items);

  const remove = (item: FavoriteItem): void => {
    removeFavorite(item.platform, item.roomId);
    setItems(getFavorites());
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 px-5 pb-1 pt-5">
        <h1 className="min-w-0 flex-1 truncate text-title font-semibold text-ink">
          收藏
          {items.length > 0 && (
            <span className="ml-2 text-label font-normal text-ink-3">
              {items.length} 个博主
            </span>
          )}
        </h1>
        {checking && <Spinner label="正在检查直播状态…" />}
        {items.length > 0 && (
          <Tooltip label="刷新直播状态">
            <Button
              variant="ghost"
              size="icon"
              data-testid="favorites-refresh"
              aria-label="刷新直播状态"
              onClick={refresh}
            >
              <RotateCw className="size-4" strokeWidth={1.75} />
            </Button>
          </Tooltip>
        )}
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {items.length === 0 ? (
          <EmptyState
            icon={Star}
            title="还没有收藏的博主"
            description="在直播间点「收藏」，博主会出现在这里"
          />
        ) : (
          items.map((item) => {
            const site = getSite(item.platform) ?? getSite(DEFAULT_SITE);
            const PlatformIcon = site?.icon ?? Star;
            const status = statuses[liveStatusKey(item.platform, item.roomId)];
            return (
              <div
                key={`${item.platform}-${item.roomId}`}
                data-testid="favorite-item"
                className="group/row flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 ease-out-expo hover:bg-surface"
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/room/${item.platform}/${item.roomId}`)
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-label={`进入 ${item.userName} 的直播间`}
                >
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt=""
                      loading="lazy"
                      className="size-10 shrink-0 rounded-full bg-raised object-cover"
                    />
                  ) : (
                    <span className="size-10 shrink-0 rounded-full bg-raised" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label font-medium text-ink">
                      {item.userName}
                    </span>
                    <span className="mt-0.5 flex min-w-0 items-center gap-2 text-caption text-ink-3">
                      <span
                        data-testid="favorite-platform"
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-raised px-1.5 py-px text-micro font-medium text-ink-2"
                      >
                        <PlatformIcon
                          className="size-3"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        {site?.shortName ?? '未知平台'}
                      </span>
                      <span className="tnum flex shrink-0 items-center gap-1">
                        <Clock
                          className="size-3.5 shrink-0"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                        {formatRelativeTime(item.favoritedAt)}
                      </span>
                    </span>
                  </span>
                </button>

                {/* 状态区固定占位：状态返回时行内文字不重排 */}
                <span
                  data-testid="favorite-live-status"
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

                <Tooltip label="取消收藏">
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="favorite-remove"
                    aria-label="取消收藏"
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
