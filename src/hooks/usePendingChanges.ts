import { useRef, useEffect, useCallback } from 'react';
import { NodeVariable } from '@/types/types';
import usePendingChangesStore from '@/stores/pendingChangesStore';

interface UsePendingChangesOptions {
  nodeId: string;
  variableHandle: string;
  // Debounce delay in milliseconds (optional, defaults to 0 for immediate)
  debounceMs?: number;
  // Auto-commit on unmount (defaults to true)
  autoCommitOnUnmount?: boolean;
}

export function usePendingChanges({
  nodeId,
  variableHandle,
  debounceMs = 0,
  autoCommitOnUnmount = true
}: UsePendingChangesOptions) {
  const setPendingChange = usePendingChangesStore((state) => state.setPendingChange);
  const commitPendingChange = usePendingChangesStore((state) => state.commitPendingChange);
  const clearPendingChange = usePendingChangesStore((state) => state.clearPendingChange);
  const getPendingChange = usePendingChangesStore((state) => state.getPendingChange);

  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const key = `${nodeId}::${variableHandle}`;

  // Handle pending change with optional debouncing
  const handlePendingChange = useCallback((value: null | string | number | boolean | string[] | NodeVariable[]) => {
    console.log('🔄 Pending change:', { nodeId, variableHandle, value, debounceMs });

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (debounceMs > 0) {
      // Debounced: set pending change and commit after delay
      setPendingChange(nodeId, variableHandle, value);
      console.log('⏱️ Debounced change set, will commit in', debounceMs, 'ms');

      debounceTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Debounce timeout reached, committing change');
        commitPendingChange(key);
      }, debounceMs);
    } else {
      // Immediate: set and commit right away
      setPendingChange(nodeId, variableHandle, value);
      console.log('⚡ Immediate change set and committing now');
      commitPendingChange(key);
    }
  }, [nodeId, variableHandle, debounceMs, setPendingChange, commitPendingChange, key]);

  // Commit any pending changes on unmount (cleanup)
  useEffect(() => {
    return () => {
      console.log('🔄 usePendingChanges cleanup for:', { nodeId, variableHandle });

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (autoCommitOnUnmount) {
        // Check if there's a pending change for this variable
        const pendingChange = getPendingChange(nodeId, variableHandle);
        if (pendingChange) {
          console.log('🚨 Committing pending change on unmount:', pendingChange);
          commitPendingChange(key);
        } else {
          console.log('✅ No pending changes to commit on unmount');
        }
      }
    };
  }, [nodeId, variableHandle, key, autoCommitOnUnmount, commitPendingChange, getPendingChange]);

  // Clear any pending change for this variable when component unmounts
  const clearCurrentPendingChange = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    clearPendingChange(key);
  }, [key, clearPendingChange]);

  // Force commit any pending change immediately
  const commitNow = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    commitPendingChange(key);
  }, [key, commitPendingChange]);

  return {
    handlePendingChange,
    clearCurrentPendingChange,
    commitNow,
    // Get current pending change
    pendingChange: getPendingChange(nodeId, variableHandle)
  };
}