import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, SearchX } from 'lucide-react';
import type { LiveRoomItem, SiteId } from '@live-house/core';
import { InlineError } from '@/components/InlineError';
import { RoomCard } from '@/components/RoomCard';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { RoomCardSkeleton } from '@/components/ui/skeleton';
import { errorMessage } from '@/lib/error';
import { DEFAULT_SITE, getSite, isSiteId } from '@/lib/sites';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('kw') ?? '';
  const siteParam = searchParams.get('site');
  const siteId: SiteId = isSiteId(siteParam) ? siteParam : DEFAULT_SITE;
  const site = getSite(siteId);
  const [input, setInput] = useState(keyword);
  const [items, setItems] = useState<LiveRoomItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(
    async (word: string) => {
      if (!word.trim()) {
        setItems([]);
        setError('');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const result = await window.api.site.searchRooms(
          siteId,
          word.trim(),
          1
        );
        setItems(result.items);
      } catch (e) {
        setItems([]);
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    },
    [siteId]
  );

  useEffect(() => {
    void doSearch(keyword);
  }, [keyword, doSearch]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = (): void => {
    const text = input.trim();
    if (text) {
      setSearchParams({ site: siteId, kw: text });
    }
  };

  const goRoom = (roomId: string): void => {
    navigate(`/room/${siteId}/${roomId}`);
  };

  const needsLogin = error.includes('登录');

  return (
    <div className="flex h-full flex-col">
      <h1 className="sr-only">搜索直播间</h1>

      <div className="flex shrink-0 items-center gap-3 px-5 pt-4">
        <div className="relative w-full max-w-[520px]">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                submit();
              }
            }}
            placeholder={`搜索${site?.shortName ?? ''}直播间`}
            aria-label="搜索直播间"
            className="h-9 w-full rounded-sm border border-line bg-surface px-3 pr-20 text-label text-ink transition-colors duration-150 ease-out-expo placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
          <Button
            variant="primary"
            size="sm"
            className="absolute right-1 top-1/2 h-7 -translate-y-1/2"
            onClick={submit}
          >
            搜索
          </Button>
        </div>
        {!loading && keyword && !error && (
          <span className="tnum shrink-0 text-caption text-ink-3">
            {items.length} 个结果
          </span>
        )}
      </div>

      {error && !needsLogin && (
        <InlineError
          message={error}
          onRetry={() => void doSearch(keyword)}
        />
      )}

      <main className="min-h-0 flex-1 overflow-y-auto">
        {loading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-6 px-5 pb-8 pt-4">
            {Array.from({ length: 10 }, (_, index) => (
              <RoomCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!loading && needsLogin && (
          <EmptyState
            icon={KeyRound}
            title="搜索需要登录态"
            description="抖音搜索接口要求登录后才能使用。在设置中填入浏览器里的 Cookie 即可解锁搜索，观看直播与弹幕不受影响。"
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/settings')}
              >
                配置 Cookie
              </Button>
            }
          />
        )}

        {!loading && !error && keyword && items.length === 0 && (
          <EmptyState
            icon={SearchX}
            title={`没有找到与「${keyword}」相关的直播间`}
            description="换个关键词试试，或直接粘贴直播间链接"
          />
        )}

        {!loading && !error && !keyword && (
          <EmptyState
            icon={SearchX}
            title="搜索直播间"
            description="输入主播名、直播标题或关键词开始搜索"
          />
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-6 px-5 pb-8 pt-4">
            {items.map((room) => (
              <RoomCard key={room.roomId} item={room} onClick={goRoom} />
            ))}
          </div>
        )}
      </main>

    </div>
  );
}
