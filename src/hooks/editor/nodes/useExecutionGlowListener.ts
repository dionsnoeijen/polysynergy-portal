import {useEffect} from 'react'
import PubNub from 'pubnub'
import useNodesStore from "@/stores/nodesStore"

type ExecutionMessage = {
    node_id: string
    event: 'start_node' | 'end_node' | 'run_end'
    status?: 'success' | 'killed' | 'error'
}

const groupStates = new Map<string, { count: number, remaining: number }>();

export function useExecutionGlowListener(flowId: string) {
    useEffect(() => {
        cleanupExecutionGlow();
        if (!flowId) return;

        const pubnub = new PubNub({
            subscribeKey: process.env.NEXT_PUBLIC_PUBNUB_SUBSCRIBE_KEY!,
            userId: 'poly_synergy_flow',
        });

        const channel = `flow-${flowId}`;
        pubnub.subscribe({channels: [channel]});

        pubnub.addListener({
            message: (envelope) => {
                const message = envelope.message as ExecutionMessage;
                let node_id = message.node_id;
                const event = message.event;

                if (event === 'run_end') {
                    cleanupExecutionGlow();
                }

                let el = document.querySelector(`[data-node-id="${node_id}"]`) as HTMLElement;

                if (!el) {
                    const groupInfo = useNodesStore.getState().findNearestVisibleGroupWithCount?.(node_id);
                    if (!groupInfo) return;

                    node_id = groupInfo.groupId;
                    el = document.querySelector(`[data-node-id="${node_id}"]`) as HTMLElement;
                    if (!el) return;

                    const {groupId, count} = groupInfo;
                    const current = groupStates.get(groupId) || {count, remaining: 0};

                    if (event === 'start_node') {
                        current.remaining += 1;
                        groupStates.set(groupId, current);
                        if (current.remaining === 1) {
                            el.classList.add('executing');
                        }
                    } else if (event === 'end_node') {
                        current.remaining = Math.max(0, current.remaining - 1);
                        if (current.remaining === 0) {
                            el.classList.remove('executing');
                            el.classList.add(`executed-${message.status || 'killed'}`);
                            groupStates.delete(groupId);
                        } else {
                            groupStates.set(groupId, current); // update
                        }
                    }
                } else {
                    // Node is direct zichtbaar, geen group nodig
                    if (event === 'start_node') {
                        el.classList.add('executing');
                    } else if (event === 'end_node') {
                        el.classList.remove('executing');
                        el.classList.add(`executed-${message.status || 'killed'}`);
                    }
                }
            },
        });

        function cleanupExecutionGlow() {
            const elements = document.querySelectorAll('[data-node-id]');
            elements.forEach((el) => {
                el.classList.remove('executing');

                el.classList.forEach((cls) => {
                    if (cls.startsWith('executed-')) {
                        el.classList.remove(cls);
                    }
                });
            });

            groupStates.clear();
        }

        return () => {
            pubnub.unsubscribeAll();
            pubnub.removeAllListeners();
            groupStates.clear();
            cleanupExecutionGlow();
        };
    }, [flowId]);
}