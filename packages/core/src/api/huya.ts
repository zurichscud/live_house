import { createHash } from 'node:crypto';
import { fetchHttpAdapter, type HttpAdapter } from '../common/http.js';
import { defaultLogger, type Logger } from '../common/logger.js';
import { HuyaDanmakuClient, type HuyaDanmakuArgs } from '../danmaku/huya.js';
import {
  HUYA_SDK_USER_AGENT,
  TarsReader,
  TarsWriter
} from '../danmaku/huya-tars.js';
import type { DanmakuClient, LiveSite, StreamHeaderRule } from './site.js';
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

/** 移动端页面地址（房间信息、WUP 请求的 Origin/Referer） */
const HUYA_MOBILE_URL = 'https://m.huya.com/';
/** 网页端地址（拉流请求头） */
const HUYA_WEB_URL = 'https://www.huya.com/';
/** 移动端 UA：仅 m.huya.com 房间页需要 */
const HUYA_MOBILE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36 Edg/117.0.0.0';
/** WUP 网关（Tars over HTTP，getCdnTokenInfoEx 取流签名） */
const HUYA_WUP_URL = 'http://wup.huya.com/liveui';
const HUYA_WUP_SERVANT = 'liveui';
const HUYA_WUP_FUNC = 'getCdnTokenInfoEx';

/** 画质缺失时的兜底（与 Dart 端一致） */
const DEFAULT_BIT_RATES: HuyaBitRate[] = [
  { name: '原画', bitRate: 0 },
  { name: '高清', bitRate: 2000 }
];

/** 虎牙房间线路（vStreamInfo 条目） */
export interface HuyaLine {
  /** 线路地址前缀，如 http://tx.flv.huya.com/src */
  url: string;
  /** 流名（多线路共用同一 streamName） */
  streamName: string;
  /** CDN 标识，如 TX / AL / HS */
  cdnType: string;
  /** 房间页下发的 anticode（WUP 签名失败时的兜底，仅默认码率可用） */
  flvAntiCode: string;
}

/** 虎牙画质（vBitRateInfo 条目） */
export interface HuyaBitRate {
  name: string;
  /** 0 表示原画（不加 ratio 参数） */
  bitRate: number;
}

/**
 * `LiveRoomDetail.data` 的虎牙结构（必须是可结构化克隆的纯对象）。
 * 播放地址需要额外签名，因此在 getPlayQualites 内按需解析。
 */
export interface HuyaRoomData {
  /** 签名用的主播 uid（lChannelId） */
  uid: number;
  lines: HuyaLine[];
  bitRates: HuyaBitRate[];
  /** 房间默认线路（sDefaultLiveStreamLine，如 TX） */
  defaultLine: string;
  /** 默认码率（iDefaultLiveStreamBitRate），兜底 anticode 仅对该码率有效 */
  defaultBitRate: number;
}

export interface HuyaBinaryResponse {
  status: number;
  bytes: Uint8Array;
}

/**
 * WUP 需要 POST 二进制包体，而公共 HttpAdapter 只支持 GET/HEAD，
 * 因此单独定义二进制 POST 适配器（默认使用运行时内置 fetch）。
 */
export type HuyaPostAdapter = (
  url: string,
  body: Uint8Array,
  headers: Record<string, string>
) => Promise<HuyaBinaryResponse>;

const fetchPostAdapter: HuyaPostAdapter = async (url, body, headers) => {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    // 复制为 ArrayBuffer 支撑的视图，满足 fetch 的 BodyInit 类型
    body: new Uint8Array(body)
  });
  return {
    status: response.status,
    bytes: new Uint8Array(await response.arrayBuffer())
  };
};

export interface HuyaSiteOptions {
  http?: HttpAdapter;
  /** 二进制 POST（默认内置 fetch；WUP 取流签名使用） */
  post?: HuyaPostAdapter;
  logger?: Logger;
}

