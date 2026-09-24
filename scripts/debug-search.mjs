import { bundleCore } from './lib/bundle-core.mjs';

const core = await bundleCore('debug-search');

// 1. 检查 HEAD 拿 cookie
const headResp = await fetch('https://live.douyin.com', {
  method: 'HEAD',
  headers: {
    Authority: 'live.douyin.com',
    Referer: 'https://live.douyin.com',
    'User-Agent': core.DEFAULT_USER_AGENT,
    cookie: core.DEFAULT_TTWID_COOKIE
  }
});
const setCookies = headResp.headers.getSetCookie?.() ?? [];
console.log('HEAD set-cookie count:', setCookies.length);
for (const c of setCookies) {
  console.log('  ', c.split(';')[0].slice(0, 60));
}

// 2. 直接请求搜索接口看原始响应
const uri = new URL('https://www.douyin.com/aweme/v1/web/live/search/');
const params = {
  device_platform: 'webapp',
  aid: '6383',
  channel: 'channel_pc_web',
  search_channel: 'aweme_live',
  keyword: '游戏',
  search_source: 'switch_tab',
  query_correct_type: '1',
  is_filter_search: '0',
  from_group_id: '',
  offset: '0',
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
for (const [k, v] of Object.entries(params)) uri.searchParams.set(k, v);

let dyCookie = '';
for (const item of setCookies) {
  const first = item.split(';')[0];
  if (first.includes('ttwid')) dyCookie += `${first};`;
  if (first.includes('__ac_nonce')) dyCookie += `${first};`;
}
console.log('\ndyCookie:', dyCookie.slice(0, 100) || '(empty)');

const resp = await fetch(uri.toString(), {
  headers: {
    Authority: 'www.douyin.com',
    accept: 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
    cookie: dyCookie,
    priority: 'u=1, i',
    referer: `https://www.douyin.com/search/${encodeURIComponent('游戏')}?type=live`,
    'sec-ch-ua': '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': core.DEFAULT_USER_AGENT
  }
});
const text = await resp.text();
console.log('\nstatus:', resp.status, 'len:', text.length);
console.log('body head:', text.slice(0, 400));

try {
  const json = JSON.parse(text);
  console.log('\nstatus_code:', json.status_code);
  console.log('data length:', json.data?.length);
  if (json.data?.[0]) {
    console.log('first item keys:', Object.keys(json.data[0]));
    console.log('lives keys:', Object.keys(json.data[0].lives ?? {}));
  }
} catch {
  console.log('not json');
}
