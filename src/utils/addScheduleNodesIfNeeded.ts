import useAvailableNodeStore from "@/stores/availableNodesStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useSchedulesStore from "@/stores/schedulesStore";
import { v4 as uuidv4 } from "uuid";
import { Connection as ConnectionType, Node, Schedule } from "@/types/types";
import { format } from "date-fns";
import useEditorStore from "@/stores/editorStore";

const addScheduleNodes = (schedule: Schedule) => {
    const getNodeByPath = useAvailableNodeStore.getState().getAvailableNodeByPath;
    const template1: Node | undefined = getNodeByPath("polysynergy_nodes.schedule.schedule.Schedule");
    const template2: Node | undefined = getNodeByPath("polysynergy_nodes.mock.mock_schedule.MockSchedule");

    if (!template1 || !template2) return;

    const scheduleNode: Node = {
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

    const mockScheduleNode: Node = {
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
        sourceNodeId: mockScheduleNode.id,
        sourceHandle: "true_path",
        targetHandle: "node",
        targetNodeId: scheduleNode.id,
        isInGroup: undefined
    };

    const { addNode, updateNodeVariable } = useNodesStore.getState();
    const { addConnection } = useConnectionsStore.getState();

    addNode(scheduleNode);
    addNode(mockScheduleNode);
    addConnection(connection);

    updateNodeVariable(scheduleNode.id, "schedule_name", schedule.name);
    updateNodeVariable(scheduleNode.id, "cron_expression", schedule.cron_expression);
    updateNodeVariable(scheduleNode.id, "start_time", format(schedule.start_time, "yyyy-MM-dd HH:mm:ss"));
    updateNodeVariable(scheduleNode.id, "end_time", schedule.end_time ? format(schedule.end_time, "yyyy-MM-dd HH:mm:ss") : null);
    updateNodeVariable(scheduleNode.id, "is_active", schedule.is_active);
};

export function addScheduleNodesIfNeeded(scheduleId: string) {
    let ticks = 0;
    const maxTicks = 50;

    const checkInterval = setInterval(() => {
        const activeId = useEditorStore.getState().activeScheduleId;
        if (activeId !== scheduleId) {
            clearInterval(checkInterval);
            return;
        }

        const schedule = useSchedulesStore.getState().getSchedule(scheduleId);
        const nodes = useNodesStore.getState().nodes;
        if (!schedule || nodes.length > 0) {
            ticks++;
            if (ticks > maxTicks) clearInterval(checkInterval);
            return;
        }

        clearInterval(checkInterval);
        addScheduleNodes(schedule);
    }, 100);
}