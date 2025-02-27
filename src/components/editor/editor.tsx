'use client';

import React, {useRef, useEffect, useCallback, useMemo} from 'react';
import {useZoom} from "@/hooks/editor/useZoom";
import {usePan} from "@/hooks/editor/usePan";
import {Grid} from "@/components/editor/grid";
import {useKeyBindings} from "@/hooks/editor/useKeyBindings";
import {useDeselectOnClickOutside} from "@/hooks/editor/nodes/useDeselectOnClickOutside";
import {useDeleteNode} from "@/hooks/editor/nodes/useDeleteNode";
import {updateConnectionsDirectly} from "@/utils/updateConnectionsDirectly";
import useEditorStore from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useNodesStore from "@/stores/nodesStore";
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
import {useAutoAddRouteNodes} from "@/hooks/editor/useAutoAddRouteNodes";
import {useAutoAddScheduleNodes} from "@/hooks/editor/useAutoAddScheduleNodes";
import {useAutoUpdateScheduleNodes} from "@/hooks/editor/useAutoUpdateScheduleNodes";
import {useAutoUpdateRouteNodes} from "@/hooks/editor/useAutoUpdateRouteNodes";
import useMockStore from "@/stores/mockStore";

export default function Editor() {
    const contentRef = useRef<HTMLDivElement>(null);
    const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const zoomFactor = useEditorStore((state) => state.zoomFactor);
    const setEditorPosition = useEditorStore((state) => state.setEditorPosition);
    const isDragging = useEditorStore((state) => state.isDragging);
    const panPosition = useEditorStore((state) => state.panPosition);
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const deleteNodesDialogOpen = useEditorStore((state) => state.deleteNodesDialogOpen);
    const setDeleteNodesDialogOpen = useEditorStore((state) => state.setDeleteNodesDialogOpen);
    const setShowAddingNode = useEditorStore((state) => state.setShowAddingNode);
    const openContextMenu = useEditorStore((state) => state.openContextMenu);
    const copySelectedNodes = useEditorStore((state) => state.copySelectedNodes);
    const pasteNodes = useEditorStore((state) => state.pasteNodes);
    const isPasting = useEditorStore((state) => state.isPasting);

    const getNodesToRender = useNodesStore((state) => state.getNodesToRender);
    const getOpenGroups = useNodesStore((state) => state.getOpenGroups);
    const nodes = useNodesStore((state) => state.nodes);

    const connections = useConnectionsStore((state) => state.connections);
    const clearMockStore = useMockStore((state) => state.clearMockStore);

    const {handleDeleteSelectedNodes} = useDeleteNode();
    const {handleZoom} = useZoom();
    const {handlePanMouseDown, handleMouseMove, handleMouseUp} = usePan();
    const {handleEditorMouseDown} = useDeselectOnClickOutside();
    const {createGroup} = useGrouping();
    const {startDraggingAfterPaste} = useDraggable();

    useGlobalStoreListenersWithImmediateSave();
    useAutoAddRouteNodes();
    useAutoUpdateRouteNodes();
    useAutoAddScheduleNodes();
    useAutoUpdateScheduleNodes();

    const nodesToRender = useMemo(() => getNodesToRender(), [getNodesToRender, nodes]);

    useEffect(() => {
        updateConnectionsDirectly(connections);
        clearMockStore();
    }, [nodesToRender]);

    const updateEditorPosition = useCallback(() => {
        if (contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect();
            setEditorPosition({ x: rect.left, y: rect.top });
        }
    }, [setEditorPosition]);

    useEffect(() => {
        updateEditorPosition();
        window.addEventListener('resize', updateEditorPosition);
        return () => window.removeEventListener('resize', updateEditorPosition);
    }, [setEditorPosition, updateEditorPosition]);

    const handleMousePositionUpdate = useCallback((e: React.MouseEvent) => {
        mousePositionRef.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleWheel = (e: React.WheelEvent) => {
        if (!contentRef.current) return;
        handleZoom(e, contentRef.current.getBoundingClientRect());
    };

    useKeyBindings({
        'delete': () => {
            if (selectedNodes.length > 0) {
                setDeleteNodesDialogOpen(true);
            }
        },
        'x': () => {
            if (selectedNodes.length > 0) {
                setDeleteNodesDialogOpen(true);
            }
        },
        'backspace': () => {
            if (selectedNodes.length > 0) {
                setDeleteNodesDialogOpen(true);
            }
        },
        'shift+a': () => {
            setShowAddingNode(true);
        },
        'ctrl+shift+g': () => {
            console.log('DEGROUP');
        },
        'ctrl+g': () => {
            createGroup();
        },
        'ctrl+d': () => {
            console.log('Duplicate selected nodes');
        },
        'ctrl+x': () => {
            console.log('Cut selected nodes');
        },
        'ctrl+c': () => {
            copySelectedNodes();
        },
        'ctrl+v': () => {
            const pastedNodeIds = pasteNodes();
            startDraggingAfterPaste(
                mousePositionRef.current.x,
                mousePositionRef.current.y,
                pastedNodeIds
            );
        },
        'ctrl+z': () => {
            console.log('Undo last action');
        },
        'ctrl+shift+z': () => {
            console.log('Redo last action');
        }
    });

    const handleConfirmDelete = () => {
        handleDeleteSelectedNodes(selectedNodes);
        setDeleteNodesDialogOpen(false);
    };

    const handleCancelDelete = () => {
        setDeleteNodesDialogOpen(false);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
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

    return (
        <div
            data-type="editor"
            className="relative w-full h-full overflow-hidden rounded-md"
            onWheel={handleWheel}
            onMouseDown={(e) => {
                handleEditorMouseDown();
                handlePanMouseDown(e);
            }}
            onMouseMove={(e) => {
                handleMousePositionUpdate(e);
                if (isDragging || isPasting) return;
                handleMouseMove(e);
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
            ref={contentRef}
        >
            <Grid zoomFactor={zoomFactor} position={panPosition} />

            <div
                style={{ transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomFactor})` }}
                className="absolute top-0 left-0 w-0 h-0 overflow-visible"
            >
                <PointZeroIndicator />

                {getOpenGroups().map((group) => (
                    <OpenGroup key={group.id} node={group} />
                ))}

                {nodesToRender.map((node) => (
                    <Node key={node.id} node={node} />
                ))}

                {connections && connections
                    .filter((connection) => !connection.hidden)
                    .map((connection) => (
                        <Connection
                            key={connection.id}
                            connection={connection}
                        />
                    ))}
            </div>

            <BoxSelect />
            <AddNode />

            <DeleteDialog
                isOpen={deleteNodesDialogOpen}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                selectedNodes={selectedNodes}
            />
        </div>
    );
}