interface HuyaStreamInfo {
  sFlvUrl?: string;
  sStreamName?: string;
  sCdnType?: string;
  sFlvAntiCode?: string;
}

interface HuyaBitRateInfo {
  sDisplayName?: string;
  iBitRate?: number;
  iCodecType?: number;
}

interface HuyaLiveInfo {
  lProfileRoom?: number | string;
  lYyid?: number;
  lTotalCount?: number;
  lChannel?: number;
  sIntroduction?: string;
  sRoomName?: string;
  sScreenshot?: string;
  tLiveStreamInfo?: {
    vStreamInfo?: { value?: HuyaStreamInfo[] };
    vBitRateInfo?: { value?: HuyaBitRateInfo[] };
    iDefaultLiveStreamBitRate?: number;
    sDefaultLiveStreamLine?: string;
  };
}

interface HuyaInitData {
  roomInfo?: {
    eLiveStatus?: number;
    tLiveInfo?: HuyaLiveInfo;
    tProfileInfo?: { sNick?: string; sAvatar180?: string };
  };
  welcomeText?: string;
}

interface HuyaLiveListItem {
  profileRoom?: string | number;
  screenshot?: string;
  introduction?: string;
  roomName?: string;
  nick?: string;
  totalCount?: string | number;
}

interface HuyaLiveListResponse {
  status?: number;
  data?: {
    page?: number;
    totalPage?: number;
    datas?: HuyaLiveListItem[];
  };
}

interface HuyaBussLiveItem {
  gid?: unknown;
  gameFullName?: string;
}

interface HuyaBussLiveResponse {
  status?: number;
  data?: HuyaBussLiveItem[];
}

interface HuyaSearchDoc {
  room_id?: string | number;
  game_nick?: string;
  game_total_count?: string | number;
  game_introduction?: string;
  game_roomName?: string;
  game_screenshot?: string;
}

interface HuyaSearchResponse {
  response?: {
    '3'?: {
      numFound?: number;
      docs?: HuyaSearchDoc[];
    };
  };
}

function tryParseInt(value: unknown): number {
  const text = String(value ?? '');
  if (!/^-?\d+$/.test(text)) {
    return 0;
  }
  return Number.parseInt(text, 10);
}

/** 列表封面统一补上缩略图参数（与 Dart 端一致） */
function fixCover(cover: string): string {
  if (!cover || cover.includes('?')) {
    return cover;
  }
  return `${cover}?x-oss-process=style/w338_h190&`;
}

/** gid 可能是数字、字符串或 `{ value: "1,2" }`，统一取首个值 */
function normalizeGid(value: unknown): string {
  if (value !== null && typeof value === 'object' && 'value' in value) {
    const inner = (value as { value?: unknown }).value;
    return String(inner ?? '').split(',')[0] ?? '';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  return String(value ?? '');
}

/**
 * 从房间页 HTML 中提取 `window.HNF_GLOBAL_INIT` 的 JSON 对象。
 * 使用括号计数（识别字符串）而非非贪婪正则，避免内容中括号导致截断。
 */
function extractInitJson(html: string): HuyaInitData {
  const marker = 'window.HNF_GLOBAL_INIT';
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error('未在虎牙房间页中找到初始化数据');
  }
  const start = html.indexOf('{', markerIndex + marker.length);
  if (start < 0) {
    throw new Error('虎牙房间页初始化数据格式异常');
  }
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const char = html[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(start, i + 1)) as HuyaInitData;
      }
    }
  }
  throw new Error('虎牙房间页初始化数据不完整');
}

/** md5 十六进制（anticode 签名） */
function md5(text: string): string {
  return createHash('md5').update(text, 'utf8').digest('hex');
}

/**
 * 32 位循环左移 8 位（对应 Dart 的 rotl64；主播 uid 小于 2^32，高 32 位恒为 0）。
 */
function rotateLeft8(value: number): number {
  const low = value >>> 0;
  return ((low << 8) | (low >>> 24)) >>> 0;
}

