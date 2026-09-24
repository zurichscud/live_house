import { Dialog as RadixDialog } from 'radix-ui';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer
}: DialogProps): React.JSX.Element {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[var(--z-modal-backdrop)] animate-fade-in bg-black/60" />
        <RadixDialog.Content
          data-testid="dialog"
          className="fixed left-1/2 top-1/2 z-[var(--z-modal)] w-[520px] max-w-[calc(100vw-48px)] -translate-x-1/2 -translate-y-1/2 animate-scale-in rounded-md border border-line bg-surface shadow-[0_24px_64px_rgba(0,0,0,0.6)] focus:outline-none">
          <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
            <div>
              <RadixDialog.Title className="text-title text-ink">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-1 text-caption text-ink-3">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="关闭"
                className="-mr-1 -mt-1"
              >
                <X className="size-4" strokeWidth={1.75} />
              </Button>
            </RadixDialog.Close>
          </div>
          <div className="px-5">{children}</div>
          {footer && (
            <div className="flex justify-end gap-2 px-5 pb-5 pt-4">{footer}</div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
