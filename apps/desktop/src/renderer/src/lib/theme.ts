import { useSyncExternalStore } from 'react';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'live-house:theme';
const listeners = new Set<() => void>();
let current: ThemeMode = 'dark';

function readStored(): ThemeMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function apply(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
}

/** 在 React 渲染前调用，避免主题闪烁 */
export function initTheme(): void {
  current = readStored();
  apply(current);
}

export function getTheme(): ThemeMode {
  return current;
}

export function setTheme(mode: ThemeMode): void {
  current = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 忽略写入失败
  }
  apply(mode);
  void window.api?.settings.setWindowTheme(mode);
  for (const listener of listeners) {
    listener();
  }
}

export function toggleTheme(): void {
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTheme(): ThemeMode {
  return useSyncExternalStore(subscribe, getTheme, getTheme);
}
