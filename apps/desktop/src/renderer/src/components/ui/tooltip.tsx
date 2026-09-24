import { Tooltip as RadixTooltip } from 'radix-ui';
import type { ReactNode } from 'react';

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({
  label,
  children,
  side = 'top'
}: TooltipProps): React.JSX.Element {
  return (
    <RadixTooltip.Root delayDuration={350}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="z-[var(--z-tooltip)] animate-fade-in rounded-sm border border-line bg-raised px-2 py-1 text-caption text-ink-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          {label}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

export const TooltipProvider = RadixTooltip.Provider;
