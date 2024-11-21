import React from "react";

import { NodeVariable, NodeVariableType } from '@/stores/nodesStore';
import { Text } from "@/components/text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";

type Props = {
    variable: NodeVariable;
};

const VariableTypeArray: React.FC<Props> = ({ variable }): React.ReactElement => {
    const isArray = Array.isArray(variable.value);

    return (
        <div>
            <Text>{variable.handle}</Text>
            <div className="border border-white/20 rounded-md">
                <Table dense>
                    <TableHead>
                        <TableRow>
                            <TableHeader>key</TableHeader>
                            <TableHeader>value</TableHeader>
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
                                            <TableCell className="pl-1">
                                                {item.handle}
                                            </TableCell>
                                            <TableCell className="pr-1">
                                                {item.value?.toString()}
                                            </TableCell>
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
