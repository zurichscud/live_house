import { useLocation, useNavigate } from 'react-router-dom';
import { History, House, Settings, Star, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import appIcon from '@/assets/app-icon.png';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { getWatchHistory } from '@/lib/history';
import { getLastRoom } from '@/lib/lastRoom';

interface NavItem {
  key: string;
  to: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    to: '/',
    label: '首页',
    icon: House,
    isActive: (pathname) => pathname === '/'
  },
  {
    key: 'favorites',
    to: '/favorites',
    label: '收藏',
    icon: Star,
    isActive: (pathname) => pathname.startsWith('/favorites')
  },
  {
    key: 'history',
    to: '/history',
    label: '历史',
    icon: History,
    isActive: (pathname) => pathname.startsWith('/history')
  },
  {
    key: 'mine',
    to: '/mine',
    label: '我的',
    icon: UserRound,
    isActive: (pathname) => pathname.startsWith('/mine')
  }
];

const SETTINGS_ITEM: NavItem = {
  key: 'settings',
  to: '/settings',
  label: '设置',
  icon: Settings,
  isActive: (pathname) => pathname.startsWith('/settings')
};

const itemBase =
  'flex size-9 items-center justify-center rounded-full transition-colors duration-150 ease-out-expo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const itemIdle = 'text-ink-3 hover:bg-raised/60 hover:text-ink';
const itemActive = 'bg-raised text-ink';

/**
 * 左侧导航：图标单列窄轨（复刻参考布局）。
 * 没有文字标签，因此每项必须带 tooltip 与 aria-label。
 */
export function Sidebar(): React.JSX.Element {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  /** 直播间页面：品牌图标记为激活 */
  const onRoom = pathname.startsWith('/room/');

  /** 点品牌图标回到最近进入的直播间（缺省回落到历史第一条） */
  const openLastRoom = (): void => {
    if (onRoom) {
      return;
    }
    const last = getLastRoom();
    const fallback = getWatchHistory()[0];
    const target =
      last ?? (fallback ? { site: fallback.platform, roomId: fallback.roomId } : null);
    if (target) {
      navigate(`/room/${target.site}/${target.roomId}`);
    }
  };

  const renderItem = (item: NavItem): React.JSX.Element => {
    const active = item.isActive(pathname);
    const Icon = item.icon;
    return (
      <Tooltip key={item.to} label={item.label} side="right">
        <button
          type="button"
          data-testid={`nav-${item.key}`}
          onClick={() => navigate(item.to)}
          aria-current={active ? 'page' : undefined}
          aria-label={item.label}
          className={cn(itemBase, active ? itemActive : itemIdle)}
        >
          <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        </button>
      </Tooltip>
    );
  };

  return (
    <aside className="flex w-14 shrink-0 flex-col items-center overflow-y-auto border-r border-line bg-surface py-3">
      <nav
        aria-label="主导航"
        className="flex min-h-0 w-full flex-1 flex-col items-center"
      >
        {/* 图标组（含分隔线与品牌图标）在设置以上的剩余高度里垂直居中 */}
        <div className="my-auto flex w-full flex-col items-center gap-2">
          {NAV_ITEMS.map(renderItem)}

          {/* 导航组与品牌之间的分隔线 */}
          <span className="my-1.5 h-px w-6 shrink-0 bg-line" aria-hidden />

          {/* 品牌图标：直播间页面激活，点击返回最近直播间 */}
          <Tooltip label={onRoom ? '当前直播间' : '返回直播间'} side="right">
            <button
              type="button"
              data-testid="app-logo"
              onClick={openLastRoom}
              aria-current={onRoom ? 'page' : undefined}
              aria-label={onRoom ? '当前直播间' : '返回直播间'}
              className={cn(
                'size-9 shrink-0 overflow-hidden rounded-full transition-[box-shadow,opacity] duration-150 ease-out-expo',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                onRoom
                  ? 'ring-2 ring-accent'
                  : 'opacity-85 ring-1 ring-line hover:opacity-100'
              )}
            >
              <img src={appIcon} alt="" className="size-full object-cover" />
            </button>
          </Tooltip>
        </div>

        <div className="pt-2">{renderItem(SETTINGS_ITEM)}</div>
      </nav>
    </aside>
  );
}
