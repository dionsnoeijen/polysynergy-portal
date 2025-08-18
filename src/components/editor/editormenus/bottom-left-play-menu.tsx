'use client';

import React, { useState, useEffect, useRef } from 'react';
// import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import {useHandlePlay} from '@/hooks/editor/useHandlePlay';
import {PlayIcon, ChevronDownIcon} from '@heroicons/react/24/outline';
import type { Node } from '@/types/types';

export default function BottomLeftPlayMenu() {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const getNodes = useNodesStore((state) => state.getNodes);
    const getNodeVariable = useNodesStore((state) => state.getNodeVariable);
    const findMainPlayNode = useNodesStore((state) => state.findMainPlayNode);
    const handlePlay = useHandlePlay();

    // Get all play button nodes (by path OR has_play_button property)
    const allNodes = getNodes();
    const playButtonNodes = allNodes.filter((node) => 
        node.path === 'polysynergy_nodes.play.config.PlayConfig' || 
        node.path === 'polysynergy_nodes.play.play.Play' ||
        node.has_play_button === true
    );

    // Get the main play node (or first available) 
    const mainPlayNode = findMainPlayNode();
    
    // Create combined list of all playable nodes
    const allPlayableNodes: Node[] = [];
    if (mainPlayNode && !playButtonNodes.some(n => n.id === mainPlayNode.id)) {
        allPlayableNodes.push(mainPlayNode);
    }
    allPlayableNodes.push(...playButtonNodes);
    
    // Select the first available playable node
    const [selectedPlayNode, setSelectedPlayNode] = useState(mainPlayNode || playButtonNodes[0]);

    // Only show dropdown if there are multiple playable nodes
    const hasMultiplePlayButtons = allPlayableNodes.length > 1;
    

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLElement)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDropdown]);

    const handlePlayClick = (e: React.MouseEvent) => {
        // Use the first available playable node
        const nodeToPlay = selectedPlayNode || allPlayableNodes[0];
        if (nodeToPlay) {
            handlePlay(e, nodeToPlay.id);
        }
    };

    const getNodeDisplayName = (node: { id: string; handle: string }) => {
        if (!node) return 'Play';
        const title = getNodeVariable(node.id, "title")?.value as string;
        return title?.trim() || `Play ${node.handle}`;
    };

    // Don't render if no playable nodes exist
    if (allPlayableNodes.length === 0) {
        return null;
    }

    return (
        <div className="absolute bottom-2 left-2 z-20">
            <div className="bg-sky-50 dark:bg-zinc-800/80 border border-sky-500/60 dark:border-white/25 rounded-lg p-2 flex items-center gap-2">
                {hasMultiplePlayButtons ? (
                    <div className="flex items-center">
                        {/* Play Button */}
                        <button 
                            disabled={allPlayableNodes.length === 0}
                            className="hover:bg-sky-200 p-1 rounded-l-md dark:hover:bg-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed" 
                            title={allPlayableNodes.length > 0 ? `Play ${getNodeDisplayName(selectedPlayNode || allPlayableNodes[0])}` : 'No playable nodes'}
                            onClick={handlePlayClick}
                        >
                            <PlayIcon className="h-5 w-5 text-sky-500 dark:text-white/70"/>
                        </button>
                        
                        {/* Dropdown Button */}
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                className="hover:bg-sky-200 p-1 rounded-r-md dark:hover:bg-zinc-400 border-l border-sky-300 dark:border-zinc-600" 
                                title="Select play button"
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                <ChevronDownIcon className="h-4 w-4 text-sky-500 dark:text-white/70"/>
                            </button>
                            
                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-zinc-800 border border-sky-500/60 dark:border-white/25 rounded-md shadow-lg min-w-48 py-1 z-50">
                                    {allPlayableNodes.map((node) => (
                                        <button
                                            key={node.id}
                                            className="w-full text-left px-3 py-2 hover:bg-sky-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                                            onClick={() => {
                                                setSelectedPlayNode(node);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <PlayIcon className="h-4 w-4 text-sky-500 dark:text-white/70 flex-shrink-0"/>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {getNodeDisplayName(node)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {node.handle}
                                                </div>
                                            </div>
                                            {(selectedPlayNode?.id === node.id) && (
                                                <div className="ml-auto w-2 h-2 bg-sky-500 rounded-full"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Single Play Button
                    <button 
                        disabled={allPlayableNodes.length === 0}
                        className="hover:bg-sky-200 p-1 rounded-md dark:hover:bg-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed" 
                        title={allPlayableNodes.length > 0 ? `Play ${getNodeDisplayName(allPlayableNodes[0])}` : 'No playable nodes'}
                        onClick={handlePlayClick}
                    >
                        <PlayIcon className="h-5 w-5 text-sky-500 dark:text-white/70"/>
                    </button>
                )}
            </div>
        </div>
    );
}