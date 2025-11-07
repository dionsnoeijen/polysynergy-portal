import {create, StateCreator} from 'zustand';
import {
    fetchSectionRecords as fetchSectionRecordsAPI,
    fetchTableConfig as fetchTableConfigAPI,
    createSectionRecord as createSectionRecordAPI,
    updateSectionRecord as updateSectionRecordAPI,
    deleteSectionRecord as deleteSectionRecordAPI,
    SectionRecordsResponse,
    FetchRecordsParams,
    TableConfig,
} from '@/api/sectionsApi';
import useEditorStore from "@/stores/editorStore";

// Filter types
export type FilterOperator = 'contains' | 'equals' | 'not_equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'is_empty' | 'is_not_empty' | 'is_before' | 'is_after';

export type ColumnFilter = {
    operator: FilterOperator;
    value: string;
};

type SectionDataStore = {
    reset: () => void;

    // Active section
    activeSectionId: string | null;
    setActiveSectionId: (sectionId: string | null) => void;

    // Table configuration
    tableConfig: TableConfig | null;
    isFetchingTableConfig: boolean;
    fetchTableConfig: (sectionId: string) => Promise<void>;

    // Records data
    records: Record<string, unknown>[];
    recordsById: Record<string, Record<string, unknown>>;
    total: number;
    hasMore: boolean;

    // Pagination & Sorting
    limit: number;
    offset: number;
    orderBy: string;
    orderDirection: 'ASC' | 'DESC';

    // Search
    searchQuery: string;

    // Filters
    filters: Record<string, ColumnFilter>;

    // Loading states
    isFetchingRecords: boolean;

    // Form state
    isFormOpen: boolean;
    formMode: 'create' | 'edit' | null;
    editingRecordId: string | null;
    openCreateForm: () => void;
    openEditForm: (recordId: string) => void;
    closeForm: () => void;

    // Actions
    fetchRecords: (sectionId: string, params?: FetchRecordsParams) => Promise<void>;
    refreshRecords: () => Promise<void>;
    setPage: (offset: number) => Promise<void>;
    setSorting: (orderBy: string, orderDirection: 'ASC' | 'DESC') => Promise<void>;
    setSearch: (searchQuery: string) => Promise<void>;
    setFilter: (fieldHandle: string, filter: ColumnFilter | null) => Promise<void>;
    clearFilters: () => Promise<void>;
    createRecord: (sectionId: string, data: Record<string, unknown>) => Promise<void>;
    updateRecord: (sectionId: string, recordId: string, data: Record<string, unknown>) => Promise<void>;
    deleteRecord: (sectionId: string, recordId: string) => Promise<void>;
};