/**
 * 构造播放 anticode（沿用 Dart `buildAntiCode`）：
 * 使用 WUP 返回的 token 中的 fm/wsTime/ctype/t/fs，按 `secretPrefix_calcUid_stream_hash_wsTime` 重新计算 wsSecret。
 */
export function buildAntiCode(
  stream: string,
  presenterUid: number,
  antiCode: string
): string {
  const params = new URLSearchParams(antiCode);
  const fmParam = params.get('fm');
  if (!fmParam) {
    return antiCode;
  }
  const ctype = params.get('ctype') ?? 'huya_pc_exe';
  const platformId = Number.parseInt(params.get('t') ?? '0', 10) || 0;
  const isWap = platformId === 103;
  const calcStartTime = Date.now();
  const seqId = presenterUid + calcStartTime;
  const secretHash = md5(`${seqId}|${ctype}|${platformId}`);
  const convertUid = rotateLeft8(presenterUid);
  const calcUid = isWap ? presenterUid : convertUid;
  const fm = decodeURIComponent(fmParam);
  const secretPrefix = Buffer.from(fm, 'base64').toString('utf8').split('_')[0] ?? '';
  const wsTime = params.get('wsTime') ?? '';
  const wsSecret = md5(
    `${secretPrefix}_${calcUid}_${stream}_${secretHash}_${wsTime}`
  );
  const random = Math.random();
  const ct = (Number.parseInt(wsTime, 16) + random) * 1000;
  const uuid = String(Math.trunc((((ct % 1e10) + random) * 1e3) % 0xffffffff));

  const result = new URLSearchParams();
  result.set('wsSecret', wsSecret);
  result.set('wsTime', wsTime);
  result.set('seqid', String(seqId));
  result.set('ctype', ctype);
  result.set('ver', '1');
  result.set('fs', params.get('fs') ?? '');
  result.set('fm', encodeURIComponent(fmParam));
  result.set('t', String(platformId));
  if (isWap) {
    result.set('uid', String(presenterUid));
    result.set('uuid', uuid);
  } else {
    result.set('u', String(convertUid));
  }
  return result.toString();
}

/** 构造 getCdnTokenInfoEx 的请求体（GetCdnTokenExReq，tag 与 Dart 端一致） */
function buildCdnTokenRequest(streamName: string): Uint8Array {
  const writer = new TarsWriter();
  writer.writeString('', 0);
  writer.writeString(streamName, 1);
  writer.writeInt(0, 2);
  writer.writeStructBegin(3);
  writer.writeInt(0, 0);
  writer.writeString('', 1);
  writer.writeString('', 2);
  writer.writeString('pc_exe&7060000&official', 3);
  writer.writeString('', 4);
  writer.writeInt(0, 5);
  writer.writeString('', 6);
  writer.writeString('', 7);
  writer.writeStructEnd();
  writer.writeInt(66, 4);
  return writer.toUint8Array();
}

/** 构造 TUP3 请求包：4 字节长度头 + RequestPacket */
function buildWupRequest(request: Uint8Array): Uint8Array {
  const payload = new TarsWriter();
  payload.writeStructBegin(0);
  payload.writeRaw(request);
  payload.writeStructEnd();

  const attributes = new TarsWriter();
  attributes.writeBytesMap([['tReq', payload.toUint8Array()]], 0);

  const packet = new TarsWriter();
  packet.writeInt(3, 1);
  packet.writeInt(0, 2);
  packet.writeInt(0, 3);
  packet.writeInt(0, 4);
  packet.writeString(HUYA_WUP_SERVANT, 5);
  packet.writeString(HUYA_WUP_FUNC, 6);
  packet.writeBytes(attributes.toUint8Array(), 7);
  packet.writeInt(0, 8);
  packet.writeEmptyMap(9);
  packet.writeEmptyMap(10);
  const body = packet.toUint8Array();

  const result = new Uint8Array(body.length + 4);
  new DataView(result.buffer).setInt32(0, body.length + 4);
  result.set(body, 4);
  return result;
}

