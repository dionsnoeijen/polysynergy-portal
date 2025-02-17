import React from "react";
import useNodesStore from "@/stores/nodesStore";
import { Node } from "@/types/types";
import { Input } from "@/components/input";
import { Field, Fieldset, Label } from "@/components/fieldset";

type Props = { group: Node };

const GroupName: React.FC<Props> = ({ group }): React.ReactElement => {
    const updateNode = useNodesStore((state) => state.updateNode);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateNode(group.id, { name: e.target.value });
    };

    return (
        <Fieldset>
            <Label>Group Name</Label>
            <Field>
                <Input
                    type="text"
                    value={group.name}
                    onChange={handleChange}
                    placeholder="name"
                />
            </Field>
        </Fieldset>
    );
};

export default GroupName;
