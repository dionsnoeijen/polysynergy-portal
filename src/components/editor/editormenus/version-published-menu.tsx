'use client';

import React from 'react';
import {Button} from '@/components/button';
import useEditorStore from '@/stores/editorStore';
import SavingIndicator from '@/components/saving-indicator';
import {FormType} from '@/types/types';

import {Bars3Icon} from '@heroicons/react/24/outline';

export default function VersionPublishedMenu() {

    const isSaving = useEditorStore((state) => state.isSaving);
    // const isPublished = useEditorStore((state) => state.isPublished);
    const openForm = useEditorStore((state) => state.openForm);

    return (
        <div
            className="absolute bottom-5 right-5 flex items-center gap-2 p-2 bg-zinc-800 bg-opacity-80 border border-white/25 rounded-xl z-50">
            <Button plain title="Show the publish overview" onClick={() => openForm(FormType.ProjectPublish)}>
                <Bars3Icon className="h-6 w-6"/>
            </Button>
            <SavingIndicator isSaving={isSaving}/>
        </div>
    );
}
