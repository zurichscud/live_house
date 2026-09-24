import { bundleCore } from './lib/bundle-core.mjs';

const core = await bundleCore('debug-cate');
const site = new core.DouyinSite();

const resp = await fetch('https://live.douyin.com/', {
  headers: {
    Authority: 'live.douyin.com',
    Referer: 'https://live.douyin.com',
    'User-Agent': core.DEFAULT_USER_AGENT,
    cookie: core.DEFAULT_TTWID_COOKIE
  }
});
const text = await resp.text();
console.log('html length:', text.length);

const i = text.indexOf('categoryData');
console.log('\n--- categoryData 起始附近 ---');
console.log(JSON.stringify(text.slice(i - 60, i + 160)));

const j = text.indexOf('运动', i);
console.log('\n--- 最后一个分类附近 ---');
console.log(JSON.stringify(text.slice(j - 80, j + 260)));

console.log('\n--- 正则匹配结果长度 ---');
const m = text.match(/\{\\"pathname\\":\\"\/\\",\\"categoryData.*?\]\\n/);
console.log('matched:', m ? m[0].length : 'null');

const site2 = site;
try {
  const categories = await site2.getCategores();
  console.log('categories:', categories.length);
} catch (e) {
  console.log('getCategores error:', e.message.slice(0, 120));
}
