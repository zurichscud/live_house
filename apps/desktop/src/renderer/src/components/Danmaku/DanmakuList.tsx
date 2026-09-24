import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, MessageSquareDashed, RotateCw } from 'lucide-react';
import type { DanmakuChatItem, DanmakuStatus } from '@/hooks/useDanmaku';
import { formatOnline } from '@/lib/format';
import { ConnectionIndicator } from '@/components/Status';
import { Spinner } from '@/components/ui/spinner';

interface Props {
  items: DanmakuChatItem[];
  status: DanmakuStatus;
  online: number;
}

/** 侧边弹幕列表：自动滚动到底，用户上翻时暂停并出现「回到最新」 */
export function DanmakuList({ items, status, online }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    if (pinned && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [items, pinned]);

  const handleScroll = (): void => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 48);
  };

  const scrollToLatest = (): void => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      setPinned(true);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-label font-medium text-ink">弹幕</h2>
          <ConnectionIndicator status={status} />
        </div>
        <span
          data-testid="danmaku-online"
          className="tnum text-caption text-ink-3"
          title={`${online} 人在看`}
        >
          {formatOnline(online)} 人在看
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-2 py-2"
        >
          {items.length === 0 && status === 'connecting' && (
            <div className="flex justify-center pt-10">
              <Spinner label="正在连接弹幕…" />
            </div>
          )}

          {items.length === 0 && status !== 'connecting' && (
            <div className="flex flex-col items-center gap-2 px-6 pt-12 text-center">
              <MessageSquareDashed
                className="size-7 text-ink-3"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="text-label text-ink-3">
                {status === 'closed'
                  ? '弹幕连接已断开'
                  : '还没有弹幕，稍等片刻'}
              </p>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              data-testid="danmaku-item"
              className="rounded-sm px-2 py-1 text-label leading-[1.55] transition-colors duration-150 hover:bg-raised/70"
            >
              <span className="font-medium text-user">{item.userName}</span>
              <span className="text-ink-3">：</span>
              <span className="break-all text-ink">{item.message}</span>
            </div>
          ))}
        </div>

        {!pinned && items.length > 0 && (
          <button
            type="button"
            onClick={scrollToLatest}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line-strong bg-raised px-3 py-1.5 text-caption text-ink-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-colors duration-150 hover:bg-surface hover:text-ink"
          >
            <ArrowDownToLine className="size-3.5" strokeWidth={2} />
            回到最新
          </button>
        )}
      </div>

      {status === 'closed' && (
        <div className="flex shrink-0 items-center gap-2 border-t border-line px-4 py-2 text-caption text-warning">
          <RotateCw className="size-3 animate-spin-slow" aria-hidden />
          连接已断开，正在自动重连…
        </div>
      )}
    </div>
  );
}
