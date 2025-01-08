import {DropdownDivider, DropdownItem, DropdownLabel, DropdownMenu} from "@/components/dropdown";
import {
    ArrowRightStartOnRectangleIcon,
    LightBulbIcon,
    ShieldCheckIcon,
    UserCircleIcon
} from "@heroicons/react/16/solid";
import {useAuth} from "react-oidc-context";

export default function AccountDropdownMenu({ anchor }: { anchor: 'top start' | 'bottom end' }) {

    const auth = useAuth();

    const signOutRedirect = () => {
        auth.removeUser().then(() => {
            const clientId = process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID;
            const logoutUri = process.env.NEXT_PUBLIC_AWS_COGNITO_LOGOUT_URL;
            const cognitoDomain = process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN;
            window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
        });
    };


    return (
        <DropdownMenu className="min-w-64" anchor={anchor}>
            <DropdownItem href="/account">
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
            <DropdownItem href="#" onClick={() => signOutRedirect()}>
                <ArrowRightStartOnRectangleIcon />
                <DropdownLabel>Sign out</DropdownLabel>
            </DropdownItem>
        </DropdownMenu>
    )
}
