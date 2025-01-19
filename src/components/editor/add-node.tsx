"use client";

import React, {useEffect, useRef} from "react";
import useEditorStore from "@/stores/editorStore";
import { Input, InputGroup } from "@/components/input";
import {ChevronRightIcon, MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import useAvailableNodeStore from "@/stores/availableNodesStore";
import useNodesStore from "@/stores/nodesStore";
import {globalToLocal} from "@/utils/positionUtils";
import {useMousePosition} from "@/hooks/editor/useMousePosition";

const AddNode: React.FC = () => {
    const { showAddingNode, setShowAddingNode, setAddingNode } = useEditorStore();
    const {
        filteredAvailableNodes,
        selectedNodeIndex,
        setSelectedNodeIndex,
        resetSelectedNodeIndex,
        setSearchPhrase,
        filterAvailableNodes,
        searchPhrase,
        fetchAvailableNodes,
        availableNodes,
        getAvailableNodeById
    } = useAvailableNodeStore();
    const { addNode } = useNodesStore();

    const { x: mouseX, y: mouseY } = useMousePosition();

    const inputRef = useRef<HTMLInputElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (showAddingNode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showAddingNode]);

    // Filter nodes when the search phrase changes
    useEffect(() => {
        filterAvailableNodes();
    }, [filterAvailableNodes, searchPhrase, availableNodes]);

    useEffect(() => {
        fetchAvailableNodes();
    }, [fetchAvailableNodes]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!showAddingNode) return;

         const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setShowAddingNode(false);
                resetSelectedNodeIndex();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                setSelectedNodeIndex((prevIndex: number) => Math.min(prevIndex + 1, filteredAvailableNodes.length - 1));
            } else if (e.key === "ArrowUp") {
                setSelectedNodeIndex((prevIndex) => Math.max(prevIndex - 1, 0));
            } else if (e.key === "Enter" && selectedNodeIndex >= 0) {
                setAddingNode(filteredAvailableNodes[selectedNodeIndex].id);
                setShowAddingNode(false);
                const node = getAvailableNodeById(filteredAvailableNodes[selectedNodeIndex].id);
                if (!node) return;

                const position = globalToLocal(mouseX, mouseY);
                node.view = {
                    x: position.x,
                    y: position.y,
                    width: 200,
                    height: 200,
                    disabled: false,
                    adding: true
                };

                addNode(node);
                resetSelectedNodeIndex();
            } else if (e.key === "Escape") {
                setShowAddingNode(false);
                resetSelectedNodeIndex();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        showAddingNode,
        filteredAvailableNodes,
        selectedNodeIndex,
        setAddingNode,
        setShowAddingNode,
        resetSelectedNodeIndex,
        setSelectedNodeIndex,
    ]);

    return (
        <>
            {showAddingNode && (
                <div
                    ref={modalRef}
                    onWheel={(e) => e.stopPropagation()}
                    className="absolute p-4 bg-black/90 rounded-lg shadow-lg w-[700px] h-[300px] left-[50%] top-[50%] transform -translate-x-1/2 -translate-y-1/2 z-10">
                    <InputGroup>
                        <MagnifyingGlassIcon data-slot="icon" className="h-5 w-5 text-zinc-500" />
                        <Input
                            type="search"
                            placeholder="Search node"
                            onChange={(e) => setSearchPhrase(e.target.value)}
                            ref={inputRef}
                        />
                    </InputGroup>
                    <div className="absolute inset-4 top-16 overflow-y-auto">
                        {filteredAvailableNodes.map((node, index) => (
                            <div
                                key={node.id}
                                onClick={(e: React.MouseEvent) => {
                                    setAddingNode(node.id);
                                    setShowAddingNode(false);
                                    const availableNode = getAvailableNodeById(node.id);
                                    if (!availableNode) return;
                                    const position = globalToLocal(e.clientX, e.clientY);
                                    availableNode.view = {
                                        x: position.x,
                                        y: position.y,
                                        width: 200,
                                        height: 200,
                                        disabled: false,
                                        adding: true
                                    };
                                    addNode(availableNode);
                                }}
                                className={`cursor-pointer p-2 rounded-md ${
                                    index === selectedNodeIndex
                                        ? "bg-zinc-800 text-white"
                                        : "hover:bg-zinc-800 text-gray-300"
                                }`}
                            >
                                <span className="text-sm text-gray-400">{node.category}</span><ChevronRightIcon className="h-5 inline text-gray-400" />{node.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default AddNode;