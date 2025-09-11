'use client';

import React, { useRef } from 'react';

import Grid from "@/components/editor/grid";
import Node from "@/components/editor/nodes/node";
import Connection from "@/components/editor/nodes/connection";
import BoxSelect from "@/components/editor/box-select";
import OpenGroup from "@/components/editor/nodes/open-group";
import DeleteDialog from "@/components/editor/nodes/delete-dialog";
import AddNode from "@/components/editor/add-node";
import PointZeroIndicator from "@/components/editor/point-zero-indicator";
import EditorIntroTour from "@/components/guidedtour/editor-intro-tour";
import IsExecuting from "@/components/editor/is-executing";

import { useEditorTransform } from "@/hooks/editor/useEditorTransform";
import { useEditorEventHandlers } from "@/hooks/editor/useEditorEventHandlers";
import { useEditorKeyBindings } from "@/hooks/editor/useEditorKeyBindings";
import { useEditorState } from "@/hooks/editor/useEditorState";
import { useAutoUpdateScheduleNodes } from "@/hooks/editor/useAutoUpdateScheduleNodes";
import { useAutoUpdateRouteNodes } from "@/hooks/editor/useAutoUpdateRouteNodes";
import useGlobalStoreListenersWithImmediateSave from "@/hooks/editor/nodes/useGlobalStoresListener";
import { useAutoFitNodes } from "@/hooks/editor/nodes/useAutoFitNodes";
import { useExecutionTabSwitcher } from "@/hooks/editor/useExecutionTabSwitcher";
import { EditorMode } from "@/types/types";
import Minimap from "@/components/editor/minimap";

export default function Editor() {
    const contentRef = useRef<HTMLDivElement>(null);

    // Custom hooks for separated concerns
    const { transformLayerRef } = useEditorTransform();
    const {
        isMouseDown,
        handleMouseDownDispatch,
        handleMouseMoveDispatch,
        handleMouseUpDispatch,
        handleMouseLeaveDispatch,
        handleContextMenu
    } = useEditorEventHandlers(contentRef);
    const { handleConfirmDelete, handleCancelDelete } = useEditorKeyBindings();
    const {
        // isInteracted,
        // setIsInteracted,
        selectedNodes,
        deleteNodesDialogOpen,
        // isDraft,
        editorMode,
        activeVersionId,
        nodesToRender,
        openGroups,
        isExecuting,
        chatMode,
        connections,
        connectionStatus,
        containerClass
    } = useEditorState(isMouseDown);

    // Global listeners and auto-updates
    useGlobalStoreListenersWithImmediateSave();
    useAutoUpdateRouteNodes();
    useAutoUpdateScheduleNodes();
    useAutoFitNodes(contentRef, nodesToRender, 40, activeVersionId);
    useExecutionTabSwitcher();

    return (
        <div
            data-type="editor"
            className={containerClass}
            onMouseDown={handleMouseDownDispatch}
            onMouseMove={handleMouseMoveDispatch}
            onMouseUp={handleMouseUpDispatch}
            onMouseLeave={handleMouseLeaveDispatch}
            onContextMenu={handleContextMenu}
            ref={contentRef}
        >
            <EditorIntroTour/>
            
            {/* Execution Glow - Pulserende Rand */}
            {isExecuting && (
                <div
                    className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none
                               bg-transparent
                               draft-executing"
                />
            )}

            {/* Chat Mode Glow - Blue Pulsing Border */}
            {chatMode && !isExecuting && (
                <div
                    className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none
                               bg-transparent
                               chat-mode"
                />
            )}

            <IsExecuting connectionStatus={connectionStatus} />

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

                {openGroups.map((group) => (
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
            
            {/* Minimap in top-right corner */}
            <Minimap />
        </div>
    );
}
