import { Schedule } from "@/types/types";
import { getIdToken } from "@/api/auth/authToken";

export const fetchSchedulesAPI = async (projectId: string) => {
    const idToken = getIdToken();
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/schedules/?project_id=${projectId}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });
    return response.json();
};

export const storeScheduleAPI = async (projectId: string, schedule: Schedule) => {
    const idToken = getIdToken();
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/schedules/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            ...schedule,
            project_id: projectId,
        }),
    });
    return response.json();
};

export const updateScheduleAPI = async (scheduleId: string, updatedData: Partial<Schedule>) => {
    const idToken = getIdToken();
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/schedules/${scheduleId}/`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(updatedData),
    });
    return response.json();
};
