import React, {useState, useEffect, useCallback} from "react";
import useEditorStore from "@/stores/editorStore";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Input} from "@/components/input";
import {Button} from "@/components/button";
import {Secret, FormType} from "@/types/types";
import {XMarkIcon, Cog6ToothIcon} from "@heroicons/react/24/outline";
import {
    createProjectSecretAPI,
    updateProjectSecretAPI,
    fetchProjectSecretsAPI,
    deleteProjectSecretAPI
} from "@/api/secretsApi";
import {Text} from "@/components/text";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";

import useProjectSecretsStore from "@/stores/projectSecretsStore";
import useStagesStore from "@/stores/stagesStore";

import {fetchSecretsWithRetry} from "@/utils/filesSecretsWithRetry";

const ProjectSecretsForm: React.FC = () => {
    const stages = useStagesStore((state) => state.stages);

    const closeForm = useEditorStore((state) => state.closeForm);
    const openForm = useEditorStore((state) => state.openForm);
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const fetchSecrets = useProjectSecretsStore((state) => state.fetchSecrets);

    const [key, setKey] = useState("");
    const [values, setValues] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [stagesWithValue, setStagesWithValue] = useState<string[]>([]);
    const [savingStages, setSavingStages] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (formType === FormType.EditProjectSecret && formEditRecordId && activeProjectId) {
            fetchProjectSecretsAPI(activeProjectId)
                .then((secrets: Secret[]) => {
                    const secret = secrets.find(s => s.key === formEditRecordId);
                    if (secret) {
                        setKey(secret.key);
                        setStagesWithValue(secret.stages || []);
                    }
                })
                .catch(() => {
                    setError("Failed to load secret details.");
                });
        }
    }, [formType, formEditRecordId, activeProjectId]);

    const handleSave = async (stage: string) => {
        if (!values[stage]?.trim()) {
            setError(`Missing value for ${stage}`);
            setSuccess(null);
            return;
        }
        
        setSavingStages(prev => ({ ...prev, [stage]: true }));
        setError(null);
        setSuccess(null);
        
        try {
            if (activeProjectId) {
                // Use PUT if this stage already has a value, POST if it's new
                if (stagesWithValue.includes(stage)) {
                    await updateProjectSecretAPI(activeProjectId, key, values[stage], stage);
                } else {
                    await createProjectSecretAPI(activeProjectId, key, values[stage], stage);
                }
            }
            await fetchSecretsWithRetry(fetchSecrets);
            setSuccess(`Secret saved successfully for ${stage}`);
            setValues(prev => ({ ...prev, [stage]: "" }));
            
            // Update stagesWithValue to reflect the new saved value
            if (!stagesWithValue.includes(stage)) {
                setStagesWithValue(prev => [...prev, stage]);
            }
            
            // Auto-clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "An error occurred.");
        } finally {
            setSavingStages(prev => ({ ...prev, [stage]: false }));
        }
    };

    const handleCancel = (e: React.FormEvent) => {
        e.preventDefault();
        closeForm();
    };

    const handleDelete = useCallback(async () => {
        await deleteProjectSecretAPI(activeProjectId as string, formEditRecordId as string);
        closeForm("Secret deleted successfully");
        setShowDeleteAlert(false);
        await fetchSecretsWithRetry(fetchSecrets);
    }, [activeProjectId, closeForm, fetchSecrets, formEditRecordId]);

    return (
        <form onSubmit={handleCancel} className="p-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>{formType === FormType.EditProjectSecret ? "Edit Secret" : "Add Secret"}</Heading>
                <Button type="button" onClick={() => closeForm()} color={"sky"}>
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>

            <Divider className="my-4" soft bleed/>
            <div className="flex items-center justify-between gap-4">
                <Text>The secret key is shared, but values are stage-specific. Secret values are never shown after creation
                    or update.</Text>
                <Button
                    type="button"
                    onClick={() => openForm(FormType.ProjectPublish)}
                    color="sky"
                    className="shrink-0"
                >
                    <Cog6ToothIcon className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Manage Stages</span>
                </Button>
            </div>
            <Divider className="my-10" soft bleed/>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            {success && <p className="text-green-500 mb-4">{success}</p>}

            <div className="mb-6">
                <label className="block mb-1 font-medium">Secret Key</label>
                <Text className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                    The name of the secret (e.g., AWS_SECRET_KEY, STRIPE_API_KEY)
                </Text>
                <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g., AWS_SECRET_KEY or STRIPE_API_KEY"
                    disabled={formType === FormType.EditProjectSecret}
                />
            </div>

            <Divider className="my-6" soft bleed/>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Key:</strong> The name is shared across all stages<br/>
                    <strong>Value:</strong> Each stage can have its own secret value (never shown after saving)
                </p>
            </div>

            {stages.map((stage) => (
                <div key={stage.name} className="mb-4">
                    <label className="block font-medium mb-1">
                        Value for <span className="text-sky-600 dark:text-sky-400">{stage.name}</span> stage
                        {" "}
                        {stagesWithValue.includes(stage.name) && (
                            <span className="text-xs text-zinc-500 dark:text-white/50">
                                (currently set, hidden, can be overridden)
                            </span>
                        )}
                    </label>
                    <div className="relative flex gap-2 items-center">
                        <Input
                            type="password"
                            value={values[stage.name] || ""}
                            onChange={(e) =>
                                setValues((prev) => ({...prev, [stage.name]: e.target.value}))
                            }
                            placeholder={stagesWithValue.includes(stage.name) ? "Enter new value to override (hidden)" : `Enter the secret value for ${key || 'this key'} in ${stage.name}`}
                        />
                        <Button
                            color={"sky"}
                            onClick={() => handleSave(stage.name)}
                            disabled={savingStages[stage.name] || !key.trim()}
                        >
                            {savingStages[stage.name] ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            ))}

            {formType === FormType.EditProjectSecret && (
                <>
                    <Divider className="my-10" soft bleed/>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Delete</Subheading>
                            <Text>This action cannot be undone</Text>
                        </div>
                        <div className="flex justify-end self-center">
                            <Button color="red" type="button" onClick={() => setShowDeleteAlert(true)}>
                                Delete secret
                            </Button>
                        </div>
                    </section>
                </>
            )}

            {showDeleteAlert && (
                <Alert
                    size="md"
                    className="text-center"
                    open={showDeleteAlert}
                    onClose={() => setShowDeleteAlert(false)}
                >
                    <AlertTitle>Are you sure you want to delete this secret?</AlertTitle>
                    <AlertDescription>This action cannot be undone.</AlertDescription>
                    <AlertActions>
                        <Button onClick={() => setShowDeleteAlert(false)} plain>
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleDelete}>
                            Yes, delete
                        </Button>
                    </AlertActions>
                </Alert>
            )}
        </form>
    );
};

export default ProjectSecretsForm;