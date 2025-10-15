import React, {useCallback, useEffect, useState} from "react";

import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Input} from "@/components/input";
import {Button} from "@/components/button";
import {XMarkIcon, Cog6ToothIcon} from "@heroicons/react/24/outline";
import {Text} from "@/components/text";

import useStagesStore from "@/stores/stagesStore";
import useEditorStore from "@/stores/editorStore";
import useEnvVarsStore from "@/stores/envVarsStore";

import {EnvVar, FormType} from "@/types/types";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import IsExecuting from "@/components/editor/is-executing";

const ProjectEnvVarsForm: React.FC = () => {
    const stages = useStagesStore((state) => state.stages);

    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);

    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const createEnvVar = useEnvVarsStore((state) => state.createEnvVar);
    const closeForm = useEditorStore((state) => state.closeForm);
    const openForm = useEditorStore((state) => state.openForm);
    const deleteEnvVar = useEnvVarsStore((state) => state.deleteEnvVar);
    const getEnvVarByKey = useEnvVarsStore((state) => state.getEnvVarByKey);

    const [key, setKey] = useState("");
    const [values, setValues] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const updateEnvVar = useEnvVarsStore((state) => state.updateEnvVar);
    const envVar = useEnvVarsStore((state) =>
        state.envVars.find((v) => v.key === key)
    );

    const handleSave = async (stage: string) => {
        setIsExecuting("Saving...");
        const value = values[stage];
        if (!key.trim() || !value.trim()) {
            setError("Missing key or value");
            setSuccess(null);
            setIsExecuting(null);
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            if (envVar && envVar.values[stage]) {
                const updated: EnvVar = {
                    ...envVar,
                    values: {
                        ...envVar.values,
                        [stage]: {
                            ...envVar.values[stage],
                            value,
                        },
                    },
                };
                await updateEnvVar(updated, stage);
            } else {
                await createEnvVar(key, value, stage);
            }

            setSuccess(`Variable saved successfully for ${stage}`);
            setValues(prev => ({ ...prev, [stage]: "" }));

            // Auto-clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "An error occurred while saving.");
        } finally {
            setIsExecuting(null);
        }
    };


    const handleDelete = useCallback(async () => {
        if (!formEditRecordId || !activeProjectId) return;

        const envVar = getEnvVarByKey(formEditRecordId as string);
        if (!envVar) return;

        const entries = Object.entries(envVar.values);

        for (const [stage, {id}] of entries) {
            await deleteEnvVar(id, stage);
        }

        setShowDeleteAlert(false);
        closeForm("Variable deleted successfully");
    }, [formEditRecordId, activeProjectId, getEnvVarByKey, closeForm, deleteEnvVar]);

    const handleCancel = () => {
        closeForm();
    };

    useEffect(() => {
        if (
            formType === FormType.EditProjectEnvVar &&
            formEditRecordId &&
            activeProjectId
        ) {
            const ensureEnvVarsLoaded = async () => {
                const envVar = getEnvVarByKey(formEditRecordId as string);
                if (!envVar) {
                    return;
                }

                setKey(envVar.key);
                setValues(
                    Object.fromEntries(
                        Object
                            .entries(envVar?.values || {})
                            .map(([stage, data]) => [stage, data?.value ?? ""])
                    )
                );
            };

            ensureEnvVarsLoaded();
        }
    }, [formType, formEditRecordId, activeProjectId, getEnvVarByKey]);

    return (
        <form onSubmit={(e) => e.preventDefault()} className="p-10">
            <IsExecuting/>

            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>Add Environment Variable</Heading>
                <Button type="button" onClick={handleCancel} color="sky">
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>

            <Divider className="my-4" soft bleed/>
            <div className="flex items-center justify-between gap-4">
                <Text>Define an environment variable across environments. Values are saved per environment.</Text>
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
                <label className="block mb-1 font-medium">Variable Key</label>
                <Text className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                    The name of the variable (e.g., API_KEY, DATABASE_URL)
                </Text>
                <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g., API_KEY or DATABASE_URL"
                />
            </div>

            <Divider className="my-6" soft bleed/>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Key:</strong> The name is shared across all stages<br/>
                    <strong>Value:</strong> Each stage can have its own value
                </p>
            </div>

            {stages.map((stage) => {
                const hasValue = envVar?.values[stage.name]?.value;
                return (
                    <div key={stage.name} className="mb-4">
                        <label className="block font-medium mb-1">
                            Value for <span className="text-sky-600 dark:text-sky-400">{stage.name}</span> stage
                            {" "}
                            {hasValue && (
                                <span className="text-xs text-zinc-500 dark:text-white/50">
                                    (currently set, can be overridden)
                                </span>
                            )}
                        </label>
                        <div className="relative flex gap-2 items-center">
                            <Input
                                value={values[stage.name] || ""}
                                onChange={(e) =>
                                    setValues((prev) => ({...prev, [stage.name]: e.target.value}))
                                }
                                placeholder={hasValue ? "Enter new value to override" : `Enter the value for ${key || 'this key'} in ${stage.name}`}
                            />
                            <Button color={"sky"} onClick={() => handleSave(stage.name)}>Save</Button>
                        </div>
                    </div>
                );
            })}

            {formType === FormType.EditProjectEnvVar && (
                <>
                    <Divider className="my-10" soft bleed/>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Delete</Subheading>
                            <Text>This action cannot be undone</Text>
                        </div>
                        <div className="flex justify-end self-center">
                            <Button color="red" type="button" onClick={() => setShowDeleteAlert(true)}>
                                Delete variable
                            </Button>
                        </div>
                    </section>
                </>
            )}

            {showDeleteAlert && (
            <Alert size="md" className="text-center" open={showDeleteAlert}
                   onClose={() => setShowDeleteAlert(false)}>
                <AlertTitle>Are you sure you want to delete this variable?</AlertTitle>
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

            <Divider className="my-10" soft bleed/>
            <div className="flex justify-end">
                <Button type="button" onClick={handleCancel} plain>
                    Close
                </Button>
            </div>
        </form>
    );
};

export default ProjectEnvVarsForm;