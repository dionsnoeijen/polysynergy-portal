import useGroupsStore from "@/stores/groupStore";
import { useEditorStore } from "@/stores/editorStore";

const useGrouping = () => {

    const { selectedNodes, setSelectedNodes } = useEditorStore();
    const { addGroup } = useGroupsStore();

    const createGroup = () => {
        if (selectedNodes.length < 2) return;
        addGroup({nodes: selectedNodes});
        setSelectedNodes([]);
    };

    return { createGroup };
};

export default useGrouping;
