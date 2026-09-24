import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { app, BrowserWindow, shell } from 'electron';
import { setupHeaderInjection } from './headers.js';
import { registerIpc } from './ipc.js';
import { initSettings } from './site.js';

// 开发时 out/main -> apps/desktop/build/icon.png；打包后 app.asar/build/icon.png
const iconPath = join(__dirname, '../../build/icon.png');

// 应用名（同时决定 userData 目录与窗口标题；打包产物由 electron-builder 的 productName 兜底）
app.setName('LIVE HOUSE');

/** 改名后的旧用户数据目录（仅用于一次性迁移 settings.json） */
const LEGACY_USER_DATA_DIRS = ['@douyin-live/desktop', 'DouyinLive'];

/** 应用改名（DouyinLive → LIVE HOUSE）后迁移已保存的 Cookie 配置 */
function migrateLegacyUserData(): void {
  try {
    const settings = join(app.getPath('userData'), 'settings.json');
    if (existsSync(settings)) {
      return;
    }
    for (const legacy of LEGACY_USER_DATA_DIRS) {
      const legacySettings = join(app.getPath('appData'), legacy, 'settings.json');
      if (existsSync(legacySettings)) {
        mkdirSync(app.getPath('userData'), { recursive: true });
        copyFileSync(legacySettings, settings);
        return;
      }
    }
  } catch {
    // 迁移失败不影响启动
  }
}

function createWindow(): void {
  const isMac = process.platform === 'darwin';

  // 打包后 Dock 图标来自 icns，开发模式下需显式设置，否则显示 Electron 默认图标
  if (isMac && !app.isPackaged) {
    app.dock?.setIcon(iconPath);
  }

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath,
    backgroundColor: '#0a0a0d',
    titleBarStyle: isMac ? 'hidden' : 'hidden',
    // 红绿灯在标题栏（44px）内垂直居中
    trafficLightPosition: isMac ? { x: 12, y: 15 } : undefined,
    ...(isMac
      ? {}
      : {
          // 与标题栏底色（surface）一致，Windows 窗口按钮叠在其上不露底色
          titleBarOverlay: {
            color: '#131317',
            symbolColor: '#bdbdc1',
            height: 44
          }
        }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // 显式设置（构造参数在部分 Electron 版本上不生效）
  if (isMac) {
    mainWindow.setWindowButtonPosition({ x: 12, y: 15 });
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  migrateLegacyUserData();
  initSettings();
  setupHeaderInjection();
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