const useSectionDataStore = create<SectionDataStore>((
    set: Parameters<StateCreator<SectionDataStore>>[0],
    get: Parameters<StateCreator<SectionDataStore>>[1]
) => ({
    reset: () => {
        set({
            activeSectionId: null,
            tableConfig: null,
            isFetchingTableConfig: false,
            records: [],
            recordsById: {},
            total: 0,
            hasMore: false,
            limit: 50,
            offset: 0,
            orderBy: 'created_at',
            orderDirection: 'DESC',
            searchQuery: '',
            filters: {},
            isFetchingRecords: false,
            isFormOpen: false,
            formMode: null,
            editingRecordId: null,
        });
    },

    // Initial state
    activeSectionId: null,
    tableConfig: null,
    isFetchingTableConfig: false,
    records: [],
    recordsById: {},
    total: 0,
    hasMore: false,
    limit: 50,
    offset: 0,
    orderBy: 'created_at',
    orderDirection: 'DESC',
    searchQuery: '',
    filters: {},
    isFetchingRecords: false,
    isFormOpen: false,
    formMode: null,
    editingRecordId: null,

    setActiveSectionId: (sectionId: string | null) => {
        // Close form when switching sections to prevent fetching wrong records
        set({
            activeSectionId: sectionId,
            isFormOpen: false,
            formMode: null,
            editingRecordId: null
        });
    },

    openCreateForm: () => {
        set({ isFormOpen: true, formMode: 'create', editingRecordId: null });
    },

    openEditForm: (recordId: string) => {
        set({ isFormOpen: true, formMode: 'edit', editingRecordId: recordId });
    },

    closeForm: () => {
        set({ isFormOpen: false, formMode: null, editingRecordId: null });
    },

    fetchTableConfig: async (sectionId: string) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        set({ isFetchingTableConfig: true });
        try {
            const config = await fetchTableConfigAPI(sectionId, activeProjectId);
            set({
                tableConfig: config,
                orderBy: config.default_sort.field,
                orderDirection: config.default_sort.direction,
            });
        } finally {
            set({ isFetchingTableConfig: false });
        }
    },

    fetchRecords: async (sectionId: string, params?: FetchRecordsParams) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        const state = get();
        const fetchParams: FetchRecordsParams = {
            limit: params?.limit ?? state.limit,
            offset: params?.offset ?? state.offset,
            order_by: params?.order_by ?? state.orderBy,
            order_direction: params?.order_direction ?? state.orderDirection,
            search: params?.search ?? (state.searchQuery || undefined),
        };

        set({ isFetchingRecords: true });
        try {
            const response: SectionRecordsResponse = await fetchSectionRecordsAPI(
                sectionId,
                activeProjectId,
                fetchParams
            );

            // Build recordsById map
            const recordsById = response.records.reduce<Record<string, Record<string, unknown>>>((acc, record) => {
                const id = record.id as string;
                if (id) {
                    acc[id] = record;
                }
                return acc;
            }, {});

            set({
                records: response.records,
                recordsById,
                total: response.total,
                hasMore: response.has_more,
                limit: response.limit,
                offset: response.offset,
                activeSectionId: sectionId,
            });
        } finally {
            set({ isFetchingRecords: false });
        }
    },

    refreshRecords: async () => {
        const state = get();
        if (!state.activeSectionId) return;

        await state.fetchRecords(state.activeSectionId, {
            limit: state.limit,
            offset: state.offset,
            order_by: state.orderBy,
            order_direction: state.orderDirection,
            search: state.searchQuery || undefined,
        });
    },

    setPage: async (offset: number) => {
        const state = get();
        if (!state.activeSectionId) return;

        set({ offset });
        await state.fetchRecords(state.activeSectionId, {
            offset,
            limit: state.limit,
            order_by: state.orderBy,
            order_direction: state.orderDirection,
            search: state.searchQuery || undefined,
        });
    },

    setSorting: async (orderBy: string, orderDirection: 'ASC' | 'DESC') => {
        const state = get();
        if (!state.activeSectionId) return;

        set({ orderBy, orderDirection, offset: 0 }); // Reset to first page
        await state.fetchRecords(state.activeSectionId, {
            order_by: orderBy,
            order_direction: orderDirection,
            offset: 0,
            limit: state.limit,
            search: state.searchQuery || undefined,
        });
    },

    setSearch: async (searchQuery: string) => {
        const state = get();
        if (!state.activeSectionId) return;

        set({ searchQuery, offset: 0 }); // Reset to first page when searching
        await state.fetchRecords(state.activeSectionId, {
            search: searchQuery || undefined,
            offset: 0,
            limit: state.limit,
            order_by: state.orderBy,
            order_direction: state.orderDirection,
        });
    },

    setFilter: async (fieldHandle: string, filter: ColumnFilter | null) => {
        const state = get();
        if (!state.activeSectionId) return;

        // Update filters - remove if null, otherwise add/update
        const newFilters = { ...state.filters };
        if (filter === null) {
            delete newFilters[fieldHandle];
        } else {
            newFilters[fieldHandle] = filter;
        }

        set({ filters: newFilters, offset: 0 }); // Reset to first page when filtering

        // Note: The backend API needs to be updated to support filters parameter
        // For now, filters are stored in state but not sent to the backend
        await state.fetchRecords(state.activeSectionId, {
            offset: 0,
            limit: state.limit,
            order_by: state.orderBy,
            order_direction: state.orderDirection,
            search: state.searchQuery || undefined,
        });
    },

    clearFilters: async () => {
        const state = get();
        if (!state.activeSectionId) return;

        set({ filters: {}, offset: 0 }); // Clear all filters and reset to first page
        await state.fetchRecords(state.activeSectionId, {
            offset: 0,
            limit: state.limit,
            order_by: state.orderBy,
            order_direction: state.orderDirection,
            search: state.searchQuery || undefined,
        });
    },

    createRecord: async (sectionId: string, data: Record<string, unknown>) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        const newRecord = await createSectionRecordAPI(sectionId, activeProjectId, data);

        set((state) => ({
            records: [newRecord, ...state.records],
            recordsById: {
                ...state.recordsById,
                [newRecord.id as string]: newRecord,
            },
            total: state.total + 1,
        }));
    },

    updateRecord: async (sectionId: string, recordId: string, data: Record<string, unknown>) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        const updatedRecord = await updateSectionRecordAPI(sectionId, recordId, activeProjectId, data);

        set((state) => ({
            records: state.records.map((r) =>
                (r.id as string) === recordId ? updatedRecord : r
            ),
            recordsById: {
                ...state.recordsById,
                [recordId]: updatedRecord,
            },
        }));
    },

    deleteRecord: async (sectionId: string, recordId: string) => {
        const {activeProjectId} = useEditorStore.getState();
        if (!activeProjectId) return;

        await deleteSectionRecordAPI(sectionId, recordId, activeProjectId);

        set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {[recordId]: _deleted, ...remainingById} = state.recordsById;
            return {
                records: state.records.filter((r) => (r.id as string) !== recordId),
                recordsById: remainingById,
                total: state.total - 1,
            };
        });
    },
}));

export default useSectionDataStore;
