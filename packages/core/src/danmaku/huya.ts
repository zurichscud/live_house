import type { DanmakuClient } from '../api/site.js';
import { defaultLogger, type Logger } from '../common/logger.js';
import {
  nodeWebSocketFactory,
  WebSocketUtils,
  type WebSocketFactory
} from '../common/websocket.js';
import type { DanmakuMessage } from '../model/types.js';
import {
  buildHuyaJoinPacket,
  HUYA_DANMAKU_HEARTBEAT,
  HUYA_DANMAKU_URL,
  HUYA_SDK_USER_AGENT,
  parseHuyaPushMessage,
  type HuyaDanmakuArgs
} from './huya-tars.js';

export type { HuyaDanmakuArgs } from './huya-tars.js';

export interface HuyaDanmakuClientOptions {
  /** WebSocket 工厂（默认 Node ws，未来移动端可替换） */
  factory?: WebSocketFactory;
  logger?: Logger;
}

/** 虎牙弹幕 WebSocket 请求头（与 Dart 端一致，服务端会校验来源） */
const DANMAKU_HEADERS: Record<string, string> = {
  'User-Agent': HUYA_SDK_USER_AGENT,
  Origin: 'https://www.huya.com'
};

/**
 * 虎牙弹幕客户端
 * 协议：WebSocket + Tars(wup2)，加入房间后服务端推送 uri 1400 聊天 / 8006 在线人数。
 */
export class HuyaDanmakuClient implements DanmakuClient {
  /** 心跳间隔（与 Dart 端一致，60s） */
  heartBeatTime = 60 * 1000;

  onMessage?: (message: DanmakuMessage) => void;
  onClose?: (reason: string) => void;
  onReady?: () => void;

  private readonly factory: WebSocketFactory;
  private readonly logger: Logger;
  private utils: WebSocketUtils | null = null;
  private args: HuyaDanmakuArgs | null = null;
  private stopped = false;

  constructor(options: HuyaDanmakuClientOptions = {}) {
    this.factory = options.factory ?? nodeWebSocketFactory;
    this.logger = options.logger ?? defaultLogger;
  }

  start(args: HuyaDanmakuArgs): void {
    this.stopped = false;
    this.args = args;
    this.logger.debug(
      `弹幕连接: ayyuid=${args.ayyuid} topSid=${args.topSid} subSid=${args.subSid}`
    );

    this.utils = new WebSocketUtils({
      url: HUYA_DANMAKU_URL,
      heartBeatTime: this.heartBeatTime,
      headers: DANMAKU_HEADERS,
      factory: this.factory,
      onMessage: (data) => this.decodeMessage(data),
      onReady: () => {
        this.onReady?.();
        this.joinRoom();
      },
      onHeartBeat: () => this.heartbeat(),
      onReconnect: () => this.onClose?.('与服务器断开连接，正在尝试重连'),
      onClose: (message) => {
        if (!this.stopped) {
          this.onClose?.(message);
        }
      },
      logger: this.logger
    });
    this.utils.connect();
  }

  private joinRoom(): void {
    if (!this.args) {
      return;
    }
    this.utils?.sendMessage(buildHuyaJoinPacket(this.args));
  }

  private heartbeat(): void {
    this.utils?.sendMessage(HUYA_DANMAKU_HEARTBEAT);
  }

  private decodeMessage(data: Uint8Array): void {
    try {
      const push = parseHuyaPushMessage(data);
      if (!push) {
        return;
      }
      if (push.kind === 'chat') {
        this.onMessage?.({
          type: 'chat',
          userName: push.userName,
          message: push.message
        });
      } else {
        this.onMessage?.({ type: 'online', online: push.online });
      }
    } catch (error) {
      this.logger.error('解析虎牙弹幕消息失败', error);
    }
  }

  stop(): void {
    this.stopped = true;
    this.args = null;
    this.onMessage = undefined;
    this.onClose = undefined;
    this.utils?.close();
    this.utils = null;
  }
}
