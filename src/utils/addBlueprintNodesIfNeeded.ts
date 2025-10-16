import useAvailableNodeStore from "@/stores/availableNodesStore";
import useNodesStore from "@/stores/nodesStore";
import useBlueprintsStore from "@/stores/blueprintsStore";
import { v4 as uuidv4 } from "uuid";
import { Node, Blueprint } from "@/types/types";
import useEditorStore from "@/stores/editorStore";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    console.log('🔵 addBlueprintNodesIfNeeded CALLED for blueprint:', blueprintId);
    let ticks = 0;
    const maxTicks = 50;

    const checkInterval = setInterval(() => {
        const activeId = useEditorStore.getState().activeBlueprintId;
        if (activeId !== blueprintId) {
            console.log('❌ Blueprint ID mismatch, clearing interval');
            clearInterval(checkInterval);
            return;
        }

        const blueprint = useBlueprintsStore.getState().getBlueprint(blueprintId);
        const nodes = useNodesStore.getState().nodes;

        // Check if there's already a play button node
        const hasPlayButton = nodes.some(node =>
            node.path === 'polysynergy_nodes.play.config.PlayConfig' ||
            node.path === 'polysynergy_nodes.play.play.Play' ||
            node.has_play_button === true
        );

        console.log(`🔍 Tick ${ticks}: blueprint=${!!blueprint}, nodes.length=${nodes.length}, hasPlayButton=${hasPlayButton}`);

        if (hasPlayButton) {
            console.log('✅ Play button already exists, stopping polling');
            clearInterval(checkInterval);
            return;
        }

        if (!blueprint) {
            ticks++;
            if (ticks > maxTicks) {
                console.log('⏱️ Max ticks reached, giving up');
                clearInterval(checkInterval);
            }
            return;
        }

        console.log('✅ Adding play button node NOW!');
        clearInterval(checkInterval);
        addBlueprintNodes(blueprint);
    }, 100);
}
