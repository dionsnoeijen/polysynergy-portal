import React, {ReactElement} from "react";
import clsx from 'clsx';
import Heading from "@/components/editor/sidebars/elements/heading";
import RouteTree from "@/components/editor/sidebars/routes/route-tree";
import SidebarTenantHeader from "@/components/sidebar/sidebar-tenant-header";

export default function ItemManager({
    className,
    toggleClose,
    projectUuid = null,
    routeUuid = null,
    ...props
}: React.ComponentPropsWithoutRef<'div'> & { toggleClose: () => void, projectUuid?: null|string, routeUuid?: null|string }): ReactElement {
    return (
        <div {...props} className={clsx(className, 'absolute left-0 top-0 right-0 bottom-0')}>
            <SidebarTenantHeader />
            <Heading arrowToLeft={false} toggleClose={toggleClose}>Item manager</Heading>
            <RouteTree projectUuid={projectUuid} routeUuid={routeUuid} />
        </div>
    );
}
