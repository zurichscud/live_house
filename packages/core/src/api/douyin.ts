import { randomInt } from 'node:crypto';
import {
  DEFAULT_AUTHORITY,
  DEFAULT_REFERER,
  DEFAULT_TTWID_COOKIE,
  DEFAULT_USER_AGENT
} from '../common/constants.js';
import { fetchHttpAdapter, type HttpAdapter } from '../common/http.js';
import { defaultLogger, type Logger } from '../common/logger.js';
import { DouyinDanmakuClient } from '../danmaku/client.js';
import type { DanmakuClient, LiveSite, StreamHeaderRule } from './site.js';
import type {
  DouyinDanmakuArgs,
  DouyinFollowingResult,
  DouyinFollowingUser,
  DouyinSelfInfo,
  DouyinStreamUrl,
  DouyinUserLiveStatus,
  LiveCategory,
  LiveCategoryResult,
  LivePlayQuality,
  LivePlayUrl,
  LiveRoomDetail,
  LiveRoomItem,
  LiveSearchRoomResult,
  LiveSubCategory
} from '../model/types.js';
import { getAbogusUrl } from '../sign/index.js';

export interface DouyinSiteOptions {
  http?: HttpAdapter;
  /** 用户自定义 cookie（为空时使用内置 ttwid） */
  cookie?: string;
  logger?: Logger;
}

interface DouyinRoomData {
  id_str?: string;
  title?: string;
  cover?: { url_list?: string[] };
  owner?: {
    nickname?: string;
    avatar_thumb?: { url_list?: string[] };
    signature?: string;
    web_rid?: string;
  };
  status?: number;
  room_view_stats?: { display_value?: string | number };
  stream_url?: DouyinStreamUrl;
}

interface DouyinUserData {
  nickname?: string;
  avatar_thumb?: { url_list?: string[] };
}

interface DouyinEnterRoomResponse {
  data?: DouyinRoomData[];
  user?: DouyinUserData;
}

interface DouyinReflowResponse {
  data?: {
    room?: DouyinRoomData;
  };
}

interface DouyinRoomListItem {
  web_rid?: string | number;
  room?: {
    title?: string;
    cover?: { url_list?: string[] };
    owner?: { nickname?: string };
    room_view_stats?: { display_value?: string | number };
  };
}

interface DouyinRoomListResponse {
  data?: {
    data?: DouyinRoomListItem[];
  };
}

interface DouyinSearchResponse {
  data?: Array<{ lives?: { rawdata?: string } }>;
}

/** www.douyin.com 账号类接口的通用浏览器参数（与关注列表接口调研时的参数保持一致） */
const WEB_COMMON_PARAMS: Record<string, string> = {
  device_platform: 'webapp',
  aid: '6383',
  channel: 'channel_pc_web',
  pc_client_type: '1',
  version_code: '170400',
  version_name: '17.4.0',
  cookie_enabled: 'true',
  screen_width: '1920',
  screen_height: '1080',
  browser_language: 'zh-CN',
  browser_platform: 'Win32',
  browser_name: 'Chrome',
  browser_version: '125.0.0.0',
  browser_online: 'true',
  engine_name: 'Blink',
  engine_version: '125.0.0.0',
  os_name: 'Windows',
  os_version: '10',
  cpu_core_num: '12',
  device_memory: '8',
  platform: 'PC',
  downlink: '10',
  effective_type: '4g',
  round_trip_time: '50',
  webid: '7382872326016435738'
};

function tryParseInt(value: unknown): number {
  const text = String(value ?? '');
  if (!/^-?\d+$/.test(text)) {
    return 0;
  }
  return Number.parseInt(text, 10);
}

function randomNumericId(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += randomInt(0, 10).toString();
  }
  return out;
}

function firstUrl(list?: string[]): string {
  return list?.[0] ?? '';
}

/**
 * 从转义文本（HTML 内嵌 RENDER_DATA）中提取指定 key 后的完整 JSON 值。
 * 使用括号计数而非非贪婪正则，避免结束边界判断错误。
 */
function extractEscapedJsonValue(
  text: string,
  marker: string,
  openChar: '[' | '{',
  closeChar: ']' | '}'
): string {
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) {
    return '';
  }
  const start = text.indexOf(openChar, markerIndex + marker.length);
  if (start < 0) {
    return '';
  }
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\') {
      const next = text[i + 1];
      if (next === '"') {
        inString = !inString;
      }
      i++;
      continue;
    }
    if (inString) {
      continue;
    }
    if (ch === openChar) {
      depth++;
    } else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return '';
}

