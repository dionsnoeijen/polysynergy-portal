import React from "react";

import { Input } from "@/components/input";
import { Field, Fieldset, Label } from "@/components/fieldset";
import useGroupsStore, { Group } from "@/stores/groupStore";

type Props = { group: Group };

const GroupName: React.FC<Props> = ({ group }): React.ReactElement => {
    const { updateGroup } = useGroupsStore();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateGroup(group.id, { name: e.target.value });
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
