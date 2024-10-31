import {Dropdown, DropdownButton} from "@/components/dropdown";
import {SidebarFooter, SidebarItem} from "@/components/sidebar";
import {Avatar} from "@/components/avatar";
import {ChevronUpIcon} from "@heroicons/react/16/solid";
import AccountDropdownMenu from "@/components/sidebar/account-dropdown-menu";

export default function SidebarUserFooter()
{
    return (
        <SidebarFooter className="max-lg:hidden">
            <Dropdown>
                <DropdownButton as={SidebarItem}>
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar src="/users/erica.jpg" className="size-10" square alt="" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">Erica</span>
                        <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                          erica@example.com
                        </span>
                      </span>
                    </span>
                    <ChevronUpIcon />
                </DropdownButton>
                <AccountDropdownMenu anchor="top start" />
            </Dropdown>
        </SidebarFooter>
    );
}
