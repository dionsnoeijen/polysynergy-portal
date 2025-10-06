"use client";

import React, {useEffect, useState} from "react";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Text} from "@/components/text";
import useEditorStore from "@/stores/editorStore";
import useChatWindowsStore from "@/stores/chatWindowsStore";
import useAccountsStore from "@/stores/accountsStore";
import {XMarkIcon, TrashIcon} from "@heroicons/react/24/outline";
import {Input} from "@/components/input";
import {Textarea} from "@/components/textarea";
import {Select} from "@/components/select";
import {Checkbox, CheckboxField} from "@/components/checkbox";
import {Label} from "@/components/fieldset";
import {Button} from "@/components/button";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {FormType, ChatWindow, ChatWindowAccess} from "@/types/types";
import {useParams, useRouter} from "next/navigation";
import {
    fetchChatWindowUsersAPI,
    assignUserToChatWindowAPI,
    updateChatWindowUserPermissionsAPI,
    removeUserFromChatWindowAPI
} from "@/api/chatWindowsApi";

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

    const accounts = useAccountsStore((state) => state.accounts);
    const fetchAccounts = useAccountsStore((state) => state.fetchAccounts);

    const params = useParams();
    const router = useRouter();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    // User assignment state
    const [assignedUsers, setAssignedUsers] = useState<ChatWindowAccess[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [newUserPermissions, setNewUserPermissions] = useState({
        can_view_flow: false,
        can_edit_flow: false,
        can_view_output: false,
        show_response_transparency: true
    });

    useEffect(() => {
        // Fetch accounts for user assignment
        if (accounts.length === 0) {
            fetchAccounts();
        }

        if (formType === FormType.EditChatWindow && formEditRecordId) {
            const chatWindow = getChatWindow(formEditRecordId as string);
            if (chatWindow) {
                setName(chatWindow.name);
                setDescription(chatWindow.description || "");
            }

            // Fetch assigned users
            fetchChatWindowUsersAPI(formEditRecordId as string, activeProjectId)
                .then(setAssignedUsers)
                .catch(error => console.error("Failed to fetch assigned users:", error));
        }
    }, [formEditRecordId, formType, getChatWindow, activeProjectId, accounts.length, fetchAccounts]);

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

    const handleAssignUser = async () => {
        if (!selectedAccountId || !formEditRecordId) return;

        try {
            const newAccess = await assignUserToChatWindowAPI(
                formEditRecordId as string,
                activeProjectId,
                {
                    account_id: selectedAccountId,
                    ...newUserPermissions
                }
            );
            setAssignedUsers([...assignedUsers, newAccess]);
            setSelectedAccountId("");
            setNewUserPermissions({
                can_view_flow: false,
                can_edit_flow: false,
                can_view_output: false,
                show_response_transparency: true
            });
        } catch (error) {
            console.error("Failed to assign user:", error);
        }
    };

    const handleRemoveUser = async (accountId: string) => {
        if (!formEditRecordId) return;

        try {
            await removeUserFromChatWindowAPI(
                formEditRecordId as string,
                accountId,
                activeProjectId
            );
            setAssignedUsers(assignedUsers.filter(u => u.account_id !== accountId));
        } catch (error) {
            console.error("Failed to remove user:", error);
        }
    };

    const handleTogglePermission = async (
        accountId: string,
        permission: keyof typeof newUserPermissions,
        value: boolean
    ) => {
        if (!formEditRecordId) return;

        try {
            const updated = await updateChatWindowUserPermissionsAPI(
                formEditRecordId as string,
                accountId,
                activeProjectId,
                { [permission]: value }
            );
            setAssignedUsers(assignedUsers.map(u =>
                u.account_id === accountId ? updated : u
            ));
        } catch (error) {
            console.error("Failed to update permissions:", error);
        }
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
                            <Subheading>User Access</Subheading>
                            <Text>Assign users with specific permissions</Text>
                        </div>
                        <div className="space-y-4">
                            {/* Add new user */}
                            <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-4 space-y-3">
                                <Label>Assign New User</Label>
                                <Select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                >
                                    <option value="">Select a user...</option>
                                    {accounts
                                        .filter(acc => !assignedUsers.some(au => au.account_id === acc.id))
                                        .map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.email} ({account.first_name} {account.last_name})
                                            </option>
                                        ))}
                                </Select>

                                {selectedAccountId && (
                                    <div className="space-y-2">
                                        <CheckboxField>
                                            <Checkbox
                                                checked={newUserPermissions.can_view_flow}
                                                onChange={(checked) =>
                                                    setNewUserPermissions({ ...newUserPermissions, can_view_flow: checked })
                                                }
                                            />
                                            <Label>Can view flow</Label>
                                        </CheckboxField>

                                        <CheckboxField>
                                            <Checkbox
                                                checked={newUserPermissions.can_edit_flow}
                                                onChange={(checked) =>
                                                    setNewUserPermissions({ ...newUserPermissions, can_edit_flow: checked })
                                                }
                                            />
                                            <Label>Can edit flow</Label>
                                        </CheckboxField>

                                        <CheckboxField>
                                            <Checkbox
                                                checked={newUserPermissions.can_view_output}
                                                onChange={(checked) =>
                                                    setNewUserPermissions({ ...newUserPermissions, can_view_output: checked })
                                                }
                                            />
                                            <Label>Can view output</Label>
                                        </CheckboxField>

                                        <CheckboxField>
                                            <Checkbox
                                                checked={newUserPermissions.show_response_transparency}
                                                onChange={(checked) =>
                                                    setNewUserPermissions({ ...newUserPermissions, show_response_transparency: checked })
                                                }
                                            />
                                            <Label>Show response transparency (AI reasoning)</Label>
                                        </CheckboxField>

                                        <Button type="button" onClick={handleAssignUser} className="w-full mt-2">
                                            Assign User
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Assigned users list */}
                            {assignedUsers.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Assigned Users ({assignedUsers.length})</Label>
                                    {assignedUsers.map(access => (
                                        <div
                                            key={access.id}
                                            className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-4 space-y-2"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {access.account.email}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        {access.account.first_name} {access.account.last_name}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    color="red"
                                                    onClick={() => handleRemoveUser(access.account_id)}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                                <CheckboxField>
                                                    <Checkbox
                                                        checked={access.can_view_flow}
                                                        onChange={(checked) =>
                                                            handleTogglePermission(access.account_id, 'can_view_flow', checked)
                                                        }
                                                    />
                                                    <Label>Can view flow</Label>
                                                </CheckboxField>

                                                <CheckboxField>
                                                    <Checkbox
                                                        checked={access.can_edit_flow}
                                                        onChange={(checked) =>
                                                            handleTogglePermission(access.account_id, 'can_edit_flow', checked)
                                                        }
                                                    />
                                                    <Label>Can edit flow</Label>
                                                </CheckboxField>

                                                <CheckboxField>
                                                    <Checkbox
                                                        checked={access.can_view_output}
                                                        onChange={(checked) =>
                                                            handleTogglePermission(access.account_id, 'can_view_output', checked)
                                                        }
                                                    />
                                                    <Label>Can view output</Label>
                                                </CheckboxField>

                                                <CheckboxField>
                                                    <Checkbox
                                                        checked={access.show_response_transparency}
                                                        onChange={(checked) =>
                                                            handleTogglePermission(access.account_id, 'show_response_transparency', checked)
                                                        }
                                                    />
                                                    <Label>Show response transparency</Label>
                                                </CheckboxField>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <Divider className="my-10" soft bleed />
                </>
            )}

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
