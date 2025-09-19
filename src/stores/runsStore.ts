import { create } from 'zustand';
import { getAvailableRuns } from '@/api/executionApi';

export interface Run {
    run_id: string;
    timestamp: string;
    status?: 'success' | 'error' | 'running';
    nodeId?: string;
    nodeName?: string;
    startTime?: number;
    lastEventTime?: number;
    duration?: number;
}

export interface RunsStore {
    // Data management
    runs: Run[];
    activeRunId: string | null;
    isLoading: boolean;
    
    // Track runs that have been moved to background (to hide visual feedback)
    backgroundedRunIds: Set<string>;
    
    // API integration
    fetchRuns: (versionId: string, projectId: string) => Promise<void>;
    refreshRuns: (versionId: string, projectId: string) => Promise<void>;
    
    // Background execution management
    setActiveRunId: (runId: string | null) => void;
    moveActiveRunToBackground: () => void;
    makeRunActive: (runId: string) => void;
    
    // WebSocket integration
    updateRunFromWebSocket: (runId: string, updates: Partial<Run>) => void;
    addNewRun: (run: Run) => void;
    
    // Computed state helpers
    getActiveRun: () => Run | undefined;
    getBackgroundRuns: () => Run[];
    getCompletedRuns: () => Run[];
    isRunActive: (runId: string) => boolean;
    isRunBackground: (runId: string) => boolean;
    getRunDuration: (run: Run) => string;
}

