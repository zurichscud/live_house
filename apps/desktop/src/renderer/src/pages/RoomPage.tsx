import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Flame,
  Hash,
  PanelRightOpen,
  PictureInPicture2,
  RotateCw,
  Star,
  TriangleAlert,
  UserRound
} from 'lucide-react';
import type {
  LivePlayQuality,
  LiveRoomDetail,
  SiteId
} from '@live-house/core';
import { DanmakuList } from '@/components/Danmaku/DanmakuList';
import { DanmakuOverlay } from '@/components/Danmaku/DanmakuOverlay';
import { LivePlayer } from '@/components/Player/LivePlayer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/error';
import { isFavorited, toggleFavorite } from '@/lib/favorites';
import { formatOnline } from '@/lib/format';
import { addWatchHistory, getWatchHistoryItem } from '@/lib/history';
import { saveLastRoom } from '@/lib/lastRoom';
import {
  getDanmakuCollapsed,
  getDanmakuEnabled,
  saveDanmakuCollapsed,
  saveDanmakuEnabled
} from '@/lib/player-prefs';
import { DEFAULT_SITE, isSiteId } from '@/lib/sites';
import { useDanmaku } from '@/hooks/useDanmaku';

export function RoomPage() {
  const navigate = useNavigate();
  const { site: siteParam = '', roomId = '' } = useParams();
  const siteId: SiteId = isSiteId(siteParam) ? siteParam : DEFAULT_SITE;
  const [detail, setDetail] = useState<LiveRoomDetail | null>(null);
  const [qualities, setQualities] = useState<LivePlayQuality[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [danmakuEnabled, setDanmakuEnabled] = useState(getDanmakuEnabled);
  const [danmakuCollapsed, setDanmakuCollapsed] = useState(getDanmakuCollapsed);
  const [refreshKey, setRefreshKey] = useState(0);
  const [favorited, setFavorited] = useState(false);
  /** 小窗模式：播放交给独立小窗，主窗口停止拉流 */
  const [miniOpen, setMiniOpen] = useState(false);
  const danmaku = useDanmaku();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    void (async () => {
      try {
        const roomDetail = await window.api.site.getRoomDetail(siteId, roomId);
        if (cancelled) {
          return;
        }
        // 未开播的房间详情可能没有封面 / 头像 / 标题：用历史缓存兜底，避免历史与播放器变黑
        const cached = getWatchHistoryItem(siteId, roomDetail.roomId);
        const mergedDetail: LiveRoomDetail = {
          ...roomDetail,
          title: roomDetail.title || cached?.title || '',
          cover: roomDetail.cover || cached?.cover || '',
          userName: roomDetail.userName || cached?.userName || '',
          userAvatar: roomDetail.userAvatar || cached?.avatar || ''
        };
        setDetail(mergedDetail);
        saveLastRoom(siteId, mergedDetail.roomId);
        setFavorited(isFavorited(siteId, roomDetail.roomId));
        addWatchHistory({
          platform: siteId,
          roomId: mergedDetail.roomId,
          title: mergedDetail.title,
          userName: mergedDetail.userName,
          cover: mergedDetail.cover,
          avatar: mergedDetail.userAvatar
        });
        const roomQualities = await window.api.site.getPlayQualites(
          siteId,
          mergedDetail
        );
        if (cancelled) {
          return;
        }
        setQualities(roomQualities);
      } catch (e) {
        if (!cancelled) {
          setError(errorMessage(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, roomId, refreshKey]);

  // 小窗状态：同一房间的小窗已在播放时，主窗口不重复拉流；不同房间的小窗则关闭
  useEffect(() => {
    let cancelled = false;
    void window.api.mini.getState().then((state) => {
      if (cancelled) {
        return;
      }
      if (!state) {
        setMiniOpen(false);
        return;
      }
      if (state.site === siteId && state.roomId === roomId) {
        setMiniOpen(true);
      } else {
        void window.api.mini.close();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [siteId, roomId]);

  // 小窗关闭（返回主窗口）后恢复主窗口播放
  useEffect(() => window.api.mini.onClosed(() => setMiniOpen(false)), []);

  // 弹幕连接是主进程单例：小窗打开期间由小窗接管，回到主窗口后重连
  useEffect(() => {
    if (miniOpen || !detail?.danmakuData) {
      return;
    }
    danmaku.start(siteId, detail.danmakuData);
    return () => danmaku.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miniOpen, siteId, detail]);

  const overlayItems = useMemo(
    () =>
      danmaku.chatItems.map((item) => ({
        id: item.id,
        text: item.message
      })),
    [danmaku.chatItems]
  );

  const liveOnline = danmaku.online || detail?.online || 0;
  const canPlay = Boolean(detail && qualities.length > 0);

  const goBack = (): void => {
    const index = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (index > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleToggleDanmaku = (): void => {
    const next = !danmakuEnabled;
    setDanmakuEnabled(next);
    saveDanmakuEnabled(next);
  };

  const handleToggleDanmakuPanel = (): void => {
    const next = !danmakuCollapsed;
    setDanmakuCollapsed(next);
    saveDanmakuCollapsed(next);
  };

  const handleToggleFavorite = (): void => {
    if (!detail) {
      return;
    }
    setFavorited(
      toggleFavorite({
        platform: siteId,
        roomId: detail.roomId,
        userName: detail.userName,
        avatar: detail.userAvatar
      })
    );
  };

  /** 打开小窗：主窗口随即停止拉流，避免双流 */
  const handleOpenMini = (): void => {
    if (!detail) {
      return;
    }
    void window.api.mini
      .open(siteId, detail.roomId)
      .then(() => setMiniOpen(true))
      .catch((e) => toast.error(errorMessage(e)));
  };

  const handleCloseMini = (): void => {
    void window.api.mini.close();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-3 pt-12">
          {/* 返回 + 直播信息（播放器上方，紧贴播放器） */}
          <div className="flex shrink-0 items-center gap-3 px-0.5">
            <Tooltip label="返回">
              <button
                type="button"
                data-testid="room-back"
                onClick={goBack}
                aria-label="返回"
                className="-ml-1.5 flex size-8 shrink-0 items-center justify-center rounded-sm text-ink-2 transition-colors duration-150 ease-out-expo hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                <ChevronLeft className="size-5" strokeWidth={1.75} />
              </button>
            </Tooltip>
            {detail ? (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {detail.userAvatar ? (
                  <img
                    src={detail.userAvatar}
                    alt=""
                    className="size-10 shrink-0 rounded-full bg-raised object-cover"
                  />
                ) : (
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                )}
                <div className="min-w-0 flex-1">
                  {/* 房间标题紧贴头像右侧 */}
                  <h1
                    data-testid="room-title"
                    className="truncate text-title font-semibold text-ink"
                  >
                    {detail.title}
                  </h1>
                  {/* 主播名 / 人气 / 房间号同一行，图标标识各字段，不用点分隔 */}
                  <div
                    data-testid="room-meta"
                    className="mt-0.5 flex min-w-0 items-center gap-3 text-caption text-ink-3"
                  >
                    <span className="flex min-w-0 items-center gap-1">
                      <UserRound
                        className="size-3.5 shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className="truncate">{detail.userName}</span>
                    </span>
                    <span
                      className="tnum flex shrink-0 items-center gap-1"
                      title={`${formatOnline(liveOnline)} 人气`}
                    >
                      <Flame
                        className="size-3.5 shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      {formatOnline(liveOnline)}
                    </span>
                    <span className="tnum flex shrink-0 items-center gap-1">
                      <Hash
                        className="size-3.5 shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      {detail.roomId}
                    </span>
                  </div>
                </div>
                <Tooltip label={favorited ? '取消收藏' : '收藏该博主'}>
                  <Button
                    variant={favorited ? 'secondary' : 'ghost'}
                    size="sm"
                    data-testid="room-favorite"
                    aria-pressed={favorited}
                    onClick={handleToggleFavorite}
                    className="shrink-0"
                  >
                    <Star
                      className={cn('size-3.5', favorited && 'fill-current')}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    {favorited ? '已收藏' : '收藏'}
                  </Button>
                </Tooltip>
              </div>
            ) : loading ? (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ) : (
              <h1
                data-testid="room-title"
                className="min-w-0 flex-1 truncate text-title font-semibold text-ink"
              >
                直播间 {roomId}
              </h1>
            )}
          </div>

          {/* 播放器 + 操作栏 */}
          {canPlay && detail ? (
            miniOpen ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-md border border-line bg-surface px-6 text-center">
                <PictureInPicture2
                  className="size-6 text-ink-3"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <div>
                  <p className="text-label text-ink-2">正在小窗播放</p>
                  <p className="mt-1 text-caption text-ink-3">
                    主窗口已停止拉流，关闭小窗即可回到这里
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid="room-mini-return"
                  onClick={handleCloseMini}
                >
                  返回主窗口播放
                </Button>
              </div>
            ) : (
              <LivePlayer
                className="min-h-0 flex-1"
                detail={detail}
                qualities={qualities}
                online={liveOnline}
                danmakuEnabled={danmakuEnabled}
                onToggleDanmaku={handleToggleDanmaku}
                danmakuPanelCollapsed={danmakuCollapsed}
                onToggleDanmakuPanel={handleToggleDanmakuPanel}
                onRefresh={() => setRefreshKey((key) => key + 1)}
                onOpenExternal={() => window.open(detail.url, '_blank')}
                onOpenMini={handleOpenMini}
              >
                <DanmakuOverlay items={overlayItems} enabled={danmakuEnabled} />
              </LivePlayer>
            )
          ) : loading ? (
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-surface">
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner label="正在加载直播间…" />
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-md border border-line bg-surface px-6 text-center">
              <TriangleAlert
                className="size-6 text-warning"
                strokeWidth={1.75}
                aria-hidden
              />
              <p className="max-w-[46ch] text-label text-ink-2">{error}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setRefreshKey((key) => key + 1)}
              >
                <RotateCw className="size-3.5" strokeWidth={2} />
                重试
              </Button>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-line bg-surface">
              <p className="text-label text-ink-3">当前没有可播放的直播流</p>
            </div>
          )}
        </div>

        <aside
          className={cn(
            'mb-3 flex shrink-0 flex-col border-l border-line',
            danmakuCollapsed ? 'w-11' : 'w-[320px] xl:w-[340px]'
          )}
        >
          {danmakuCollapsed ? (
            <Tooltip label="展开弹幕" side="left">
              <button
                type="button"
                data-testid="danmaku-expand"
                onClick={handleToggleDanmakuPanel}
                aria-label="展开弹幕"
                className="flex h-full w-full flex-col items-center gap-3 py-4 text-ink-3 transition-colors duration-150 ease-out-expo hover:bg-raised/40 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                <PanelRightOpen className="size-4 shrink-0" strokeWidth={1.75} />
                <span className="text-caption [writing-mode:vertical-rl]">
                  弹幕
                </span>
                <span className="tnum text-caption [writing-mode:vertical-rl]">
                  {formatOnline(liveOnline)} 人在看
                </span>
              </button>
            </Tooltip>
          ) : (
            <DanmakuList
              items={danmaku.chatItems}
              status={danmaku.status}
              online={liveOnline}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
