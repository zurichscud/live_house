import { build } from 'esbuild';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const outDir = resolve(root, '.tmp');
mkdirSync(outDir, { recursive: true });
const outfile = resolve(outDir, 'sign.mjs');

await build({
  entryPoints: [resolve(root, 'packages/core/src/sign/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  external: ['node:*'],
  plugins: [
    {
      name: 'raw-js',
      setup(b) {
        b.onResolve({ filter: /\?raw$/ }, (args) => {
          const p = args.path.replace(/\?raw$/, '');
          return { path: resolve(args.resolveDir, p), namespace: 'raw' };
        });
        b.onLoad({ filter: /.*/, namespace: 'raw' }, (args) => ({
          contents: `export default ${JSON.stringify(readFileSync(args.path, 'utf8'))}`,
          loader: 'js'
        }));
      }
    }
  ],
  logLevel: 'warning'
});

const sign = await import(pathToFileURL(outfile).href);

console.log('=== 本地签名验证 ===');
const t0 = Date.now();
const abogus = sign.getABogus(
  'aid=6383&app_name=douyin_web&live_id=1',
  sign.DEFAULT_USER_AGENT
);
console.log(
  `a_bogus: ${abogus.slice(0, 44)}... (len=${abogus.length}, ${Date.now() - t0}ms)`
);

const t1 = Date.now();
const sig = sign.getSignature('7380000000000000000', '123456789012');
console.log(`signature: ${sig} (len=${sig.length}, ${Date.now() - t1}ms)`);

const t2 = Date.now();
const signed = sign.getAbogusUrl(
  'https://live.douyin.com/webcast/web/partition/detail/room/v2/?aid=6383&partition=720&partition_type=1&count=15&offset=0',
  sign.DEFAULT_USER_AGENT
);
console.log(`signed url ok (${Date.now() - t2}ms)`);
console.log(`  ${signed.slice(0, 130)}...`);

console.log('\n=== 网络验证（推荐接口） ===');
const base =
  'https://live.douyin.com/webcast/web/partition/detail/room/v2/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&enter_from=link_share&cookie_enabled=true&screen_width=1980&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Edge&browser_version=125.0.0.0&browser_online=true&count=15&offset=0&partition=720&partition_type=1&req_from=2';
const requestUrl = sign.getAbogusUrl(base, sign.DEFAULT_USER_AGENT);
const ttwid =
  'ttwid=1%7CB1qls3GdnZhUov9o2NxOMxxYS2ff6OSvEWbv0ytbES4%7C1680522049%7C280d802d6d478e3e78d0c807f7c487e7ffec0ae4e5fdd6a0fe74c3c6af149511';

try {
  const resp = await fetch(requestUrl, {
    headers: {
      Authority: 'live.douyin.com',
      Referer: 'https://live.douyin.com',
      'User-Agent': sign.DEFAULT_USER_AGENT,
      Cookie: ttwid
    }
  });
  const text = await resp.text();
  let statusCode = 'N/A';
  let count = 0;
  try {
    const json = JSON.parse(text);
    statusCode = String(json.status_code ?? json.statusCode ?? 'unknown');
    count = json.data?.data?.length ?? 0;
    if (json.status_code === 0 && count > 0) {
      console.log(`✅ 接口调用成功：status_code=0, 返回 ${count} 个房间`);
      console.log(`   示例房间: ${json.data.data[0]?.room?.title ?? ''}`);
    } else {
      console.log(`⚠️ 返回异常：status_code=${statusCode}`);
      console.log(`   ${text.slice(0, 200)}`);
    }
  } catch {
    console.log(`⚠️ 非 JSON 响应（前 200 字符）：${text.slice(0, 200)}`);
  }
} catch (e) {
  console.log(`⚠️ 网络请求失败：${e.message}`);
}
