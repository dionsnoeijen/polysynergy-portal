import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import useEditorStore from '@/stores/editorStore';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Node as ProjectNode } from '@/types/types';

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;
const MINIMAP_SCALE = 0.1; // Scale factor for the minimap
const NODE_SIZE = 20; // Size of nodes on minimap (made bigger for testing)

const Minimap: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    // Minimal store subscriptions - only update on major changes
    const nodesLength = useNodesStore((state) => state.nodes.length);
    const connectionsLength = useConnectionsStore((state) => state.connections.length);
    
    // Force updates for node movements by checking DOM changes periodically
    const [updateTrigger, setUpdateTrigger] = useState(0);
    
    useEffect(() => {
        if (isCollapsed) return;
        
        const interval = setInterval(() => {
            setUpdateTrigger(prev => prev + 1);
        }, 500); // Check for updates every 500ms when expanded
        
        return () => clearInterval(interval);
    }, [isCollapsed]);
    
    // Only subscribe to pan/zoom changes for viewport, not nodes
    const panPositionsByVersion = useEditorStore((state) => state.panPositionsByVersion);
    const zoomFactorByVersion = useEditorStore((state) => state.zoomFactorByVersion);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const setPanPositionForVersion = useEditorStore((state) => state.setPanPositionForVersion);
    
    // Calculate bounds of all positioned nodes
    const calculateBounds = useCallback((nodes: ProjectNode[]) => {
        // Filter nodes that have valid positions
        const positionedNodes = nodes.filter(node => 
            node.view && 
            typeof node.view.x === 'number' && 
            typeof node.view.y === 'number'
        );
        
        if (positionedNodes.length === 0) {
            return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        positionedNodes.forEach(node => {
            minX = Math.min(minX, node.view.x);
            minY = Math.min(minY, node.view.y);
            maxX = Math.max(maxX, node.view.x + node.view.width); // Use actual node width
            maxY = Math.max(maxY, node.view.y + node.view.height); // Use actual node height
        });
        
        // Add padding
        const padding = 500;
        return {
            minX: minX - padding,
            minY: minY - padding,
            maxX: maxX + padding,
            maxY: maxY + padding
        };
    }, []);
    
    // Draw the minimap immediately and throttle subsequent re-renders
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Get fresh data
            const getNodesToRender = useNodesStore.getState().getNodesToRender;
            const connections = useConnectionsStore.getState().connections;
            const currentNodes = getNodesToRender();
            
            // Get current pan/zoom
            const panPosition = panPositionsByVersion[activeVersionId] || { x: 100, y: 100 };
            const zoomFactor = zoomFactorByVersion[activeVersionId] || 0.75;
            
            // Get editor element first
            const editorElement = document.querySelector('[data-type="editor"]') as HTMLElement;
        
            // Clear canvas
            ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
        
        // Calculate bounds from real DOM positions (include both nodes and groups)
        const nodeElements = editorElement?.querySelectorAll('[data-type="node"], [data-type="closed-group"], [data-type="open-group"]') || [];
        const editorRect = editorElement?.getBoundingClientRect();
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        if (nodeElements.length > 0 && editorRect) {
            Array.from(nodeElements).forEach(nodeEl => {
                const nodeRect = nodeEl.getBoundingClientRect();
                const worldX = (nodeRect.left - editorRect.left) / zoomFactor - panPosition.x / zoomFactor;
                const worldY = (nodeRect.top - editorRect.top) / zoomFactor - panPosition.y / zoomFactor;
                
                minX = Math.min(minX, worldX);
                minY = Math.min(minY, worldY);
                maxX = Math.max(maxX, worldX + nodeRect.width / zoomFactor);
                maxY = Math.max(maxY, worldY + nodeRect.height / zoomFactor);
            });
        }
        
        // Fallback if no nodes found
        if (minX === Infinity) {
            minX = minY = 0;
            maxX = maxY = 1000;
        }
        
        // Add padding
        const padding = 500;
        const bounds = {
            minX: minX - padding,
            minY: minY - padding,
            maxX: maxX + padding,
            maxY: maxY + padding
        };
        const worldWidth = bounds.maxX - bounds.minX;
        const worldHeight = bounds.maxY - bounds.minY;
        
        // Calculate scale to fit world in minimap
        const scaleX = MINIMAP_WIDTH / worldWidth;
        const scaleY = MINIMAP_HEIGHT / worldHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 0.9 for padding
        
        // Center the minimap
        const offsetX = (MINIMAP_WIDTH - worldWidth * scale) / 2;
        const offsetY = (MINIMAP_HEIGHT - worldHeight * scale) / 2;
        
        // Draw connections as simple lines between node centers
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'; // More visible gray
        ctx.lineWidth = 2;
        
        connections.forEach(connection => {
            // Find source and target nodes in DOM (check both regular nodes and groups)
            const sourceEl = editorElement?.querySelector(`[data-node-id="${connection.sourceNodeId}"]`) ||
                            editorElement?.querySelector(`[data-node-id="mirror-${connection.sourceNodeId}"]`);
            const targetEl = editorElement?.querySelector(`[data-node-id="${connection.targetNodeId}"]`) ||
                            editorElement?.querySelector(`[data-node-id="mirror-${connection.targetNodeId}"]`);
            
            if (sourceEl && targetEl && editorRect) {
                const sourceRect = sourceEl.getBoundingClientRect();
                const targetRect = targetEl.getBoundingClientRect();
                
                // Calculate center points in world coordinates
                const sourceWorldX = (sourceRect.left + sourceRect.width/2 - editorRect.left) / zoomFactor - panPosition.x / zoomFactor;
                const sourceWorldY = (sourceRect.top + sourceRect.height/2 - editorRect.top) / zoomFactor - panPosition.y / zoomFactor;
                const targetWorldX = (targetRect.left + targetRect.width/2 - editorRect.left) / zoomFactor - panPosition.x / zoomFactor;
                const targetWorldY = (targetRect.top + targetRect.height/2 - editorRect.top) / zoomFactor - panPosition.y / zoomFactor;
                
                // Transform to minimap coordinates
                const startX = (sourceWorldX - bounds.minX) * scale + offsetX;
                const startY = (sourceWorldY - bounds.minY) * scale + offsetY;
                const endX = (targetWorldX - bounds.minX) * scale + offsetX;
                const endY = (targetWorldY - bounds.minY) * scale + offsetY;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        });
        
        // Draw positioned nodes as small rectangles - use real DOM positions
        // (reuse nodeElements and editorRect from bounds calculation above)
        
        Array.from(nodeElements).forEach((nodeEl, index) => {
            const nodeRect = nodeEl.getBoundingClientRect();
            if (!editorRect) return;
            
            // Convert DOM position to world coordinates
            const worldX = (nodeRect.left - editorRect.left) / zoomFactor - panPosition.x / zoomFactor;
            const worldY = (nodeRect.top - editorRect.top) / zoomFactor - panPosition.y / zoomFactor;
            
            // Transform to minimap coordinates
            const x = (worldX - bounds.minX) * scale + offsetX;
            const y = (worldY - bounds.minY) * scale + offsetY;
            
            // Use actual node size from DOM, scaled down for minimap
            const nodeWidth = (nodeRect.width / zoomFactor) * scale;
            const nodeHeight = (nodeRect.height / zoomFactor) * scale;
            
            // Node color - check both DOM type and node data
            let nodeId = nodeEl.getAttribute('data-node-id');
            const nodeType = nodeEl.getAttribute('data-type');
            
            // Handle group mirror nodes (remove "mirror-" prefix)
            if (nodeId?.startsWith('mirror-')) {
                nodeId = nodeId.replace('mirror-', '');
            }
            const nodeData = currentNodes.find(n => n.id === nodeId);
            
            // Color based on DOM type or node path
            if (nodeType?.includes('group') || nodeData?.path?.includes('group')) {
                ctx.fillStyle = 'rgba(34, 197, 94, 1)'; // Green for groups
            } else if (nodeData?.path?.includes('play') || nodeData?.path?.includes('flow')) {
                ctx.fillStyle = 'rgba(217, 70, 239, 1)'; // Fuchsia for flow/play nodes
            } else {
                ctx.fillStyle = 'rgba(14, 165, 233, 1)'; // Sky blue for regular nodes
            }
            
            // Draw node rectangle with actual size
            ctx.fillRect(x, y, nodeWidth, nodeHeight);
        });
        
        // Draw viewport rectangle - shows what's currently visible in the editor
        
        // Get the actual editor container size (not full window)
        // (editorElement already declared above)
        const editorWidth = editorElement?.clientWidth || window.innerWidth * 0.75;
        const editorHeight = editorElement?.clientHeight || window.innerHeight * 0.85;
        
        // Calculate what area of the world is currently visible in the editor
        const viewportWorldWidth = editorWidth / zoomFactor;
        const viewportWorldHeight = editorHeight / zoomFactor;
        
        // Top-left corner of the visible area in world coordinates
        const viewportWorldX = -panPosition.x / zoomFactor;
        const viewportWorldY = -panPosition.y / zoomFactor;
        
        // Transform visible area to minimap coordinates
        const viewportX = (viewportWorldX - bounds.minX) * scale + offsetX;
        const viewportY = (viewportWorldY - bounds.minY) * scale + offsetY;
        const viewportW = viewportWorldWidth * scale;
        const viewportH = viewportWorldHeight * scale;
        
        // Viewport border
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.8)'; // Sky blue
        ctx.lineWidth = 2;
        ctx.strokeRect(viewportX, viewportY, viewportW, viewportH);
        
        // Semi-transparent viewport fill
        ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';
        ctx.fillRect(viewportX, viewportY, viewportW, viewportH);
        
        }, isCollapsed ? 100 : 16); // Immediate draw when expanded, throttle when collapsed
        
        return () => clearTimeout(timeoutId);
    }, [nodesLength, connectionsLength, panPositionsByVersion, zoomFactorByVersion, activeVersionId, isCollapsed, updateTrigger]);
    
    // Handle click on minimap to navigate
    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const getNodesToRender = useNodesStore.getState().getNodesToRender;
        const currentNodes = getNodesToRender();
        const bounds = calculateBounds(currentNodes as ProjectNode[]);
        
        // Get current zoom factor
        const zoomFactor = zoomFactorByVersion[activeVersionId] || 0.75;
        const worldWidth = bounds.maxX - bounds.minX;
        const worldHeight = bounds.maxY - bounds.minY;
        
        const scaleX = MINIMAP_WIDTH / worldWidth;
        const scaleY = MINIMAP_HEIGHT / worldHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9;
        
        const offsetX = (MINIMAP_WIDTH - worldWidth * scale) / 2;
        const offsetY = (MINIMAP_HEIGHT - worldHeight * scale) / 2;
        
        // Convert click position to world coordinates
        const worldX = (x - offsetX) / scale + bounds.minX;
        const worldY = (y - offsetY) / scale + bounds.minY;
        
        // Center viewport on clicked position
        const viewportWidth = window.innerWidth / zoomFactor;
        const viewportHeight = window.innerHeight / zoomFactor;
        
        // Calculate new pan position to center the clicked position
        setPanPositionForVersion({
            x: -(worldX - viewportWidth / 2) * zoomFactor,
            y: -(worldY - viewportHeight / 2) * zoomFactor
        });
    }, [setPanPositionForVersion, activeVersionId]);
    
    return (
        <div className="absolute top-4 right-4 z-30">
            <div className="bg-sky-50 dark:bg-zinc-800/80 border border-sky-500/60 dark:border-white/25 rounded-xl overflow-hidden">
                {/* Header */}
                <div 
                    className="flex items-center justify-between px-2 py-1 border-b border-sky-200/30 dark:border-zinc-700/30 cursor-pointer hover:bg-sky-50/50 dark:hover:bg-zinc-800/50"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Minimap</span>
                    {isCollapsed ? (
                        <ChevronDownIcon className="w-3 h-3 text-zinc-500" />
                    ) : (
                        <ChevronUpIcon className="w-3 h-3 text-zinc-500" />
                    )}
                </div>
                
                {/* Canvas */}
                {!isCollapsed && (
                    <canvas
                        ref={canvasRef}
                        width={MINIMAP_WIDTH}
                        height={MINIMAP_HEIGHT}
                        className="cursor-pointer"
                        onClick={handleCanvasClick}
                        style={{ 
                            width: MINIMAP_WIDTH + 'px', 
                            height: MINIMAP_HEIGHT + 'px',
                            imageRendering: 'pixelated' // Crisp rendering
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Minimap;