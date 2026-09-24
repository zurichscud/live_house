import { BrowserWindow, ipcMain } from 'electron';
import type { LivePlayQuality, LiveRoomDetail } from '@live-house/core';
import {
  douyinSite,
  getSite,
  getUserCookie,
  setUserCookie,
  startDanmaku,
  stopDanmaku
} from './site.js';

export function registerIpc(): void {
  ipcMain.handle('settings:getCookie', () => getUserCookie());

  ipcMain.handle('settings:setCookie', (_event, cookie: string) => {
    setUserCookie(cookie);
  });

  // 亮/暗切换时同步窗口底色与 Windows 标题栏覆盖层，避免启动或缩放时闪深色
  ipcMain.handle(
    'settings:setWindowTheme',
    (event, theme: 'dark' | 'light') => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) {
        return;
      }
      win.setBackgroundColor(theme === 'light' ? '#f3f3f5' : '#0a0a0d');
      if (process.platform !== 'darwin') {
        win.setTitleBarOverlay({
          color: theme === 'light' ? '#fdfdfd' : '#131317',
          symbolColor: theme === 'light' ? '#5e5e64' : '#bdbdc1',
          height: 44
        });
      }
    }
  );

  // ---- 通用站点能力（按 siteId 分发到对应平台实现）----

  ipcMain.handle('site:getRoomDetail', (_event, site: string, roomId: string) =>
    getSite(site).getRoomDetail(roomId)
  );

  ipcMain.handle(
    'site:getPlayQualites',
    (_event, site: string, detail: LiveRoomDetail) =>
      getSite(site).getPlayQualites(detail)
  );

  ipcMain.handle(
    'site:getPlayUrls',
    (_event, site: string, detail: LiveRoomDetail, quality: LivePlayQuality) =>
      getSite(site).getPlayUrls(detail, quality)
  );

  ipcMain.handle('site:getLiveStatus', (_event, site: string, roomId: string) =>
    getSite(site).getLiveStatus(roomId)
  );

  ipcMain.handle(
    'site:searchRooms',
    (_event, site: string, keyword: string, page: number) => {
      const target = getSite(site);
      if (!target.searchRooms) {
        throw new Error(`${target.name}暂不支持搜索`);
      }
      return target.searchRooms(keyword, page);
    }
  );

  ipcMain.handle('site:getRecommendRooms', (_event, site: string, page: number) => {
    const target = getSite(site);
    if (!target.getRecommendRooms) {
      throw new Error(`${target.name}暂不支持推荐列表`);
    }
    return target.getRecommendRooms(page);
  });

  // ---- 抖音账号能力（关注列表 / 登录态，暂为抖音专有）----

  ipcMain.handle('douyin:getSelfInfo', () => douyinSite().getSelfInfo());

  ipcMain.handle(
    'douyin:getFollowingList',
    (_event, secUid: string, maxTime: string) =>
      douyinSite().getFollowingList(secUid, maxTime)
  );

  // ---- 弹幕（站点分发）----

  ipcMain.handle('danmaku:start', (event, site: string, args: unknown) => {
    startDanmaku(site, args, {
      onMessage: (message) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('danmaku:message', message);
        }
      },
      onClose: (reason) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('danmaku:close', reason);
        }
      },
      onReady: () => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('danmaku:ready');
        }
      }
    });
  });

  ipcMain.handle('danmaku:stop', () => {
    stopDanmaku();
  });
}
