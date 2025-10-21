import React from "react";
import {NodeVariable} from "@/types/types";
import {Field, Fieldset, Label} from "@/components/fieldset";
import {UserCircleIcon} from "@heroicons/react/24/outline";
import {fetchGenerateAvatar} from "@/api/fetchGenerateAvatar";
import {useAvatarStore} from "@/stores/avatarStore";
import useNodesStore from "@/stores/nodesStore";

type Props = {
    nodeId: string;
    variable: NodeVariable;
    inDock?: boolean;
    categoryBorder?: string;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    categoryBackgroundColor?: string;
    categoryGradientBackgroundColor?: string;
};

const VariableTypeAvatar: React.FC<Props> = ({
    nodeId,
    variable,
    inDock = true,
    // eslint-disable-next-line
    categoryBorder = 'border border-sky-200 dark:border-zinc-700',
    // eslint-disable-next-line
    categoryMainTextColor = 'text-sky-500 dark:text-white/70',
    // eslint-disable-next-line
    categorySubTextColor = 'text-sky-800 dark:text-white/70',
    // eslint-disable-next-line
    categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
    // eslint-disable-next-line
    categoryGradientBackgroundColor = 'bg-gradient-to-r from-sky-100 to-sky-200 dark:from-zinc-800 dark:to-zinc-900',
}) => {
    // PERFORMANCE: Convert store subscriptions to getState() pattern
    // These components are rendered for every variable in the dock sidebar
    const isGenerating = useAvatarStore(state => state.isGenerating(nodeId));

    const onEdit = React.useCallback((nodeId: string) => {
        const { startGenerating, stopGenerating } = useAvatarStore.getState();
        const { updateNodeVariable, getNodeVariable } = useNodesStore.getState();

        // Start generation state immediately for instant UI feedback
        startGenerating(nodeId);

        // Fire-and-forget async generation to prevent UI blocking
        (async () => {
            try {
                const name = getNodeVariable(nodeId, 'name')?.value as string || "";
                const instructions = getNodeVariable(nodeId, 'instructions')?.value as string || "";

                console.log('🎨 [Avatar] Starting background avatar generation for node:', nodeId);
                const result = await fetchGenerateAvatar(nodeId, name, instructions);

                // Update with cache-busting timestamp for immediate visual refresh
                updateNodeVariable(nodeId, variable.handle, `${result}?v=${Date.now()}`);
                console.log('✅ [Avatar] Avatar generation completed for node:', nodeId);
            } catch (e) {
                console.error('❌ [Avatar] Generation failed for node:', nodeId, e);
                // Could add user notification here
            } finally {
                stopGenerating(nodeId);
            }
        })(); // IIFE to run async function immediately without blocking
    }, [variable.handle]);

    return (
        <div className={'relative'}>
            {variable?.dock?.enabled === false && (
                <div className="absolute inset-0 bg-sky-50/60 dark:bg-black/40 rounded-md z-10 pointer-events-none"/>
            )}
            <Fieldset>
                <Label>{variable.handle}</Label>
                <Field>
                    <button
                        className={`w-full pb-1 ring-1 rounded-md text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 ${isGenerating && "opacity-60 cursor-wait"} ${variable.published && inDock ? 'shadow-[0_0_0_2px_rgb(59_130_246)] dark:shadow-[0_0_0_2px_rgb(96_165_250)]' : ''}`}
                        onClick={() => onEdit(nodeId)}
                        disabled={isGenerating}
                    >
                        {isGenerating ? "Generating..." : "Generate new avatar"}
                        <UserCircleIcon className="w-4 h-4 inline ml-1 text-blue-700/80 dark:text-white/50"/>
                    </button>
                </Field>
            </Fieldset>
        </div>
    );
};

// PERFORMANCE: Memoize to prevent unnecessary re-renders
export default React.memo(VariableTypeAvatar, (prevProps, nextProps) => {
    return (
        prevProps.variable === nextProps.variable &&
        prevProps.nodeId === nextProps.nodeId &&
        prevProps.inDock === nextProps.inDock
    );
});
