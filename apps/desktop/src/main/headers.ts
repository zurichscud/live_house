import { session } from 'electron';
import type { StreamHeaderRule } from '@live-house/core';
import { sites } from './site.js';

/** 按站点声明的域名规则匹配（含子域） */
function findRule(hostname: string): StreamHeaderRule | undefined {
  for (const site of Object.values(sites)) {
    for (const rule of site.streamHeaderRules ?? []) {
      const matched = rule.domains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );
      if (matched) {
        return rule;
      }
    }
  }
  return undefined;
}

/**
 * 为各平台域名注入 Referer / Origin / UA（按站点规则）。
 * 渲染进程中的 mpegts.js / hls.js 无法自定义这些请求头，必须在主进程拦截注入。
 */
export function setupHeaderInjection(): void {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*/*'] },
    (details, callback) => {
      try {
        const url = new URL(details.url);
        const rule = findRule(url.hostname);
        if (rule) {
          details.requestHeaders['Referer'] = rule.referer;
          if (rule.origin) {
            details.requestHeaders['Origin'] = rule.origin;
          }
          if (rule.userAgent) {
            details.requestHeaders['User-Agent'] = rule.userAgent;
          }
        }
      } catch {
        // 非法 URL 忽略
      }
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  // 部分 CDN 不返回 CORS 头，需注入允许头供渲染进程拉流
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['*://*/*'] },
    (details, callback) => {
      try {
        const url = new URL(details.url);
        const rule = findRule(url.hostname);
        if (rule?.injectCors) {
          const responseHeaders = details.responseHeaders ?? {};
          responseHeaders['Access-Control-Allow-Origin'] = ['*'];
          responseHeaders['Access-Control-Allow-Headers'] = ['*'];
          responseHeaders['Access-Control-Allow-Methods'] = ['GET,HEAD,OPTIONS'];
          callback({ responseHeaders });
          return;
        }
      } catch {
        // 非法 URL 忽略
      }
      callback({});
    }
  );
}
