'use client';

import { EditorLayout } from "@/components/editor/editor-layout";
import { useParams } from 'next/navigation';
import React from "react";

export default function ChatWindowPage() {
    const { projectUuid, chatWindowUuid } = useParams() as { projectUuid: string, chatWindowUuid: string };

    return (
        <EditorLayout projectUuid={projectUuid} chatWindowUuid={chatWindowUuid} />
    )
}
