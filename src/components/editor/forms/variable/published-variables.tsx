import React, { useState, useEffect, useMemo, useRef } from 'react';
import {Node, NodeVariable, NodeVariableType, VariableTypeComponents} from "@/types/types";

import interpretNodeVariableType from "@/utils/interpretNodeVariableType";
import EditDictVariable from "@/components/editor/forms/variable/edit-dict-variable";

import {Subheading} from "@/components/heading";
import {Text} from "@/components/text";
import {Button} from "@/components/button";
import {Divider} from "@/components/divider";
import {LinkIcon} from "@heroicons/react/24/outline";
import {Input} from "@/components/input";

import useNodesStore from "@/stores/nodesStore";
import useStagesStore from "@/stores/stagesStore";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import useEditorStore from "@/stores/editorStore";
import useEnvVarsStore from "@/stores/envVarsStore";

import {fetchSecretsWithRetry} from "@/utils/filesSecretsWithRetry";
import {createProjectSecretAPI, updateProjectSecretAPI} from "@/api/secretsApi";
import IsExecuting from "@/components/editor/is-executing";

type VariableIdentifier = {
    variable: NodeVariable;
    nodeId: string;
    nodeServiceHandle?: string;
    nodeServiceVariant?: number;
    // Metadata for grouped secrets
    secretMetadata?: {
        secretKey: string;
        nodeInstances: {nodeId: string; nodeName?: string; source?: 'node' | 'inline'; variableHandle?: string}[];
    };
    envMetadata?: {
        envKey: string;
        nodeInstances: {nodeId: string; nodeName?: string; source?: 'node' | 'inline'; variableHandle?: string}[];
    };
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

    const stages = useStagesStore((state) => state.stages);

    const fetchSecrets = useProjectSecretsStore((state) => state.fetchSecrets);
    const envVars = useEnvVarsStore((state) => state.envVars);
    const fetchEnvVars = useEnvVarsStore((state) => state.fetchEnvVars);

    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);


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
            console.log('🔓 [published-variables] Secret stored - clearing isExecuting');
            setIsExecuting(null);
        } catch (err) {
            console.error("Failed to store secret:", err);
            console.log('🔓 [published-variables] Secret error - clearing isExecuting');
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

        // Put ALL published variables in the configuration tab
        for (const pv of pubVariables) {
            configTab.group.variables.push(pv);
        }

        // Put ALL secrets in the secrets tab - deduplicated by secret key
        // Support dual secret detection: 1) Secret nodes, 2) Inline <secret:KEY> patterns
        const secretNodes = getSecretNodes();
        const secretGroups = new Map<string, {
            variable: NodeVariable;
            nodeInstances: {nodeId: string; nodeName?: string; source: 'node' | 'inline'; variableHandle?: string}[];
            exists: boolean;
        }>();

        // Helper function to extract inline secrets from text
        const extractInlineSecrets = (text: string): string[] => {
            const regex = /<(?:secret|sec):([^>]+)>/g;
            const matches = [];
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push(match[1].trim());
            }
            return matches;
        };

        // Helper function to recursively scan variables and their nested children for patterns
        const scanVariableForPatterns = (
            variable: NodeVariable,
            node: Node,
            pattern: RegExp,
            onMatch: (key: string, variableHandle: string) => void
        ) => {
            // Scan direct value if it's a string
            if (typeof variable.value === 'string' && pattern.test(variable.value)) {
                const regex = new RegExp(pattern);
                let match;
                while ((match = regex.exec(variable.value)) !== null) {
                    onMatch(match[1].trim(), variable.handle);
                }
            }

            // Recursively scan dict children
            if (Array.isArray(variable.value)) {
                variable.value.forEach((child) => {
                    if (child && typeof child === 'object' && 'handle' in child) {
                        scanVariableForPatterns(child as NodeVariable, node, pattern, onMatch);
                    }
                });
            }
        };

        // First pass: Process secret nodes
        secretNodes.forEach((node) => {
            node.variables.forEach((variable: NodeVariable) => {
                const secretKey = variable.value as string;
                if (!secretKey) return;

                const exists = secrets.find((s) => s.key === secretKey);

                if (secretGroups.has(secretKey)) {
                    // Add this node instance to existing group
                    const group = secretGroups.get(secretKey)!;
                    group.nodeInstances.push({
                        nodeId: node.id,
                        nodeName: node.name,
                        source: 'node'
                    });
                } else {
                    // Create new group for this secret key
                    secretGroups.set(secretKey, {
                        variable: variable,
                        nodeInstances: [{
                            nodeId: node.id,
                            nodeName: node.name,
                            source: 'node'
                        }],
                        exists: !!exists
                    });
                }
            });
        });

        // Second pass: Scan all node variables for inline secret patterns (recursively including dict children)
        nodes.forEach((node) => {
            node.variables.forEach((variable) => {
                const secretPattern = /<(?:secret|sec):([^>]+)>/g;

                scanVariableForPatterns(variable, node, secretPattern, (secretKey, variableHandle) => {
                    const exists = secrets.find((s) => s.key === secretKey);

                    if (secretGroups.has(secretKey)) {
                        // Add this inline instance to existing group
                        const group = secretGroups.get(secretKey)!;
                        // Only add if not already tracked
                        const alreadyTracked = group.nodeInstances.some(
                            n => n.nodeId === node.id && n.variableHandle === variableHandle
                        );
                        if (!alreadyTracked) {
                            group.nodeInstances.push({
                                nodeId: node.id,
                                nodeName: node.name,
                                source: 'inline',
                                variableHandle: variableHandle
                            });
                        }
                    } else {
                        // Create new group for this inline secret
                        const syntheticVariable: NodeVariable = {
                            handle: secretKey,
                            value: secretKey,
                            type: NodeVariableType.SecretString,
                            published: false
                        };

                        secretGroups.set(secretKey, {
                            variable: syntheticVariable,
                            nodeInstances: [{
                                nodeId: node.id,
                                nodeName: node.name,
                                source: 'inline',
                                variableHandle: variableHandle
                            }],
                            exists: !!exists
                        });
                    }
                });
            });
        });

        // Convert grouped secrets to VariableIdentifier format
        secretGroups.forEach((group, secretKey) => {
            const secretVar = {
                variable: group.variable,
                nodeId: group.nodeInstances[0].nodeId, // Use first instance as representative
                nodeServiceHandle: SECRET_IDENTIFIER,
                nodeServiceVariant: group.exists ? SECRET_EXISTS : SECRET_MUST_BE_CREATED,
                // Add metadata about all instances
                secretMetadata: {
                    secretKey: secretKey,
                    nodeInstances: group.nodeInstances
                }
            };
            secretsTab.group.variables.push(secretVar);
        });

        // Put ALL environment variables in the configuration tab - deduplicated by env key
        // Support dual environment detection: 1) Environment nodes, 2) Inline <environment:KEY> patterns
        const environmentVariableNodes = getEnvironmentVariableNodes();
        const envGroups = new Map<string, {
            variable: NodeVariable;
            nodeInstances: {nodeId: string; nodeName?: string; source: 'node' | 'inline'; variableHandle?: string}[];
            exists: boolean;
        }>();

        // Helper function to extract inline environment variables from text
        const extractInlineEnvVars = (text: string): string[] => {
            const regex = /<(?:environment|env):([^>]+)>/g;
            const matches = [];
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push(match[1].trim());
            }
            return matches;
        };

        // First pass: Process environment variable nodes
        environmentVariableNodes.forEach((node) => {
            node.variables.forEach((variable: NodeVariable) => {
                const envKey = variable.value as string;
                if (!envKey) return;

                const exists = envVars.find((v) => v.key === envKey);
                if (!exists) return; // Only show existing env vars

                if (envGroups.has(envKey)) {
                    // Add this node instance to existing group
                    const group = envGroups.get(envKey)!;
                    group.nodeInstances.push({
                        nodeId: node.id,
                        nodeName: node.name,
                        source: 'node'
                    });
                } else {
                    // Create new group for this env key
                    envGroups.set(envKey, {
                        variable: variable,
                        nodeInstances: [{
                            nodeId: node.id,
                            nodeName: node.name,
                            source: 'node'
                        }],
                        exists: !!exists
                    });
                }
            });
        });

        // Second pass: Scan all node variables for inline environment patterns (recursively including dict children)
        nodes.forEach((node) => {
            node.variables.forEach((variable) => {
                const envPattern = /<(?:environment|env):([^>]+)>/g;

                scanVariableForPatterns(variable, node, envPattern, (envKey, variableHandle) => {
                    const exists = envVars.find((v) => v.key === envKey);
                    if (!exists) return; // Only show existing env vars

                    if (envGroups.has(envKey)) {
                        // Add this inline instance to existing group
                        const group = envGroups.get(envKey)!;
                        // Only add if not already tracked
                        const alreadyTracked = group.nodeInstances.some(
                            n => n.nodeId === node.id && n.variableHandle === variableHandle
                        );
                        if (!alreadyTracked) {
                            group.nodeInstances.push({
                                nodeId: node.id,
                                nodeName: node.name,
                                source: 'inline',
                                variableHandle: variableHandle
                            });
                        }
                    } else {
                        // Create new group for this inline env var
                        const syntheticVariable: NodeVariable = {
                            handle: envKey,
                            value: envKey,
                            type: NodeVariableType.String,
                            published: false
                        };

                        envGroups.set(envKey, {
                            variable: syntheticVariable,
                            nodeInstances: [{
                                nodeId: node.id,
                                nodeName: node.name,
                                source: 'inline',
                                variableHandle: variableHandle
                            }],
                            exists: !!exists
                        });
                    }
                });
            });
        });

        // Convert grouped environment variables to VariableIdentifier format
        envGroups.forEach((group, envKey) => {
            const envVarItem: VariableIdentifier = {
                variable: group.variable,
                nodeId: group.nodeInstances[0].nodeId, // Use first instance as representative
                nodeServiceHandle: ENV_IDENTIFIER,
                nodeServiceVariant: 0,
                // Add metadata about all instances
                envMetadata: {
                    envKey: envKey,
                    nodeInstances: group.nodeInstances
                }
            };
            configTab.group.variables.push(envVarItem);
        });

        tabItems.push(configTab);
        tabItems.push(secretsTab);

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
                activeTab?.group.variables.map(({variable, nodeId, nodeServiceHandle, nodeServiceVariant, secretMetadata, envMetadata}) => {
                    if (variable.parentHandle) return null;
                    const {baseType} = interpretNodeVariableType(variable);
                    const syncKey = `${nodeServiceHandle}::${nodeServiceVariant ?? 1}::${variable.handle}`;
                    let isSynced = false;
                    if (syncMap.has(syncKey)) {
                        const synced = syncMap.get(syncKey);
                        isSynced = synced?.some(({nodeId: id}) => id === nodeId) ?? false;
                    }

                    if (nodeServiceHandle === SECRET_IDENTIFIER) {
                        const secretKey = secretMetadata?.secretKey || (variable.value as string);
                        const nodeInstances = secretMetadata?.nodeInstances || [{nodeId, nodeName: undefined}];
                        const nodeCount = nodeInstances.length;

                        const nodeSources = nodeInstances.filter(n => n.source === 'node');
                        const inlineSources = nodeInstances.filter(n => n.source === 'inline');
                        const hasMultipleSources = nodeSources.length > 0 && inlineSources.length > 0;

                        return (
                            <div key={secretKey}>
                                <div className={'border rounded-md border-sky-500/50 dark:border-white/10 p-5'}>
                                    <Subheading>
                                        <span className="inline-flex items-center gap-2 mb-2">
                                            Secret: {secretKey}
                                            {nodeCount > 1 && (
                                                <span
                                                    className="text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 px-2 py-1 rounded"
                                                    title={`Used in ${nodeCount} nodes: ${nodeInstances.map(n => n.nodeName || `Node ${n.nodeId.slice(0,8)}`).join(', ')}`}
                                                >
                                                    {nodeCount} nodes
                                                </span>
                                            )}
                                            {hasMultipleSources && (
                                                <span
                                                    className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-1 rounded"
                                                    title="Used via both secret nodes and inline patterns"
                                                >
                                                    dual sources
                                                </span>
                                            )}
                                        </span>
                                    </Subheading>
                                    {nodeCount > 1 && (
                                        <div className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            <div className="space-y-1">
                                                {nodeSources.length > 0 && (
                                                    <div>
                                                        <strong>Secret nodes:</strong> {nodeSources.map(n => n.nodeName || `Node ${n.nodeId.slice(0,8)}`).join(', ')}
                                                    </div>
                                                )}
                                                {inlineSources.length > 0 && (
                                                    <div>
                                                        <strong>Inline usage:</strong> {inlineSources.map(n => `${n.nodeName || `Node ${n.nodeId.slice(0,8)}`}${n.variableHandle ? `.${n.variableHandle}` : ''}`).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
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
                            </div>
                        );
                    } else if (nodeServiceHandle === ENV_IDENTIFIER) {
                        const envKey = envMetadata?.envKey || (variable.value as string);
                        const nodeInstances = envMetadata?.nodeInstances || [{nodeId, nodeName: undefined}];
                        const nodeCount = nodeInstances.length;

                        const nodeSources = nodeInstances.filter(n => n.source === 'node');
                        const inlineSources = nodeInstances.filter(n => n.source === 'inline');
                        const hasMultipleSources = nodeSources.length > 0 && inlineSources.length > 0;

                        return (
                            <div key={envKey}>
                                <div className="border rounded-md border-sky-500/50 dark:border-white/10 p-5">
                                    <Subheading>
                                        <span className="inline-flex items-center gap-2 mb-2">
                                            Environment: {envKey}
                                            <span
                                                className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded"
                                                title={`Used in ${nodeCount} node${nodeCount === 1 ? '' : 's'}: ${nodeInstances.map(n => n.nodeName || `Node ${n.nodeId.slice(0,8)}`).join(', ')}`}
                                            >
                                                {nodeCount} node{nodeCount === 1 ? '' : 's'}
                                            </span>
                                            {hasMultipleSources && (
                                                <span
                                                    className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-1 rounded"
                                                    title="Used via both environment nodes and inline patterns"
                                                >
                                                    dual sources
                                                </span>
                                            )}
                                        </span>
                                    </Subheading>
                                    {(nodeCount > 1 || hasMultipleSources) && (
                                        <div className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            <div className="space-y-1">
                                                {nodeSources.length > 0 && (
                                                    <div>
                                                        <strong>Environment nodes:</strong> {nodeSources.map(n => n.nodeName || `Node ${n.nodeId.slice(0,8)}`).join(', ')}
                                                    </div>
                                                )}
                                                {inlineSources.length > 0 && (
                                                    <div>
                                                        <strong>Inline usage:</strong> {inlineSources.map(n => `${n.nodeName || `Node ${n.nodeId.slice(0,8)}`}${n.variableHandle ? `.${n.variableHandle}` : ''}`).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
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
                            </div>
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

        </div>
    );
};

export default PublishedVariables;
