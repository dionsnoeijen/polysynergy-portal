'use client'

import {
    Dropdown,
} from '@/components/dropdown'
import { Navbar, NavbarSection, NavbarSpacer } from '@/components/navbar'
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
import AccountDropdownMenu from "@/components/sidebar/account-dropdown-menu";
import SidebarTenantHeader from "@/components/sidebar/sidebar-tenant-header";
import SidebarUserFooter from "@/components/sidebar/sidebar-user-footer";

export function ApplicationLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <SidebarLayout
            navbar={
                <Navbar>
                    <NavbarSpacer />
                    <NavbarSection>
                        <Dropdown>
                            {/*<DropdownButton as={NavbarItem}>*/}
                            {/*    <Avatar src="/users/erica.jpg" square />*/}
                            {/*</DropdownButton>*/}
                            <AccountDropdownMenu anchor="bottom end" />
                        </Dropdown>
                    </NavbarSection>
                </Navbar>
            }
            sidebar={
                <Sidebar>
                    <div className={'m-4'}>
                        <SidebarTenantHeader />
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
                            <SidebarItem href="/settings" current={pathname.startsWith('/settings')}>
                                <Cog6ToothIcon />
                                <SidebarLabel>Settings</SidebarLabel>
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
