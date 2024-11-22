import useGroupsStore from "@/stores/groupStore";
import { useEditorStore } from "@/stores/editorStore";

const useGrouping = () => {

    const { selectedNodes, setSelectedNodes, setOpenGroup } = useEditorStore();
    const { addGroup } = useGroupsStore();

    const createGroup = () => {
        if (selectedNodes.length < 2) return;
        const groupId = addGroup({nodes: selectedNodes});
        setOpenGroup(groupId);
        setSelectedNodes([]);
    };

    return { createGroup };
};

export default useGrouping;
