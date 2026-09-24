import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initTheme } from './lib/theme';
import './styles/global.css';

/** 应用改名后迁移旧的本地数据（douyin-live:* → live-house:*） */
function migrateLegacyStorage(): void {
  const keys = [
    'theme',
    'watch-history',
    'favorites',
    'player-volume',
    'player-muted',
    'player-danmaku'
  ];
  for (const key of keys) {
    const nextKey = `live-house:${key}`;
    const legacyKey = `douyin-live:${key}`;
    try {
      if (localStorage.getItem(nextKey) === null) {
        const value = localStorage.getItem(legacyKey);
        if (value !== null) {
          localStorage.setItem(nextKey, value);
        }
      }
      localStorage.removeItem(legacyKey);
    } catch {
      // 存储不可用时忽略
    }
  }
}

migrateLegacyStorage();
initTheme();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
