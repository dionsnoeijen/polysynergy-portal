import {create, StateCreator} from 'zustand';
import {
    fetchSectionFields as fetchSectionFieldsAPI,
    createSectionField as createSectionFieldAPI,
    updateSectionField as updateSectionFieldAPI,
    deleteSectionField as deleteSectionFieldAPI,
} from '@/api/sectionFieldsApi';
import {
    fetchFieldTypes as fetchFieldTypesAPI,
} from '@/api/fieldTypesApi';
import useEditorStore from "@/stores/editorStore";
import {SectionField, FieldType} from "@/types/types";

type SectionFieldsStore = {
    reset: () => void;
    isFetching: boolean;
    hasInitialFetched: boolean;
    fields: SectionField[];
    fieldsById: Record<string, SectionField>;
    fieldTypes: FieldType[];
    fieldTypesById: Record<string, FieldType>;
    getSectionField: (fieldId: string) => SectionField | undefined;
    getFieldType: (handle: string) => FieldType | undefined;
    fetchSectionFields: () => Promise<void>;
    fetchFieldTypes: () => Promise<void>;
    createSectionField: (field: Omit<SectionField, 'id'>) => Promise<SectionField | undefined>;
    updateSectionField: (fieldId: string, field: Partial<SectionField>) => Promise<void>;
    deleteSectionField: (fieldId: string) => Promise<void>;
};

const useSectionFieldsStore = create<SectionFieldsStore>((
    set: Parameters<StateCreator<SectionFieldsStore>>[0]
) => ({
    reset: () => {
        set({
            fields: [],
            hasInitialFetched: false,
            fieldsById: {},
            fieldTypes: [],
            fieldTypesById: {},
        });
    },

    isFetching: false,
    hasInitialFetched: false,

    fields: [],
    fieldsById: {},

    fieldTypes: [],
    fieldTypesById: {},

    getSectionField: (fieldId): SectionField | undefined => {
        return useSectionFieldsStore
            .getState()
            .fields
            .find((field) => field.id === fieldId);
    },

    getFieldType: (handle): FieldType | undefined => {
        return useSectionFieldsStore
            .getState()
            .fieldTypes
            .find((fieldType) => fieldType.handle === handle);
    },

    fetchSectionFields: async () => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        set({isFetching: true});
        try {
            const data: SectionField[] = await fetchSectionFieldsAPI(activeProjectId);
            const fieldsById = data.reduce((acc, field) => {
                acc[field.id] = field;
                return acc;
            }, {} as Record<string, SectionField>);

            set({
                fields: data,
                fieldsById,
                hasInitialFetched: true
            });
        } catch (error) {
            console.error('Failed to fetch section fields:', error);
        } finally {
            set({isFetching: false});
        }
    },

    fetchFieldTypes: async () => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        try {
            const data: FieldType[] = await fetchFieldTypesAPI(activeProjectId);
            const fieldTypesById = data.reduce((acc, fieldType) => {
                acc[fieldType.handle] = fieldType;
                return acc;
            }, {} as Record<string, FieldType>);

            set({
                fieldTypes: data,
                fieldTypesById
            });
        } catch (error) {
            console.error('Failed to fetch field types:', error);
        }
    },

    createSectionField: async (field: Omit<SectionField, 'id'>): Promise<SectionField | undefined> => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        try {
            const response = await createSectionFieldAPI(activeProjectId, field);
            const newField: SectionField = response;

            set((state) => ({
                fields: [...state.fields, newField],
                fieldsById: {
                    ...state.fieldsById,
                    [newField.id]: newField
                }
            }));

            return newField;
        } catch (error) {
            console.error('Failed to create section field:', error);
            throw error;
        }
    },

    updateSectionField: async (fieldId: string, field: Partial<SectionField>) => {
        try {
            const {activeProjectId} = useEditorStore.getState();
            if (!activeProjectId) return;

            const updatedField = await updateSectionFieldAPI(fieldId, activeProjectId, field);

            set((state) => ({
                fields: state.fields.map((f) => (f.id === fieldId ? {...f, ...updatedField} : f)),
                fieldsById: {
                    ...state.fieldsById,
                    [fieldId]: {...state.fieldsById[fieldId], ...updatedField}
                }
            }));
        } catch (error) {
            console.error('Failed to update section field:', error);
            throw error;
        }
    },

    deleteSectionField: async (fieldId: string) => {
        try {
            const {activeProjectId} = useEditorStore.getState();
            if (!activeProjectId) return;

            await deleteSectionFieldAPI(fieldId, activeProjectId);

            set((state) => {
                const newFields = state.fields.filter((f) => f.id !== fieldId);
                // eslint-disable-next-line
                const {[fieldId]: _, ...rest} = state.fieldsById;
                return {
                    fields: newFields,
                    fieldsById: rest
                };
            });
        } catch (error) {
            console.error('Failed to delete section field:', error);
            throw error;
        }
    }
}));

export default useSectionFieldsStore;
