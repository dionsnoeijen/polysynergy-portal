'use client';

import { EditorLayout } from "@/components/editor/editor-layout";
import { useParams } from 'next/navigation';
import React from "react";

export default function Project() {
    const { projectUuid } = useParams() as { projectUuid: string };

    return (
        <EditorLayout projectUuid={projectUuid} />
    )
}
