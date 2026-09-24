import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * 项目自定义字号（@theme --text-*）需要显式声明，
 * 否则 tailwind-merge 会把 text-label 当作颜色类，与 text-ink 等冲突并丢弃后者。
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['micro', 'caption', 'label', 'body', 'title', 'display'] }
      ]
    }
  }
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
