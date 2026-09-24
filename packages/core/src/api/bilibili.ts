import { createHash } from 'node:crypto';
import { fetchHttpAdapter, type HttpAdapter } from '../common/http.js';
import { defaultLogger, type Logger } from '../common/logger.js';
import {
  BILIBILI_REFERER,
  BILIBILI_USER_AGENT,
  BilibiliDanmakuClient,
  type BilibiliDanmakuArgs
} from '../danmaku/bilibili.js';
import type {
  LiveCategory,
  LiveCategoryResult,
  LivePlayQuality,
  LivePlayUrl,
  LiveRoomDetail,
  LiveRoomItem,
  LiveSearchRoomResult,
  LiveSubCategory
} from '../model/types.js';
import type { DanmakuClient, LiveSite, StreamHeaderRule } from './site.js';

/** 直播相关接口域名 */
const API_LIVE = 'https://api.live.bilibili.com';
/** 主站接口域名（WBI 密钥、搜索） */
const API_WEB = 'https://api.bilibili.com';
/** 拉流地址解析接口（每个画质请求一次） */
const PLAY_INFO_URL = `${API_LIVE}/xlive/web-room/v2/index/getRoomPlayInfo`;

/** WBI 签名用的字符重排表（与 Dart 端 mixinKeyEncTab 一致） */
const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52
];

/** B 站接口统一响应外壳 */
interface BilibiliEnvelope<T> {
  code?: number;
  message?: string;
  msg?: string;
  data?: T;
}

interface BilibiliBuvidData {
  b_3?: string;
  b_4?: string;
}

interface BilibiliNavData {
  wbi_img?: { img_url?: string; sub_url?: string };
}

interface BilibiliAreaItem {
  id?: number | string;
  name?: string;
  parent_id?: number | string;
  pic?: string;
  list?: BilibiliAreaItem[];
}

interface BilibiliRoomInfo {
  room_id?: number | string;
  short_id?: number | string;
  title?: string;
  cover?: string;
  description?: string;
  online?: number | string;
  live_status?: number;
  live_start_time?: number | string;
}

interface BilibiliInfoByRoomData {
  room_info?: BilibiliRoomInfo;
  anchor_info?: { base_info?: { uname?: string; face?: string } };
}

interface BilibiliDanmuInfoData {
  token?: string;
  host_list?: Array<{ host?: string }>;
}

interface BilibiliQnDesc {
  qn?: number | string;
  desc?: string;
}

interface BilibiliPlayCodec {
  base_url?: string;
  accept_qn?: Array<number | string>;
  url_info?: Array<{ host?: string; extra?: string }>;
}

interface BilibiliPlayFormat {
  format_name?: string;
  codec?: BilibiliPlayCodec[];
}

interface BilibiliPlayStream {
  protocol_name?: string;
  format?: BilibiliPlayFormat[];
}

interface BilibiliPlayurl {
  g_qn_desc?: BilibiliQnDesc[];
  stream?: BilibiliPlayStream[];
}

interface BilibiliRoomPlayInfoData {
  live_status?: number;
  playurl_info?: { playurl?: BilibiliPlayurl };
}

interface BilibiliRoomListItem {
  roomid?: number | string;
  title?: string;
  cover?: string;
  uname?: string;
  online?: number | string;
}

interface BilibiliRoomListData {
  has_more?: number | string;
  list?: BilibiliRoomListItem[];
}

interface BilibiliSearchLiveRoomItem {
  roomid?: number | string;
  title?: string;
  cover?: string;
  uname?: string;
  online?: number | string;
}

interface BilibiliSearchData {
  result?: { live_room?: BilibiliSearchLiveRoomItem[] };
}

/** 房间详情里透传给 getPlayQualites 的站点数据 */
export interface BilibiliRoomExtraData {
  /** 真实房间号 */
  roomId: string;
  /** 直播状态：1=直播中，2=轮播，0=未开播 */
  liveStatus: number;
  /** 短号（未设置时为空） */
  shortId: string;
}

export interface BilibiliSiteOptions {
  http?: HttpAdapter;
  /** 用户自定义 cookie（含登录态时可获取更高清晰度） */
  cookie?: string;
  /** 登录用户 uid（弹幕鉴权用，未登录为 0） */
  userId?: number;
  logger?: Logger;
}

