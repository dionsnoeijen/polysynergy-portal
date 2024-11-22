import clsx from "clsx";
import Heading from "@/components/editor/sidebars/elements/heading";
import useNodesStore, { NodeVariableType } from "@/stores/nodesStore";
import { useEditorStore } from "@/stores/editorStore";
import VariableTypeString from "@/components/editor/sidebars/dock/variable-type-string";
import VariableTypeNumber from "@/components/editor/sidebars/dock/variable-type-number";
import VariableTypeArray from "@/components/editor/sidebars/dock/variable-type-array";
import { Divider } from "@/components/divider";
import VariableTypeBoolean from "@/components/editor/sidebars/dock/variable-type-boolean";
import useGroupsStore from "@/stores/groupStore";
import GroupName from "@/components/editor/sidebars/dock/group-name";
import React from "react";

type Props = React.ComponentPropsWithoutRef<"div"> & {
    toggleClose: () => void;
};

const VariableTypeComponents = {
    [NodeVariableType.String]: VariableTypeString,
    [NodeVariableType.Number]: VariableTypeNumber,
    [NodeVariableType.Array]: VariableTypeArray,
    [NodeVariableType.Boolean]: VariableTypeBoolean,
};

const Dock: React.FC<Props> = ({ className, toggleClose, ...props }) => {
    const { selectedNodes, openGroup } = useEditorStore();
    const { getGroupById } = useGroupsStore();
    const nodes = useNodesStore((state) => state.nodes);
    const group = openGroup ? getGroupById(openGroup) : null;
    const node = selectedNodes.length === 1 ? nodes.find((n) => n.id === selectedNodes[0]) : null;

    return (
        <div
            {...props}
            className={clsx(className, "absolute left-0 top-0 right-0 bottom-0 flex flex-col gap-2")}
        >
            <Heading arrowToLeft={true} toggleClose={toggleClose}>
                Dock: {node ? node.name : "select node"}
            </Heading>

            {node && node.variables.map((variable) => {
                const VariableComponent = VariableTypeComponents[variable.type];
                return VariableComponent ? (
                    <div key={variable.handle}>
                        <VariableComponent nodeId={node.id} variable={variable} />
                    </div>
                ) : null;
            })}

            {group && (
                <>
                    <Divider />
                    <Heading>
                        Group: {group.name}
                    </Heading>
                    <GroupName group={group} />
                </>
            )}
        </div>
    );
};

export default Dock;
