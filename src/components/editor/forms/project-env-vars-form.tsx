import React, {useCallback, useEffect, useState} from "react";

import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Input} from "@/components/input";
import {Button} from "@/components/button";
import {XMarkIcon} from "@heroicons/react/24/outline";
import {Text} from "@/components/text";

import useStagesStore from "@/stores/stagesStore";
import useEditorStore from "@/stores/editorStore";
import useEnvVarsStore from "@/stores/envVarsStore";

import {FormType} from "@/types/types";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";

const ProjectEnvVarsForm: React.FC = () => {
    const stagesFromStore = useStagesStore((state) => state.stages);
    const stages = [{name: "mock"}, ...stagesFromStore];

    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const createEnvVar = useEnvVarsStore((state) => state.createEnvVar);
    // const deleteEnvVar = useEnvVarsStore((state) => state.deleteEnvVar);
    const closeForm = useEditorStore((state) => state.closeForm);

    const [key, setKey] = useState("");
    const [values, setValues] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (stage: string) => {
        if (!key.trim() || !values[stage]?.trim()) {
            setError("Missing key or value");
            return;
        }
        setError(null);
        await createEnvVar(key, values[stage], stage);
    };

    const handleDelete = useCallback(async () => {
        if (!formEditRecordId || !activeProjectId) return;

        // const parts = formEditRecordId.split("#");
        // // const stage = parts[2];
        // // const key = parts[3];
        // // await deleteEnvVar(activeProjectId, stage, key);
        setShowDeleteAlert(false);
        closeForm("Variable deleted successfully");
    }, [formEditRecordId, activeProjectId, closeForm]);

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
                const {hasInitialFetched, getEnvVarsByKey} = useEnvVarsStore.getState();

                if (!hasInitialFetched) {
                    await useEnvVarsStore.getState().fetchEnvVars();
                }

                const envVarsForKey = getEnvVarsByKey(formEditRecordId as string);

                setKey(formEditRecordId as string);

                const valuesObj: Record<string, string> = {};
                for (const env of envVarsForKey) {
                    valuesObj[env.stage] = env.value || "";
                }
                setValues(valuesObj);
            };

            ensureEnvVarsLoaded();
        }
    }, [formType, formEditRecordId, activeProjectId]);

    return (
        <form onSubmit={(e) => e.preventDefault()} className="p-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>Add Environment Variable</Heading>
                <Button type="button" onClick={handleCancel} color="sky">
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>

            <Divider className="my-4" soft bleed/>
            <Text>Define an environment variable across environments. Values are saved per environment.</Text>
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

            {stages.map((stage) => (
                <div key={stage.name} className="mb-4">
                    <label className="block font-medium mb-1">{stage.name}</label>
                    <div className="relative flex gap-2 items-center">
                        <Input
                            value={values[stage.name] || ""}
                            onChange={(e) =>
                                setValues((prev) => ({...prev, [stage.name]: e.target.value}))
                            }
                            placeholder="Enter value for this environment"
                        />
                        <Button color={"sky"} onClick={() => handleSave(stage.name)}>Save</Button>
                    </div>
                </div>
            ))}

            <Divider className="my-10" soft bleed/>
            <div className="flex justify-end">
                <Button type="button" onClick={handleCancel} plain>
                    Close
                </Button>
            </div>

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
        </form>
    );
};

export default ProjectEnvVarsForm;