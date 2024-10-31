import React, { useCallback, useEffect, useState } from 'react';
import ItemManager from "@/components/editor/sidebars/item-manager";
import Dock from "@/components/editor/sidebars/dock";
import {ArrowLeftEndOnRectangleIcon, ArrowRightEndOnRectangleIcon} from "@heroicons/react/16/solid";
import Editor from "@/components/editor/editor";

export function EditorLayout() {
    enum ResizeWhat {
        ItemManager = 'itemManager',
        Dock = 'dock',
        Output = 'output',
    }

    const [resizing, setResizing] = useState<ResizeWhat | null>(null);
    const [width, setWidth] = useState({ itemManager: 256, dock: 256 });
    const [height, setHeight] = useState({ horizontalEditorLayout: 0 });
    const [windowHeight, setWindowHeight] = useState(0);

    const [itemManagerClosed, setItemManagerClosed] = useState(false);
    const [dockClosed, setDockClosed] = useState(false);
    const [outputClosed, setOutputClosed] = useState(false);

    useEffect(() => {
        setHeight({ horizontalEditorLayout: window.innerHeight * 0.7 });
        setWindowHeight(window.innerHeight);

        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const startResizing = useCallback((resizeWhat: ResizeWhat) => {
        setResizing(resizeWhat);
        document.body.style.cursor = resizeWhat === ResizeWhat.Output ? 'row-resize' : 'col-resize';
    }, [ResizeWhat.Output]);

    const stopResizing = useCallback(() => {
        setResizing(null);
        document.body.style.cursor = '';
    }, []);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (resizing) {
                const newHeight = e.clientY;
                const newWidth = e.clientX;
                if (resizing === ResizeWhat.ItemManager) {
                    setWidth((prev) => ({ ...prev, itemManager: Math.max(newWidth, 100) }));
                } else if (resizing === ResizeWhat.Dock) {
                    const dockWidth = window.innerWidth - newWidth;
                    setWidth((prev) => ({ ...prev, dock: Math.max(dockWidth, 100) }));
                } else if (resizing === ResizeWhat.Output) {
                    setHeight((prev) => ({ ...prev, horizontalEditorLayout: Math.max(newHeight, 100) }));
                }
            }
        },
        [
            ResizeWhat.Dock,
            ResizeWhat.ItemManager,
            ResizeWhat.Output,
            resizing
        ]
    );

    useEffect(() => {
        if (resizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', stopResizing);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResizing);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResizing);
        };
    }, [resizing, handleMouseMove, stopResizing]);

    const toggleCloseItemManager = () => {
        setItemManagerClosed(prev => !prev);
    };

    const toggleCloseDock = () => {
        setDockClosed(prev => !prev);
    };

    const toggleCloseOutput = () => {
        setOutputClosed(prev => !prev);
    };

    return (
        <div className="absolute top-0 right-0 bottom-0 left-0 bg-zinc-950">
            <div className="absolute top-0 right-0 left-0" style={{ height: outputClosed ? windowHeight-10 : height.horizontalEditorLayout }}>
                {!itemManagerClosed && (
                    <div style={{ width: width.itemManager }} className="absolute top-0 left-0 bottom-0 max-lg:hidden">
                        <div className="absolute inset-[10px]">
                            <ItemManager toggleClose={toggleCloseItemManager} />
                        </div>
                        <button
                            onMouseDown={() => startResizing(ResizeWhat.ItemManager)}
                            type="button"
                            className="absolute top-0 right-0 bottom-0 w-[8px] cursor-col-resize"
                        />
                    </div>
                )}

                {itemManagerClosed && (<button
                    type="button"
                    onClick={toggleCloseItemManager}
                    className="absolute z-10 top-[10px] left-0 p-3 default-editor-container radius-tl-0"
                ><ArrowRightEndOnRectangleIcon className="w-4 h-4 text-white" /></button>)}

                <main className="absolute top-0 bottom-0" style={{
                    left: itemManagerClosed ? 10 : width.itemManager,
                    right: dockClosed ? 10 : width.dock
                }}>
                    <div
                        className="absolute top-[10px] left-0 right-0 bottom-0 default-editor-container">
                        <Editor />
                    </div>
                </main>

                {!dockClosed && (
                    <div style={{ width: width.dock }} className="absolute top-0 right-0 bottom-0">
                        <div className="absolute inset-[10px]">
                            <Dock toggleClose={toggleCloseDock} />
                        </div>
                        <button
                            onMouseDown={() => startResizing(ResizeWhat.Dock)}
                            type="button"
                            className="absolute top-0 left-0 bottom-0 w-[8px] cursor-col-resize"
                        />
                    </div>
                )}

                {dockClosed && (
                    <button
                        type="button"
                        onClick={toggleCloseDock}
                        className="absolute z-10 top-[10px] right-0 p-3 default-editor-container radius-tr-0"
                    >
                        <ArrowLeftEndOnRectangleIcon className="w-4 h-4 text-white" />
                    </button>
                )}
            </div>

            {!outputClosed && (
                <div
                    className="absolute left-0 bottom-0 right-0"
                    style={{ height: windowHeight - height.horizontalEditorLayout }}
                >
                    <button
                        type="button"
                        onClick={toggleCloseOutput}
                        className={`absolute z-10 top-[10px] right-[10px] p-3 radius-bl-0`}
                    ><ArrowLeftEndOnRectangleIcon className="w-4 h-4 text-white" /></button>
                    <button
                        onMouseDown={() => startResizing(ResizeWhat.Output)}
                        type="button"
                        className="absolute h-[8px] left-0 right-0 top-0 cursor-row-resize z-10"
                    />
                    <div className="absolute top-[10px] left-[10px] right-[10px] bottom-[10px] default-editor-container">
                        <p>Output</p>
                    </div>
                </div>
            )}

            {outputClosed && (
                <button
                    type="button"
                    onClick={toggleCloseOutput}
                    className="absolute z-10 bottom-[10px] right-[10px] p-3 default-editor-container radius-bl-0"
                >
                    <ArrowRightEndOnRectangleIcon className="w-4 h-4 text-white" />
                </button>
            )}
        </div>
    );
}
