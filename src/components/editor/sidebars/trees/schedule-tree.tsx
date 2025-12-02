import React, {ReactElement} from "react";
import useSchedulesStore from "@/stores/schedulesStore";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import Link from "next/link";
import useEditorStore from "@/stores/editorStore";
import {PencilIcon} from "@heroicons/react/24/outline";
import {FormType, Fundamental, Schedule} from "@/types/types";
import { useBranding } from "@/contexts/branding-context";

export default function ScheduleTree(): ReactElement {
    const { accent_color } = useBranding();
    const schedules = useSchedulesStore((state) => state.schedules);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeScheduleId = useEditorStore((state) => state.activeScheduleId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    // const setIsExecuting = useEditorStore((state) => state.setIsExecuting);

    return (
        <TreeList
            items={schedules}
            title={'Schedules'}
            activeItem={activeScheduleId}
            formEditingItem={formEditRecordId as string}
            fundamental={Fundamental.Schedule}
            dataTourId={'add-schedule-button'}
            renderItem={(schedule: Schedule) => (
                <>
                    <Link href={`/project/${activeProjectId}/schedule/${schedule.id}`}
                        title={`${schedule.name} - ${schedule.id}`}
                        onClick={() => {
                            // CRITICAL: Disable autosave BEFORE navigation to prevent empty saves
                            useEditorStore.getState().setAutosaveEnabled(false);
                            useEditorStore.getState().setIsLoadingFlow(true);
                            console.log('🔒 Schedule clicked - autosave disabled for switching');
                        }}
                        className={`block flex-1 truncate dark:text-gray-200/80 dark:hover:text-white pt-1 pb-1 ${(activeScheduleId === schedule.id || formEditRecordId === schedule.id) ? 'text-white' : 'dark:text-zinc-500'}`}
                        style={{ color: (activeScheduleId === schedule.id || formEditRecordId === schedule.id) ? 'white' : accent_color }}
                    >
                        {schedule.name}
                    </Link>
                    <button
                        onClick={() => openForm(FormType.EditSchedule, schedule.id)}
                        type="button"
                        className={`p-2 rounded focus:outline-none active:text-zinc-200 group`}
                    >
                        <PencilIcon
                            className={`w-4 h-4 transition-colors duration-200 ${activeScheduleId === schedule.id || formEditRecordId === schedule.id ? 'text-white' : 'dark:text-white/70'}`}
                            style={{ color: (activeScheduleId === schedule.id || formEditRecordId === schedule.id) ? 'white' : accent_color }}
                        />
                    </button>
                </>
            )}
            addButtonClick={() => openForm(FormType.AddSchedule)}
        />
    );
}