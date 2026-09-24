import { brotliDecompressSync } from 'node:zlib';
import { inflate } from 'pako';
import type { DanmakuClient } from '../api/site.js';
import { defaultLogger, type Logger } from '../common/logger.js';
import {
  nodeWebSocketFactory,
  WebSocketUtils,
  type WebSocketFactory
} from '../common/websocket.js';
import type { DanmakuMessage } from '../model/types.js';

/** 与 Dart 端 BiliBiliSite.kDefaultUserAgent 一致 */
export const BILIBILI_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0';

/** 与 Dart 端 BiliBiliSite.kDefaultReferer 一致 */
export const BILIBILI_REFERER = 'https://live.bilibili.com/';

/** B 站弹幕连接参数（经 Electron IPC 传递，必须是可结构化克隆的纯对象） */
export interface BilibiliDanmakuArgs {
  /** 真实房间号（非短号） */
  roomId: number;
  /** 登录用户 uid（未登录为 0） */
  uid: number;
  /** 鉴权 token（getDanmuInfo 返回） */
  token: string;
  /** 弹幕服务器主机名（不含 wss:// 前缀） */
  serverHost: string;
  /** 设备指纹 buvid3（可为空） */
  buvid: string;
  /** 完整 cookie（可为空） */
  cookie: string;
}

/** 数据包头部长度固定 16 字节：总长度(4) + 头部长度(2) + 协议版本(2) + 操作类型(4) + 序号(4) */
const HEADER_LENGTH = 16;

/** 协议版本：0/1=JSON，2=zlib 压缩的包序列，3=brotli 压缩的包序列 */
const PROTOCOL_ZLIB = 2;
const PROTOCOL_BROTLI = 3;

/** 操作类型：2=心跳，3=心跳回应（人气值），5=通知（弹幕等），7=鉴权，8=鉴权回应 */
const OPERATION_HEARTBEAT = 2;
const OPERATION_HEARTBEAT_REPLY = 3;
const OPERATION_MESSAGE = 5;
const OPERATION_AUTH = 7;

export interface BilibiliDanmakuClientOptions {
  /** WebSocket 工厂（默认 Node ws，未来移动端可替换） */
  factory?: WebSocketFactory;
  logger?: Logger;
}

function asString(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

/** 按 B 站协议编码一个数据包（大端序） */
function encodePacket(body: string | Uint8Array, operation: number): Uint8Array {
  const payload =
    typeof body === 'string' ? new TextEncoder().encode(body) : body;
  const buffer = new Uint8Array(HEADER_LENGTH + payload.length);
  const view = new DataView(buffer.buffer);
  view.setInt32(0, buffer.length);
  view.setInt16(4, HEADER_LENGTH);
  view.setInt16(6, 0);
  view.setInt32(8, operation);
  view.setInt32(12, 1);
  buffer.set(payload, HEADER_LENGTH);
  return buffer;
}

/** 读取大端 int32（buffer 可能来自 subarray，需要带上 byteOffset） */
function readInt32(buffer: Uint8Array, offset: number): number {
  return new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength
  ).getInt32(offset);
}

/**
 * 哔哩哔哩弹幕客户端
 * 协议：WebSocket 二进制包（16 字节头 + JSON/压缩包体），
 * 鉴权（op=7）后按 30s 心跳（op=2），弹幕走 op=5，人气值走 op=3。
 */
export class BilibiliDanmakuClient implements DanmakuClient {
  /** 心跳间隔（B 站要求 30s 内） */
  heartBeatTime = 30 * 1000;

  onMessage?: (message: DanmakuMessage) => void;
  onClose?: (reason: string) => void;
  onReady?: () => void;

  private readonly factory: WebSocketFactory;
  private readonly logger: Logger;
  private utils: WebSocketUtils | null = null;
  private stopped = false;

  constructor(options: BilibiliDanmakuClientOptions = {}) {
    this.factory = options.factory ?? nodeWebSocketFactory;
    this.logger = options.logger ?? defaultLogger;
  }

