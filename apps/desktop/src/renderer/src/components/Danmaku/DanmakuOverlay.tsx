import { useEffect, useRef } from 'react';

export interface DanmakuOverlayItem {
  id: number;
  text: string;
}

interface ActiveItem {
  text: string;
  x: number;
  lane: number;
  width: number;
}

const SPEED_RATIO = 0.21; // px/s per px of canvas height
const MAX_ACTIVE = 200;
const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';

interface Layout {
  width: number;
  height: number;
  fontSize: number;
  laneHeight: number;
}

/**
 * Canvas 飘屏弹幕：只覆盖视频实际显示区域（object-contain 的 letterbox 内），
 * 字号与轨道高度随视频显示尺寸缩放。
 */
export function DanmakuOverlay({
  items,
  enabled
}: {
  items: DanmakuOverlayItem[];
  enabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pendingRef = useRef<DanmakuOverlayItem[]>([]);
  const activeRef = useRef<ActiveItem[]>([]);
  const lastIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const fresh = items.filter((item) => item.id > lastIdRef.current);
    if (fresh.length > 0) {
      lastIdRef.current = fresh[fresh.length - 1].id;
      pendingRef.current.push(...fresh);
    }
  }, [items, enabled]);

  useEffect(() => {
    if (!enabled) {
      pendingRef.current = [];
      activeRef.current = [];
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    let raf = 0;
    let lastTime = performance.now();
    const layout: Layout = { width: 0, height: 0, fontSize: 15, laneHeight: 30 };

    /** 同步画布到视频内容区域（含 letterbox 计算） */
    const syncLayout = (): void => {
      const container = canvas.parentElement;
      if (!container) {
        return;
      }
      const video = canvas
        .closest('[data-testid="live-player"]')
        ?.querySelector('video');
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const videoWidth = video?.videoWidth || containerWidth;
      const videoHeight = video?.videoHeight || containerHeight;
      if (containerWidth === 0 || containerHeight === 0) {
        return;
      }
      const scale = Math.min(
        containerWidth / videoWidth,
        containerHeight / videoHeight
      );
      const width = Math.round(videoWidth * scale);
      const height = Math.round(videoHeight * scale);
      if (width === layout.width && height === layout.height) {
        return;
      }

      layout.width = width;
      layout.height = height;
      layout.fontSize = Math.round(Math.max(14, Math.min(24, height * 0.023)));
      layout.laneHeight = Math.round(layout.fontSize * 1.9);

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.style.left = `${Math.round((containerWidth - width) / 2)}px`;
      canvas.style.top = `${Math.round((containerHeight - height) / 2)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = 'top';
    };

    syncLayout();
    const observer = new ResizeObserver(() => syncLayout());
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    const tick = (now: number): void => {
      syncLayout();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const { width, height, fontSize, laneHeight } = layout;
      const laneCount = Math.max(1, Math.floor(height / laneHeight));
      const speed = Math.max(120, height * SPEED_RATIO);
      ctx.font = `500 ${fontSize}px ${FONT_FAMILY}`;

      // 每条轨道最右侧弹幕的右边缘
      const laneRightEdge = new Array<number>(laneCount).fill(-Infinity);
      for (const item of activeRef.current) {
        const lane = Math.min(item.lane, laneCount - 1);
        laneRightEdge[lane] = Math.max(laneRightEdge[lane], item.x + item.width);
      }

      while (
        pendingRef.current.length > 0 &&
        activeRef.current.length < MAX_ACTIVE
      ) {
        const next = pendingRef.current[0];
        const textWidth = ctx.measureText(next.text).width;
        let lane = -1;
        for (let i = 0; i < laneCount; i++) {
          if (laneRightEdge[i] < width - 24) {
            lane = i;
            break;
          }
        }
        if (lane === -1) {
          break;
        }
        pendingRef.current.shift();
        activeRef.current.push({
          text: next.text,
          x: width,
          lane,
          width: textWidth
        });
        laneRightEdge[lane] = width + textWidth;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.font = `500 ${fontSize}px ${FONT_FAMILY}`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;

      const alive: ActiveItem[] = [];
      for (const item of activeRef.current) {
        item.x -= speed * dt;
        if (item.x + item.width > -12) {
          const lane = Math.min(item.lane, laneCount - 1);
          ctx.fillText(item.text, item.x, lane * laneHeight + 6);
          alive.push(item);
        }
      }
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      activeRef.current = alive;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute"
      style={{ display: enabled ? 'block' : 'none' }}
    />
  );
}
