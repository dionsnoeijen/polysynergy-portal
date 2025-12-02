'use client';

import clsx from 'clsx'
import { useBranding } from '@/contexts/branding-context'

export function Divider({
  soft = false,
  bleed = false,
  className,
  ...props
}: { soft?: boolean; bleed?: boolean } & React.ComponentPropsWithoutRef<'hr'>) {
  const { accent_color } = useBranding();

  // Convert hex to rgba
  const hexToRgba = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(14, 165, 233, ${opacity})`; // fallback to sky-500
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
      <hr
          role="presentation"
          {...props}
          className={clsx(
              className,
              'border-t dark:border-white/5 dark:border-white/10',
              bleed ? '-mr-10 -ml-10' : 'w-full',
          )}
          style={{
            borderColor: hexToRgba(accent_color, soft ? 0.2 : 0.5)
          }}
      />
  );
}
