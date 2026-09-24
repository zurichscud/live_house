import { LayoutGrid } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { PlatformIcon } from '@/components/PlatformIcon';
import { SITES, type SiteId } from '@/lib/sites';

/** tab 取值：具体平台，或跨平台汇总的「全部」 */
export type PlatformTabId = SiteId | 'all';

interface Props {
  value: PlatformTabId;
  onChange: (id: PlatformTabId) => void;
  /** 供测试与定位使用的 testid 前缀，最终形如 `${prefix}-${siteId}` */
  testIdPrefix: string;
  /** 最前面插入「全部」（跨平台汇总列表用） */
  includeAll?: boolean;
}

/** 单个 tab：等宽 + 恒定字重，激活只换颜色 */
function Tab({
  active,
  testId,
  onClick,
  children
}: {
  active: boolean;
  testId: string;
  onClick: () => void;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-w-[68px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium transition-colors duration-150',
        active ? 'bg-ink text-primary-ink' : 'text-ink-3 hover:text-ink-2'
      )}
    >
      {children}
    </button>
  );
}

/**
 * 平台切换 tab（观看记录 / 我的共用）。
 * 等宽 + 恒定字重：激活只换颜色，切换时不得产生几何变化。
 */
export function PlatformTabs({
  value,
  onChange,
  testIdPrefix,
  includeAll = false
}: Props): React.JSX.Element {
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface p-1">
      {includeAll && (
        <Tab
          active={value === 'all'}
          testId={`${testIdPrefix}-all`}
          onClick={() => onChange('all')}
        >
          <LayoutGrid className="size-3.5" strokeWidth={1.75} aria-hidden />
          全部
        </Tab>
      )}

      {SITES.map((site) => (
        <Tab
          key={site.id}
          active={site.id === value}
          testId={`${testIdPrefix}-${site.id}`}
          onClick={() => onChange(site.id)}
        >
          <PlatformIcon site={site} className="size-3.5" />
          {site.shortName}
        </Tab>
      ))}
    </div>
  );
}
