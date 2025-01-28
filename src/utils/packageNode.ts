import { Connection, Node, Package } from '@/types/types';
import { v4 as uuidv4 } from 'uuid';

export const makeServiceFromNode = (
    node: Node,
    nodes: Node[],
    connections: Connection[],
    name: string,
    category: string,
    description: string,
    icon: string,
): Node => {
    const defId = uuidv4();

    const packagedData = packageNode(node, nodes, connections);

    if (!packagedData) {
        throw new Error("Unable to create package from node.");
    }

    node.id = '{uuid-0}';
    node.service = {
        ...node.service,
        description,
        name,
        category,
        package: packagedData,
    };
    node.icon = icon;

    resetNodeView(node, packagedData.nodes);
    const ids = gatherAllIds(node);
    const idMap = createIdMap(ids);
    console.log(ids, idMap);

    node = replaceIdsInJsonString(node, idMap);
    node.service.id = defId;

    return node;
};

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

function gatherAllIds(obj: any, ids: Set<string> = new Set()): Set<string> {
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

export const resetNodeView = (parentNode: Node, childNodes: Node[]): void => {
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
};

export const packageNode = (
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
                    nodeToCheck.group.nodes.includes(n.id)
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
