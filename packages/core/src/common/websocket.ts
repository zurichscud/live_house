import WebSocket from 'ws';
import { defaultLogger, type Logger } from './logger.js';

export interface WebSocketLike {
  send(data: Uint8Array): void;
  close(): void;
}

export interface WebSocketHandlers {
  onOpen?: () => void;
  onMessage?: (data: Uint8Array) => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (error: Error) => void;
}

export type WebSocketFactory = (
  url: string,
  headers: Record<string, string>,
  handlers: WebSocketHandlers
) => WebSocketLike;

/** 默认 WebSocket 工厂：Node 环境（Electron 主进程）使用 ws 库，可自定义请求头 */
export const nodeWebSocketFactory: WebSocketFactory = (
  url,
  headers,
  handlers
) => {
  const ws = new WebSocket(url, { headers, handshakeTimeout: 10000 });

  ws.on('open', () => handlers.onOpen?.());
  ws.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
    if (Buffer.isBuffer(data)) {
      handlers.onMessage?.(new Uint8Array(data));
    } else if (data instanceof ArrayBuffer) {
      handlers.onMessage?.(new Uint8Array(data));
    } else if (Array.isArray(data)) {
      handlers.onMessage?.(new Uint8Array(Buffer.concat(data)));
    }
  });
  ws.on('close', (code, reason) =>
    handlers.onClose?.(code, reason.toString())
  );
  ws.on('error', (error) => handlers.onError?.(error));

  return {
    send: (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    },
    close: () => ws.close()
  };
};

type SocketStatus = 'connected' | 'failed' | 'closed';

export interface WebSocketUtilsOptions {
  url: string;
  backupUrl?: string;
  heartBeatTime: number;
  headers?: Record<string, string>;
  factory: WebSocketFactory;
  onMessage?: (data: Uint8Array) => void;
  onReady?: () => void;
  onHeartBeat?: () => void;
  onReconnect?: () => void;
  onClose?: (message: string) => void;
  logger?: Logger;
}

/** 移植自 Dart 端 WebScoketUtils：主备地址、心跳、断线重连 */
export class WebSocketUtils {
  private status: SocketStatus = 'closed';
  private socket: WebSocketLike | null = null;
  private heartBeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTime = 0;
  private readonly maxReconnectTime = 5;
  private stopped = false;

  constructor(private readonly options: WebSocketUtilsOptions) {}

  connect(retry = false): void {
    this.closeSocket();
    const { url, backupUrl, factory, headers, logger = defaultLogger } =
      this.options;
    const targetUrl = retry && backupUrl ? backupUrl : url;

    try {
      this.socket = factory(targetUrl, headers ?? {}, {
        onOpen: () => this.onOpen(),
        onMessage: (data) => this.onMessage(data),
        onClose: () => this.onDone(),
        onError: (error) => this.onError(error)
      });
    } catch (error) {
      if (!retry) {
        this.connect(true);
        return;
      }
      logger.error('WebSocket 连接失败', error);
      this.status = 'failed';
      this.options.onClose?.(String(error));
    }
  }

  private onOpen(): void {
    this.status = 'connected';
    this.options.onReady?.();
    this.startHeartBeat();
  }

  private onMessage(data: Uint8Array): void {
    // 收到任意一条消息才算重连成功
    this.reconnectTime = 0;
    this.options.onMessage?.(data);
  }

  private onError(error: Error): void {
    this.status = 'failed';
    this.options.onClose?.(error.message);
  }

  private onDone(): void {
    if (this.stopped || this.status === 'closed') {
      return;
    }
    this.options.onReconnect?.();
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    this.status = 'closed';
    if (this.reconnectTime >= this.maxReconnectTime) {
      this.options.onClose?.('重连超过最大次数，与服务器断开连接');
      this.cleanup();
      return;
    }
    this.reconnectTime++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  private startHeartBeat(): void {
    this.stopHeartBeat();
    this.heartBeatTimer = setInterval(() => {
      this.options.onHeartBeat?.();
    }, this.options.heartBeatTime);
  }

  private stopHeartBeat(): void {
    if (this.heartBeatTimer) {
      clearInterval(this.heartBeatTimer);
      this.heartBeatTimer = null;
    }
  }

  sendMessage(data: Uint8Array): void {
    if (this.status === 'connected') {
      this.socket?.send(data);
    }
  }

  /** 仅关闭当前连接，保留重连能力 */
  private closeSocket(): void {
    this.stopHeartBeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  private cleanup(): void {
    this.stopped = true;
    this.closeSocket();
    this.status = 'closed';
  }

  close(): void {
    this.stopped = true;
    this.closeSocket();
    this.status = 'closed';
  }
}
