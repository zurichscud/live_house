import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '../..');

/** 将 core 包（含 ?raw 签名 JS）打包为可被 Node 直接 import 的 ESM 文件 */
export async function bundleCore(name = 'core') {
  const outDir = resolve(root, 'packages/core/.tmp');
  mkdirSync(outDir, { recursive: true });
  const outfile = resolve(outDir, `${name}.mjs`);

  await build({
    entryPoints: [resolve(root, 'packages/core/src/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    outfile,
    external: ['node:*', 'ws'],
    logLevel: 'warning'
  });

  return import(pathToFileURL(outfile).href);
}
