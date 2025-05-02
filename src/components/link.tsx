'use client'

import * as React from 'react'
import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import * as Headless from '@headlessui/react'

type Props = NextLinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

export const Link = React.forwardRef<HTMLAnchorElement, Props>(function Link(
  { href, children, ...anchorProps },
  ref
) {
  return (
    <Headless.DataInteractive>
      <NextLink href={href} ref={ref} {...anchorProps}>
        {children}
      </NextLink>
    </Headless.DataInteractive>
  )
})