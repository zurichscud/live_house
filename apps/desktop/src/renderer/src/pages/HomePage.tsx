import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Search, Users } from 'lucide-react';
import logo from '@/assets/logo.png';
import { Dropdown } from '@/components/ui/dropdown';
import { PlatformIcon } from '@/components/PlatformIcon';
import { errorMessage } from '@/lib/error';
import { parseRoomInput } from '@/lib/format';
import {
  getCachedFollowingLive,
  loadFollowingLiveSummary,
  type FollowingLiveSummary
} from '@/lib/followingLive';
import { isMac } from '@/lib/platform';
import { DEFAULT_SITE, getSite, SITES, type SiteId, type SiteInfo } from '@/lib/sites';

/** 搜索框内的平台选项（未开发平台不可选） */
function SiteMenuItem({ site }: { site: SiteInfo }): React.JSX.Element {
  return (
    <span className="flex items-center gap-2">
      <PlatformIcon site={site} className="size-3.5" />
      {site.name}
      {!site.available && (
        <span className="rounded-full border border-line px-1.5 text-micro leading-4 text-ink-3">
          即将上线
        </span>
      )}
    </span>
  );
}

type LiveCardState =
  | { status: 'loading'; live: number }
  | { status: 'ready'; summary: FollowingLiveSummary }
  | { status: 'needLogin' }
  | { status: 'error' };

/** 关注直播概览：统计关注中当前有多少人在直播 */
function FollowingLiveCard(): React.JSX.Element {
  const navigate = useNavigate();
  const [state, setState] = useState<LiveCardState>(() => {
    const cached = getCachedFollowingLive();
    return cached
      ? { status: 'ready', summary: cached }
      : { status: 'loading', live: 0 };
  });

  useEffect(() => {
    let active = true;
    void loadFollowingLiveSummary((live) => {
      if (active) {
        setState({ status: 'loading', live });
      }
    })
      .then((summary) => {
        if (active) {
          setState({ status: 'ready', summary });
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        const message = errorMessage(error);
        setState(
          message.includes('登录') || message.includes('Cookie')
            ? { status: 'needLogin' }
            : { status: 'error' }
        );
      });
    return () => {
      active = false;
    };
  }, []);

  const description = ((): string => {
    if (state.status === 'loading') {
      return state.live > 0
        ? `已发现 ${state.live} 人正在直播 · 统计中…`
        : '正在统计关注直播…';
    }
    if (state.status === 'ready') {
      const { live, checked, complete, account } = state.summary;
      const head = live > 0 ? `${live} 人正在直播` : '当前没有关注的直播';
      const tail = complete
        ? `共 ${account.followingCount} 个关注`
        : `已统计最近 ${checked} 个（共 ${account.followingCount} 个关注）`;
      return `${head} · ${tail}`;
    }
    if (state.status === 'needLogin') {
      return '配置 Cookie 后统计关注直播';
    }
    return '暂时无法获取关注列表';
  })();

  return (
    <button
      type="button"
      data-testid="following-live-card"
      onClick={() =>
        navigate(state.status === 'needLogin' ? '/settings' : '/mine')
      }
      className="flex w-full items-center gap-3 rounded-md border border-line bg-surface p-4 text-left transition-colors duration-150 ease-out-expo hover:border-line-strong hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-raised text-ink-2">
        <Users className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-label font-medium text-ink">关注直播</span>
        <span
          data-testid="following-live-text"
          className="tnum mt-1 block truncate text-caption text-ink-3"
        >
          {description}
        </span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-ink-3"
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  );
}

/** 首页：搜索（可切换平台 / 粘贴房间号）+ 关注直播概览，不展示任何平台的内容列表 */
export function HomePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [siteId, setSiteId] = useState<SiteId>(DEFAULT_SITE);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const site = getSite(siteId) ?? getSite(DEFAULT_SITE);

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const submit = (): void => {
    const text = value.trim();
    if (!text) {
      return;
    }
    // 粘贴房间号 / 链接：按链接识别平台，纯数字则用当前选择的平台
    const parsed = parseRoomInput(text);
    if (parsed.roomId) {
      navigate(`/room/${parsed.site ?? siteId}/${parsed.roomId}`);
      return;
    }
    navigate(`/search?site=${siteId}&kw=${encodeURIComponent(text)}`);
  };

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-6 py-10">
        <h1 className="sr-only">首页</h1>

        {/* 品牌 hero：巨大 logo + 应用名 */}
        <div className="flex flex-col items-center gap-6 pb-2 pt-4">
          <img
            src={logo}
            alt=""
            className="size-52 rounded-[28px] ring-1 ring-line"
          />
          <p className="text-hero font-semibold text-ink">LIVE HOUSE</p>
        </div>

        {/* 大号搜索框：左侧选择平台 */}
        <div className="flex h-12 items-center gap-1 rounded-md border border-line bg-surface pl-1.5 pr-3 transition-colors duration-150 ease-out-expo focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
          <Dropdown
            value={siteId}
            onSelect={(next) => setSiteId(next as SiteId)}
            align="start"
            side="bottom"
            trigger={
              <button
                type="button"
                data-testid="search-site-trigger"
                aria-label={`搜索平台：${site?.name ?? ''}`}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-label font-medium text-ink-2 transition-colors duration-150 ease-out-expo hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                <PlatformIcon site={site} fallback={Search} className="size-4" />
                {site?.shortName}
                <ChevronDown
                  className="size-3.5 text-ink-3"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            }
            items={SITES.map((item) => ({
              value: item.id,
              disabled: !item.available,
              label: <SiteMenuItem site={item} />
            }))}
          />

          <span className="h-5 w-px shrink-0 bg-line" aria-hidden />

          <div className="flex h-full min-w-0 flex-1 items-center gap-2 px-2">
            <Search
              className="size-[18px] shrink-0 text-ink-3"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  submit();
                }
              }}
              placeholder={`搜索${site?.shortName ?? ''}直播间，或粘贴房间号 / 链接`}
              aria-label="搜索直播间或输入房间号"
              className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
            />
          </div>

          <kbd className="pointer-events-none shrink-0 rounded border border-line bg-raised px-1.5 py-0.5 text-micro font-medium text-ink-3">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </div>

        {/* 关注直播概览 */}
        <FollowingLiveCard />
      </div>
    </main>
  );
}
