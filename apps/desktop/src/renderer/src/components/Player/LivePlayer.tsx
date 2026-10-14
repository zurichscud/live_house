import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import {
  ChevronUp,
  Clock,
  ExternalLink,
  Maximize,
  MessageSquareOff,
  MessageSquareText,
  Minimize,
  PanelBottomClose,
  PanelBottomOpen,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  PictureInPicture2,
  Play,
  RotateCw,
  TriangleAlert,
  Volume1,
  Volume2,
  VolumeX
} from 'lucide-react';
import type { LivePlayQuality, LiveRoomDetail } from '@live-house/core';
import { LivePlayerController } from '@/lib/player';
import { formatDuration, formatOnline } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  getPlayerMuted,
  getPlayerVolume,
  savePlayerMuted,
  savePlayerVolume
} from '@/lib/player-prefs';
import { usePortrait } from '@/hooks/usePortrait';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';
import { VolumeSlider } from '@/components/ui/volume-slider';
import { LiveBadge } from '@/components/Status';

interface Props {
  detail: LiveRoomDetail;
  qualities: LivePlayQuality[];
  /** 实时人气（弹幕推送优先），缺省使用房间详情值 */
  online?: number;
  danmakuEnabled: boolean;
  onToggleDanmaku: () => void;
  /** 侧边弹幕面板是否已收起（仅窗口模式控制栏显示收起/展开键） */
  danmakuPanelCollapsed?: boolean;
  onToggleDanmakuPanel?: () => void;
  onRefresh?: () => void;
  onOpenExternal?: () => void;
  /** 打开小窗模式（提供时窗口模式控制栏显示小窗按钮） */
  onOpenMini?: () => void;
  /**
   * 挂起（小窗模式接管期间）：停止拉流，但保留播放器实例与画质 / 线路 / 计时状态；
   * 恢复时用最新地址重连，避免整块播放器重建导致的卡顿
   */
  suspended?: boolean;
  /** 紧凑模式（小窗）：只保留播放 / 音量 / 弹幕开关 */
  compact?: boolean;
  className?: string;
  /** 弹幕覆盖层等叠加内容 */
  children?: React.ReactNode;
}

type Tone = 'overlay' | 'docked';

/** 解析平台开播时间（B 站 live_start_time，秒级时间戳字符串）；非法或未来时间返回 null */
function parseLiveStartTime(showTime?: string): number | null {
  if (!showTime) {
    return null;
  }
  const value = Number(showTime);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  const ms = value > 1e12 ? value : value * 1000;
  return ms <= Date.now() ? ms : null;
}

const toneStyles: Record<
  Tone,
  { btn: string; btnActive: string; divider: string; popup: string }
> = {
  overlay: {
    btn: 'text-white/75 hover:bg-white/15 hover:text-white',
    btnActive: 'text-white',
    divider: 'bg-white/20',
    popup: 'border-white/15 bg-black/80'
  },
  docked: {
    btn: 'text-ink-2 hover:bg-raised hover:text-ink',
    btnActive: 'text-ink',
    divider: 'bg-line',
    popup: 'border-line bg-raised'
  }
};

