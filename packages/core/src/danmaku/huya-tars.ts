/**
 * 虎牙 Tars 编解码子集（不引入 tars 依赖，自行实现）。
 *
 * 覆盖范围：
 * - 通用读写：int1/int2/int4/int8、bool、string1/string4、bytes(SimpleList/List)、
 *   嵌套 struct、map（仅读取时的跳过与 WUP 响应所需的 bytes map）；
 * - 虎牙弹幕（wup2）：加入房间包、心跳、推送消息解析；
 * - WUP 请求/响应：供 `getCdnTokenInfoEx` 取流签名使用。
 *
 * 类型编号与 tars_dart 的 `TarsStructType` 保持一致。
 */

const TARS_BYTE = 0;
const TARS_SHORT = 1;
const TARS_INT = 2;
const TARS_LONG = 3;
const TARS_STRING1 = 6;
const TARS_STRING4 = 7;
const TARS_MAP = 8;
const TARS_LIST = 9;
const TARS_STRUCT_BEGIN = 10;
const TARS_STRUCT_END = 11;
const TARS_ZERO_TAG = 12;
const TARS_SIMPLE_LIST = 13;

interface TarsHead {
  type: number;
  tag: number;
}

/** Tars 输出流：仅实现本项目所需的写入子集 */
export class TarsWriter {
  private readonly bytes: number[] = [];

  /** 写入头部（tag < 15 时单字节，否则两字节） */
  private writeHead(type: number, tag: number): void {
    if (tag < 15) {
      this.bytes.push((tag << 4) | type);
      return;
    }
    this.bytes.push((15 << 4) | type);
    this.bytes.push(tag);
  }

  private writeNumber(value: number, length: 2 | 4 | 8): void {
    if (length === 8) {
      const buffer = new ArrayBuffer(8);
      new DataView(buffer).setBigInt64(0, BigInt(Math.trunc(value)));
      this.bytes.push(...new Uint8Array(buffer));
      return;
    }
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    if (length === 2) {
      view.setInt16(0, value);
    } else {
      view.setInt32(0, value);
    }
    this.bytes.push(...new Uint8Array(buffer));
  }

  /** 写入 1 字节整型（0 使用 ZERO_TAG 压缩） */
  writeByte(value: number, tag: number): void {
    if (value === 0) {
      this.writeHead(TARS_ZERO_TAG, tag);
      return;
    }
    this.writeHead(TARS_BYTE, tag);
    this.bytes.push(value & 0xff);
  }

  /** 写入整型（按取值自动选择 int1/int2/int4/int8） */
  writeInt(value: number, tag: number): void {
    if (value >= -128 && value <= 127) {
      this.writeByte(value, tag);
      return;
    }
    if (value >= -32768 && value <= 32767) {
      this.writeHead(TARS_SHORT, tag);
      this.writeNumber(value, 2);
      return;
    }
    if (value >= -2147483648 && value <= 2147483647) {
      this.writeHead(TARS_INT, tag);
      this.writeNumber(value, 4);
      return;
    }
    this.writeHead(TARS_LONG, tag);
    this.writeNumber(value, 8);
  }

  writeBool(value: boolean, tag: number): void {
    this.writeByte(value ? 1 : 0, tag);
  }

  /** 写入字符串（长度 > 255 时使用 string4） */
  writeString(value: string, tag: number): void {
    const encoded = new TextEncoder().encode(value);
    if (encoded.length > 255) {
      this.writeHead(TARS_STRING4, tag);
      this.writeNumber(encoded.length, 4);
    } else {
      this.writeHead(TARS_STRING1, tag);
      this.bytes.push(encoded.length);
    }
    this.bytes.push(...encoded);
  }

  /** 写入 byte[]（SimpleList） */
  writeBytes(value: Uint8Array, tag: number): void {
    this.writeHead(TARS_SIMPLE_LIST, tag);
    this.writeHead(TARS_BYTE, 0);
    this.writeInt(value.length, 0);
    this.bytes.push(...value);
  }

  /** 写入 map<string, byte[]>（WUP 请求属性表） */
  writeBytesMap(entries: Array<[string, Uint8Array]>, tag: number): void {
    this.writeHead(TARS_MAP, tag);
    this.writeInt(entries.length, 0);
    for (const [key, value] of entries) {
      this.writeString(key, 0);
      this.writeBytes(value, 1);
    }
  }

  /** 写入空 map（WUP 的 context / status 字段） */
  writeEmptyMap(tag: number): void {
    this.writeHead(TARS_MAP, tag);
    this.writeInt(0, 0);
  }

  writeStructBegin(tag: number): void {
    this.writeHead(TARS_STRUCT_BEGIN, tag);
  }

  writeStructEnd(): void {
    this.writeHead(TARS_STRUCT_END, 0);
  }

