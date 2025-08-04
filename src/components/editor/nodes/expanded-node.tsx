import React from 'react';
import {Node, NodeEnabledConnector, NodeType, NodeVariableType} from '@/types/types';
import {ChevronDownIcon, HomeIcon} from '@heroicons/react/24/outline';
import Connector from '@/components/editor/nodes/connector';
import ThreeWaySwitch from '@/components/editor/nodes/three-way-switch';
import NodeIcon from '@/components/editor/nodes/node-icon';
import ServiceHeading from '@/components/editor/nodes/rows/service-heading';
import NodeVariables from '@/components/editor/nodes/rows/node-variables';
import PlayButton from '@/components/editor/nodes/rows/play-button';
import ExecutionOrder from '@/components/editor/nodes/execution-order';

interface ExpandedNodeProps {
    node: Node;
    preview: boolean;
    mockNode: unknown;
    styles: {
        border: string;
        background: string;
        mainText: string;
        subText: string;
    };
    isCollapsable: boolean;
    onCollapse: () => void;
    onResizeMouseDown: (e: React.MouseEvent) => void;
}

const ExpandedNode: React.FC<ExpandedNodeProps> = ({
    node,
    preview,
    mockNode,
    styles,
    isCollapsable,
    onCollapse,
    onResizeMouseDown
}) => {
    return (
        <>
            {mockNode && <ExecutionOrder mockNode={mockNode} centered={false}/>}
            
            {/* Header */}
            <div className={`flex items-center border-b ${styles.border} ${styles.background} p-[0.86rem] w-full overflow-visible relative pl-5 ${node.view.disabled && 'select-none opacity-0'}`}>
                {node.has_enabled_switch && (
                    <>
                        <Connector 
                            in
                            nodeId={node.id}
                            handle={NodeEnabledConnector.Node}
                            nodeVariableType={[NodeVariableType.TruePath, NodeVariableType.FalsePath].join(',')}
                        />
                        <ThreeWaySwitch disabled={preview} node={node}/>
                    </>
                )}
                
                {node.category === NodeType.Note && (
                    <div className="absolute -top-4 left-1/2 z-30 text-2xl pointer-events-none">
                        📌
                    </div>
                )}
                
                {node?.icon && (
                    <div className="flex items-center justify-center h-10 w-10 mr-0">
                        <NodeIcon
                            icon={node.icon}
                            className={`h-10 w-10 ${node.has_enabled_switch ? 'ml-2' : ''} ${styles.mainText}`}
                            preserveColor={!!node.service}
                        />
                    </div>
                )}
                
                <div className={`flex flex-col justify-center ${node.has_enabled_switch ? 'ml-2' : 'ml-3'} min-w-0`}>
                    <h3 className={`font-bold truncate ${styles.mainText}`}>
                        {node.service?.name?.trim() === '' ? '...' : node.service?.name || node.name}
                    </h3>
                    <h5 className={`text-xs truncate ${styles.subText} -mt-0.5`}>
                        {node.category}
                    </h5>
                </div>

                {false === node.view.isDeletable && (<HomeIcon className={'ml-2 h-4 w-4'}/>)}
                
                {isCollapsable && (
                    <button onClick={onCollapse} className={`ml-auto p-1 px-1 py-1`}>
                        <ChevronDownIcon className={`w-6 h-6 ${styles.mainText}`}/>
                    </button>
                )}
            </div>
            
            {/* Content */}
            <div className={`flex flex-col w-full items-start overflow-visible ${node.view.disabled && 'select-none opacity-0'}`}>
                <div className="w-full">
                    {node.category !== NodeType.Note && (
                        <div className={`flex items-center justify-between w-full pl-4 pr-4 pt-[.5rem] pb-[0.8rem] mb-1 relative border-b ${styles.border}`}>
                            <b className={`${styles.mainText} truncate`}>{node.handle}</b>
                        </div>
                    )}
                    
                    {node.service && node.service.id && (
                        <ServiceHeading
                            nodeName={node.name}
                            preview={preview}
                            node={node}
                            icon={node.icon}
                            categoryMainTextColor={styles.mainText}
                            categorySubTextColor={styles.subText}
                            categoryBorderColor={styles.border}
                        />
                    )}
                    
                    <NodeVariables
                        node={node}
                        variables={node.variables.map((variable) => ({variable, nodeId: node.id}))}
                        categoryMainTextColor={styles.mainText}
                        categorySubTextColor={styles.subText}
                    />
                    
                    {node.has_play_button && (
                        <PlayButton
                            disabled={node.view.disabled}
                            nodeId={node.id}
                            staged={node.path === 'polysynergy_nodes.play.play.Play'}
                            categoryMainTextColor={styles.mainText}
                            categorySubTextColor={styles.subText}
                        />
                    )}
                </div>
            </div>
            
            {/* Resize Handle */}
            <div
                onMouseDown={onResizeMouseDown}
                className="absolute w-[20px] h-[20px] border-r rounded-tr-none rounded-bl-none border-b border-sky-500/50 dark:border-white/50 right-[-5px] bottom-[-5px] cursor-se-resize rounded-[10px]"
            />
        </>
    );
};

export default ExpandedNode;