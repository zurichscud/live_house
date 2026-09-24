import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { app } from 'electron';
import { BilibiliSite, DouyinSite, HuyaSite } from '@live-house/core';
import type {
  DanmakuClient,
  DanmakuMessage,
  LiveSite,
  SiteId
} from '@live-house/core';

/** 全局站点实例（主进程单例） */
export const sites: Record<SiteId, LiveSite> = {
  douyin: new DouyinSite(),
  bilibili: new BilibiliSite(),
  huya: new HuyaSite()
};

export function getSite(id: string): LiveSite {
  const site = sites[id as SiteId];
  if (!site) {
    throw new Error(`未知平台：${id}`);
  }
  return site;
}

/** 抖音站点（账号 / 弹幕等抖音专有能力的入口） */
export function douyinSite(): DouyinSite {
  return sites.douyin as DouyinSite;
}

interface AppSettings {
  cookie?: string;
}

function settingsFile(): string {
  return join(app.getPath('userData'), 'settings.json');
}

function loadSettings(): AppSettings {
  try {
    const file = settingsFile();
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, 'utf8')) as AppSettings;
    }
  } catch {
    // 配置损坏时忽略
  }
  return {};
}

function saveSettings(settings: AppSettings): void {
  const file = settingsFile();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(settings, null, 2), 'utf8');
}

/** 应用启动时加载本地配置（需在 app ready 后调用） */
export function initSettings(): void {
  const settings = loadSettings();
  if (settings.cookie) {
    douyinSite().setCookie(settings.cookie);
  }
}

export function setUserCookie(cookie: string): void {
  douyinSite().setCookie(cookie);
  saveSettings({ ...loadSettings(), cookie });
}

export function getUserCookie(): string {
  return douyinSite().getCookie();
}

let danmakuClient: DanmakuClient | null = null;

export interface DanmakuHandlers {
  onMessage: (message: DanmakuMessage) => void;
  onClose: (reason: string) => void;
  onReady: () => void;
}

export function startDanmaku(
  siteId: string,
  args: unknown,
  handlers: DanmakuHandlers
): void {
  const site = getSite(siteId);
  if (!site.createDanmakuClient) {
    throw new Error(`${site.name}暂不支持弹幕`);
  }
  stopDanmaku();
  const client = site.createDanmakuClient();
  client.onMessage = handlers.onMessage;
  client.onClose = handlers.onClose;
  client.onReady = handlers.onReady;
  client.start(args);
  danmakuClient = client;
}

export function stopDanmaku(): void {
  danmakuClient?.stop();
  danmakuClient = null;
}
