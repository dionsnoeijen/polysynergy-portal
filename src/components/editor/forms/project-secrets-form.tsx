import React, {useState, useEffect, useCallback} from "react";
import useEditorStore from "@/stores/editorStore";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Input} from "@/components/input";
import {Button} from "@/components/button";
import {Secret, FormType} from "@/types/types";
import {XMarkIcon} from "@heroicons/react/24/outline";
import {
    createProjectSecretAPI,
    updateProjectSecretAPI,
    fetchProjectSecretDetailAPI,
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
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const fetchSecrets = useProjectSecretsStore((state) => state.fetchSecrets);

    const [key, setKey] = useState("");
    const [values, setValues] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [stagesWithValue, setStagesWithValue] = useState<string[]>([]);

    useEffect(() => {
        if (formType === FormType.EditProjectSecret && formEditRecordId && activeProjectId) {
            fetchProjectSecretDetailAPI(activeProjectId, formEditRecordId as string)
                .then((data: Secret) => {
                    if (data?.key) {
                        setKey(data.key);
                        setStagesWithValue(data.stages || []);
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
            return;
        }
        try {
            if (formType === FormType.EditProjectSecret && activeProjectId) {
                await updateProjectSecretAPI(activeProjectId, key, values[stage], stage);
            } else if (activeProjectId) {
                await createProjectSecretAPI(activeProjectId, key, values[stage], stage);
            }
            await fetchSecretsWithRetry(fetchSecrets);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || "An error occurred.");
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
            <Text>The secret key is shared, but values are stage-specific. Secret values are never shown after creation
                or update.</Text>
            <Divider className="my-10" soft bleed/>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="mb-6">
                <label className="block mb-1 font-medium">Key</label>
                <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter secret key"
                    disabled={formType === FormType.EditProjectSecret}
                />
            </div>

            <Divider className="my-6" soft bleed/>

            {stages.map((stage) => (
                <div key={stage.name} className="mb-4">
                    <label className="block font-medium mb-1">
                        <span className="text-xs text-white/50">
                        {stage.name === 'mock' ? `default:` : `custom:`}
                        </span>{" "}
                        {stage.name}{" "}
                        {stagesWithValue.includes(stage.name) && (
                            <span className="text-xs text-white/50">
                                (has value, can be overridden, not shown)
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
                            placeholder={stagesWithValue.includes(stage.name) ? "********" : "Enter secret value"}
                        />
                        <Button color={"sky"} onClick={() => handleSave(stage.name)}>Save</Button>
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