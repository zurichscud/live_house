import { useCallback, useEffect, useRef, useState } from 'react';
import type { SiteId } from '@live-house/core';

export interface DanmakuChatItem {
  id: number;
  userName: string;
  message: string;
}

export type DanmakuStatus = 'idle' | 'connecting' | 'ready' | 'closed';

let messageId = 0;

/**
 * 弹幕订阅 Hook：
 * - 主进程推送的消息先进入缓冲区，每 400ms 批量刷新到 state（避免高频 setState 卡顿）
 * - 聊天列表仅保留最近 300 条
 */
export function useDanmaku() {
  const [chatItems, setChatItems] = useState<DanmakuChatItem[]>([]);
  const [online, setOnline] = useState(0);
  const [status, setStatus] = useState<DanmakuStatus>('idle');
  const chatBuffer = useRef<DanmakuChatItem[]>([]);

  useEffect(() => {
    const offMessage = window.api.danmaku.onMessage((message) => {
      if (message.type === 'chat') {
        chatBuffer.current.push({
          id: ++messageId,
          userName: message.userName,
          message: message.message
        });
      } else if (message.type === 'online') {
        setOnline(message.online);
      }
    });
    const offReady = window.api.danmaku.onReady(() => setStatus('ready'));
    const offClose = window.api.danmaku.onClose(() => setStatus('closed'));

    const timer = setInterval(() => {
      if (chatBuffer.current.length === 0) {
        return;
      }
      const batch = chatBuffer.current;
      chatBuffer.current = [];
      setChatItems((prev) => {
        const next = [...prev, ...batch];
        return next.length > 300 ? next.slice(next.length - 300) : next;
      });
    }, 400);

    return () => {
      offMessage();
      offReady();
      offClose();
      clearInterval(timer);
    };
  }, []);

  const start = useCallback((site: SiteId, args: unknown) => {
    setChatItems([]);
    setOnline(0);
    setStatus('connecting');
    void window.api.danmaku.start(site, args);
  }, []);

  const stop = useCallback(() => {
    void window.api.danmaku.stop();
    setStatus('idle');
  }, []);

  return { chatItems, online, status, start, stop };
}
