import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import {Node} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import ConnectorGroup from "@/components/editor/nodes/connector-group";
import ClosedGroup from "@/components/editor/nodes/closed-group";

import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from "@/components/dialog";
import { Button } from "@/components/button";
import { MARGIN } from "@/utils/constants";
import { getNodeBoundsFromDOM } from "@/utils/positionUtils";

type GroupProps = { node: Node };

const OpenGroup: React.FC<GroupProps> = ({node}): null | React.ReactElement => {
    const openContextMenu = useEditorStore((state) => state.openContextMenu);
    const setSelectedNodes = useEditorStore((state) => state.setSelectedNodes);
    const isDragging = useEditorStore((state) => state.isDragging);
    const zoomFactor = useEditorStore((state) => state.zoomFactor);

    const {closeGroup, dissolveGroup} = useGrouping();
    const connections = useConnectionsStore((state) => state.connections);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tick, setTick] = useState(0);
    const [bounds, setBounds] = useState({minX: 0, minY: 0, maxX: 0, maxY: 0});

    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (isDragging) {
            const loop = () => {
                setTick((t) => t + 1);
                rafRef.current = requestAnimationFrame(loop);
            };
            rafRef.current = requestAnimationFrame(loop);
        } else {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        }
    // eslint-disable-next-line
    }, [isDragging]);

    useEffect(() => {
        const frameId = requestAnimationFrame(() => {
            if (!node.group || !node.group.nodes) return;
            const {minX, minY, maxX, maxY, foundAny} = getNodeBoundsFromDOM(node.group.nodes);
            if (!foundAny) {
                requestAnimationFrame(() => {
                    setTick((t) => t + 1);
                });
            } else {
                setBounds({minX, minY, maxX, maxY});
            }
        });

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [tick, node?.group]);

    useLayoutEffect(() => {
        const closedGroupNodeEl = document.querySelector(`[data-node-id="mirror-${node.id}"][data-type="closed-group"]`) as HTMLElement;
        if (!closedGroupNodeEl) return;

        const boundingRect = closedGroupNodeEl.getBoundingClientRect();
        const x = bounds.minX - (MARGIN + (boundingRect.width / zoomFactor)) - 45;
        const y = bounds.minY - MARGIN;

        closedGroupNodeEl.style.left = `${x}px`;
        closedGroupNodeEl.style.top = `${y}px`;
    // eslint-disable-next-line
    }, [bounds, node.id, connections]);

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openContextMenu(
            e.clientX,
            e.clientY,
            [
                {
                    label: "Close Group",
                    action: () => {
                        closeGroup(node.id);
                    }
                },
                {
                    label: "Dissolve Group",
                    action: () => {
                        setSelectedNodes([]);
                        setIsDialogOpen(true);
                    },
                },
            ]
        );
    };

    const handleConfirmDissolve = () => {
        dissolveGroup(node.id);
        setIsDialogOpen(false);
    };

    const handleCancelDissolve = () => {
        setIsDialogOpen(false);
    };

    useEffect(() => {
        if (!isDialogOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                handleCancelDissolve();
            }
            if (event.key === "Escape") {
                handleCancelDissolve();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isDialogOpen]);

    if (!node.group) return null;

    return (
        <>
            {!node.group.isHidden && (
                <ClosedGroup node={node} isMirror={true}/>
            )}
            <div
                data-type="open-group"
                onContextMenu={handleContextMenu}
                onDoubleClick={() => !node.group?.isHidden && closeGroup(node.id)}
                className={`
                    ${(node.service && node.service.id) ? 
                        'border-purple-500 dark:border-purple-500 bg-purple-500 dark:bg-purple-500/20' : 
                        'border-sky-500 dark:border-white bg-sky-500 dark:bg-slate-500/20'}
                    absolute border rounded-md bg-opacity-25
                    ${node.group.isHidden ? 'z-1 select-none opacity-30' : 'z-10'}
                `}
                title={node.id}
                style={{
                    left: bounds.minX - MARGIN,
                    top: bounds.minY - MARGIN,
                    width: width + (MARGIN * 2),
                    height: height + (MARGIN * 2),
                }}
            >
                <ConnectorGroup in groupId={node.id}/>
                <ConnectorGroup out groupId={node.id}/>
            </div>

            <Dialog size="md" className={'rounded-sm'} open={isDialogOpen} onClose={handleCancelDissolve}>
                <DialogTitle>Confirm Dissolve Group</DialogTitle>
                <DialogDescription>
                    Are you sure you want to dissolve this group? This action cannot be undone.
                </DialogDescription>
                <DialogBody>
                </DialogBody>
                <DialogActions>
                    <Button outline onClick={handleCancelDissolve}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleConfirmDissolve}>
                        Dissolve
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default OpenGroup;
