import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type {
  DanmakuMessage,
  DouyinFollowingResult,
  DouyinSelfInfo,
  DouyinUserLiveStatus,
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
      ipcRenderer.invoke('douyin:getFollowingList', secUid, maxTime),
    checkLives: (secUids: string[]): Promise<void> =>
      ipcRenderer.invoke('douyin:checkFollowLives', secUids),
    cancelCheckLives: (): Promise<void> =>
      ipcRenderer.invoke('douyin:cancelFollowLives'),
    onLiveStatus: (
      callback: (status: DouyinUserLiveStatus) => void
    ): (() => void) => subscribe('following:live', callback)
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
