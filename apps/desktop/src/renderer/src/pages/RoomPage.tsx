import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, RotateCw, Star, TriangleAlert } from 'lucide-react';
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
import { addWatchHistory } from '@/lib/history';
import { getDanmakuEnabled, saveDanmakuEnabled } from '@/lib/player-prefs';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [favorited, setFavorited] = useState(false);
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
        setDetail(roomDetail);
        setFavorited(isFavorited(siteId, roomDetail.roomId));
        addWatchHistory({
          platform: siteId,
          roomId: roomDetail.roomId,
          title: roomDetail.title,
          userName: roomDetail.userName,
          cover: roomDetail.cover,
          avatar: roomDetail.userAvatar
        });
        const roomQualities = await window.api.site.getPlayQualites(
          siteId,
          roomDetail
        );
        if (cancelled) {
          return;
        }
        setQualities(roomQualities);
        if (roomDetail.danmakuData) {
          danmaku.start(siteId, roomDetail.danmakuData);
        }
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
      danmaku.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, roomId, refreshKey]);

  const overlayItems = useMemo(
    () =>
      danmaku.chatItems.map((item) => ({
        id: item.id,
        text: `${item.userName}: ${item.message}`
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 p-3">
          {/* 房间标题 + 返回（播放器上方） */}
          <div className="flex shrink-0 items-center gap-2">
            <Tooltip label="返回">
              <button
                type="button"
                data-testid="room-back"
                onClick={goBack}
                aria-label="返回"
                className="flex size-8 shrink-0 items-center justify-center rounded-sm text-ink-2 transition-colors duration-150 ease-out-expo hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                <ChevronLeft className="size-5" strokeWidth={1.75} />
              </button>
            </Tooltip>
            <h1
              data-testid="room-title"
              className="min-w-0 flex-1 truncate pr-0.5 text-title font-semibold text-ink"
            >
              {detail ? detail.title : `直播间 ${roomId}`}
            </h1>
          </div>

          {/* 直播信息（播放器上方） */}
          {detail ? (
            <div className="flex shrink-0 items-center gap-3 px-0.5">
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
                <p className="truncate text-label font-medium text-ink">
                  {detail.userName}
                </p>
                <p className="tnum mt-0.5 truncate text-caption text-ink-3">
                  {formatOnline(liveOnline)} 人气 · 房间号 {detail.roomId}
                </p>
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
          ) : (
            loading && (
              <div className="flex shrink-0 items-center gap-3 px-0.5">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            )
          )}

          {/* 播放器 + 操作栏 */}
          {canPlay && detail ? (
            <LivePlayer
              className="min-h-0 flex-1"
              detail={detail}
              qualities={qualities}
              online={liveOnline}
              danmakuEnabled={danmakuEnabled}
              onToggleDanmaku={handleToggleDanmaku}
              onRefresh={() => setRefreshKey((key) => key + 1)}
              onOpenExternal={() => window.open(detail.url, '_blank')}
            >
              <DanmakuOverlay items={overlayItems} enabled={danmakuEnabled} />
            </LivePlayer>
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

        <aside className="flex w-[320px] shrink-0 flex-col border-l border-line xl:w-[340px]">
          <DanmakuList
            items={danmaku.chatItems}
            status={danmaku.status}
            online={liveOnline}
          />
        </aside>
      </div>
    </div>
  );
}
