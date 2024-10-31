import {DropdownDivider, DropdownItem, DropdownLabel, DropdownMenu} from "@/components/dropdown";
import {
    ArrowRightStartOnRectangleIcon,
    LightBulbIcon,
    ShieldCheckIcon,
    UserCircleIcon
} from "@heroicons/react/16/solid";

export default function AccountDropdownMenu({ anchor }: { anchor: 'top start' | 'bottom end' }) {
    return (
        <DropdownMenu className="min-w-64" anchor={anchor}>
            <DropdownItem href="#">
                <UserCircleIcon />
                <DropdownLabel>My account</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="#">
                <ShieldCheckIcon />
                <DropdownLabel>Privacy policy</DropdownLabel>
            </DropdownItem>
            <DropdownItem href="#">
                <LightBulbIcon />
                <DropdownLabel>Share feedback</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="#">
                <ArrowRightStartOnRectangleIcon />
                <DropdownLabel>Sign out</DropdownLabel>
            </DropdownItem>
        </DropdownMenu>
    )
}