function unescapeJsonText(text: string): string {
  return text.replaceAll('\\"', '"').replaceAll('\\\\', '\\');
}

export class DouyinSite implements LiveSite {
  readonly id = 'douyin';
  readonly name = '抖音直播';

  readonly streamHeaderRules: StreamHeaderRule[] = [
    {
      domains: [
        'douyincdn.com',
        'douyin.com',
        'douyinpic.com',
        'douyinstatic.com',
        'byteimg.com',
        'pstatp.com',
        'ibytedtos.com',
        'bytedance.com'
      ],
      referer: 'https://live.douyin.com/',
      origin: 'https://live.douyin.com',
      userAgent: DEFAULT_USER_AGENT,
      injectCors: true
    }
  ];

  private readonly http: HttpAdapter;
  private cookie: string;
  private readonly logger: Logger;

  constructor(options: DouyinSiteOptions = {}) {
    this.http = options.http ?? fetchHttpAdapter;
    this.cookie = options.cookie ?? '';
    this.logger = options.logger ?? defaultLogger;
  }

  createDanmakuClient(): DanmakuClient {
    return new DouyinDanmakuClient();
  }

  /** 更新用户 cookie（如登录后的完整 cookie，用于搜索等需要登录态的接口） */
  setCookie(cookie: string): void {
    this.cookie = cookie;
  }

  getCookie(): string {
    return this.cookie;
  }

  private getRequestHeaders(
    extra: Record<string, string> = {}
  ): Record<string, string> {
    return {
      Authority: DEFAULT_AUTHORITY,
      Referer: DEFAULT_REFERER,
      'User-Agent': DEFAULT_USER_AGENT,
      cookie: this.cookie || DEFAULT_TTWID_COOKIE,
      ...extra
    };
  }

