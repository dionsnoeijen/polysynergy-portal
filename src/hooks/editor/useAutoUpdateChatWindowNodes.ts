import {useEffect} from "react";
import useEditorStore from "@/stores/editorStore";
import useChatWindowsStore from "@/stores/chatWindowsStore";
import useNodesStore from "@/stores/nodesStore";

export function useAutoUpdateChatWindowNodes() {
    const activeChatWindowId = useEditorStore((state) => state.activeChatWindowId);
    const getChatWindow = useChatWindowsStore((state) => state.getChatWindow);
    const getNodesByPath = useNodesStore((state) => state.getNodesByPath);

    useEffect(() => {
        if (!activeChatWindowId) return;

        const chatWindow = getChatWindow(activeChatWindowId);
        if (!chatWindow) return;

        const chatWindowNodes = getNodesByPath(`polysynergy_nodes.chat_window.chat_window.ChatWindow`);
        const mockChatWindowNodes = getNodesByPath(`polysynergy_nodes.mock.mock_chat_window.MockChatWindow`);

        if (!chatWindowNodes && !mockChatWindowNodes) return;

        // ChatWindow and MockChatWindow nodes currently don't have entity-related variables to update
        // (unlike Schedule which has schedule_name, cron_expression, etc.)
        // However, this hook maintains architectural consistency with routes/schedules
        // and provides a place for future variable syncing if needed.

        // If chat window name or other properties need to be synced to node variables in the future,
        // add updateNodeVariable calls here similar to useAutoUpdateScheduleNodes.

    }, [activeChatWindowId, getChatWindow, getNodesByPath]);
}