/** 解析 TUP3 响应包，取出 tRsp.sFlvToken */
function parseCdnTokenResponse(bytes: Uint8Array): {
  code: number;
  token: string;
  expireTime: number;
} {
  const packet = new TarsReader(bytes, 4);
  packet.readInt(1);
  packet.readInt(2);
  packet.readInt(3);
  packet.readInt(4);
  packet.readString(5);
  packet.readString(6);
  const attributes = packet.readBytes(7);
  const map = new TarsReader(attributes).readBytesMap(0);
  const codeBytes = map.get('');
  const code = codeBytes ? new TarsReader(codeBytes).readInt(0) : 0;
  const response = map.get('tRsp');
  if (!response) {
    throw new Error(`虎牙 WUP 响应缺少 tRsp（code=${code}）`);
  }
  const struct = new TarsReader(response).readStruct(0);
  return {
    code,
    token: struct?.readString(0) ?? '',
    expireTime: struct?.readInt(1) ?? 0
  };
}

/** 拼装 FLV 播放地址（ratio 为 0 时不追加，即原画） */
function buildFlvUrl(
  line: HuyaLine,
  antiCode: string,
  bitRate: number
): string {
  let url = `${line.url}/${line.streamName}.flv?${antiCode}&codec=264`;
  if (bitRate > 0) {
    url += `&ratio=${bitRate}`;
  }
  return url;
}

/** 线路排序：默认线路（如 TX）优先，其余保持页面顺序 */
function orderLines(lines: HuyaLine[], defaultLine: string): HuyaLine[] {
  if (!defaultLine) {
    return lines.slice();
  }
  const preferred = lines.filter((line) =>
    line.cdnType.startsWith(defaultLine)
  );
  const rest = lines.filter((line) => !line.cdnType.startsWith(defaultLine));
  return [...preferred, ...rest];
}

/**
 * 虎牙直播站点。
 * - 房间详情/分类/搜索：m.huya.com 与 www.huya.com 的公开接口；
 * - 播放地址：WUP `getCdnTokenInfoEx` 取 token 后按 anticode 算法重新签名；
 * - 弹幕：WebSocket + Tars(wup2)，见 `danmaku/huya.ts`。
 */
export class HuyaSite implements LiveSite {
  readonly id = 'huya';
  readonly name = '虎牙直播';

  readonly streamHeaderRules: StreamHeaderRule[] = [
    {
      domains: ['huya.com', 'huyacdn.com', 'huyaimg.com', 'msstatic.com'],
      referer: HUYA_WEB_URL,
      origin: 'https://www.huya.com',
      userAgent: HUYA_SDK_USER_AGENT,
      injectCors: true
    }
  ];

  private readonly http: HttpAdapter;
  private readonly post: HuyaPostAdapter;
  private readonly logger: Logger;

  constructor(options: HuyaSiteOptions = {}) {
    this.http = options.http ?? fetchHttpAdapter;
    this.post = options.post ?? fetchPostAdapter;
    this.logger = options.logger ?? defaultLogger;
  }

  createDanmakuClient(): DanmakuClient {
    return new HuyaDanmakuClient();
  }

