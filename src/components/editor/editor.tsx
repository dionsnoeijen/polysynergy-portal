'use client';

import React, {useRef, useEffect, useCallback, useMemo} from 'react';
import { useZoom } from "@/hooks/editor/useZoom";
import { usePan } from "@/hooks/editor/usePan";
import { Grid } from "@/components/editor/grid";
import { useKeyBindings } from "@/hooks/editor/useKeyBindings";
import useEditorStore from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";
import { useDeselectOnClickOutside } from "@/hooks/editor/nodes/useDeselectOnClickOutside";
import { useDeleteNode } from "@/hooks/editor/nodes/useDeleteNode";
import Node from "@/components/editor/nodes/node";
import useNodesStore from "@/stores/nodesStore";
import Connection from "@/components/editor/nodes/connection";
import BoxSelect from "@/components/editor/box-select";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import OpenGroup from "@/components/editor/nodes/open-group";
import DeleteDialog from "@/components/editor/nodes/delete-dialog";
import AddNode from "@/components/editor/add-node";
import useGlobalStoreListenersWithImmediateSave from "@/hooks/editor/nodes/useGlobalStoresListener";
import PointZeroIndicator from "@/components/editor/point-zero-indicator";
import {updateConnectionsDirectly} from "@/utils/updateConnectionsDirectly";

export default function Editor() {
    const contentRef = useRef<HTMLDivElement>(null);

    const {
        zoomFactor,
        setEditorPosition,
        isDragging,
        panPosition,
        selectedNodes,
        deleteNodesDialogOpen,
        setDeleteNodesDialogOpen,
        setShowAddingNode,
        openContextMenu
    } = useEditorStore();
    const { getNodesToRender, getOpenGroups, nodes } = useNodesStore();
    const { connections } = useConnectionsStore();

    const { handleDeleteSelectedNodes } = useDeleteNode();
    const { handleZoom } = useZoom();
    const { handlePanMouseDown, handleMouseMove, handleMouseUp } = usePan();
    const { handleEditorMouseDown } = useDeselectOnClickOutside();
    const { createGroup } = useGrouping();

    useGlobalStoreListenersWithImmediateSave();

    const nodesToRender = useMemo(() => getNodesToRender(), [getNodesToRender, nodes]);

    useEffect(() => {
        updateConnectionsDirectly(connections);
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
            console.log('Copy selected nodes');
        },
        'ctrl+v': () => {
            console.log('Paste nodes');
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
    }

    return (
        <div
            data-type="editor"
            className="relative w-full h-full overflow-hidden rounded-md"
            onWheel={handleWheel}
            onMouseDown={(e) => {
                handleEditorMouseDown();
                handlePanMouseDown(e);
            }}
            onMouseMove={isDragging ? undefined : handleMouseMove}
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
                itemCount={selectedNodes.length}
            />
        </div>
    );
}
