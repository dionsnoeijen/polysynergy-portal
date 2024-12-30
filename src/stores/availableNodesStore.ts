import { create } from 'zustand';

type AvailableNode = {
    id: string;
    name: string;
    category: string;
};

type AvailableNodeStore = {
    selectedNodeIndex: number;
    setSelectedNodeIndex: (index: number) => void;
    resetSelectedNodeIndex: () => void;
    availableNodes: AvailableNode[];
    filteredAvailableNodes: AvailableNode[];
    searchPhrase: string;
    setSearchPhrase: (phrase: string) => void;
    addAvailableNode: (node: AvailableNode) => void;
    filterAvailableNodes: () => void;
};

const useAvailableNodeStore = create<AvailableNodeStore>((set, get) => ({
    selectedNodeIndex: -1,
    setSelectedNodeIndex: (index) => set({ selectedNodeIndex: index }),
    resetSelectedNodeIndex: () => set({ selectedNodeIndex: -1 }),
    availableNodes: [
        {id: '1', name: 'Node Alpha', category: 'Category A'},
        {id: '2', name: 'Node Beta', category: 'Category A'},
        {id: '3', name: 'Node Gamma', category: 'Category B'},
    ],
    filteredAvailableNodes: [],
    searchPhrase: '',
    setSearchPhrase: (phrase) =>
        set({searchPhrase: phrase}, false, 'setSearchPhrase'),
    addAvailableNode: (node) =>
        set(
            (state) => ({availableNodes: [...state.availableNodes, node]}),
            false,
            'addAvailableNode'
        ),
    filterAvailableNodes: () => {
        const searchPhrase = get().searchPhrase.toLowerCase();
        const availableNodes = get().availableNodes;
        const filteredAvailableNodes = availableNodes.filter((node) =>
            node.name.toLowerCase().includes(searchPhrase)
        );
        set({filteredAvailableNodes}, false, 'filterAvailableNodes');
    },
}));

export default useAvailableNodeStore;