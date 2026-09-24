import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes
} from 'react';
import { cn } from '@/lib/cn';

const fieldClasses =
  'w-full rounded-sm border border-line bg-surface text-ink placeholder:text-ink-3 transition-colors duration-150 ease-out-expo focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25';

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>): React.JSX.Element {
  return (
    <input
      className={cn(fieldClasses, 'h-[34px] px-3 text-label', className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>): React.JSX.Element {
  return (
    <textarea
      className={cn(fieldClasses, 'px-3 py-2 text-label leading-relaxed', className)}
      {...props}
    />
  );
}
