import useAvailableNodeStore from "@/stores/availableNodesStore";
import useNodesStore from "@/stores/nodesStore";
import useBlueprintsStore from "@/stores/blueprintsStore";
import { v4 as uuidv4 } from "uuid";
import { Node, Blueprint } from "@/types/types";
import useEditorStore from "@/stores/editorStore";

const addBlueprintNodes = (blueprint: Blueprint) => {
    const getNodeByPath = useAvailableNodeStore.getState().getAvailableNodeByPath;
    const playTemplate: Node | undefined = getNodeByPath("polysynergy_nodes.play.config.PlayConfig");

    if (!playTemplate) return;

    const playNode: Node = {
        ...structuredClone(playTemplate),
        id: uuidv4(),
        view: {
            x: 0,
            y: 0,
            width: 200,
            height: 200,
            adding: false,
            isDeletable: true,  // Blueprint play buttons can be deleted
            collapsed: false,
        }
    };

    const { addNode } = useNodesStore.getState();
    addNode(playNode);
};

export function addBlueprintNodesIfNeeded(blueprintId: string) {
    let ticks = 0;
    const maxTicks = 50;

    const checkInterval = setInterval(() => {
        const activeId = useEditorStore.getState().activeBlueprintId;
        if (activeId !== blueprintId) {
            clearInterval(checkInterval);
            return;
        }

        const blueprint = useBlueprintsStore.getState().getBlueprint(blueprintId);
        const nodes = useNodesStore.getState().nodes;
        if (!blueprint || nodes.length > 0) {
            ticks++;
            if (ticks > maxTicks) clearInterval(checkInterval);
            return;
        }

        clearInterval(checkInterval);
        addBlueprintNodes(blueprint);
    }, 100);
}
