import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-sm font-medium transition-colors duration-150 ease-out-expo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-ink hover:bg-primary-hover',
        secondary:
          'border border-line bg-surface text-ink hover:border-line-strong hover:bg-raised',
        ghost: 'text-ink-2 hover:bg-raised hover:text-ink',
        danger: 'bg-accent-soft text-accent-text hover:bg-accent-soft/80'
      },
      size: {
        md: 'h-[34px] px-4 text-label',
        sm: 'h-8 px-3 text-caption',
        icon: 'size-8 p-0'
      }
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md'
    }
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-3.5 animate-spin-slow" />}
      {children}
    </button>
  );
}
