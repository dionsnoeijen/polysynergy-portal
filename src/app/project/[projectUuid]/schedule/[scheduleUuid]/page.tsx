'use client';

import { EditorLayout } from "@/components/editor/editor-layout";
import { useParams } from 'next/navigation';
import React from "react";

export default function Route() {
    const { projectUuid, scheduleUuid } = useParams() as { projectUuid: string, scheduleUuid: string };

    return (
        <EditorLayout projectUuid={projectUuid} scheduleUuid={scheduleUuid} />
    )
}
