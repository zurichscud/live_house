import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Download, RotateCw, Star, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { LiveBadge } from '@/components/Status';
import { PlatformTabs, type PlatformTabId } from '@/components/PlatformTabs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import { liveStatusKey, useLiveStatuses } from '@/hooks/useLiveStatuses';
import { errorMessage } from '@/lib/error';
import {
  exportFavorites,
  getFavorites,
  importFavorites,
  removeFavorite,
  type FavoriteItem
} from '@/lib/favorites';
import { formatRelativeTime } from '@/lib/format';
import { DEFAULT_SITE, getSite } from '@/lib/sites';

/** 收藏：本地收藏的博主列表，按平台 tab 分类、按当前是否在直播标注；支持导出 / 导入 JSON 备份 */
export function FavoritesPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [activeSite, setActiveSite] = useState<PlatformTabId>('all');
  const [items, setItems] = useState<FavoriteItem[]>(() => getFavorites());
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
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

  const { statuses, checking, refresh } = useLiveStatuses(items);

  // 切换平台后回到列表顶部
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [activeSite]);

  const remove = (item: FavoriteItem): void => {
    removeFavorite(item.platform, item.roomId);
    setItems(getFavorites());
  };

  const exportToFile = async (): Promise<void> => {
    setBusy('export');
    try {
      const result = await window.api.favorites.exportFile(exportFavorites());
      if (!result.canceled) {
        toast.success(`已导出全部 ${items.length} 个收藏`);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const importFromFile = async (): Promise<void> => {
    setBusy('import');
    try {
      const result = await window.api.favorites.importFile();
      if (result.canceled || result.content === undefined) {
        return;
      }
      const summary = importFavorites(result.content);
      setItems(getFavorites());
      if (summary.added > 0) {
        // 回到「全部」，让导入结果立即可见
        setActiveSite('all');
      }
      const skipped: string[] = [];
      if (summary.duplicated > 0) {
        skipped.push(`${summary.duplicated} 个已存在`);
      }
      if (summary.invalid > 0) {
        skipped.push(`${summary.invalid} 条无效`);
      }
      const suffix = skipped.length > 0 ? `（跳过 ${skipped.join('、')}）` : '';
      if (summary.added > 0) {
        toast.success(`已导入 ${summary.added} 个博主${suffix}`);
      } else if (summary.duplicated > 0) {
        toast.info(`没有新增收藏，导入的博主都已存在${suffix}`);
      } else {
        toast.error(`文件里没有可导入的收藏${suffix}`);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 px-5 pb-1 pt-5">
        <h1 className="min-w-0 flex-1 truncate text-title font-semibold text-ink">
          收藏
          {visibleItems.length > 0 && (
            <span className="ml-2 text-label font-normal text-ink-3">
              {visibleItems.length} 个博主
            </span>
          )}
        </h1>
        {/* 动作区固定高度：切换 tab / 清空后按钮显隐不改变标题行高度 */}
        <div className="flex h-8 shrink-0 items-center gap-3">
          {statusCheckable && visibleItems.length > 0 && (
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
          {items.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                data-testid="favorites-import"
                disabled={busy !== null}
                loading={busy === 'import'}
                onClick={() => void importFromFile()}
              >
                <Upload className="size-3.5" strokeWidth={1.75} />
                导入
              </Button>
              <Button
                variant="ghost"
                size="sm"
                data-testid="favorites-export"
                disabled={busy !== null}
                loading={busy === 'export'}
                onClick={() => void exportToFile()}
              >
                <Download className="size-3.5" strokeWidth={1.75} />
                导出
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 平台 tab：切换后只显示该平台的收藏，「全部」按收藏时间倒序汇总 */}
      <div className="flex shrink-0 items-center gap-3 px-5 pt-3">
        <PlatformTabs
          value={activeSite}
          onChange={setActiveSite}
          testIdPrefix="favorites-tab"
          includeAll
        />
        {checking && statusCheckable && (
          <Spinner label="正在检查直播状态…" />
        )}
      </div>

      <main ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {visibleItems.length === 0 ? (
          activeSite === 'all' ? (
            <EmptyState
              icon={Star}
              title="还没有收藏的博主"
              description="在直播间点「收藏」，博主会出现在这里；也可以导入之前导出的收藏文件"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid="favorites-import-empty"
                  loading={busy === 'import'}
                  onClick={() => void importFromFile()}
                >
                  <Upload className="size-3.5" strokeWidth={1.75} />
                  导入收藏
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Star}
              title={`还没有${site?.shortName ?? ''}的收藏`}
              description="在直播间点「收藏」，博主会出现在这里"
            />
          )
        ) : (
          visibleItems.map((item) => {
            const site = getSite(item.platform) ?? getSite(DEFAULT_SITE);
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
                        <PlatformIcon site={site} fallback={Star} className="size-3" />
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
