import React from 'react';
import {Node, NodeVariable} from '@/types/types';
import {ChevronDownIcon} from '@heroicons/react/24/outline';
import NodeIcon from '@/components/editor/nodes/node-icon';
import ServiceHeading from '@/components/editor/nodes/rows/service-heading';
import NodeVariables from '@/components/editor/nodes/rows/node-variables';
import {ConfirmAlert} from '@/components/confirm-alert';
import { useGroupExecutionOrders } from '@/hooks/editor/nodes/useGroupExecutionOrders';
import GroupExecutionOrders from '@/components/editor/nodes/group-execution-orders';

interface ExpandedGroupProps {
    node: Node;
    preview: boolean;
    isMirror: boolean;
    styles: {
        border: string;
        background: string;
        mainText: string;
        subText: string;
    };
    variablesForGroup: {
        inVariables?: Array<{ variable: NodeVariable; nodeId: string } | null>;
        outVariables?: Array<{ variable: NodeVariable | undefined; nodeId: string }>;
    } | null;
    onCollapse: () => void;
    isDissolveDialogOpen: boolean;
    setIsDissolveDialogOpen: (open: boolean) => void;
    onConfirmDissolve: () => void;
}

const ExpandedGroup: React.FC<ExpandedGroupProps> = ({
    node,
    preview,
    isMirror,
    styles,
    variablesForGroup,
    onCollapse,
    isDissolveDialogOpen,
    setIsDissolveDialogOpen,
    onConfirmDissolve
}) => {
    const orders = useGroupExecutionOrders(node.id);

    return (
        <>
            {/* Execution Orders */}
            <GroupExecutionOrders orders={orders} />

            {/* Header */}
            <div className={`flex items-center border-b ${styles.border} ${styles.background} p-2 w-full overflow-visible relative pl-5 ${!isMirror && node.view.disabled && 'select-none opacity-0'}`}>
                {node?.icon && (
                    <NodeIcon
                        icon={node.icon}
                        className={`h-10 w-10 ${styles.mainText} mr-3`}
                        preserveColor={!!node.service?.id}
                    />
                )}
                <div className={`flex flex-col justify-center ${node.has_enabled_switch ? 'ml-2' : 'ml-3'} min-w-0`}>
                    <h3 className={`font-bold truncate ${styles.mainText}`}>
                        {node.service
                            ? (node.service.name.trim() === '' ? '...' : node.service.name)
                            : node.name}
                    </h3>
                    <h5 className={`text-xs truncate ${styles.subText} -mt-0.5`}>
                        {node.category}
                    </h5>
                </div>

                <button onClick={onCollapse} className="ml-auto p-1 px-1 py-1">
                    <ChevronDownIcon className={`w-6 h-6 ${styles.mainText}`}/>
                </button>
            </div>

            {/* Service Heading */}
            {node.service && node.service.id && (
                <div className={`flex w-full ${!isMirror && node.view.disabled && 'select-none opacity-0'}`}>
                    <ServiceHeading
                        nodeName={node.name}
                        preview={preview}
                        node={node}
                        icon={node.icon}
                        categoryMainTextColor={styles.mainText}
                        categorySubTextColor={styles.subText}
                        categoryBorderColor={styles.border}
                    />
                </div>
            )}

            {/* Variables */}
            <div className="flex w-full gap-4">
                {variablesForGroup?.inVariables && variablesForGroup?.inVariables?.length > 0 && (
                    <div className="flex-1 flex flex-col">
                        <NodeVariables
                            node={node}
                            categoryMainTextColor={styles.mainText}
                            categorySubTextColor={styles.subText}
                            variables={variablesForGroup.inVariables.filter(
                                (v): v is { variable: NodeVariable; nodeId: string } => v !== null
                            )} 
                            isMirror={isMirror} 
                            onlyIn={true}
                        />
                    </div>
                )}
                {variablesForGroup?.outVariables && variablesForGroup?.outVariables?.length > 0 && (
                    <div className="flex-1 flex flex-col">
                        <NodeVariables
                            node={node}
                            categoryMainTextColor={styles.mainText}
                            categorySubTextColor={styles.subText}
                            variables={variablesForGroup.outVariables}
                            isMirror={isMirror}
                            onlyOut={true}
                        />
                    </div>
                )}
            </div>

            {/* Dissolve Confirmation Dialog */}
            <ConfirmAlert
                open={isDissolveDialogOpen}
                onClose={() => setIsDissolveDialogOpen(false)}
                onConfirm={onConfirmDissolve}
                title={'Confirm Dissolve Group'}
                description={'Are you sure you want to dissolve this group? This action cannot be undone.'}
            />
        </>
    );
};

export default ExpandedGroup;