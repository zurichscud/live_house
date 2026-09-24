import vm from 'node:vm';

export interface SignRuntime {
  eval<T = unknown>(expression: string): T;
}

/**
 * 在隔离的 vm context 中执行签名 JS。
 *
 * 注意：必须以非严格模式（sloppy mode）执行，签名脚本内部存在隐式全局赋值
 * （如 `document = {}`、`window = {}`），严格模式下会抛 ReferenceError。
 * vm.runInContext 默认即非严格模式。
 */
export function createSignRuntime(
  jsCode: string,
  filename = 'sign-runtime.js'
): SignRuntime {
  const sandbox: Record<string, unknown> = {
    console,
    atob: globalThis.atob,
    btoa: globalThis.btoa,
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,
    Buffer: globalThis.Buffer,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval
  };
  vm.createContext(sandbox);
  vm.runInContext(jsCode, sandbox, { filename });

  return {
    eval<T = unknown>(expression: string): T {
      return vm.runInContext(expression, sandbox) as T;
    }
  };
}
