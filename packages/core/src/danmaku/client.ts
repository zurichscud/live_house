import { ungzip } from 'pako';
import type { DanmakuClient } from '../api/site.js';
import { DEFAULT_USER_AGENT } from '../common/constants.js';
import { defaultLogger, type Logger } from '../common/logger.js';
import {
  nodeWebSocketFactory,
  WebSocketUtils,
  type WebSocketFactory
} from '../common/websocket.js';
import type { DanmakuMessage, DouyinDanmakuArgs } from '../model/types.js';
import { getSignature } from '../sign/index.js';
import { douyin } from './proto/douyin.js';

export type {
  DanmakuChatMessage,
  DanmakuMessage,
  DanmakuOnlineMessage
} from '../model/types.js';

export interface DouyinDanmakuClientOptions {
  /** WebSocket 工厂（默认 Node ws，未来移动端可替换） */
  factory?: WebSocketFactory;
  logger?: Logger;
}

/**
 * 抖音弹幕客户端
 * 协议：WebSocket + Protobuf（PushFrame 包 gzip 压缩的 Response）
 */
export class DouyinDanmakuClient implements DanmakuClient {
  /** 心跳间隔（抖音要求 10s 以内） */
  heartBeatTime = 10 * 1000;

  private readonly serverUrl =
    'wss://webcast3-ws-web-lq.douyin.com/webcast/im/push/v2/';

  onMessage?: (message: DanmakuMessage) => void;
  onClose?: (reason: string) => void;
  onReady?: () => void;

  private readonly factory: WebSocketFactory;
  private readonly logger: Logger;
  private utils: WebSocketUtils | null = null;
  private stopped = false;

  constructor(options: DouyinDanmakuClientOptions = {}) {
    this.factory = options.factory ?? nodeWebSocketFactory;
    this.logger = options.logger ?? defaultLogger;
  }

  start(args: DouyinDanmakuArgs): void {
    this.stopped = false;
    const { url, backupUrl } = this.buildUrl(args);
    this.logger.debug(`弹幕连接: room_id=${args.roomId}`);

    this.utils = new WebSocketUtils({
      url,
      backupUrl,
      heartBeatTime: this.heartBeatTime,
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        Cookie: args.cookie,
        Origin: 'https://live.douyin.com'
      },
      factory: this.factory,
      onMessage: (data) => this.decodeMessage(data),
      onReady: () => this.onReady?.(),
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

  private buildUrl(args: DouyinDanmakuArgs): {
    url: string;
    backupUrl: string;
  } {
    const timestamp = Date.now();
    const uri = new URL(this.serverUrl);
    const params: Record<string, string> = {
      app_name: 'douyin_web',
      version_code: '180800',
      webcast_sdk_version: '1.3.0',
      update_version_code: '1.3.0',
      compress: 'gzip',
      cursor: `h-1_t-${timestamp}_r-1_d-1_u-1`,
      host: 'https://live.douyin.com',
      aid: '6383',
      live_id: '1',
      did_rule: '3',
      debug: 'false',
      maxCacheMessageNumber: '20',
      endpoint: 'live_pc',
      support_wrds: '1',
      im_path: '/webcast/im/fetch/',
      user_unique_id: args.userId,
      device_platform: 'web',
      cookie_enabled: 'true',
      screen_width: '1920',
      screen_height: '1080',
      browser_language: 'zh-CN',
      browser_platform: 'Win32',
      browser_name: 'Mozilla',
      browser_version: DEFAULT_USER_AGENT.replace('Mozilla/', ''),
      browser_online: 'true',
      tz_name: 'Asia/Shanghai',
      identity: 'audience',
      room_id: args.roomId,
      heartbeatDuration: '0'
    };
    for (const [key, value] of Object.entries(params)) {
      uri.searchParams.set(key, value);
    }

    const signature = getSignature(args.roomId, args.userId);
    const url = `${uri.toString()}&signature=${signature}`;
    const backupUrl = url.replace('webcast3-ws-web-lq', 'webcast5-ws-web-lf');
    return { url, backupUrl };
  }

  private heartbeat(): void {
    const frame = douyin.PushFrame.create({ payloadType: 'hb' });
    this.utils?.sendMessage(douyin.PushFrame.encode(frame).finish());
  }

  private sendAck(
    logId: douyin.PushFrame['logId'],
    internalExt: string
  ): void {
    const frame = douyin.PushFrame.create({
      logId,
      payloadType: internalExt
    });
    this.utils?.sendMessage(douyin.PushFrame.encode(frame).finish());
  }

  private decodeMessage(data: Uint8Array): void {
    try {
      const wssPackage = douyin.PushFrame.decode(data);
      if (!wssPackage.payload || wssPackage.payload.length === 0) {
        return;
      }
      const decompressed = ungzip(wssPackage.payload);
      const payloadPackage = douyin.Response.decode(decompressed);

      if (payloadPackage.needAck) {
        this.sendAck(wssPackage.logId, payloadPackage.internalExt ?? '');
      }

      for (const msg of payloadPackage.messagesList) {
        if (msg.method === 'WebcastChatMessage') {
          this.unpackChatMessage(msg.payload);
        } else if (msg.method === 'WebcastRoomUserSeqMessage') {
          this.unpackRoomUserSeqMessage(msg.payload);
        }
      }
    } catch (error) {
      this.logger.error('解析弹幕消息失败', error);
    }
  }

  private unpackChatMessage(payload: Uint8Array | null | undefined): void {
    if (!payload || payload.length === 0) {
      return;
    }
    const chatMessage = douyin.ChatMessage.decode(payload);
    this.onMessage?.({
      type: 'chat',
      userName: chatMessage.user?.nickName ?? '',
      message: chatMessage.content ?? ''
    });
  }

  private unpackRoomUserSeqMessage(
    payload: Uint8Array | null | undefined
  ): void {
    if (!payload || payload.length === 0) {
      return;
    }
    const roomUserSeqMessage = douyin.RoomUserSeqMessage.decode(payload);
    this.onMessage?.({
      type: 'online',
      online: Number(roomUserSeqMessage.totalUser ?? 0)
    });
  }

  stop(): void {
    this.stopped = true;
    this.onMessage = undefined;
    this.onClose = undefined;
    this.utils?.close();
    this.utils = null;
  }
}
