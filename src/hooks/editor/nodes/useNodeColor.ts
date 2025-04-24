import { useMemo } from "react";
import { Node, NodeType } from "@/types/types";
import { MockNode } from "@/stores/mockStore";

const useNodeColor = (
    node: Node,
    isSelected: boolean,
    mockNode?: MockNode,
    hasMockData?: boolean,
    isNodeInService?: boolean
) => {
    return useMemo(() => {
        let classList = "bg-opacity-50";

        if (mockNode) {
            classList += " ring-2 ring-green-500 dark:ring-green-500";
            if (mockNode.killed) {
                classList += " ring-red-500 dark:ring-red-500";
            }
        } else if (hasMockData) {
            classList += " ring-2 ring-red-500 dark:ring-red-500";
        } else {
            if (isSelected) {
                classList += `${node.category === NodeType.Group ? ' bg-green-800' : ' bg-sky-800'} ring-8 shadow-2xl`;
            } else {
                classList += " bg-zinc-800 ring ring-2";
            }

            if (node.service?.id || isNodeInService) {
                classList += " ring-purple-500 dark:ring-purple-500";
            } else {
                switch (node.category) {
                    case NodeType.Mock:
                        classList += " ring-orange-500 dark:ring-orange-500";
                        break;
                    case NodeType.Note:
                        classList += " ring-yellow-500 dark:ring-yellow-500";
                        break;
                    case NodeType.Group:
                        classList += " ring-green-200 dark:ring-green-200";
                        break;
                    case NodeType.Flow:
                    case NodeType.Jump:
                        classList += " ring-pink-700 dark:ring-pink-700";
                        break;
                    default:
                        classList += " ring-sky-500 dark:ring-sky-500";
                        break;
                }
            }
        }

        return classList;
    }, [mockNode, hasMockData, isSelected, node.service?.id, node.category, isNodeInService]);
};

export default useNodeColor;