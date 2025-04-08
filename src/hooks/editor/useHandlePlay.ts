import { runMockApi } from "@/api/runApi";
import useEditorStore from "@/stores/editorStore";
import useMockStore from "@/stores/mockStore";

export const useHandlePlay = () => {
    const { activeVersionId, activeProjectId } = useEditorStore();
    const { setMockConnections, setMockNodes } = useMockStore();

    return async (e: React.MouseEvent, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!activeVersionId) return;

        try {
            const response = await runMockApi(activeProjectId, activeVersionId, nodeId);
            const data = await response.json();

            const result = data.result.body ? JSON.parse(data.result.body) : data.result;

            if (result.connections && result.nodes_order) {
                setMockConnections(result.connections);
                setMockNodes(result.nodes_order);
            } else {
                console.error("No mock data returned", result);
            }
        } catch (err) {
            console.error("Play failed", err);
        }
    };
};