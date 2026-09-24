import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  message: string;
  action?: ReactNode;
  onRetry?: () => void;
}

export function InlineError({ message, action, onRetry }: Props): React.JSX.Element {
  return (
    <div className="mx-5 mt-4 flex items-start gap-3 rounded-md border border-accent/25 bg-accent-soft/70 px-4 py-3">
      <TriangleAlert
        className="mt-0.5 size-4 shrink-0 text-accent-text"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-label leading-relaxed text-accent-text">{message}</p>
        {action && <div className="mt-1.5">{action}</div>}
      </div>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  );
}
