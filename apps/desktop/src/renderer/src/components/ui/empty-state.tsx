import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  /** 图片图标（平台品牌图标等），给了就替代 icon */
  iconSrc?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  iconSrc,
  title,
  description,
  action,
  className
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-16 text-center',
        className
      )}
    >
      {iconSrc ? (
        <img src={iconSrc} alt="" aria-hidden className="size-8 object-contain" />
      ) : (
        <Icon className="size-8 text-ink-3" strokeWidth={1.5} aria-hidden />
      )}
      <p className="mt-1 text-body font-medium text-ink-2">{title}</p>
      {description && (
        <p className="max-w-[42ch] text-label text-ink-3">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
