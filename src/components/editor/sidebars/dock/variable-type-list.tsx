import React from "react";

import {FormType, VariableTypeProps} from "@/types/types";
import {Text} from "@/components/text";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {PencilIcon} from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import {Fieldset} from "@/components/fieldset";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import {Button} from "@/components/button";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeList: React.FC<VariableTypeProps> = ({
    variable,
    nodeId,
    publishedButton = true,
    inDock = true
}: VariableTypeProps): React.ReactElement => {
    const isArray = Array.isArray(variable.value);

    const openForm = useEditorStore((state) => state.openForm);

    const onEdit = (nodeId: string) => {
        openForm(FormType.EditList, nodeId, variable);
    }

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    return (
        <>
            {isValueConnected ? (
                <ValueConnected variable={variable} />
            ) : (
                <>
                    {publishedButton && (
                        <div className="flex justify-between items-center w-full">
                            <Fieldset className={'w-full'}>
                                <LabelPublish nodeId={nodeId} variable={variable} />
                            </Fieldset>
                        </div>
                    )}
                    <div className={`border border-white/20 rounded-md relative z-0 ${variable?.dock?.enabled === false || (variable.published && inDock) ? 'opacity-40 pointer-events-none' : ''}`}>
                        <Table dense className={"bg-white/5"}>
                            <TableHead>
                                <TableRow>
                                    <TableHeader className="!py-1">{variable.dock?.key_label || "items"}</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {variable.value === null &&
                                    (
                                        <TableRow className="!py-1">
                                            <TableCell colSpan={4} className="!py-1 !pl-2 !pr-2">
                                                <Text>No files</Text>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }
                                {isArray &&
                                    (variable.value as string[]).map((item, index) => {
                                        return (
                                            <TableRow key={`file-${index}`}>
                                                <TableCell
                                                    className="!p-1 max-w-[100px] truncate overflow-hidden whitespace-nowrap"
                                                    title={item}
                                                >
                                                    {item as string}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                        <Button
                            plain
                            className="w-full bg-white/5 hover:cursor-pointer rounded-tr-none rounded-tl-none after:rounded-tl-none after:rounded-tr-none p-0 !px-0 !py-0"
                            onClick={() => onEdit(nodeId)}
                        >
                            <PencilIcon className="w-4 h-4 inline text-slate-400" />
                        </Button>
                    </div>
                </>
            )}
        </>
    );
};

export default VariableTypeList;
