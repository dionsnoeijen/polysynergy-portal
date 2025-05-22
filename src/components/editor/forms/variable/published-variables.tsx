import {Node, NodeVariable, NodeVariableType} from "@/types/types";
import React, {useEffect, useMemo, useState} from "react";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";
import {Subheading} from "@/components/heading";
import {Text} from "@/components/text";
import {Divider} from "@/components/divider";
import {VariableTypeComponents} from "@/components/editor/sidebars/dock";
import EditDictVariable from "@/components/editor/forms/variable/edit-dict-variable";
import useNodesStore from "@/stores/nodesStore";
import {CheckCircleIcon, LinkIcon, PlayIcon} from "@heroicons/react/24/outline";
import useProjectSecretsStore from "@/stores/projectSecretsStore";
import {Input} from "@/components/input";
import {useHandlePlay} from "@/hooks/editor/useHandlePlay";
import useMockStore from "@/stores/mockStore";
import FormattedNodeOutput from "@/components/editor/bottombars/formatted-node-output";

type VariableIdentifier = {
    variable: NodeVariable;
    nodeId: string;
    nodeServiceHandle?: string;
    nodeServiceVariant?: number;
}

type Props = {
    nodes: Node[];
    variables: { [nodeId: string]: { [handle: string]: NodeVariable[] } };
    setVariables: React.Dispatch<React.SetStateAction<{ [nodeId: string]: { [handle: string]: NodeVariable[] } }>>;
    simpleVariables: { [nodeId: string]: { [handle: string]: string } };
    setSimpleVariables: React.Dispatch<React.SetStateAction<{ [nodeId: string]: { [handle: string]: string } }>>;
    publishedVariables: VariableIdentifier[];
    setPublishedVariables: React.Dispatch<React.SetStateAction<VariableIdentifier[]>>;
    secretVariables: { key: string, value: string }[];
    setSecretVariables: React.Dispatch<React.SetStateAction<{ key: string, value: string }[]>>;
};

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
const SECRET_EXISTS = 0;
const SECRET_MUST_BE_CREATED = 1;

