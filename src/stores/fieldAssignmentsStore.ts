import {create, StateCreator} from 'zustand';
import {
    fetchAssignmentsBySection as fetchAssignmentsBySectionAPI,
    createAssignmentsBulk as createAssignmentsBulkAPI,
    updateAssignment as updateAssignmentAPI,
    deleteAssignment as deleteAssignmentAPI,
} from '@/api/fieldAssignmentsApi';
import useEditorStore from "@/stores/editorStore";
import {FieldAssignment} from "@/types/types";

type FieldAssignmentsStore = {
    reset: () => void;
    isFetching: boolean;
    assignments: FieldAssignment[];
    assignmentsById: Record<string, FieldAssignment>;
    assignmentsBySectionId: Record<string, FieldAssignment[]>;
    getAssignment: (assignmentId: string) => FieldAssignment | undefined;
    getAssignmentsBySection: (sectionId: string) => FieldAssignment[];
    fetchAssignmentsBySection: (sectionId: string) => Promise<void>;
    createAssignmentsBulk: (assignments: Omit<FieldAssignment, 'id'>[]) => Promise<FieldAssignment[]>;
    updateAssignment: (assignmentId: string, assignment: Partial<FieldAssignment>) => Promise<void>;
    deleteAssignment: (assignmentId: string) => Promise<void>;
};

const useFieldAssignmentsStore = create<FieldAssignmentsStore>((
    set: Parameters<StateCreator<FieldAssignmentsStore>>[0]
) => ({
    reset: () => {
        set({
            assignments: [],
            assignmentsById: {},
            assignmentsBySectionId: {},
        });
    },

    isFetching: false,

    assignments: [],
    assignmentsById: {},
    assignmentsBySectionId: {},

    getAssignment: (assignmentId): FieldAssignment | undefined => {
        return useFieldAssignmentsStore.getState().assignmentsById[assignmentId];
    },

    getAssignmentsBySection: (sectionId): FieldAssignment[] => {
        return useFieldAssignmentsStore.getState().assignmentsBySectionId[sectionId] || [];
    },

    fetchAssignmentsBySection: async (sectionId: string) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        set({isFetching: true});
        try {
            const data: FieldAssignment[] = await fetchAssignmentsBySectionAPI(sectionId, activeProjectId);

            const assignmentsById = data.reduce((acc, assignment) => {
                acc[assignment.id] = assignment;
                return acc;
            }, {} as Record<string, FieldAssignment>);

            set((state) => ({
                assignments: [
                    ...state.assignments.filter(a => a.section_id !== sectionId),
                    ...data
                ],
                assignmentsById: {
                    ...state.assignmentsById,
                    ...assignmentsById
                },
                assignmentsBySectionId: {
                    ...state.assignmentsBySectionId,
                    [sectionId]: data
                }
            }));
        } finally {
            set({isFetching: false});
        }
    },

    createAssignmentsBulk: async (assignments: Omit<FieldAssignment, 'id'>[]) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return [];

        const response = await createAssignmentsBulkAPI(activeProjectId, assignments);
        const newAssignments = response.assignments;

        set((state) => {
            const newById = newAssignments.reduce((acc, assignment) => {
                acc[assignment.id] = assignment;
                return acc;
            }, {} as Record<string, FieldAssignment>);

            const bySectionId = {...state.assignmentsBySectionId};
            newAssignments.forEach(assignment => {
                if (!bySectionId[assignment.section_id]) {
                    bySectionId[assignment.section_id] = [];
                }
                bySectionId[assignment.section_id].push(assignment);
            });

            return {
                assignments: [...state.assignments, ...newAssignments],
                assignmentsById: {
                    ...state.assignmentsById,
                    ...newById
                },
                assignmentsBySectionId: bySectionId
            };
        });

        return newAssignments;
    },

    updateAssignment: async (assignmentId: string, assignment: Partial<FieldAssignment>) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        const updatedAssignment = await updateAssignmentAPI(assignmentId, activeProjectId, assignment);

        set((state) => {
            const bySectionId = {...state.assignmentsBySectionId};
            const sectionId = updatedAssignment.section_id;

            if (bySectionId[sectionId]) {
                bySectionId[sectionId] = bySectionId[sectionId].map(a =>
                    a.id === assignmentId ? updatedAssignment : a
                );
            }

            return {
                assignments: state.assignments.map((a) =>
                    a.id === assignmentId ? updatedAssignment : a
                ),
                assignmentsById: {
                    ...state.assignmentsById,
                    [assignmentId]: updatedAssignment
                },
                assignmentsBySectionId: bySectionId
            };
        });
    },

    deleteAssignment: async (assignmentId: string) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        const assignment = useFieldAssignmentsStore.getState().assignmentsById[assignmentId];
        if (!assignment) return;

        await deleteAssignmentAPI(assignmentId, activeProjectId);

        set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {[assignmentId]: _deleted, ...remainingById} = state.assignmentsById;

            const bySectionId = {...state.assignmentsBySectionId};
            if (bySectionId[assignment.section_id]) {
                bySectionId[assignment.section_id] = bySectionId[assignment.section_id].filter(
                    a => a.id !== assignmentId
                );
            }

            return {
                assignments: state.assignments.filter((a) => a.id !== assignmentId),
                assignmentsById: remainingById,
                assignmentsBySectionId: bySectionId
            };
        });
    }
}));

export default useFieldAssignmentsStore;
