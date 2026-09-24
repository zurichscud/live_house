/** 已接入的直播平台标识 */
export type SiteId = 'douyin' | 'bilibili' | 'huya';

export interface DanmakuChatMessage {
  type: 'chat';
  userName: string;
  message: string;
}

export interface DanmakuOnlineMessage {
  type: 'online';
  online: number;
}

export type DanmakuMessage = DanmakuChatMessage | DanmakuOnlineMessage;

export interface LiveRoomItem {
  roomId: string;
  title: string;
  cover: string;
  userName: string;
  online: number;
}

export interface LiveRoomDetail {
  roomId: string;
  title: string;
  cover: string;
  userName: string;
  userAvatar: string;
  online: number;
  introduction?: string;
  notice?: string;
  status: boolean;
  /** 平台附加数据（抖音为 stream_url 结构） */
  data?: unknown;
  /** 弹幕连接参数 */
  danmakuData?: unknown;
  url: string;
  isRecord?: boolean;
  showTime?: string;
}

export interface LivePlayQuality {
  quality: string;
  /** 平台附加数据（抖音为 URL 列表） */
  data: unknown;
  sort: number;
}

export interface LivePlayUrl {
  urls: string[];
  headers?: Record<string, string>;
}

export interface LiveSubCategory {
  id: string;
  name: string;
  parentId: string;
  pic?: string;
}

export interface LiveCategory {
  id: string;
  name: string;
  children: LiveSubCategory[];
}

export interface LiveCategoryResult {
  hasMore: boolean;
  items: LiveRoomItem[];
}

export interface LiveSearchRoomResult {
  hasMore: boolean;
  items: LiveRoomItem[];
}

export interface LiveAnchorItem {
  roomId: string;
  avatar: string;
  userName: string;
  liveStatus: boolean;
}

export interface LiveSearchAnchorResult {
  hasMore: boolean;
  items: LiveAnchorItem[];
}

/** 抖音弹幕连接参数 */
export interface DouyinDanmakuArgs {
  webRid: string;
  roomId: string;
  userId: string;
  cookie: string;
}

export interface DouyinQualityOption {
  name: string;
  level: number;
  sdk_key: string;
}

export interface DouyinPullData {
  options?: {
    qualities?: DouyinQualityOption[];
  };
  stream_data?: string;
}

export interface DouyinStreamUrl {
  live_core_sdk_data?: {
    pull_data?: DouyinPullData;
  };
  flv_pull_url?: Record<string, string>;
  hls_pull_url_map?: Record<string, string>;
}

/** 抖音账号信息（登录态校验） */
export interface DouyinSelfInfo {
  secUid: string;
  nickname: string;
  uniqueId: string;
  followingCount: number;
  followerCount: number;
}

export interface DouyinFollowingUser {
  secUid: string;
  nickname: string;
  uniqueId: string;
  avatar: string;
  followerCount: number;
  /** 关注列表接口直接带回的直播状态（无需再逐个查询） */
  liveStatus: boolean;
  /** 直播间号（未开播为空） */
  webRid: string;
  /** 直播间 room_id（未开播为空） */
  roomId: string;
  /** 实时在线人数（未开播为 0） */
  online: number;
}

export interface DouyinFollowingResult {
  items: DouyinFollowingUser[];
  hasMore: boolean;
  /** 下一页请求的 max_time（本页响应的 min_time） */
  minTime: string;
}
