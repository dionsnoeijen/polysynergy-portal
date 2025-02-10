import React from "react";
import useNodesStore from "@/stores/nodesStore";
import {Input} from "@/components/input";
import {Field, Fieldset, Label} from "@/components/fieldset";
import {Node} from "@/types/types";

type Props = {
    node: Node;
};

const NodeHandle: React.FC<Props> = ({node}) => {
    const updateNodeHandle = useNodesStore((state) => state.updateNodeHandle);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
        const newValue = e.target.value;
        updateNodeHandle(node.id, newValue);
    };

    return (
        <Fieldset>
            <Field>
                <Input
                    type="text"
                    value={node.handle as string || ""}
                    onChange={handleChange}
                    placeholder={'handle'}
                />
            </Field>
        </Fieldset>
    );
};

export default NodeHandle;
