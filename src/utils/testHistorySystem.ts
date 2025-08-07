// Test utility to verify the undo/redo system is working
// Run this in the browser console to test the functionality

import { useHistoryStore } from "@/stores/historyStore";
import { nodeHistoryActions } from "@/stores/history";
import useNodesStore from "@/stores/nodesStore";

// This function can be called from the browser console to test undo/redo
(window as any).testUndoRedo = () => {
    console.log("🧪 Testing Undo/Redo System");
    
    const historyStore = useHistoryStore.getState();
    const nodesStore = useNodesStore.getState();
    
    console.log("📊 Initial state:");
    console.log("- Nodes:", nodesStore.nodes.length);
    console.log("- Can undo:", historyStore.canUndo());
    console.log("- Can redo:", historyStore.canRedo());
    
    // Create a test node
    const testNode = {
        id: "test-node-" + Date.now(),
        name: "Test Node",
        handle: "test-handle",
        category: "test",
        type: "rows" as any,
        view: {
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            disabled: false,
            adding: false,
            collapsed: false
        },
        variables: [],
        flowState: "enabled" as any,
        default_flow_state: "enabled",
        path: "/test",
        code: ""
    };
    
    console.log("➕ Adding test node with history...");
    nodeHistoryActions.addNodeWithHistory(testNode, false);
    
    console.log("📊 After adding node:");
    console.log("- Nodes:", nodesStore.getNodes().length);
    console.log("- Can undo:", historyStore.canUndo());
    console.log("- Can redo:", historyStore.canRedo());
    console.log("- Last action:", historyStore.getLastAction()?.description);
    
    if (historyStore.canUndo()) {
        console.log("↩️ Testing undo...");
        historyStore.undo();
        
        console.log("📊 After undo:");
        console.log("- Nodes:", nodesStore.getNodes().length);
        console.log("- Can undo:", historyStore.canUndo());
        console.log("- Can redo:", historyStore.canRedo());
        
        if (historyStore.canRedo()) {
            console.log("↪️ Testing redo...");
            historyStore.redo();
            
            console.log("📊 After redo:");
            console.log("- Nodes:", nodesStore.getNodes().length);
            console.log("- Can undo:", historyStore.canUndo());
            console.log("- Can redo:", historyStore.canRedo());
        }
    }
    
    console.log("✅ Test completed!");
    return "Check console for results";
};

console.log("🔧 History test loaded. Run 'testUndoRedo()' in console to test the system.");