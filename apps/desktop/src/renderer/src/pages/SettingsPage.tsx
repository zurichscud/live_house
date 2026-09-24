import { useEffect, useState } from 'react';
import { BadgeCheck, ExternalLink, KeyRound, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { DouyinSelfInfo } from '@live-house/core';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { errorMessage } from '@/lib/error';

export function SettingsPage() {
  const [cookie, setCookie] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [account, setAccount] = useState<DouyinSelfInfo | null>(null);
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    void window.api.settings.getCookie().then(setCookie);
  }, []);

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      await window.api.settings.setCookie(cookie.trim());
      toast.success('已保存 Cookie');
      setVerifyError('');
      setAccount(null);
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const verify = async (): Promise<void> => {
    setVerifying(true);
    setVerifyError('');
    setAccount(null);
    try {
      setAccount(await window.api.following.getSelfInfo());
    } catch (e) {
      setVerifyError(errorMessage(e));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[620px] flex-col gap-6 px-5 py-6">
          <h1 className="text-title font-semibold text-ink">设置</h1>

          <section className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-ink-3" strokeWidth={1.75} />
              <h2 className="text-label font-medium text-ink">抖音 Cookie</h2>
            </div>
            <p className="max-w-[62ch] text-caption leading-relaxed text-ink-3">
              用于「关注」列表与「搜索」等需要登录态的接口。不配置也可以正常观看直播与弹幕；
              配置只保存在本机，不会上传。
            </p>
            <Textarea
              id="cookie-input"
              rows={5}
              value={cookie}
              onChange={(event) => setCookie(event.target.value)}
              placeholder="粘贴 live.douyin.com 的完整 Cookie 值"
              spellCheck={false}
              aria-label="抖音 Cookie"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                onClick={() => void save()}
              >
                保存
              </Button>
              <Button
                variant="secondary"
                size="sm"
                loading={verifying}
                onClick={() => void verify()}
              >
                <BadgeCheck className="size-3.5" strokeWidth={1.75} />
                验证登录
              </Button>
              {account && (
                <span className="flex items-center gap-1.5 text-caption text-live">
                  <BadgeCheck className="size-3.5" strokeWidth={2} />
                  已登录：{account.nickname}
                  {account.uniqueId ? `（抖音号 ${account.uniqueId}）` : ''}·
                  关注 {account.followingCount}
                </span>
              )}
              {verifying && <Spinner label="正在验证…" />}
            </div>
            {verifyError && (
              <p className="flex items-start gap-2 text-caption text-accent-text">
                <TriangleAlert
                  className="mt-0.5 size-3.5 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
                {verifyError}
              </p>
            )}
            <a
              href="https://live.douyin.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1 text-caption text-accent-text transition-colors duration-150 hover:text-accent-hover"
              onClick={(event) => {
                event.preventDefault();
                window.open('https://live.douyin.com', '_blank');
              }}
            >
              打开抖音直播网页版获取 Cookie
              <ExternalLink className="size-3" strokeWidth={2} />
            </a>
            <p className="max-w-[62ch] text-caption leading-relaxed text-ink-3">
              获取方式：浏览器登录抖音网页版 → 打开开发者工具 → Network →
              任意请求 → 复制请求头中 Cookie 的完整值。
            </p>
          </section>

          <section className="flex flex-col gap-2.5 border-t border-line pt-6">
            <h2 className="text-label font-medium text-ink">关于</h2>
            <p className="max-w-[62ch] text-caption leading-relaxed text-ink-3">
              LIVE HOUSE 直播客户端。直播数据来自抖音 / 哔哩哔哩 /
              虎牙的公开接口，通过签名与协议逆向实现，可能随平台调整而失效。
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
