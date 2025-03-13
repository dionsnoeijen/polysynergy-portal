import {SidebarHeader, SidebarItem, SidebarLabel} from "@/components/sidebar";
import {
    Dropdown,
    DropdownButton,
    DropdownDivider,
    DropdownItem,
    DropdownLabel,
    DropdownMenu
} from "@/components/dropdown";
import {Avatar} from "@/components/avatar";
import {ChevronUpIcon, Cog8ToothIcon, UserIcon} from "@heroicons/react/24/outline";

export default function SidebarTenantHeader()
{
    return (
        <SidebarHeader className={'border-none p-0'}>
            <Dropdown>
                <DropdownButton as={SidebarItem}>
                    <Avatar className='border-none ring-0' square={true} src="/ps-logo-simple-color.svg" />
                    <SidebarLabel>PolySynergy</SidebarLabel>
                    <ChevronUpIcon />
                </DropdownButton>
                <DropdownMenu className="min-w-80 lg:min-w-64" anchor="top start">
                    <DropdownItem href="/">
                        <Avatar slot="icon" src="/teams/catalyst.svg" />
                        <DropdownLabel>Projects</DropdownLabel>
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem href="#">
                        <UserIcon />
                        <DropdownLabel>Profile</DropdownLabel>
                    </DropdownItem>
                    <DropdownItem href="/settings">
                        <Cog8ToothIcon />
                        <DropdownLabel>Settings</DropdownLabel>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </SidebarHeader>
    );
}
