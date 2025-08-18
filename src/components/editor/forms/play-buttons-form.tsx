import React from "react";
import {Node, NodeVariable, NodeVariableType} from "@/types/types";


import interpretNodeVariableType from "@/utils/interpretNodeVariableType";

import EditDictVariable from "@/components/editor/forms/variable/edit-dict-variable";

import {Subheading} from "@/components/heading";
import {Text} from "@/components/text";
import {Button} from "@/components/button";
import {Divider} from "@/components/divider";
import {PlayIcon, XMarkIcon, ArrowLeftIcon} from "@heroicons/react/24/outline";
import {Input} from "@/components/input";
import {useHandlePlay} from "@/hooks/editor/useHandlePlay";

import {VariableTypeComponents} from "@/components/editor/sidebars/dock";

import useNodesStore from "@/stores/nodesStore";
import useStagesStore from "@/stores/stagesStore";
import useProjectSecretsStore from "@/stores/projectSecretsStore";

import useEditorStore from "@/stores/editorStore";

import {fetchSecretsWithRetry} from "@/utils/filesSecretsWithRetry";
import {createProjectSecretAPI, updateProjectSecretAPI} from "@/api/secretsApi";
import {Select} from "@/components/select";
import useEnvVarsStore from "@/stores/envVarsStore";
import IsExecuting from "@/components/editor/is-executing";
import {Heading} from "@/components/heading";

type VariableIdentifier = {
    variable: NodeVariable;
    nodeId: string;
    nodeServiceHandle?: string;
    nodeServiceVariant?: number;
}

const SECRET_IDENTIFIER = 'secret::internal';
const ENV_IDENTIFIER = 'env::internal';
const SECRET_EXISTS = 0;
const SECRET_MUST_BE_CREATED = 1;

const PlayButtonsForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const getNodes = useNodesStore((state) => state.getNodes);
    const getNodeVariable = useNodesStore((state) => state.getNodeVariable);
    const getSecretNodes = useNodesStore((state) => state.getSecretNodes);
    const getEnvironmentVariableNodes = useNodesStore((state) => state.getEnvironmentVariableNodes);
    const leadsToPlayConfig = useNodesStore((state) => state.leadsToPlayConfig);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const secrets = useProjectSecretsStore((state) => state.secrets);
    const getMockResultForNode = useMockStore((state) => state.getMockResultForNode);
    const handlePlay = useHandlePlay();

    const stages = useStagesStore((state) => state.stages);
    const fetchSecrets = useProjectSecretsStore((state) => state.fetchSecrets);
    const envVars = useEnvVarsStore((state) => state.envVars);
    const fetchEnvVars = useEnvVarsStore((state) => state.fetchEnvVars);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);

    const [selectedPlayButton, setSelectedPlayButton] = useState<Node | null>(null);
    const [selectedStage, setSelectedStage] = useState("mock");
    const [playButtons, setPlayButtons] = useState<Node[]>([]);
    const [publishedVariables, setPublishedVariables] = useState<VariableIdentifier[]>([]);
    const [dictVariables, setDictVariables] = useState<{ [nodeId: string]: { [handle: string]: NodeVariable[] } }>({});
    const [simpleVariables, setSimpleVariables] = useState<{ [nodeId: string]: { [handle: string]: string } }>({});
    const [secretVariables, setSecretVariables] = useState<{ key: string, value: string }[]>([]);
    // const [envVariables, setEnvVariables] = useState<{ key: string; value: string }[]>([]);

    useEffect(() => {
        fetchSecretsWithRetry(fetchSecrets);
        fetchEnvVars();
    }, [fetchSecrets, fetchEnvVars]);

    // Get play button nodes
    useEffect(() => {
        const nodes = getNodes();
        const playButtonNodes = nodes.filter((node) => 
            node.path === 'polysynergy_nodes.play.config.PlayConfig' || 
            node.path === 'polysynergy_nodes.play.play.Play'
        );
        setPlayButtons(playButtonNodes);
    }, [getNodes]);

    const syncMap = useMemo(() => {
        const map = new Map<string, { nodeId: string; handle: string }[]>();
        publishedVariables.forEach((pv) => {
            if (!pv.nodeServiceHandle) return;
            const syncKey = `${pv.nodeServiceHandle}::${pv.nodeServiceVariant ?? 1}::${pv.variable.handle}`;
            if (!map.has(syncKey)) map.set(syncKey, []);
            map.get(syncKey)!.push({nodeId: pv.nodeId, handle: pv.variable.handle});
        });
        return map;
    }, [publishedVariables]);

    const handleDictVariableChange = (
        nodeId: string,
        updatedVariables: NodeVariable[],
        handle?: string
    ) => {
        if (!handle) return;

        const syncKey = publishedVariables.find(
            (pv) => pv.nodeId === nodeId && pv.variable.handle === handle
        );

        const key = syncKey?.nodeServiceHandle
            ? `${syncKey.nodeServiceHandle}::${syncKey.nodeServiceVariant ?? 1}::${handle}`
            : null;

        const synced = key ? syncMap.get(key) || [{nodeId, handle}] : [{nodeId, handle}];

        for (const {nodeId, handle} of synced) {
            updateNodeVariable(nodeId, handle, updatedVariables);
        }

        setDictVariables((prev) => {
            const updated = {...prev};
            for (const {nodeId, handle} of synced) {
                if (!updated[nodeId]) updated[nodeId] = {};
                updated[nodeId][handle] = updatedVariables;
            }
            return updated;
        });
    };

    const handleSimpleVariableChange = (nodeId: string, handle: string, value: string) => {
        const syncKey = publishedVariables.find(
            (pv) => pv.nodeId === nodeId && pv.variable.handle === handle
        );

        if (!syncKey?.nodeServiceHandle) return;

        const key = `${syncKey.nodeServiceHandle}::${syncKey.nodeServiceVariant ?? 1}::${handle}`;
        const synced = syncMap.get(key) || [{nodeId, handle}];

        for (const {nodeId, handle} of synced) {
            updateNodeVariable(nodeId, handle, value);
        }

        setSimpleVariables((prev) => {
            const updated = {...prev};
            for (const {nodeId, handle} of synced) {
                if (!updated[nodeId]) updated[nodeId] = {};
                updated[nodeId][handle] = value;
            }
            return updated;
        });
    };

    const handleSecretCreation = async (key: string, value: string) => {
        setIsExecuting('Creating secret...');
        const [stage, secretKey] = key.split("@");
        const existing = secrets.find((s) => s.key === secretKey && s.stages?.includes(stage));
        try {
            if (existing) {
                await updateProjectSecretAPI(activeProjectId!, secretKey, value, stage);
            } else {
                await createProjectSecretAPI(activeProjectId!, secretKey, value, stage);
            }
            await fetchSecretsWithRetry(fetchSecrets);
            setIsExecuting(null);
        } catch (err) {
            console.error("Failed to store secret:", err);
            setIsExecuting(null);
        }
    };

    const handleEnvVarChange = (key: string, value: string) => {
        setEnvVariables((prev) => {
            const updated = [...prev];
            const index = updated.findIndex((v) => v.key === key);
            if (index !== -1) {
                updated[index].value = value;
            } else {
                updated.push({key, value});
            }
            return updated;
        });
    };

    const handleEnvVarSave = async (stage: string, key: string, value: string) => {
        try {
            await useEnvVarsStore.getState().createEnvVar(key, value, stage);
            await fetchEnvVars();
        } catch (err) {
            console.error("Failed to store env var:", err);
        }
    };

    const handlePlayButtonClick = (playButtonNode: Node) => {
        setSelectedPlayButton(playButtonNode);
        
        // Load variables for this specific play button
        const nodes = getNodes();
        const initialDictVariables: { [nodeId: string]: { [handle: string]: NodeVariable[] } } = {};
        const initialSimpleVariables: { [nodeId: string]: { [handle: string]: string } } = {};
        const pubVariables: VariableIdentifier[] = [];

        // Find all published variables that lead to this specific play button
        nodes.forEach((node) => {
            // Check if this node's variables lead to our play button
            const leadsToNode = leadsToPlayConfig(node.id);
            const leadsToOurPlayButton = leadsToNode?.id === playButtonNode.id;
            if (!leadsToOurPlayButton) return;

            const dictVariables = node.variables.filter(
                (variable) => variable.type === NodeVariableType.Dict
            );

            dictVariables.forEach((dictVar) => {
                const children = dictVar.value as NodeVariable[] || [];

                const publishedChildren = children.filter(child => child.published);
                const isRootPublished = dictVar.published;

                if (publishedChildren.length > 0 || isRootPublished) {
                    if (!initialDictVariables[node.id]) initialDictVariables[node.id] = {};
                    initialDictVariables[node.id][dictVar.handle] = children;
                }

                if (isRootPublished || publishedChildren.length > 0) {
                    pubVariables.push({
                        variable: dictVar,
                        nodeId: node.id,
                        nodeServiceHandle: node.service?.handle,
                        nodeServiceVariant: node.service?.variant,
                    });
                }

                publishedChildren.forEach((child) => {
                    pubVariables.push({
                        variable: {
                            ...child,
                            parentHandle: dictVar.handle,
                        },
                        nodeId: node.id,
                        nodeServiceHandle: node.service?.handle,
                        nodeServiceVariant: node.service?.variant,
                    });
                });
            });

            const otherVariables = node.variables.filter(
                (variable) => variable.published &&
                    variable.type !== NodeVariableType.Dict
            );

            if (otherVariables.length > 0) {
                initialSimpleVariables[node.id] = {};
                otherVariables.forEach((variable) => {
                    initialSimpleVariables[node.id][variable.handle] = (variable.value as string) || "";
                    pubVariables.push({
                        variable,
                        nodeId: node.id,
                        nodeServiceHandle: node.service?.handle,
                        nodeServiceVariant: node.service?.variant,
                    });
                });
            }
        });

        // Also include secrets that might be used by this play button
        const secretNodes = getSecretNodes();
        secretNodes.forEach((node) => {
            const leadsToNode = leadsToPlayConfig(node.id);
            const leadsToOurPlayButton = leadsToNode?.id === playButtonNode.id;
            if (!leadsToOurPlayButton) return;

            node.variables.forEach((variable: NodeVariable) => {
                const exists = secrets.find((s) => s.key === variable.value);
                const secretVar = {
                    variable: variable,
                    nodeId: node.id,
                    nodeServiceHandle: SECRET_IDENTIFIER,
                    nodeServiceVariant: exists ? SECRET_EXISTS : SECRET_MUST_BE_CREATED,
                };
                pubVariables.push(secretVar);
            });
        });

        // Include environment variables
        const environmentVariableNodes = getEnvironmentVariableNodes();
        environmentVariableNodes.forEach((node) => {
            const leadsToNode = leadsToPlayConfig(node.id);
            const leadsToOurPlayButton = leadsToNode?.id === playButtonNode.id;
            if (!leadsToOurPlayButton) return;

            node.variables.forEach((variable: NodeVariable) => {
                const matching = envVars.find((v) => v.key === variable.value);

                if (!matching) return;

                const envVarItem: VariableIdentifier = {
                    variable,
                    nodeId: node.id,
                    nodeServiceHandle: ENV_IDENTIFIER,
                    nodeServiceVariant: 0,
                };
                pubVariables.push(envVarItem);
            });
        });

        setDictVariables(initialDictVariables);
        setSimpleVariables(initialSimpleVariables);
        setPublishedVariables(pubVariables);
    };

    const handleBackToGrid = () => {
        setSelectedPlayButton(null);
        setPublishedVariables([]);
        setDictVariables({});
        setSimpleVariables({});
    };

    // If no play button is selected, show the grid
    if (!selectedPlayButton) {
        return (
            <div className="flex flex-col gap-4 relative p-10">
                <IsExecuting/>

                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <Heading>Play Buttons</Heading>
                    <Button type="button" onClick={() => closeForm()} color="sky">
                        <XMarkIcon className="w-5 h-5" />
                    </Button>
                </div>

                <Divider className="my-4" soft bleed />

                {/* Play Buttons Grid */}
                {playButtons.length === 0 ? (
                    <div className="rounded-md border border-sky-500/50 dark:border-white/10 p-4 text-sky-500 dark:text-white/60 text-sm italic">
                        No play buttons found in this workflow
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {playButtons.map((node) => {
                            const title = getNodeVariable(node.id, "title")?.value as string;
                            const fallbackTitle = `Play ${node.handle}`;
                            
                            return (
                                <div
                                    key={node.id}
                                    className="border border-sky-500/50 dark:border-white/10 rounded-lg p-4 bg-sky-50 dark:bg-white/5 hover:bg-sky-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                    onClick={() => handlePlayButtonClick(node)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-10 h-10 bg-sky-500 dark:bg-white/20 rounded-full flex items-center justify-center">
                                            <PlayIcon className="w-5 h-5 text-white dark:text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-sky-700 dark:text-white truncate">
                                                {title?.trim() || fallbackTitle}
                                            </div>
                                            <div className="text-xs text-sky-500 dark:text-white/70 truncate">
                                                {node.handle}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // If a play button is selected, show its variables
    const title = getNodeVariable(selectedPlayButton.id, "title")?.value as string;
    const fallbackTitle = `Play ${selectedPlayButton.handle}`;
    const displayTitle = title?.trim() || fallbackTitle;
    const result = getMockResultForNode?.(selectedPlayButton.id);

    return (
        <div className="flex flex-col gap-4 relative p-10">
            <IsExecuting/>

            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <button 
                        type="button" 
                        onClick={handleBackToGrid}
                        className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <Heading>{displayTitle}</Heading>
                </div>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>

            <Divider className="my-4" soft bleed />

            {/* Variables */}
            {publishedVariables.length === 0 ? (
                <div className="rounded-md border border-sky-500/50 dark:border-white/10 p-4 text-sky-500 dark:text-white/60 text-sm italic">
                    No published variables connected to this play button
                </div>
            ) : (
                publishedVariables.map(({variable, nodeId, nodeServiceHandle, /* nodeServiceVariant */}) => {
                    if (variable.parentHandle) return null;
                    const {baseType} = interpretNodeVariableType(variable);

                    if (nodeServiceHandle === SECRET_IDENTIFIER) {
                        return (
                            <React.Fragment key={nodeId + "-" + variable.handle}>
                                <div className={'border rounded-md border-sky-500/50 dark:border-white/10 p-5'}>
                                    <Subheading>
                                        <span className="inline-flex items-center gap-2 mb-2">
                                            Secret: {variable.value as string}
                                        </span>
                                    </Subheading>
                                    <div className="space-y-3">
                                        {stages.map((stage) => {
                                            const localSecret = secretVariables.find(
                                                (s) => s.key === `${stage.name}@${variable.value}`
                                            );
                                            const hasSecret = secrets.some(
                                                (s) => {
                                                    return (s.key === variable.value && s.stages?.includes(stage.name));
                                                }
                                            );
                                            return (
                                                <div key={stage.name}>
                                                    <label className="text-sm text-sky-500/70 dark:text-white/70">
                                                        {stage.name}{" "}
                                                        {hasSecret && (
                                                            <span
                                                                className="text-xs text-sky-500/50 dark:text-white/50">(has value)</span>
                                                        )}
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="password"
                                                            placeholder={
                                                                hasSecret
                                                                    ? "********"
                                                                    : "Enter secret value"
                                                            }
                                                            value={localSecret?.value || ""}
                                                            onChange={(e) =>
                                                                setSecretVariables((prev) => {
                                                                    const updated = [...prev];
                                                                    const index = updated.findIndex((s) => s.key === `${stage.name}@${variable.value}`);
                                                                    if (index !== -1) {
                                                                        updated[index].value = e.target.value;
                                                                    } else {
                                                                        updated.push({
                                                                            key: `${stage.name}@${variable.value}`,
                                                                            value: e.target.value
                                                                        });
                                                                    }
                                                                    return updated;
                                                                })
                                                            }
                                                        />
                                                        <Button
                                                            color={'sky'}
                                                            onClick={() => handleSecretCreation(`${stage.name}@${variable.value}`, localSecret?.value || "")}>
                                                            Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <Divider className="my-10" soft bleed/>
                            </React.Fragment>
                        );
                    } else if (nodeServiceHandle === ENV_IDENTIFIER) {
                        return (
                            <React.Fragment key={`env-${nodeId}-${variable.handle}`}>
                                <div className="border rounded-md border-sky-500/50 dark:border-white/10 p-5">
                                    <Subheading>
                                        <span className="inline-flex items-center gap-2 mb-2">
                                            Environment: {variable.value as string}
                                        </span>
                                    </Subheading>
                                    <div className="space-y-3">
                                        {stages.map((stage) => {
                                            const existing = envVars.find(
                                                (v) => v.key === variable.value && v.values[stage.name]
                                            );
                                            const localKey = `${stage.name}@${variable.value}`;

                                            const value = existing?.values[stage.name]?.value ?? "";

                                            return (
                                                <div key={`${nodeId}-${stage.name}`}>
                                                    <label className="text-sm text-sky-500/70 dark:text-white/70">
                                                        {stage.name}{" "}
                                                        {existing && (
                                                            <span
                                                                className="text-xs text-sky-500/50 dark:text-white/50">(has value)</span>
                                                        )}
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={value}
                                                            onChange={(e) =>
                                                                handleEnvVarChange(localKey, e.target.value)
                                                            }
                                                        />
                                                        <Button
                                                            onClick={() =>
                                                                handleEnvVarSave(stage.name, variable.value as string, value)
                                                            }
                                                        >
                                                            Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <Divider className="my-10" soft bleed/>
                            </React.Fragment>
                        );
                    } else if (baseType === NodeVariableType.Dict) {
                        return (
                            <div key={nodeId + "-" + variable.handle}>
                                <Subheading>
                                    <span className="inline-flex items-center gap-2">
                                    {variable.published_title}
                                    </span>
                                </Subheading>
                                {variable.published_description && (
                                    <div className="mb-4 rounded-md border border-sky-500/50 dark:border-white/10 p-4">
                                        <Text dangerouslySetInnerHTML={{__html: variable.published_description}}/>
                                    </div>
                                )}
                                <EditDictVariable
                                    title={variable.handle}
                                    onlyValues={true}
                                    variables={dictVariables[nodeId]?.[variable.handle] || []}
                                    handle={variable.handle}
                                    onChange={(updatedVariables, handle) =>
                                        handleDictVariableChange(nodeId, updatedVariables, handle)
                                    }
                                />
                                <Divider className="my-10" soft bleed/>
                            </div>
                        );
                    } else {
                        const VariableComponent = VariableTypeComponents[baseType];

                        return VariableComponent ? (
                            <div key={nodeId + "-" + variable.handle}>
                                <Subheading>
                                    <span className="inline-flex items-center gap-2">
                                    {variable.published_title}
                                    </span>
                                </Subheading>
                                {variable.published_description && (
                                    <div className="mb-4 rounded-md border border-sky-500/50 dark:border-white/10 p-4">
                                        <Text dangerouslySetInnerHTML={{__html: variable.published_description}}/>
                                    </div>
                                )}
                                <VariableComponent
                                    nodeId={nodeId}
                                    variable={variable}
                                    publishedButton={false}
                                    // @ts-expect-error value is ambiguous
                                    onChange={(value) => handleSimpleVariableChange(nodeId, variable.handle, value)}
                                    currentValue={simpleVariables[nodeId]?.[variable.handle]}
                                    inDock={false}
                                />
                                <Divider className="my-10" soft bleed/>
                            </div>
                        ) : null;
                    }
                })
            )}

            {/* Stage Selector and Play Button */}
            <Divider className="my-8" soft bleed />
            <div className="mb-6 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Text className="text-sm text-sky-500 dark:text-white/70">Stage:</Text>
                    <Select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="w-32"
                    >
                        {stages.map((stage) => (
                            <option key={stage.name} value={stage.name}>
                                {stage.name}
                            </option>
                        ))}
                    </Select>
                </div>

                <Button
                    color="sky"
                    onClick={(e: React.MouseEvent) => handlePlay(e, selectedPlayButton.id, selectedStage)}
                    className="flex items-center gap-2"
                >
                    <PlayIcon className="w-4 h-4" />
                    Play
                </Button>
            </div>

            {/* Show results for executed play button */}
            {result?.variables && (
                <div className="mb-4 rounded-md border border-sky-500/50 dark:border-white/10 p-4 bg-sky-50 dark:bg-white/5">
                    <div className="mb-2 text-sky-500 dark:text-white font-semibold text-sm">
                        Result from {displayTitle}
                    </div>
                    <FormattedNodeOutput variables={result.variables}/>
                </div>
            )}
        </div>
    );
};

export default PlayButtonsForm;