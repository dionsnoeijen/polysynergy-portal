'use client';

import React, { useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { Input, InputGroup } from "@/components/input";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import useAvailableNodeStore from "@/stores/availableNodesStore";

const AddNode: React.FC = () => {
    const { showAddingNode, setShowAddingNode, setAddingNode } = useEditorStore();
    const {
        filteredAvailableNodes,
        selectedNodeIndex,
        setSelectedNodeIndex,
        resetSelectedNodeIndex,
        setSearchPhrase,
        searchPhrase,
        filterAvailableNodes,
    } = useAvailableNodeStore();

    useEffect(() => {
        filterAvailableNodes();
    }, [filterAvailableNodes, searchPhrase]);

    useEffect(() => {
        if (!showAddingNode) return;

        const handleKeyDown = (e: KeyboardEvent) => {

            console.log('keydown', e.key);

            if (e.key === "ArrowDown") {
                setSelectedNodeIndex((prevIndex) =>
                    Math.min(prevIndex + 1, filteredAvailableNodes.length - 1)
                );
            } else if (e.key === "ArrowUp") {
                setSelectedNodeIndex((prevIndex) => Math.max(prevIndex - 1, 0));
            } else if (e.key === "Enter" && selectedNodeIndex >= 0) {
                setAddingNode(filteredAvailableNodes[selectedNodeIndex].id);
                setShowAddingNode(false);
            } else if (e.key === "Escape") {
                setShowAddingNode(false);
                resetSelectedNodeIndex();
            }

            console.log('selected node index', selectedNodeIndex);
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        showAddingNode,
        filteredAvailableNodes,
        selectedNodeIndex,
        setAddingNode,
        setShowAddingNode,
        resetSelectedNodeIndex,
        setSelectedNodeIndex
    ]);

    return (
        <>
            {showAddingNode && (
                <div
                    className="absolute p-4 bg-black/90 rounded-lg shadow-lg w-[700px] h-[300px] left-[50%] top-[50%] transform -translate-x-1/2 -translate-y-1/2 z-10"
                >
                    <InputGroup>
                        <MagnifyingGlassIcon data-slot="icon" className="h-5 w-5 text-zinc-500" />
                        <Input
                            type="search"
                            placeholder="Search node"
                            onChange={(e) => setSearchPhrase(e.target.value)}
                        />
                    </InputGroup>
                    <div className="mt-4 max-h-64 overflow-y-auto">
                        {filteredAvailableNodes.map((node, index) => (
                            <div
                                key={node.id}
                                onClick={() => {
                                    setAddingNode(node.id);
                                    setShowAddingNode(false);
                                }}
                                className={`cursor-pointer p-2 rounded-md ${
                                    index === selectedNodeIndex
                                        ? "bg-zinc-800 text-white"
                                        : "hover:bg-zinc-800 text-gray-300"
                                }`}
                            >
                                {node.name} <span className="text-sm text-gray-400">{node.category}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default AddNode;