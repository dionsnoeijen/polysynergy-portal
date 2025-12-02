import React, {useEffect, useState} from "react";
import {Route} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useStagesStore from "@/stores/stagesStore";
import {formatSegments} from "@/utils/formatters";
import config from "@/config";
import { useBranding } from "@/contexts/branding-context";
import { hexToRgba } from "@/utils/colorUtils";

import {ChatBubbleLeftIcon, EnvelopeIcon, CodeBracketIcon} from "@heroicons/react/24/outline";

const Info: React.FC = (): React.ReactElement => {
    const { accent_color } = useBranding();

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
            <div
                className="w-1/2 min-w-[300px] border-r dark:border-white/10 h-full flex flex-col"
                style={{ borderRightColor: hexToRgba(accent_color, 0.5) }}
            >
                <div
                    className="border-b dark:border-white/10 p-2"
                    style={{ borderBottomColor: hexToRgba(accent_color, 0.5) }}
                >
                    <h3 className="dark:text-white/80" style={{ color: accent_color }}>Info</h3>
                </div>
                <div className="flex-1 overflow-auto p-4 text-sm text-white/80">
                    {activeItem && (
                        <section
                            className="mb-4 rounded-md border dark:border-white/10 p-4"
                            style={{ borderColor: hexToRgba(accent_color, 0.5) }}
                        >
                            <span className={'font-bold'}>Route</span><br/>
                            {stages.map((stage) => {
                                const basePath = `https://${activeProjectId}{{stage}}`;
                                const isProd = stage.is_production;
                                const stagePrefix = isProd ? '' : `-${stage.name}`;
                                const fullUrl = `${basePath.replace('{{stage}}', stagePrefix)}.polysynergy.com/${formatSegments((activeItem as Route)?.segments)}`;
                                return (
                                    <div key={stage.name} className="flex items-start gap-2">
                                        <span className="w-24 shrink-0 font-semibold dark:text-white" style={{ color: accent_color }}>
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

                    <ul className="text-sm dark:text-white/70 space-y-1 mb-6" style={{ color: accent_color }}>
                        <li><span className="dark:text-white" style={{ color: accent_color }}>Project id:</span> {activeProjectId}</li>
                        <li><span
                            className="dark:text-white" style={{ color: accent_color }}>Node setup version id:</span> {activeVersionId}
                        </li>
                    </ul>

                    <ul className="text-sm dark:text-white/70 space-y-1">
                        <li><span className="dark:text-white" style={{ color: accent_color }}>Executed Nodes:</span> 0</li>
                        <li><span className="dark:text-white" style={{ color: accent_color }}>Start time:</span> 14:42:08</li>
                        <li><span className="dark:text-white" style={{ color: accent_color }}>Duration:</span> 1.7s</li>
                        <li><span className="dark:text-white" style={{ color: accent_color }}>Result:</span> success</li>
                    </ul>
                </div>
            </div>

            {/* Need Help Section - Right Panel */}
            <div className="flex-1 h-full flex flex-col">
                <div
                    className="border-b dark:border-white/10 p-2"
                    style={{ borderBottomColor: hexToRgba(accent_color, 0.5) }}
                >
                    <h3 className="dark:text-white/80" style={{ color: accent_color }}>Need Help?</h3>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <div className="space-y-3">
                        <a
                            href={config.SUPPORT_DISCORD_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-3 rounded-md border dark:border-white/10 bg-white dark:bg-zinc-800/50 transition-colors"
                            style={{ borderColor: hexToRgba(accent_color, 0.5) }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hexToRgba(accent_color, 0.1)}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                        >
                            <ChatBubbleLeftIcon className="w-5 h-5 dark:text-white/70 flex-shrink-0 mt-0.5" style={{ color: accent_color }} />
                            <div>
                                <div className="font-semibold dark:text-white/80 text-sm" style={{ color: accent_color }}>Discord</div>
                                <div className="text-xs text-zinc-700 dark:text-zinc-400 mt-1">
                                    Chat with us - usually available during the day
                                </div>
                            </div>
                        </a>

                        <a
                            href={config.SUPPORT_GITHUB_ISSUES_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-3 rounded-md border dark:border-white/10 bg-white dark:bg-zinc-800/50 transition-colors"
                            style={{ borderColor: hexToRgba(accent_color, 0.5) }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hexToRgba(accent_color, 0.1)}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                        >
                            <CodeBracketIcon className="w-5 h-5 dark:text-white/70 flex-shrink-0 mt-0.5" style={{ color: accent_color }} />
                            <div>
                                <div className="font-semibold dark:text-white/80 text-sm" style={{ color: accent_color }}>GitHub Issues</div>
                                <div className="text-xs text-zinc-700 dark:text-zinc-400 mt-1">
                                    Report bugs or request features
                                </div>
                            </div>
                        </a>

                        <a
                            href={`mailto:${config.SUPPORT_EMAIL}`}
                            className="flex items-start gap-3 p-3 rounded-md border dark:border-white/10 bg-white dark:bg-zinc-800/50 transition-colors"
                            style={{ borderColor: hexToRgba(accent_color, 0.5) }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hexToRgba(accent_color, 0.1)}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                        >
                            <EnvelopeIcon className="w-5 h-5 dark:text-white/70 flex-shrink-0 mt-0.5" style={{ color: accent_color }} />
                            <div>
                                <div className="font-semibold dark:text-white/80 text-sm" style={{ color: accent_color }}>Email</div>
                                <div className="text-xs text-zinc-700 dark:text-zinc-400 mt-1">
                                    {config.SUPPORT_EMAIL}
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Info;