function ControlButton({
  tone,
  label,
  testId,
  active = false,
  side = 'top',
  onClick,
  children
}: {
  tone: Tone;
  label: string;
  testId?: string;
  active?: boolean;
  /** tooltip 方位，避免与音量浮出滑块等浮层重叠 */
  side?: 'top' | 'bottom' | 'left' | 'right';
  onClick: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Tooltip label={label} side={side}>
      <button
        type="button"
        data-testid={testId}
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-sm transition-colors duration-150 ease-out-expo',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
          toneStyles[tone].btn,
          active && toneStyles[tone].btnActive
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

interface MenuTriggerProps extends ComponentPropsWithoutRef<'button'> {
  tone: Tone;
  label: string;
  value: string;
}

/** 下拉触发器：必须透传 props（asChild 依赖），否则 Radix 无法接管交互 */
function MenuTrigger({
  tone,
  label,
  value,
  className,
  ...props
}: MenuTriggerProps) {
  return (
    <button
      type="button"
      data-testid={`${label}-trigger`}
      aria-label={label}
      className={cn(
        'flex h-8 shrink-0 items-center gap-1 rounded-sm px-2 text-label transition-colors duration-150 ease-out-expo',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
        toneStyles[tone].btn,
        className
      )}
      {...props}
    >
      {value}
      <ChevronUp className="size-3.5" strokeWidth={2} aria-hidden />
    </button>
  );
}

export function LivePlayer({
  detail,
  qualities,
  online,
  danmakuEnabled,
  onToggleDanmaku,
  danmakuPanelCollapsed = false,
  onToggleDanmakuPanel,
  onRefresh,
  onOpenExternal,
  onOpenMini,
  suspended = false,
  compact = false,
  className,
  children
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controllerRef = useRef<LivePlayerController | null>(null);
  const retryRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef({ qualities, qualityIndex: 0, lineIndex: 0 });
  /** 本次进入直播间开始播放的时刻：平台不给开播时间时的计时起点 */
  const startedAtRef = useRef(Date.now());

  const [qualityIndex, setQualityIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  /** 连接中（首次加载 / 切换画质或线路 / 重连）：与用户暂停区分，暂停不显示连接提示 */
  const [connecting, setConnecting] = useState(true);
  const [muted, setMuted] = useState(getPlayerMuted);
  const [volume, setVolume] = useState(getPlayerVolume);
  const [menuOpen, setMenuOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  /** 竖屏：弹幕面板在播放器下方，收起/展开键的图标随之改为上下方向 */
  const portrait = usePortrait();

  stateRef.current = { qualities, qualityIndex, lineIndex };

  // 直播计时：每秒推进一次
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const platformStart = parseLiveStartTime(detail.showTime);
  const liveStartedAt = platformStart ?? startedAtRef.current;
  const liveDuration = formatDuration(now - liveStartedAt);

  const handleError = useCallback((message: string) => {
    const state = stateRef.current;
    const urls =
      (state.qualities[state.qualityIndex]?.data as string[] | undefined) ?? [];
    // 1. 同画质切换协议（FLV -> HLS）
    if (state.lineIndex < urls.length - 1) {
      setLineIndex(state.lineIndex + 1);
      return;
    }
    // 2. 原地重试
    if (retryRef.current < 3) {
      retryRef.current++;
      setTimeout(() => {
        setBuffering(false);
        setConnecting(true);
        controllerRef.current?.reload();
      }, 2000);
      return;
    }
    setError(message);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const controller = new LivePlayerController(video, {
      onError: handleError,
      onPlaying: () => {
        setPlaying(true);
        setError('');
      }
    });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [handleError]);

  // 画质 / 线路变化时重新播放；挂起（小窗接管）期间停止拉流，恢复时用最新地址重连
  useEffect(() => {
    if (suspended) {
      controllerRef.current?.stop();
      setBuffering(false);
      setConnecting(false);
      setPlaying(false);
      return;
    }
    const urls = (qualities[qualityIndex]?.data as string[] | undefined) ?? [];
    const url = urls[lineIndex];
    if (!url) {
      return;
    }
    retryRef.current = 0;
    setError('');
    setBuffering(false);
    setConnecting(true);
    controllerRef.current?.play(url);
  }, [qualities, qualityIndex, lineIndex, suspended]);

  // 进入小窗模式时退出全屏，否则全屏层里看不到主窗口的「正在小窗播放」占位
  useEffect(() => {
    if (suspended && document.fullscreenElement) {
      void document.exitFullscreen();
    }
  }, [suspended]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = muted;
    }
    savePlayerVolume(volume);
    savePlayerMuted(muted);
  }, [volume, muted]);

  useEffect(() => {
    const onChange = (): void =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // 全屏浮层控制条：播放中 2.5s 后自动隐藏
  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(
      () => setControlsVisible(false),
      CONTROLS_HIDE_DELAY
    );
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }
    if (!playing) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      setControlsVisible(true);
      return;
    }
    revealControls();
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [playing, isFullscreen, revealControls]);

  const overlayShown = controlsVisible || menuOpen || !playing;

  const toggleFullscreen = (): void => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
  };

  const togglePlay = (): void => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const currentQuality = qualities[qualityIndex];
  const currentUrls = (currentQuality?.data as string[] | undefined) ?? [];
  const VolumeIcon =
    muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  /** 弹幕面板收起/展开键的图标：竖屏时面板在播放器下方，横屏时在右侧 */
  const DanmakuPanelIcon = portrait
    ? danmakuPanelCollapsed
      ? PanelBottomOpen
      : PanelBottomClose
    : danmakuPanelCollapsed
      ? PanelRightOpen
      : PanelRightClose;

  /** 播放控制：窗口模式停靠在播放器下方，全屏模式作为浮层 */
  const renderControls = (tone: Tone): React.JSX.Element => (
    <>
      <ControlButton tone={tone} label={playing ? '暂停' : '播放'} onClick={togglePlay}>
        {playing ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 fill-current" />
        )}
      </ControlButton>

      <div className="group/vol relative flex items-center">
        <ControlButton
          tone={tone}
          label={muted ? '取消静音' : '静音'}
          side="right"
          onClick={() => setMuted((value) => !value)}
        >
          <VolumeIcon className="size-4" />
        </ControlButton>
        {/* 垂直音量滑块：悬停 / 聚焦音量键时从上方浮出 */}
        <div
          className={cn(
            'pointer-events-none absolute bottom-full left-1/2 z-[var(--z-dropdown)] -translate-x-1/2 pb-1.5 opacity-0 transition-opacity duration-150 ease-out-expo',
            'group-hover/vol:pointer-events-auto group-hover/vol:opacity-100',
            'group-focus-within/vol:pointer-events-auto group-focus-within/vol:opacity-100'
          )}
        >
          <div
            className={cn(
              'rounded-sm border p-2 shadow-[0_12px_32px_rgba(0,0,0,0.5)]',
              toneStyles[tone].popup
            )}
          >
            <VolumeSlider
              tone={tone}
              value={muted ? 0 : volume}
              ariaLabel="音量"
              onChange={(value) => {
                setVolume(value);
                setMuted(value === 0);
              }}
            />
          </div>
        </div>
      </div>

      {!compact && (
        <>
          <div
            className={cn('mx-1 h-5 w-px shrink-0', toneStyles[tone].divider)}
            aria-hidden
          />

          <Dropdown
            onOpenChange={setMenuOpen}
            value={String(qualityIndex)}
            onSelect={(value) => {
              setQualityIndex(Number(value));
              setLineIndex(0);
            }}
            items={qualities.map((quality, index) => ({
              value: String(index),
              label: quality.quality
            }))}
            trigger={
              <MenuTrigger
                tone={tone}
                label="画质"
                value={currentQuality?.quality ?? '画质'}
              />
            }
          />

          <Dropdown
            onOpenChange={setMenuOpen}
            value={String(lineIndex)}
            onSelect={(value) => setLineIndex(Number(value))}
            items={currentUrls.map((url, index) => ({
              value: String(index),
              label: `线路 ${index + 1}（${url.includes('.m3u8') ? 'HLS' : 'FLV'}）`
            }))}
            trigger={
              <MenuTrigger tone={tone} label="线路" value={`线路 ${lineIndex + 1}`} />
            }
          />

          {tone === 'docked' && onRefresh && (
            <ControlButton tone={tone} label="刷新直播间" onClick={onRefresh}>
              <RotateCw className="size-4" />
            </ControlButton>
          )}
        </>
      )}

      <div className="flex-1" />

      {/* 直播计时：优先平台开播时间（B 站），其余平台从进入直播间起算 */}
      <span
        data-testid="live-timer"
        title={platformStart ? '直播已开播时长' : '本次观看时长'}
        className={cn(
          'tnum flex h-8 shrink-0 select-none items-center gap-1.5 px-2 text-caption',
          tone === 'overlay' ? 'text-white/70' : 'text-ink-3'
        )}
      >
        <Clock className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
        {liveDuration}
      </span>

      <ControlButton
        tone={tone}
        label={danmakuEnabled ? '关闭弹幕' : '开启弹幕'}
        active={danmakuEnabled}
        onClick={onToggleDanmaku}
      >
        {danmakuEnabled ? (
          <MessageSquareText className="size-4" />
        ) : (
          <MessageSquareOff className="size-4" />
        )}
      </ControlButton>

      {!compact && (
        <>
          {onOpenMini && (
            <ControlButton
              tone={tone}
              testId="player-mini"
              label="小窗模式"
              onClick={onOpenMini}
            >
              <PictureInPicture2 className="size-4" />
            </ControlButton>
          )}

          <ControlButton
            tone={tone}
            label={isFullscreen ? '退出全屏' : '全屏'}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="size-4" />
            ) : (
              <Maximize className="size-4" />
            )}
          </ControlButton>

          {tone === 'docked' && onOpenExternal && (
            <>
              <div
                className={cn('mx-1 h-5 w-px shrink-0', toneStyles[tone].divider)}
                aria-hidden
              />
              <ControlButton
                tone={tone}
                label="在浏览器打开"
                onClick={onOpenExternal}
              >
                <ExternalLink className="size-4" />
              </ControlButton>
            </>
          )}

          {tone === 'docked' && onToggleDanmakuPanel && (
            <ControlButton
              tone={tone}
              testId="danmaku-panel-toggle"
              label={danmakuPanelCollapsed ? '展开弹幕面板' : '收起弹幕面板'}
              onClick={onToggleDanmakuPanel}
            >
              <DanmakuPanelIcon className="size-4" />
            </ControlButton>
          )}
        </>
      )}
    </>
  );

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {/* 播放器画面 */}
      <div
        ref={containerRef}
        data-testid="live-player"
        className={cn(
          'group/player relative min-h-0 flex-1 overflow-hidden',
          isFullscreen && 'h-full bg-black',
          isFullscreen && (overlayShown ? 'cursor-default' : 'cursor-none')
        )}
        onMouseMove={isFullscreen && playing ? revealControls : undefined}
        onMouseLeave={() => {
          if (isFullscreen && playing && !menuOpen) {
            setControlsVisible(false);
          }
        }}
        onFocusCapture={() => {
          if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
          }
          setControlsVisible(true);
        }}
        onDoubleClick={compact ? undefined : toggleFullscreen}
      >
        {/* 画面区撑满播放器容器：视频等比居中，letterbox 与播放器底色一致 */}
        <div className="absolute inset-0">
          <div
            className={cn(
              'relative size-full overflow-hidden bg-black',
              !isFullscreen && 'rounded-md'
            )}
          >
          <video
            ref={videoRef}
            className="size-full object-contain"
            autoPlay
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => {
              setPlaying(true);
              setBuffering(false);
              setConnecting(false);
            }}
          />

            {/* 弹幕覆盖层 */}
            <div className="absolute inset-0 z-10">{children}</div>

            {/* 缓冲指示 */}
            {playing && buffering && !error && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-black/60">
                  <RotateCw className="size-4 animate-spin-slow text-white/90" />
                </span>
              </div>
            )}

            {/* 连接中（首次加载 / 切换画质或线路 / 重连）：用户暂停时不显示 */}
            {connecting && !playing && !error && detail.status && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black">
                {detail.cover && (
                  <img
                    src={detail.cover}
                    alt=""
                    className="absolute inset-0 size-full object-cover opacity-15"
                  />
                )}
                <Spinner
                  label="正在连接直播流…"
                  className="relative z-10 text-ink-2"
                />
              </div>
            )}

            {/* 未开播 */}
            {!detail.status && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black">
                {detail.cover && (
                  <img
                    src={detail.cover}
                    alt=""
                    className="absolute inset-0 size-full object-cover opacity-20"
                  />
                )}
                <p className="relative z-10 text-body font-medium text-ink-2">
                  主播暂未开播
                </p>
                <p className="relative z-10 text-caption text-ink-3">
                  开播后重新进入即可观看
                </p>
                {onRefresh && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="relative z-10 mt-2"
                    onClick={onRefresh}
                  >
                    <RotateCw className="size-3.5" strokeWidth={2} />
                    刷新状态
                  </Button>
                )}
              </div>
            )}

            {/* 播放错误 */}
            {error && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/75 px-6 text-center">
                <TriangleAlert
                  className="size-6 text-warning"
                  strokeWidth={1.75}
                />
                <p className="max-w-[46ch] text-label text-ink-2">{error}</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    retryRef.current = 0;
                    setError('');
                    setBuffering(false);
                    setConnecting(true);
                    controllerRef.current?.reload();
                  }}
                >
                  <RotateCw className="size-3.5" strokeWidth={2} />
                  重新连接
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 全屏浮层：顶部信息 + 底部控制 */}
        {isFullscreen && (
          <>
            <div
              className={cn(
                'absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 bg-gradient-to-b from-black/75 to-transparent px-4 pb-10 pt-3 transition-opacity duration-200 ease-out-expo',
                overlayShown ? 'opacity-100' : 'pointer-events-none opacity-0'
              )}
            >
              <div className="min-w-0">
                <h1 className="truncate text-title font-medium text-white">
                  {detail.title}
                </h1>
                <p className="mt-1 flex items-center gap-2.5 text-caption text-white/70">
                  <span className="max-w-[24ch] truncate">{detail.userName}</span>
                  <span className="tnum" title={`${online ?? detail.online} 人气`}>
                    {formatOnline(online ?? detail.online)} 人气
                  </span>
                </p>
              </div>
              <div className="shrink-0 pt-0.5">
                {detail.status ? <LiveBadge /> : null}
              </div>
            </div>

            <div
              className={cn(
                'absolute inset-x-0 bottom-0 z-30 flex items-center gap-1 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-3 pb-2 pt-10 transition-opacity duration-200 ease-out-expo',
                overlayShown ? 'opacity-100' : 'pointer-events-none opacity-0'
              )}
              onClick={revealControls}
            >
              {renderControls('overlay')}
            </div>
          </>
        )}
      </div>

      {/* 窗口模式：播放器下方的平铺操作栏（无容器，与信息行同宽） */}
      {!isFullscreen && (
        <div className="flex shrink-0 items-center gap-1 px-0.5">
          {renderControls('docked')}
        </div>
      )}
    </div>
  );
}

const CONTROLS_HIDE_DELAY = 2500;
