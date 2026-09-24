/** 播放器偏好（音量 / 静音 / 弹幕开关）：localStorage 持久化，跨房间、重启后保留 */

const VOLUME_KEY = 'live-house:player-volume';
const MUTED_KEY = 'live-house:player-muted';
const DANMAKU_KEY = 'live-house:player-danmaku';

export const DEFAULT_PLAYER_VOLUME = 0.8;

export function getPlayerVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw === null) {
      return DEFAULT_PLAYER_VOLUME;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return DEFAULT_PLAYER_VOLUME;
    }
    return Math.min(1, Math.max(0, value));
  } catch {
    return DEFAULT_PLAYER_VOLUME;
  }
}

export function savePlayerVolume(value: number): void {
  try {
    localStorage.setItem(VOLUME_KEY, String(value));
  } catch {
    // 忽略写入失败
  }
}

/** 首次使用默认静音（避免自动播放突然出声） */
export function getPlayerMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) !== '0';
  } catch {
    return true;
  }
}

export function savePlayerMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
  } catch {
    // 忽略写入失败
  }
}

export function getDanmakuEnabled(): boolean {
  try {
    return localStorage.getItem(DANMAKU_KEY) !== '0';
  } catch {
    return true;
  }
}

export function saveDanmakuEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(DANMAKU_KEY, enabled ? '1' : '0');
  } catch {
    // 忽略写入失败
  }
}