const PublishedVariables: React.FC<Props> = ({
                                                 nodes,
                                                 variables,
                                                 setVariables,
                                                 simpleVariables,
                                                 setSimpleVariables,
                                                 // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                 publishedVariables,
                                                 setPublishedVariables,
                                                 // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                 secretVariables,
                                                 setSecretVariables
                                             }) => {
    const leadsToPlayConfig = useNodesStore((state) => state.leadsToPlayConfig);
    const getNodeVariable = useNodesStore((state) => state.getNodeVariable);
    const getSecretNodes = useNodesStore((state) => state.getSecretNodes);
    const secrets = useProjectSecretsStore((state) => state.secrets);
    const getMockResultForNode = useMockStore((state) => state.getMockResultForNode);
    const handlePlay = useHandlePlay();

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

    const handleVariableChange = (nodeId: string, updatedVariables: NodeVariable[], handle?: string) => {
        if (!handle) return;

        const syncKey = publishedVariables.find(
            (pv) => pv.nodeId === nodeId && pv.variable.handle === handle
        );

        // No service? Only update the specific node
        if (!syncKey?.nodeServiceHandle) {
            setVariables((prev) => {
                const updated = {...prev};
                if (!updated[nodeId]) updated[nodeId] = {};
                updated[nodeId][handle] = updatedVariables;
                return updated;
            });
            return;
        }

        // With service? Sync the value between service instances
        const key = `${syncKey.nodeServiceHandle}::${syncKey.nodeServiceVariant ?? 1}::${handle}`;
        const synced = syncMap.get(key) || [{nodeId, handle}];

        setVariables((prev) => {
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

        setSimpleVariables((prev) => {
            const updated = {...prev};
            for (const {nodeId, handle} of synced) {
                if (!updated[nodeId]) updated[nodeId] = {};
                updated[nodeId][handle] = value;
            }
            return updated;
        });
    };

    const handleSecretCreation = async (secretKey: string, value: string) => {
        const exists = secrets.find((s) => s.key === secretKey);
        if (exists) {
            console.log('Secret already exists:', exists);
            return;
        }
        setSecretVariables(prev => {
            if (prev.some(secret => secret.key === secretKey)) {
                return prev.map(secret =>
                    secret.key === secretKey ? {...secret, value} : secret
                );
            } else {
                return [...prev, {key: secretKey, value}];
            }
        });
    }

    useEffect(() => {
        const initialVariables: { [nodeId: string]: { [handle: string]: NodeVariable[] } } = {};
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
                    if (!initialVariables[node.id]) initialVariables[node.id] = {};
                    initialVariables[node.id][dictVar.handle] = children;
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
                (variable) => variable.published && variable.type !== NodeVariableType.Dict
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

        setVariables(initialVariables);
        setSimpleVariables(initialSimpleVariables);
        setPublishedVariables(pubVariables);

        const tabItems: TabItem[] = [];

        // Always create the Configuration tab first
        const configTab: TabItem = {
            key: "config",
            title: "Configuration",
            info: "",
            group: {
                playConfigNode: undefined,
                variables: []
            }
        };

        // Always create the Secrets tab second
        const secretsTab: TabItem = {
            key: "secrets",
            title: "Secrets",
            info: "Sensitive data, such as passwords or API keys, are created as a secret.",
            group: {
                playConfigNode: undefined,
                variables: []
            }
        };

        // Find all play button nodes
        const playButtonNodes = nodes.filter(node => {
            if (!node.has_play_button) return false;
            const title = getNodeVariable(node.id, "title")?.value;
            return typeof title === "string" && title.trim() !== "";
        });

        const playButtonTabs: TabItem[] = playButtonNodes.map(node => {
            const title = getNodeVariable(node.id, "title")?.value as string;
            const info = getNodeVariable(node.id, "info")?.value as string;

            return {
                key: node.id,
                title: title,
                info: info || "",
                group: {
                    playConfigNode: node,
                    variables: []
                }
            };
        });

        // Distribute published variables
        for (const pv of pubVariables) {
            const playConfigNode = leadsToPlayConfig(pv.nodeId);
            if (playConfigNode) {
                // Add to the corresponding play button tab
                const playButtonTab = playButtonTabs.find(tab => tab.key === playConfigNode.id);
                if (playButtonTab) {
                    playButtonTab.group.variables.push(pv);
                }
            } else {
                // Add to the config tab
                configTab.group.variables.push(pv);
            }
        }

        // Handle secret nodes
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

                // Check if this secret leads to a play button
                const playConfigNode = leadsToPlayConfig(node.id);
                if (playConfigNode) {
                    // Add to the corresponding play button tab
                    const playButtonTab = playButtonTabs.find(tab => tab.key === playConfigNode.id);
                    if (playButtonTab) {
                        playButtonTab.group.variables.push(secretVar);
                    }
                } else {
                    // Add to the secrets tab
                    secretsTab.group.variables.push(secretVar);
                }
            });
        });

        // Add tabs in the correct order
        tabItems.push(configTab);
        tabItems.push(secretsTab);
        tabItems.push(...playButtonTabs);

        setTabs(tabItems);
        setActiveTabKey(tabItems[0]?.key ?? "default");
    }, [getNodeVariable, getSecretNodes, leadsToPlayConfig, nodes, secrets, setPublishedVariables, setSimpleVariables, setVariables]);

    const activeTab = tabs.find((tab) => tab.key === activeTabKey);

    return (
        <div className="flex flex-col gap-4">
            <div className="mb-4 flex gap-2 border-b border-white/10">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`px-4 py-2 text-sm font-medium transition ${
                            activeTabKey === tab.key
                                ? "border-b-2 border-white text-white"
                                : "text-white/60 hover:text-white"
                        }`}
                        onClick={() => setActiveTabKey(tab.key)}
                    >
                        {tab.title}
                    </button>
                ))}
            </div>

            {activeTab?.info && (
                <div className="mb-4 rounded-md border border-white/10 p-4">
                    <Text dangerouslySetInnerHTML={{__html: activeTab.info}}/>
                </div>
            )}

            {!activeTab || activeTab?.group.variables.length === 0 ? (
                <div className="rounded-md border border-white/10 p-4 text-white/60 text-sm italic">
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
                        if (nodeServiceVariant === SECRET_EXISTS) {
                            return (
                                <div key={nodeId + "-" + variable.handle}>
                                    <Subheading>
                                        <span className="inline-flex items-center gap-2">
                                            Secret: {variable.value as string} Exists:
                                            <CheckCircleIcon className={'w-4 h-5 text-green-500'}/>
                                        </span>
                                    </Subheading>
                                    <Divider className="my-10" soft bleed/>
                                </div>
                            );
                        } else {
                            return (
                                <div key={nodeId + "-" + variable.handle}>
                                    <Subheading>
                                        <span className="inline-flex items-center gap-2">
                                            Secret: {variable.value as string}
                                        </span>
                                    </Subheading>
                                    <Input
                                        type={"password"}
                                        onChange={(e) => handleSecretCreation(variable.value as string, e.currentTarget.value as string)}
                                        placeholder={'******'}
                                        aria-label={variable.handle}
                                    />
                                    <Divider className="my-10" soft bleed/>
                                </div>
                            );
                        }
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
                                    <div className="mb-4 rounded-md border border-white/10 p-4">
                                        <Text dangerouslySetInnerHTML={{__html: variable.published_description}}/>
                                    </div>
                                )}
                                <EditDictVariable
                                    title={variable.handle}
                                    onlyValues={true}
                                    variables={variables[nodeId]?.[variable.handle] || []}
                                    handle={variable.handle}
                                    onChange={(updatedVariables, handle) =>
                                        handleVariableChange(nodeId, updatedVariables, handle)
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
                                            className="w-4 h-4 text-white/60"
                                            title={`Synced with ${nodeServiceHandle} ${nodeServiceVariant ?? 1}`}
                                        />}
                                    </span>
                                </Subheading>
                                {variable.published_description && (
                                    <div className="mb-4 rounded-md border border-white/10 p-4">
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
                                />
                                <Divider className="my-10" soft bleed/>
                            </div>
                        ) : null;
                    }
                })
            )}

            {activeTab?.group.playConfigNode && (
                <>
                    {(() => {
                        const result = getMockResultForNode?.(activeTab.group.playConfigNode!.id);

                        if (!result?.variables) return null;

                        return (
                            <div className="mb-4 rounded-md border border-white/10 p-4 bg-white/5">
                                <div className="mb-2 text-white font-semibold text-sm">
                                    Result
                                </div>
                                <FormattedNodeOutput variables={result.variables}/>
                            </div>
                        );
                    })()}
                    <div className="flex justify-end">


                        <button
                            type="button"
                            className="flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition"
                            onClick={(e) => handlePlay(e, activeTab.group.playConfigNode!.id)}
                        >
                            <PlayIcon className="h-5 w-5"/>
                            Run
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default PublishedVariables;
