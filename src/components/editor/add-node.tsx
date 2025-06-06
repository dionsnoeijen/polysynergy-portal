"use client";

import React, { useCallback, useEffect, useRef } from "react";
import useEditorStore from "@/stores/editorStore";
import { Input, InputGroup } from "@/components/input";
import { ChevronRightIcon, MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import useAvailableNodeStore from "@/stores/availableNodesStore";
import useNodesStore from "@/stores/nodesStore";
import { globalToLocal } from "@/utils/positionUtils";
import { useMousePosition } from "@/hooks/editor/useMousePosition";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/button";
import { FormType } from "@/types/types";

const AddNode: React.FC = () => {
    const showAddingNode = useEditorStore((state) => state.showAddingNode);
    const setShowAddingNode = useEditorStore((state) => state.setShowAddingNode);
    const setAddingNode = useEditorStore((state) => state.setAddingNode);
    const openedGroup = useNodesStore((state) => state.openedGroup);
    const openForm = useEditorStore((state) => state.openForm);

    const filteredAvailableNodes = useAvailableNodeStore((state) => state.filteredAvailableNodes);
    const selectedNodeIndex = useAvailableNodeStore((state) => state.selectedNodeIndex);
    const setSelectedNodeIndex = useAvailableNodeStore((state) => state.setSelectedNodeIndex);
    const resetSelectedNodeIndex = useAvailableNodeStore((state) => state.resetSelectedNodeIndex);
    const setSearchPhrase = useAvailableNodeStore((state) => state.setSearchPhrase);
    const getAvailableNodeById = useAvailableNodeStore((state) => state.getAvailableNodeById);
    const searchPhrase = useAvailableNodeStore((state) => state.searchPhrase);

    const addNode = useNodesStore((state) => state.addNode);
    const addNodeToGroup = useNodesStore((state) => state.addNodeToGroup);

    const { x: mouseX, y: mouseY } = useMousePosition();

    const inputRef = useRef<HTMLInputElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (showAddingNode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showAddingNode]);

    const handleAddNodeAtPosition = useCallback((nodeId: string, screenX: number, screenY: number) => {
        const node = getAvailableNodeById(nodeId);
        if (!node) return;

        setShowAddingNode(false);
        setSearchPhrase("");
        resetSelectedNodeIndex();

        if (node?.category === 'service') {
            openForm(FormType.PlaceService, node.id);
            return;
        }

        if (node?.category === 'blueprint') {
            openForm(FormType.PlaceBlueprint, node.id);
            return;
        }

        const replaceIdWith = uuidv4();
        setAddingNode(replaceIdWith);

        const position = globalToLocal(screenX, screenY);
        node.id = replaceIdWith;
        node.view = {
            x: position.x,
            y: position.y,
            width: 200,
            height: 200,
            disabled: false,
            adding: true,
            collapsed: false
        };

        delete node.temp;

        addNode(node, true);

        if (openedGroup) {
            addNodeToGroup(openedGroup, node.id);
        }
    // eslint-disable-next-line
    }, [addNode, addNodeToGroup, getAvailableNodeById, openedGroup, setAddingNode, setShowAddingNode, setSearchPhrase, resetSelectedNodeIndex]);

    const handleAddNewNode = () => {
        openForm(FormType.AddNode);
    };

    useEffect(() => {
        if (!showAddingNode) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setShowAddingNode(false);
                setSearchPhrase("");
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
                setSearchPhrase("");
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
        setShowAddingNode,
        setSearchPhrase
    ]);

    return (
        <>
            {showAddingNode && (
                <div
                    ref={modalRef}
                    onWheel={(e) => e.stopPropagation()}
                    className="fixed p-4 bg-sky-100 dark:bg-black/90 dark:border-white/10 border-sky-500/50 rounded-lg shadow-lg w-[700px] h-[395px] left-[50%] top-[50%] transform -translate-x-1/2 -translate-y-2/3 z-30"
                >
                    <InputGroup>
                        <MagnifyingGlassIcon data-slot="icon" className="h-5 w-5 text-zinc-500" />
                        <Input
                            type="search"
                            placeholder="Search node"
                            value={searchPhrase}
                            onChange={(e) => setSearchPhrase(e.target.value)}
                            ref={inputRef}
                        />
                    </InputGroup>
                    <div className="absolute inset-4 top-16 bottom-16 overflow-y-auto">
                        {filteredAvailableNodes.map((n, index) => (
                            <div
                                key={'add-' + n.id}
                                onClick={(e) => handleAddNodeAtPosition(n.id, e.clientX, e.clientY)}
                                className={`cursor-pointer p-2 rounded-md ${
                                    index === selectedNodeIndex
                                        ? "bg-sky-300 text-sky-800 dark:bg-zinc-800 dark:text-white"
                                        : "hover:bg-sky-400 text-sky-800 dark:hover:bg-zinc-800 dark:text-gray-300"
                                }`}
                            >
                                <span className="text-sm text-sky-800 dark:text-gray-400">{n.category}</span>
                                <ChevronRightIcon className="h-5 inline text-sky-800 dark:text-gray-400" />
                                {n.name}
                            </div>
                        ))}
                    </div>
                    <div className="absolute bottom-4 right-4 left-4 h-auto overflow-y-auto">
                        <Button color={'sky'} onClick={handleAddNewNode} className={'w-full'}>
                            New Node <PlusIcon />
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddNode;