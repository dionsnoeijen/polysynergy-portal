import {ReactElement, useEffect} from "react";
import useSchedulesStore from "@/stores/schedulesStore";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import Link from "next/link";
import useEditorStore from "@/stores/editorStore";
import {PencilIcon} from "@heroicons/react/24/outline";
import {FormType} from "@/types/types";

export default function ScheduleTree(): ReactElement {

    const { schedules, fetchSchedules } = useSchedulesStore();
    const { openForm, formEditRecordId, activeScheduleId, activeProjectId } = useEditorStore();

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    return (
        <TreeList
            items={schedules}
            title={'Schedules'}
            renderItem={(schedule) => (
                <>
                    <Link href={`/project/${activeProjectId}/schedule/${schedule.id}`}>
                        {schedule.name}
                    </Link>
                    <button
                        onClick={() => openForm(FormType.EditSchedule, schedule.id)}
                        type="button"
                        className={`p-2 rounded focus:outline-none active:text-zinc-200 group ${activeScheduleId === schedule.id || formEditRecordId === schedule.id ? 'text-white' : 'text-zinc-500 '}`}
                    >
                        <PencilIcon className={'w-4 h-4 transition-colors duration-200'} />
                    </button>
                </>
            )}
            addButtonClick={() => openForm(FormType.AddSchedule)}
        />
    );
}