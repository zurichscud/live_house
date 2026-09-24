import { Play, Users } from 'lucide-react';
import type { LiveRoomItem } from '@live-house/core';
import { formatOnline } from '@/lib/format';

interface Props {
  item: LiveRoomItem;
  onClick: (roomId: string) => void;
}

export function RoomCard({ item, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick(item.roomId)}
      data-testid="room-card"
      className="group flex flex-col gap-2 rounded-md text-left"
      aria-label={`${item.title} — ${item.userName}`}
    >
      <div className="relative aspect-video overflow-hidden rounded-md bg-surface">
        {item.cover ? (
          <img
            src={item.cover}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 ease-out-expo group-hover:scale-[1.03]"
          />
        ) : (
          <div className="size-full bg-raised" />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 ease-out-expo group-hover:bg-black/30">
          <span className="flex size-10 scale-90 items-center justify-center rounded-full bg-black/60 opacity-0 transition-all duration-200 ease-out-expo group-hover:scale-100 group-hover:opacity-100">
            <Play className="ml-0.5 size-4 fill-white text-white" />
          </span>
        </div>

        <span
          className="tnum absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-micro text-white/90"
          title={`${item.online} 人在看`}
        >
          <Users className="size-3" strokeWidth={2} aria-hidden />
          {formatOnline(item.online)}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <h3
          data-testid="room-card-title"
          className="line-clamp-2 text-label font-medium leading-[1.45] text-ink transition-colors duration-150 group-hover:text-white"
        >
          {item.title}
        </h3>
        <p className="truncate text-caption text-ink-3">{item.userName}</p>
      </div>
    </button>
  );
}
