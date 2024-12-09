import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { Group } from "@/stores/groupStore";
import { useEditorStore } from "@/stores/editorStore";
import ConnectorGroup from "@/components/editor/nodes/connector-group";
import {
    Dialog,
    DialogTitle,
    DialogDescription,
    DialogBody,
    DialogActions,
} from "@/components/dialog";
import { Button } from "@/components/button";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import { MARGIN } from "@/utils/constants";
import { getNodeBoundsFromDOM } from "@/utils/positionUtils";

type GroupProps = { group: Group };

const OpenGroup: React.FC<GroupProps> = ({ group }): React.ReactElement => {
    const { openContextMenu, setSelectedNodes, isDragging, zoomFactor } = useEditorStore();
    const { closeGroup, dissolveGroup } = useGrouping();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tick, setTick] = useState(0);
    const [bounds, setBounds] = useState({ minX:0, minY:0, maxX:0, maxY:0 });

    const [isReady, setIsReady] = useState(false);

    const rafRef = useRef<number|null>(null);

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

    useLayoutEffect(() => {
        const frameId = requestAnimationFrame(() => {
            const {minX, minY, maxX, maxY, foundAny} = getNodeBoundsFromDOM(group.nodes);
            if (!foundAny) {
                requestAnimationFrame(() => {
                    setTick((t) => t + 1);
                });
            } else {
                setBounds({ minX, minY, maxX, maxY });
                setIsReady(true);
            }
        });

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [tick, group.nodes]);

    useLayoutEffect(() => {
        const closedGroupNodeEl = document.querySelector(`[data-node-id="${group.id}"][data-type="closed-group"]`) as HTMLElement;
        if (!closedGroupNodeEl) return;

        const boundingRect = closedGroupNodeEl.getBoundingClientRect();
        const x = bounds.minX - (MARGIN + (boundingRect.width / zoomFactor)) - 45;
        const y = bounds.minY - MARGIN;

        closedGroupNodeEl.style.left = `${x}px`;
        closedGroupNodeEl.style.top = `${y}px`;
    }, [bounds, group.id, zoomFactor]);

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        openContextMenu(
            e.clientX,
            e.clientY,
            [
                {
                    label: "Close Group",
                    action: () => {
                        closeGroup(group.id);
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
        dissolveGroup(group.id);
        setIsDialogOpen(false);
    };

    const handleCancelDissolve = () => {
        setIsDialogOpen(false);
    };

    return (
        <>
            <div
                data-type="open-group"
                onContextMenu={handleContextMenu}
                onDoubleClick={() => closeGroup(group.id)}
                className={`absolute border border-sky-500 dark:border-white rounded-md bg-sky-500 dark:bg-slate-500/20 bg-opacity-25
                    ${group.isHidden ? 'z-1 select-none opacity-10' : 'z-10'}
                `}
                style={{
                    left: bounds.minX - MARGIN,
                    top: bounds.minY - MARGIN,
                    width: width + (MARGIN * 2),
                    height: height + (MARGIN * 2),
                    opacity: isReady ? 1 : 0,
                    transition: "opacity 0.2s ease-out 0.2s"
                }}
            >
                <ConnectorGroup in groupId={group.id}/>
                <ConnectorGroup out groupId={group.id}/>
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