function asString(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function asInt(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  const text = asString(value);
  if (!/^-?\d+$/.test(text)) {
    return 0;
  }
  return Number.parseInt(text, 10);
}

/** 图片地址补全（`//i0.hdslb.com/...` → `https://i0.hdslb.com/...`）并追加尺寸后缀 */
function withImageSize(url: string, suffix: string): string {
  if (!url) {
    return '';
  }
  return url.startsWith('http') ? `${url}${suffix}` : `https:${url}${suffix}`;
}

/** 去掉搜索结果标题里的 `<em class="keyword">` 等标签 */
function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/** 含 mcdn 的线路排到最后（其余保持原有优先级） */
function sortMcdnLast(urls: string[]): string[] {
  const normal: string[] = [];
  const mcdn: string[] = [];
  for (const url of urls) {
    if (url.includes('mcdn')) {
      mcdn.push(url);
    } else {
      normal.push(url);
    }
  }
  return [...normal, ...mcdn];
}

/**
 * 哔哩哔哩直播站点。
 * 接口实现移植自 Dart 端 simple_live_core/lib/src/bilibili_site.dart，
 * 并按桌面端播放约定在 getPlayQualites 内直接解析出可播放地址。
 */
export class BilibiliSite implements LiveSite {
  readonly id = 'bilibili';
  readonly name = '哔哩哔哩';

  readonly streamHeaderRules: StreamHeaderRule[] = [
    {
      domains: [
        'bilivideo.com',
        'bilivideo.cn',
        'szbdyd.com',
        'hdslb.com',
        'bilibili.com'
      ],
      referer: BILIBILI_REFERER,
      origin: 'https://live.bilibili.com',
      userAgent: BILIBILI_USER_AGENT,
      injectCors: true
    }
  ];

  private readonly http: HttpAdapter;
  private readonly logger: Logger;
  private readonly userId: number;
  private cookie: string;

  private buvid3 = '';
  private buvid4 = '';
  private wbiImgKey = '';
  private wbiSubKey = '';
  private wbiKeyTime = 0;

  constructor(options: BilibiliSiteOptions = {}) {
    this.http = options.http ?? fetchHttpAdapter;
    this.cookie = options.cookie ?? '';
    this.userId = options.userId ?? 0;
    this.logger = options.logger ?? defaultLogger;
  }

  createDanmakuClient(): DanmakuClient {
    return new BilibiliDanmakuClient();
  }

  /** 更新用户 cookie（含登录态时可获取更高清晰度） */
  setCookie(cookie: string): void {
    this.cookie = cookie;
  }

  getCookie(): string {
    return this.cookie;
  }

  /** 获取 buvid3/buvid4（无 cookie 时向 B 站申请匿名指纹） */
  private async getBuvid(): Promise<{ buvid3: string; buvid4: string }> {
    if (this.buvid3) {
      return { buvid3: this.buvid3, buvid4: this.buvid4 };
    }
    const fromCookie3 = /buvid3=([^;]+)/.exec(this.cookie)?.[1] ?? '';
    if (fromCookie3) {
      this.buvid3 = fromCookie3;
      this.buvid4 = /buvid4=([^;]+)/.exec(this.cookie)?.[1] ?? '';
      return { buvid3: this.buvid3, buvid4: this.buvid4 };
    }
    try {
      const json = await this.requestJson<BilibiliEnvelope<BilibiliBuvidData>>(
        `${API_WEB}/x/frontend/finger/spi`,
        {
          'User-Agent': BILIBILI_USER_AGENT,
          Referer: BILIBILI_REFERER,
          cookie: this.cookie
        }
      );
      this.buvid3 = asString(json.data?.b_3);
      this.buvid4 = asString(json.data?.b_4);
    } catch (error) {
      this.logger.warn('获取 B 站 buvid 失败，将使用空 buvid', error);
    }
    return { buvid3: this.buvid3, buvid4: this.buvid4 };
  }

  private async getHeader(
    extra: Record<string, string> = {}
  ): Promise<Record<string, string>> {
    const { buvid3, buvid4 } = await this.getBuvid();
    const buvidCookie = `buvid3=${buvid3};buvid4=${buvid4};`;
    const cookie = this.cookie.includes('buvid3')
      ? this.cookie
      : this.cookie
        ? `${this.cookie};${buvidCookie}`
        : buvidCookie;
    return {
      'User-Agent': BILIBILI_USER_AGENT,
      Referer: BILIBILI_REFERER,
      cookie,
      ...extra
    };
  }

  private async requestJson<T>(
    url: string,
    headers: Record<string, string>
  ): Promise<T> {
    const response = await this.http(url, { headers });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`请求失败：HTTP ${response.status} ${url}`);
    }
    try {
      return JSON.parse(response.text) as T;
    } catch {
      throw new Error(`响应不是合法 JSON：${url}`);
    }
  }

  /** 请求并校验 code=0，返回 data */
  private async requestData<T>(
    url: string,
    headers: Record<string, string>
  ): Promise<T> {
    const json = await this.requestJson<BilibiliEnvelope<T>>(url, headers);
    const code = asInt(json.code);
    if (code !== 0) {
      const message = asString(json.message) || asString(json.msg);
      throw new Error(`B站接口返回错误（${code}）：${message || '未知错误'}`);
    }
    if (json.data === undefined || json.data === null) {
      throw new Error(`B站接口返回数据为空：${url}`);
    }
    return json.data;
  }

  /** 获取 WBI 签名密钥（未登录时 nav 也会返回 wbi_img；密钥每日轮换，缓存 6 小时） */
  private async getWbiKeys(
    force = false
  ): Promise<{ imgKey: string; subKey: string }> {
    const cacheValid =
      this.wbiImgKey &&
      this.wbiSubKey &&
      Date.now() - this.wbiKeyTime < 6 * 60 * 60 * 1000;
    if (!force && cacheValid) {
      return { imgKey: this.wbiImgKey, subKey: this.wbiSubKey };
    }
    const json = await this.requestJson<BilibiliEnvelope<BilibiliNavData>>(
      `${API_WEB}/x/web-interface/nav`,
      await this.getHeader()
    );
    const imgUrl = asString(json.data?.wbi_img?.img_url);
    const subUrl = asString(json.data?.wbi_img?.sub_url);
    const imgKey = imgUrl.slice(imgUrl.lastIndexOf('/') + 1).split('.')[0];
    const subKey = subUrl.slice(subUrl.lastIndexOf('/') + 1).split('.')[0];
    if (!imgKey || !subKey) {
      throw new Error('获取 B 站 WBI 密钥失败');
    }
    this.wbiImgKey = imgKey;
    this.wbiSubKey = subKey;
    this.wbiKeyTime = Date.now();
    return { imgKey, subKey };
  }

  /** 对完整 URL 的查询参数做 WBI 签名，返回带 wts/w_rid 的最终 URL */
  private async signWbiUrl(url: string): Promise<string> {
    const { imgKey, subKey } = await this.getWbiKeys();
    const mixinKey = MIXIN_KEY_ENC_TAB.map((index) => (imgKey + subKey)[index])
      .join('')
      .slice(0, 32);
    const parsed = new URL(url);
    const params = new Map<string, string>();
    parsed.searchParams.forEach((value, key) => params.set(key, value));
    params.set('wts', String(Math.floor(Date.now() / 1000)));
    const query = [...params.keys()]
      .sort()
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(
            (params.get(key) ?? '').replace(/[!'()*]/g, '')
          )}`
      )
      .join('&');
    const wRid = createHash('md5').update(`${query}${mixinKey}`).digest('hex');
    return `${parsed.origin}${parsed.pathname}?${query}&w_rid=${wRid}`;
  }

  /** 读取分类（含子分区） */
  async getCategores(): Promise<LiveCategory[]> {
    const url = `${API_LIVE}/room/v1/Area/getList?need_entrance=1&parent_id=0`;
    const data = await this.requestData<BilibiliAreaItem[]>(
      url,
      await this.getHeader()
    );
    const categories: LiveCategory[] = [];
    for (const item of data) {
      const children: LiveSubCategory[] = [];
      for (const subItem of item.list ?? []) {
        children.push({
          id: asString(subItem.id),
          name: asString(subItem.name),
          parentId: asString(subItem.parent_id),
          pic: `${asString(subItem.pic)}@100w.png`
        });
      }
      categories.push({
        id: asString(item.id),
        name: asString(item.name),
        children
      });
    }
    return categories;
  }

  /** 读取推荐房间（按人气排序） */
  async getRecommendRooms(page = 1): Promise<LiveCategoryResult> {
    return this.getAreaRooms({}, page);
  }

  /**
   * 读取分区房间。
   * 注意：Dart 端使用的 second/getList 已被风控拦截（-352），
   * 这里改用 second/getListByArea 并携带 parent_area_id/area_id。
   */
  async getCategoryRooms(
    category: LiveSubCategory,
    page = 1
  ): Promise<LiveCategoryResult> {
    return this.getAreaRooms(
      { parent_area_id: category.parentId, area_id: category.id },
      page
    );
  }

  private async getAreaRooms(
    areaParams: Record<string, string>,
    page: number
  ): Promise<LiveCategoryResult> {
    const uri = new URL(`${API_LIVE}/xlive/web-interface/v1/second/getListByArea`);
    uri.searchParams.set('platform', 'web');
    uri.searchParams.set('sort', 'online');
    uri.searchParams.set('page_size', '30');
    uri.searchParams.set('page', String(page));
    for (const [key, value] of Object.entries(areaParams)) {
      uri.searchParams.set(key, value);
    }
    const url = await this.signWbiUrl(uri.toString());
    const data = await this.requestData<BilibiliRoomListData>(
      url,
      await this.getHeader()
    );
    const items: LiveRoomItem[] = (data.list ?? []).map((item) => ({
      roomId: asString(item.roomid),
      title: asString(item.title),
      cover: withImageSize(asString(item.cover), '@400w.jpg'),
      userName: asString(item.uname),
      online: asInt(item.online)
    }));
    return { hasMore: asInt(data.has_more) === 1, items };
  }

  /** 读取房间详情（含弹幕连接参数） */
  async getRoomDetail(roomId: string): Promise<LiveRoomDetail> {
    const headers = await this.getHeader();
    const infoUrl = await this.signWbiUrl(
      `${API_LIVE}/xlive/web-room/v1/index/getInfoByRoom?room_id=${encodeURIComponent(roomId)}`
    );
    const info = await this.requestData<BilibiliInfoByRoomData>(
      infoUrl,
      headers
    );
    const roomInfo = info.room_info ?? {};
    const baseInfo = info.anchor_info?.base_info;
    const realRoomId = asString(roomInfo.room_id) || roomId;
    const liveStatus = asInt(roomInfo.live_status);
    const uidFromCookie = asInt(/DedeUserID=(\d+)/.exec(headers['cookie'] ?? '')?.[1]);

    let danmakuData: BilibiliDanmakuArgs = {
      roomId: asInt(realRoomId),
      uid: this.userId || uidFromCookie,
      token: '',
      serverHost: 'broadcastlv.chat.bilibili.com',
      buvid: this.buvid3,
      cookie: headers['cookie'] ?? ''
    };
    try {
      const danmuUrl = await this.signWbiUrl(
        `${API_LIVE}/xlive/web-room/v1/index/getDanmuInfo?id=${encodeURIComponent(realRoomId)}`
      );
      const danmu = await this.requestData<BilibiliDanmuInfoData>(
        danmuUrl,
        headers
      );
      const hosts = (danmu.host_list ?? [])
        .map((item) => asString(item.host))
        .filter((host) => host.length > 0);
      danmakuData = {
        ...danmakuData,
        token: asString(danmu.token),
        serverHost: hosts[0] ?? danmakuData.serverHost
      };
    } catch (error) {
      this.logger.warn('获取 B 站弹幕服务器失败，使用默认地址', error);
    }

    return {
      roomId: realRoomId,
      title: asString(roomInfo.title),
      cover: asString(roomInfo.cover),
      userName: asString(baseInfo?.uname),
      userAvatar: withImageSize(asString(baseInfo?.face), '@100w.jpg'),
      online: asInt(roomInfo.online),
      status: liveStatus === 1,
      url: `https://live.bilibili.com/${roomId}`,
      introduction: asString(roomInfo.description),
      notice: '',
      showTime: asString(roomInfo.live_start_time),
      danmakuData,
      data: {
        roomId: realRoomId,
        liveStatus,
        shortId: asString(roomInfo.short_id)
      } satisfies BilibiliRoomExtraData
    };
  }

  /** 取出响应里第一个带 accept_qn 的编码信息（通常为 http_stream/flv/avc） */
  private static firstAcceptQn(playurl: BilibiliPlayurl | undefined): number[] {
    for (const stream of playurl?.stream ?? []) {
      for (const format of stream.format ?? []) {
        for (const codec of format.codec ?? []) {
          const acceptQn = codec.accept_qn ?? [];
          if (acceptQn.length > 0) {
            return [...new Set(acceptQn.map((qn) => asInt(qn)))].filter(
              (qn) => qn > 0
            );
          }
        }
      }
    }
    return [];
  }

  /** 解析指定画质的拉流地址（FLV 在前、HLS 在后，mcdn 线路垫底） */
  private async getQualityUrls(
    roomId: string,
    qn: number,
    headers: Record<string, string>
  ): Promise<string[]> {
    const uri = new URL(PLAY_INFO_URL);
    uri.searchParams.set('room_id', roomId);
    uri.searchParams.set('protocol', '0,1');
    uri.searchParams.set('format', '0,2');
    uri.searchParams.set('codec', '0');
    uri.searchParams.set('platform', 'web');
    uri.searchParams.set('qn', String(qn));
    const data = await this.requestData<BilibiliRoomPlayInfoData>(
      uri.toString(),
      headers
    );
    const urls: string[] = [];
    for (const stream of data.playurl_info?.playurl?.stream ?? []) {
      for (const format of stream.format ?? []) {
        for (const codec of format.codec ?? []) {
          const baseUrl = asString(codec.base_url);
          if (!baseUrl) {
            continue;
          }
          for (const urlInfo of codec.url_info ?? []) {
            const host = asString(urlInfo.host);
            if (host) {
              urls.push(`${host}${baseUrl}${asString(urlInfo.extra)}`);
            }
          }
        }
      }
    }
    return sortMcdnLast([...new Set(urls)]);
  }

  /**
   * 读取画质列表。
   * 桌面端约定：quality.data 必须是可直接播放的 URL 数组，
   * 因此这里按画质逐个请求 getRoomPlayInfo 并解析出拉流地址。
   */
  async getPlayQualites(detail: LiveRoomDetail): Promise<LivePlayQuality[]> {
    const roomId = detail.roomId;
    const headers = await this.getHeader();
    const infoUri = new URL(PLAY_INFO_URL);
    infoUri.searchParams.set('room_id', roomId);
    infoUri.searchParams.set('protocol', '0,1');
    infoUri.searchParams.set('format', '0,1,2');
    infoUri.searchParams.set('codec', '0,1');
    infoUri.searchParams.set('platform', 'web');
    const info = await this.requestData<BilibiliRoomPlayInfoData>(
      infoUri.toString(),
      headers
    );
    const playurl = info.playurl_info?.playurl;
    const qnDesc = new Map<number, string>();
    for (const item of playurl?.g_qn_desc ?? []) {
      qnDesc.set(asInt(item.qn), asString(item.desc));
    }

    const qualities: LivePlayQuality[] = [];
    for (const qn of BilibiliSite.firstAcceptQn(playurl)) {
      try {
        const urls = await this.getQualityUrls(roomId, qn, headers);
        if (urls.length === 0) {
          this.logger.warn(`B站画质 ${qn} 无可用播放地址，已跳过`);
          continue;
        }
        qualities.push({
          quality: qnDesc.get(qn) ?? `清晰度${qn}`,
          sort: qn,
          data: urls
        });
      } catch (error) {
        this.logger.warn(`B站画质 ${qn} 获取播放地址失败，已跳过`, error);
      }
    }
    qualities.sort((a, b) => b.sort - a.sort);
    return qualities;
  }

  /** 读取播放地址（已在 getPlayQualites 内解析，直接返回线路列表） */
  getPlayUrls(_detail: LiveRoomDetail, quality: LivePlayQuality): LivePlayUrl {
    const urls = Array.isArray(quality.data)
      ? (quality.data as string[]).slice()
      : [];
    return {
      urls,
      headers: {
        Referer: BILIBILI_REFERER,
        'User-Agent': BILIBILI_USER_AGENT
      }
    };
  }

  /** 查询直播状态 */
  async getLiveStatus(roomId: string): Promise<boolean> {
    const url = `${API_LIVE}/room/v1/Room/get_info?room_id=${encodeURIComponent(roomId)}`;
    const data = await this.requestData<BilibiliRoomInfo>(
      url,
      await this.getHeader()
    );
    return asInt(data.live_status) === 1;
  }

  /** 搜索直播间（标题中的高亮标签会被移除） */
  async searchRooms(
    keyword: string,
    page = 1
  ): Promise<LiveSearchRoomResult> {
    const uri = new URL(`${API_WEB}/x/web-interface/search/type`);
    const params: Record<string, string> = {
      context: '',
      search_type: 'live',
      cover_type: 'user_cover',
      order: '',
      keyword,
      category_id: '',
      __refresh__: '',
      _extra: '',
      highlight: '0',
      single_column: '0',
      page: String(page)
    };
    for (const [key, value] of Object.entries(params)) {
      uri.searchParams.set(key, value);
    }
    const data = await this.requestData<BilibiliSearchData>(
      uri.toString(),
      await this.getHeader()
    );
    const items: LiveRoomItem[] = (data.result?.live_room ?? []).map((item) => ({
      roomId: asString(item.roomid),
      title: stripHtmlTags(asString(item.title)),
      cover: withImageSize(asString(item.cover), '@400w.jpg'),
      userName: stripHtmlTags(asString(item.uname)),
      online: asInt(item.online)
    }));
    return { hasMore: items.length >= 40, items };
  }
}
