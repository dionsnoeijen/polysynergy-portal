import {create, StateCreator} from 'zustand';
import {
    fetchSections as fetchSectionsAPI,
    fetchSection as fetchSectionAPI,
    createSection as createSectionAPI,
    updateSection as updateSectionAPI,
    updateSectionLayout as updateSectionLayoutAPI,
    deleteSection as deleteSectionAPI,
} from '@/api/sectionsApi';
import useEditorStore from "@/stores/editorStore";
import {Section, SectionLayoutConfig} from "@/types/types";

type SectionsStore = {
    reset: () => void;
    isFetching: boolean;
    hasInitialFetched: boolean;
    sections: Section[];
    sectionsById: Record<string, Section>;
    getSection: (sectionId: string) => Section | undefined;
    fetchSections: () => Promise<void>;
    fetchSection: (sectionId: string) => Promise<Section | undefined>;
    createSection: (section: Omit<Section, 'id'>) => Promise<Section | undefined>;
    updateSection: (sectionId: string, section: Partial<Section>) => Promise<void>;
    updateSectionLayout: (sectionId: string, layout: SectionLayoutConfig) => Promise<void>;
    deleteSection: (sectionId: string) => Promise<void>;
};

const useSectionsStore = create<SectionsStore>((
    set: Parameters<StateCreator<SectionsStore>>[0]
) => ({
    reset: () => {
        set({
            sections: [],
            hasInitialFetched: false,
            sectionsById: {},
        });
    },

    isFetching: false,
    hasInitialFetched: false,

    sections: [],
    sectionsById: {},

    getSection: (sectionId): Section | undefined => {
        return useSectionsStore
            .getState()
            .sections
            .find((section) => section.id === sectionId);
    },

    fetchSections: async () => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        set({isFetching: true});
        try {
            const data: Section[] = await fetchSectionsAPI(activeProjectId);
            const sectionsById = data.reduce((acc, section) => {
                acc[section.id] = section;
                return acc;
            }, {} as Record<string, Section>);

            set({
                sections: data,
                sectionsById,
                hasInitialFetched: true
            });
        } finally {
            set({isFetching: false});
        }
    },

    fetchSection: async (sectionId: string) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return undefined;

        const section = await fetchSectionAPI(sectionId, activeProjectId);

        set((state) => ({
            sectionsById: {
                ...state.sectionsById,
                [section.id]: section
            }
        }));

        return section;
    },

    createSection: async (section: Omit<Section, 'id'>) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return undefined;

        const newSection = await createSectionAPI(activeProjectId, section);

        set((state) => ({
            sections: [...state.sections, newSection],
            sectionsById: {
                ...state.sectionsById,
                [newSection.id]: newSection
            }
        }));

        return newSection;
    },

    updateSection: async (sectionId: string, section: Partial<Section>) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        const updatedSection = await updateSectionAPI(sectionId, activeProjectId, section);

        set((state) => ({
            sections: state.sections.map((s) =>
                s.id === sectionId ? updatedSection : s
            ),
            sectionsById: {
                ...state.sectionsById,
                [sectionId]: updatedSection
            }
        }));
    },

    updateSectionLayout: async (sectionId: string, layout: SectionLayoutConfig) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        const updatedSection = await updateSectionLayoutAPI(sectionId, activeProjectId, layout);

        set((state) => ({
            sections: state.sections.map((s) =>
                s.id === sectionId ? updatedSection : s
            ),
            sectionsById: {
                ...state.sectionsById,
                [sectionId]: updatedSection
            }
        }));
    },

    deleteSection: async (sectionId: string) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        await deleteSectionAPI(sectionId, activeProjectId);

        set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {[sectionId]: _deleted, ...remainingById} = state.sectionsById;
            return {
                sections: state.sections.filter((s) => s.id !== sectionId),
                sectionsById: remainingById
            };
        });
    }
}));

export default useSectionsStore;
