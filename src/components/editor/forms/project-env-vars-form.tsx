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

    const updateEnvVar = useEnvVarsStore((state) => state.updateEnvVar);
    const envVar = useEnvVarsStore((state) =>
        state.envVars.find((v) => v.key === key)
    );

    const handleSave = async (stage: string) => {
        setIsExecuting("Saving...");
        const value = values[stage];
        if (!key.trim() || !value.trim()) {
            setError("Missing key or value");
            return;
        }

        setError(null);

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
        setIsExecuting(null);
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

            <div className="mb-6">
                <label className="block mb-1 font-medium">Key</label>
                <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter variable key"
                />
            </div>

            <Divider className="my-6" soft bleed/>

            {stages.map((stage) => {
                const hasValue = envVar?.values[stage.name]?.value;
                return (
                    <div key={stage.name} className="mb-4">
                        <label className="block font-medium mb-1">
                            <span className="text-xs text-zinc-500 dark:text-white/50">
                                {stage.name === 'mock' ? `default:` : `custom:`}
                            </span>{" "}
                            {stage.name}{" "}
                            {hasValue && (
                                <span className="text-xs text-zinc-500 dark:text-white/50">
                                    (has value, can be overridden)
                                </span>
                            )}
                        </label>
                        <div className="relative flex gap-2 items-center">
                            <Input
                                value={values[stage.name] || ""}
                                onChange={(e) =>
                                    setValues((prev) => ({...prev, [stage.name]: e.target.value}))
                                }
                                placeholder={hasValue ? "Current value set, enter to override" : "Enter value for this environment"}
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