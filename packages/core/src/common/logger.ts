export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export const defaultLogger: Logger = {
  debug: (...args) => console.debug('[live-house]', ...args),
  info: (...args) => console.info('[live-house]', ...args),
  warn: (...args) => console.warn('[live-house]', ...args),
  error: (...args) => console.error('[live-house]', ...args)
};
