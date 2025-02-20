import {Connection, Node, NodeService, NodeVariableType, Package} from '@/types/types';
import {v4 as uuidv4} from 'uuid';


/**
 * Node packaging serves multiple purposes:
 *
 * 1. **Creating a Reusable Service**: Packaging a node allows it to be stored and reused as a service.
 *    This can be particularly useful for promoting nodes into higher-order abstractions or services that can be shared or used in different contexts.
 *
 * 2. **Copying Nodes**: By packaging a node, its entire structure, along with the connected nodes and their relevant relationships (via connections),
 *    can be duplicated in a way that preserves the integrity of the relationships and properties of the original node.
 *
 * The process involves:
 * - Recursively gathering all child nodes within the group of the parent node.
 * - Filtering and including all connections associated with the given node group.
 * - Resetting visual properties of the nodes to allow them to be repositioned if needed.
 * - Assigning unique placeholders to identifiers to ensure the new package remains distinct from its source.
 */

export const promoteNodeInStateToService = (
    node: Node,
    name: string,
    description: string,
    category: string,
    icon: string,
) => {
    const id = uuidv4();

    node.service = {
        ...node.service as NodeService,
        id,
        description,
        name,
        category,
    };
    node.icon = icon;

    return node;
};

export const makeServiceFromNodeForStorage = (
    node: Node,
    nodes: Node[],
    connections: Connection[],
): Node => {
    let clonedNode = JSON.parse(JSON.stringify(node));

    if (node.group && node.group.nodes && node.group.nodes.length > 0) {
        const packagedData = packageGroupNode(clonedNode, nodes, connections);
            if (!packagedData) {
            throw new Error("Unable to package group node.");
        }
        clonedNode.package = packagedData;
        resetNodeView(clonedNode, packagedData.nodes, packagedData.connections);
    }

    const ids = gatherAllIds(clonedNode);
    const idMap = createIdMap(ids);

    clonedNode = replaceIdsInJsonString(clonedNode, idMap);
    clonedNode = clearPublishedVariableValues(clonedNode);

    return clonedNode;
};

function clearPublishedVariableValues(node: Node): Node {
    node.variables.map((variable) => {
        if (!variable.published) return;
        if (variable.type === NodeVariableType.Dict) {
            variable.value.map((v) => {v.value = ''});
        } else {
            variable.value = '';
        }
    });
    return node;
}

function replaceIdsInJsonString(originalData: Node, idMap: Record<string, string>): Node {
  let jsonString = JSON.stringify(originalData);

  for (const [oldId, placeholder] of Object.entries(idMap)) {
    const escaped = escapeRegExp(oldId);
    const regex = new RegExp(`"${escaped}"`, 'g');
    jsonString = jsonString.replace(regex, `"${placeholder}"`);
  }

  return JSON.parse(jsonString);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function gatherAllIds(obj: unknown, ids: Set<string> = new Set()): Set<string> {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      gatherAllIds(item, ids);
    }
  } else if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if ((key === 'id' ||
          key === 'isInGroup' ||
          key === 'sourceNodeId' ||
          key === 'targetNodeId' ||
          key === 'sourceGroupId'
      ) && typeof value === 'string') {
          ids.add(value);
      }
      // verder alles recursief door
      gatherAllIds(value, ids);
    }
  }
  return ids;
}

function createIdMap(ids: Set<string>): Record<string, string> {
  let count = 1;
  const map: Record<string, string> = {};
  for (const id of ids) {
    map[id] = `{uuid-${count++}}`;
  }
  return map;
}

function createUuidMap(placeholders: Set<string>): Record<string, string> {
    const map: Record<string, string> = {};
    for (const placeholder of placeholders) {
        map[placeholder] = uuidv4();
    }
    return map;
}

export const resetNodeView = (
    parentNode: Node,
    childNodes: Node[],
    connections: Connection[] | undefined,
): void => {
    const originalX = parentNode.view?.x || 0;
    const originalY = parentNode.view?.y || 0;

    if (!parentNode.view) {
        parentNode.view = { x: 0, y: 0, width: 0, height: 0, collapsed: false };
    } else {
        parentNode.view.x = 0;
        parentNode.view.y = 0;
    }

    childNodes.forEach((childNode) => {
        if (childNode.view) {
            childNode.view.x = (childNode.view.x || 0) - originalX;
            childNode.view.y = (childNode.view.y || 0) - originalY;
        }
    });

    if (connections === undefined) return;

    connections.forEach((connection) => {
        connection.startX = (connection.startX || 0) - originalX;
        connection.endX = (connection.endX || 0) - originalX;
    });
};

export const unpackNode = (node: Node): {
    nodes: Node[],
    connections: Connection[] | undefined
} => {
    const ids = gatherAllIds(node);
    const idMap = createUuidMap(ids);

    const clonedNode = replaceIdsInJsonString(node, idMap);

    let nodes = [clonedNode];
    let connections = undefined;

    if (clonedNode.package) {
        nodes = [
            clonedNode,
            ...clonedNode.package.nodes || []
        ];
        connections = clonedNode.package.connections || [];
        clonedNode.package = undefined;
    }

    return {
        nodes,
        connections
    }
}

export const packageGroupNode = (
    node: Node,
    nodes: Node[],
    connections: Connection[],
): Package | undefined => {

    if (!node.group || !node.group.nodes || node.group.nodes.length === 0) {
        return undefined;
    }

    const getAllNodesRecursively = (currentNode: Node, allNodes: Node[]): Node[] => {
        const result: Node[] = [];
        const findNodes = (nodeToCheck: Node) => {
            if (nodeToCheck.group?.nodes?.length) {
                const childNodes = allNodes.filter((n) =>
                    nodeToCheck!.group!.nodes!.includes(n.id)
                );
                result.push(...childNodes);
                childNodes.forEach(findNodes);
            }
        };
        findNodes(currentNode);
        return result;
    };

    const nodesForPackage = getAllNodesRecursively(node, nodes);

    const connectionsForPackage = connections.filter((connection) => {
        return (
            connection.isInGroup === node.id ||
            nodesForPackage.some((n) => n.id === connection.isInGroup)
        );
    });

    return {
        nodes: nodesForPackage,
        connections: connectionsForPackage,
    };
};
