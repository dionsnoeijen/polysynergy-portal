import { Command } from '../historyStore';
import { Node, NodeVariable } from '@/types/types';
import useNodesStore from '../nodesStore';

// Command for adding a node
export class AddNodeCommand implements Command {
    private node: Node;
    private forceNewHandle: boolean;

    constructor(node: Node, forceNewHandle = false) {
        this.node = { ...node }; // Deep copy to avoid reference issues
        this.forceNewHandle = forceNewHandle;
    }

    execute(): void {
        useNodesStore.getState().addNode(this.node, this.forceNewHandle);
    }

    undo(): void {
        useNodesStore.getState().removeNode(this.node.id);
    }

    getDescription(): string {
        return `Add node: ${this.node.name || this.node.type}`;
    }
}

// Command for removing a node
export class RemoveNodeCommand implements Command {
    private node: Node;
    private nodeBackup: Node;

    constructor(nodeId: string) {
        const existingNode = useNodesStore.getState().getNode(nodeId);
        if (!existingNode) {
            throw new Error(`Node with id ${nodeId} not found`);
        }
        this.node = existingNode;
        this.nodeBackup = JSON.parse(JSON.stringify(existingNode)); // Deep copy
    }

    execute(): void {
        useNodesStore.getState().removeNode(this.node.id);
    }

    undo(): void {
        useNodesStore.getState().addNode(this.nodeBackup, false);
    }

    getDescription(): string {
        return `Remove node: ${this.node.name || this.node.type}`;
    }
}

// Command for updating node position
export class UpdateNodePositionCommand implements Command {
    private nodeId: string;
    private oldPosition: { x: number; y: number };
    private newPosition: { x: number; y: number };

    constructor(nodeId: string, newX: number, newY: number) {
        const node = useNodesStore.getState().getNode(nodeId);
        if (!node) {
            throw new Error(`Node with id ${nodeId} not found`);
        }
        
        this.nodeId = nodeId;
        this.oldPosition = { x: node.view.x, y: node.view.y };
        this.newPosition = { x: newX, y: newY };
    }

    execute(): void {
        useNodesStore.getState().updateNodePosition(this.nodeId, this.newPosition.x, this.newPosition.y);
    }

    undo(): void {
        useNodesStore.getState().updateNodePosition(this.nodeId, this.oldPosition.x, this.oldPosition.y);
    }

    getDescription(): string {
        const node = useNodesStore.getState().getNode(this.nodeId);
        return `Move node: ${node?.name || node?.type || 'Unknown'}`;
    }
}

// Command for updating node properties
export class UpdateNodeCommand implements Command {
    private nodeId: string;
    private oldFields: Partial<Node>;
    private newFields: Partial<Node>;

    constructor(nodeId: string, newFields: Partial<Node>) {
        const node = useNodesStore.getState().getNode(nodeId);
        if (!node) {
            throw new Error(`Node with id ${nodeId} not found`);
        }
        
        this.nodeId = nodeId;
        this.newFields = { ...newFields };
        
        // Capture only the fields that will change
        this.oldFields = {};
        Object.keys(newFields).forEach(key => {
            this.oldFields[key as keyof Node] = (node as Record<string, unknown>)[key] as never;
        });
    }

    execute(): void {
        useNodesStore.getState().updateNode(this.nodeId, this.newFields);
    }

    undo(): void {
        useNodesStore.getState().updateNode(this.nodeId, this.oldFields);
    }

    getDescription(): string {
        const node = useNodesStore.getState().getNode(this.nodeId);
        const fieldNames = Object.keys(this.newFields);
        return `Update ${node?.name || node?.type || 'node'}: ${fieldNames.join(', ')}`;
    }
}

// Command for updating node variable
export class UpdateNodeVariableCommand implements Command {
    private nodeId: string;
    private variableHandle: string;
    private oldValue: null | string | number | boolean | string[] | NodeVariable[] | Record<string, unknown>;
    private newValue: null | string | number | boolean | string[] | NodeVariable[] | Record<string, unknown>;

    constructor(nodeId: string, variableHandle: string, newValue: null | string | number | boolean | string[] | NodeVariable[] | Record<string, unknown>) {
        const currentVariable = useNodesStore.getState().getNodeVariable(nodeId, variableHandle);

        this.nodeId = nodeId;
        this.variableHandle = variableHandle;
        this.oldValue = currentVariable?.value ?? null;
        this.newValue = newValue;
    }

    execute(): void {
        useNodesStore.getState().updateNodeVariable(this.nodeId, this.variableHandle, this.newValue);
    }

    undo(): void {
        useNodesStore.getState().updateNodeVariable(this.nodeId, this.variableHandle, this.oldValue);
    }

    getDescription(): string {
        const node = useNodesStore.getState().getNode(this.nodeId);
        return `Update variable: ${this.variableHandle} in ${node?.name || node?.type || 'node'}`;
    }
}

// Batch command for moving multiple nodes
export class MoveNodesCommand implements Command {
    private commands: UpdateNodePositionCommand[] = [];

    constructor(nodePositions: Array<{ nodeId: string; x: number; y: number }>) {
        this.commands = nodePositions.map(pos => 
            new UpdateNodePositionCommand(pos.nodeId, pos.x, pos.y)
        );
    }

    execute(): void {
        this.commands.forEach(cmd => cmd.execute());
    }

    undo(): void {
        // Undo in reverse order
        this.commands.slice().reverse().forEach(cmd => cmd.undo());
    }

    getDescription(): string {
        return `Move ${this.commands.length} node${this.commands.length > 1 ? 's' : ''}`;
    }
}