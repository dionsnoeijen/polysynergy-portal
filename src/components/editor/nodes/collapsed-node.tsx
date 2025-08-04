import React from 'react';
import {Node, NodeCollapsedConnector} from '@/types/types';
import {MockNode} from '@/stores/mockStore';
import {ChevronUpIcon, GlobeAltIcon} from '@heroicons/react/24/outline';
import Connector from '@/components/editor/nodes/connector';
import NodeIcon from '@/components/editor/nodes/node-icon';
import PlayButton from '@/components/editor/nodes/rows/play-button';
import ExecutionOrder from '@/components/editor/nodes/execution-order';

interface CollapsedNodeProps {
    node: Node;
    mockNode: MockNode | null;
    styles: {
        background: string;
        mainText: string;
        subText: string;
    };
    onCollapse: () => void;
}

const CollapsedNode: React.FC<CollapsedNodeProps> = ({
    node,
    mockNode,
    styles,
    onCollapse
}) => {
    return (
        <>
            {mockNode && <ExecutionOrder mockNode={mockNode} centered={false}/>}
            
            <Connector in nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>
            
            <div className="flex items-center gap-2">
                {node?.has_play_button ? (
                    <PlayButton
                        disabled={node.view.disabled}
                        nodeId={node.id}
                        centered={false}
                        collapsed={true}
                    />
                ) : (
                    node?.icon ? (
                        <NodeIcon
                            icon={node.icon}
                            className={`${styles.mainText} w-10 h-10 max-w-10 max-h-10`}
                            preserveColor={!!node.service?.id}
                        />
                    ) : (
                        <GlobeAltIcon className={`w-10 h-10 ${styles.mainText}`}/>
                    )
                )}
                
                <div className={`flex flex-col justify-center ml-2 min-w-0`}>
                    <h3 className={`font-bold truncate ${styles.mainText}`}>
                        {node.service?.name?.trim() === '' ? '...' : node.service?.name || node.name}
                    </h3>
                    <h5 className={`text-xs truncate ${styles.subText} -mt-0.5`}>
                        {node.handle} : {node.category}
                    </h5>
                </div>
                
                <button onClick={onCollapse} className="ml-auto p-1 px-1 py-1">
                    <ChevronUpIcon className={`w-6 h-6 ${styles.mainText}`}/>
                </button>
            </div>
            
            <Connector out nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>
        </>
    );
};

export default CollapsedNode;