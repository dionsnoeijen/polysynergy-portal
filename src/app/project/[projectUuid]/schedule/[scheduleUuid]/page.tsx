'use client';

import { EditorLayout } from "@/components/editor/editor-layout";
import { useParams } from 'next/navigation';
import React from "react";

export default function Route() {
    const { projectUuid, scheduleUuid } = useParams();

    return (
        <EditorLayout projectUuid={projectUuid as string} routeUuid={scheduleUuid as string} />
    )
}
