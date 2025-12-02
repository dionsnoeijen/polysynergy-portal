'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
// import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import {useHandlePlay} from '@/hooks/editor/useHandlePlay';
import {PlayIcon, ChevronDownIcon, Squares2X2Icon} from '@heroicons/react/24/outline';
import type { Node } from '@/types/types';
import { useBranding } from '@/contexts/branding-context';

export default function BottomLeftPlayMenu() {
    const { accent_color } = useBranding();

    // Helper to convert hex to rgba
    const hexToRgba = (hex: string, opacity: number) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return `rgba(14, 165, 233, ${opacity})`;
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const lightBg = hexToRgba(accent_color, 0.1);
    const lightBgHover = hexToRgba(accent_color, 0.2);
    const borderColor = hexToRgba(accent_color, 0.6);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get all nodes from store
    const nodes = useNodesStore((state) => state.nodes);

    // Filter play button nodes with useMemo to avoid infinite loop
    const playButtonNodes = useMemo(() =>
        nodes.filter((node) =>
            node.path === 'polysynergy_nodes.play.config.PlayConfig' ||
            node.path === 'polysynergy_nodes.play.play.Play' ||
            node.has_play_button === true
        ),
        [nodes]
    );
    const getNodeVariable = useNodesStore((state) => state.getNodeVariable);
    const findMainPlayNode = useNodesStore((state) => state.findMainPlayNode);
    const handlePlay = useHandlePlay();

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

    // Update selected node when play button nodes change
    useEffect(() => {
        // If currently selected node no longer exists, select first available
        if (selectedPlayNode && !allPlayableNodes.some(n => n.id === selectedPlayNode.id)) {
            setSelectedPlayNode(mainPlayNode || playButtonNodes[0]);
        }
        // If no node is selected but nodes are available, select the first one
        if (!selectedPlayNode && allPlayableNodes.length > 0) {
            setSelectedPlayNode(mainPlayNode || playButtonNodes[0]);
        }
    }, [playButtonNodes.length, allPlayableNodes, selectedPlayNode, mainPlayNode]);

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

    // Always render the menu, but disable the play button if no nodes available
    return (
        <div className="absolute bottom-2 left-2 z-20">
            <div
                className="dark:bg-zinc-800/80 dark:border-white/25 rounded-lg p-2 flex items-center gap-2"
                style={{
                    backgroundColor: lightBg,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: borderColor
                }}
            >
                {hasMultiplePlayButtons ? (
                    <div className="flex items-center">
                        {/* Play Button */}
                        <button
                            disabled={allPlayableNodes.length === 0}
                            className="p-1 rounded-l-md dark:hover:bg-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => !allPlayableNodes.length && (e.currentTarget.style.backgroundColor = lightBgHover)}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title={allPlayableNodes.length > 0 ? `Play ${getNodeDisplayName(selectedPlayNode || allPlayableNodes[0])}` : 'No playable nodes'}
                            onClick={handlePlayClick}
                        >
                            <PlayIcon className="h-5 w-5 dark:text-white/70" style={{ color: accent_color }}/>
                        </button>

                        {/* Dropdown Button */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                className="p-1 rounded-r-md dark:hover:bg-zinc-400 border-l dark:border-zinc-600"
                                style={{
                                    backgroundColor: 'transparent',
                                    borderLeftColor: hexToRgba(accent_color, 0.3)
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = lightBgHover}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="Select play button"
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                <ChevronDownIcon className="h-4 w-4 dark:text-white/70" style={{ color: accent_color }}/>
                            </button>
                            
                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div
                                    className="absolute bottom-full mb-2 left-0 bg-white dark:bg-zinc-800 dark:border-white/25 rounded-md shadow-lg min-w-48 py-1 z-[60]"
                                    style={{
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                        borderColor: borderColor
                                    }}
                                >
                                    {allPlayableNodes.map((node) => (
                                        <button
                                            key={node.id}
                                            className="w-full text-left px-3 py-2 dark:hover:bg-zinc-700 flex items-center gap-2"
                                            style={{ backgroundColor: 'transparent' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = lightBg}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            onClick={() => {
                                                setSelectedPlayNode(node);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <Squares2X2Icon className="h-4 w-4 dark:text-white/70 flex-shrink-0" style={{ color: accent_color }}/>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {getNodeDisplayName(node)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {node.handle}
                                                </div>
                                            </div>
                                            {(selectedPlayNode?.id === node.id) && (
                                                <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: accent_color }}></div>
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
                        className="p-1 rounded-md dark:hover:bg-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => !allPlayableNodes.length && (e.currentTarget.style.backgroundColor = lightBgHover)}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title={allPlayableNodes.length > 0 ? `Play ${getNodeDisplayName(allPlayableNodes[0])}` : 'No playable nodes'}
                        onClick={handlePlayClick}
                    >
                        <PlayIcon className="h-5 w-5 dark:text-white/70" style={{ color: accent_color }}/>
                    </button>
                )}
            </div>
        </div>
    );
}