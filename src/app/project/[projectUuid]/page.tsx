'use client';

import { EditorLayout } from "@/components/editor/editor-layout";
import { useParams } from 'next/navigation';
import React from "react";

export default function Project() {
    const { projectUuid } = useParams();

    return (
        <EditorLayout projectUuid={projectUuid as string} />
    )
}
