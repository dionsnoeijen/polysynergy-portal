import {useEffect} from 'react'
import PubNub from 'pubnub'
import useMockStore, {MockNode} from '@/stores/mockStore'
import useNodesStore from "@/stores/nodesStore";
import {getConnectionExecutionDetails} from "@/api/executionApi";
import useEditorStore from "@/stores/editorStore";

type StateMessage = {
    event: 'run_start' | 'run_end' | 'start_node' | 'end_node';
    node_id?: string;
    run_id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variables?: Record<string, any>;
    status?: 'success' | 'error' | 'killed';
}

export function useExecutionStateListener(flowId: string) {
    const getNode = useNodesStore((state) => state.getNode);
    const clearMockStore = useMockStore((state) => state.clearMockStore);
    const setMockConnections = useMockStore((state) => state.setMockConnections);
    const addOrUpdateMockNode = useMockStore((state) => state.addOrUpdateMockNode);
    const setHasMockData = useMockStore((state) => state.setHasMockData);

    useEffect(() => {
        if (!flowId) return;

        const activeVersionId = useEditorStore.getState().activeVersionId;

        const pubnub = new PubNub({
            subscribeKey: process.env.NEXT_PUBLIC_PUBNUB_SUBSCRIBE_KEY!,
            userId: 'poly_synergy_flow',
        });

        const channel = `flow-${flowId}`;
        pubnub.subscribe({channels: [channel]});

        pubnub.addListener({
            message: async (envelope) => {
                const message = envelope.message as StateMessage;
                if (!message || !message.run_id) return;

                if (message.event === 'run_start') {
                    clearMockStore();
                    return;
                }

                if (message.event === 'run_end') {
                    const data = await getConnectionExecutionDetails(
                        activeVersionId as string,
                        message.run_id
                    );
                    setMockConnections(data);
                    setHasMockData(true);
                    return;
                }

                if (!message.node_id) return;

                const nodeFlowNode = getNode(message.node_id);

                addOrUpdateMockNode({
                    id: message.node_id,
                    handle: nodeFlowNode?.handle,
                    runId: message.run_id,
                    killed: message.status === 'killed',
                    type: nodeFlowNode?.path.split(".").pop(),
                    started: message.event === 'start_node',
                    variables: {}, // je haalt later pas de echte op
                } as MockNode);
            },
        })

        return () => {
            pubnub.unsubscribeAll();
            pubnub.removeAllListeners();
        }
    // eslint-disable-next-line
    }, [flowId])
}