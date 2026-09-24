import { DropdownMenu as RadixDropdown } from 'radix-ui';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface MenuItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: MenuItem[];
  value: string;
  onSelect: (value: string) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  onOpenChange?: (open: boolean) => void;
}

/** 标准单选下拉菜单（画质 / 线路 / 平台切换） */
export function Dropdown({
  trigger,
  items,
  value,
  onSelect,
  align = 'end',
  side = 'top',
  onOpenChange
}: DropdownProps): React.JSX.Element {
  return (
    <RadixDropdown.Root onOpenChange={onOpenChange}>
      <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          align={align}
          side={side}
          sideOffset={8}
          className="z-[var(--z-dropdown)] min-w-32 animate-scale-in rounded-sm border border-line bg-raised p-1 shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
        >
          <RadixDropdown.RadioGroup value={value} onValueChange={onSelect}>
            {items.map((item) => (
              <RadixDropdown.RadioItem
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                data-testid="menu-item"
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-[4px] px-2.5 py-1.5 text-label outline-none transition-colors duration-150',
                  'data-[highlighted]:bg-surface data-[highlighted]:text-ink',
                  'data-[state=checked]:text-ink data-[state=unchecked]:text-ink-2',
                  'data-[disabled]:cursor-default data-[disabled]:opacity-40 data-[disabled]:data-[highlighted]:bg-transparent'
                )}
              >
                <span>{item.label}</span>
                <RadixDropdown.ItemIndicator>
                  <Check className="size-3.5 text-accent-text" strokeWidth={2.5} />
                </RadixDropdown.ItemIndicator>
              </RadixDropdown.RadioItem>
            ))}
          </RadixDropdown.RadioGroup>
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}
