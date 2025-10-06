"use client";

import React, {useEffect, useState} from "react";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Text} from "@/components/text";
import useEditorStore from "@/stores/editorStore";
import useChatWindowsStore from "@/stores/chatWindowsStore";
import {XMarkIcon} from "@heroicons/react/24/outline";
import {Input} from "@/components/input";
import {Textarea} from "@/components/textarea";
import {Button} from "@/components/button";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {FormType, ChatWindow} from "@/types/types";
import {useParams, useRouter} from "next/navigation";

const ChatWindowForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const setActiveChatWindowId = useEditorStore((state) => state.setActiveChatWindowId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    const getChatWindow = useChatWindowsStore((state) => state.getChatWindow);
    const storeChatWindow = useChatWindowsStore((state) => state.storeChatWindow);
    const updateChatWindow = useChatWindowsStore((state) => state.updateChatWindow);
    const deleteChatWindow = useChatWindowsStore((state) => state.deleteChatWindow);

    const params = useParams();
    const router = useRouter();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        if (formType === FormType.EditChatWindow && formEditRecordId) {
            const chatWindow = getChatWindow(formEditRecordId as string);
            if (chatWindow) {
                setName(chatWindow.name);
                setDescription(chatWindow.description || "");
            }
        }
    }, [formEditRecordId, formType, getChatWindow]);

    const validateForm = () => {
        const newErrors: string[] = [];
        if (!name || name.trim() === "") {
            newErrors.push("Name is required.");
        }
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        if (!validateForm()) return;

        const payload: ChatWindow = {
            id: formEditRecordId as string ?? undefined,
            name,
            description,
        };

        const action = formType === FormType.AddChatWindow ? storeChatWindow : updateChatWindow;
        const result = await action(payload);

        if (result) {
            closeForm(`${formType === FormType.AddChatWindow ? "Created" : "Updated"} successfully`);
            setActiveChatWindowId(result.id as string);
            setIsExecuting("Loading Chat Window");
            router.push(`/project/${params.projectUuid}/chat-window/${result.id || formEditRecordId}`);

            // Clear executing state after navigation completes
            setTimeout(() => setIsExecuting(null), 100);
        }
    };

    const handleDelete = async () => {
        await deleteChatWindow(activeProjectId, formEditRecordId as string);
        setActiveChatWindowId('');
        closeForm("Chat window deleted");
        setShowDeleteAlert(false);
        setIsExecuting("Deleting Chat Window");
        router.push(`/project/${params.projectUuid}`);

        // Clear executing state after navigation completes
        setTimeout(() => setIsExecuting(null), 100);
    };

    return (
        <form onSubmit={handleSubmit} className="p-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>{formType === FormType.AddChatWindow ? "Add" : "Edit"} Chat Window</Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>
            <Divider className="my-4" soft bleed/>

            {errors.length > 0 && (
                <div className="text-red-500 mb-4">
                    {errors.map((error, idx) => (
                        <p key={idx}>{error}</p>
                    ))}
                </div>
            )}

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Name</Subheading>
                    <Text>Give a meaningful, descriptive name for this chat window</Text>
                </div>
                <div>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Description</Subheading>
                    <Text>Optional description for this chat window</Text>
                </div>
                <div>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            {formType === FormType.EditChatWindow && (
                <>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Delete chat window</Subheading>
                            <Text>This action is permanent</Text>
                        </div>
                        <div className="flex justify-end self-center">
                            <Button color="red" type="button" onClick={() => setShowDeleteAlert(true)}>
                                Delete
                            </Button>
                        </div>
                    </section>
                    <Divider className="my-10" soft bleed />
                </>
            )}

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    {formType === FormType.AddChatWindow ? "Create chat window" : "Update chat window"}
                </Button>
            </div>

            {showDeleteAlert && (
                <Alert open={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
                    <AlertTitle>Are you sure?</AlertTitle>
                    <AlertDescription>This chat window will be removed.</AlertDescription>
                    <AlertActions>
                        <Button plain onClick={() => setShowDeleteAlert(false)}>Cancel</Button>
                        <Button color="red" onClick={handleDelete}>Delete</Button>
                    </AlertActions>
                </Alert>
            )}
        </form>
    );
};

export default ChatWindowForm;
