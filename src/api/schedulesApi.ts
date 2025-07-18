import { Schedule } from "@/types/types";
import { getIdToken } from "@/api/auth/authToken";
import config from "@/config";

export const fetchSchedulesAPI = async (projectId: string) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/schedules/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );
    return response.json();
};

export const fetchSchedule = async (
    scheduleId: string,
    projectId: string
): Promise<Schedule> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/schedules/${scheduleId}/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            }
        }
    );
    return response.json();
};

export const storeScheduleAPI = async (
    projectId: string,
    schedule: Schedule
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/schedules/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                ...schedule
            }),
        }
    );
    return response.json();
};

export const updateScheduleAPI = async (
    projectId: string,
    scheduleId: string,
    updatedData: Partial<Schedule>
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/schedules/${scheduleId}/?project_id=${projectId}`,
        {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(updatedData),
        }
    );
    return response.json();
};

export const deleteScheduleAPI = async (
    projectId: string,
    scheduleId: string
) => {
    const idToken = getIdToken();
    return await fetch(
        `${config.LOCAL_API_URL}/schedules/${scheduleId}/?project_id=${projectId}`,
        {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );
};