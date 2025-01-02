import { create, StateCreator } from 'zustand';
import {
    fetchSchedulesAPI,
    storeScheduleAPI,
    updateScheduleAPI,
} from '@/api/schedulesApi';
import { useEditorStore } from "@/stores/editorStore";
import { Schedule } from '@/types/types';

type SchedulesStore = {
    schedules: Schedule[];
    getSchedule: (scheduleId: string) => Schedule | undefined;
    fetchSchedules: () => Promise<void>;
    storeSchedule: (schedule: Schedule) => Promise<void>;
    updateSchedule: (schedule: Schedule) => Promise<void>;
};

const useSchedulesStore = create<SchedulesStore>((
    set: Parameters<StateCreator<SchedulesStore>>[0]
) => ({
    schedules: [],

    getSchedule: (scheduleId): Schedule | undefined => {
        return useSchedulesStore.getState().schedules.find((schedule) => schedule.id === scheduleId);
    },

    fetchSchedules: async () => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            const data: Schedule[] = await fetchSchedulesAPI(activeProjectId);
            set({ schedules: data });
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
        }
    },

    storeSchedule: async (schedule: Schedule) => {
        const { activeProjectId } = useEditorStore.getState();
        try {
            const response = await storeScheduleAPI(activeProjectId, schedule);
            schedule.id = response.id;
            set((state) => ({ schedules: [...state.schedules, schedule] }));
        } catch (error) {
            console.error('Failed to store schedule:', error);
        }
    },

    updateSchedule: async (schedule: Schedule) => {
        try {
            await updateScheduleAPI(schedule.id as string, schedule);
            set((state) => ({
                schedules: state.schedules.map((s) => (s.id === schedule.id ? schedule : s)),
            }));
        } catch (error) {
            console.error('Failed to update schedule:', error);
        }
    },
}));

export default useSchedulesStore;