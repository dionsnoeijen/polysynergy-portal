import useEditorStore from '@/stores/editorStore';
import useAvailableNodeStore from '@/stores/availableNodesStore';
import { useAutoFetch } from './useAutoFetch';

export const useLayoutState = () => {
    const fetchAvailableNodes = useAvailableNodeStore((state) => state.fetchAvailableNodes);
    
    const showForm = useEditorStore((state) => state.showForm);
    const isFormOpen = useEditorStore((state) => state.isFormOpen);
    const showDocs = useEditorStore((state) => state.showDocs);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const closeFormMessage = useEditorStore((state) => state.closeFormMessage);
    const isExecuting = useEditorStore((state) => state.isExecuting);

    // Auto-fetch hook
    useAutoFetch();

    return {
        // State selectors
        showForm,
        isFormOpen,
        showDocs,
        activeVersionId,
        closeFormMessage,
        isExecuting,
        
        // Functions
        fetchAvailableNodes
    };
};