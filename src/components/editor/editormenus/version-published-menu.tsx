'use client';

import React from 'react';
import useEditorStore from '@/stores/editorStore';
import SavingIndicator from '@/components/saving-indicator';
import {FormType} from '@/types/types';

import {Bars3Icon} from '@heroicons/react/24/outline';

export default function VersionPublishedMenu() {

    const isSaving = useEditorStore((state) => state.isSaving);
    const openForm = useEditorStore((state) => state.openForm);

    return (
        <div
            className="absolute bottom-5 right-5 flex items-center gap-2 p-2 bg-sky-50 dark:bg-zinc-800/80 border border-sky-500/60 dark:border-white/25 rounded-xl z-50">
            <button className="hover:bg-sky-200 p-1 rounded-md dark:hover:bg-zinc-400" title="Show the publish overview" onClick={() => openForm(FormType.ProjectPublish)}>
                <Bars3Icon className="h-5 w-5 text-sky-500 dark:text-white/70"/>
            </button>
            <SavingIndicator isSaving={isSaving}/>
        </div>
    );
}