export const useRunsStore = create<RunsStore>((set, get) => ({
    // Initial state
    runs: [],
    activeRunId: null,
    isLoading: false,
    backgroundedRunIds: new Set<string>(),
    
    // API integration
    fetchRuns: async (versionId: string, projectId: string) => {
        if (!versionId || !projectId) {
            console.log('[RunsStore] Missing versionId or projectId, clearing runs');
            set({ runs: [], isLoading: false });
            return;
        }
        
        console.log('[RunsStore] Fetching runs for version:', versionId);
        set({ isLoading: true });
        
        try {
            const response = await getAvailableRuns(versionId, projectId);
            const newRuns = response.runs || [];
            
            // Merge with existing runs to preserve WebSocket updates and frontend-only data
            const state = get();
            const existingRuns = state.runs;
            const mergedRuns = newRuns.map((apiRun: Run) => {
                const existingRun = existingRuns.find(r => r.run_id === apiRun.run_id);
                // Preserve frontend-only fields when merging
                return existingRun ? { 
                    ...apiRun, // API data first
                    ...existingRun, // Then existing data
                    timestamp: apiRun.timestamp, // But always use API timestamp/status as authoritative
                    status: apiRun.status 
                } : apiRun;
            });
            
            // Add any runs that exist locally but not in API (recent WebSocket runs)
            existingRuns.forEach(existingRun => {
                if (!newRuns.find((apiRun: Run) => apiRun.run_id === existingRun.run_id)) {
                    mergedRuns.unshift(existingRun);
                }
            });
            
            // Explicitly preserve the activeRunId that was already set
            set({ 
                runs: mergedRuns, 
                isLoading: false,
                // Do NOT overwrite activeRunId - explicitly preserve it
                activeRunId: state.activeRunId 
            });
            console.log('[RunsStore] Loaded', mergedRuns.length, 'runs, activeRunId preserved:', state.activeRunId);
        } catch (error) {
            console.error('[RunsStore] Failed to fetch runs:', error);
            set({ isLoading: false });
        }
    },
    
    refreshRuns: async (versionId: string, projectId: string) => {
        // Refresh without loading indicator for background updates
        await get().fetchRuns(versionId, projectId);
    },
    
    // Background execution management
    setActiveRunId: (runId) => {
        console.log('[RunsStore] Setting active run:', runId);
        console.log('[RunsStore] Previous activeRunId was:', get().activeRunId);
        set({ activeRunId: runId });
        console.log('[RunsStore] New activeRunId is:', get().activeRunId);
    },
    
    moveActiveRunToBackground: () => {
        const state = get();
        if (state.activeRunId) {
            console.log('🔄 [RunsStore] Moving active run to background:', state.activeRunId);
            
            // Mark this run as backgrounded (permanently until manually cleared)
            const newBackgroundedRunIds = new Set(state.backgroundedRunIds);
            newBackgroundedRunIds.add(state.activeRunId);
            
            // Update the run status to indicate it's now in background
            state.updateRunFromWebSocket(state.activeRunId, {
                lastEventTime: Date.now(),
                status: 'running' // Ensure it stays as running in background
            });
            
            // IMPORTANT: Also unlock the editor and clear visual states when moving to background
            // Import this dynamically to avoid circular dependencies
            import('@/stores/editorStore').then(({ default: useEditorStore }) => {
                useEditorStore.getState().setIsExecuting(null);
                console.log('🔓 [RunsStore] Editor unlocked - run moved to background');
            });
            
            // Clear only the visual node states, keep mock store data for runs panel
            // But clear active run visual indicators
            
            // Clear visual state when moving to background
            // Clear all visual states by restoring with non-existent run (clears everything)
            document.querySelectorAll('.executing, .executed-success, .executed-error, .executed-killed').forEach(el => {
                el.classList.remove('executing', 'executed-success', 'executed-error', 'executed-killed');
            });
            console.log('🧹 [RunsStore] Visual states cleared for background run');
            
            // Clear active run and update backgrounded set
            set({ 
                activeRunId: null,
                backgroundedRunIds: newBackgroundedRunIds
            });
            console.log('✅ [RunsStore] Run moved to background and marked as backgrounded');
        }
    },
    
    makeRunActive: (runId) => {
        const state = get();
        const targetRun = state.runs.find(r => r.run_id === runId);
        
        if (targetRun && targetRun.status === 'running') {
            console.log('🎯 [RunsStore] Making run active:', runId);
            
            // Move current active run to background if exists
            if (state.activeRunId) {
                state.moveActiveRunToBackground();
            }
            
            // Set new active run
            state.setActiveRunId(runId);
            
            // IMPORTANT: Also lock the editor and prepare visual states when making a run active
            // Import this dynamically to avoid circular dependencies
            import('@/stores/editorStore').then(({ default: useEditorStore }) => {
                useEditorStore.getState().setIsExecuting('Running...');
                console.log('🔒 [RunsStore] Editor locked - background run made active');
            });
            
            // Restore visual state for the newly active run
            import('@/hooks/editor/nodes/useSmartWebSocketListener').then(({ restoreVisualStateForRun }) => {
                restoreVisualStateForRun(runId);
                console.log('🎯 [RunsStore] Visual state restored for newly active run');
            });
            
            console.log('✅ [RunsStore] Run is now active');
        } else {
            console.warn('[RunsStore] Cannot make run active - not found or not running:', runId);
        }
    },
    
    // WebSocket integration
    updateRunFromWebSocket: (runId, updates) => {
        const runs = get().runs;
        const updatedRuns = runs.map(run => 
            run.run_id === runId 
                ? { ...run, ...updates, lastEventTime: Date.now() }
                : run
        );
        
        // If this is a new run (not found), add it
        if (!runs.find(r => r.run_id === runId) && updates.status) {
            const newRun: Run = {
                run_id: runId,
                timestamp: new Date().toISOString(),
                startTime: Date.now(),
                lastEventTime: Date.now(),
                ...updates
            };
            updatedRuns.unshift(newRun); // Add to beginning
        }
        
        set({ runs: updatedRuns });
    },
    
    addNewRun: (run) => {
        const runs = get().runs;
        const existingRun = runs.find(r => r.run_id === run.run_id);
        
        if (!existingRun) {
            set({ runs: [run, ...runs] });
            console.log('[RunsStore] Added new run:', run.run_id);
        }
    },
    
    // Computed state helpers
    getActiveRun: () => {
        const state = get();
        return state.runs.find(r => r.run_id === state.activeRunId);
    },
    
    getBackgroundRuns: () => {
        const state = get();
        return state.runs.filter(r => 
            r.status === 'running' && r.run_id !== state.activeRunId
        );
    },
    
    getCompletedRuns: () => {
        const state = get();
        return state.runs.filter(r => 
            r.status === 'success' || r.status === 'error'
        );
    },
    
    isRunActive: (runId) => {
        return get().activeRunId === runId;
    },
    
    isRunBackground: (runId) => {
        const state = get();
        const run = state.runs.find(r => r.run_id === runId);
        return run?.status === 'running' && state.activeRunId !== runId;
    },
    
    getRunDuration: (run) => {
        if (!run.startTime) return 'Unknown';
        
        const endTime = run.duration ? run.startTime + run.duration : Date.now();
        const duration = Math.round((endTime - run.startTime) / 1000);
        
        if (duration < 60) return `${duration}s`;
        if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
        
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}));