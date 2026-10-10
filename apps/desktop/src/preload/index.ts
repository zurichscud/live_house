import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type {
  DanmakuMessage,
  DouyinFollowingResult,
  DouyinSelfInfo,
  LiveCategoryResult,
  LivePlayQuality,
  LivePlayUrl,
  LiveRoomDetail,
  LiveSearchRoomResult,
  SiteId
} from '@live-house/core';

function subscribe<T>(
  channel: string,
  callback: (payload: T) => void
): () => void {
  const listener = (_event: IpcRendererEvent, payload: T): void => {
    callback(payload);
  };
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

/** 导出结果：用户取消保存时为 { canceled: true } */
export interface FavoritesExportResult {
  canceled: boolean;
  filePath?: string;
}

/** 导入结果：用户取消选择文件时为 { canceled: true }，否则带回文件内容 */
export interface FavoritesImportResult {
  canceled: boolean;
  filePath?: string;
  content?: string;
}

/** 小窗当前播放的直播间（未打开时为 null） */
export interface MiniWindowState {
  site: string;
  roomId: string;
}

const api = {
  platform: process.platform as string,
  settings: {
    getCookie: (): Promise<string> =>
      ipcRenderer.invoke('settings:getCookie'),
    setCookie: (cookie: string): Promise<void> =>
      ipcRenderer.invoke('settings:setCookie', cookie),
    setWindowTheme: (theme: 'dark' | 'light'): Promise<void> =>
      ipcRenderer.invoke('settings:setWindowTheme', theme)
  },
  /** 通用站点能力：所有平台共用同一组方法，按 site 分发 */
  site: {
    getRoomDetail: (site: SiteId, roomId: string): Promise<LiveRoomDetail> =>
      ipcRenderer.invoke('site:getRoomDetail', site, roomId),
    getPlayQualites: (
      site: SiteId,
      detail: LiveRoomDetail
    ): Promise<LivePlayQuality[]> =>
      ipcRenderer.invoke('site:getPlayQualites', site, detail),
    getPlayUrls: (
      site: SiteId,
      detail: LiveRoomDetail,
      quality: LivePlayQuality
    ): Promise<LivePlayUrl> =>
      ipcRenderer.invoke('site:getPlayUrls', site, detail, quality),
    getLiveStatus: (site: SiteId, roomId: string): Promise<boolean> =>
      ipcRenderer.invoke('site:getLiveStatus', site, roomId),
    searchRooms: (
      site: SiteId,
      keyword: string,
      page = 1
    ): Promise<LiveSearchRoomResult> =>
      ipcRenderer.invoke('site:searchRooms', site, keyword, page),
    getRecommendRooms: (
      site: SiteId,
      page = 1
    ): Promise<LiveCategoryResult> =>
      ipcRenderer.invoke('site:getRecommendRooms', site, page)
  },
  /** 抖音账号能力（关注列表 / 登录态，暂为抖音专有） */
  following: {
    getSelfInfo: (): Promise<DouyinSelfInfo> =>
      ipcRenderer.invoke('douyin:getSelfInfo'),
    getList: (secUid: string, maxTime = '0'): Promise<DouyinFollowingResult> =>
      ipcRenderer.invoke('douyin:getFollowingList', secUid, maxTime)
  },
  /** 收藏导入 / 导出：文件对话框与磁盘读写由主进程完成，这里只传 JSON 文本 */
  favorites: {
    exportFile: (content: string): Promise<FavoritesExportResult> =>
      ipcRenderer.invoke('favorites:export', content),
    importFile: (): Promise<FavoritesImportResult> =>
      ipcRenderer.invoke('favorites:import')
  },
  /** 小窗模式：独立置顶小窗播放指定直播间 */
  mini: {
    open: (site: SiteId, roomId: string): Promise<void> =>
      ipcRenderer.invoke('mini:open', site, roomId),
    close: (): Promise<void> => ipcRenderer.invoke('mini:close'),
    getState: (): Promise<MiniWindowState | null> =>
      ipcRenderer.invoke('mini:getState'),
    onClosed: (callback: () => void): (() => void) =>
      subscribe('mini:closed', () => callback())
  },
  danmaku: {
    start: (site: SiteId, args: unknown): Promise<void> =>
      ipcRenderer.invoke('danmaku:start', site, args),
    stop: (): Promise<void> => ipcRenderer.invoke('danmaku:stop'),
    onMessage: (callback: (message: DanmakuMessage) => void): (() => void) =>
      subscribe('danmaku:message', callback),
    onClose: (callback: (reason: string) => void): (() => void) =>
      subscribe('danmaku:close', callback),
    onReady: (callback: () => void): (() => void) =>
      subscribe('danmaku:ready', callback)
  }
};

contextBridge.exposeInMainWorld('api', api);

export type PreloadApi = typeof api;
