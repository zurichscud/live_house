import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Spinner({
  className,
  label
}: {
  className?: string;
  label?: string;
}): React.JSX.Element {
  return (
    <span
      className={cn('inline-flex items-center gap-2 text-ink-3', className)}
      role="status"
    >
      <Loader2 className="size-4 animate-spin-slow" strokeWidth={2} />
      {label && <span className="text-label">{label}</span>}
    </span>
  );
}
