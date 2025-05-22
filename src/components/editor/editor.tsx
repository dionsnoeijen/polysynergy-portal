'use client';

import React, {useRef, useEffect, useCallback, useMemo, useState} from 'react';

import useEditorStore, {EditorState} from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";

import {useZoom} from "@/hooks/editor/useZoom";
import {usePan} from "@/hooks/editor/usePan";
import {useAutoAddRouteNodes} from "@/hooks/editor/useAutoAddRouteNodes";
import {useKeyBindings} from "@/hooks/editor/useKeyBindings";
import {useDeselectOnClickOutside} from "@/hooks/editor/nodes/useDeselectOnClickOutside";
import {useDeleteNode} from "@/hooks/editor/nodes/useDeleteNode";
import {updateConnectionsDirectly} from "@/utils/updateConnectionsDirectly";
import {useAutoAddScheduleNodes} from "@/hooks/editor/useAutoAddScheduleNodes";
import {useAutoUpdateScheduleNodes} from "@/hooks/editor/useAutoUpdateScheduleNodes";
import {useAutoUpdateRouteNodes} from "@/hooks/editor/useAutoUpdateRouteNodes";

import Grid from "@/components/editor/grid";
import Node from "@/components/editor/nodes/node";
import Connection from "@/components/editor/nodes/connection";
import BoxSelect from "@/components/editor/box-select";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import OpenGroup from "@/components/editor/nodes/open-group";
import DeleteDialog from "@/components/editor/nodes/delete-dialog";
import AddNode from "@/components/editor/add-node";
import useGlobalStoreListenersWithImmediateSave from "@/hooks/editor/nodes/useGlobalStoresListener";
import PointZeroIndicator from "@/components/editor/point-zero-indicator";
import useDraggable from "@/hooks/editor/nodes/useDraggable";
import clsx from "clsx";
import {EditorMode} from "@/types/types";
import {useAutoFitNodes} from "@/hooks/editor/nodes/useAutoFitNodes";
import {useExecutionGlowListener} from "@/hooks/editor/nodes/useExecutionGlowListener";
import {useExecutionStateListener} from "@/hooks/editor/nodes/useExecutionStateListener";

