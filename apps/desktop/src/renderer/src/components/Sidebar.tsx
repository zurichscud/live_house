import { useLocation, useNavigate } from 'react-router-dom';
import { History, House, Settings, Star, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import appIcon from '@/assets/app-icon.png';
import { cn } from '@/lib/cn';

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
    label: '观看记录',
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
  'flex w-full items-center gap-2 border-l-2 px-2 py-1.5 text-left text-label transition-colors duration-150 ease-out-expo focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent';
const itemIdle =
  'border-transparent text-ink-2 hover:bg-raised/60 hover:text-ink';
const itemActive = 'border-accent bg-raised font-medium text-ink';

/** 左侧导航（复刻 skills-deck 布局）：顶部品牌，底部固定设置 */
export function Sidebar(): React.JSX.Element {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const renderItem = (item: NavItem): React.JSX.Element => {
    const active = item.isActive(pathname);
    const Icon = item.icon;
    return (
      <button
        key={item.to}
        type="button"
        data-testid={`nav-${item.key}`}
        onClick={() => navigate(item.to)}
        aria-current={active ? 'page' : undefined}
        className={cn(itemBase, active ? itemActive : itemIdle)}
      >
        <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="flex-1 truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="flex w-[212px] shrink-0 flex-col overflow-y-auto border-r border-line bg-surface px-2 py-3">
      <div className="flex items-center gap-2 px-2">
        <img
          src={appIcon}
          alt=""
          aria-hidden
          className="size-5 shrink-0 rounded-[6px] ring-1 ring-line"
        />
        <span
          data-testid="app-name"
          className="truncate text-title font-semibold tracking-tight text-ink"
        >
          LIVE HOUSE
        </span>
      </div>

      <nav
        aria-label="主导航"
        className="mt-4 flex min-h-0 flex-1 flex-col"
      >
        {NAV_ITEMS.map(renderItem)}
        <div className="mt-auto pt-2">{renderItem(SETTINGS_ITEM)}</div>
      </nav>
    </aside>
  );
}
