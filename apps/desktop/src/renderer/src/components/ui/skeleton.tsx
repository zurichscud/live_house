import { cn } from '@/lib/cn';

export function Skeleton({
  className
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-sm bg-surface',
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-ink/[0.06] to-transparent" />
    </div>
  );
}

/** 房间卡片骨架 */
export function RoomCardSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-video w-full rounded-md" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}
