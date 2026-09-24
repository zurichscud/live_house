/**
 * 从异常中提取可展示给用户的消息。
 * Electron IPC 会把主进程错误包装为
 * "Error invoking remote method 'x': Error: 真实消息"，这里剥离包装。
 */
export function errorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const match = raw.match(
    /Error invoking remote method '[^']+':\s*(?:Error:\s*)?([\s\S]*)/
  );
  return (match?.[1] ?? raw).trim();
}
