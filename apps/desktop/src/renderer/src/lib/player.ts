import Hls from 'hls.js';
import mpegts from 'mpegts.js';

export type PlayerEngine = 'flv' | 'hls';

export interface LivePlayerCallbacks {
  onError?: (error: string) => void;
  onPlaying?: () => void;
}

export function detectEngine(url: string): PlayerEngine {
  return url.includes('.m3u8') ? 'hls' : 'flv';
}

/** 直播播放器封装：FLV（mpegts.js，低延迟优先）与 HLS（hls.js） */
export class LivePlayerController {
  private flv: mpegts.Player | null = null;
  private hls: Hls | null = null;
  private currentUrl = '';

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly callbacks: LivePlayerCallbacks = {}
  ) {}

  get url(): string {
    return this.currentUrl;
  }

  play(url: string): void {
    this.stop();
    this.currentUrl = url;
    if (detectEngine(url) === 'hls') {
      this.playHls(url);
    } else {
      this.playFlv(url);
    }
  }

  private playFlv(url: string): void {
    if (!mpegts.isSupported()) {
      this.callbacks.onError?.('当前环境不支持 MSE 播放');
      return;
    }
    const player = mpegts.createPlayer(
      {
        type: 'flv',
        isLive: true,
        url,
        cors: true
      },
      {
        enableWorker: true,
        enableStashBuffer: false,
        stashInitialSize: 128,
        liveBufferLatencyChasing: true,
        liveBufferLatencyMaxLatency: 1.5,
        liveBufferLatencyMinRemain: 0.5,
        lazyLoad: false,
        autoCleanupSourceBuffer: true
      }
    );
    player.on(mpegts.Events.ERROR, (_type, detail) => {
      this.callbacks.onError?.(`FLV 播放错误：${detail}`);
    });
    player.attachMediaElement(this.video);
    player.load();
    void Promise.resolve(player.play()).catch(() => {
      // 自动播放被拦截时忽略，等待用户交互
    });
    this.flv = player;
  }

  private playHls(url: string): void {
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
        maxBufferLength: 15,
        backBufferLength: 30
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          this.callbacks.onError?.(`HLS 播放错误：${data.details}`);
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.video.play().catch(() => {});
      });
      hls.loadSource(url);
      hls.attachMedia(this.video);
      this.hls = hls;
      return;
    }
    if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      this.video.src = url;
      this.video.play().catch(() => {});
      return;
    }
    this.callbacks.onError?.('当前环境不支持 HLS 播放');
  }

  /** 重新加载当前地址（断流重连用） */
  reload(): void {
    if (this.currentUrl) {
      this.play(this.currentUrl);
    }
  }

  stop(): void {
    if (this.flv) {
      this.flv.destroy();
      this.flv = null;
    }
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.video.removeAttribute('src');
    this.video.load();
  }

  destroy(): void {
    this.stop();
    this.currentUrl = '';
  }
}
