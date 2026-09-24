export interface HttpRequestOptions {
  method?: 'GET' | 'HEAD';
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface HttpResponse {
  status: number;
  /** 响应头，key 为小写；set-cookie 为完整数组 */
  headers: Record<string, string[]>;
  text: string;
}

export type HttpAdapter = (
  url: string,
  options?: HttpRequestOptions
) => Promise<HttpResponse>;

function headersToRecord(headers: Headers): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = [value];
  });
  const withSetCookie = headers as unknown as {
    getSetCookie?: () => string[];
  };
  if (typeof withSetCookie.getSetCookie === 'function') {
    result['set-cookie'] = withSetCookie.getSetCookie();
  }
  return result;
}

/** 默认 HTTP 适配器：使用运行时内置 fetch（Node 18+ / 浏览器） */
export const fetchHttpAdapter: HttpAdapter = async (url, options = {}) => {
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: options.headers,
    signal: options.signal
  });
  return {
    status: response.status,
    headers: headersToRecord(response.headers),
    text: await response.text()
  };
};

export async function getJson<T = unknown>(
  http: HttpAdapter,
  url: string,
  options?: HttpRequestOptions
): Promise<T> {
  const response = await http(url, options);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`请求失败：HTTP ${response.status} ${url}`);
  }
  try {
    return JSON.parse(response.text) as T;
  } catch {
    throw new Error(`响应不是合法 JSON：${url}`);
  }
}
