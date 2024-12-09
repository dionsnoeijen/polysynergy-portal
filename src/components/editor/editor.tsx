import React, { useRef, useEffect, useCallback } from 'react';
import { useZoom } from "@/hooks/editor/useZoom";
import { usePan } from "@/hooks/editor/usePan";
import { Grid } from "@/components/editor/grid";
import Node from "@/components/editor/nodes/node";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import Connection from "@/components/editor/nodes/connection";
import { useConnectionsStore } from "@/stores/connectionsStore";
import { useDeselectOnClickOutside } from "@/hooks/editor/nodes/useDeselectOnClickOutside";
import BoxSelect from "@/components/editor/box-select";
import {useKeyBindings} from "@/hooks/editor/useKeyBindings";
import useGroupsStore from "@/stores/groupStore";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import OpenGroup from "@/components/editor/nodes/open-group";
import DeleteDialog from "@/components/editor/nodes/delete-dialog";
import { useDeleteNode } from "@/hooks/editor/nodes/useDeleteNode";

export default function Editor() {
    const contentRef = useRef<HTMLDivElement>(null);

    const {
        zoomFactor,
        setEditorPosition,
        isDragging,
        panPosition,
        selectedNodes,
        deleteNodesDialogOpen,
        setDeleteNodesDialogOpen
    } = useEditorStore();
    const { getNodesToRender } = useNodesStore();
    const { connections } = useConnectionsStore();
    const { getOpenGroups } = useGroupsStore();

    const { handleDeleteSelectedNodes } = useDeleteNode();
    const { handleZoom } = useZoom();
    const { handlePanMouseDown, handleMouseMove, handleMouseUp } = usePan();
    const { handleEditorMouseDown } = useDeselectOnClickOutside();
    const { createGroup } = useGrouping();

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
        'ctrl+shift+g': () => {
            console.log('DEGROUP');
        },
        'ctrl+g': () => {
            createGroup();
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
            ref={contentRef}
        >
            <Grid zoomFactor={zoomFactor} position={panPosition} />

            <div
                style={{ transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomFactor})` }}
                className="absolute top-0 left-0 w-0 h-0 overflow-visible"
            >
                {getOpenGroups().map((group) => (
                    <OpenGroup key={group.id} group={group} />
                ))}

                {getNodesToRender().map((node) => (
                    <Node key={node.id} node={node} />
                ))}

                {connections
                    .filter((connection) => !connection.hidden)
                    .map((connection) => (
                        <Connection
                            key={connection.id}
                            connection={connection}
                        />
                    ))}
            </div>

            <BoxSelect />

            <DeleteDialog
                isOpen={deleteNodesDialogOpen}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                itemCount={selectedNodes.length}
            />
        </div>
    );
}