  start(args: BilibiliDanmakuArgs): void {
    this.stopped = false;
    const headers: Record<string, string> = {
      'User-Agent': BILIBILI_USER_AGENT,
      Origin: 'https://live.bilibili.com'
    };
    if (args.cookie) {
      headers['Cookie'] = args.cookie;
    }
    this.logger.debug(
      `B站弹幕连接: room_id=${args.roomId} host=${args.serverHost}`
    );

    this.utils = new WebSocketUtils({
      url: `wss://${args.serverHost}/sub`,
      heartBeatTime: this.heartBeatTime,
      headers,
      factory: this.factory,
      onMessage: (data) => this.decodeMessage(data),
      onReady: () => {
        this.onReady?.();
        this.joinRoom(args);
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

  /** 发送鉴权包，随后立刻补一次心跳以尽快拿到人气值 */
  private joinRoom(args: BilibiliDanmakuArgs): void {
    const authBody = JSON.stringify({
      uid: args.uid,
      roomid: args.roomId,
      protover: 3,
      buvid: args.buvid,
      platform: 'web',
      type: 2,
      key: args.token
    });
    this.utils?.sendMessage(encodePacket(authBody, OPERATION_AUTH));
    this.heartbeat();
  }

  private heartbeat(): void {
    this.utils?.sendMessage(encodePacket('', OPERATION_HEARTBEAT));
  }

  private decodeMessage(data: Uint8Array): void {
    try {
      this.decodePackets(data);
    } catch (error) {
      this.logger.error('解析 B 站弹幕数据包失败', error);
    }
  }

  /** 依次拆出同一次消息中的多个数据包（压缩包解压后同样是一串数据包） */
  private decodePackets(buffer: Uint8Array): void {
    const view = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );
    let offset = 0;
    while (offset + HEADER_LENGTH <= buffer.length) {
      const packetLength = view.getInt32(offset);
      const headerLength = view.getInt16(offset + 4);
      const protocolVersion = view.getInt16(offset + 6);
      const operation = view.getInt32(offset + 8);
      if (packetLength < headerLength || offset + packetLength > buffer.length) {
        // 数据包不完整，丢弃剩余数据
        break;
      }
      const body = buffer.subarray(offset + headerLength, offset + packetLength);
      this.handlePacket(protocolVersion, operation, body);
      offset += packetLength;
    }
  }

  private handlePacket(
    protocolVersion: number,
    operation: number,
    body: Uint8Array
  ): void {
    if (operation === OPERATION_HEARTBEAT_REPLY) {
      const online = body.length >= 4 ? readInt32(body, 0) : 0;
      // 匿名连接下 B 站心跳回应恒为占位值 1（实测多个房间），
      // 此时不推送，避免覆盖房间详情里真实的在线人气值
      if (online > 1) {
        this.onMessage?.({ type: 'online', online });
      }
      return;
    }
    if (operation !== OPERATION_MESSAGE) {
      return;
    }
    if (protocolVersion === PROTOCOL_ZLIB) {
      this.decodePackets(inflate(body));
      return;
    }
    if (protocolVersion === PROTOCOL_BROTLI) {
      this.decodePackets(brotliDecompressSync(body));
      return;
    }
    this.parseMessages(new TextDecoder().decode(body));
  }

  private parseMessages(text: string): void {
    const groups = text
      .split(/[\x00-\x1f]+/)
      .filter((item) => item.length > 2 && item.startsWith('{'));
    for (const group of groups) {
      this.parseMessage(group);
    }
  }

  private parseMessage(jsonText: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return;
    }
    const message = asRecord(parsed);
    if (!message) {
      return;
    }
    const cmd = asString(message['cmd']);
    if (!cmd.includes('DANMU_MSG')) {
      return;
    }
    const info = message['info'];
    if (!Array.isArray(info) || info.length < 3) {
      return;
    }
    const content = asString(info[1]);
    const userInfo = info[2];
    if (!Array.isArray(userInfo) || userInfo.length < 2) {
      return;
    }
    this.onMessage?.({
      type: 'chat',
      userName: asString(userInfo[1]),
      message: content
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
