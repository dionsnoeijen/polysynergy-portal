import { create } from "zustand";
import { Node } from "@/types/types";
import { fetchAvailableNodesAPI } from "@/api/availableNodesApi";
import { addIdsToAvailableNodes } from "@/stores/helpers/addIdsToAvailableNodes";
import useEditorStore from "@/stores/editorStore";

type AvailableNodeStore = {
    selectedNodeIndex: number;
    isFetching?: boolean;
    hasInitialFetched?: boolean;
    setSelectedNodeIndex: (index: number | ((prevIndex: number) => number)) => void;
    resetSelectedNodeIndex: () => void;
    availableNodes: Node[];
    getAvailableNodeById: (id: string) => Node | undefined;
    getAvailableNodeByPath: (path: string) => Node | undefined;
    filteredAvailableNodes: Node[];
    searchPhrase: string;
    setSearchPhrase: (phrase: string) => void;
    filterAvailableNodes: () => void; // Geen argument meer nodig
    fetchAvailableNodes: () => void;
};

const useAvailableNodeStore = create<AvailableNodeStore>((set, get) => ({
    selectedNodeIndex: -1,
    setSelectedNodeIndex: (update) => {
        const currentIndex =
            typeof update === "function" ? update(get().selectedNodeIndex) : update;
        set({ selectedNodeIndex: currentIndex });
    },
    resetSelectedNodeIndex: () => set({ selectedNodeIndex: -1 }),
    availableNodes: [],
    getAvailableNodeById: (id: string) => get().availableNodes.find((node) => node.id === id),
    getAvailableNodeByPath: (path: string) => get().availableNodes.find((node) => node.path === path),
    filteredAvailableNodes: [],
    searchPhrase: "",
    setSearchPhrase: (phrase) => {
        set({ searchPhrase: phrase });
        get().filterAvailableNodes(); // Trigger filter bij verandering van search phrase
    },
    filterAvailableNodes: () => {
        const searchLower = get().searchPhrase.toLowerCase();

        const sortedNodes = [...get().availableNodes].sort((a, b) => {
            const categoryCompare = a.category.localeCompare(b.category);
            if (categoryCompare !== 0) return categoryCompare;
            return a.name.localeCompare(b.name);
        });

        const filtered = sortedNodes.filter((node) =>
            node.name.toLowerCase().includes(searchLower) ||
            node.category.toLowerCase().includes(searchLower)
        );
        set({ filteredAvailableNodes: filtered });
    },
    fetchAvailableNodes: async () => {
        const activeProjectId = useEditorStore.getState().activeProjectId;
        if (!activeProjectId) return;
        set({ isFetching: true });
        try {
            let data: Node[] = await fetchAvailableNodesAPI(activeProjectId);
            data = addIdsToAvailableNodes(data);
            set({ availableNodes: data, hasInitialFetched: true });
            get().filterAvailableNodes();
        } catch (error) {
            console.error("Failed to fetch available nodes:", error);
        } finally {
            set({ isFetching: false });
        }
    },
}));

export default useAvailableNodeStore;