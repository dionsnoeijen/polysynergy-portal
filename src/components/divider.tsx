import clsx from 'clsx'

export function Divider({
  soft = false,
  bleed = false,
  className,
  ...props
}: { soft?: boolean; bleed?: boolean } & React.ComponentPropsWithoutRef<'hr'>) {
  return (
      <hr
          role="presentation"
          {...props}
          className={clsx(
              className,
              'border-t',
              bleed ? '-mr-10 -ml-10' : 'w-full',
              soft ? 'border-sky-500/20 dark:border-white/5' : 'border-sky-500/50 dark:border-white/10'
          )}
      />
  );
}
