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
              soft ? 'border-zinc-950/5 dark:border-white/5' : 'border-zinc-950/10 dark:border-white/10'
          )}
      />
  );
}
