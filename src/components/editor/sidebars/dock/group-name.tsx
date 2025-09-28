import React, { useState, useEffect, useRef } from "react";
import useNodesStore from "@/stores/nodesStore";
import { Node } from "@/types/types";
import { Input } from "@/components/input";
import { Field, Fieldset, Label } from "@/components/fieldset";

type Props = { group: Node };

const GroupName: React.FC<Props> = ({ group }): React.ReactElement => {
    const updateNode = useNodesStore((state) => state.updateNode);
    const [localValue, setLocalValue] = useState(group.name);
    const timeoutRef = useRef<NodeJS.Timeout>();

    // Sync local value when group.name changes from external source
    useEffect(() => {
        setLocalValue(group.name);
    }, [group.name]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        // Update local state immediately for responsive UI
        setLocalValue(newValue);

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the store update
        timeoutRef.current = setTimeout(() => {
            updateNode(group.id, { name: newValue });
        }, 300);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <Fieldset>
            <Label>Group Name</Label>
            <Field>
                <Input
                    type="text"
                    value={localValue}
                    onChange={handleChange}
                    placeholder="name"
                />
            </Field>
        </Fieldset>
    );
};

export default GroupName;
