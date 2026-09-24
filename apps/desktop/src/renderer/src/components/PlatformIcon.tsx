import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SiteInfo } from '@/lib/sites';

interface Props {
  /** 目标平台；缺省或没有品牌图标时回落到 fallback */
  site?: SiteInfo;
  /** 回落用的 lucide 图标，尺寸跟随 className */
  fallback?: LucideIcon;
  className?: string;
}

/** 平台品牌图标：assets/platform 下的 SVG 资源，缺失时回落线性图标 */
export function PlatformIcon({
  site,
  fallback: Fallback,
  className
}: Props): React.JSX.Element | null {
  if (!site?.icon) {
    return Fallback ? (
      <Fallback className={className} strokeWidth={1.75} aria-hidden />
    ) : null;
  }
  return (
    <img
      src={site.icon}
      alt=""
      aria-hidden
      className={cn('shrink-0 object-contain', className)}
    />
  );
}
