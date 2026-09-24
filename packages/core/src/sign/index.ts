import { createHash, randomBytes } from 'node:crypto';
import { DEFAULT_USER_AGENT } from '../common/constants.js';
import { kABogus as abogusCode } from './js/abogus.js';
import { kWebMsSDK as webmsCode } from './js/webms.js';
import { createSignRuntime, type SignRuntime } from './runtime.js';

export { DEFAULT_USER_AGENT };

let abogusRuntime: SignRuntime | null = null;
let webmsRuntime: SignRuntime | null = null;

function getAbogusRuntime(): SignRuntime {
  abogusRuntime ??= createSignRuntime(abogusCode, 'abogus.js');
  return abogusRuntime;
}

function getWebMsRuntime(): SignRuntime {
  webmsRuntime ??= createSignRuntime(webmsCode, 'webms.js');
  return webmsRuntime;
}

export function generateMsToken(length = 107): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
}

export function getABogus(params: string, userAgent: string): string {
  return getAbogusRuntime().eval<string>(
    `getABogus(${JSON.stringify(params)}, ${JSON.stringify(userAgent)})`
  );
}

/**
 * 为 URL 追加 msToken 与 a_bogus 签名参数（对应 Dart 端 DouyinSign.getAbogusUrl）
 */
export function getAbogusUrl(url: string, userAgent: string): string {
  const msToken = generateMsToken(107);
  const params = `${url}&msToken=${msToken}`.split('?')[1];
  const query = params.includes('?') ? params.split('?')[1] : params;
  const aBogus = getABogus(query, userAgent);
  return `${url}&msToken=${encodeURIComponent(msToken)}&a_bogus=${encodeURIComponent(aBogus)}`;
}

/**
 * 生成弹幕 WebSocket 签名用的 msStub（对应 Dart 端 DouyinSign.getMsStub）
 */
export function getMsStub(roomId: string, uniqueId: string): string {
  const params: Record<string, string | number> = {
    live_id: '1',
    aid: '6383',
    version_code: 180800,
    webcast_sdk_version: '1.3.0',
    room_id: roomId,
    sub_room_id: '',
    sub_channel_id: '',
    did_rule: '3',
    user_unique_id: uniqueId,
    device_platform: 'web',
    device_type: '',
    ac: '',
    identity: 'audience'
  };
  const sigParams = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
  return createHash('md5').update(sigParams, 'utf8').digest('hex');
}

/**
 * 生成弹幕 WebSocket signature（对应 Dart 端 DouyinSign.getSignature）
 */
export function getSignature(roomId: string, uniqueId: string): string {
  const runtime = getWebMsRuntime();
  const msStub = getMsStub(roomId, uniqueId);
  const call = `getMSSDKSignature(${JSON.stringify(msStub)}, ${JSON.stringify(DEFAULT_USER_AGENT)})`;
  let signature = runtime.eval<string>(call);
  while (signature.includes('-') || signature.includes('=')) {
    signature = runtime.eval<string>(call);
  }
  return signature;
}
