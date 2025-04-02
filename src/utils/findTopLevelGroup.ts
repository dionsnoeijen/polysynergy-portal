import { Node } from "@/types/types";

const findTopLevelGroup = (nodes: Node[]): Node => {
    const allGroupIds = new Set<string>();
    const nestedGroupIds = new Set<string>();

    for (const node of nodes) {
        if (node.group && node.group.nodes && node.group.nodes.length > 0) {
            allGroupIds.add(node.id);
            for (const childId of node.group.nodes) {
                nestedGroupIds.add(childId);
            }
        }
    }

    const topLevelIds = [...allGroupIds].filter(id => !nestedGroupIds.has(id));
    return nodes.filter(node => topLevelIds.includes(node.id))[0];
};

export default findTopLevelGroup;