export default function Editor() {
    const contentRef = useRef<HTMLDivElement>(null);
    const mousePositionRef = useRef<{ x: number; y: number }>({x: 0, y: 0});
    const transformLayerRef = useRef<HTMLDivElement>(null);

    const setEditorPosition = useEditorStore((state) => state.setEditorPosition);
    const isDragging = useEditorStore((state) => state.isDragging);
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const deleteNodesDialogOpen = useEditorStore((state) => state.deleteNodesDialogOpen);
    const setDeleteNodesDialogOpen = useEditorStore((state) => state.setDeleteNodesDialogOpen);
    const setShowAddingNode = useEditorStore((state) => state.setShowAddingNode);
    const openContextMenu = useEditorStore((state) => state.openContextMenu);
    const copySelectedNodes = useEditorStore((state) => state.copySelectedNodes);
    const nodeToMoveToGroupId = useEditorStore((state) => state.nodeToMoveToGroupId);
    const pasteNodes = useEditorStore((state) => state.pasteNodes);
    const isPasting = useEditorStore((state) => state.isPasting);
    const isDraft = useEditorStore((state) => state.isDraft);
    const editorMode = useEditorStore((state) => state.editorMode);
    const isFormOpen = useEditorStore((state) => state.isFormOpen);
    const activeVersionId = useEditorStore(state => state.activeVersionId);
    const isExecuting = useEditorStore(state => state.isExecuting);

    const getNodesToRender = useNodesStore((state) => state.getNodesToRender);
    const getOpenGroups = useNodesStore((state) => state.getOpenGroups);

    const nodes = useNodesStore((state) => state.nodes);

    const connections = useConnectionsStore((state) => state.connections);
    const {handleDeleteSelectedNodes} = useDeleteNode();
    const {handleZoom} = useZoom();
    const {handlePanMouseDown, handleMouseMove, handleMouseUp} = usePan();
    const {handleEditorMouseDown} = useDeselectOnClickOutside();
    const {createGroup} = useGrouping();

    const {startDraggingAfterPaste} = useDraggable();

    // eslint-disable-next-line
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [isInteracted, setIsInteracted] = useState(false);

    useGlobalStoreListenersWithImmediateSave();
    useAutoAddRouteNodes();
    useAutoUpdateRouteNodes();
    useAutoAddScheduleNodes();
    useAutoUpdateScheduleNodes();

    // eslint-disable-next-line
    const nodesToRender = useMemo(() => getNodesToRender(), [getNodesToRender, nodes]);

    useEffect(() => {
        updateConnectionsDirectly(connections);
        // eslint-disable-next-line
    }, [nodesToRender]);

    const updateEditorPosition = useCallback(() => {
        if (contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect();
            setEditorPosition({x: rect.left, y: rect.top});
        }
    }, [setEditorPosition]);

    useEffect(() => {
        updateEditorPosition();
        window.addEventListener('resize', updateEditorPosition);
        return () => window.removeEventListener('resize', updateEditorPosition);
    }, [setEditorPosition, updateEditorPosition]);

    const handleMousePositionUpdate = useCallback((e: React.MouseEvent) => {
        mousePositionRef.current = {x: e.clientX, y: e.clientY};
    }, []);

    useKeyBindings({
        'delete': {
            handler: () => {
                if (selectedNodes.length > 0) setDeleteNodesDialogOpen(true);
            },
            condition: () => selectedNodes.length > 0
        },
        'x': {
            handler: () => {
                if (selectedNodes.length > 0) setDeleteNodesDialogOpen(true);
            },
            condition: () => selectedNodes.length > 0
        },
        'backspace': {
            handler: () => {
                if (selectedNodes.length > 0) setDeleteNodesDialogOpen(true);
            },
            condition: () => selectedNodes.length > 0
        },
        'a': {
            handler: () => setShowAddingNode(true),
        },
        'shift+a': {
            handler: () => setShowAddingNode(true),
        },
        'ctrl+shift+g': {
            handler: () => console.log('DEGROUP'),
            condition: () => selectedNodes.length > 0
        },
        'ctrl+g': {
            handler: () => createGroup(),
            condition: () => selectedNodes.length > 0
        },
        'ctrl+d': {
            handler: () => console.log('Duplicate selected nodes'),
            condition: () => selectedNodes.length > 0
        },
        'ctrl+x': {
            handler: () => console.log('Cut selected nodes'),
            condition: () => selectedNodes.length > 0
        },
        'ctrl+c': {
            handler: () => copySelectedNodes(),
            condition: () => selectedNodes.length > 0
        },
        'ctrl+v': {
            handler: () => {
                const pastedNodeIds = pasteNodes();
                startDraggingAfterPaste(pastedNodeIds);
            },
            condition: () => true // of bijvoorbeeld `editorMode === EditorMode.Select`
        }
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const tag = target.tagName.toLowerCase();
            const isTextInput = ['input', 'textarea'].includes(tag) || target.isContentEditable;

            if (isTextInput) return;

            if (e.code === 'Space') {
                e.preventDefault();
                setIsSpacePressed(true);
                useEditorStore.getState().setEditorModeWithMemory(EditorMode.Pan);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
                const {previousEditorMode} = useEditorStore.getState();
                useEditorStore.getState().setEditorMode(previousEditorMode);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        const handleWheelGlobal = (e: WheelEvent) => {
            const contentEl = contentRef.current;
            if (!contentEl) return;
            const hoveredEl = document.elementFromPoint(e.clientX, e.clientY);
            if (hoveredEl?.closest('[data-type="editor"], [data-type="drawing-layer"]')) {
                e.preventDefault();
                handleZoom(e as unknown as React.WheelEvent, contentEl.getBoundingClientRect());
            }
        };
        window.addEventListener('wheel', handleWheelGlobal, {passive: false});
        return () => window.removeEventListener('wheel', handleWheelGlobal);
    }, [handleZoom]);

    const handleConfirmDelete = () => {
        handleDeleteSelectedNodes(selectedNodes);
        setDeleteNodesDialogOpen(false);
    };

    const handleCancelDelete = () => {
        setDeleteNodesDialogOpen(false);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openContextMenu(
            e.clientX,
            e.clientY,
            [
                {
                    label: "Add Node",
                    action: () => setShowAddingNode(true),
                }
            ]
        );
    };

    useEffect(() => {
        const applyTransform = (state: EditorState) => {
            const pan = state.getPanPositionForVersion();
            const zoom = state.getZoomFactorForVersion();

            if (transformLayerRef.current) {
                transformLayerRef.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
            }
        };

        applyTransform(useEditorStore.getState());

        const unsubscribe = useEditorStore.subscribe((state, prevState) => {
            const vid = state.activeVersionId;
            if (!vid) return;

            const pan = state.panPositionsByVersion[vid];
            const prevPan = prevState.panPositionsByVersion[vid];
            const zoom = state.zoomFactorByVersion[vid];
            const prevZoom = prevState.zoomFactorByVersion[vid];

            if (
                pan?.x !== prevPan?.x ||
                pan?.y !== prevPan?.y ||
                zoom !== prevZoom
            ) {
                applyTransform(state);
            }
        });

        return () => unsubscribe();
    }, []);

    useAutoFitNodes(contentRef, nodesToRender, 40, activeVersionId);
    useExecutionGlowListener(activeVersionId as string);
    useExecutionStateListener(activeVersionId as string);

    return (
        <div
            data-type="editor"
            className={clsx(
                "relative w-full h-full rounded-md",
                isFormOpen() ? 'overflow-scroll' : 'overflow-hidden',
                nodeToMoveToGroupId ? "cursor-crosshair" :
                    editorMode === EditorMode.Pan && isMouseDown ? "cursor-grabbing" :
                        editorMode === EditorMode.Pan ? "cursor-grab" :
                            "cursor-default"
            )}
            onMouseDown={(e) => {
                setIsMouseDown(true);
                switch (editorMode) {
                    case EditorMode.Pan:
                        handlePanMouseDown(e);
                        break;
                    case EditorMode.Select:
                        handleEditorMouseDown();
                        break;
                    case EditorMode.BoxSelect:
                        // eventueel BoxSelect-handling
                        break;
                    case EditorMode.Draw:
                        // laat DrawingLayer dit zelf doen, pointer-events aan etc.
                        break;
                }
            }}
            onMouseMove={(e) => {
                handleMousePositionUpdate(e);
                if (isDragging || isPasting) return;
                handleMouseMove(e);
            }}
            onMouseUp={() => {
                setIsMouseDown(false);
                handleMouseUp();
            }}
            onMouseLeave={() => {
                setIsMouseDown(false);
                handleMouseUp();
            }}
            onContextMenu={isDraft ? handleContextMenu : () => {
            }}
            ref={contentRef}
        >
            {!isDraft && (
                <div
                    className={`absolute top-0 left-0 w-full h-full z-20 pointer-events-auto 
                        shadow-[inset_0_0_15px_5px_rgba(34,197,94,0.7)]
                        ${isInteracted ? "bg-transparent" : "bg-green-500/40"}`}
                    onClick={() => setIsInteracted(true)}
                >
                    {!isInteracted && (
                        <div className="absolute inset-0 flex items-center justify-center z-50 text-white text-lg font-semibold text-center px-4
                            shadow-lg shadow-black/50"
                        >
                            This version is live and cannot be edited. Create a new draft to make changes.
                        </div>
                    )}
                </div>
            )}

            {isExecuting && (
                <div className="absolute top-0 left-0 w-full z-40 pointer-events-none">
                    <div className="mx-auto max-w-2xl mt-4 bg-zinc-800/80 border border-white/25 dark:bg-zinc-800/80 backdrop-blur-sm
                                    rounded-md py-2 px-4 flex items-center justify-center gap-3 text-white shadow-md">
                        <div className="animate-spin h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full" />
                        <span className="text-sm font-medium">
                            {typeof isExecuting === 'string' ? isExecuting : 'Executing...'}
                        </span>
                    </div>
                </div>
            )}

            <Grid/>

            <div
                ref={transformLayerRef}
                style={{
                    willChange: 'transform',
                    transformOrigin: '0 0',
                    width: '1px',
                    height: '1px'
                }}
                className="absolute inset-0 overflow-visible"
            >
                <PointZeroIndicator/>

                {getOpenGroups().map((group) => (
                    <OpenGroup key={`group-${group.id}`} node={group}/>
                ))}

                {nodesToRender.map((node) => (
                    <Node key={`node-${node.id}`} node={node}/>
                ))}

                {connections && connections
                    .filter((connection) => (!connection.hidden && !connection.temp))
                    .map((connection) => (
                        <Connection
                            key={`connection-${connection.id}`}
                            connection={connection}
                        />
                    ))}
            </div>

            {editorMode === EditorMode.BoxSelect && <BoxSelect/>}
            <AddNode/>

            <DeleteDialog
                isOpen={deleteNodesDialogOpen}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                selectedNodes={selectedNodes}
            />
        </div>
    );
}
