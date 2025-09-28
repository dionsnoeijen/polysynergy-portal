import { create } from 'zustand';
import { NodeVariable } from "@/types/types";
import { nodeHistoryActions } from "@/stores/history";

type PendingChange = {
  nodeId: string;
  variableHandle: string;
  value: null | string | number | boolean | string[] | NodeVariable[];
  timestamp: number;
};

interface PendingChangesStore {
  // Track pending changes by unique key (nodeId::variableHandle)
  pendingChanges: Record<string, PendingChange>;

  // Set a pending change for a variable
  setPendingChange: (nodeId: string, variableHandle: string, value: null | string | number | boolean | string[] | NodeVariable[]) => void;

  // Commit all pending changes to the actual store
  commitPendingChanges: () => void;

  // Commit a specific pending change
  commitPendingChange: (key: string) => void;

  // Clear all pending changes without committing
  clearPendingChanges: () => void;

  // Clear a specific pending change
  clearPendingChange: (key: string) => void;

  // Check if there are any pending changes
  hasPendingChanges: () => boolean;

  // Get pending change for a specific variable
  getPendingChange: (nodeId: string, variableHandle: string) => PendingChange | undefined;
}

const usePendingChangesStore = create<PendingChangesStore>((set, get) => ({
  pendingChanges: {},

  setPendingChange: (nodeId: string, variableHandle: string, value: null | string | number | boolean | string[] | NodeVariable[]) => {
    const key = `${nodeId}::${variableHandle}`;

    console.log('📝 Setting pending change:', { key, value, nodeId, variableHandle });

    set((state) => ({
      pendingChanges: {
        ...state.pendingChanges,
        [key]: {
          nodeId,
          variableHandle,
          value,
          timestamp: Date.now(),
        }
      }
    }));
  },

  commitPendingChanges: () => {
    const { pendingChanges } = get();

    console.log('💾 Committing pending changes:', pendingChanges);

    // Commit all pending changes
    Object.values(pendingChanges).forEach((change) => {
      try {
        console.log('🔄 Committing change:', change);
        nodeHistoryActions.updateNodeVariableWithHistory(
          change.nodeId,
          change.variableHandle,
          change.value
        );
        console.log('✅ Successfully committed change:', change);
      } catch (error) {
        console.error('❌ Failed to commit pending change:', change, error);
      }
    });

    // Clear all pending changes after committing
    set({ pendingChanges: {} });
    console.log('🧹 Cleared all pending changes');
  },

  commitPendingChange: (key: string) => {
    const { pendingChanges } = get();
    const change = pendingChanges[key];

    if (!change) return;

    try {
      nodeHistoryActions.updateNodeVariableWithHistory(
        change.nodeId,
        change.variableHandle,
        change.value
      );

      // Remove this specific pending change
      const updatedPendingChanges = { ...pendingChanges };
      delete updatedPendingChanges[key];

      set({ pendingChanges: updatedPendingChanges });
    } catch (error) {
      console.error('Failed to commit pending change:', change, error);
    }
  },

  clearPendingChanges: () => {
    set({ pendingChanges: {} });
  },

  clearPendingChange: (key: string) => {
    set((state) => {
      const updatedPendingChanges = { ...state.pendingChanges };
      delete updatedPendingChanges[key];
      return { pendingChanges: updatedPendingChanges };
    });
  },

  hasPendingChanges: () => {
    const { pendingChanges } = get();
    return Object.keys(pendingChanges).length > 0;
  },

  getPendingChange: (nodeId: string, variableHandle: string) => {
    const { pendingChanges } = get();
    const key = `${nodeId}::${variableHandle}`;
    return pendingChanges[key];
  },
}));

export default usePendingChangesStore;