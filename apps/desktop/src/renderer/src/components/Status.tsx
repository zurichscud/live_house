import { cn } from '@/lib/cn';

/** 直播中徽章：品牌红圆点（呼吸）+ 红调文字，颜色不是唯一信息载体 */
export function LiveBadge({
  className,
  label = '直播中'
}: {
  className?: string;
  label?: string;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-micro font-semibold text-accent-text',
        className
      )}
    >
      <span className="animate-live-dot size-1.5 rounded-full bg-accent" aria-hidden />
      {label}
    </span>
  );
}

export type ConnectionStatus = 'idle' | 'connecting' | 'ready' | 'closed';

const STATUS_TEXT: Record<ConnectionStatus, string> = {
  idle: '未连接',
  connecting: '连接中',
  ready: '已连接',
  closed: '已断开'
};

const STATUS_DOT: Record<ConnectionStatus, string> = {
  idle: 'bg-ink-3',
  connecting: 'bg-warning',
  ready: 'bg-live',
  closed: 'bg-accent'
};

/** 弹幕连接状态：圆点 + 文字 */
export function ConnectionIndicator({
  status,
  className
}: {
  status: ConnectionStatus;
  className?: string;
}): React.JSX.Element {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-caption text-ink-3', className)}
      title={`弹幕${STATUS_TEXT[status]}`}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          STATUS_DOT[status],
          status === 'connecting' && 'animate-live-dot'
        )}
        aria-hidden
      />
      {STATUS_TEXT[status]}
    </span>
  );
}
