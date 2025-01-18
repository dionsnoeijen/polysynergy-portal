import React from "react";

import {FormType, NodeVariable, NodeVariableType} from "@/types/types";
import {Text} from "@/components/text";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {PencilIcon} from "@heroicons/react/16/solid";
import useEditorStore from "@/stores/editorStore";

type Props = {
    variable: NodeVariable;
    nodeId: string;
};

const VariableTypeDict: React.FC<Props> = ({ variable, nodeId }: Props): React.ReactElement => {
    const isArray = Array.isArray(variable.value);

    const { openForm } = useEditorStore();

    const onEdit = (nodeId: string) => {
        openForm(FormType.EditDict, nodeId, variable);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <Text>{variable.handle}</Text>
            </div>
            <div className="border border-white/20 rounded-md">
                <Table dense>
                    <TableHead>
                        <TableRow>
                            <TableHeader className="py-1">key</TableHeader>
                            <TableHeader className="py-1">value</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>

                        {variable.value === null &&
                            (
                                <TableRow>
                                    <TableCell colSpan={2} className="py-1">
                                        <Text>No data</Text>
                                    </TableCell>
                                </TableRow>
                            )
                        }

                        {isArray &&
                            (variable.value as NodeVariable[]).map((item) => {
                                if (
                                    item.type === NodeVariableType.String ||
                                    item.type === NodeVariableType.Number ||
                                    item.type === NodeVariableType.Boolean
                                ) {
                                    return (
                                        <TableRow key={item.handle}>
                                            <TableCell
                                                className="py-1 truncate overflow-hidden whitespace-nowrap"
                                                title={item.handle}
                                            >
                                                {item.handle}
                                            </TableCell>
                                            <TableCell
                                                className="py-1 truncate overflow-hidden whitespace-nowrap"
                                                title={item.value?.toString()}
                                            >
                                                {item.value?.toString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                }
                                return null;
                            })}
                        <TableRow>
                            <td colSpan={2} className="border-t border-white/20 p-0 py-0 px-0">
                                <button
                                    className="text-slate-500 hover:text-slate-600 w-full pb-1"
                                    onClick={() => onEdit(nodeId)}
                                >
                                    <PencilIcon className="w-4 h-4 inline text-slate-300"/>
                                </button>
                            </td>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default VariableTypeDict;
