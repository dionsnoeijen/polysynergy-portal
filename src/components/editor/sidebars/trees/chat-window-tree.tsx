import React, {ReactElement} from "react";
import useChatWindowsStore from "@/stores/chatWindowsStore";
import TreeList from "@/components/editor/sidebars/elements/tree-list";
import Link from "next/link";
import useEditorStore from "@/stores/editorStore";
import {PencilIcon} from "@heroicons/react/24/outline";
import {FormType, Fundamental, ChatWindow} from "@/types/types";
import { useBranding } from "@/contexts/branding-context";

export default function ChatWindowTree(): ReactElement {
    const { accent_color } = useBranding();
    const chatWindows = useChatWindowsStore((state) => state.chatWindows);
    const openForm = useEditorStore((state) => state.openForm);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeChatWindowId = useEditorStore((state) => state.activeChatWindowId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    return (
        <TreeList
            items={chatWindows}
            title={'Chat Windows'}
            activeItem={activeChatWindowId}
            formEditingItem={formEditRecordId as string}
            fundamental={Fundamental.ChatWindow}
            dataTourId={'add-chat-window-button'}
            renderItem={(chatWindow: ChatWindow) => (
                <>
                    <Link href={`/project/${activeProjectId}/chat-window/${chatWindow.id}`}
                        title={`${chatWindow.name} - ${chatWindow.id}`}
                        onClick={() => {
                            // CRITICAL: Disable autosave BEFORE navigation to prevent empty saves
                            useEditorStore.getState().setAutosaveEnabled(false);
                            useEditorStore.getState().setIsLoadingFlow(true);
                            console.log('🔒 Chat window clicked - autosave disabled for switching');
                        }}
                        className={`block flex-1 truncate dark:text-gray-200/80 dark:hover:text-white pt-1 pb-1 ${(activeChatWindowId === chatWindow.id || formEditRecordId === chatWindow.id) ? 'text-white' : 'dark:text-zinc-500'}`}
                        style={{
                            color: (activeChatWindowId === chatWindow.id || formEditRecordId === chatWindow.id) ? 'white' : accent_color
                        }}
                    >
                        {chatWindow.name}
                    </Link>
                    <button
                        onClick={() => openForm(FormType.EditChatWindow, chatWindow.id)}
                        type="button"
                        className={`p-2 rounded focus:outline-none active:text-zinc-200 group`}
                    >
                        <PencilIcon className={`w-4 h-4 transition-colors duration-200 dark:text-white/70 ${activeChatWindowId === chatWindow.id || formEditRecordId === chatWindow.id ? 'text-white' : ''}`}
                            style={{
                                color: (activeChatWindowId === chatWindow.id || formEditRecordId === chatWindow.id) ? 'white' : accent_color
                            }}
                        />
                    </button>
                </>
            )}
            addButtonClick={() => openForm(FormType.AddChatWindow)}
        />
    );
}
