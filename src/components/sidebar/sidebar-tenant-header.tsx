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
import {ChevronDownIcon, Cog8ToothIcon, PlusIcon} from "@heroicons/react/24/outline";

export default function SidebarTenantHeader()
{
    return (
        <SidebarHeader>
            <Dropdown>
                <DropdownButton as={SidebarItem}>
                    <Avatar className='border-none ring-0' square={true} src="/ps-logo-simple-color.svg" />
                    <SidebarLabel>PolySynergy</SidebarLabel>
                    <ChevronDownIcon />
                </DropdownButton>
                <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
                    <DropdownDivider />
                    <DropdownItem href="/">
                        <Avatar slot="icon" src="/teams/catalyst.svg" />
                        <DropdownLabel>Projects</DropdownLabel>
                    </DropdownItem>
                    <DropdownItem href="#">
                        <Avatar slot="icon" initials="BE" className="bg-purple-500 text-white" />
                        <DropdownLabel>Big Events</DropdownLabel>
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem href="#">
                        <PlusIcon />
                        <DropdownLabel>New team&hellip;</DropdownLabel>
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