  private async getJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.http(url, { headers });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`请求失败：HTTP ${response.status} ${url}`);
    }
    return JSON.parse(response.text) as T;
  }

  /** 读取分类（首页 HTML 内嵌 RENDER_DATA） */
  async getCategores(): Promise<LiveCategory[]> {
    const response = await this.http('https://live.douyin.com/', {
      headers: this.getRequestHeaders()
    });
    const arrayText = extractEscapedJsonValue(
      response.text,
      '\\"categoryData\\":',
      '[',
      ']'
    );
    if (!arrayText) {
      throw new Error('未在首页 HTML 中找到分类数据');
    }
    const categoryData = JSON.parse(unescapeJsonText(arrayText)) as Array<{
      partition: { id_str: string; type: number; title?: string };
      sub_partition?: Array<{
        partition: { id_str: string; type: number; title?: string };
      }>;
    }>;

    const categories: LiveCategory[] = [];
    for (const item of categoryData) {
      const id = `${item.partition.id_str},${item.partition.type}`;
      const subs: LiveSubCategory[] = [];
      for (const subItem of item.sub_partition ?? []) {
        subs.push({
          id: `${subItem.partition.id_str},${subItem.partition.type}`,
          name: subItem.partition.title ?? '',
          parentId: id,
          pic: ''
        });
      }
      const category: LiveCategory = {
        children: subs,
        id,
        name: item.partition.title ?? ''
      };
      subs.unshift({
        id: category.id,
        name: category.name,
        parentId: category.id,
        pic: ''
      });
      categories.push(category);
    }
    return categories;
  }

  /** 读取类目下房间 */
  async getCategoryRooms(
    category: LiveSubCategory,
    page = 1
  ): Promise<LiveCategoryResult> {
    const [partitionId, partitionType] = category.id.split(',');
    return this.getPartitionRooms(partitionId, partitionType, page);
  }

  /** 读取推荐房间（游戏分区 720/1） */
  async getRecommendRooms(page = 1): Promise<LiveCategoryResult> {
    return this.getPartitionRooms('720', '1', page);
  }

  private async getPartitionRooms(
    partitionId: string,
    partitionType: string,
    page: number
  ): Promise<LiveCategoryResult> {
    const serverUrl =
      'https://live.douyin.com/webcast/web/partition/detail/room/v2/';
    const uri = new URL(serverUrl);
    const params: Record<string, string> = {
      aid: '6383',
      app_name: 'douyin_web',
      live_id: '1',
      device_platform: 'web',
      language: 'zh-CN',
      enter_from: 'link_share',
      cookie_enabled: 'true',
      screen_width: '1980',
      screen_height: '1080',
      browser_language: 'zh-CN',
      browser_platform: 'Win32',
      browser_name: 'Edge',
      browser_version: '125.0.0.0',
      browser_online: 'true',
      count: '15',
      offset: String((page - 1) * 15),
      partition: partitionId,
      partition_type: partitionType,
      req_from: '2'
    };
    for (const [key, value] of Object.entries(params)) {
      uri.searchParams.set(key, value);
    }
    const requestUrl = getAbogusUrl(uri.toString(), DEFAULT_USER_AGENT);
    const result = await this.getJson<DouyinRoomListResponse>(
      requestUrl,
      this.getRequestHeaders()
    );
    const list = result.data?.data ?? [];
    const items: LiveRoomItem[] = list.map((item) => ({
      roomId: String(item.web_rid ?? ''),
      title: String(item.room?.title ?? ''),
      cover: firstUrl(item.room?.cover?.url_list),
      userName: String(item.room?.owner?.nickname ?? ''),
      online: tryParseInt(item.room?.room_view_stats?.display_value)
    }));
    return { hasMore: list.length >= 15, items };
  }

  /**
   * 读取房间详情
   * - 长度 <= 16 视为 webRid（固定），否则视为 roomId（每次开播变化）
   */
  async getRoomDetail(roomId: string): Promise<LiveRoomDetail> {
    if (roomId.length <= 16) {
      return this.getRoomDetailByWebRid(roomId);
    }
    return this.getRoomDetailByRoomId(roomId);
  }

  /** 通过 webRid 获取直播间信息（API 优先，HTML 兜底） */
  async getRoomDetailByWebRid(webRid: string): Promise<LiveRoomDetail> {
    try {
      return await this.getRoomDetailByWebRidApi(webRid);
    } catch (error) {
      this.logger.error('通过 API 获取房间信息失败，尝试 HTML 兜底', error);
    }
    return this.getRoomDetailByWebRidHtml(webRid);
  }

  private async getRoomDetailByWebRidApi(
    webRid: string
  ): Promise<LiveRoomDetail> {
    const data = await this.getRoomDataByApi(webRid);
    const roomData = data.data?.[0];
    if (!roomData) {
      throw new Error('房间信息为空');
    }
    const userData = data.user;
    const roomId = String(roomData.id_str ?? '');
    const userUniqueId = randomNumericId(12);
    const owner = roomData.owner;
    const roomStatus = (roomData.status ?? 0) === 2;
    const headers = this.getRequestHeaders();

    return {
      roomId: webRid,
      title: String(roomData.title ?? ''),
      cover: roomStatus ? firstUrl(roomData.cover?.url_list) : '',
      userName: roomStatus
        ? String(owner?.nickname ?? '')
        : String(userData?.nickname ?? ''),
      userAvatar: roomStatus
        ? firstUrl(owner?.avatar_thumb?.url_list)
        : firstUrl(userData?.avatar_thumb?.url_list),
      online: roomStatus
        ? tryParseInt(roomData.room_view_stats?.display_value)
        : 0,
      status: roomStatus,
      url: `https://live.douyin.com/${webRid}`,
      introduction: String(owner?.signature ?? ''),
      notice: '',
      danmakuData: {
        webRid,
        roomId,
        userId: userUniqueId,
        cookie: headers['cookie']
      } satisfies DouyinDanmakuArgs,
      data: roomStatus ? roomData.stream_url : {}
    };
  }

  private async getRoomDetailByWebRidHtml(
    webRid: string
  ): Promise<LiveRoomDetail> {
    const roomData = await this.getRoomDataByHtml(webRid);
    const roomStore = roomData.roomStore as {
      roomInfo?: {
        room?: DouyinRoomData;
        anchor?: DouyinUserData;
      };
    };
    const userStore = roomData.userStore as {
      odin?: { user_unique_id?: string | number };
    };
    const room = roomStore.roomInfo?.room ?? {};
    const anchor = roomStore.roomInfo?.anchor;
    const owner = room.owner;
    const roomId = String(room.id_str ?? '');
    const userUniqueId = String(userStore.odin?.user_unique_id ?? '');
    const roomStatus = (room.status ?? 0) === 2;
    const headers = this.getRequestHeaders();

    return {
      roomId: webRid,
      title: String(room.title ?? ''),
      cover: roomStatus ? firstUrl(room.cover?.url_list) : '',
      userName: roomStatus
        ? String(owner?.nickname ?? '')
        : String(anchor?.nickname ?? ''),
      userAvatar: roomStatus
        ? firstUrl(owner?.avatar_thumb?.url_list)
        : firstUrl(anchor?.avatar_thumb?.url_list),
      online: roomStatus ? tryParseInt(room.room_view_stats?.display_value) : 0,
      status: roomStatus,
      url: `https://live.douyin.com/${webRid}`,
      introduction: String(owner?.signature ?? ''),
      notice: '',
      danmakuData: {
        webRid,
        roomId,
        userId: userUniqueId,
        cookie: headers['cookie']
      } satisfies DouyinDanmakuArgs,
      data: roomStatus ? room.stream_url : {}
    };
  }

  /** 通过 roomId（19 位左右，一次性）获取直播间信息 */
  private async getRoomDetailByRoomId(roomId: string): Promise<LiveRoomDetail> {
    const roomData = await this.getRoomDataByRoomId(roomId);
    const room = roomData.data?.room;
    if (!room) {
      throw new Error('房间信息为空');
    }
    const webRid = String(room.owner?.web_rid ?? '');
    const userUniqueId = randomNumericId(12);
    const owner = room.owner;
    const status = room.status ?? 0;

    // roomId 对应的直播间未开播时，回退到 webRid 查询
    if (status === 4) {
      return this.getRoomDetailByWebRid(webRid);
    }

    const roomStatus = status === 2;
    const headers = this.getRequestHeaders();

    return {
      roomId: webRid,
      title: String(room.title ?? ''),
      cover: roomStatus ? firstUrl(room.cover?.url_list) : '',
      userName: String(owner?.nickname ?? ''),
      userAvatar: firstUrl(owner?.avatar_thumb?.url_list),
      online: roomStatus ? tryParseInt(room.room_view_stats?.display_value) : 0,
      status: roomStatus,
      url: `https://live.douyin.com/${webRid}`,
      introduction: String(owner?.signature ?? ''),
      notice: '',
      danmakuData: {
        webRid,
        roomId,
        userId: userUniqueId,
        cookie: headers['cookie']
      } satisfies DouyinDanmakuArgs,
      data: room.stream_url
    };
  }

  /** 通过 webRid 请求 webcast 接口获取房间数据 */
  private async getRoomDataByApi(
    webRid: string
  ): Promise<DouyinEnterRoomResponse> {
    const serverUrl = 'https://live.douyin.com/webcast/room/web/enter/';
    const uri = new URL(serverUrl);
    const params: Record<string, string> = {
      aid: '6383',
      app_name: 'douyin_web',
      live_id: '1',
      device_platform: 'web',
      language: 'zh-CN',
      browser_language: 'zh-CN',
      browser_platform: 'Win32',
      browser_name: 'Chrome',
      browser_version: '125.0.0.0',
      web_rid: webRid,
      msToken: ''
    };
    for (const [key, value] of Object.entries(params)) {
      uri.searchParams.set(key, value);
    }
    const requestUrl = getAbogusUrl(uri.toString(), DEFAULT_USER_AGENT);
    const requestHeaders = this.getRequestHeaders({
      Referer: `https://live.douyin.com/${webRid}`
    });
    const result = await this.getJson<{
      data?: DouyinEnterRoomResponse;
    }>(requestUrl, requestHeaders);
    if (!result || typeof result !== 'object') {
      throw new Error('抖音接口返回格式异常');
    }
    return result.data ?? {};
  }

  /** 通过 roomId 请求 reflow 接口获取房间数据 */
  private async getRoomDataByRoomId(
    roomId: string
  ): Promise<DouyinReflowResponse> {
    const uri = new URL('https://webcast.amemv.com/webcast/room/reflow/info/');
    const params: Record<string, string> = {
      type_id: '0',
      live_id: '1',
      room_id: roomId,
      sec_user_id: '',
      version_code: '99.99.99',
      app_id: '6383'
    };
    for (const [key, value] of Object.entries(params)) {
      uri.searchParams.set(key, value);
    }
    return this.getJson<DouyinReflowResponse>(
      uri.toString(),
      this.getRequestHeaders()
    );
  }

  /** 进入直播间前 HEAD 请求获取动态 cookie（ttwid / __ac_nonce / msToken） */
  private async fetchWebCookie(webRid: string): Promise<string> {
    const response = await this.http(`https://live.douyin.com/${webRid}`, {
      method: 'HEAD',
      headers: {
        Authority: DEFAULT_AUTHORITY,
        Referer: DEFAULT_REFERER,
        'User-Agent': DEFAULT_USER_AGENT
      }
    });
    let cookie = '';
    for (const item of response.headers['set-cookie'] ?? []) {
      const first = item.split(';')[0];
      if (first.includes('ttwid')) cookie += `${first};`;
      if (first.includes('__ac_nonce')) cookie += `${first};`;
      if (first.includes('msToken')) cookie += `${first};`;
    }
    return cookie;
  }

  /** 通过 webRid 请求直播间网页并解析内嵌 state */
  private async getRoomDataByHtml(
    webRid: string
  ): Promise<Record<string, unknown>> {
    const dyCookie = await this.fetchWebCookie(webRid);
    const response = await this.http(`https://live.douyin.com/${webRid}`, {
      headers: {
        Authority: DEFAULT_AUTHORITY,
        Referer: DEFAULT_REFERER,
        Cookie: dyCookie,
        'User-Agent': DEFAULT_USER_AGENT
      }
    });
    const stateText = extractEscapedJsonValue(
      response.text,
      '\\"state\\":{',
      '{',
      '}'
    );
    if (!stateText) {
      throw new Error('未在直播间 HTML 中找到 state 数据');
    }
    const state = JSON.parse(unescapeJsonText(stateText)) as Record<
      string,
      unknown
    >;
    return state;
  }

  /** 读取房间清晰度（解析 live_core_sdk_data） */
  async getPlayQualites(detail: LiveRoomDetail): Promise<LivePlayQuality[]> {
    const qualities: LivePlayQuality[] = [];
    try {
      const streamUrl = detail.data as DouyinStreamUrl | undefined;
      const liveCoreData = streamUrl?.live_core_sdk_data;
      if (!liveCoreData) {
        return qualities;
      }
      const pullData = liveCoreData.pull_data;
      if (!pullData) {
        return qualities;
      }
      const qualityList = pullData.options?.qualities ?? [];
      const streamData = String(pullData.stream_data ?? '');

      if (!streamData.startsWith('{')) {
        // 旧格式：stream_data 为空，按 flv/hls 列表与 level 映射
        const flvList = Object.values(streamUrl?.flv_pull_url ?? {});
        const hlsList = Object.values(streamUrl?.hls_pull_url_map ?? {});
        for (const quality of qualityList) {
          const level = quality.level;
          const urls: string[] = [];
          const flvIndex = flvList.length - level;
          if (flvIndex >= 0 && flvIndex < flvList.length) {
            urls.push(flvList[flvIndex]);
          }
          const hlsIndex = hlsList.length - level;
          if (hlsIndex >= 0 && hlsIndex < hlsList.length) {
            urls.push(hlsList[hlsIndex]);
          }
          if (urls.length > 0) {
            qualities.push({ quality: quality.name, sort: level, data: urls });
          }
        }
      } else {
        const qualityData = (
          JSON.parse(streamData) as {
            data?: Record<
              string,
              { main?: { flv?: string; hls?: string } }
            >;
          }
        ).data ?? {};
        for (const quality of qualityList) {
          const urls: string[] = [];
          const flvUrl = qualityData[quality.sdk_key]?.main?.flv;
          if (flvUrl) {
            urls.push(String(flvUrl));
          }
          const hlsUrl = qualityData[quality.sdk_key]?.main?.hls;
          if (hlsUrl) {
            urls.push(String(hlsUrl));
          }
          if (urls.length > 0) {
            qualities.push({ quality: quality.name, sort: quality.level, data: urls });
          }
        }
      }
    } catch (error) {
      this.logger.error('解析抖音画质失败', error);
    }
    qualities.sort((a, b) => b.sort - a.sort);
    return qualities;
  }

  /** 读取播放地址（抖音已在房间详情中内联返回） */
  getPlayUrls(_detail: LiveRoomDetail, quality: LivePlayQuality): LivePlayUrl {
    const urls = Array.isArray(quality.data)
      ? (quality.data as string[]).slice()
      : [];
    return { urls };
  }

  /** 搜索直播间 */
  async searchRooms(
    keyword: string,
    page = 1
  ): Promise<LiveSearchRoomResult> {
    const serverUrl = 'https://www.douyin.com/aweme/v1/web/live/search/';
    const uri = new URL(serverUrl);
    const params: Record<string, string> = {
      device_platform: 'webapp',
      aid: '6383',
      channel: 'channel_pc_web',
      search_channel: 'aweme_live',
      keyword,
      search_source: 'switch_tab',
      query_correct_type: '1',
      is_filter_search: '0',
      from_group_id: '',
      offset: String((page - 1) * 10),
      count: '10',
      pc_client_type: '1',
      version_code: '170400',
      version_name: '17.4.0',
      cookie_enabled: 'true',
      screen_width: '1980',
      screen_height: '1080',
      browser_language: 'zh-CN',
      browser_platform: 'Win32',
      browser_name: 'Edge',
      browser_version: '125.0.0.0',
      browser_online: 'true',
      engine_name: 'Blink',
      engine_version: '125.0.0.0',
      os_name: 'Windows',
      os_version: '10',
      cpu_core_num: '12',
      device_memory: '8',
      platform: 'PC',
      downlink: '10',
      effective_type: '4g',
      round_trip_time: '100',
      webid: '7382872326016435738'
    };
    for (const [key, value] of Object.entries(params)) {
      uri.searchParams.set(key, value);
    }

    // 搜索接口未使用 a_bogus 签名（与 Dart 端保持一致），但需要动态 ttwid
    const headResponse = await this.http('https://live.douyin.com', {
      method: 'HEAD',
      headers: this.getRequestHeaders()
    });
    let dyCookie = '';
    for (const item of headResponse.headers['set-cookie'] ?? []) {
      const first = item.split(';')[0];
      if (first.includes('ttwid')) dyCookie += `${first};`;
      if (first.includes('__ac_nonce')) dyCookie += `${first};`;
    }

    const response = await this.http(uri.toString(), {
      headers: {
        Authority: 'www.douyin.com',
        accept: 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        cookie: dyCookie,
        priority: 'u=1, i',
        referer: `https://www.douyin.com/search/${encodeURIComponent(keyword)}?type=live`,
        'sec-ch-ua':
          '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': DEFAULT_USER_AGENT
      }
    });
    if (response.text === '' || response.text === 'blocked') {
      throw new Error('抖音直播搜索被限制，请稍后再试');
    }
    const result = JSON.parse(response.text) as DouyinSearchResponse & {
      status_code?: number;
      status_msg?: string;
    };
    if (result.status_code !== undefined && result.status_code !== 0) {
      throw new Error(
        `抖音搜索失败（${result.status_code}）：${result.status_msg ?? '未知错误'}`
      );
    }

    const items: LiveRoomItem[] = [];
    for (const item of result.data ?? []) {
      const raw = item.lives?.rawdata;
      if (!raw) {
        continue;
      }
      const itemData = JSON.parse(raw) as {
        owner?: { web_rid?: string; nickname?: string };
        title?: string;
        cover?: { url_list?: string[] };
        stats?: { total_user?: string | number };
      };
      items.push({
        roomId: String(itemData.owner?.web_rid ?? ''),
        title: String(itemData.title ?? ''),
        cover: firstUrl(itemData.cover?.url_list),
        userName: String(itemData.owner?.nickname ?? ''),
        online: tryParseInt(itemData.stats?.total_user)
      });
    }
    return { hasMore: items.length >= 10, items };
  }

  // ------------------------------------------------------------------
  // 账号类接口（www.douyin.com，需要完整登录 Cookie + a_bogus 签名）
  // ------------------------------------------------------------------

  private async getWebJson<T>(
    path: string,
    params: Record<string, string>
  ): Promise<T> {
    if (!this.cookie) {
      throw new Error('需要登录 Cookie：请在「设置」中粘贴抖音 Cookie 后重试');
    }
    const uri = new URL(`https://www.douyin.com${path}`);
    for (const [key, value] of Object.entries({
      ...WEB_COMMON_PARAMS,
      ...params
    })) {
      uri.searchParams.set(key, value);
    }
    const requestUrl = getAbogusUrl(uri.toString(), DEFAULT_USER_AGENT);
    const response = await this.http(requestUrl, {
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        cookie: this.cookie,
        priority: 'u=1, i',
        referer: 'https://www.douyin.com/',
        'sec-ch-ua':
          '"Not/A)Brand";v="8", "Chromium";v="125", "Google Chrome";v="125"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': DEFAULT_USER_AGENT
      }
    });
    if (response.text === '' || response.text === 'blocked') {
      throw new Error('请求被抖音风控拦截，请稍后再试');
    }
    const json = JSON.parse(response.text) as T & {
      status_code?: number;
      status_msg?: string;
    };
    if (json.status_code === 8) {
      throw new Error('登录态已失效：请在「设置」中重新粘贴抖音 Cookie');
    }
    if (json.status_code !== undefined && json.status_code !== 0) {
      throw new Error(
        `抖音接口返回错误（${json.status_code}）：${json.status_msg ?? '未知错误'}`
      );
    }
    return json;
  }

  /** 读取当前登录账号信息（同时用于校验 Cookie 是否有效） */
  async getSelfInfo(): Promise<DouyinSelfInfo> {
    const json = await this.getWebJson<{
      user?: {
        sec_uid?: string;
        nickname?: string;
        unique_id?: string;
        following_count?: number;
        follower_count?: number;
      };
    }>('/aweme/v1/web/user/profile/self/', {
      publish_video_strategy_type: '2'
    });
    const user = json.user;
    if (!user?.sec_uid) {
      throw new Error('未获取到账号信息，请确认 Cookie 是否完整');
    }
    return {
      secUid: String(user.sec_uid),
      nickname: String(user.nickname ?? ''),
      uniqueId: String(user.unique_id ?? ''),
      followingCount: Number(user.following_count ?? 0),
      followerCount: Number(user.follower_count ?? 0)
    };
  }

  /**
   * 读取关注列表（单页，最多 20 条）
   * - 首页 maxTime 传 '0'；下一页传上一页返回的 minTime
   */
  async getFollowingList(
    secUid: string,
    maxTime = '0'
  ): Promise<DouyinFollowingResult> {
    const json = await this.getWebJson<{
      followings?: Array<{
        sec_uid?: string;
        nickname?: string;
        unique_id?: string;
        short_id?: string;
        follower_count?: number;
        avatar_thumb?: { url_list?: string[] };
      }>;
      has_more?: boolean | number | string;
      min_time?: string | number;
    }>('/aweme/v1/web/user/following/list/', {
      sec_user_id: secUid,
      max_time: String(maxTime),
      offset: '0',
      count: '20',
      source_type: '1'
    });
    const items: DouyinFollowingUser[] = (json.followings ?? []).map(
      (user) => ({
        secUid: String(user.sec_uid ?? ''),
        nickname: String(user.nickname ?? ''),
        uniqueId: String(user.unique_id ?? user.short_id ?? ''),
        avatar: firstUrl(user.avatar_thumb?.url_list),
        followerCount: Number(user.follower_count ?? 0)
      })
    );
    return {
      items,
      hasMore:
        json.has_more === true || json.has_more === 1 || json.has_more === '1',
      minTime: String(json.min_time ?? '0')
    };
  }

  /** 查询单个用户的实时直播状态（未开播时 webRid 为空） */
  async getUserLiveStatus(secUid: string): Promise<DouyinUserLiveStatus> {
    const json = await this.getWebJson<{
      user?: {
        live_status?: number;
        room_id_str?: string;
        room_data?: string | null;
      };
    }>('/aweme/v1/web/user/profile/other/', {
      sec_user_id: secUid,
      publish_video_strategy_type: '2'
    });
    const user = json.user ?? {};
    let webRid = '';
    let online = 0;
    if (user.room_data) {
      try {
        const roomData = JSON.parse(String(user.room_data)) as {
          status?: number;
          user_count?: number;
          owner?: { web_rid?: string };
        };
        webRid = String(roomData.owner?.web_rid ?? '');
        online = Number(roomData.user_count ?? 0);
      } catch {
        // room_data 解析失败视为未开播
      }
    }
    return {
      secUid,
      liveStatus: (user.live_status ?? 0) === 1,
      webRid,
      roomId: String(user.room_id_str ?? ''),
      online
    };
  }

  /** 查询直播状态 */
  async getLiveStatus(roomId: string): Promise<boolean> {
    const detail = await this.getRoomDetail(roomId);
    return detail.status;
  }
}
