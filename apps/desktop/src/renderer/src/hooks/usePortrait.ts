import { useSyncExternalStore } from 'react';

/**
 * 竖屏检测（视图高度 ≥ 宽度，即屏幕或窗口本身是竖屏）：
 * 房间页据此把弹幕面板从播放器右侧移到下方（见 DESIGN.md「房间页结构」）。
 * 全屏播放只切换画面容器的呈现，不改变这里的判定，因此全屏布局保持不变。
 */
const PORTRAIT_QUERY = '(orientation: portrait)';

let query: MediaQueryList | null = null;

function getQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  query ??= window.matchMedia(PORTRAIT_QUERY);
  return query;
}

function subscribe(onStoreChange: () => void): () => void {
  const media = getQuery();
  if (!media) {
    return () => undefined;
  }
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getSnapshot(): boolean {
  return getQuery()?.matches ?? false;
}

function getServerSnapshot(): boolean {
  return false;
}

export function usePortrait(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
