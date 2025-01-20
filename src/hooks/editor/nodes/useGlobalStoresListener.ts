import { useEffect } from 'react';
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useGroupsStore from "@/stores/groupStore";

type StoreName = 'nodes' | 'connections' | 'groups';

interface State {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export default function useGlobalStoreListenersWithImmediateSave() {
  const debounceInterval = 3000;
  const latestStates: Record<StoreName, State> = {
    nodes: useNodesStore.getState(),
    connections: useConnectionsStore.getState(),
    groups: useGroupsStore.getState(),
  };
  let lastSavedAt = Date.now();
  let debounceTimeout: NodeJS.Timeout | null = null;

  const saveNodeSetup = () => {
    // console.log('Saving state:', latestStates);
    lastSavedAt = Date.now();
  };

  const triggerSave = () => {
    const now = Date.now();
    if (now - lastSavedAt >= debounceInterval) {
      saveNodeSetup();
    } else {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        saveNodeSetup();
      }, debounceInterval);
    }
  };

  useEffect(() => {
    const unsubscribeNodes = useNodesStore.subscribe((state) => {
      latestStates.nodes = state;
      triggerSave();
    });

    const unsubscribeConnections = useConnectionsStore.subscribe((state) => {
      latestStates.connections = state;
      triggerSave();
    });

    const unsubscribeGroups = useGroupsStore.subscribe((state) => {
      latestStates.groups = state;
      triggerSave();
    });

    return () => {
      unsubscribeNodes();
      unsubscribeConnections();
      unsubscribeGroups();
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  // eslint-disable-next-line
  }, []);
}