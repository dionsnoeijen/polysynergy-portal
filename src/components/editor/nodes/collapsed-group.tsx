import React from 'react';
import {Node, NodeCollapsedConnector} from '@/types/types';
import {ChevronUpIcon, GlobeAltIcon} from '@heroicons/react/24/outline';
import Connector from '@/components/editor/nodes/connector';
import NodeIcon from '@/components/editor/nodes/node-icon';
import {ConfirmAlert} from '@/components/confirm-alert';
import NodeNotesDisplay from '@/components/editor/nodes/node-notes-display';
import { useGroupExecutionOrders } from '@/hooks/editor/nodes/useGroupExecutionOrders';
import GroupExecutionOrders from '@/components/editor/nodes/group-execution-orders';

interface CollapsedGroupProps {
    node: Node;
    styles: {
        background: string;
        mainText: string;
        subText: string;
    };
    onCollapse: () => void;
    isDissolveDialogOpen: boolean;
    setIsDissolveDialogOpen: (open: boolean) => void;
    onConfirmDissolve: () => void;
}

const CollapsedGroup: React.FC<CollapsedGroupProps> = ({
    node,
    styles,
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

            {/* Notes Display - Always visible at top even when collapsed */}
            <NodeNotesDisplay node={node} isCollapsed={true} />

            <Connector in nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>

            <div className="flex items-center gap-2">
                {node?.icon ? (
                    <NodeIcon
                        icon={node.icon}
                        className={`${styles.mainText} w-10 h-10 max-w-10 max-h-10`}
                        preserveColor={!!node.service?.id}
                    />
                ) : (
                    <GlobeAltIcon className={`w-10 h-10 ${styles.mainText}`}/>
                )}
                
                <div className={`flex flex-col justify-center ml-2 min-w-0 max-w-[150px]`}>
                    <h3 className={`font-bold truncate ${styles.mainText}`}>{node.name}</h3>
                    <h5 className={`text-xs truncate ${styles.subText} -mt-0.5`}>
                        {node.category}
                    </h5>
                </div>

                <button onClick={onCollapse} className="ml-auto p-1 px-1 py-1">
                    <ChevronUpIcon className={`w-6 h-6 ${styles.mainText}`}/>
                </button>
            </div>
            
            <Connector out nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>

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

export default CollapsedGroup;