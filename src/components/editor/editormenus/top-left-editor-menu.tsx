import React from "react";
import useEditorStore from "@/stores/editorStore";
import useDrawingStore from "@/stores/drawingStore";
import {
    CursorArrowRaysIcon,
    PaintBrushIcon,
    PlusIcon,
    StopIcon,
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon,
    HandRaisedIcon
} from "@heroicons/react/24/outline";
import {Divider} from "@/components/divider";
import {useKeyBindings} from "@/hooks/editor/useKeyBindings";
import {EditorMode} from "@/types/types";
import Image from "next/image";
import useChatViewStore from "@/stores/chatViewStore";
import { useHistoryStore } from "@/stores/historyStore";
import { useBranding } from "@/contexts/branding-context";

// Menu button component with dynamic branding
const MenuButton: React.FC<{
    onClick?: () => void;
    onMouseDown?: () => void;
    title: string;
    icon: React.ReactNode;
    disabled?: boolean;
    active?: boolean;
    accentColor: string;
    lightBg: string;
    lightBgHover: string;
    mediumBg: string;
    'data-tour-id'?: string;
}> = ({ onClick, onMouseDown, title, icon, disabled, active, accentColor, lightBg, lightBgHover, mediumBg, 'data-tour-id': tourId }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <button
            type="button"
            disabled={disabled}
            className={`w-full text-lg font-semibold rounded p-2 dark:text-white dark:hover:bg-zinc-600 ${disabled ? 'cursor-not-allowed' : ''}`}
            style={{
                backgroundColor: active ? accentColor : (isHovered && !disabled ? mediumBg : 'transparent'),
                color: active ? 'white' : (disabled ? '#9ca3af' : accentColor),
            }}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            onMouseDown={onMouseDown}
            title={title}
            data-tour-id={tourId}
        >
            {icon}
        </button>
    );
};

