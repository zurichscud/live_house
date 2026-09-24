import { Slider as RadixSlider } from 'radix-ui';
import { cn } from '@/lib/cn';

type VolumeSliderTone = 'overlay' | 'docked';

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  /** overlay：叠在视频浮层上；docked：停靠在播放器下方（跟随主题） */
  tone?: VolumeSliderTone;
}

const toneStyles: Record<
  VolumeSliderTone,
  { track: string; range: string; thumb: string }
> = {
  overlay: {
    track: 'bg-white/25',
    range: 'bg-white',
    thumb: 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
  },
  docked: {
    track: 'bg-line-strong',
    range: 'bg-ink',
    thumb: 'bg-ink shadow-[0_1px_4px_rgba(0,0,0,0.35)]'
  }
};

export function VolumeSlider({
  value,
  onChange,
  ariaLabel,
  tone = 'overlay'
}: VolumeSliderProps): React.JSX.Element {
  const styles = toneStyles[tone];
  return (
    <RadixSlider.Root
      className="relative flex h-24 w-4 touch-none select-none items-center justify-center"
      orientation="vertical"
      value={[value]}
      min={0}
      max={1}
      step={0.05}
      onValueChange={([next]) => onChange(next)}
      aria-label={ariaLabel}
    >
      <RadixSlider.Track
        className={cn('relative h-full w-1 rounded-full', styles.track)}
      >
        <RadixSlider.Range
          className={cn('absolute w-full rounded-full', styles.range)}
        />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className={cn(
          'block size-3 rounded-full outline-none transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          styles.thumb
        )}
      />
    </RadixSlider.Root>
  );
}
