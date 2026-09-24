import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { isMac } from '@/lib/platform';
import { toggleTheme, useTheme } from '@/lib/theme';

/**
 * 窗口标题栏（复刻 skills-deck 布局）：中性细条，左侧让位给 macOS 红绿灯，
 * 右侧只有主题切换。品牌在侧边栏顶部，标题栏不放其他内容与操作。
 */
export function TitleBar(): React.JSX.Element {
  const theme = useTheme();
  const nextThemeLabel = theme === 'dark' ? '亮色' : '暗色';

  return (
    <header
      data-testid="title-bar"
      className={cn(
        'drag-region flex h-11 shrink-0 items-center border-b border-line bg-surface',
        isMac ? 'pl-[86px] pr-3' : 'pl-3 pr-[148px]'
      )}
    >
      <div className="no-drag ml-auto flex shrink-0 items-center">
        <Tooltip label={`切换到${nextThemeLabel}模式`}>
          <Button
            variant="ghost"
            size="icon"
            data-testid="theme-toggle"
            className="size-7"
            onClick={toggleTheme}
            aria-label={`切换到${nextThemeLabel}模式`}
          >
            {/* 双图标常驻 DOM，交叉淡入切换 */}
            <span className="relative block size-3.5">
              <Sun
                className={cn(
                  'absolute inset-0 size-3.5 transition-[opacity,scale,filter] duration-300 ease-out-expo',
                  theme === 'dark'
                    ? 'scale-100 opacity-100 blur-0'
                    : 'scale-[0.25] opacity-0 blur-[4px]'
                )}
                strokeWidth={1.75}
                aria-hidden
              />
              <Moon
                className={cn(
                  'absolute inset-0 size-3.5 transition-[opacity,scale,filter] duration-300 ease-out-expo',
                  theme === 'light'
                    ? 'scale-100 opacity-100 blur-0'
                    : 'scale-[0.25] opacity-0 blur-[4px]'
                )}
                strokeWidth={1.75}
                aria-hidden
              />
            </span>
          </Button>
        </Tooltip>
      </div>
    </header>
  );
}
