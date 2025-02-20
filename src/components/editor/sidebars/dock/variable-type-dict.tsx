import React from "react";

import useEditorStore from "@/stores/editorStore";
import {FormType, NodeVariable, NodeVariableType, VariableTypeProps} from "@/types/types";
import {Text} from "@/components/text";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {CheckCircleIcon, PencilIcon, XCircleIcon} from "@heroicons/react/24/outline";
import {Button} from "@/components/button";
import {Fieldset} from "@/components/fieldset";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";

const VariableTypeDict: React.FC<VariableTypeProps> = ({ variable, nodeId, publishedButton = true }): React.ReactElement => {
    const isArray = Array.isArray(variable.value);

    const { openForm } = useEditorStore();

    const onEdit = (nodeId: string) => {
        openForm(FormType.EditDict, nodeId, variable);
    }

    return (
        <div>
            {publishedButton && (
            <div className="flex justify-between items-center w-full">
                <Fieldset className={'w-full'}>
                    <LabelPublish nodeId={nodeId} variable={variable} />
                </Fieldset>
            </div>
            )}
            <div className="border border-white/20 rounded-md">
                <Table dense className={"bg-white/5"}>
                    <TableHead>
                        <TableRow>
                            <TableHeader className="!py-1 !pl-2 !pr-2">in</TableHeader>
                            <TableHeader className="!py-1">key</TableHeader>
                            <TableHeader className="!py-1">value</TableHeader>
                            <TableHeader className="!py-1 !pl-2 !pr-2">out</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>

                        {variable.value === null &&
                            (
                                <TableRow className="!py-1">
                                    <TableCell colSpan={4} className="!py-1 !pl-2 !pr-2">
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
                                            <TableCell className="!p-1 !pl-2">
                                                {item.has_in ? (<CheckCircleIcon className={"w-4 h-4"} />) : (<XCircleIcon className={'w-4 h-4'} />)}
                                            </TableCell>
                                            <TableCell
                                                className="!p-1 max-w-[100px] truncate overflow-hidden whitespace-nowrap"
                                                title={item.handle}
                                            >
                                                {item.handle}
                                            </TableCell>
                                            <TableCell
                                                className="!p-1 max-w-[200px] truncate overflow-hidden whitespace-nowrap"
                                                title={item.value?.toString()}
                                            >
                                                {item.value?.toString()}
                                            </TableCell>
                                            <TableCell className="!p-1 !pr-2">
                                                {item.has_out ? (<CheckCircleIcon className={"w-4 h-4"}/>) : (<XCircleIcon className={'w-4 h-4'} />)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                }
                                return null;
                            })}
                    </TableBody>
                </Table>
                <Button
                    plain
                    className="w-full bg-white/5 hover:cursor-pointer rounded-tr-none rounded-tl-none after:rounded-tl-none after:rounded-tr-none p-0 !px-0 !py-0"
                    onClick={() => onEdit(nodeId)}
                >
                    <PencilIcon className="w-4 h-4 inline text-slate-400"/>
                </Button>
            </div>
        </div>
    );
};

export default VariableTypeDict;
