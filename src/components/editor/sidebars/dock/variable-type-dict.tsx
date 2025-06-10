import React from "react";

import useEditorStore from "@/stores/editorStore";
import {FormType, NodeVariable, NodeVariableType, VariableTypeProps} from "@/types/types";
import {Text} from "@/components/text";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {BoltIcon, CheckCircleIcon, PencilIcon, XCircleIcon} from "@heroicons/react/24/outline";
import {Fieldset} from "@/components/fieldset";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import ValueConnected from "@/components/editor/sidebars/dock/value-connected";

const VariableTypeDict: React.FC<VariableTypeProps> = ({
                                                           variable,
                                                           nodeId,
                                                           publishedButton = true,
                                                           inDock = true,
                                                           categoryBorder = 'border border-sky-200 dark:border-zinc-700',
                                                           categoryMainTextColor = 'text-sky-500 dark:text-white/70',
                                                           categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
                                                       }): React.ReactElement => {
    const isArray = Array.isArray(variable.value);

    const openForm = useEditorStore((state) => state.openForm);

    const onEdit = (nodeId: string) => {
        openForm(FormType.EditDict, nodeId, variable);
    }

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));
    const isSubValueConnected = useConnectionsStore((state) => state.isValueConnected);

    function isVariableDisabled(variable: NodeVariable, inDock: boolean): boolean {
        const dockDisabled = variable?.dock?.enabled === false;
        const mainPublished = variable.published === true;
        const isArray = Array.isArray(variable.value);
        const allSubPublished =
            isArray &&
            (variable.value as NodeVariable[]).length > 0 &&
            (variable.value as NodeVariable[]).every((v) => v.published);

        return dockDisabled || mainPublished || (inDock && allSubPublished);
    }

    return (
        <>
            {isValueConnected ? (
                <ValueConnected variable={variable}/>
            ) : (
                <div>
                    {publishedButton && (
                        <div className="flex justify-between items-center w-full">
                            <Fieldset className={'w-full'}>
                                <LabelPublish nodeId={nodeId} variable={variable}/>
                            </Fieldset>
                        </div>
                    )}
                    <div
                        className={`border ${categoryBorder} rounded-md relative z-0 ${isVariableDisabled(variable, inDock) ? 'opacity-40 pointer-events-none' : ''}`}>
                        <Table dense className={`${categoryBackgroundColor} rounded-t-md`}>
                            <TableHead>
                                <TableRow>
                                    {!(variable.dock && variable.dock.in_switch === false) &&
                                        <TableHeader className="!py-1 !pl-2 !pr-2 text-left">in</TableHeader>}
                                    <TableHeader
                                        className="!py-1 text-left">{variable.dock?.key_label || "key"}</TableHeader>
                                    {!(variable.dock && variable.dock.value_field === false) && <TableHeader
                                        className="!py-1 text-left">{variable.dock?.value_label || "value"}</TableHeader>}
                                    {!(variable.dock && variable.dock.out_switch === false) &&
                                        <TableHeader className="!py-1 !pl-2 !pr-2 text-left">out</TableHeader>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {variable.value === null || (variable.value as []).length === 0 &&
                                    (
                                        <TableRow className="!py-1">
                                            <TableCell colSpan={4} className="!py-1 !pl-2 !pr-2">
                                                <Text className={`${categoryMainTextColor}`}>No data</Text>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }
                                {isArray &&
                                    (variable.value as NodeVariable[]).map((item, index) => {
                                        if (
                                            item.type === 'string' || // Legacy string type (in case of dict it could be configured as string, not str)
                                            item.type === NodeVariableType.String ||
                                            item.type === NodeVariableType.Boolean ||
                                            item.type === NodeVariableType.List ||
                                            item.type === NodeVariableType.Dict ||
                                            item.type === NodeVariableType.Int ||
                                            item.type === NodeVariableType.Float
                                        ) {
                                            return (
                                                <TableRow key={item.handle + '-' + index}>
                                                    {!(variable.dock && variable.dock.in_switch === false) &&
                                                        <TableCell className="!p-1 !pl-2">
                                                            {item.has_in ? (
                                                                <CheckCircleIcon className={"w-4 h-4"}/>) : (
                                                                <XCircleIcon className={'w-4 h-4'}/>)}
                                                        </TableCell>}
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
                                                        {isSubValueConnected(nodeId, `${variable.handle}.${item.handle}`)
                                                            ? <BoltIcon
                                                                className="w-4 h-4 text-orange-800 dark:text-yellow-300"
                                                                title="Connected"/>
                                                            : item.value?.toString()
                                                        }
                                                    </TableCell>
                                                    {!(variable.dock && variable.dock.out_switch === false) &&
                                                        <TableCell className="!p-1 !pr-2">
                                                            {item.has_out ? (
                                                                <CheckCircleIcon
                                                                    className={`w-4 h-4 ${categoryMainTextColor}`}/>) : (
                                                                <XCircleIcon
                                                                    className={`w-4 h-4 ${categoryMainTextColor}`}/>)}
                                                        </TableCell>}
                                                </TableRow>
                                            );
                                        }
                                        return null;
                                    })}
                            </TableBody>
                        </Table>
                        <button
                            className={`group w-full ${categoryBackgroundColor} rounded-br-md rounded-bl-md hover:cursor-pointer rounded-tr-none rounded-tl-none after:rounded-tl-none after:rounded-tr-none p-1 pt-0`}
                            onClick={() => onEdit(nodeId)}
                        >
                            <PencilIcon
                                className="w-4 h-4 inline text-sky-700/50 group-hover:text-sky-700 dark:text-white/50 dark:group-hover:text-white"/>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default VariableTypeDict;
