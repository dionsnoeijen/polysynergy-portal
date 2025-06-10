import React from "react";
import useNodesStore from "@/stores/nodesStore";
import {Input} from "@/components/input";
import {Field, Fieldset} from "@/components/fieldset";
import {Node} from "@/types/types";

type Props = {
    node: Node;
    categoryBorder?: string;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    categoryBackgroundColor?: string;
    categoryGradientBackgroundColor?: string;
};

const NodeHandle: React.FC<Props> = ({
    node,
    categoryBorder = 'border border-sky-200 dark:border-zinc-700',
    // eslint-disable-next-line
    categoryMainTextColor = 'text-sky-500 dark:text-white/70',
    // eslint-disable-next-line
    categorySubTextColor = 'text-sky-800 dark:text-white/70',
    categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
    // eslint-disable-next-line
    categoryGradientBackgroundColor = 'bg-gradient-to-r from-sky-100 to-sky-200 dark:from-zinc-800 dark:to-zinc-900',
}) => {
    const updateNodeHandle = useNodesStore((state) => state.updateNodeHandle);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');

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
                    className={`${categoryBackgroundColor} rounded-md dark:text-white ${categoryBorder}`}
                />
            </Field>
        </Fieldset>
    );
};

export default NodeHandle;
