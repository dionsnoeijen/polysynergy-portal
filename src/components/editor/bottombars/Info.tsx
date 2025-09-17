import React, {useEffect, useState} from "react";
import {Route} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useStagesStore from "@/stores/stagesStore";
import {formatSegments} from "@/utils/formatters";

import {Button} from "@/components/button";

const Info: React.FC = (): React.ReactElement => {

    const activeRouteId = useEditorStore((state) => state.activeRouteId);
    const getDynamicRoute = useDynamicRoutesStore((state) => state.getDynamicRoute);
    const stages = useStagesStore((state) => state.stages);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    
    const activeVersionId = useEditorStore((state) => state.activeVersionId);

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
            <div className="w-1/2 min-w-[300px] border-r border-sky-500/50 dark:border-white/10 h-full flex flex-col">
                <div className="border-b border-sky-500/50 dark:border-white/10 p-2">
                    <h3 className="text-sky-500 dark:text-white/80">Info</h3>
                </div>
                <div className="flex-1 overflow-auto p-4 text-sm text-white/80">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Button color="sky">Share</Button>
                        <Button color="sky">Duplicate</Button>
                        <Button color="sky">Export JSON</Button>
                    </div>

                    {activeItem && (
                        <section className="mb-4 rounded-md border border-sky-500/50 dark:border-white/10 p-4">
                            <span className={'font-bold'}>Route</span><br/>
                            {stages.map((stage) => {
                                const basePath = `https://${activeProjectId}{{stage}}`;
                                const isProd = stage.is_production;
                                const stagePrefix = isProd ? '' : `-${stage.name}`;
                                const fullUrl = `${basePath.replace('{{stage}}', stagePrefix)}.polysynergy.com/${formatSegments((activeItem as Route)?.segments)}`;
                                return (
                                    <div key={stage.name} className="flex items-start gap-2">
                                        <span className="w-24 shrink-0 font-semibold text-sky-600 dark:text-white">
                                            {stage.name}
                                        </span>
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                            <span className="uppercase font-medium">{activeItem.method}</span>: {fullUrl}
                                        </span>
                                    </div>
                                );
                            })}
                        </section>
                    )}

                    <ul className="text-sm text-sky-500 dark:text-white/70 space-y-1 mb-6">
                        <li><span className="text-sky-500 dark:text-white">Project id:</span> {activeProjectId}</li>
                        <li><span
                            className="text-sky-500 dark:text-white">Node setup version id:</span> {activeVersionId}
                        </li>
                    </ul>

                    <ul className="text-sm dark:text-white/70 space-y-1">
                        <li><span className="text-sky-500 dark:text-white">Executed Nodes:</span> 0</li>
                        <li><span className="text-sky-500 dark:text-white">Start time:</span> 14:42:08</li>
                        <li><span className="text-sky-500 dark:text-white">Duration:</span> 1.7s</li>
                        <li><span className="text-sky-500 dark:text-white">Result:</span> success</li>
                    </ul>

                    {/*<div className="mt-6 text-sky-500">View full logs →</div>*/}
                </div>
            </div>
        </div>
    )
}

export default Info;