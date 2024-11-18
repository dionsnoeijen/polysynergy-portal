import React, { useMemo } from "react";
import { Group } from "@/stores/groupStore";
import useNodesStore from "@/stores/nodesStore";
import { useEditorStore } from "@/stores/editorStore";
import Connector from "@/components/editor/nodes/connector";

type GroupProps = { group: Group; };

const OpenGroup: React.FC<GroupProps> = ({ group }) => {
    const { getNodesByIds } = useNodesStore();
    const { openContextMenu } = useEditorStore();
    const nodes = getNodesByIds(group.nodes);

    const bounds = useMemo(() => {
        return nodes.reduce(
            (acc, node) => {
                const nodeRight = node.x + node.width;
                const nodeBottom = node.y + node.height;

                return {
                    minX: Math.min(acc.minX, node.x),
                    minY: Math.min(acc.minY, node.y),
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
            { label: "Dissolve Group", action: () => console.log("Dissolve Group") },
        ];

        openContextMenu(e.clientX, e.clientY, contextMenuItems);
    };

    return (
        <div className="relative">
            <div
                data-type="open-group"
                onContextMenu={handleContextMenu}
                className="absolute border border-white rounded-md bg-slate-500 bg-opacity-25"
                style={{
                    left: bounds.minX - 100,
                    top: bounds.minY - 100,
                    width: width + 200,
                    height: height + 200,
                }}
            >
                <Connector in handle="group" nodeUuid={''} />
                <Connector out handle="group" nodeUuid={''} />
            </div>
        </div>
    );
};

export default OpenGroup;
