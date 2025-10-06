import useAvailableNodeStore from "@/stores/availableNodesStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useChatWindowsStore from "@/stores/chatWindowsStore";
import { v4 as uuidv4 } from "uuid";
import { Connection as ConnectionType, Node } from "@/types/types";
import useEditorStore from "@/stores/editorStore";

const addChatWindowNodes = () => {
    const getNodeByPath = useAvailableNodeStore.getState().getAvailableNodeByPath;
    const template1: Node | undefined = getNodeByPath("polysynergy_nodes.chat_window.chat_window.ChatWindow");
    const template2: Node | undefined = getNodeByPath("polysynergy_nodes.mock.mock_chat_window.MockChatWindow");

    if (!template1 || !template2) return;

    const chatWindowNode: Node = {
        ...structuredClone(template1),
        id: uuidv4(),
        view: {
            x: 400,
            y: 100,
            width: 200,
            height: 200,
            adding: false,
            isDeletable: false,
            collapsed: false,
        }
    };

    const mockChatWindowNode: Node = {
        ...structuredClone(template2),
        id: uuidv4(),
        view: {
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            adding: false,
            isDeletable: false,
            collapsed: false,
        }
    };

    const connection: ConnectionType = {
        id: uuidv4(),
        sourceNodeId: mockChatWindowNode.id,
        sourceHandle: "true_path",
        targetHandle: "node",
        targetNodeId: chatWindowNode.id,
        isInGroup: undefined
    };

    const { addNode } = useNodesStore.getState();
    const { addConnection } = useConnectionsStore.getState();

    addNode(chatWindowNode);
    addNode(mockChatWindowNode);
    addConnection(connection);
};

export function addChatWindowNodesIfNeeded(chatWindowId: string) {
    let ticks = 0;
    const maxTicks = 50;

    const checkInterval = setInterval(() => {
        const activeId = useEditorStore.getState().activeChatWindowId;
        if (activeId !== chatWindowId) {
            clearInterval(checkInterval);
            return;
        }

        const chatWindow = useChatWindowsStore.getState().getChatWindow(chatWindowId);
        const nodes = useNodesStore.getState().nodes;
        if (!chatWindow || nodes.length > 0) {
            ticks++;
            if (ticks > maxTicks) clearInterval(checkInterval);
            return;
        }

        clearInterval(checkInterval);
        addChatWindowNodes();
    }, 100);
}
