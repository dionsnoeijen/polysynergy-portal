import React, {useState, useCallback, useMemo, memo} from 'react';
import {NodeVariable} from '@/types/types';
import {ComputerDesktopIcon, ArrowPathIcon} from '@heroicons/react/24/outline';
import useNodesStore from '@/stores/nodesStore';
import useEditorStore from '@/stores/editorStore';

// Memoized iframe wrapper to prevent re-renders from affecting layout
const MemoizedIframe = memo(({
    url,
    zoom,
    iframeHeight,
    isDrawingConnection,
    onLoad,
    refreshKey
}: {
    url: string;
    zoom: number;
    iframeHeight: number;
    isDrawingConnection: boolean;
    onLoad?: () => void;
    refreshKey: number;
}) => (
    <div
        className="mt-2 w-full border border-zinc-300 dark:border-zinc-600 rounded-md bg-white relative"
        style={{
            height: `${iframeHeight}px`,
            overflow: 'hidden',
            contain: 'layout paint',
            isolation: 'isolate',
        }}
        onScroll={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
    >
        <iframe
            key={refreshKey}
            src={url}
            title="Iframe preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            tabIndex={-1}
            scrolling="no"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${100 / zoom}%`,
                height: `${100 / zoom}%`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                border: 'none',
                pointerEvents: isDrawingConnection ? 'none' : 'auto',
                overscrollBehavior: 'contain',
            }}
            onLoad={onLoad}
        />
    </div>
));

MemoizedIframe.displayName = 'MemoizedIframe';

interface IframeContentProps {
    logic?: {
        displayName?: string;
        textColor: string;
        iconColor: string;
        isValueConnected: boolean;
        valueText: string;
        categorySubTextColor?: string;
    };
    nodeId: string;
    variable: NodeVariable;
    onIframeLoad?: () => void;
}

const IframeContent: React.FC<IframeContentProps> = ({ logic, nodeId, variable, onIframeLoad }) => {
    const [refreshKey, setRefreshKey] = useState(0);

    // Get node to read view.height and zoom variable
    const node = useNodesStore((state) => state.nodes.find(n => n.id === nodeId));

    // Disable pointer events on iframe when drawing connections to prevent event capture
    const isDrawingConnection = useEditorStore((state) => !!state.isDrawingConnection);

    const url = variable.value as string || '';
    const hasUrl = url.trim().length > 0;

    // Get zoom value from zoom variable (default 1.0)
    const zoom = useMemo(() => {
        const zoomVar = node?.variables.find(v => v.handle === 'zoom');
        const value = zoomVar?.value;
        if (typeof value === 'number') return Math.max(0.25, Math.min(2.0, value));
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) return Math.max(0.25, Math.min(2.0, parsed));
        }
        return 1.0;
    }, [node?.variables]);

    // Use node view height or default to 300px
    // Subtract header height + handle row + padding to get iframe container height
    const iframeHeight = useMemo(() => {
        const nodeHeight = node?.view?.height;
        if (nodeHeight && nodeHeight > 200) {
            return nodeHeight - 170; // Account for header (~70px) + handle row (~50px) + URL row (~30px) + padding (~20px)
        }
        return 300;
    }, [node?.view?.height]);

    const handleRefresh = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setRefreshKey(prev => prev + 1);
    }, []);

    if (!logic) return null;

    return (
        <div className="w-full">
            {/* Header row */}
            <div className="flex items-center">
                <h3 className={`font-semibold truncate ${logic.textColor}`}>
                    {logic.displayName || 'URL'}:
                </h3>
                <ComputerDesktopIcon className={`w-4 h-4 ml-1 text-blue-600 dark:text-blue-400`} />
                {hasUrl && (
                    <>
                        <span className={`ml-1 truncate text-xs ${logic.categorySubTextColor}`}>
                            {url.length > 30 ? url.substring(0, 30) + '...' : url}
                        </span>
                        <button
                            onClick={handleRefresh}
                            className="ml-auto p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                            title="Refresh iframe"
                        >
                            <ArrowPathIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        </button>
                    </>
                )}
            </div>

            {/* Iframe with zoom support - using memoized component to prevent layout issues during re-renders */}
            {hasUrl && (
                <MemoizedIframe
                    url={url}
                    zoom={zoom}
                    iframeHeight={iframeHeight}
                    isDrawingConnection={isDrawingConnection}
                    onLoad={onIframeLoad}
                    refreshKey={refreshKey}
                />
            )}
        </div>
    );
};

export default IframeContent;
