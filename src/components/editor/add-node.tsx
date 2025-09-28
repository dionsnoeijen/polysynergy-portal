"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useEditorStore from "@/stores/editorStore";
import { Input, InputGroup } from "@/components/input";
import { ChevronRightIcon, ChevronDownIcon, MagnifyingGlassIcon, FolderIcon } from "@heroicons/react/24/outline";
import useAvailableNodeStore from "@/stores/availableNodesStore";
import useNodesStore from "@/stores/nodesStore";
import { globalToLocal } from "@/utils/positionUtils";
import { useMousePosition } from "@/hooks/editor/useMousePosition";
import { v4 as uuidv4 } from "uuid";
import { nodeHistoryActions } from "@/stores/history";

const AddNode: React.FC = () => {
    const showAddingNode = useEditorStore((state) => state.showAddingNode);
    const setShowAddingNode = useEditorStore((state) => state.setShowAddingNode);
    const setAddingNode = useEditorStore((state) => state.setAddingNode);
    const openedGroup = useNodesStore((state) => state.openedGroup);

    const filteredAvailableNodes = useAvailableNodeStore((state) => state.filteredAvailableNodes);
    const selectedNodeIndex = useAvailableNodeStore((state) => state.selectedNodeIndex);
    const setSelectedNodeIndex = useAvailableNodeStore((state) => state.setSelectedNodeIndex);
    const resetSelectedNodeIndex = useAvailableNodeStore((state) => state.resetSelectedNodeIndex);
    const setSearchPhrase = useAvailableNodeStore((state) => state.setSearchPhrase);
    const getAvailableNodeById = useAvailableNodeStore((state) => state.getAvailableNodeById);
    const searchPhrase = useAvailableNodeStore((state) => state.searchPhrase);
    const categories = useAvailableNodeStore((state) => state.categories); // Keep for compatibility
    const hierarchicalCategories = useAvailableNodeStore((state) => state.hierarchicalCategories);
    const selectedCategory = useAvailableNodeStore((state) => state.selectedCategory);
    const selectedParentCategory = useAvailableNodeStore((state) => state.selectedParentCategory);
    const setSelectedCategory = useAvailableNodeStore((state) => state.setSelectedCategory);
    const setSelectedParentCategory = useAvailableNodeStore((state) => state.setSelectedParentCategory);
    const toggleCategoryExpanded = useAvailableNodeStore((state) => state.toggleCategoryExpanded);

    const addNode = useNodesStore((state) => state.addNode);
    const addNodeToGroup = useNodesStore((state) => state.addNodeToGroup);

    const { x: mouseX, y: mouseY } = useMousePosition();

    const [focusedPanel, setFocusedPanel] = useState<'categories' | 'nodes'>('nodes');
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
    const [hasNavigated, setHasNavigated] = useState(false);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);
    const categoriesRef = useRef<HTMLDivElement | null>(null);
    const nodesRef = useRef<HTMLDivElement | null>(null);
    const categoryItemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const nodeItemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (showAddingNode && inputRef.current) {
            inputRef.current.focus();
            // Start with nodes panel focused for immediate search
            setFocusedPanel('nodes');
            setSelectedCategoryIndex(0);
            setSelectedCategory(null);
            setHasNavigated(false);
        }
    }, [showAddingNode, setSelectedCategory]);

    const handleAddNodeAtPosition = useCallback((nodeId: string, screenX: number, screenY: number) => {
        const node = getAvailableNodeById(nodeId);
        if (!node) return;

        setShowAddingNode(false);
        setSearchPhrase("");
        resetSelectedNodeIndex();
        setSelectedCategory(null);

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

        // Use history-enabled node addition
        nodeHistoryActions.addNodeWithHistory(node, true);

        if (openedGroup) {
            addNodeToGroup(openedGroup, node.id);
        }
    // eslint-disable-next-line
    }, [addNode, addNodeToGroup, getAvailableNodeById, openedGroup, setAddingNode, setShowAddingNode, setSearchPhrase, resetSelectedNodeIndex, setSelectedCategory]);

    const handleCategorySelect = useCallback((category: string | null) => {
        setSelectedCategory(category);
        // Only clear parent selection if we actually have a parent selection
        if (selectedParentCategory !== null) {
            setSelectedParentCategory(null);
        }
        setSelectedNodeIndex(0);
    }, [setSelectedCategory, setSelectedParentCategory, setSelectedNodeIndex, selectedParentCategory]);

    // Scroll selected item into view
    const scrollItemIntoView = useCallback((element: HTMLElement | null, container: HTMLElement | null) => {
        if (!element || !container) return;
        
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        if (elementRect.top < containerRect.top) {
            element.scrollIntoView({ block: 'start', behavior: 'smooth' });
        } else if (elementRect.bottom > containerRect.bottom) {
            element.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        // Scroll category into view when selected
        if (focusedPanel === 'categories' && categoryItemRefs.current[selectedCategoryIndex]) {
            scrollItemIntoView(categoryItemRefs.current[selectedCategoryIndex], categoriesRef.current);
        }
    }, [selectedCategoryIndex, focusedPanel, scrollItemIntoView]);

    useEffect(() => {
        // Scroll node into view when selected
        if (focusedPanel === 'nodes' && nodeItemRefs.current[selectedNodeIndex]) {
            scrollItemIntoView(nodeItemRefs.current[selectedNodeIndex], nodesRef.current);
        }
    }, [selectedNodeIndex, focusedPanel, scrollItemIntoView]);

    useEffect(() => {
        if (!showAddingNode) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setShowAddingNode(false);
                setSearchPhrase("");
                resetSelectedNodeIndex();
                setSelectedCategory(null);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent default for arrow keys to avoid scrolling the page
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }

            // If user starts typing (letters/numbers), ensure we're filtering
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Focus the input if not already focused
                if (document.activeElement !== inputRef.current) {
                    inputRef.current?.focus();
                }
                return; // Let the input handle the character
            }

            if (e.key === "ArrowLeft") {
                if (focusedPanel === 'nodes') {
                    setFocusedPanel('categories');
                    setHasNavigated(true);
                    // Ensure a category is selected when switching panels
                    if (selectedCategoryIndex === -1) {
                        setSelectedCategoryIndex(0);
                    }
                }
            } else if (e.key === "ArrowRight") {
                if (focusedPanel === 'categories') {
                    // Select the currently highlighted category first
                    if (selectedCategoryIndex === 0) {
                        handleCategorySelect(null);
                    } else {
                        handleCategorySelect(categories[selectedCategoryIndex - 1].name);
                    }
                    // Then switch to nodes panel
                    setFocusedPanel('nodes');
                    setSelectedNodeIndex(0);
                    setHasNavigated(true);
                }
            } else if (focusedPanel === 'categories') {
                if (e.key === "ArrowDown") {
                    setSelectedCategoryIndex(prev => {
                        const newIndex = Math.min(prev + 1, categories.length);
                        setHasNavigated(true);
                        return newIndex;
                    });
                } else if (e.key === "ArrowUp") {
                    setSelectedCategoryIndex(prev => {
                        const newIndex = Math.max(prev - 1, 0);
                        setHasNavigated(true);
                        return newIndex;
                    });
                } else if (e.key === "Enter") {
                    if (selectedCategoryIndex === 0) {
                        handleCategorySelect(null);
                    } else {
                        handleCategorySelect(categories[selectedCategoryIndex - 1].name);
                    }
                    // Switch focus to nodes panel after selecting category
                    setFocusedPanel('nodes');
                    setSelectedNodeIndex(0);
                    setHasNavigated(true);
                }
            } else if (focusedPanel === 'nodes') {
                if (e.key === "ArrowDown") {
                    setSelectedNodeIndex((prev) => {
                        const newIndex = Math.min(prev + 1, filteredAvailableNodes.length - 1);
                        setHasNavigated(true);
                        return newIndex;
                    });
                } else if (e.key === "ArrowUp") {
                    setSelectedNodeIndex((prev) => {
                        const newIndex = Math.max(prev - 1, 0);
                        setHasNavigated(true);
                        return newIndex;
                    });
                } else if (e.key === "Enter" && selectedNodeIndex >= 0 && filteredAvailableNodes[selectedNodeIndex]) {
                    const nodeId = filteredAvailableNodes[selectedNodeIndex].id;
                    handleAddNodeAtPosition(nodeId, mouseX, mouseY);
                }
            }
            
            if (e.key === "Escape") {
                setShowAddingNode(false);
                setSearchPhrase("");
                resetSelectedNodeIndex();
                setSelectedCategory(null);
                setSelectedParentCategory(null);
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
        selectedCategoryIndex,
        categories,
        focusedPanel,
        setSelectedNodeIndex,
        resetSelectedNodeIndex,
        mouseX,
        mouseY,
        handleAddNodeAtPosition,
        handleCategorySelect,
        setShowAddingNode,
        setSearchPhrase,
        setSelectedCategory,
        setSelectedParentCategory
    ]);

    // Calculate total node count from hierarchical categories
    const totalNodeCount = hierarchicalCategories.reduce((sum, cat) => sum + cat.count, 0);

    // Only render portal if we're in the browser (client-side)
    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <>
            {showAddingNode && createPortal(
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-sky-50/30 dark:bg-black/50 backdrop-blur-sm z-[9998]"
                        onClick={() => setShowAddingNode(false)}
                    />
                    
                    {/* Modal */}
                    <div
                        ref={modalRef}
                        onWheel={(e) => e.stopPropagation()}
                        className="fixed p-4 bg-sky-100 dark:bg-black/90 dark:border-white/10 border-sky-500/50 rounded-lg shadow-2xl w-[800px] h-[480px] z-[9999] border"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: 'translateX(-50%) translateY(-50%)'
                        }}
                    >
                    <InputGroup className="mb-4">
                        <MagnifyingGlassIcon data-slot="icon" className="h-5 w-5 text-zinc-500" />
                        <Input
                            type="search"
                            placeholder={selectedCategory ? `Search in ${selectedCategory}...` : "Search all nodes..."}
                            value={searchPhrase}
                            onChange={(e) => setSearchPhrase(e.target.value)}
                            ref={inputRef}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                    </InputGroup>
                    
                    <div className="flex h-[calc(100%-80px)] gap-4 mt-4">
                        {/* Categories Panel */}
                        <div 
                            ref={categoriesRef}
                            className={`w-1/3 p-3 overflow-y-auto rounded-md transition-all ${
                                focusedPanel === 'categories' 
                                    ? 'bg-sky-50 dark:bg-zinc-800/50' 
                                    : ''
                            }`}
                        >
                            <div className={`text-xs font-semibold mb-3 uppercase tracking-wider transition-colors ${
                                focusedPanel === 'categories'
                                    ? 'text-sky-700 dark:text-sky-400'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}>
                                Categories
                            </div>
                            
                            {/* All Nodes option */}
                            <div
                                ref={el => { categoryItemRefs.current[0] = el; }}
                                onClick={() => {
                                    // Clear all selections to show all nodes
                                    handleCategorySelect(null);
                                    setSelectedParentCategory(null);
                                    setFocusedPanel('nodes');
                                }}
                                className={`cursor-pointer p-2 rounded-md flex items-center justify-between mb-1 transition-colors ${
                                    focusedPanel === 'categories' && selectedCategoryIndex === 0 && hasNavigated
                                        ? "bg-sky-200 text-sky-800 dark:bg-zinc-700 dark:text-white"
                                        : (selectedCategory === null && selectedParentCategory === null)
                                        ? "bg-sky-100 dark:bg-zinc-800"
                                        : "hover:bg-sky-100 dark:hover:bg-zinc-800"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FolderIcon className="h-4 w-4" />
                                    <span className="font-medium">All Nodes</span>
                                </div>
                                <span className="text-xs bg-sky-600 text-white dark:bg-zinc-600 px-2 py-0.5 rounded">
                                    {totalNodeCount}
                                </span>
                            </div>
                            
                            {/* Hierarchical Category list */}
                            {hierarchicalCategories.map((category, index) => (
                                <div key={category.name}>
                                    {/* Parent Category */}
                                    <div
                                        ref={el => { categoryItemRefs.current[index + 1] = el; }}
                                        onClick={() => {
                                            if (category.isFlat) {
                                                // Flat category - direct selection and filter
                                                handleCategorySelect(category.name);
                                                setFocusedPanel('nodes');
                                            } else {
                                                // Hierarchical category - toggle expansion and handle filtering
                                                toggleCategoryExpanded(category.name);

                                                if (!category.expanded) {
                                                    // Expanding: filter to this parent category
                                                    setSelectedParentCategory(category.name);
                                                    setSelectedCategory(null);
                                                } else {
                                                    // Collapsing: clear parent filter
                                                    setSelectedParentCategory(null);
                                                    setSelectedCategory(null);
                                                }
                                                setFocusedPanel('nodes');
                                            }
                                        }}
                                        className={`cursor-pointer p-2 rounded-md flex items-center justify-between mb-1 transition-colors ${
                                            focusedPanel === 'categories' && selectedCategoryIndex === index + 1 && hasNavigated
                                                ? "bg-sky-200 text-sky-800 dark:bg-zinc-700 dark:text-white"
                                                : selectedParentCategory === category.name
                                                ? "bg-sky-100 border-l-4 border-sky-500 dark:bg-zinc-800 dark:border-sky-400"
                                                : selectedCategory === category.name
                                                ? "bg-sky-100 dark:bg-zinc-800"
                                                : "hover:bg-sky-100 dark:hover:bg-zinc-800"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {!category.isFlat && (
                                                category.expanded
                                                    ? <ChevronDownIcon className="h-4 w-4 text-sky-600 dark:text-gray-400" />
                                                    : <ChevronRightIcon className="h-4 w-4 text-sky-600 dark:text-gray-400" />
                                            )}
                                            <span className="capitalize font-medium">{category.name}</span>
                                        </div>
                                        <span className="text-xs bg-sky-100 dark:bg-zinc-900 px-2 py-0.5 rounded">
                                            {category.count}
                                        </span>
                                    </div>

                                    {/* Child Categories (shown when expanded) */}
                                    {!category.isFlat && category.expanded && (
                                        <div className="ml-6 mb-2">
                                            {category.children.map((child) => (
                                                <div
                                                    key={child.originalCategory}
                                                    onClick={() => {
                                                        handleCategorySelect(child.originalCategory);
                                                        setFocusedPanel('nodes');
                                                    }}
                                                    className={`cursor-pointer p-2 rounded-md flex items-center justify-between mb-1 transition-colors text-sm ${
                                                        selectedCategory === child.originalCategory
                                                            ? "bg-sky-50 text-sky-700 dark:bg-zinc-700 dark:text-sky-300"
                                                            : "hover:bg-sky-50 text-sky-600 dark:hover:bg-zinc-700 dark:text-gray-400"
                                                    }`}
                                                >
                                                    <span className="capitalize">{child.name}</span>
                                                    <span className="text-xs bg-sky-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                        {child.count}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Nodes Panel */}
                        <div 
                            ref={nodesRef}
                            className={`flex-1 p-3 overflow-y-auto rounded-md transition-all ${
                                focusedPanel === 'nodes' 
                                    ? 'bg-sky-50 dark:bg-zinc-800/50' 
                                    : ''
                            }`}
                        >
                            <div className={`text-xs font-semibold mb-3 uppercase tracking-wider transition-colors ${
                                focusedPanel === 'nodes'
                                    ? 'text-sky-700 dark:text-sky-400'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}>
                                {selectedCategory
                                    ? `${selectedCategory.replace('_', ' > ')} Nodes`
                                    : selectedParentCategory
                                    ? `${selectedParentCategory} Nodes`
                                    : 'All Nodes'}
                                {searchPhrase && ` (filtered)`}
                            </div>
                            
                            {filteredAvailableNodes.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                                    {searchPhrase ? 'No nodes found matching your search' : 'No nodes in this category'}
                                </div>
                            ) : (
                                filteredAvailableNodes.map((n, index) => (
                                    <div
                                        key={'add-' + n.id}
                                        ref={el => { nodeItemRefs.current[index] = el; }}
                                        onClick={(e) => handleAddNodeAtPosition(n.id, e.clientX, e.clientY)}
                                        className={`cursor-pointer p-2 rounded-md mb-1 transition-colors ${
                                            index === selectedNodeIndex && focusedPanel === 'nodes' && (hasNavigated || searchPhrase)
                                                ? "bg-sky-200 text-sky-800 dark:bg-zinc-700 dark:text-white"
                                                : "hover:bg-sky-100 text-sky-800 dark:hover:bg-zinc-800 dark:text-gray-300"
                                        }`}
                                    >
                                        {!selectedCategory && (
                                            <>
                                                <span className="text-xs text-sky-600 dark:text-gray-500">{n.category}</span>
                                                <ChevronRightIcon className="h-4 inline text-sky-600 dark:text-gray-500 mx-1" />
                                            </>
                                        )}
                                        <span className="font-medium">{n.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    {/* Keyboard hints */}
                    <div className="absolute bottom-2 left-4 right-4 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>↑↓ Navigate • ←→ Switch panels • Enter Select • Esc Close</span>
                        <span>Type to search</span>
                    </div>
                </div>
                </>,
                document.body
            )}
        </>
    );
};

export default AddNode;