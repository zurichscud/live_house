import { cn } from '@/lib/cn';
import { SITES, type SiteId } from '@/lib/sites';

interface Props {
  value: SiteId;
  onChange: (id: SiteId) => void;
  /** 供测试与定位使用的 testid 前缀，最终形如 `${prefix}-${siteId}` */
  testIdPrefix: string;
}

/**
 * 平台切换 tab（观看记录 / 我的共用）。
 * 等宽 + 恒定字重：激活只换颜色，切换时不得产生几何变化。
 */
export function PlatformTabs({
  value,
  onChange,
  testIdPrefix
}: Props): React.JSX.Element {
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface p-1">
      {SITES.map((site) => {
        const Icon = site.icon;
        const active = site.id === value;
        return (
          <button
            key={site.id}
            type="button"
            data-testid={`${testIdPrefix}-${site.id}`}
            onClick={() => onChange(site.id)}
            aria-pressed={active}
            className={cn(
              'flex min-w-[68px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium transition-colors duration-150',
              active ? 'bg-ink text-primary-ink' : 'text-ink-3 hover:text-ink-2'
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
            {site.shortName}
          </button>
        );
      })}
    </div>
  );
}
