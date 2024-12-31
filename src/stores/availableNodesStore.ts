import { create } from "zustand";
import { Node } from "@/types/types";
import {fetchAvailableNodesAPI} from "@/api/availableNodesApi";
import {addIdsToAvailableNodes} from "@/stores/helpers/addIdsToAvailableNodes";

type AvailableNodeStore = {
    selectedNodeIndex: number;
    setSelectedNodeIndex: (index: number | ((prevIndex: number) => number)) => void;
    resetSelectedNodeIndex: () => void;
    availableNodes: Node[];
    filteredAvailableNodes: Node[];
    searchPhrase: string;
    setSearchPhrase: (phrase: string) => void;
    filterAvailableNodes: () => void;
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
    filteredAvailableNodes: [],
    searchPhrase: "",
    setSearchPhrase: (phrase) => set({ searchPhrase: phrase }),
    filterAvailableNodes: () => {
        const searchPhrase = get().searchPhrase.toLowerCase();
        const filtered = get().availableNodes.filter((node) =>
            node.name.toLowerCase().includes(searchPhrase)
        );
        set({ filteredAvailableNodes: filtered });
    },
    fetchAvailableNodes: async () => {
        try {
            let data: Node[] = await fetchAvailableNodesAPI();
            data = addIdsToAvailableNodes(data);

            set({ availableNodes: data });
            const searchPhrase = get().searchPhrase.toLowerCase();
            const filtered = data.filter((node) =>
                node.name.toLowerCase().includes(searchPhrase)
            );
            set({ filteredAvailableNodes: filtered });
        } catch (error) {
            console.error("Failed to fetch available nodes:", error);
        }
    },
}));

export default useAvailableNodeStore;