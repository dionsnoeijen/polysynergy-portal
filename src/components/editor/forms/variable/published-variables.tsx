import {Node, NodeVariable, NodeVariableType} from "@/types/types";
import React, {useEffect, useState} from "react";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";
import {Subheading} from "@/components/heading";
import {Text} from "@/components/text";
import {Divider} from "@/components/divider";
import {VariableTypeComponents} from "@/components/editor/sidebars/dock";
import EditDictVariable from "@/components/editor/forms/variable/edit-dict-variable";
import useNodesStore from "@/stores/nodesStore";
import {PlayIcon} from "@heroicons/react/24/outline";

type Props = {
    nodes: Node[];
    variables: { [nodeId: string]: { [handle: string]: NodeVariable[] } };
    setVariables: React.Dispatch<React.SetStateAction<{ [nodeId: string]: { [handle: string]: NodeVariable[] } }>>;
    simpleVariables: { [nodeId: string]: { [handle: string]: string } };
    setSimpleVariables: React.Dispatch<React.SetStateAction<{ [nodeId: string]: { [handle: string]: string } }>>;
    publishedVariables: { variable: NodeVariable; nodeId: string }[];
    setPublishedVariables: React.Dispatch<React.SetStateAction<{ variable: NodeVariable; nodeId: string }[]>>;
};

type GroupedPublishedVariable = {
    playConfigNode?: Node;
    variables: { variable: NodeVariable; nodeId: string }[];
};

type TabItem = {
    key: string;
    title: string;
    info: string;
    group: GroupedPublishedVariable;
};

const PublishedVariables: React.FC<Props> = ({
    nodes,
    variables,
    setVariables,
    simpleVariables,
    setSimpleVariables,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    publishedVariables,
    setPublishedVariables,
}) => {
    const leadsToPlayConfig = useNodesStore((state) => state.leadsToPlayConfig);
    const getNodeVariable = useNodesStore((state) => state.getNodeVariable);

    const [tabs, setTabs] = useState<TabItem[]>([]);
    const [activeTabKey, setActiveTabKey] = useState<string>("default");

    const handleVariableChange = (nodeId: string, updatedVariables: NodeVariable[], handle?: string) => {
        if (!handle) return;
        setVariables((prev) => ({
            ...prev,
            [nodeId]: {
                ...prev[nodeId],
                [handle]: updatedVariables,
            },
        }));
    };

    const handleSimpleVariableChange = (nodeId: string, handle: string, value: string) => {
        setSimpleVariables((prev) => ({
            ...prev,
            [nodeId]: {
                ...prev[nodeId],
                [handle]: value,
            },
        }));
    };

    useEffect(() => {
        const initialVariables: { [nodeId: string]: { [handle: string]: NodeVariable[] } } = {};
        const initialSimpleVariables: { [nodeId: string]: { [handle: string]: string } } = {};
        const pubVariables: { variable: NodeVariable; nodeId: string }[] = [];

        nodes.forEach((node) => {
            const dictVariables = node.variables.filter(
                (variable) => variable.published && variable.type === NodeVariableType.Dict
            );
            const otherVariables = node.variables.filter(
                (variable) => variable.published && variable.type !== NodeVariableType.Dict
            );
            if (dictVariables.length > 0) {
                initialVariables[node.id] = {};
                dictVariables.forEach((variable) => {
                    initialVariables[node.id][variable.handle] = (variable.value as NodeVariable[]) || [];
                    pubVariables.push({variable, nodeId: node.id});
                });
            }
            if (otherVariables.length > 0) {
                initialSimpleVariables[node.id] = {};
                otherVariables.forEach((variable) => {
                    initialSimpleVariables[node.id][variable.handle] = (variable.value as string) || "";
                    pubVariables.push({variable, nodeId: node.id});
                });
            }
        });

        setVariables(initialVariables);
        setSimpleVariables(initialSimpleVariables);
        setPublishedVariables(pubVariables);

        const groupedMap: Map<string | null, GroupedPublishedVariable> = new Map();

        for (const pv of pubVariables) {
            const playConfigNode = leadsToPlayConfig(pv.nodeId);
            const groupKey = playConfigNode?.id ?? null;

            if (!groupedMap.has(groupKey)) {
                groupedMap.set(groupKey, {
                    playConfigNode,
                    variables: [],
                });
            }

            groupedMap.get(groupKey)!.variables.push(pv);
        }

        const tabItems: TabItem[] = Array.from(groupedMap.entries()).map(([key, group]) => {
            const rawTitle = group.playConfigNode
                ? getNodeVariable(group.playConfigNode.id, "title")?.value
                : undefined;

            const rawInfo = group.playConfigNode
                ? getNodeVariable(group.playConfigNode.id, "info")?.value
                : undefined;

            return {
                key: key ?? "default",
                title: typeof rawTitle === "string" ? rawTitle : "Configuration",
                info: typeof rawInfo === "string" ? rawInfo : "",
                group,
            };
        });

        setTabs(tabItems);
        setActiveTabKey(tabItems[0]?.key ?? "default");
    }, [getNodeVariable, leadsToPlayConfig, nodes, setPublishedVariables, setSimpleVariables, setVariables]);

    const triggerPlayConfig = (node: Node) => {
        console.log("Executing config node:", node.id);
    };

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

            {activeTab?.group.variables.map(({variable, nodeId}) => {
                const {baseType} = interpretNodeVariableType(variable);
                if (baseType === NodeVariableType.Dict) {
                    return (
                        <div key={nodeId + "-" + variable.handle}>
                            <Subheading>{variable.published_title}</Subheading>
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
                            <Subheading>{variable.published_title}</Subheading>
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
            })}

            {activeTab?.group.playConfigNode && (
                <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition"
                        onClick={() => triggerPlayConfig(activeTab.group.playConfigNode!)}
                    >
                        <PlayIcon className="h-5 w-5"/>
                        Voer configuratie uit
                    </button>
                </div>
            )}
        </div>
    );
};

export default PublishedVariables;
