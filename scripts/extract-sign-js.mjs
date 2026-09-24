import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');

/**
 * 签名 JS 的源头在 Dart 侧仓库（simple_live_core）。
 * 只有需要更新签名算法时才用本脚本重新生成；产物已提交在
 * packages/core/src/sign/js/ 下，正常运行本项目不需要 Dart 仓库。
 * 用 SIMPLE_LIVE_CORE_DIR 指定 simple_live_core 目录（默认 ../simple_live_core）。
 */
const coreDir =
  process.env.SIMPLE_LIVE_CORE_DIR ?? resolve(root, '../simple_live_core');
const dartFile = resolve(coreDir, 'lib/src/scripts/douyin_sign.dart');
const outDir = resolve(root, 'packages/core/src/sign/js');

let content;
try {
  content = readFileSync(dartFile, 'utf8');
} catch {
  console.error(
    [
      `找不到签名源码：${dartFile}`,
      '本脚本只用于从 Dart 侧重新生成签名 JS（packages/core/src/sign/js/*），',
      '产物已在仓库中，独立运行本项目不需要它。',
      '可用 SIMPLE_LIVE_CORE_DIR=/path/to/simple_live_core 指定目录。'
    ].join('\n')
  );
  process.exit(1);
}

function extract(name) {
  const re = new RegExp(`static const ${name} = r'''\\n([\\s\\S]*?)\\n''';`);
  const match = content.match(re);
  if (!match) {
    throw new Error(`${name} not found in ${dartFile}`);
  }
  return match[1];
}

function toTsModule(constName, jsCode) {
  return [
    '// 由 scripts/extract-sign-js.mjs 从 simple_live_core 自动生成，请勿手动修改',
    `export const ${constName} = ${JSON.stringify(jsCode)};`,
    ''
  ].join('\n');
}

mkdirSync(outDir, { recursive: true });

const abogus = extract('kABogus');
const webms = extract('kWebMsSDK');

writeFileSync(
  resolve(outDir, 'abogus.ts'),
  toTsModule('kABogus', abogus)
);
writeFileSync(
  resolve(outDir, 'webms.ts'),
  toTsModule('kWebMsSDK', webms)
);

console.log(`abogus.ts: ${abogus.split('\n').length} lines of JS`);
console.log(`webms.ts: ${webms.split('\n').length} lines of JS`);
console.log(`output: ${outDir}`);
