import React from "react";
import {FormType, VariableTypeProps} from "@/types/types";
import {Fieldset} from "@/components/fieldset";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {Text} from "@/components/text";
import useEditorStore from "@/stores/editorStore";
import {PencilIcon} from "@heroicons/react/24/outline";
import {Button} from "@/components/button";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";
import {shortenFileName} from "@/utils/shortenFileName";

const VariableTypeFiles: React.FC<VariableTypeProps> = ({
    variable,
    nodeId,
    publishedButton = true,
    inDock = true
}): React.ReactElement => {
    const isArray = Array.isArray(variable.value);

    const openForm = useEditorStore((state) => state.openForm);

    const onEdit = (nodeId: string) => {
        openForm(FormType.EditFiles, nodeId, variable);
    }

    const isValueConnected = useConnectionsStore((state) => state.isValueConnectedExcludingGroupBoundary(nodeId, variable.handle));

    return (
        <div className={'relative'}>
            {variable?.dock?.enabled === false || (variable.published && inDock) && (
                <div className="absolute inset-0 bg-sky-50/60 dark:bg-black/40 rounded-md z-10 pointer-events-none"/>
            )}
            {isValueConnected ? (
                 <ValueConnected variable={variable} />
            ) : (
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
                                <TableHeader className="!py-1">{variable.dock?.key_label || "filename"}</TableHeader>
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
                                                {shortenFileName(item as string)}
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
                        <PencilIcon className="w-4 h-4 inline text-zinc-600 dark:text-slate-400"/>
                    </Button>
                </div>
            </div>
            )}
        </div>
    );
};

export default VariableTypeFiles;