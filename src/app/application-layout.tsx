'use client'

import {
    Sidebar,
    SidebarBody,
    SidebarItem,
    SidebarLabel,
    SidebarSection,
    SidebarSpacer,
} from '@/components/sidebar'
import { SidebarLayout } from '@/components/sidebar-layout'
import {
    UsersIcon,
} from '@heroicons/react/24/outline'
import {
    Cog6ToothIcon,
    HomeIcon,
    QuestionMarkCircleIcon,
    SparklesIcon
} from '@heroicons/react/20/solid'
import { usePathname } from 'next/navigation'
import SidebarUserFooter from "@/components/sidebar/sidebar-user-footer";
import React from "react";
import { useBranding } from "@/contexts/branding-context";

export function ApplicationLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { logo_url } = useBranding();
    const pathname = usePathname()

    return (
        <SidebarLayout
            navbar={<div />}
            sidebar={
                <Sidebar>
                    <div className="flex items-center p-4 border-b border-zinc-200 dark:border-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={logo_url || "/logo-with-text.svg"}
                            alt="Logo"
                            className="h-8 w-auto"
                        />
                    </div>
                    <SidebarBody>
                        <SidebarSection>
                            <SidebarItem href="/" current={pathname === '/'}>
                                <HomeIcon />
                                <SidebarLabel>Projects</SidebarLabel>
                            </SidebarItem>
                            <SidebarItem href="/accounts" current={pathname.startsWith('/accounts')}>
                                <UsersIcon />
                                <SidebarLabel>Accounts</SidebarLabel>
                            </SidebarItem>
                        </SidebarSection>

                        <SidebarSpacer />

                        <SidebarSection>
                            <SidebarItem href="/support">
                                <QuestionMarkCircleIcon />
                                <SidebarLabel>Support</SidebarLabel>
                            </SidebarItem>
                            <SidebarItem href="/changelog">
                                <SparklesIcon />
                                <SidebarLabel>Changelog</SidebarLabel>
                            </SidebarItem>
                            <SidebarItem href="/settings" current={pathname.startsWith('/settings')}>
                                <Cog6ToothIcon />
                                <SidebarLabel>Settings</SidebarLabel>
                            </SidebarItem>
                        </SidebarSection>
                    </SidebarBody>

                    <SidebarUserFooter />
                </Sidebar>
            }
        >
            {children}
        </SidebarLayout>
    )
}
