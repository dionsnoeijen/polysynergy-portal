import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import type React from 'react'

export function Fieldset({
  className,
  ...props
}: { className?: string } & Omit<Headless.FieldsetProps, 'as' | 'className'>) {
  return (
    <Headless.Fieldset
      {...props}
      className={clsx(className, '[&>*+[data-slot=control]]:mt-6 [&>[data-slot=text]]:mt-1')}
    />
  )
}

export function LabelGroup({
  className,
  children,
  actions,
  ...props
}: { className?: string; children: React.ReactNode; actions?: React.ReactNode } & React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="label-group"
      className={clsx(
        className,
        'flex items-center justify-between w-full px-2 py-0',
      )}
      {...props}
    >
      <div className="flex-1 truncate">{children}</div> {/* Zorgt voor ellipsis bij lange labels */}
      {actions && <div className="ml-2 flex-shrink-0">{actions}</div>} {/* Zorgt dat knoppen rechts uitlijnen */}
    </div>
  );
}

export function Legend({
  className,
  ...props
}: { className?: string } & Omit<Headless.LegendProps, 'as' | 'className'>) {
  return (
    <Headless.Legend
      data-slot="legend"
      {...props}
      className={clsx(
        className,
        'text-base/6 font-semibold text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white'
      )}
    />
  )
}

export function FieldGroup({
  className,
  children,
  actions,
  ...props
}: { className?: string; children: React.ReactNode; actions?: React.ReactNode } & React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="control"
      {...props}
      className={clsx(className, 'flex items-center space-y-0 space-x-1')}
    >
      <div className="flex-1">{children}</div>
      {actions && <div data-slot="action">{actions}</div>}
    </div>
  );
}

export function Field({
  className,
  children,
  ...props
}: { className?: string; children: React.ReactNode } & Omit<Headless.FieldProps, 'as' | 'className'>) {
  return (
    <Headless.Field
      {...props}
      className={clsx(
        className,
        'flex flex-col', // Zorgt ervoor dat label en input onder elkaar staan
        '[&>[data-slot=label]+[data-slot=control]]:mt-3',
        '[&>[data-slot=label]+[data-slot=description]]:mt-1',
        '[&>[data-slot=description]+[data-slot=control]]:mt-3',
        '[&>[data-slot=control]+[data-slot=description]]:mt-3',
        '[&>[data-slot=control]+[data-slot=error]]:mt-3',
        '[&>[data-slot=label]]:font-medium'
      )}
    >
      {children}
    </Headless.Field>
  );
}

export function Label({ className, ...props }: { className?: string } & Omit<Headless.LabelProps, 'as' | 'className'>) {
  return (
    <Headless.Label
      data-slot="label"
      {...props}
      className={clsx(
        className,
        'select-none text-base/6 text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white'
      )}
    />
  )
}

export function Description({
  className,
  ...props
}: { className?: string } & Omit<Headless.DescriptionProps, 'as' | 'className'>) {
  return (
    <Headless.Description
      data-slot="description"
      {...props}
      className={clsx(
        className,
        'text-base/6 text-zinc-500 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-zinc-400'
      )}
    />
  )
}

export function ErrorMessage({
  className,
  ...props
}: { className?: string } & Omit<Headless.DescriptionProps, 'as' | 'className'>) {
  return (
    <Headless.Description
      data-slot="error"
      {...props}
      className={clsx(className, 'text-base/6 text-red-600 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-red-500')}
    />
  )
}
