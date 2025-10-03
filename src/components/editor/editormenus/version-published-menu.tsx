'use client';

import React from 'react';
import useEditorStore from '@/stores/editorStore';
import useDocumentationStore from '@/stores/documentationStore';
import useMockStore from '@/stores/mockStore';

import {FormType} from '@/types/types';

import {
    // Bars3Icon, 
    ArrowDownTrayIcon,
    PlayIcon,
    ArrowUturnUpIcon,
    AdjustmentsHorizontalIcon,
    BookOpenIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline';

export default function VersionPublishedMenu() {

    // const isSaving = useEditorStore((state) => state.isSaving);
    const openForm = useEditorStore((state) => state.openForm);
    const openDocs = useEditorStore((state) => state.openDocs);
    
    const setDocumentationType = useDocumentationStore((state) => state.setDocumentationType);
    const fetchCategories = useDocumentationStore((state) => state.fetchCategories);
    
    const hasMockData = useMockStore((state) => state.hasMockData);
    const clearMockStore = useMockStore((state) => state.clearMockStore);

    const handleOpenDocs = async () => {
        setDocumentationType('general');
        openDocs(''); // Open with empty content to trigger EnhancedDocs
        try {
            await fetchCategories();
        } catch (error) {
            console.error('Failed to load documentation categories:', error);
        }
    };

    return (
        <div
            className="absolute bottom-2 right-12 flex items-center gap-2 p-2 bg-sky-50 dark:bg-zinc-800/80 border border-sky-500/60 dark:border-white/25 rounded-lg z-20">
            
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
            
            {/* Play Buttons Button */}
            <button 
                className="hover:bg-sky-200 p-1 rounded-md dark:hover:bg-zinc-400" 
                title="Play buttons" 
                onClick={() => openForm(FormType.PlayButtonsForm)}
                data-tour-id="play-buttons-button"
            >
                <PlayIcon className="h-5 w-5 text-sky-500 dark:text-white/70"/>
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
            <button className="hover:bg-sky-200 p-1 rounded-md dark:hover:bg-zinc-400" title="Publish" onClick={() => openForm(FormType.ProjectPublish)}>
                <RocketLaunchIcon className="h-5 w-5 text-sky-500 dark:text-white/70"/>
            </button>
            
        </div>
    );
}
