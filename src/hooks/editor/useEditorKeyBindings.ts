import useEditorStore from '@/stores/editorStore';
import { useKeyBindings } from './useKeyBindings';
import { useDeleteNode } from './nodes/useDeleteNode';
import useGrouping from './nodes/useGrouping';
import useDraggable from './nodes/useDraggable';

export const useEditorKeyBindings = () => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const setDeleteNodesDialogOpen = useEditorStore((state) => state.setDeleteNodesDialogOpen);
    const setShowAddingNode = useEditorStore((state) => state.setShowAddingNode);
    const copySelectedNodes = useEditorStore((state) => state.copySelectedNodes);
    const pasteNodes = useEditorStore((state) => state.pasteNodes);
    const chatMode = useEditorStore((state) => state.chatMode);

    const { handleDeleteSelectedNodes } = useDeleteNode();
    const { createGroup } = useGrouping();
    const { startDraggingAfterPaste } = useDraggable();

    const handleConfirmDelete = () => {
        handleDeleteSelectedNodes(selectedNodes);
        setDeleteNodesDialogOpen(false);
    };

    const handleCancelDelete = () => {
        setDeleteNodesDialogOpen(false);
    };

    useKeyBindings({
        'delete': {
            handler: () => {
                if (selectedNodes.length > 0) setDeleteNodesDialogOpen(true);
            },
            condition: () => selectedNodes.length > 0
        },
        'x': {
            handler: () => {
                if (selectedNodes.length > 0) setDeleteNodesDialogOpen(true);
            },
            condition: () => selectedNodes.length > 0
        },
        'backspace': {
            handler: () => {
                if (selectedNodes.length > 0) setDeleteNodesDialogOpen(true);
            },
            condition: () => selectedNodes.length > 0
        },
        'a': {
            handler: () => setShowAddingNode(true),
            condition: () => !chatMode
        },
        'shift+a': {
            handler: () => setShowAddingNode(true),
            condition: () => !chatMode
        },
        'ctrl+shift+g': {
            handler: () => console.log('DEGROUP'),
            condition: () => selectedNodes.length > 0
        },
        'ctrl+g': {
            handler: () => createGroup(),
            condition: () => selectedNodes.length > 0
        },
        'ctrl+d': {
            handler: () => console.log('Duplicate selected nodes'),
            condition: () => selectedNodes.length > 0
        },
        'ctrl+x': {
            handler: () => console.log('Cut selected nodes'),
            condition: () => selectedNodes.length > 0
        },
        'ctrl+c': {
            handler: async () => await copySelectedNodes(),
            condition: () => selectedNodes.length > 0
        },
        'ctrl+v': {
            handler: async () => {
                const pastedNodeIds = await pasteNodes();
                startDraggingAfterPaste(pastedNodeIds);
            },
            condition: () => true
        }
    });

    return {
        handleConfirmDelete,
        handleCancelDelete
    };
};