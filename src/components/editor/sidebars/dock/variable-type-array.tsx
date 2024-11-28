import React from "react";

import { NodeVariable, NodeVariableType } from "@/types/types";
import { Text } from "@/components/text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { PencilIcon } from "@heroicons/react/16/solid";

type Props = {
    variable: NodeVariable;
    onEdit?: (variableHandle: string) => void;
};

const VariableTypeArray: React.FC<Props> = ({ variable, onEdit }): React.ReactElement => {
    const isArray = Array.isArray(variable.value);

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <Text>{variable.handle}</Text>
                {onEdit && (
                    <button
                        className="px-2 py-1 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => onEdit(variable.handle)}
                    >
                        Edit All
                    </button>
                )}
            </div>
            <div className="border border-white/20 rounded-md">
                <Table dense>
                    <TableHead>
                        <TableRow>
                            <TableHeader className="py-2">key</TableHeader>
                            <TableHeader className="py-2">value</TableHeader>
                            {onEdit && <TableHeader className="py-2 text-right">Actions</TableHeader>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
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
                                            {onEdit && (
                                                <TableCell className="py-1 text-right">
                                                    <button
                                                        className="text-blue-500 hover:text-blue-600"
                                                        onClick={() => onEdit(item.handle)}
                                                    >
                                                        <PencilIcon className="w-4 h-4 inline" />
                                                    </button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                }
                                return null;
                            })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default VariableTypeArray;
