import React from 'react';
import { 
    ArrowPathIcon, 
    CheckCircleIcon, 
    ClockIcon,
    XCircleIcon 
} from "@heroicons/react/24/outline";
import useEditorStore from '@/stores/editorStore';

const AutosaveIndicator: React.FC = () => {
    const autosaveEnabled = useEditorStore(state => state.autosaveEnabled);
    const isSaving = useEditorStore(state => state.isSaving);
    const isLoadingFlow = useEditorStore(state => state.isLoadingFlow);
    const hasLoadedOnce = useEditorStore(state => state.hasLoadedOnce);

    const getStatus = () => {
        // Priority order: most critical states first
        if (!hasLoadedOnce && isLoadingFlow) {
            return { 
                icon: ClockIcon,
                text: 'Autosave: Initial Load', 
                color: 'text-red-500',
                spinning: false
            };
        }
        
        if (!autosaveEnabled && isLoadingFlow) {
            return { 
                icon: ClockIcon,
                text: 'Autosave: Switching...', 
                color: 'text-yellow-500',
                spinning: true
            };
        }
        
        if (!autosaveEnabled) {
            return { 
                icon: XCircleIcon,
                text: 'Autosave: Disabled', 
                color: 'text-orange-500',
                spinning: false
            };
        }
        
        if (isSaving) {
            return { 
                icon: ArrowPathIcon,
                text: 'Autosave: Saving...', 
                color: 'text-blue-500',
                spinning: true
            };
        }
        
        return { 
            icon: CheckCircleIcon,
            text: 'Autosave: Active', 
            color: 'text-green-500',
            spinning: false
        };
    };

    const status = getStatus();
    const IconComponent = status.icon;

    return (
        <div 
            className="flex items-center gap-2 mr-2"
            title={`${status.text}${!autosaveEnabled ? ' - Safe from data loss during loading' : ''}`}
        >
            <IconComponent 
                className={`h-5 w-5 ${status.color} ${status.spinning ? 'animate-spin' : ''}`} 
            />
        </div>
    );
};

export default AutosaveIndicator;