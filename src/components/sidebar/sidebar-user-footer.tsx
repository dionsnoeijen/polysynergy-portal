import {Dropdown, DropdownButton} from "@/components/dropdown";
import {SidebarFooter, SidebarItem} from "@/components/sidebar";
import {ChevronUpIcon} from "@heroicons/react/16/solid";
import AccountDropdownMenu from "@/components/sidebar/account-dropdown-menu";

import { useAuth } from "react-oidc-context";
import useAccountsStore from "@/stores/accountsStore";


export default function SidebarUserFooter()
{
    const auth = useAuth();
    const loggedInAccount = useAccountsStore(state => state.loggedInAccount);

    return (
        <SidebarFooter className="max-lg:hidden">
            <Dropdown>
                <DropdownButton as={SidebarItem}>
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">{loggedInAccount?.first_name} {loggedInAccount?.last_name}</span>
                        <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                          {auth.user?.profile.email}
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
