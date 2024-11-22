import React, { useMemo, useState } from "react";
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

type GroupProps = { group: Group };

const OpenGroup: React.FC<GroupProps> = ({ group }) => {
    const { getNodesByIds } = useNodesStore();
    const {
        findInConnectionsByNodeId,
        findOutConnectionsByNodeId,
        removeConnections,
    } = useConnectionsStore();
    const { openContextMenu, setSelectedNodes, setOpenGroup } = useEditorStore();
    const { removeGroup, closeGroup } = useGroupsStore();
    const nodes = getNodesByIds(group.nodes);

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
    }, [nodes]);

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();

        const contextMenuItems = [
            {
                label: "Close Group",
                action: () => {
                    setOpenGroup(null);
                    setSelectedNodes([]);
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
        ];

        openContextMenu(e.clientX, e.clientY, contextMenuItems);
    };

    const handleConfirmDissolve = () => {
        const inConnections = findInConnectionsByNodeId(group.id);
        const outConnections = findOutConnectionsByNodeId(group.id);
        const connections = [...inConnections, ...outConnections];

        removeConnections(connections);
        removeGroup(group.id);
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
                    left: bounds.minX - 100,
                    top: bounds.minY - 100,
                    width: width + 200,
                    height: height + 200,
                }}
            >
                <ConnectorGroup in groupId={group.id} />
                <ConnectorGroup out groupId={group.id} />
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
