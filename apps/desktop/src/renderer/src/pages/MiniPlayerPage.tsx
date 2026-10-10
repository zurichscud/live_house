import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import type { LivePlayQuality, LiveRoomDetail } from '@live-house/core';
import { DanmakuOverlay } from '@/components/Danmaku/DanmakuOverlay';
import { LivePlayer } from '@/components/Player/LivePlayer';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import { errorMessage } from '@/lib/error';
import { formatOnline } from '@/lib/format';
import { getDanmakuEnabled, saveDanmakuEnabled } from '@/lib/player-prefs';
import { DEFAULT_SITE, isSiteId } from '@/lib/sites';
import { useDanmaku } from '@/hooks/useDanmaku';

/**
 * 小窗模式：独立置顶小窗，只保留画面 + 弹幕飘屏 + 最小控制；
 * 顶部拖拽条是唯一的窗口操作入口（关闭后主窗口恢复播放）。
 */
export function MiniPlayerPage(): React.JSX.Element {
  const { site: siteParam = '', roomId = '' } = useParams();
  const siteId = isSiteId(siteParam) ? siteParam : DEFAULT_SITE;
  const [detail, setDetail] = useState<LiveRoomDetail | null>(null);
  const [qualities, setQualities] = useState<LivePlayQuality[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [danmakuEnabled, setDanmakuEnabled] = useState(getDanmakuEnabled);
  const [refreshKey, setRefreshKey] = useState(0);
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
        text: item.message
      })),
    [danmaku.chatItems]
  );

  const liveOnline = danmaku.online || detail?.online || 0;
  const canPlay = Boolean(detail && qualities.length > 0);

  const toggleDanmaku = (): void => {
    const next = !danmakuEnabled;
    setDanmakuEnabled(next);
    saveDanmakuEnabled(next);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      {/* 拖拽条：小窗唯一的窗口操作入口 */}
      <header className="drag-region flex h-7 shrink-0 items-center gap-2 border-b border-line bg-surface pl-3 pr-1.5">
        <span className="min-w-0 flex-1 truncate text-caption text-ink-3">
          {detail?.title ?? `直播间 ${roomId}`}
        </span>
        {liveOnline > 0 && (
          <span className="tnum no-drag shrink-0 text-caption text-ink-3">
            {formatOnline(liveOnline)} 人气
          </span>
        )}
        <Tooltip label="关闭小窗并返回主窗口">
          <Button
            variant="ghost"
            size="icon"
            className="no-drag size-6 shrink-0"
            data-testid="mini-close"
            aria-label="关闭小窗"
            onClick={() => void window.api.mini.close()}
          >
            <X className="size-3.5" strokeWidth={1.75} />
          </Button>
        </Tooltip>
      </header>

      <div className="min-h-0 flex-1 p-1.5">
        {canPlay && detail ? (
          <LivePlayer
            compact
            className="h-full"
            detail={detail}
            qualities={qualities}
            online={liveOnline}
            danmakuEnabled={danmakuEnabled}
            onToggleDanmaku={toggleDanmaku}
          >
            <DanmakuOverlay items={overlayItems} enabled={danmakuEnabled} />
          </LivePlayer>
        ) : loading ? (
          <div className="flex h-full items-center justify-center rounded-md bg-surface">
            <Spinner label="正在加载直播间…" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-md border border-line bg-surface px-4 text-center">
            <p className="text-label text-ink-2">{error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              重试
            </Button>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border border-line bg-surface">
            <p className="text-label text-ink-3">当前没有可播放的直播流</p>
          </div>
        )}
      </div>
    </div>
  );
}
