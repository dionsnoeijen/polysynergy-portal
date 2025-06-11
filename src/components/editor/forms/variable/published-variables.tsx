import {Node, NodeVariable, NodeVariableType} from "@/types/types";
import React, {useEffect, useMemo, useState, useRef} from "react";

import interpretNodeVariableType from "@/utils/interpretNodeVariableType";
import FormattedNodeOutput from "@/components/editor/bottombars/formatted-node-output";
import EditDictVariable from "@/components/editor/forms/variable/edit-dict-variable";

import {Subheading} from "@/components/heading";
import {Text} from "@/components/text";
import {Button} from "@/components/button";
import {Divider} from "@/components/divider";
import {LinkIcon, PlayIcon} from "@heroicons/react/24/outline";
import {Input} from "@/components/input";
import {useHandlePlay} from "@/hooks/editor/useHandlePlay";

import {VariableTypeComponents} from "@/components/editor/sidebars/dock";

import useNodesStore from "@/stores/nodesStore";
import useStagesStore from "@/stores/stagesStore";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import useMockStore from "@/stores/mockStore";
import useEditorStore from "@/stores/editorStore";

import {fetchSecretsWithRetry} from "@/utils/filesSecretsWithRetry";
import {createProjectSecretAPI, updateProjectSecretAPI} from "@/api/secretsApi";
import {Select} from "@/components/select";
import useEnvVarsStore from "@/stores/envVarsStore";
import IsExecuting from "@/components/editor/is-executing";

type VariableIdentifier = {
    variable: NodeVariable;
    nodeId: string;
    nodeServiceHandle?: string;
    nodeServiceVariant?: number;
}

type Props = { nodes: Node[]; };

type GroupedPublishedVariable = {
    playConfigNode?: Node;
    variables: VariableIdentifier[];
};

type TabItem = {
    key: string;
    title: string;
    info: string;
    group: GroupedPublishedVariable;
};

const SECRET_IDENTIFIER = 'secret::internal';
const ENV_IDENTIFIER = 'env::internal';
const SECRET_EXISTS = 0;
const SECRET_MUST_BE_CREATED = 1;

