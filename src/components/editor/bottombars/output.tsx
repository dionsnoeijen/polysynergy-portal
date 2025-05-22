import React, {useEffect, useState} from "react";
import useMockStore from "@/stores/mockStore";
import {ChevronLeftIcon} from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import {getNodeExecutionDetails} from "@/api/executionApi";
import FormattedNodeOutput from "@/components/editor/bottombars/formatted-node-output";
import {Button} from "@/components/button";
import {Route} from "@/types/types";
import {formatSegments} from "@/utils/formatters";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";

const Output: React.FC = (): React.ReactElement => {
    const mockNodes = useMockStore((state) => state.mockNodes);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const activeRouteId = useEditorStore((state) => state.activeRouteId);
    const getDynamicRoute = useDynamicRoutesStore((state) => state.getDynamicRoute);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [expandedNodes, setExpandedNodes] = useState<Record<string, any>>({});

    const reversedNodes = [...mockNodes]
        .sort((a, b) => a.order - b.order)
        .reverse();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toggleNode = async (node: any) => {
        const nodeKey = `${node.id}-${node.order}`;
        if (expandedNodes[nodeKey]) {
            setExpandedNodes((prev) => {
                const newState = {...prev};
                delete newState[nodeKey];
                return newState;
            });
            return;
        }

        const data = await getNodeExecutionDetails(
            activeVersionId as string,
            node.runId,
            node.id,
            node.order
        );

        setExpandedNodes((prev) => ({
            ...prev,
            [nodeKey]: data,
        }));
    };

    const [activeItem, setActiveItem] = useState<Route | undefined>();
    useEffect(() => {
        let isMounted = true;

        const check = () => {
            const item = activeRouteId ? getDynamicRoute(activeRouteId) : undefined;
            if (isMounted) {
                setActiveItem(item);
            }
        };

        check(); // immediate
        const interval = setInterval(check, 250); // continue checking if needed

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [activeRouteId, getDynamicRoute]);

    return (
        <div className="flex h-full">
            <div className="w-1/2 min-w-[300px] border-r border-white/10 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3>Node</h3>
                </div>
                <div className="flex-1 overflow-auto">
                    {reversedNodes.map((node, index) => {
                        const nodeKey = `${node.id}-${node.order}`;
                        const isOpen = !!expandedNodes[nodeKey];
                        return (
                            <div key={nodeKey} className="border-b border-white/10 p-2">
                                <div
                                    className="flex justify-between items-center cursor-pointer hover:bg-white/5"
                                    onClick={() => toggleNode(node)}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500 text-white">
                                            {reversedNodes.length - index}
                                        </span>
                                        <span className="text-sm font-bold">{node.type}</span>:
                                        <span className="text-[0.7rem] font-light">{node.handle}</span>
                                    </span>
                                    <ChevronLeftIcon
                                        className={`w-4 h-4 transition-transform ${isOpen ? "-rotate-90" : ""}`}
                                    />
                                </div>

                                {isOpen && expandedNodes[nodeKey]?.variables && (
                                    <FormattedNodeOutput variables={expandedNodes[nodeKey].variables}/>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="w-1/2 min-w-[300px] border-r border-white/10 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3>Summary</h3>
                </div>
                <div className="flex-1 overflow-auto p-4 text-sm text-white/80">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Button plain>Share</Button>
                        <Button plain>Duplicate</Button>
                        <Button plain>Export JSON</Button>
                    </div>

                    {activeItem && (
                        <section className="mb-4 rounded-md border border-white/10 p-4">
                            <span className={'font-bold'}>Route</span><br/>
                            <p>{activeItem.method}: {`https://${activeProjectId}.polysynergy.com/${formatSegments((activeItem as Route)?.segments)}`}</p>
                        </section>
                    )}

                    <ul className="text-sm text-white/70 space-y-1 mb-6">
                        <li><span className="text-white">Project id:</span> {activeProjectId}</li>
                        <li><span className="text-white">Node setup version id:</span> {activeVersionId}</li>
                    </ul>

                    <ul className="text-sm text-white/70 space-y-1">
                        <li><span className="text-white">Nodes:</span> {mockNodes.length}</li>
                        <li><span className="text-white">Start time:</span> 14:42:08</li>
                        <li><span className="text-white">Duration:</span> 1.7s</li>
                        <li><span className="text-white">Result:</span> success</li>
                    </ul>

                    <div className="mt-6 text-blue-400">View full logs →</div>
                </div>
            </div>
        </div>
    );
};

export default Output;
