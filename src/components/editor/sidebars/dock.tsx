import React from "react";
import clsx from 'clsx';
import Heading from "@/components/editor/sidebars/elements/heading";
import useNodesStore, { NodeVariableType } from "@/stores/nodesStore";
import { useEditorStore } from "@/stores/editorStore";
import VariableTypeString from "@/components/editor/sidebars/dock/variable-type-string";
import VariableTypeNumber from "@/components/editor/sidebars/dock/variable-type-number";
import VariableTypeArray from "@/components/editor/sidebars/dock/variable-type-array";
import { Divider } from "@/components/divider";
import VariableTypeBoolean from "@/components/editor/sidebars/dock/variable-type-boolean";

type Props = React.ComponentPropsWithoutRef<'div'> & {
    toggleClose: () => void
};

const VariableTypeComponents = {
    [NodeVariableType.String]: VariableTypeString,
    [NodeVariableType.Number]: VariableTypeNumber,
    [NodeVariableType.Array]: VariableTypeArray,
    [NodeVariableType.Boolean]: VariableTypeBoolean,
};

const Dock: React.FC<Props> = ({ className, toggleClose, ...props }) => {
    const { selectedNodes } = useEditorStore();
    const getNode = useNodesStore((state) => state.getNode);

    if (selectedNodes.length === 1) {
        const node = getNode(selectedNodes[0]);

        return (
            <div
                {...props}
                className={clsx(className, 'absolute left-0 top-0 right-0 bottom-0 flex flex-col gap-4')}
            >
                <Heading arrowToLeft={true} toggleClose={toggleClose}>
                    Dock: {node?.name}
                </Heading>
                {node?.variables.map((variable) => {
                    const VariableComponent = VariableTypeComponents[variable.type];
                    return VariableComponent ? (
                        <div key={variable.handle}>
                            <Divider />
                            <VariableComponent variable={variable} />
                        </div>
                    ) : null;
                })}
            </div>
        );
    }

    return (
        <div {...props} className={clsx(className, 'absolute left-0 top-0 right-0 bottom-0')}>
            <Heading arrowToLeft={true} toggleClose={toggleClose}>Dock: select node</Heading>
        </div>
    );
};

export default Dock;
