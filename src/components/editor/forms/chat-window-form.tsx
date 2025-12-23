"use client";

import React, {useEffect, useState} from "react";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Text} from "@/components/text";
import useEditorStore from "@/stores/editorStore";
import useChatWindowsStore from "@/stores/chatWindowsStore";
import useEditorTabsStore from "@/stores/editorTabsStore";
import useAccountsStore from "@/stores/accountsStore";
import {XMarkIcon, TrashIcon, ExclamationTriangleIcon} from "@heroicons/react/24/outline";
import {Input} from "@/components/input";
import {Textarea} from "@/components/textarea";
import {Select} from "@/components/select";
import {Checkbox, CheckboxField} from "@/components/checkbox";
import {Label} from "@/components/fieldset";
import {Button} from "@/components/button";
import {Strong} from "@/components/text";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {FormType, ChatWindow, ChatWindowAccess} from "@/types/types";
import {useParams, useRouter} from "next/navigation";
import {
    fetchChatWindowUsersAPI,
    assignUserToChatWindowAPI,
    updateChatWindowUserPermissionsAPI,
    removeUserFromChatWindowAPI
} from "@/api/chatWindowsApi";
import {
    listEmbedTokensAPI,
    createEmbedTokenAPI,
    updateEmbedTokenAPI,
    deleteEmbedTokenAPI,
    EmbedToken
} from "@/api/embedTokensApi";
import {ClipboardIcon, CheckIcon, PlusIcon, KeyIcon} from "@heroicons/react/24/outline";

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
        can_view_output: false,
        show_response_transparency: true
    });
    // For create mode: pending user assignments
    const [pendingUserAssignments, setPendingUserAssignments] = useState<Array<{
        account_id: string;
        can_view_flow: boolean;
        can_view_output: boolean;
        show_response_transparency: boolean;
    }>>([]);

    // Embed tokens state
    const [embedTokens, setEmbedTokens] = useState<EmbedToken[]>([]);
    const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
    const [isCreatingToken, setIsCreatingToken] = useState(false);

    useEffect(() => {
        // Fetch accounts for user assignment
        if (accounts.length === 0) {
            fetchAccounts().catch((error) => {
                console.error('Error fetching accounts:', error);
            });
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

            // Fetch embed tokens
            listEmbedTokensAPI(activeProjectId, formEditRecordId as string)
                .then(setEmbedTokens)
                .catch(error => console.error("Failed to fetch embed tokens:", error));
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
            // For new chat windows, assign pending users
            if (formType === FormType.AddChatWindow && pendingUserAssignments.length > 0) {
                try {
                    await Promise.all(
                        pendingUserAssignments.map(assignment =>
                            assignUserToChatWindowAPI(result.id as string, activeProjectId, assignment)
                        )
                    );
                } catch (error) {
                    console.error("Failed to assign users:", error);
                }
            }

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

        // Close the tab for this chat window
        const tab = useEditorTabsStore.getState().getTabByFundamentalId(
            params.projectUuid as string,
            formEditRecordId as string
        );
        if (tab) {
            useEditorTabsStore.getState().removeTab(params.projectUuid as string, tab.id);
        }

        setActiveChatWindowId('');
        closeForm("Chat window deleted");
        setShowDeleteAlert(false);
        setIsExecuting("Deleting Chat Window");
        router.push(`/project/${params.projectUuid}`);

        // Clear executing state after navigation completes
        setTimeout(() => setIsExecuting(null), 100);
    };

    const handleAssignUser = async () => {
        if (!selectedAccountId) return;

        if (formType === FormType.AddChatWindow) {
            // In create mode, add to pending assignments
            setPendingUserAssignments([
                ...pendingUserAssignments,
                {
                    account_id: selectedAccountId,
                    ...newUserPermissions
                }
            ]);
            setSelectedAccountId("");
            setNewUserPermissions({
                can_view_flow: false,
                can_view_output: false,
                show_response_transparency: true
            });
        } else {
            // In edit mode, assign directly
            if (!formEditRecordId) return;

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
                    can_view_output: false,
                    show_response_transparency: true
                });
            } catch (error) {
                console.error("Failed to assign user:", error);
            }
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

    const handleRemovePendingUser = (accountId: string) => {
        setPendingUserAssignments(pendingUserAssignments.filter(u => u.account_id !== accountId));
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

    const handleTogglePendingPermission = (
        accountId: string,
        permission: keyof typeof newUserPermissions,
        value: boolean
    ) => {
        setPendingUserAssignments(pendingUserAssignments.map(u =>
            u.account_id === accountId ? { ...u, [permission]: value } : u
        ));
    };

    // Embed token handlers
    const handleCreateEmbedToken = async () => {
        if (!formEditRecordId) return;
        setIsCreatingToken(true);
        try {
            const newToken = await createEmbedTokenAPI(activeProjectId, {
                chat_window_id: formEditRecordId as string,
                sessions_enabled: true,
                sidebar_visible: true,
            });
            setEmbedTokens([...embedTokens, newToken]);
        } catch (error) {
            console.error("Failed to create embed token:", error);
        } finally {
            setIsCreatingToken(false);
        }
    };

    const handleToggleEmbedToken = async (tokenId: string, isActive: boolean) => {
        try {
            const updated = await updateEmbedTokenAPI(activeProjectId, tokenId, { is_active: isActive });
            setEmbedTokens(embedTokens.map(t => t.id === tokenId ? updated : t));
        } catch (error) {
            console.error("Failed to update embed token:", error);
        }
    };

    const handleDeleteEmbedToken = async (tokenId: string) => {
        try {
            await deleteEmbedTokenAPI(activeProjectId, tokenId);
            setEmbedTokens(embedTokens.filter(t => t.id !== tokenId));
        } catch (error) {
            console.error("Failed to delete embed token:", error);
        }
    };

    const handleCopyToken = (token: string, tokenId: string) => {
        navigator.clipboard.writeText(token);
        setCopiedTokenId(tokenId);
        setTimeout(() => setCopiedTokenId(null), 2000);
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

            {/* Under Construction Warning */}
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                            Under Active Development
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Chat Windows are currently in active development. Some features may be incomplete or subject to change.
                            Please use with caution and report any issues you encounter.
                        </p>
                    </div>
                </div>
            </div>

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

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>User Access</Subheading>
                    <Text>Assign users with specific permissions</Text>
                </div>
                <div className="space-y-4">
                    {/* Add new user */}
                    <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-4 space-y-3">
                        <Text><Strong>Assign New User</Strong></Text>
                        <Select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                        >
                            <option value="">Select a user...</option>
                            {accounts
                                .filter(acc =>
                                    !assignedUsers.some(au => au.account_id === acc.id) &&
                                    !pendingUserAssignments.some(pu => pu.account_id === acc.id)
                                )
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

                            {/* Assigned users list (Edit mode) */}
                            {formType === FormType.EditChatWindow && assignedUsers.length > 0 && (
                                <div className="space-y-2">
                                    <Text><Strong>Assigned Users ({assignedUsers.length})</Strong></Text>
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

                            {/* Pending users list (Create mode) */}
                            {formType === FormType.AddChatWindow && pendingUserAssignments.length > 0 && (
                                <div className="space-y-2">
                                    <Text><Strong>Users to Assign ({pendingUserAssignments.length})</Strong></Text>
                                    {pendingUserAssignments.map(assignment => {
                                        const account = accounts.find(acc => acc.id === assignment.account_id);
                                        if (!account) return null;

                                        return (
                                            <div
                                                key={assignment.account_id}
                                                className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-4 space-y-2"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {account.email}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                            {account.first_name} {account.last_name}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        color="red"
                                                        onClick={() => handleRemovePendingUser(assignment.account_id)}
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                                    <CheckboxField>
                                                        <Checkbox
                                                            checked={assignment.can_view_flow}
                                                            onChange={(checked) =>
                                                                handleTogglePendingPermission(assignment.account_id, 'can_view_flow', checked)
                                                            }
                                                        />
                                                        <Label>Can view flow</Label>
                                                    </CheckboxField>

                                                    <CheckboxField>
                                                        <Checkbox
                                                            checked={assignment.can_view_output}
                                                            onChange={(checked) =>
                                                                handleTogglePendingPermission(assignment.account_id, 'can_view_output', checked)
                                                            }
                                                        />
                                                        <Label>Can view output</Label>
                                                    </CheckboxField>

                                                    <CheckboxField>
                                                        <Checkbox
                                                            checked={assignment.show_response_transparency}
                                                            onChange={(checked) =>
                                                                handleTogglePendingPermission(assignment.account_id, 'show_response_transparency', checked)
                                                            }
                                                        />
                                                        <Label>Show response transparency</Label>
                                                    </CheckboxField>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    <Divider className="my-10" soft bleed />

            {/* Embed Tokens Section - Only in Edit mode */}
            {formType === FormType.EditChatWindow && (
                <>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Embed Tokens</Subheading>
                            <Text>
                                Create tokens to embed this chat window in external applications.
                                Use the <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">ChatWindow</code> component in your SPA with an embed token.
                            </Text>
                        </div>
                        <div className="space-y-4">
                            {/* Create new token button */}
                            <Button
                                type="button"
                                onClick={handleCreateEmbedToken}
                                disabled={isCreatingToken}
                                className="w-full"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                {isCreatingToken ? "Creating..." : "Create Embed Token"}
                            </Button>

                            {/* Token list */}
                            {embedTokens.length > 0 ? (
                                <div className="space-y-3">
                                    {embedTokens.map((token) => (
                                        <div
                                            key={token.id}
                                            className={`border rounded-lg p-4 space-y-3 ${
                                                token.is_active
                                                    ? "border-zinc-300 dark:border-zinc-700"
                                                    : "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                                            }`}
                                        >
                                            {/* Token header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <KeyIcon className={`w-4 h-4 ${token.is_active ? "text-green-600" : "text-red-500"}`} />
                                                    <span className={`text-xs font-medium ${token.is_active ? "text-green-600" : "text-red-500"}`}>
                                                        {token.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        color={token.is_active ? "amber" : "green"}
                                                        onClick={() => handleToggleEmbedToken(token.id, !token.is_active)}
                                                    >
                                                        {token.is_active ? "Deactivate" : "Activate"}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        color="red"
                                                        onClick={() => handleDeleteEmbedToken(token.id)}
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Token value */}
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-xs bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded font-mono truncate">
                                                    {token.token}
                                                </code>
                                                <Button
                                                    type="button"
                                                    onClick={() => handleCopyToken(token.token, token.id)}
                                                    color="zinc"
                                                    title="Copy token"
                                                >
                                                    {copiedTokenId === token.id ? (
                                                        <CheckIcon className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <ClipboardIcon className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Token stats */}
                                            <div className="flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                                                <span>Created: {new Date(token.created_at).toLocaleDateString()}</span>
                                                <span>Used: {token.usage_count} times</span>
                                                {token.last_used_at && (
                                                    <span>Last used: {new Date(token.last_used_at).toLocaleDateString()}</span>
                                                )}
                                            </div>

                                            {/* Usage example */}
                                            <details className="text-xs">
                                                <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                                                    Show usage example
                                                </summary>
                                                <pre className="mt-2 bg-zinc-100 dark:bg-zinc-800 p-3 rounded overflow-x-auto">
{`<ChatWindow
  embedToken="${token.token}"
  theme="light"
/>`}
                                                </pre>
                                            </details>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
                                    <KeyIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No embed tokens yet</p>
                                    <p className="text-xs">Create a token to embed this chat window</p>
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
