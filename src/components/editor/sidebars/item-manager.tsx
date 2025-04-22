import React, {ReactElement} from "react";
import clsx from 'clsx';
import Heading from "@/components/editor/sidebars/elements/heading";
import RouteTree from "@/components/editor/sidebars/trees/route-tree";
import SidebarTenantHeader from "@/components/sidebar/sidebar-tenant-header";
import ScheduleTree from "@/components/editor/sidebars/trees/schedule-tree";
import ServiceTree from "@/components/editor/sidebars/trees/service-tree";
import BlueprintTree from "@/components/editor/sidebars/trees/blueprint-tree";
import SecretTree from "@/components/editor/sidebars/trees/secret-tree";

export default function ItemManager({
                                        className,
                                        toggleClose,
                                        ...props
                                    }: React.ComponentPropsWithoutRef<'div'> & {
    toggleClose: () => void
}): ReactElement {
    return (
        <div {...props} className={clsx(className, 'absolute left-0 top-0 right-0 bottom-0 flex flex-col')}>
            <div className="flex-grow overflow-y-auto">
                <Heading arrowToLeft={false} toggleClose={toggleClose}>Item manager</Heading>
                <RouteTree />
                <ScheduleTree />
                <BlueprintTree />
                {/* Disabled for now: <ConfigTree />*/}
                <ServiceTree />
                <SecretTree />
                {/* Disabled for now: <ProjectVariableTree />*/}
            </div>
            <div className={'-mb-2'}>
                <SidebarTenantHeader />
            </div>
        </div>
    );
}