  /** 直接追加已编码好的 struct 内容（不含头部） */
  writeRaw(value: Uint8Array): void {
    this.bytes.push(...value);
  }

  toUint8Array(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

/** Tars 输入流：按 tag 顺序读取，自动跳过无关字段 */
export class TarsReader {
  private readonly bytes: Uint8Array;
  private position: number;

  constructor(bytes: Uint8Array, position = 0) {
    this.bytes = bytes;
    this.position = position;
  }

  private readHead(): TarsHead {
    if (this.position >= this.bytes.length) {
      throw new Error('虎牙 Tars：数据已到末尾');
    }
    const head = this.bytes[this.position] ?? 0;
    this.position += 1;
    let type = head & 0x0f;
    let tag = (head & 0xf0) >> 4;
    if (tag === 15) {
      if (this.position >= this.bytes.length) {
        throw new Error('虎牙 Tars：tag 扩展字节缺失');
      }
      tag = this.bytes[this.position] ?? 0;
      this.position += 1;
    }
    return { type, tag };
  }

  private peekHead(): TarsHead {
    const position = this.position;
    const head = this.readHead();
    this.position = position;
    return head;
  }

  /** 按类型跳过一个字段的负载 */
  private skipField(type: number): void {
    switch (type) {
      case TARS_BYTE:
        this.position += 1;
        break;
      case TARS_SHORT:
        this.position += 2;
        break;
      case TARS_INT:
        this.position += 4;
        break;
      case TARS_LONG:
        this.position += 8;
        break;
      case TARS_STRING1: {
        const length = this.bytes[this.position] ?? 0;
        this.position += 1 + length;
        break;
      }
      case TARS_STRING4: {
        const length = this.readNumber(4);
        this.position += length;
        break;
      }
      case TARS_SIMPLE_LIST: {
        this.readHead();
        const size = this.readInt(0);
        this.position += size;
        break;
      }
      case TARS_LIST: {
        const size = this.readInt(0);
        for (let i = 0; i < size; i++) {
          const head = this.readHead();
          this.skipField(head.type);
        }
        break;
      }
      case TARS_MAP: {
        const size = this.readInt(0);
        for (let i = 0; i < size * 2; i++) {
          const head = this.readHead();
          this.skipField(head.type);
        }
        break;
      }
      case TARS_STRUCT_BEGIN: {
        let head = this.readHead();
        while (head.type !== TARS_STRUCT_END) {
          this.skipField(head.type);
          head = this.readHead();
        }
        break;
      }
      default:
        // ZERO_TAG / STRUCT_END 无负载
        break;
    }
  }

  private readNumber(length: 2 | 4 | 8): number {
    const view = new DataView(
      this.bytes.buffer,
      this.bytes.byteOffset + this.position,
      length
    );
    this.position += length;
    if (length === 2) {
      return view.getInt16(0);
    }
    if (length === 4) {
      return view.getInt32(0);
    }
    return Number(view.getBigInt64(0));
  }

  /** 移动到指定 tag（不匹配时返回 false，与 Dart 端 skipToTag 行为一致） */
  private skipToTag(tag: number): boolean {
    for (;;) {
      if (this.position >= this.bytes.length) {
        return false;
      }
      const head = this.peekHead();
      if (tag <= head.tag || head.type === TARS_STRUCT_END) {
        return tag === head.tag;
      }
      this.readHead();
      this.skipField(head.type);
    }
  }

  readInt(tag: number): number {
    if (!this.skipToTag(tag)) {
      return 0;
    }
    const head = this.readHead();
    switch (head.type) {
      case TARS_ZERO_TAG:
        return 0;
      case TARS_BYTE:
        return this.bytes[this.position++] ?? 0;
      case TARS_SHORT:
        return this.readNumber(2);
      case TARS_INT:
        return this.readNumber(4);
      case TARS_LONG:
        return this.readNumber(8);
      default:
        throw new Error(`虎牙 Tars：tag ${tag} 不是整型（type=${head.type}）`);
    }
  }

  readString(tag: number): string {
    if (!this.skipToTag(tag)) {
      return '';
    }
    const head = this.readHead();
    let length: number;
    if (head.type === TARS_STRING1) {
      length = this.bytes[this.position] ?? 0;
      this.position += 1;
    } else if (head.type === TARS_STRING4) {
      length = this.readNumber(4);
    } else {
      throw new Error(`虎牙 Tars：tag ${tag} 不是字符串（type=${head.type}）`);
    }
    const value = this.bytes.subarray(this.position, this.position + length);
    this.position += length;
    return new TextDecoder().decode(value);
  }

  readBytes(tag: number): Uint8Array {
    if (!this.skipToTag(tag)) {
      return new Uint8Array(0);
    }
    const head = this.readHead();
    if (head.type === TARS_SIMPLE_LIST) {
      const elementHead = this.readHead();
      if (elementHead.type !== TARS_BYTE) {
        throw new Error(`虎牙 Tars：tag ${tag} 的 byte[] 元素类型异常`);
      }
      const size = this.readInt(0);
      const value = this.bytes.subarray(this.position, this.position + size);
      this.position += size;
      return value;
    }
    if (head.type === TARS_LIST) {
      const size = this.readInt(0);
      const value = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        value[i] = this.readInt(0);
      }
      return value;
    }
    throw new Error(`虎牙 Tars：tag ${tag} 不是 byte[]（type=${head.type}）`);
  }

  /**
   * 读取嵌套 struct，返回其内部字段的读取器（不含 STRUCT_BEGIN/STRUCT_END）。
   * 不存在该 tag 时返回 null。
   */
  readStruct(tag: number): TarsReader | null {
    if (!this.skipToTag(tag)) {
      return null;
    }
    const head = this.readHead();
    if (head.type !== TARS_STRUCT_BEGIN) {
      return null;
    }
    const start = this.position;
    let depth = 1;
    while (depth > 0 && this.position < this.bytes.length) {
      const inner = this.readHead();
      if (inner.type === TARS_STRUCT_BEGIN) {
        depth += 1;
      } else if (inner.type === TARS_STRUCT_END) {
        depth -= 1;
      } else {
        this.skipField(inner.type);
      }
    }
    const end = this.position - 1;
    return new TarsReader(this.bytes.subarray(start, end));
  }

  /** 读取 map<string, byte[]>（WUP 属性表） */
  readBytesMap(tag: number): Map<string, Uint8Array> {
    const map = new Map<string, Uint8Array>();
    if (!this.skipToTag(tag)) {
      return map;
    }
    const head = this.readHead();
    if (head.type !== TARS_MAP) {
      return map;
    }
    const size = this.readInt(0);
    for (let i = 0; i < size; i++) {
      const key = this.readString(0);
      map.set(key, this.readBytes(1));
    }
    return map;
  }
}

// ------------------------------------------------------------------
// 虎牙弹幕（wup2 over WebSocket）
// ------------------------------------------------------------------

/** 弹幕 WebSocket 地址 */
export const HUYA_DANMAKU_URL = 'wss://cdnws.api.huya.com';

/** 虎牙 SDK UA：弹幕与 CDN 拉流均会校验 */
export const HUYA_SDK_USER_AGENT =
  'HYSDK(Windows, 30000002)_APP(pc_exe&7060000&official)_SDK(trans&2.32.3.5646)';

/** 心跳包（与 Dart 端 base64 `ABQdAAwsNgBM` 等价的字节） */
export const HUYA_DANMAKU_HEARTBEAT = new Uint8Array([
  0x00, 0x14, 0x1d, 0x00, 0x0c, 0x2c, 0x36, 0x00, 0x4c
]);

/** 弹幕连接参数（与 `LiveRoomDetail.danmakuData` 一致，必须是可结构化克隆的纯对象） */
export interface HuyaDanmakuArgs {
  ayyuid: number;
  topSid: number;
  subSid: number;
}

/** 构造加入房间包：wscmd{0: 1(join), 1: join 参数} */
export function buildHuyaJoinPacket(args: HuyaDanmakuArgs): Uint8Array {
  const join = new TarsWriter();
  join.writeInt(args.ayyuid, 0);
  join.writeBool(true, 1);
  join.writeString('', 2);
  join.writeString('', 3);
  join.writeInt(args.topSid, 4);
  join.writeInt(args.subSid, 5);
  join.writeInt(0, 6);
  join.writeInt(0, 7);

  const command = new TarsWriter();
  command.writeInt(1, 0);
  command.writeBytes(join.toUint8Array(), 1);
  return command.toUint8Array();
}

export interface HuyaChatPush {
  kind: 'chat';
  userName: string;
  message: string;
}

export interface HuyaOnlinePush {
  kind: 'online';
  online: number;
}

export type HuyaPushMessage = HuyaChatPush | HuyaOnlinePush;

/**
 * 解析推送帧：外层 `{0: 消息类型(7=推送), 1: HYPushMessage 字节}`，
 * 内层 uri 1400 为聊天、8006 为在线人数。非推送帧返回 null。
 */
export function parseHuyaPushMessage(data: Uint8Array): HuyaPushMessage | null {
  const frame = new TarsReader(data);
  if (frame.readInt(0) !== 7) {
    return null;
  }
  const payload = new TarsReader(frame.readBytes(1));
  payload.readInt(0);
  const uri = payload.readInt(1);
  const message = payload.readBytes(2);

  if (uri === 1400) {
    const content = new TarsReader(message);
    const sender = content.readStruct(0);
    const userName = sender?.readString(2) ?? '';
    return { kind: 'chat', userName, message: content.readString(3) };
  }
  if (uri === 8006) {
    return { kind: 'online', online: new TarsReader(message).readInt(0) };
  }
  return null;
}
