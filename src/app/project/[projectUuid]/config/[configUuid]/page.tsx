'use client';

import { EditorLayout } from "@/components/editor/editor-layout";
import { useParams } from 'next/navigation';
import React from "react";

export default function Route() {
    const { projectUuid, configUuid } = useParams() as { projectUuid: string, configUuid: string };

    return (
        <EditorLayout projectUuid={projectUuid} configUuid={configUuid} />
    )
}
