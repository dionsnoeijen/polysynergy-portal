import React from "react";

import { NodeVariable } from "@/types/types";
import { Field, Fieldset, Label } from "@/components/fieldset";
import useNodesStore from "@/stores/nodesStore";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";

type Props = {
    nodeId: string;
    variable: NodeVariable;
};

const VariableTypeDatetime: React.FC<Props> = ({ nodeId, variable }): React.ReactElement => {
    const { updateNodeVariable } = useNodesStore();

    const initialValue = variable.value ? new Date(variable.value as string) : null;

    const handleChange = (datetime: Date | null) => {
        const formattedValue = datetime ? datetime.toISOString() : null;
        updateNodeVariable(nodeId, variable.handle, formattedValue);
    };

    return (
        <Fieldset>
            <Label>{variable.handle}</Label>
            <Field>
                <DatePicker
                    selected={initialValue}
                    onChange={(date) => handleChange(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    className={
                        "relative block w-full appearance-none rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing[3])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white border border-zinc-950/10 data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20 bg-transparent dark:bg-white/5 focus:outline-none data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-500 data-[invalid]:data-[hover]:dark:border-red-500 data-[disabled]:border-zinc-950/20 dark:data-[hover]:data-[disabled]:border-white/15 data-[disabled]:dark:border-white/15 data-[disabled]:dark:bg-white/[2.5%] dark:[color-scheme:dark]"
                    }
                />
            </Field>
        </Fieldset>
    );
};

export default VariableTypeDatetime;
