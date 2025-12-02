'use client'

import clsx from 'clsx'
import type React from 'react'
import {createContext, useContext, useState} from 'react'
import {Link} from './link'
import {useBranding} from '@/contexts/branding-context'

const TableContext = createContext<{ bleed: boolean; dense: boolean; grid: boolean; striped: boolean }>({
    bleed: false,
    dense: false,
    grid: false,
    striped: false,
})

export function Table({
                          bleed = false,
                          dense = false,
                          grid = false,
                          striped = false,
                          className,
                          children,
                          ...props
                      }: {
    bleed?: boolean;
    dense?: boolean;
    grid?: boolean;
    striped?: boolean
} & React.ComponentPropsWithoutRef<'div'>) {
    const {accent_color} = useBranding();

    return (
        <TableContext.Provider value={{bleed, dense, grid, striped} as React.ContextType<typeof TableContext>}>
            <div className="flow-root">
                <div {...props} className={clsx(className, '-mx-[--gutter] overflow-x-auto whitespace-nowrap')}>
                    <div className={clsx('inline-block min-w-full align-middle', !bleed && 'sm:px-[--gutter]')}>
                        <table
                            className="min-w-full text-left text-sm/6 dark:text-white"
                            style={{color: accent_color}}
                        >{children}</table>
                    </div>
                </div>
            </div>
        </TableContext.Provider>
    )
}

export function TableHead({className, ...props}: React.ComponentPropsWithoutRef<'thead'>) {
    const {accent_color} = useBranding();
    return <thead {...props} className={clsx(className, 'dark:text-zinc-400')} style={{color: accent_color}}/>
}

export function TableBody(props: React.ComponentPropsWithoutRef<'tbody'>) {
    return <tbody {...props} />
}

const TableRowContext = createContext<{ href?: string; target?: string; title?: string }>({
    href: undefined,
    target: undefined,
    title: undefined,
})

export function TableRow({
                             href,
                             target,
                             title,
                             className,
                             ...props
                         }: { href?: string; target?: string; title?: string } & React.ComponentPropsWithoutRef<'tr'>) {
    const {striped} = useContext(TableContext)

    return (
        <TableRowContext.Provider value={{href, target, title} as React.ContextType<typeof TableRowContext>}>
            <tr
                {...props}
                className={clsx(
                    className,
                    href &&
                    'has-[[data-row-link][data-focus]]:outline has-[[data-row-link][data-focus]]:outline-2 has-[[data-row-link][data-focus]]:-outline-offset-2 has-[[data-row-link][data-focus]]:outline-blue-500 dark:focus-within:bg-white/[2.5%]',
                    striped && 'even:bg-zinc-950/[2.5%] dark:even:bg-white/[2.5%]',
                    href && striped && 'hover:bg-zinc-950/5 dark:hover:bg-white/5',
                    href && !striped && 'hover:bg-zinc-950/[2.5%] dark:hover:bg-white/[2.5%]'
                )}
            />
        </TableRowContext.Provider>
    )
}

export function TableHeader({className, ...props}: React.ComponentPropsWithoutRef<'th'>) {
    const {bleed, grid} = useContext(TableContext)
    const {accent_color} = useBranding();

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
        <th
            {...props}
            className={clsx(
                className,
                'border-b px-4 py-2 font-medium first:pl-[var(--gutter,theme(spacing.2))] last:pr-[var(--gutter,theme(spacing.2))] dark:border-b-white/10',
                grid && 'border-l first:border-l-0 dark:border-l-white/5',
                !bleed && 'sm:first:pl-1 sm:last:pr-1'
            )}
            style={{
                borderBottomColor: hexToRgba(accent_color, 0.3),
                ...(grid && {borderLeftColor: hexToRgba(accent_color, 0.3)})
            }}
        />
    )
}

export function TableCell({className, children, ...props}: React.ComponentPropsWithoutRef<'td'>) {
    const {bleed, dense, grid, striped} = useContext(TableContext)
    const {href, target, title} = useContext(TableRowContext)
    const [cellRef, setCellRef] = useState<HTMLElement | null>(null)
    const {accent_color} = useBranding();

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
        <td
            ref={href ? setCellRef : undefined}
            {...props}
            className={clsx(
                className,
                'relative px-4 first:pl-[var(--gutter,theme(spacing.2))] last:pr-[var(--gutter,theme(spacing.2))]',
                !striped && 'border-b dark:border-white/5',
                grid && 'border-l first:border-l-0 dark:border-l-white/5',
                dense ? 'py-2.5' : 'py-4',
                !bleed && 'sm:first:pl-1 sm:last:pr-1'
            )}
            style={{
                ...(!striped && {borderBottomColor: hexToRgba(accent_color, 0.3)}),
                ...(grid && {borderLeftColor: hexToRgba(accent_color, 0.3)})
            }}
        >
            {href && (
                <Link
                    data-row-link
                    href={href}
                    target={target}
                    aria-label={title}
                    tabIndex={cellRef?.previousElementSibling === null ? 0 : -1}
                    className="absolute inset-0 focus:outline-none"
                />
            )}
            {children}
        </td>
    )
}
