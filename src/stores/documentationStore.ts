import { create } from "zustand";
import { 
    DocumentationCategory, 
    DocumentationDocument, 
    DocumentationSearchResult,
    DocumentationApiResponse,
    DocumentationSearchResponse,
    fetchAllDocumentationAPI,
    fetchCategoriesAPI,
    searchDocumentationAPI,
    fetchDocumentAPI,
    fetchDocumentsByCategoryAPI
} from "@/api/documentationApi";

export type DocumentationType = 'general' | 'node';

type DocumentationStore = {
    // State
    categories: DocumentationCategory[];
    guides: Record<string, DocumentationDocument[]>;
    currentDocument: DocumentationDocument | null;
    searchResults: DocumentationSearchResult[];
    searchQuery: string;
    selectedCategory: string | null;
    documentationType: DocumentationType;
    isLoading: boolean;
    hasInitialFetched: boolean;
    error: string | null;

    // Actions
    setDocumentationType: (type: DocumentationType) => void;
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: string | null) => void;
    fetchCategories: () => Promise<void>;
    searchDocumentation: (query: string) => Promise<void>;
    fetchDocument: (category: string, docId: string) => Promise<void>;
    fetchDocumentsByCategory: (category: string) => Promise<void>;
    clearSearch: () => void;
    clearCurrentDocument: () => void;
    clearError: () => void;
    updateGuides: (newGuides: Record<string, DocumentationDocument[]>) => void;
};

const useDocumentationStore = create<DocumentationStore>((set, get) => ({
    // Initial state
    categories: [],
    guides: {},
    currentDocument: null,
    searchResults: [],
    searchQuery: '',
    selectedCategory: null,
    documentationType: 'general',
    isLoading: false,
    hasInitialFetched: false,
    error: null,

    // Actions
    setDocumentationType: (type) => {
        set({ documentationType: type });
    },

    setSearchQuery: (query) => {
        set({ searchQuery: query });
        if (query.trim()) {
            get().searchDocumentation(query);
        } else {
            get().clearSearch();
        }
    },

    setSelectedCategory: (category) => {
        set({ selectedCategory: category, currentDocument: null });
        // Always fetch documents for the selected category
        if (category) {
            get().fetchDocumentsByCategory(category);
        }
    },

    fetchCategories: async () => {
        if (get().hasInitialFetched) return;
        
        set({ isLoading: true, error: null });
        try {
            const response = await fetchCategoriesAPI();
            console.log('Categories API response:', response);
            set({ 
                categories: response.categories || [],
                hasInitialFetched: true,
                isLoading: false 
            });
        } catch (error) {
            console.error('Categories fetch error:', error);
            set({ 
                error: error instanceof Error ? error.message : 'Failed to fetch categories',
                isLoading: false 
            });
        }
    },

    searchDocumentation: async (query) => {
        set({ isLoading: true, error: null, currentDocument: null });
        try {
            const response: DocumentationSearchResponse = await searchDocumentationAPI(query);
            set({ 
                searchResults: response.results || [],
                isLoading: false 
            });
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Search failed',
                isLoading: false 
            });
        }
    },

    fetchDocument: async (category: string, docId: string) => {
        set({ isLoading: true, error: null });
        try {
            const document = await fetchDocumentAPI(category, docId);
            set({ 
                currentDocument: document,
                isLoading: false 
            });
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to fetch document',
                isLoading: false 
            });
        }
    },

    fetchDocumentsByCategory: async (category) => {
        set({ isLoading: true, error: null });
        try {
            console.log('Fetching documents for category:', category);
            const response = await fetchDocumentsByCategoryAPI(category);
            console.log('Category documents response:', response);
            // Update the guides with the fetched documents for this category
            const updatedGuides = { 
                ...get().guides, 
                [category]: response.documents || [] 
            };
            console.log('Updated guides:', updatedGuides);
            set({ 
                guides: updatedGuides,
                isLoading: false 
            });
        } catch (error) {
            console.error('Fetch documents error:', error);
            set({ 
                error: error instanceof Error ? error.message : 'Failed to fetch documents',
                isLoading: false 
            });
        }
    },

    clearSearch: () => {
        set({ searchResults: [], searchQuery: '' });
    },

    clearCurrentDocument: () => {
        set({ currentDocument: null });
    },

    clearError: () => {
        set({ error: null });
    },

    updateGuides: (newGuides) => {
        set({ guides: { ...get().guides, ...newGuides } });
    },
}));

export default useDocumentationStore;