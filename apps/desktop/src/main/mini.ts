import { join } from 'node:path';
import { BrowserWindow } from 'electron';

/** 小窗默认尺寸：顶部拖拽条 + 16:9 画面 + 底部控制条 */
const MINI_WIDTH = 420;
const MINI_HEIGHT = 320;
const MINI_MIN_WIDTH = 320;
const MINI_MIN_HEIGHT = 240;

let miniWindow: BrowserWindow | null = null;
/** 打开小窗的主窗口（小窗关闭时通知它恢复播放） */
let openerWindow: BrowserWindow | null = null;
/** 小窗当前播放的直播间 */
let miniTarget: { site: string; roomId: string } | null = null;

function rendererHash(site: string, roomId: string): string {
  return `/mini/${encodeURIComponent(site)}/${encodeURIComponent(roomId)}`;
}

function loadMini(win: BrowserWindow, site: string, roomId: string): void {
  const hash = rendererHash(site, roomId);
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devUrl) {
    void win.loadURL(`${devUrl}#${hash}`);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'), { hash });
  }
}

/** 打开（或复用）小窗播放指定直播间；同一时刻只存在一个小窗 */
export function openMiniWindow(
  opener: BrowserWindow | null,
  site: string,
  roomId: string
): void {
  miniTarget = { site, roomId };

  if (miniWindow && !miniWindow.isDestroyed()) {
    openerWindow = opener ?? openerWindow;
    loadMini(miniWindow, site, roomId);
    miniWindow.show();
    miniWindow.focus();
    return;
  }

  const win = new BrowserWindow({
    width: MINI_WIDTH,
    height: MINI_HEIGHT,
    minWidth: MINI_MIN_WIDTH,
    minHeight: MINI_MIN_HEIGHT,
    title: 'LIVE HOUSE 小窗',
    frame: false,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#0a0a0d',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // 主窗口获得焦点 / 窗口被遮挡时也保持流畅播放
      backgroundThrottling: false
    }
  });

  miniWindow = win;
  openerWindow = opener;

  win.on('ready-to-show', () => win.show());
  win.on('closed', () => {
    miniWindow = null;
    miniTarget = null;
    const target = openerWindow;
    openerWindow = null;
    if (target && !target.isDestroyed()) {
      target.webContents.send('mini:closed');
      if (target.isMinimized()) {
        target.restore();
      }
      target.focus();
    }
  });

  loadMini(win, site, roomId);
}

export function closeMiniWindow(): void {
  miniWindow?.close();
}

/** 小窗当前状态：未打开或已销毁时为 null */
export function getMiniState(): { site: string; roomId: string } | null {
  return miniWindow && !miniWindow.isDestroyed() ? miniTarget : null;
}
