import React, {ReactElement} from "react";
import clsx from 'clsx';
import RouteTree from "@/components/editor/sidebars/trees/route-tree";
import ScheduleTree from "@/components/editor/sidebars/trees/schedule-tree";
import ChatWindowTree from "@/components/editor/sidebars/trees/chat-window-tree";
import ServiceTree from "@/components/editor/sidebars/trees/service-tree";
import BlueprintTree from "@/components/editor/sidebars/trees/blueprint-tree";
import SecretTree from "@/components/editor/sidebars/trees/secret-tree";
import ProjectEnvVarTree from "@/components/editor/sidebars/trees/project-env-var-tree";

export default function ItemManagerContent({
    className,
    ...props
}: React.ComponentPropsWithoutRef<'div'>): ReactElement {
    return (
        <div {...props} className={clsx(className, 'h-full overflow-y-auto')}>
            <RouteTree />
            <ScheduleTree />
            <ChatWindowTree />
            <BlueprintTree />
             {/*Disabled for now: <ConfigTree />*/}
            <ServiceTree />
            <SecretTree />
            <ProjectEnvVarTree />
            {/* Disabled for now: <ProjectVariableTree />*/}
        </div>
    );
}