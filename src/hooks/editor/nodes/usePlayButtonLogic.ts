import {useState, useMemo} from 'react';
import {useHandlePlay} from "@/hooks/editor/useHandlePlay";
import useStagesStore from "@/stores/stagesStore";

export interface PlayButtonLogicProps {
    nodeId: string;
    disabled?: boolean;
    collapsed?: boolean;
    centered?: boolean;
    staged?: boolean;
    categoryMainTextColor?: string;
}

export const usePlayButtonLogic = ({
    nodeId,
    disabled = false,
    collapsed = false,
    centered = true,
    staged = false,
    categoryMainTextColor = 'text-sky-600 dark:text-white'
}: PlayButtonLogicProps) => {
    const handlePlay = useHandlePlay();
    const stages = useStagesStore((state) => state.stages);
    const [selectedStage, setSelectedStage] = useState("mock");

    return useMemo(() => {
        const containerClassName = `flex ${staged ? "flex-row" : "flex-col"} items-center justify-center gap-2 rounded-md relative ${
            centered ? "w-full" : ""
        } ${collapsed ? "p-0" : "p-3 -mb-5"} ${disabled ? "select-none opacity-0" : ""}`;

        const buttonClassName = `h-9 ${staged ? 'w-9' : 'w-full'} min-w-[2.25rem] flex justify-center items-center rounded-md border border-white/90 focus:outline-none`;

        const run = (e: React.MouseEvent, currentNodeId?: string) => {
            // CRITICAL: Use provided nodeId or fall back to prop - prevents stale ID usage
            const actualNodeId = currentNodeId || nodeId;
            console.log('🎯 PLAY BUTTON CLICKED - Using nodeId:', actualNodeId, 'from:', currentNodeId ? 'runtime' : 'props');
            handlePlay(e, actualNodeId, selectedStage);
        };

        const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedStage(e.target.value);
        };

        const stopPropagation = (e: React.MouseEvent | React.TouchEvent) => {
            e.stopPropagation();
        };

        return {
            // State
            selectedStage,
            stages,
            
            // Styling
            containerClassName,
            buttonClassName,
            iconClassName: `h-5 w-5 ${categoryMainTextColor} !opacity-100`,
            
            // Event handlers
            run,
            handleStageChange,
            stopPropagation,
            
            // Configuration
            nodeId,
            disabled,
            collapsed,
            centered,
            staged,
            
            // Props for sub-components
            selectProps: {
                value: selectedStage,
                onChange: handleStageChange,
                className: "w-full h-9"
            }
        };
    }, [
        nodeId,
        disabled,
        collapsed,
        centered,
        staged,
        categoryMainTextColor,
        selectedStage,
        stages,
        handlePlay
    ]);
};