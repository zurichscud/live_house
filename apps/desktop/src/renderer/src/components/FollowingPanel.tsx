import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, RadioTower, RotateCw, Users } from 'lucide-react';
import type {
  DouyinFollowingUser,
  DouyinSelfInfo,
  DouyinUserLiveStatus
} from '@live-house/core';
import { InlineError } from '@/components/InlineError';
import { LiveBadge } from '@/components/Status';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/error';
import { formatOnline } from '@/lib/format';

/** 首屏最多拉取页数（每页 20），页间隔遵守接口限流 */
const FIRST_PAGE_LIMIT = 5;
const PAGE_INTERVAL = 1500;

type LoadState = 'loading' | 'ready' | 'error';

/** 抖音关注列表（「我的」→ 抖音 tab 的内容） */
export function FollowingPanel(): React.JSX.Element {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');
  const [account, setAccount] = useState<DouyinSelfInfo | null>(null);
  const [users, setUsers] = useState<DouyinFollowingUser[]>([]);
  const [liveMap, setLiveMap] = useState<
    Record<string, DouyinUserLiveStatus>
  >({});
  const [checking, setChecking] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const minTimeRef = useRef('0');
  const checkedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const off = window.api.following.onLiveStatus((status) => {
      setLiveMap((prev) => ({ ...prev, [status.secUid]: status }));
    });
    return () => {
      off();
      void window.api.following.cancelCheckLives();
    };
  }, []);

  const checkLives = useCallback(async (list: DouyinFollowingUser[]) => {
    const pending = list.filter((user) => !checkedRef.current.has(user.secUid));
    if (pending.length === 0) {
      return;
    }
    for (const user of pending) {
      checkedRef.current.add(user.secUid);
    }
    setChecking(true);
    try {
      await window.api.following.checkLives(pending.map((user) => user.secUid));
    } finally {
      setChecking(false);
    }
  }, []);

  const load = useCallback(async () => {
    setState('loading');
    setError('');
    setUsers([]);
    setLiveMap({});
    setHasMore(false);
    checkedRef.current = new Set();
    try {
      const self = await window.api.following.getSelfInfo();
      setAccount(self);

      let collected: DouyinFollowingUser[] = [];
      let maxTime = '0';
      let more = true;
      for (let page = 0; page < FIRST_PAGE_LIMIT && more; page++) {
        const result = await window.api.following.getList(self.secUid, maxTime);
        collected = [...collected, ...result.items];
        maxTime = result.minTime;
        more = result.hasMore && result.items.length > 0;
        setUsers([...collected]);
        if (more) {
          await new Promise((resolve) => setTimeout(resolve, PAGE_INTERVAL));
        }
      }
      minTimeRef.current = maxTime;
      setHasMore(more);
      setState('ready');
      void checkLives(collected);
    } catch (e) {
      setError(errorMessage(e));
      setState('error');
    }
  }, [checkLives]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = async (): Promise<void> => {
    if (!account || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const result = await window.api.following.getList(
        account.secUid,
        minTimeRef.current
      );
      minTimeRef.current = result.minTime;
      setHasMore(result.hasMore && result.items.length > 0);
      setUsers((prev) => [...prev, ...result.items]);
      void checkLives(result.items);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const liveCount = users.filter(
    (user) => liveMap[user.secUid]?.liveStatus
  ).length;
  const visible = liveOnly
    ? users.filter((user) => liveMap[user.secUid]?.liveStatus)
    : users;

  const openUser = (user: DouyinFollowingUser): void => {
    const status = liveMap[user.secUid];
    if (status?.liveStatus && status.webRid) {
      navigate(`/room/douyin/${status.webRid}`);
      return;
    }
    window.open(`https://www.douyin.com/user/${user.secUid}`, '_blank');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 px-5 pt-4">
        <p className="min-w-0 flex-1 truncate text-label text-ink-2">
          {account ? (
            <>
              <span className="font-medium text-ink">{account.nickname}</span>
              {' · '}
              {account.followingCount} 个关注
            </>
          ) : (
            '抖音关注列表'
          )}
        </p>
        <Tooltip label="刷新">
          <Button
            variant="ghost"
            size="icon"
            aria-label="刷新关注列表"
            onClick={() => void load()}
          >
            <RotateCw className="size-4" strokeWidth={1.75} />
          </Button>
        </Tooltip>
      </div>

      {state === 'ready' && users.length > 0 && (
        <div className="flex shrink-0 items-center gap-3 px-5 pt-3">
          <div className="flex items-center gap-1 rounded-full bg-surface p-1">
            <button
              type="button"
              onClick={() => setLiveOnly(false)}
              className={cn(
                'rounded-full px-3 py-1 text-caption font-medium transition-colors duration-150',
                !liveOnly
                  ? 'bg-ink text-primary-ink'
                  : 'text-ink-3 hover:text-ink-2'
              )}
            >
              全部 {users.length}
            </button>
            <button
              type="button"
              onClick={() => setLiveOnly(true)}
              className={cn(
                'rounded-full px-3 py-1 text-caption font-medium transition-colors duration-150',
                liveOnly
                  ? 'bg-ink text-primary-ink'
                  : 'text-ink-3 hover:text-ink-2'
              )}
            >
              直播中 {liveCount}
            </button>
          </div>
          {checking && (
            <Spinner
              label={`正在检查直播状态…（${Object.keys(liveMap).length}/${users.length}）`}
            />
          )}
        </div>
      )}

      {state === 'error' && (
        <InlineError
          message={error}
          action={
            error.includes('Cookie') || error.includes('登录') ? (
              <button
                type="button"
                className="text-caption text-accent-text underline-offset-2 transition-colors duration-150 hover:text-accent-hover hover:underline"
                onClick={() => navigate('/settings')}
              >
                去设置里配置 Cookie
              </button>
            ) : undefined
          }
          onRetry={() => void load()}
        />
      )}

      <main className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {state === 'loading' && (
          <div className="flex justify-center pt-16">
            <Spinner label="正在获取关注列表…" />
          </div>
        )}

        {state === 'ready' && users.length === 0 && (
          <EmptyState
            icon={Users}
            title="还没有关注任何主播"
            description="在抖音 App 或网页版关注主播后，回到这里刷新即可看到"
          />
        )}

        {state === 'ready' && users.length > 0 && visible.length === 0 && (
          <EmptyState
            icon={RadioTower}
            title="关注的直播间当前都没有开播"
            description="开播后这里会实时显示「直播中」"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setLiveOnly(false)}
              >
                查看全部关注
              </Button>
            }
          />
        )}

        {visible.map((user) => {
          const status = liveMap[user.secUid];
          const isLive = Boolean(status?.liveStatus);
          return (
            <button
              key={user.secUid}
              type="button"
              onClick={() => openUser(user)}
              className="group/row flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors duration-150 ease-out-expo hover:bg-surface"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  loading="lazy"
                  className="size-10 shrink-0 rounded-full bg-raised object-cover"
                />
              ) : (
                <span className="size-10 shrink-0 rounded-full bg-raised" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-label font-medium text-ink">
                  {user.nickname}
                </p>
                <p className="tnum truncate text-caption text-ink-3">
                  {user.uniqueId
                    ? `抖音号 ${user.uniqueId}`
                    : `${formatOnline(user.followerCount)} 粉丝`}
                </p>
              </div>
              {isLive ? (
                <span className="flex shrink-0 items-center gap-2">
                  <LiveBadge />
                  <span className="tnum text-caption text-ink-2">
                    {formatOnline(status.online)} 人在看
                  </span>
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1.5 text-caption text-ink-3">
                  未开播
                  <ExternalLink
                    className="size-3.5 opacity-0 transition-opacity duration-150 group-hover/row:opacity-100"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
              )}
            </button>
          );
        })}

        {state === 'ready' && hasMore && (
          <div className="flex justify-center py-4">
            <Button
              variant="secondary"
              size="sm"
              loading={loadingMore}
              onClick={() => void loadMore()}
            >
              加载更多关注
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
