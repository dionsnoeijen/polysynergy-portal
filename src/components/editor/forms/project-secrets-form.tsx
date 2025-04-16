import React, {useState, useEffect, useCallback} from "react";
import useEditorStore from "@/stores/editorStore";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Input} from "@/components/input";
import {Button} from "@/components/button";
import {Secret, FormType} from "@/types/types";
import {EyeIcon, EyeSlashIcon} from "@heroicons/react/24/outline";
import {
    createProjectSecretAPI,
    updateProjectSecretAPI,
    fetchProjectSecretDetailAPI,
    deleteProjectSecretAPI
} from "@/api/secretsApi";
import {Text} from "@/components/text";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {useParams, useRouter} from "next/navigation";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import {fetchSecretsWithRetry} from "@/utils/filesSecretsWithRetry";

const ProjectSecretsForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const fetchSecrets = useProjectSecretsStore((state) => state.fetchSecrets);

    const params = useParams();
    const router = useRouter();

    const [key, setKey] = useState("");
    const [secretValue, setSecretValue] = useState("");
    const [isSecretVisible, setIsSecretVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isSecretFetched, setIsSecretFetched] = useState(false);

    useEffect(() => {
        if (formType === FormType.EditProjectSecret &&
            formEditRecordId &&
            activeProjectId
        ) {
            fetchProjectSecretDetailAPI(activeProjectId, formEditRecordId)
                .then((data: Secret) => {
                    const fetched: Secret = data;
                    if (fetched) {
                        setKey(fetched.key);
                        setIsSecretFetched(true);
                    }
                })
                .catch(() => {
                    setError("Failed to load secret details.");
                });
        }
    }, [formType, formEditRecordId, activeProjectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!key.trim() || !secretValue.trim()) {
            setError("Both key and secret value are required.");
            return;
        }
        try {
            if (formType === FormType.EditProjectSecret && formEditRecordId && activeProjectId) {
                await updateProjectSecretAPI(activeProjectId, formEditRecordId, secretValue);
            } else if (activeProjectId) {
                await createProjectSecretAPI(activeProjectId, key, secretValue);
            }
            await fetchSecrets();
            closeForm();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        }
    };

    const handleCancel = (e: React.FormEvent) => {
        e.preventDefault();
        closeForm();
    };

    const toggleSecretVisibility = () => {
        setIsSecretVisible((prev) => !prev);
    };

    const handleDelete = useCallback(async () => {
        await deleteProjectSecretAPI(activeProjectId as string, formEditRecordId as string);

        closeForm('Secret deleted successfully');

        setShowDeleteAlert(false);

        await fetchSecretsWithRetry(fetchSecrets);

        let specific = '';
        if (params.routeUuid) {
            specific = '/route/' + params.routeUuid;
        } else if (params.scheduleUuid) {
            specific = '/schedule/' + params.scheduleUuid;
        } else if (params.blueprintUuid) {
            specific = '/blueprint/' + params.blueprintUuid;
        }

        router.push(`/project/${params.projectUuid}${specific}`);
    }, [activeProjectId, closeForm, fetchSecrets, formEditRecordId, params.blueprintUuid, params.projectUuid, params.routeUuid, params.scheduleUuid, router]);

    return (
        <form onSubmit={handleSubmit} className="p-10">
            <Heading>
                {formType === FormType.EditProjectSecret ? "Edit Secret" : "Add Secret"}
            </Heading>
            <Text>The secret values are only available to you (the logged-in user). No one else can view these
                values.</Text>
            <Divider className="my-10" soft bleed/>
            {isSecretFetched && (
                <div className="rounded-md border border-white/10 p-4 text-white/60 text-sm italic mb-4">
                    <Text>The secret value is fetched from the server. You can update it if needed, but you cannot view
                        the contents of the secret.</Text>
                </div>
            )}
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="flex flex-col md:flex-row md:gap-4">
                <div className="flex-1 mb-4">
                    <label className="block mb-1 font-medium">Key</label>
                    <Input
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Enter secret key"
                        disabled={formType === FormType.EditProjectSecret} // In edit mode is de key meestal niet bewerkbaar
                    />
                </div>
                <div className="flex-1 mb-4">
                    <label className="block mb-1 font-medium">Secret Value</label>
                    <div className="relative">
                        <Input
                            type={isSecretVisible ? "text" : "password"}
                            value={secretValue}
                            onChange={(e) => setSecretValue(e.target.value)}
                            placeholder={isSecretFetched ? '**********' : 'Enter secret value'}
                        />
                        <button
                            type="button"
                            onClick={toggleSecretVisibility}
                            className="absolute top-1/2 right-0 transform -translate-y-1/2 pr-2"
                            title={isSecretVisible ? "Hide secret" : "Show secret"}
                        >
                            {isSecretVisible ? (
                                <EyeSlashIcon className="w-4 h-4 text-gray-500 hover:text-gray-700"/>
                            ) : (
                                <EyeIcon className="w-4 h-4 text-gray-500 hover:text-gray-700"/>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <Divider className="my-10" soft bleed/>

            {formType === FormType.EditProjectSecret && (
                <>
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
                    <Divider className="my-10" soft bleed/>
                </>
            )}

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={handleCancel} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    {formType === FormType.EditProjectSecret ? "Update Secret" : "Save Secret"}
                </Button>
            </div>

            {showDeleteAlert && (
                <Alert size="md" className="text-center" open={showDeleteAlert}
                       onClose={() => setShowDeleteAlert(false)}>
                    <AlertTitle>Are you sure you want to delete this route?</AlertTitle>
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