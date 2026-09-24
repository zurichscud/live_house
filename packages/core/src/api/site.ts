import type {
  DanmakuMessage,
  LiveCategory,
  LiveCategoryResult,
  LivePlayQuality,
  LivePlayUrl,
  LiveRoomDetail,
  LiveSearchRoomResult,
  LiveSubCategory,
  SiteId
} from '../model/types.js';

/** 播放流/图片请求的请求头注入规则（渲染进程无法自定义请求头，由主进程按域名注入） */
export interface StreamHeaderRule {
  /** 匹配的域名（含其子域） */
  domains: string[];
  referer: string;
  origin?: string;
  userAgent?: string;
  /** CDN 不返回 CORS 头时，为响应注入允许头（供渲染进程拉流） */
  injectCors?: boolean;
}

/** 弹幕客户端契约：各站点实现自己的协议 */
export interface DanmakuClient {
  onMessage?: (message: DanmakuMessage) => void;
  onClose?: (reason: string) => void;
  onReady?: () => void;
  start(args: unknown): void;
  stop(): void;
}

/**
 * 直播站点契约：房间与播放相关方法必须实现；
 * 列表/搜索类方法按平台能力可选，缺省时主进程返回「暂不支持」。
 */
export interface LiveSite {
  readonly id: SiteId;
  readonly name: string;
  /** 播放流/图片请求头注入规则 */
  readonly streamHeaderRules?: StreamHeaderRule[];
  /** 创建该站点的弹幕客户端（未实现弹幕时省略） */
  createDanmakuClient?(): DanmakuClient;

  getRoomDetail(roomId: string): Promise<LiveRoomDetail>;
  /**
   * 读取画质列表。
   * 约定（桌面端播放器依赖）：`quality.data` 必须是可直接播放的 URL 数组
   * （多线路时按优先级排列），播放器不再二次请求。
   */
  getPlayQualites(detail: LiveRoomDetail): Promise<LivePlayQuality[]>;
  /** 读取指定画质的播放地址（可同步返回；播放器主要使用 quality.data） */
  getPlayUrls(
    detail: LiveRoomDetail,
    quality: LivePlayQuality
  ): LivePlayUrl | Promise<LivePlayUrl>;
  getLiveStatus(roomId: string): Promise<boolean>;

  getCategores?(): Promise<LiveCategory[]>;
  getCategoryRooms?(
    category: LiveSubCategory,
    page?: number
  ): Promise<LiveCategoryResult>;
  getRecommendRooms?(page?: number): Promise<LiveCategoryResult>;
  searchRooms?(keyword: string, page?: number): Promise<LiveSearchRoomResult>;
}
