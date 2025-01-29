'use client';

import { EditorLayout } from "@/components/editor/editor-layout";
import { useParams } from 'next/navigation';
import React from "react";

export default function Route() {
    const { projectUuid, blueprintUuid } = useParams() as { projectUuid: string, blueprintUuid: string };

    return (
        <EditorLayout projectUuid={projectUuid} blueprintUuid={blueprintUuid} />
    )
}
