import {Node, NodeType} from "@/types/types";
import {MockNode} from "@/stores/mockStore";

export const getColorForNodeType = (
    node: Node,
    isSelected: boolean,
    mockNode: MockNode | undefined,
    hasMockData: boolean,
) => {
    let classList = '';

    if (mockNode) {
        classList += "ring-green-500 dark:ring-green-500";
        if (mockNode.is_killed) {
            classList += "ring-red-500 dark:ring-red-500";
        }
        classList += " ring-2";
    } else {
        if (hasMockData) {
            classList += "ring-red-500 dark:ring-red-500";
            classList += " ring-2";
        } else {
            if (node.service && node.service.id) {
                classList += "ring-purple-500 dark:ring-purple-500";
            } else {
                if (node.category === NodeType.Mock) {
                    classList += "ring-orange-500 dark:ring-orange-500";
                } else if (node.category === NodeType.Note) {
                    classList += "ring-yellow-500 dark:ring-yellow-500";
                } else {
                    classList += "ring-sky-500 dark:ring-sky-500";
                }
            }
            if (isSelected) {
                classList += " ring-2 shadow-2xl";
            }
        }
    }

    return classList;
};