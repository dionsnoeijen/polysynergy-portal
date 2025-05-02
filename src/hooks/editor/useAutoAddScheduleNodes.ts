import useAvailableNodeStore from "@/stores/availableNodesStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";
import useSchedulesStore from "@/stores/schedulesStore";
import {useEffect} from "react";
import {v4 as uuidv4} from "uuid";
import {
    Connection as ConnectionType, Schedule, Node
} from "@/types/types";
import {format} from "date-fns";

export function useAutoAddScheduleNodes() {
    const availableNodes = useAvailableNodeStore((state) => state.availableNodes);
    const getAvailableNodeByPath = useAvailableNodeStore((state) => state.getAvailableNodeByPath);
    const addNode = useNodesStore((state) => state.addNode);
    const addConnection = useConnectionsStore((state) => state.addConnection);
    const nodes = useNodesStore((state) => state.nodes);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const activeScheduleId = useEditorStore((state) => state.activeScheduleId);
    const getSchedule = useSchedulesStore((state) => state.getSchedule);

    useEffect(() => {
        if (nodes.length > 0 || !activeScheduleId) return;

        const template1: Node | undefined = getAvailableNodeByPath(`nodes.nodes.schedule.schedule.Schedule`);
        const template2: Node | undefined = getAvailableNodeByPath(`nodes.nodes.mock.mock_schedule.MockSchedule`);
        const schedule: Schedule | undefined = getSchedule(activeScheduleId);

        if (!template1 || !template2 || !schedule) return;

        const scheduleNode: Node = structuredClone(template1);
        const mockScheduleNode: Node = structuredClone(template2);

        scheduleNode.id = uuidv4();
        scheduleNode.view = {
            x: 400,
            y: 100,
            width: 200,
            height: 200,
            adding: false,
            isDeletable: false,
            collapsed: false,
        };

        mockScheduleNode.id = uuidv4();
        mockScheduleNode.view = {
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            adding: false,
            isDeletable: false,
            collapsed: false,
        };

        const connection: ConnectionType = {
            id: uuidv4(),
            sourceNodeId: mockScheduleNode.id,
            sourceHandle: "true_path",
            targetHandle: "node",
            targetNodeId: scheduleNode.id,
            isInGroup: undefined
        };

        addNode(scheduleNode);
        addNode(mockScheduleNode);
        addConnection(connection);

        updateNodeVariable(scheduleNode.id, 'schedule_name', schedule.name);
        updateNodeVariable(scheduleNode.id, 'cron_expression', schedule.cron_expression);
        updateNodeVariable(scheduleNode.id, 'start_time', format(schedule.start_time, "yyyy-MM-dd HH:mm:ss"));
        updateNodeVariable(scheduleNode.id, 'end_time', schedule.end_time ? format(schedule.end_time, "yyyy-MM-dd HH:mm:ss") : null);
        updateNodeVariable(scheduleNode.id, 'is_active', schedule.is_active);
    }, [
        nodes,
        availableNodes,
        activeScheduleId,
        getAvailableNodeByPath,
        getSchedule,
        addNode,
        addConnection,
        updateNodeVariable
    ]);
}