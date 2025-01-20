"use client";

import React, {useEffect, useRef} from "react";
import useEditorStore from "@/stores/editorStore";
import { Input, InputGroup } from "@/components/input";
import {ChevronRightIcon, MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import useAvailableNodeStore from "@/stores/availableNodesStore";
import useNodesStore from "@/stores/nodesStore";
import useGroupsStore from "@/stores/groupStore";
import {globalToLocal} from "@/utils/positionUtils";
import {useMousePosition} from "@/hooks/editor/useMousePosition";

const AddNode: React.FC = () => {
    const {
        showAddingNode,
        setShowAddingNode,
        setAddingNode,
        openGroup,
    } = useEditorStore();

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
    const { addNodeToGroup } = useGroupsStore();

    const { x: mouseX, y: mouseY } = useMousePosition();

    const inputRef = useRef<HTMLInputElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (showAddingNode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showAddingNode]);

    useEffect(() => {
        filterAvailableNodes();
    }, [filterAvailableNodes, searchPhrase, availableNodes]);

    useEffect(() => {
        fetchAvailableNodes();
    }, [fetchAvailableNodes]);

    const handleAddNodeAtPosition = (nodeId: string, screenX: number, screenY: number) => {
        setAddingNode(nodeId);
        setShowAddingNode(false);

        const node = getAvailableNodeById(nodeId);
        if (!node) return;

        const position = globalToLocal(screenX, screenY);
        node.view = {
            x: position.x,
            y: position.y,
            width: 200,
            height: 200,
            disabled: false,
            adding: true,
            collapsed: false
        };

        addNode(node);

        if (openGroup) {
            addNodeToGroup(openGroup, node.id);
        }

        resetSelectedNodeIndex();
    };

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
                setSelectedNodeIndex((prev) =>
                    Math.min(prev + 1, filteredAvailableNodes.length - 1)
                );
            } else if (e.key === "ArrowUp") {
                setSelectedNodeIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && selectedNodeIndex >= 0) {
                const nodeId = filteredAvailableNodes[selectedNodeIndex].id;
                handleAddNodeAtPosition(nodeId, mouseX, mouseY);
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
        setSelectedNodeIndex,
        resetSelectedNodeIndex,
        mouseX,
        mouseY,
        handleAddNodeAtPosition,
        setShowAddingNode
    ]);

    return (
        <>
            {showAddingNode && (
                <div
                    ref={modalRef}
                    onWheel={(e) => e.stopPropagation()}
                    className="absolute p-4 bg-black/90 rounded-lg shadow-lg w-[700px] h-[300px] left-[50%] top-[50%] transform -translate-x-1/2 -translate-y-1/2 z-10"
                >
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
                        {filteredAvailableNodes.map((n, index) => (
                            <div
                                key={n.id}
                                onClick={(e) => handleAddNodeAtPosition(n.id, e.clientX, e.clientY)}
                                className={`cursor-pointer p-2 rounded-md ${
                                    index === selectedNodeIndex
                                        ? "bg-zinc-800 text-white"
                                        : "hover:bg-zinc-800 text-gray-300"
                                }`}
                            >
                                <span className="text-sm text-gray-400">{n.category}</span>
                                <ChevronRightIcon className="h-5 inline text-gray-400" />
                                {n.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default AddNode;