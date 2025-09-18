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

    const isGenerating = useAvatarStore(state => state.isGenerating(nodeId));
    const startGenerating = useAvatarStore(state => state.startGenerating);
    const stopGenerating = useAvatarStore(state => state.stopGenerating);
    const updateNodeVariable = useNodesStore(state => state.updateNodeVariable);
    const getNodeVariable = useNodesStore(state => state.getNodeVariable);

    const onEdit = (nodeId: string) => {
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
    };

    return (
        <div className={'relative'}>
            {variable?.dock?.enabled === false || (variable.published && inDock) && (
                <div className="absolute inset-0 bg-black/40 rounded-md z-10 pointer-events-none"/>
            )}
            <Fieldset>
                <Label>{variable.handle}</Label>
                <Field>
                    <button
                        className={`w-full pb-1 ring-1 rounded-md dark:text-white/50 bg-transparent dark:bg-white/5 border border-zinc-950/20 dark:border-white/10 relative before:absolute before:inset-px before:rounded-[calc(theme(borderRadius.md)-1px)] before:bg-zinc-50 before:shadow dark:before:hidden ${isGenerating && "opacity-60 cursor-wait"}`}
                        onClick={() => onEdit(nodeId)}
                        disabled={isGenerating}
                    >
                        {isGenerating ? "Generating..." : "Generate new avatar"}
                        <UserCircleIcon className="w-4 h-4 inline ml-1 text-sky-700/80 dark:text-white/50"/>
                    </button>
                </Field>
            </Fieldset>
        </div>
    );
};

export default VariableTypeAvatar;
