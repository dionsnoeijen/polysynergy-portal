import React from "react";

import { Input } from "@/components/input";
import { Field, Fieldset, Label } from "@/components/fieldset";
import useNodesStore from "@/stores/nodesStore";

type Props = { group: Group };

/** @todo: Fix this */
const GroupName: React.FC<Props> = ({ group }): React.ReactElement => {
    const { updateNode, getNode } = useNodesStore();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNode(group.id, { name: e.target.value });
    };

    const node = getNode(group.id);

    return (
        <Fieldset>
            <Label>Group Name</Label>
            <Field>
                <Input
                    type="text"
                    value={node.name}
                    onChange={handleChange}
                    placeholder="name"
                />
            </Field>
        </Fieldset>
    );
};

export default GroupName;