const PublishedVariables: React.FC<Props> = ({
                                                 nodes,
                                             }) => {
    const leadsToPlayConfig = useNodesStore((state) => state.leadsToPlayConfig);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const getNodeVariable = useNodesStore((state) => state.getNodeVariable);
    const getSecretNodes = useNodesStore((state) => state.getSecretNodes);
    const getEnvironmentVariableNodes = useNodesStore((state) => state.getEnvironmentVariableNodes);
    const secrets = useProjectSecretsStore((state) => state.secrets);
    const getMockResultForNode = useMockStore((state) => state.getMockResultForNode);
    const handlePlay = useHandlePlay();

    const stages = useStagesStore((state) => state.stages);

    const fetchSecrets = useProjectSecretsStore((state) => state.fetchSecrets);
    const envVars = useEnvVarsStore((state) => state.envVars);
    const fetchEnvVars = useEnvVarsStore((state) => state.fetchEnvVars);

    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);

    const [selectedStage, setSelectedStage] = useState("mock");
    const [publishedVariables, setPublishedVariables] = useState<VariableIdentifier[]>([]);
    const [dictVariables, setDictVariables] = useState<{ [nodeId: string]: { [handle: string]: NodeVariable[] } }>({});
    const [simpleVariables, setSimpleVariables] = useState<{ [nodeId: string]: { [handle: string]: string } }>({});
    const [secretVariables, setSecretVariables] = useState<{ key: string, value: string }[]>([]);
    // eslint-disable-next-line
    const [envVariables, setEnvVariables] = useState<{ key: string; value: string }[]>([]);

    const hasInitializedTabs = useRef(false);

    useEffect(() => {
        fetchSecretsWithRetry(fetchSecrets);
        fetchEnvVars();
    }, [fetchSecrets, fetchEnvVars]);

    const [tabs, setTabs] = useState<TabItem[]>([]);
    const [activeTabKey, setActiveTabKey] = useState<string>("default");

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
            updateNodeVariable(nodeId, handle, updatedVariables); // realtime update
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

    useEffect(() => {
        const initialDictVariables: { [nodeId: string]: { [handle: string]: NodeVariable[] } } = {};
        const initialSimpleVariables: { [nodeId: string]: { [handle: string]: string } } = {};
        const pubVariables: VariableIdentifier[] = [];

        nodes.forEach((node) => {
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

        setDictVariables(initialDictVariables);
        setSimpleVariables(initialSimpleVariables);
        setPublishedVariables(pubVariables);

        const tabItems: TabItem[] = [];

        const configTab: TabItem = {
            key: "config",
            title: "Configuration",
            info: "",
            group: {
                playConfigNode: undefined,
                variables: []
            }
        };

        const secretsTab: TabItem = {
            key: "secrets",
            title: "Secrets",
            info: "Sensitive data, such as passwords or API keys, are created as a secret.",
            group: {
                playConfigNode: undefined,
                variables: []
            }
        };

        const playButtonNodes = nodes.filter((node) => node.has_play_button);

        const playButtonTabs: TabItem[] = playButtonNodes.map((node) => {
            const title = getNodeVariable(node.id, "title")?.value as string;
            const info = getNodeVariable(node.id, "info")?.value as string;
            const fallbackTitle = `Play ${node.handle}`;

            return {
                key: node.id,
                title: title?.trim() || fallbackTitle,
                info: info || "",
                group: {
                    playConfigNode: node,
                    variables: [],
                },
            };
        });

        for (const pv of pubVariables) {
            const playConfigNode = leadsToPlayConfig(pv.nodeId);
            if (playConfigNode) {
                const playButtonTab = playButtonTabs.find(tab => tab.key === playConfigNode.id);
                if (playButtonTab) {
                    playButtonTab.group.variables.push(pv);
                }
            } else {
                configTab.group.variables.push(pv);
            }
        }

        const secretNodes = getSecretNodes();
        secretNodes.forEach((node) => {
            node.variables.forEach((variable: NodeVariable) => {
                const exists = secrets.find((s) => s.key === variable.value);
                const secretVar = {
                    variable: variable,
                    nodeId: node.id,
                    nodeServiceHandle: SECRET_IDENTIFIER,
                    nodeServiceVariant: exists ? SECRET_EXISTS : SECRET_MUST_BE_CREATED,
                };

                const playConfigNode = leadsToPlayConfig(node.id);
                if (playConfigNode) {
                    const playButtonTab = playButtonTabs.find(tab => tab.key === playConfigNode.id);
                    if (playButtonTab) {
                        playButtonTab.group.variables.push(secretVar);
                    }
                } else {
                    secretsTab.group.variables.push(secretVar);
                }
            });
        });

        const environmentVariableNodes = getEnvironmentVariableNodes();
        environmentVariableNodes.forEach((node) => {
            node.variables.forEach((variable: NodeVariable) => {
                const matching = envVars.find((v) => v.key === variable.value);

                if (!matching) return;

                const envVarItem: VariableIdentifier = {
                    variable,
                    nodeId: node.id,
                    nodeServiceHandle: ENV_IDENTIFIER,
                    nodeServiceVariant: 0,
                };

                const playConfigNode = leadsToPlayConfig(node.id);
                if (playConfigNode) {
                    const playButtonTab = playButtonTabs.find((tab) => tab.key === playConfigNode.id);
                    if (playButtonTab) {
                        playButtonTab.group.variables.push(envVarItem);
                    }
                } else {
                    configTab.group.variables.push(envVarItem);
                }
            });
        });

        tabItems.push(configTab);
        tabItems.push(secretsTab);
        tabItems.push(...playButtonTabs);

        setTabs(tabItems);

        if (!hasInitializedTabs.current) {
            setActiveTabKey(tabItems[0]?.key ?? "default");
            hasInitializedTabs.current = true;
        }
        // eslint-disable-next-line
    }, [
        getNodeVariable,
        getSecretNodes,
        leadsToPlayConfig,
        nodes,
        secrets,
        setPublishedVariables,
        setSimpleVariables,
        setDictVariables
    ]);

    const activeTab = tabs.find((tab) => tab.key === activeTabKey);

    return (
        <div className="flex flex-col gap-4 relative">
            <IsExecuting/>

            <div className="mb-4 flex gap-2 border-b border-sky-500/50 dark:border-white/10">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`px-4 py-2 text-sm font-medium transition ${
                            activeTabKey === tab.key
                                ? "border-b-2 border-sky-500 dark:border-white text-sky-600 dark:text-white"
                                : "border-b border-sky-500/50 dark:text-white/60 dark:hover:text-white text-sky-500"
                        }`}
                        onClick={() => setActiveTabKey(tab.key)}
                    >
                        {tab.title}
                    </button>
                ))}
            </div>

            {activeTab?.info && (
                <div className="mb-4 rounded-md border border-sky-500/50 dark:border-white/10 p-4">
                    <Text dangerouslySetInnerHTML={{__html: activeTab.info}}/>
                </div>
            )}

            {!activeTab || activeTab?.group.variables.length === 0 ? (
                <div
                    className="rounded-md border border-sky-500/50 dark:border-white/10 p-4 text-sky-500 dark:text-white/60 text-sm italic">
                    No published variables
                </div>
            ) : (
                activeTab?.group.variables.map(({variable, nodeId, nodeServiceHandle, nodeServiceVariant}) => {
                    if (variable.parentHandle) return null;
                    const {baseType} = interpretNodeVariableType(variable);
                    const syncKey = `${nodeServiceHandle}::${nodeServiceVariant ?? 1}::${variable.handle}`;
                    let isSynced = false;
                    if (syncMap.has(syncKey)) {
                        const synced = syncMap.get(syncKey);
                        isSynced = synced?.some(({nodeId: id}) => id === nodeId) ?? false;
                    }

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
                                            // const local = envVariables.find((v) => v.key === localKey);

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
                                        {isSynced && <LinkIcon
                                            className="w-4 h-4"
                                            title={`Synced with ${nodeServiceHandle} ${nodeServiceVariant ?? 1}`}
                                        />}
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
                                        {isSynced && <LinkIcon
                                            className="w-4 h-4 text-sky-500/60 dark:text-white/60"
                                            title={`Synced with ${nodeServiceHandle} ${nodeServiceVariant ?? 1}`}
                                        />}
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

            {activeTab?.group.playConfigNode && (
                <>
                    <div className="flex items-center gap-4 justify-end">
                        <Select
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value)}
                        >
                            {stages.map((stage) => (
                                <option key={stage.name} value={stage.name}>
                                    {stage.name}
                                </option>
                            ))}
                        </Select>

                        <button
                            type="button"
                            className="flex items-center gap-2 rounded bg-sky-300 hover:bg-sky-400 dark:bg-white/10 px-4 py-2 text-sm font-medium text-sky-700 dark:text-white dark:hover:bg-white/20 transition"
                            onClick={(e) => handlePlay(e, activeTab.group.playConfigNode!.id, selectedStage)}
                        >
                            <PlayIcon className="h-5 w-5"/>
                            Run
                        </button>
                    </div>
                    {(() => {
                        const result = getMockResultForNode?.(activeTab.group.playConfigNode!.id);

                        if (!result?.variables) return null;

                        return (
                            <div
                                className="mb-4 rounded-md border border-sky-500/50 dark:border-white/10 p-4 bg-sky-50 dark:bg-white/5">
                                <div className="mb-2 text-sky-500 dark:text-white font-semibold text-sm">
                                    Result
                                </div>
                                <FormattedNodeOutput variables={result.variables}/>
                            </div>
                        );
                    })()}
                </>
            )}
        </div>
    );
};

export default PublishedVariables;
