import { readFile, stat, writeFile } from 'node:fs/promises';
import {
  BrowserWindow,
  dialog,
  ipcMain,
  type OpenDialogOptions,
  type SaveDialogOptions
} from 'electron';
import type { LivePlayQuality, LiveRoomDetail } from '@live-house/core';
import {
  douyinSite,
  getSite,
  getUserCookie,
  setUserCookie,
  startDanmaku,
  stopDanmaku
} from './site.js';
import { closeMiniWindow, getMiniState, openMiniWindow } from './mini.js';

/** 导入收藏的文件大小上限：正常导出（500 条）远小于此，超过即视为无效文件 */
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

/**
 * 弹幕连接是主进程全局单例：记录发起 `danmaku:start` 的窗口，
 * 只有 owner 能 stop，避免主窗口 / 小窗在切换时互相打断。
 */
let danmakuOwnerId: number | null = null;

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

  // ---- 收藏导入 / 导出（文件对话框与磁盘读写只在主进程，渲染进程只传 JSON 文本）----

  ipcMain.handle('favorites:export', async (event, content: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const options: SaveDialogOptions = {
      title: '导出收藏',
      defaultPath: `live-house-favorites-${stamp}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    };
    const result = win
      ? await dialog.showSaveDialog(win, options)
      : await dialog.showSaveDialog(options);
    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }
    await writeFile(result.filePath, content, 'utf8');
    return { canceled: false, filePath: result.filePath };
  });

  ipcMain.handle('favorites:import', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const options: OpenDialogOptions = {
      title: '导入收藏',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    };
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options);
    const filePath = result.filePaths[0];
    if (result.canceled || !filePath) {
      return { canceled: true };
    }
    const { size } = await stat(filePath);
    if (size > MAX_IMPORT_BYTES) {
      throw new Error('文件过大（超过 2MB），不是收藏导出文件');
    }
    return {
      canceled: false,
      filePath,
      content: await readFile(filePath, 'utf8')
    };
  });

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

  // 传入 cookie 时用该值验证（设置页里刚粘贴、尚未保存的内容），不写入站点状态
  ipcMain.handle('douyin:getSelfInfo', (_event, cookie?: string) =>
    douyinSite().getSelfInfo(cookie)
  );

  ipcMain.handle(
    'douyin:getFollowingList',
    (_event, secUid: string, maxTime: string) =>
      douyinSite().getFollowingList(secUid, maxTime)
  );

  // ---- 小窗模式（独立置顶小窗，播放同一账号体系下的直播间）----

  ipcMain.handle('mini:open', (event, site: string, roomId: string) => {
    openMiniWindow(BrowserWindow.fromWebContents(event.sender), site, roomId);
  });

  ipcMain.handle('mini:close', () => {
    closeMiniWindow();
  });

  ipcMain.handle('mini:getState', () => getMiniState());

  // ---- 弹幕（站点分发）----

  ipcMain.handle('danmaku:start', (event, site: string, args: unknown) => {
    danmakuOwnerId = event.sender.id;
    // owner 窗口被销毁（如小窗直接关闭）时，连同弹幕连接一起清理
    event.sender.once('destroyed', () => {
      if (danmakuOwnerId === event.sender.id) {
        danmakuOwnerId = null;
        stopDanmaku();
      }
    });
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

  ipcMain.handle('danmaku:stop', (event) => {
    if (danmakuOwnerId !== null && danmakuOwnerId !== event.sender.id) {
      return;
    }
    danmakuOwnerId = null;
    stopDanmaku();
  });
}
