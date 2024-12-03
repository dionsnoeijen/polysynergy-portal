import React, { useRef, useEffect, useCallback, useState } from 'react';
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
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from "@/components/dialog";
import { Button } from "@/components/button";

export default function Editor() {
    const contentRef = useRef<HTMLDivElement>(null);

    const {
        zoomFactor,
        setEditorPosition,
        isDragging,
        panPosition,
        selectedNodes
    } = useEditorStore();
    const { nodes, removeNode } = useNodesStore();
    const { connections, removeConnections, findInConnectionsByNodeId, findOutConnectionsByNodeId } = useConnectionsStore();
    const { getOpenGroups, getClosedGroups } = useGroupsStore();

    const { handleZoom } = useZoom();
    const { handlePanMouseDown, handleMouseMove, handleMouseUp } = usePan();
    const { handleEditorMouseDown } = useDeselectOnClickOutside();
    const { createGroup } = useGrouping();

    const [isDeleteNodesDialogOpen, setIsDeleteNodesDialogOpen] = useState(false);

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
                setIsDeleteNodesDialogOpen(true);
            }
        },
        'x': () => {
            if (selectedNodes.length > 0) {
                setIsDeleteNodesDialogOpen(true);
            }
        },
        'backspace': () => {
            if (selectedNodes.length > 0) {
                setIsDeleteNodesDialogOpen(true);
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

    const closedGroupNodeIds = useCallback(() => {
        const closedGroups = getClosedGroups();
        return closedGroups.flatMap((group) => group.nodes);
    }, [getClosedGroups]);

    const nodesToRender = nodes.filter(
        (node) => !closedGroupNodeIds().includes(node.id)
    );

    const handleConfirmDelete = () => {
        selectedNodes.map((nodeId) => {
            const inConnections = findInConnectionsByNodeId(nodeId);
            const outConnections = findOutConnectionsByNodeId(nodeId);
            const connections = [...inConnections, ...outConnections];
            removeConnections(connections);
            removeNode(nodeId);
        });
        setIsDeleteNodesDialogOpen(false);
    };

    const handleCancelDelete = () => {
        setIsDeleteNodesDialogOpen(false);
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

                {nodesToRender.map((node) => (
                    <Node
                        key={node.id}
                        node={node}
                    />
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

            <Dialog size="md" className={'rounded-sm'} open={isDeleteNodesDialogOpen} onClose={handleCancelDelete}>
                <DialogTitle>Confirm Delete Node{selectedNodes.length > 1 ? 's' : ''}</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete the node{selectedNodes.length > 1 ? 's' : ''}?
                </DialogDescription>
                <DialogBody>
                    {/* Additional content can go here if needed */}
                </DialogBody>
                <DialogActions>
                    <Button outline onClick={handleCancelDelete}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleConfirmDelete}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
