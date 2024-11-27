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
import { Text } from '@/components/text';

type GroupProps = { group: Group };

const OpenGroup: React.FC<GroupProps> = ({ group }): React.ReactElement => {
    const { getNodesByIds } = useNodesStore();
    const {
        findInConnectionsByNodeId,
        findOutConnectionsByNodeId,
        removeConnections,
    } = useConnectionsStore();
    const { openContextMenu, setSelectedNodes, setOpenGroup } = useEditorStore();
    const { removeGroup, closeGroup, updateGroup } = useGroupsStore();
    const nodes = getNodesByIds(group.nodes);

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const bounds = useMemo(() => {
        const bounds = nodes.reduce(
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

        const centerX = bounds.minX + (bounds.maxX - bounds.minX) / 2;
        const centerY = bounds.minY + (bounds.maxY - bounds.minY) / 2;

        const groupWidth = 100;
        const groupHeight = 100;

        setTimeout(() => {
            updateGroup(group.id, {
                ...group,
                view: {
                    x: centerX - groupWidth / 2,
                    y: centerY - groupHeight / 2,
                    width: groupWidth,
                    height: groupHeight,
                },
            });
        }, 0);

        return bounds;
    // eslint-disable-next-line
    }, [nodes]);

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
                        setOpenGroup(null);
                        setSelectedNodes([]);
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
                <div className="absolute select-none -top-6 inline-block whitespace-nowrap">
                    <Text>{group.name}</Text>
                </div>
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
