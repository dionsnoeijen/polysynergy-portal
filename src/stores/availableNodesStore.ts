import { create } from "zustand";
import { Node } from "@/types/types";
import { fetchAvailableNodesAPI } from "@/api/availableNodesApi";
import { addIdsToAvailableNodes } from "@/stores/helpers/addIdsToAvailableNodes";
import useEditorStore from "@/stores/editorStore";

type CategoryChild = {
    name: string;
    count: number;
    originalCategory: string; // Maps back to original flat category name
};

type HierarchicalCategory = {
    name: string;
    count: number;
    children: CategoryChild[];
    expanded: boolean;
    isFlat: boolean; // True if this category has no underscore (no children)
};

// Helper function to transform flat categories to hierarchical structure
const createHierarchicalCategories = (categoryMap: Map<string, number>): HierarchicalCategory[] => {
    const hierarchical = new Map<string, HierarchicalCategory>();

    // Process each category
    categoryMap.forEach((count, categoryName) => {
        if (categoryName.includes('_')) {
            // Has underscore - split into parent and child
            const [parentName, ...childParts] = categoryName.split('_');
            const childName = childParts.join('_'); // In case of multiple underscores

            // Get or create parent category
            if (!hierarchical.has(parentName)) {
                hierarchical.set(parentName, {
                    name: parentName,
                    count: 0,
                    children: [],
                    expanded: false,
                    isFlat: false
                });
            }

            const parent = hierarchical.get(parentName)!;
            parent.count += count;
            parent.children.push({
                name: childName,
                count,
                originalCategory: categoryName
            });
        } else {
            // No underscore - flat category
            hierarchical.set(categoryName, {
                name: categoryName,
                count,
                children: [],
                expanded: false,
                isFlat: true
            });
        }
    });

    // Sort children within each parent and sort parents
    const result = Array.from(hierarchical.values());
    result.forEach(parent => {
        parent.children.sort((a, b) => a.name.localeCompare(b.name));
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
};

type AvailableNodeStore = {
    selectedNodeIndex: number;
    selectedCategory: string | null;
    selectedParentCategory: string | null;
    isFetching?: boolean;
    hasInitialFetched?: boolean;
    setSelectedNodeIndex: (index: number | ((prevIndex: number) => number)) => void;
    resetSelectedNodeIndex: () => void;
    setSelectedCategory: (category: string | null) => void;
    setSelectedParentCategory: (parentCategory: string | null) => void;
    toggleCategoryExpanded: (categoryName: string) => void;
    availableNodes: Node[];
    getAvailableNodeById: (id: string) => Node | undefined;
    getAvailableNodeByPath: (path: string) => Node | undefined;
    filteredAvailableNodes: Node[];
    categories: { name: string; count: number }[]; // Keep legacy for backwards compat
    hierarchicalCategories: HierarchicalCategory[];
    searchPhrase: string;
    setSearchPhrase: (phrase: string) => void;
    filterAvailableNodes: () => void; // Geen argument meer nodig
    fetchAvailableNodes: () => void;
};

const useAvailableNodeStore = create<AvailableNodeStore>((set, get) => ({
    selectedNodeIndex: -1,
    selectedCategory: null,
    selectedParentCategory: null,
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
    setSelectedParentCategory: (parentCategory) => {
        set({ selectedParentCategory: parentCategory, selectedCategory: null, selectedNodeIndex: -1 });
        get().filterAvailableNodes();
    },
    toggleCategoryExpanded: (categoryName) => {
        const hierarchicalCategories = get().hierarchicalCategories.map(cat =>
            cat.name === categoryName
                ? { ...cat, expanded: !cat.expanded }
                : cat
        );
        set({ hierarchicalCategories });
    },
    availableNodes: [],
    getAvailableNodeById: (id: string) => get().availableNodes.find((node) => node.id === id),
    getAvailableNodeByPath: (path: string) => get().availableNodes.find((node) => node.path === path),
    filteredAvailableNodes: [],
    categories: [], // Keep legacy
    hierarchicalCategories: [],
    searchPhrase: "",
    setSearchPhrase: (phrase) => {
        set({ searchPhrase: phrase });
        get().filterAvailableNodes(); // Trigger filter bij verandering van search phrase
    },
    filterAvailableNodes: () => {
        const searchLower = get().searchPhrase.toLowerCase();
        const selectedCategory = get().selectedCategory;
        const selectedParentCategory = get().selectedParentCategory;



        // First filter out hidden nodes
        let nodesToFilter = get().availableNodes.filter(node => node.category !== 'hidden');

        // Handle hierarchical category filtering
        if (selectedCategory) {
            // Specific child category selected (e.g., "agent" from "agno_agent")
            nodesToFilter = nodesToFilter.filter(node => node.category === selectedCategory);
        } else if (selectedParentCategory) {
            // Parent category selected (e.g., "agno") - show all children
            nodesToFilter = nodesToFilter.filter(node =>
                node.category.startsWith(selectedParentCategory + '_') ||
                node.category === selectedParentCategory
            );
        }

        // Handle search with smart category expansion
        if (searchLower) {
            const searchResults = nodesToFilter.filter((node) =>
                node.name.toLowerCase().includes(searchLower) ||
                node.category.toLowerCase().includes(searchLower)
            );

            // Auto-expand categories if search matches hierarchical pattern (e.g., "agno_agent")
            if (searchLower.includes('_')) {
                const hierarchicalCategories = get().hierarchicalCategories.map(cat => {
                    const shouldExpand = searchResults.some(node =>
                        node.category.startsWith(cat.name + '_')
                    );
                    return shouldExpand ? { ...cat, expanded: true } : cat;
                });
                set({ hierarchicalCategories });
            }

            nodesToFilter = searchResults;
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

            // Create hierarchical categories
            const hierarchicalCategories = createHierarchicalCategories(categoryMap);

            set({ availableNodes: data, categories, hierarchicalCategories, hasInitialFetched: true });
            get().filterAvailableNodes();
        } catch (error) {
            console.error("Failed to fetch available nodes:", error);
        } finally {
            set({ isFetching: false });
        }
    },
}));

export type { HierarchicalCategory, CategoryChild };
export default useAvailableNodeStore;