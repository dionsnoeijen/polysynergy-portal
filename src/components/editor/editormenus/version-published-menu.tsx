'use client';

import React from 'react';
import useEditorStore from '@/stores/editorStore';
import useDocumentationStore from '@/stores/documentationStore';
import useNodesStore from '@/stores/nodesStore';
import useMockStore from '@/stores/mockStore';
import SavingIndicator from '@/components/saving-indicator';
import {FormType} from '@/types/types';
import {useHandlePlay} from '@/hooks/editor/useHandlePlay';

import {
    Bars3Icon, 
    ArrowDownTrayIcon,
    PlayIcon,
    ArrowUturnUpIcon,
    AdjustmentsHorizontalIcon,
    BookOpenIcon
} from '@heroicons/react/24/outline';

export default function VersionPublishedMenu() {

    const isSaving = useEditorStore((state) => state.isSaving);
    const openForm = useEditorStore((state) => state.openForm);
    const openDocs = useEditorStore((state) => state.openDocs);
    
    const setDocumentationType = useDocumentationStore((state) => state.setDocumentationType);
    const fetchCategories = useDocumentationStore((state) => state.fetchCategories);
    
    const mainPlayNode = useNodesStore((state) => state.findMainPlayNode());
    const handlePlay = useHandlePlay();
    
    const hasMockData = useMockStore((state) => state.hasMockData);
    const clearMockStore = useMockStore((state) => state.clearMockStore);

    const handleOpenDocs = async () => {
        setDocumentationType('general');
        await fetchCategories();
        openDocs('# Documentation\n\nLoading documentation...');
    };

    return (
        <div
            className="absolute bottom-5 right-5 flex items-center gap-2 p-2 bg-sky-50 dark:bg-zinc-800/80 border border-sky-500/60 dark:border-white/25 rounded-xl z-20">
            
            {/* Play Button */}
            <button 
                disabled={!mainPlayNode}
                className="hover:bg-sky-200 p-1 rounded-md dark:hover:bg-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed" 
                title="Play" 
                onClick={(e) => mainPlayNode && handlePlay(e, mainPlayNode.id)}
                data-tour-id="main-play-button"
            >
                <PlayIcon className="h-5 w-5 text-sky-500 dark:text-white/70"/>
            </button>
            
            {/* Clear Mock Data Button */}
            <button 
                disabled={!hasMockData}
                className={`p-1 rounded-md disabled:cursor-not-allowed ${
                    hasMockData 
                        ? 'hover:bg-sky-200 dark:hover:bg-zinc-400 bg-sky-200 dark:bg-zinc-600' 
                        : 'opacity-50'
                }`}
                title="Clear mock data" 
                onClick={clearMockStore}
                data-tour-id="clear-mock-data-button"
            >
                <ArrowUturnUpIcon className="h-5 w-5 text-sky-500 dark:text-white/70"/>
            </button>
            
            {/* Published Variables Button */}
            <button 
                className="hover:bg-sky-200 p-1 rounded-md dark:hover:bg-zinc-400" 
                title="Published variables" 
                onClick={() => openForm(FormType.PublishedVariableForm)}
                data-tour-id="published-variable-button"
            >
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-sky-500 dark:text-white/70"/>
            </button>
            
            {/* Documentation Button */}
            <button 
                className="hover:bg-sky-200 p-1 rounded-md dark:hover:bg-zinc-400" 
                title="Documentation" 
                onClick={handleOpenDocs}
                data-tour-id="documentation-button"
            >
                <BookOpenIcon className="h-5 w-5 text-sky-500 dark:text-white/70"/>
            </button>
            
            {/* Divider */}
            <div className="w-px h-6 bg-sky-300 dark:bg-zinc-600 mx-1"></div>
            
            {/* Export Button */}
            <button className="hover:bg-sky-200 p-1 rounded-md dark:hover:bg-zinc-400" title="Export sharing package" onClick={() => openForm(FormType.ExportSharing)}>
                <ArrowDownTrayIcon className="h-5 w-5 text-sky-500 dark:text-white/70"/>
            </button>
            
            {/* Publish Button */}
            <button className="hover:bg-sky-200 p-1 rounded-md dark:hover:bg-zinc-400" title="Show the publish overview" onClick={() => openForm(FormType.ProjectPublish)}>
                <Bars3Icon className="h-5 w-5 text-sky-500 dark:text-white/70"/>
            </button>
            
            <SavingIndicator isSaving={isSaving}/>
        </div>
    );
}
