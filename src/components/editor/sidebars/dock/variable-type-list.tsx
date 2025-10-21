import React from "react";

import {FormType, VariableTypeProps} from "@/types/types";
import {Text} from "@/components/text";
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
    inDock = true,
    categoryMainTextColor = 'text-sky-500 dark:text-white/70',
    categorySubTextColor = 'text-sky-700 dark:text-white/70',
    categoryBorder = 'border border-sky-200 dark:border-zinc-700'
}: VariableTypeProps): React.ReactElement => {
    // PERFORMANCE: Convert store subscriptions to getState() pattern
    // These components are rendered for every variable in the dock sidebar
    const isArray = Array.isArray(variable.value);

    const onEdit = React.useCallback((nodeId: string) => {
        useEditorStore.getState().openForm(FormType.EditList, nodeId, variable);
    }, [variable]);

    const isValueConnected = React.useMemo(() =>
        useConnectionsStore.getState().isValueConnectedExcludingGroupBoundary(nodeId, variable.handle),
        [nodeId, variable.handle]
    );

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
                    <div className={`${categoryBorder} rounded-md relative z-0 bg-zinc-50 dark:bg-white/5 ${variable?.dock?.enabled === false || (variable.published && inDock) ? 'opacity-40 pointer-events-none' : ''}`}>
                        {/* Header */}
                        <div className={`px-3 py-2 text-sm font-medium ${categorySubTextColor} border-b border-current opacity-30`}>
                            {variable.dock?.key_label || "items"}
                        </div>
                        
                        {/* Items */}
                        <div className={`divide-y ${categorySubTextColor.replace('text-', 'divide-').replace(' dark:text-', ' dark:divide-')} opacity-30`}>
                            {variable.value === null && (
                                <div className={`px-3 py-2 text-sm ${categoryMainTextColor}`}>
                                    <Text>No files</Text>
                                </div>
                            )}
                            {isArray &&
                                (variable.value as string[]).map((item, index) => (
                                    <div
                                        key={`file-${index}`}
                                        className={`px-3 py-2 text-sm ${categoryMainTextColor} max-w-[100px] truncate overflow-hidden whitespace-nowrap`}
                                        title={item}
                                    >
                                        {item as string}
                                    </div>
                                ))}
                        </div>
                        <Button
                            plain
                            className="w-full bg-zinc-100 dark:bg-white/5 hover:cursor-pointer rounded-tr-none rounded-tl-none after:rounded-tl-none after:rounded-tr-none p-0 !px-0 !py-0"
                            onClick={() => onEdit(nodeId)}
                        >
                            <PencilIcon className="w-4 h-4 inline text-zinc-600 dark:text-slate-400" />
                        </Button>
                    </div>
                </>
            )}
        </>
    );
};

// PERFORMANCE: Memoize to prevent unnecessary re-renders
export default React.memo(VariableTypeList, (prevProps, nextProps) => {
    return (
        prevProps.variable === nextProps.variable &&
        prevProps.nodeId === nextProps.nodeId &&
        prevProps.publishedButton === nextProps.publishedButton &&
        prevProps.inDock === nextProps.inDock
    );
});