  private async getJson<T>(
    url: string,
    headers?: Record<string, string>
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

  private async getRoomInfo(roomId: string): Promise<{
    data: HuyaInitData;
    html: string;
  }> {
    const response = await this.http(`${HUYA_MOBILE_URL}${roomId}`, {
      headers: { 'User-Agent': HUYA_MOBILE_USER_AGENT }
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`虎牙房间页请求失败：HTTP ${response.status}`);
    }
    return { data: extractInitJson(response.text), html: response.text };
  }

  /** 读取房间详情 */
  async getRoomDetail(roomId: string): Promise<LiveRoomDetail> {
    const { data, html } = await this.getRoomInfo(roomId);
    const roomInfo = data.roomInfo;
    const liveInfo = roomInfo?.tLiveInfo;
    if (!roomInfo || !liveInfo) {
      throw new Error(`虎牙房间不存在：${roomId}`);
    }
    const profileInfo = roomInfo.tProfileInfo;
    const streamInfo = liveInfo.tLiveStreamInfo;
    const status = roomInfo.eLiveStatus === 2;

    const topSid =
      tryParseInt(/lChannelId":(\d+)/.exec(html)?.[1]) ||
      liveInfo.lChannel ||
      0;
    const subSid =
      tryParseInt(/lSubChannelId":(\d+)/.exec(html)?.[1]) || topSid;

    const lines: HuyaLine[] = [];
    for (const item of streamInfo?.vStreamInfo?.value ?? []) {
      const url = String(item.sFlvUrl ?? '');
      const streamName = String(item.sStreamName ?? '');
      if (!url || !streamName) {
        continue;
      }
      lines.push({
        url,
        streamName,
        cdnType: String(item.sCdnType ?? ''),
        flvAntiCode: String(item.sFlvAntiCode ?? '')
      });
    }

    const bitRates: HuyaBitRate[] = [];
    for (const item of streamInfo?.vBitRateInfo?.value ?? []) {
      const name = String(item.sDisplayName ?? '');
      // HDR 与 HEVC 编码桌面端无法播放，直接跳过（同名画质保留首个）
      if (!name || name.includes('HDR') || item.iCodecType === 1) {
        continue;
      }
      if (bitRates.some((bitRate) => bitRate.name === name)) {
        continue;
      }
      bitRates.push({ name, bitRate: tryParseInt(item.iBitRate) });
    }

    const title =
      String(liveInfo.sIntroduction ?? '') || String(liveInfo.sRoomName ?? '');
    const danmakuData: HuyaDanmakuArgs = {
      ayyuid: tryParseInt(liveInfo.lYyid),
      topSid,
      subSid
    };
    const roomData: HuyaRoomData = {
      uid: topSid,
      lines,
      bitRates,
      defaultLine: String(streamInfo?.sDefaultLiveStreamLine ?? ''),
      defaultBitRate: tryParseInt(streamInfo?.iDefaultLiveStreamBitRate)
    };

    return {
      roomId: String(liveInfo.lProfileRoom ?? roomId),
      title,
      cover: String(liveInfo.sScreenshot ?? ''),
      userName: String(profileInfo?.sNick ?? ''),
      userAvatar: String(profileInfo?.sAvatar180 ?? ''),
      online: tryParseInt(liveInfo.lTotalCount),
      introduction: String(liveInfo.sIntroduction ?? ''),
      notice: String(data.welcomeText ?? ''),
      status,
      data: roomData,
      danmakuData,
      url: `${HUYA_WEB_URL}${roomId}`
    };
  }

  /**
   * 读取画质列表。
   * 桌面端约定：`quality.data` 为可直接播放的 URL 数组，故在此完成 anticode 签名；
   * 每个 streamName 只请求一次 WUP（同一 token 可拼出所有码率的地址）。
   */
  async getPlayQualites(detail: LiveRoomDetail): Promise<LivePlayQuality[]> {
    const roomData = detail.data as HuyaRoomData | undefined;
    if (
      !roomData ||
      !Array.isArray(roomData.lines) ||
      roomData.lines.length === 0
    ) {
      return [];
    }
    const bitRates =
      roomData.bitRates.length > 0 ? roomData.bitRates : DEFAULT_BIT_RATES;
    const lines = orderLines(roomData.lines, roomData.defaultLine);

    const antiCodes = new Map<string, string>();
    for (const line of lines) {
      if (antiCodes.has(line.streamName)) {
        continue;
      }
      const antiCode = await this.signAntiCode(line, roomData.uid);
      if (antiCode) {
        antiCodes.set(line.streamName, antiCode);
      }
    }

    // WUP 完全不可用时，退化为房间页 anticode（仅默认码率可用）
    if (antiCodes.size === 0) {
      return this.buildFallbackQualities(roomData, lines);
    }

    const qualities: LivePlayQuality[] = [];
    for (const bitRate of bitRates) {
      const urls: string[] = [];
      for (const line of lines) {
        const antiCode = antiCodes.get(line.streamName);
        if (!antiCode) {
          continue;
        }
        urls.push(buildFlvUrl(line, antiCode, bitRate.bitRate));
      }
      if (urls.length > 0) {
        qualities.push({
          quality: bitRate.name,
          sort: bitRate.bitRate,
          data: urls
        });
      }
    }
    return qualities;
  }

  /** WUP 签名失败时的兜底：房间页 anticode 只对默认码率有效 */
  private buildFallbackQualities(
    roomData: HuyaRoomData,
    lines: HuyaLine[]
  ): LivePlayQuality[] {
    const ratio =
      roomData.defaultBitRate > 0
        ? roomData.defaultBitRate
        : (roomData.bitRates[0]?.bitRate ?? 0);
    const urls: string[] = [];
    for (const line of lines) {
      if (!line.flvAntiCode) {
        continue;
      }
      urls.push(buildFlvUrl(line, line.flvAntiCode, ratio));
    }
    if (urls.length === 0) {
      return [];
    }
    const name =
      roomData.bitRates.find((bitRate) => bitRate.bitRate === ratio)?.name ??
      '默认';
    return [{ quality: name, sort: ratio, data: urls }];
  }

  /** 调用 WUP 重新签名；失败返回 null（由调用方决定是否兜底） */
  private async signAntiCode(
    line: HuyaLine,
    presenterUid: number
  ): Promise<string | null> {
    try {
      const token = await this.getCdnTokenInfoEx(line.streamName);
      return buildAntiCode(line.streamName, presenterUid, token);
    } catch (error) {
      this.logger.warn('虎牙取流签名失败，回退房间页 anticode', error);
      return null;
    }
  }

  /** 读取指定画质的播放地址（桌面端播放器主要使用 quality.data） */
  getPlayUrls(_detail: LiveRoomDetail, quality: LivePlayQuality): LivePlayUrl {
    const urls = Array.isArray(quality.data)
      ? (quality.data as string[]).slice()
      : [];
    return { urls, headers: { 'user-agent': HUYA_SDK_USER_AGENT } };
  }

  /** 调用 WUP getCdnTokenInfoEx 获取取流 token */
  async getCdnTokenInfoEx(streamName: string): Promise<string> {
    const response = await this.post(
      HUYA_WUP_URL,
      buildWupRequest(buildCdnTokenRequest(streamName)),
      {
        'Content-Type': 'application/x-wup',
        'User-Agent': HUYA_SDK_USER_AGENT,
        Origin: HUYA_MOBILE_URL,
        Referer: HUYA_MOBILE_URL
      }
    );
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`虎牙 WUP 请求失败：HTTP ${response.status}`);
    }
    const parsed = parseCdnTokenResponse(response.bytes);
    if (parsed.code !== 0) {
      throw new Error(`虎牙 WUP 返回错误码 ${parsed.code}`);
    }
    if (!parsed.token) {
      throw new Error('虎牙 WUP 未返回取流签名');
    }
    return parsed.token;
  }

  /** 查询直播状态（房间不存在或未开播均返回 false） */
  async getLiveStatus(roomId: string): Promise<boolean> {
    try {
      const { data } = await this.getRoomInfo(roomId);
      return data.roomInfo?.eLiveStatus === 2;
    } catch (error) {
      this.logger.warn(`虎牙直播状态查询失败：${roomId}`, error);
      return false;
    }
  }

  /** 读取分类（虎牙固定四大类，子类来自 bussLive 配置） */
  async getCategores(): Promise<LiveCategory[]> {
    const categories: LiveCategory[] = [
      { id: '1', name: '网游', children: [] },
      { id: '2', name: '单机', children: [] },
      { id: '8', name: '娱乐', children: [] },
      { id: '3', name: '手游', children: [] }
    ];
    for (const category of categories) {
      category.children = await this.getSubCategores(category.id);
    }
    return categories;
  }

  private async getSubCategores(bussType: string): Promise<LiveSubCategory[]> {
    const uri = new URL('https://live.cdn.huya.com/liveconfig/game/bussLive');
    uri.searchParams.set('bussType', bussType);
    const result = await this.getJson<HuyaBussLiveResponse>(uri.toString());
    const subs: LiveSubCategory[] = [];
    for (const item of result.data ?? []) {
      const gid = normalizeGid(item.gid);
      if (!gid) {
        continue;
      }
      subs.push({
        id: gid,
        name: String(item.gameFullName ?? ''),
        parentId: bussType,
        pic: `https://huyaimg.msstatic.com/cdnimage/game/${gid}-MS.jpg`
      });
    }
    return subs;
  }

  /** 读取类目下房间 */
  async getCategoryRooms(
    category: LiveSubCategory,
    page = 1
  ): Promise<LiveCategoryResult> {
    return this.getLiveList(page, category.id);
  }

  /** 读取推荐房间 */
  async getRecommendRooms(page = 1): Promise<LiveCategoryResult> {
    return this.getLiveList(page);
  }

  private async getLiveList(
    page: number,
    gameId?: string
  ): Promise<LiveCategoryResult> {
    const uri = new URL('https://www.huya.com/cache.php');
    uri.searchParams.set('m', 'LiveList');
    uri.searchParams.set('do', 'getLiveListByPage');
    uri.searchParams.set('tagAll', '0');
    uri.searchParams.set('page', String(page));
    if (gameId) {
      uri.searchParams.set('gameId', gameId);
    }
    const result = await this.getJson<HuyaLiveListResponse>(uri.toString());
    const datas = result.data?.datas ?? [];
    const items: LiveRoomItem[] = datas.map((item) => ({
      roomId: String(item.profileRoom ?? ''),
      title: String(item.introduction ?? '') || String(item.roomName ?? ''),
      cover: fixCover(String(item.screenshot ?? '')),
      userName: String(item.nick ?? ''),
      online: tryParseInt(item.totalCount)
    }));
    const currentPage = tryParseInt(result.data?.page) || page;
    const totalPage = tryParseInt(result.data?.totalPage);
    return { hasMore: totalPage > 0 && currentPage < totalPage, items };
  }

  /** 搜索直播间 */
  async searchRooms(
    keyword: string,
    page = 1
  ): Promise<LiveSearchRoomResult> {
    const uri = new URL('https://search.cdn.huya.com/');
    const params: Record<string, string> = {
      m: 'Search',
      do: 'getSearchContent',
      q: keyword,
      uid: '0',
      v: '4',
      typ: '-5',
      livestate: '0',
      rows: '20',
      start: String((page - 1) * 20)
    };
    for (const [key, value] of Object.entries(params)) {
      uri.searchParams.set(key, value);
    }
    const result = await this.getJson<HuyaSearchResponse>(uri.toString());
    const docs = result.response?.['3']?.docs ?? [];
    const items: LiveRoomItem[] = docs.map((item) => ({
      roomId: String(item.room_id ?? ''),
      title:
        String(item.game_introduction ?? '') ||
        String(item.game_roomName ?? ''),
      cover: fixCover(String(item.game_screenshot ?? '')),
      userName: String(item.game_nick ?? ''),
      online: tryParseInt(item.game_total_count)
    }));
    const total = tryParseInt(result.response?.['3']?.numFound);
    return { hasMore: total > page * 20, items };
  }
}
