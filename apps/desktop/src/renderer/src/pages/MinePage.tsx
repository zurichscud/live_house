import { useState } from 'react';
import { Users } from 'lucide-react';
import { FollowingPanel } from '@/components/FollowingPanel';
import { PlatformTabs, type PlatformTabId } from '@/components/PlatformTabs';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';
import { DEFAULT_SITE, getSite } from '@/lib/sites';

/** 我的：按平台查看关注列表（当前仅抖音已开发） */
export function MinePage(): React.JSX.Element {
  const [activeSite, setActiveSite] = useState<PlatformTabId>(DEFAULT_SITE);
  const site = getSite(activeSite);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 px-5 pb-1 pt-5">
        <h1 className="min-w-0 flex-1 truncate text-title font-semibold text-ink">
          我的
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-3 px-5 pt-3">
        <PlatformTabs
          value={activeSite}
          onChange={setActiveSite}
          testIdPrefix="mine-tab"
        />
      </div>

      {/* 支持关注列表的平台（当前仅抖音）保持挂载，切换 tab 不重新拉取 */}
      {site?.following && (
        <div
          className={cn(
            'min-h-0 flex-1 flex-col',
            activeSite === 'douyin' ? 'flex' : 'hidden'
          )}
        >
          <FollowingPanel />
        </div>
      )}

      {!site?.following && (
        <main className="min-h-0 flex-1 overflow-y-auto">
          <EmptyState
            icon={Users}
            iconSrc={site?.icon}
            title={`${site?.name ?? '该平台'}关注列表还在开发中`}
            description={`开发完成后，${site?.shortName ?? '该平台'}的关注列表会显示在这里`}
          />
        </main>
      )}
    </div>
  );
}
