import React, {useEffect, useState} from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@/components/table";
import { PencilIcon, TrashIcon, PlusIcon, KeyIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { ApiKey } from "@/types/types";
import useApiKeysStore from "@/stores/apiKeysStore";
import { ConfirmAlert } from "@/components/confirm-alert";
import { generateRandomKey } from "@/utils/generateRandomKey";

const ApiKeyEditor: React.FC = () => {
    const apiKeys = useApiKeysStore((state) => state.apiKeys);
    const fetchApiKeys = useApiKeysStore((state) => state.fetchApiKeys);
    const createApiKey = useApiKeysStore((state) => state.createApiKey);
    const updateApiKey = useApiKeysStore((state) => state.updateApiKey);
    const deleteApiKey = useApiKeysStore((state) => state.deleteApiKey);

    const [newLabel, setNewLabel] = useState("");
    const [newKeyValue, setNewKeyValue] = useState("");

    const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editKey, setEditKey] = useState("");
    const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchApiKeys();
        const initialVisibility: Record<string, boolean> = {};
        apiKeys.forEach((key) => {
            initialVisibility[key.key_id] = false;
        });
        setVisibleKeys(initialVisibility);
    // eslint-disable-next-line
    }, []);

    const handleAddKey = async () => {
        if (!newKeyValue.trim()) return;
        await createApiKey(newLabel.trim(), newKeyValue.trim());
        setNewKeyValue("");
        setNewLabel("");
    };

    const toggleKeyVisibility = (id: string) => {
        setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleStartEdit = (key: ApiKey) => {
        setEditingKeyId(key.key_id);
        setEditLabel(key.label);
        setEditKey(key.key);
    };

    const handleSaveEdit = async () => {
        if (!editingKeyId || !editLabel.trim()) return;

        console.log(editingKeyId);

        await updateApiKey(editingKeyId, editLabel.trim(), editKey.trim());
        setEditingKeyId(null);
    };

    const confirmDeleteKey = (key: ApiKey) => {
        setKeyToDelete(key);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (keyToDelete?.key_id) {
            await deleteApiKey(keyToDelete.key_id);
        }
        setShowDeleteConfirm(false);
        setKeyToDelete(null);
    };

    return (
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-1">
            <Table className="mt-4" dense bleed grid>
                <TableHead>
                    <TableRow>
                        <TableHeader className="w-10" />
                        <TableHeader>Label</TableHeader>
                        <TableHeader>Key</TableHeader>
                        <TableHeader className="w-28 text-right">Actions</TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {apiKeys.map((key) => {
                        const isEditing = editingKeyId === key.key_id;
                        const visible = visibleKeys[key.key_id];

                        return (
                            <TableRow key={key.key_id}>
                                <TableCell>
                                    <KeyIcon className="w-4 h-4 text-sky-500" />
                                </TableCell>
                                <TableCell className="text-sky-500 dark:text-white font-mono">
                                    {isEditing ? (
                                        <Input
                                            autoFocus
                                            value={editLabel}
                                            onChange={(e) => setEditLabel(e.target.value)}
                                        />
                                    ) : (
                                        key.label
                                    )}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-gray-500 flex items-center gap-2">
                                    {isEditing ? (
                                        <Input
                                            autoFocus
                                            value={editKey}
                                            onChange={(e) => setEditKey(e.target.value)}
                                        />
                                    ): (
                                        <>
                                            {visible ? key.key : "••••••••••"}
                                            <Button plain onClick={() => toggleKeyVisibility(key.key_id)}>
                                                {visible ? (
                                                    <EyeSlashIcon className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                    <EyeIcon className="w-4 h-4 text-gray-500" />
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {isEditing ? (
                                            <Button color="sky" onClick={handleSaveEdit}>Save</Button>
                                        ) : (
                                            <Button color="sky" onClick={() => handleStartEdit(key)}>
                                                <PencilIcon className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button color="sky" onClick={() => confirmDeleteKey(key)}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 items-start sm:items-end">
                <div className="flex-1 space-y-2">
                    <Input
                        placeholder="Label (optional)"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <Input
                            placeholder="API Key"
                            value={newKeyValue}
                            onChange={(e) => setNewKeyValue(e.target.value)}
                        />
                        <Button
                            type="button"
                            onClick={() => {
                                const key = generateRandomKey();
                                setNewKeyValue(key);
                            }}
                        >
                            Generate
                        </Button>
                    </div>
                </div>
                <Button color="sky" type="button" onClick={handleAddKey}>
                    <PlusIcon className="w-4 h-4" /> Add API Key
                </Button>
            </div>

            <ConfirmAlert
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Delete API key?"
                description={`Are you sure you want to delete API key \u201c${keyToDelete?.label}”? This cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </section>
    );
};

export default ApiKeyEditor;
