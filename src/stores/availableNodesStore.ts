import { create } from "zustand";
import { Node } from "@/types/types";
import { fetchAvailableNodesAPI } from "@/api/availableNodesApi";
import { addIdsToAvailableNodes } from "@/stores/helpers/addIdsToAvailableNodes";
import useEditorStore from "@/stores/editorStore";

type AvailableNodeStore = {
    selectedNodeIndex: number;
    selectedCategory: string | null;
    isFetching?: boolean;
    hasInitialFetched?: boolean;
    setSelectedNodeIndex: (index: number | ((prevIndex: number) => number)) => void;
    resetSelectedNodeIndex: () => void;
    setSelectedCategory: (category: string | null) => void;
    availableNodes: Node[];
    getAvailableNodeById: (id: string) => Node | undefined;
    getAvailableNodeByPath: (path: string) => Node | undefined;
    filteredAvailableNodes: Node[];
    categories: { name: string; count: number }[];
    searchPhrase: string;
    setSearchPhrase: (phrase: string) => void;
    filterAvailableNodes: () => void; // Geen argument meer nodig
    fetchAvailableNodes: () => void;
};

const useAvailableNodeStore = create<AvailableNodeStore>((set, get) => ({
    selectedNodeIndex: -1,
    selectedCategory: null,
    setSelectedNodeIndex: (update) => {
        const currentIndex =
            typeof update === "function" ? update(get().selectedNodeIndex) : update;
        set({ selectedNodeIndex: currentIndex });
    },
    resetSelectedNodeIndex: () => set({ selectedNodeIndex: -1 }),
    setSelectedCategory: (category) => {
        set({ selectedCategory: category, selectedNodeIndex: -1 });
        get().filterAvailableNodes();
    },
    availableNodes: [],
    getAvailableNodeById: (id: string) => get().availableNodes.find((node) => node.id === id),
    getAvailableNodeByPath: (path: string) => get().availableNodes.find((node) => node.path === path),
    filteredAvailableNodes: [],
    categories: [],
    searchPhrase: "",
    setSearchPhrase: (phrase) => {
        set({ searchPhrase: phrase });
        get().filterAvailableNodes(); // Trigger filter bij verandering van search phrase
    },
    filterAvailableNodes: () => {
        const searchLower = get().searchPhrase.toLowerCase();
        const selectedCategory = get().selectedCategory;

        // First filter out hidden nodes
        let nodesToFilter = get().availableNodes.filter(node => node.category !== 'hidden');

        // Then filter by category if one is selected
        if (selectedCategory) {
            nodesToFilter = nodesToFilter.filter(node => node.category === selectedCategory);
        }

        // Then apply search filter
        if (searchLower) {
            nodesToFilter = nodesToFilter.filter((node) =>
                node.name.toLowerCase().includes(searchLower) ||
                node.category.toLowerCase().includes(searchLower)
            );
        }

        // Sort the filtered nodes
        const sortedNodes = [...nodesToFilter].sort((a, b) => {
            const categoryCompare = a.category.localeCompare(b.category);
            if (categoryCompare !== 0) return categoryCompare;
            return a.name.localeCompare(b.name);
        });

        set({ filteredAvailableNodes: sortedNodes });
    },
    fetchAvailableNodes: async () => {
        const activeProjectId = useEditorStore.getState().activeProjectId;
        if (!activeProjectId) return;
        set({ isFetching: true });
        try {
            let data: Node[] = await fetchAvailableNodesAPI(activeProjectId);
            data = addIdsToAvailableNodes(data);
            
            // Calculate categories with counts, excluding hidden category
            const categoryMap = new Map<string, number>();
            data.forEach(node => {
                if (node.category !== 'hidden') {
                    categoryMap.set(node.category, (categoryMap.get(node.category) || 0) + 1);
                }
            });
            
            const categories = Array.from(categoryMap.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => a.name.localeCompare(b.name));
            
            set({ availableNodes: data, categories, hasInitialFetched: true });
            get().filterAvailableNodes();
        } catch (error) {
            console.error("Failed to fetch available nodes:", error);
        } finally {
            set({ isFetching: false });
        }
    },
}));

export default useAvailableNodeStore;