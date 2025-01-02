import {Route} from "@/stores/dynamicRoutesStore";
import {Schedule} from "@/types/types";

export const fetchSchedulesAPI = async (projectId: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/schedules/?project_id=${projectId}`, {
        headers: {
            'Accept': 'application/json',
        },
    });
    return response.json();
};

export const storeScheduleAPI = async (projectId: string, schedule: Schedule) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/schedules/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...schedule,
            project_id: projectId,
        }),
    });
    return response.json();
};

export const updateScheduleAPI = async (scheduleId: string, updatedData: Partial<Schedule>) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/schedules/${scheduleId}/`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    });
    return response.json();
};
