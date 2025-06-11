import {useEffect} from "react";
import useEditorStore from "@/stores/editorStore";
import useSchedulesStore from "@/stores/schedulesStore";
import useNodesStore from "@/stores/nodesStore";
import {format} from "date-fns";

export function useAutoUpdateScheduleNodes() {
    const activeScheduleId = useEditorStore((state) => state.activeScheduleId);
    const getSchedule = useSchedulesStore((state) => state.getSchedule);
    const getNodesByPath = useNodesStore((state) => state.getNodesByPath);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    useEffect(() => {
        if (!activeScheduleId) return;

        const schedule =
            getSchedule(activeScheduleId);
        if (!schedule) return;

        const scheduleNodes =
            getNodesByPath(`nodes.nodes.schedule.schedule.Schedule`);
        if (!scheduleNodes) return;

        scheduleNodes.forEach((node) => {
            if (node.view.isDeletable !== false) return;

            updateNodeVariable(node.id, 'schedule_name', schedule.name);
            updateNodeVariable(node.id, 'cron_expression', schedule.cron_expression);
            updateNodeVariable(node.id, 'start_time', format(schedule.start_time, "yyyy-MM-dd HH:mm:ss"));
            updateNodeVariable(node.id, 'end_time', schedule.end_time ? format(schedule.end_time, "yyyy-MM-dd HH:mm:ss") : null);
            updateNodeVariable(node.id, 'is_active', schedule.is_active);
        });

    }, [activeScheduleId, getSchedule, getNodesByPath, updateNodeVariable]);
}