import { create, StateCreator } from 'zustand';
import {
    fetchSchedulesAPI,
    storeScheduleAPI,
    updateScheduleAPI,
    deleteScheduleAPI,
} from '@/api/schedulesApi';
import useEditorStore from "@/stores/editorStore";
import { Schedule } from '@/types/types';

type SchedulesStore = {
    reset: () => void;
    hasInitialFetched: boolean;
    schedules: Schedule[];
    getSchedule: (scheduleId: string) => Schedule | undefined;
    fetchSchedules: () => Promise<void>;
    storeSchedule: (schedule: Schedule) => Promise<Schedule | undefined>;
    updateSchedule: (schedule: Schedule) => Promise<Schedule | undefined>;
    deleteSchedule: (scheduleId: string) => Promise<void>;
};

const useSchedulesStore = create<SchedulesStore>((
    set: Parameters<StateCreator<SchedulesStore>>[0]
) => ({
    reset: () => {
        set({
            schedules: [],
            hasInitialFetched: false,
        });
    },

    hasInitialFetched: false,

    schedules: [],

    getSchedule: (scheduleId): Schedule | undefined => {
        return useSchedulesStore.getState().schedules.find((schedule) => schedule.id === scheduleId);
    },

    fetchSchedules: async () => {
        const { activeProjectId } = useEditorStore.getState();
        if (!activeProjectId) return;
        try {
            const data: Schedule[] = await fetchSchedulesAPI(activeProjectId);
            set({ schedules: data, hasInitialFetched: true });
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
        }
    },

    storeSchedule: async (schedule: Schedule): Promise<Schedule | undefined> => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            const response = await storeScheduleAPI(activeProjectId, schedule);
            schedule.id = response.id;
            set((state) => ({ schedules: [...state.schedules, schedule] }));
            return schedule;
        } catch (error) {
            console.error('Failed to store schedule:', error);
        }
    },

    updateSchedule: async (schedule: Schedule): Promise<Schedule | undefined> => {
        try {
            const response = await updateScheduleAPI(schedule.id as string, schedule);
            set((state) => ({
                schedules: state.schedules.map((s) => (s.id === schedule.id ? schedule : s)),
            }));
            return response;
        } catch (error) {
            console.error('Failed to update schedule:', error);
        }
    },

    deleteSchedule: async (scheduleId: string) => {
        try {
            await deleteScheduleAPI(scheduleId);
            set((state) => ({
                schedules: state.schedules.filter((s) => s.id !== scheduleId),
            }));
        } catch (error) {
            console.error('Failed to delete schedule:', error);
        }
    }
}));

export default useSchedulesStore;