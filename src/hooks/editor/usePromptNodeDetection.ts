import { useMemo } from 'react';
import useNodesStore from '@/stores/nodesStore';
import { Node } from '@/types/types';

const PROMPT_NODE_PATH = 'polysynergy_nodes_agno.agent.prompt_node.PromptNode';

export interface PromptNodeInfo {
  id: string;
  name: string;
  handle: string;
  node: Node; // The full node object
}

export const usePromptNodeDetection = () => {
  const nodes = useNodesStore((state) => state.nodes);

  const promptNodes = useMemo(() => {
    const detectedNodes: PromptNodeInfo[] = [];

    Object.values(nodes).forEach((node) => {
      if (node.path === PROMPT_NODE_PATH) {
        // Look for name variable first, fallback to node handle
        const nameVariable = node.variables?.find((v) => v.handle === "name");
        const displayName = (nameVariable?.value ? String(nameVariable.value) : node.handle) || node.handle;
        
        detectedNodes.push({
          id: node.id,
          name: displayName,
          handle: node.handle,
          node: node
        });
      }
    });

    return detectedNodes;
  }, [nodes]);

  const chatWindowVisible = promptNodes.length > 0;
  const multipleChats = promptNodes.length > 1;

  return {
    promptNodes,
    chatWindowVisible,
    multipleChats,
    promptNodeCount: promptNodes.length
  };
};