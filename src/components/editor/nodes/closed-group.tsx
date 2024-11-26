import React from "react";
import useGroupsStore, { Group } from "@/stores/groupStore";
import { useEditorStore } from "@/stores/editorStore";

type GroupProps = { group: Group };

const ClosedGroup: React.FC<GroupProps> = ({ group }): React.ReactElement => {

    const { openContextMenu, setOpenGroup, setSelectedNodes } = useEditorStore();
    const { openGroup } = useGroupsStore();

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        openContextMenu(
            e.clientX,
            e.clientY,
            [
                {
                    label: "Open Group",
                    action: () => {
                        openGroup(group.id);
                        setOpenGroup(group.id);
                        setSelectedNodes([]);
                    },
                },
                {
                    label: "Delete Group",
                    action: () => console.log("Delete Group"),
                },
            ]
        );
    };

    return (
        <div
            className="absolute border border-sky-500 dark:border-white rounded-md bg-sky-500 dark:bg-slate-500/20 bg-opacity-25"
            data-type="closed-group"
            onContextMenu={handleContextMenu}
            style={{
                left: group.view.x,
                top: group.view.y,
                width: group.view.width,
                height: group.view.height,
            }}
        >
        </div>
    )
};

export default ClosedGroup;
