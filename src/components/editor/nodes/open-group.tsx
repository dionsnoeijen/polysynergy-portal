import React, { useEffect, useMemo, useState } from "react";
import useGroupsStore, { Group } from "@/stores/groupStore";
import useNodesStore from "@/stores/nodesStore";
import { useEditorStore } from "@/stores/editorStore";
import ConnectorGroup from "@/components/editor/nodes/connector-group";
import { useConnectionsStore } from "@/stores/connectionsStore";
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

type GroupProps = { group: Group };

const OpenGroup: React.FC<GroupProps> = ({ group }): React.ReactElement => {
    const { getNodesByIds, getNode } = useNodesStore();
    const {
        findInConnectionsByNodeId,
        findOutConnectionsByNodeId,
    } = useConnectionsStore();
    const { openContextMenu, setSelectedNodes, isDragging, zoomFactor } = useEditorStore();
    const { updateGroup } = useGroupsStore();
    const nodes = getNodesByIds(group.nodes);
    const closedGroupNode = getNode(group.id);

    const { closeGroup, dissolveGroup } = useGrouping();

    const inConnections = findInConnectionsByNodeId(group.id);
    const outConnections = findOutConnectionsByNodeId(group.id);

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const bounds = useMemo(() => {
        return nodes.reduce(
            (acc, node) => {
                const nodeRight = node.view.x + node.view.width;
                const nodeBottom = node.view.y + node.view.height;

                return {
                    minX: Math.min(acc.minX, node.view.x),
                    minY: Math.min(acc.minY, node.view.y),
                    maxX: Math.max(acc.maxX, nodeRight),
                    maxY: Math.max(acc.maxY, nodeBottom),
                };
            },
            { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        );
    // eslint-disable-next-line
    }, [nodes, closedGroupNode, inConnections, outConnections]);

    useEffect(() => {
        const closedGroupNode = document.querySelector(`[data-node-id="${group.id}"][data-type="closed-group"]`) as HTMLElement;
        if (!closedGroupNode) return;

        const boundingRect = closedGroupNode.getBoundingClientRect();
        const x = bounds.minX - (MARGIN + (boundingRect.width / zoomFactor)) - 45;
        const y = bounds.minY - MARGIN;

        closedGroupNode.style.left = `${x}px`;
        closedGroupNode.style.top = `${y}px`;

    // eslint-disable-next-line
    }, [bounds]);

    useEffect(() => {
        if (isDragging) return;

        const centerX = bounds.minX + (bounds.maxX - bounds.minX) / 2;
        const centerY = bounds.minY + (bounds.maxY - bounds.minY) / 2;

        const groupWidth = bounds.maxX - bounds.minX;
        const groupHeight = bounds.maxY - bounds.minY;

        updateGroup(group.id, {
            ...group,
            view: {
                x: centerX - groupWidth / 2,
                y: centerY - groupHeight / 2,
                width: groupWidth,
                height: groupHeight,
            },
        });
    // eslint-disable-next-line
    }, [isDragging]);

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();

        const closedGroupNode = getNode(group.id);
        if (!closedGroupNode) return;

        const closedGroupNodeWidth = closedGroupNode.view.width / 2;
        const closedGroupNodeHeight = closedGroupNode.view.height / 2;

        const centerX = (bounds.minX + (bounds.maxX - bounds.minX) / 2) - closedGroupNodeWidth;
        const centerY = (bounds.minY + (bounds.maxY - bounds.minY) / 2) - closedGroupNodeHeight;

        openContextMenu(
            e.clientX,
            e.clientY,
            [
                {
                    label: "Close Group",
                    action: () => {
                        closeGroup(group.id, centerX, centerY);
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
        <div className="relative">
            <div
                data-type="open-group"
                onContextMenu={handleContextMenu}
                className="absolute border border-sky-500 dark:border-white rounded-md bg-sky-500 dark:bg-slate-500/20 bg-opacity-25"
                style={{
                    left: bounds.minX - MARGIN,
                    top: bounds.minY - MARGIN,
                    width: width + (MARGIN * 2),
                    height: height + (MARGIN * 2),
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
                    {/* Additional content can go here if needed */}
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
        </div>
    );
};

export default OpenGroup;