const TopLeftEditorMenu: React.FC = () => {
    const { logo_url, accent_color } = useBranding();

    // Helper function to determine if color is light or dark
    const isLightColor = (hexColor: string): boolean => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5;
    };

    // Helper to convert hex to rgba
    const hexToRgba = (hex: string, opacity: number) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return `rgba(14, 165, 233, ${opacity})`;
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const isLight = isLightColor(accent_color);
    const lightBg = hexToRgba(accent_color, 0.1);  // 10% for light background
    const lightBgHover = hexToRgba(accent_color, 0.2);  // 20% for hover
    const mediumBg = hexToRgba(accent_color, 0.5);  // 50% for medium background
    const borderColor = hexToRgba(accent_color, 0.6);  // 60% for border
    const setShowAddingNode = useEditorStore((state) => state.setShowAddingNode);
    const editorMode = useEditorStore((state) => state.editorMode);
    const setEditorMode = useEditorStore((state) => state.setEditorMode);
    const clearBubbles = useChatViewStore((state) => state.clearBubbles);
    const clearAccordionAndMockData = useEditorStore((state) => state.clearAccordionAndMockData);
    
    // Drawing store
    const setCurrentTool = useDrawingStore((state) => state.setCurrentTool);
    const setSelectedObject = useDrawingStore((state) => state.setSelectedObject);
    
    // History store hooks
    const undo = useHistoryStore((state) => state.undo);
    const redo = useHistoryStore((state) => state.redo);
    
    // Get state values directly to ensure reactivity
    const undoStack = useHistoryStore((state) => state.undoStack);
    const redoStack = useHistoryStore((state) => state.redoStack);
    const history = useHistoryStore((state) => state.history);
    const future = useHistoryStore((state) => state.future);
    const isEnabled = useHistoryStore((state) => state.isEnabled);
    const isBatching = useHistoryStore((state) => state.isBatching);
    
    // Compute can undo/redo locally to ensure reactivity
    const canUndo = (undoStack.length > 0 || history.length > 0) && isEnabled && !isBatching;
    const canRedo = (redoStack.length > 0 || future.length > 0) && isEnabled && !isBatching;
    
    // Get last action for tooltip
    const lastAction = undoStack[undoStack.length - 1] || null;

    useKeyBindings({
        'ctrl+z': {
            handler: () => {
                if (canUndo) {
                    undo();
                }
            }
        },
        'shift+ctrl+z': {
            handler: () => {
                if (canRedo) {
                    redo();
                }
            }
        },
        'c': {
            handler: () => {
                clearAccordionAndMockData();
                clearBubbles();
            },
        },
        'b': {
            handler: () => {
                setEditorMode(EditorMode.BoxSelect);
            },
        },
        'd': {
            handler: () => {
                if (editorMode === EditorMode.Draw) {
                    // Exit draw mode: deselect objects and go to select mode
                    setSelectedObject(null);
                    setEditorMode(EditorMode.Select);
                } else {
                    // Enter draw mode: activate select tool and deselect objects
                    setCurrentTool('select');
                    setSelectedObject(null);
                    setEditorMode(EditorMode.Draw);
                }
            },
        }
    });

    return (
        <div className={`absolute z-[50] left-2 top-2`}>
            <div
                className="dark:bg-zinc-800/80 dark:border-white/25 p-2 rounded-lg flex flex-col items-center justify-center"
                style={{
                    backgroundColor: lightBg,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: borderColor
                }}
            >

                <Image src={logo_url || "/ps-logo-simple-color.svg"} alt="Logo" className="w-8 h-8 mb-1" width={40} height={40}/>

                <Divider className={'mt-1 mb-1'}/>

                <div className="flex flex-col items-start justify-center w-full h-full">
                    <button
                        className={`group w-full text-lg font-semibold text-white rounded p-2 dark:bg-zinc-300 dark:hover:bg-zinc-600`}
                        style={{
                            backgroundColor: lightBg,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = lightBgHover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = lightBg}
                        onMouseDown={() => setShowAddingNode(true)}
                        title={'Add node'}
                        data-tour-id="add-node-button"
                    >
                        <PlusIcon className={"w-4 h-4 dark:text-zinc-800 dark:group-hover:text-zinc-100"} style={{ color: accent_color }}/>
                    </button>
                </div>

                <Divider className={'mt-1 mb-1'}/>

                <div className="flex flex-col items-start justify-center w-full h-full">
                    <MenuButton
                        disabled={!canUndo}
                        title={canUndo ? `Undo: ${lastAction?.description || 'Last action'}` : 'Undo (Ctrl+Z)'}
                        onClick={() => canUndo && undo()}
                        icon={<ArrowUturnLeftIcon className="w-4 h-4"/>}
                        accentColor={accent_color}
                        lightBg={lightBg}
                        lightBgHover={lightBgHover}
                        mediumBg={mediumBg}
                        data-tour-id="undo-button"
                    />
                    <MenuButton
                        disabled={!canRedo}
                        title={canRedo ? 'Redo (Shift+Ctrl+Z)' : 'Redo (Shift+Ctrl+Z)'}
                        onClick={() => canRedo && redo()}
                        icon={<ArrowUturnRightIcon className="w-4 h-4"/>}
                        accentColor={accent_color}
                        lightBg={lightBg}
                        lightBgHover={lightBgHover}
                        mediumBg={mediumBg}
                        data-tour-id="redo-button"
                    />
                </div>

                <Divider className={'mt-1 mb-1'}/>


                <div className="flex flex-col items-start justify-center w-full h-full rounded hover:bg-zinc-600">
                    <MenuButton
                        active={editorMode === EditorMode.Draw}
                        onMouseDown={() => {
                            if (editorMode === EditorMode.Draw) {
                                setSelectedObject(null);
                                setEditorMode(EditorMode.Select);
                            } else {
                                setCurrentTool('select');
                                setSelectedObject(null);
                                setEditorMode(EditorMode.Draw);
                            }
                        }}
                        title={'Draw (D)'}
                        icon={<PaintBrushIcon className="w-4 h-4"/>}
                        accentColor={accent_color}
                        lightBg={lightBg}
                        lightBgHover={lightBgHover}
                        mediumBg={mediumBg}
                        data-tour-id="draw-button"
                    />
                </div>

                <Divider className={'mt-1 mb-1'}/>

                <div className="flex flex-col items-start justify-center w-full h-full">
                    <MenuButton
                        active={editorMode === EditorMode.Pan}
                        onMouseDown={() => setEditorMode(EditorMode.Pan)}
                        title={'Pan mode - Click and drag to pan canvas (Space)'}
                        icon={<HandRaisedIcon className="w-4 h-4"/>}
                        accentColor={accent_color}
                        lightBg={lightBg}
                        lightBgHover={lightBgHover}
                        mediumBg={mediumBg}
                        data-tour-id="pan-button"
                    />
                    <MenuButton
                        active={editorMode === EditorMode.BoxSelect}
                        onMouseDown={() => setEditorMode(EditorMode.BoxSelect)}
                        title={'Box select (B)'}
                        icon={<StopIcon className="w-4 h-4"/>}
                        accentColor={accent_color}
                        lightBg={lightBg}
                        lightBgHover={lightBgHover}
                        mediumBg={mediumBg}
                        data-tour-id="box-select-button"
                    />
                    <MenuButton
                        active={editorMode === EditorMode.Select}
                        onMouseDown={() => setEditorMode(EditorMode.Select)}
                        title={'Select mode - Click nodes to select'}
                        icon={<CursorArrowRaysIcon className="w-4 h-4"/>}
                        accentColor={accent_color}
                        lightBg={lightBg}
                        lightBgHover={lightBgHover}
                        mediumBg={mediumBg}
                        data-tour-id="pointer-select-button"
                    />
                </div>
            </div>
        </div>
    );
};

export default TopLeftEditorMenu;