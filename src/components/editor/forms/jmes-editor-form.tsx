import React, {useEffect, useState, useCallback, useRef} from "react";
import {createPortal} from "react-dom";
import {Button} from "@/components/button";
import {Heading} from "@/components/heading";
import {Node} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import {ArrowsPointingOutIcon, ArrowsPointingInIcon} from "@heroicons/react/24/outline";
import Editor from "@monaco-editor/react";
import {useTheme} from "next-themes";
import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

// Resizable divider hook
function useResizable(direction: "horizontal" | "vertical", initialSize: number, min = 100, max = 2000, invert = false) {
    const [size, setSize] = useState(initialSize);
    const dragging = useRef(false);
    const startPos = useRef(0);
    const startSize = useRef(0);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current = true;
        startPos.current = direction === "horizontal" ? e.clientX : e.clientY;
        startSize.current = size;

        const onMouseMove = (e: MouseEvent) => {
            if (!dragging.current) return;
            const rawDelta = (direction === "horizontal" ? e.clientX : e.clientY) - startPos.current;
            const delta = invert ? -rawDelta : rawDelta;
            setSize(Math.max(min, Math.min(max, startSize.current + delta)));
        };

        const onMouseUp = () => {
            dragging.current = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
        document.body.style.userSelect = "none";
    }, [direction, size, min, max]);

    return {size, onMouseDown};
}

const DragHandle: React.FC<{ direction: "horizontal" | "vertical"; onMouseDown: (e: React.MouseEvent) => void }> = ({direction, onMouseDown}) => (
    <div
        onMouseDown={onMouseDown}
        className={`
            ${direction === "horizontal" ? "w-1.5 cursor-col-resize hover:bg-cyan-500/20 active:bg-cyan-500/30" : "h-1.5 cursor-row-resize hover:bg-cyan-500/20 active:bg-cyan-500/30"}
            flex-shrink-0 bg-zinc-200 dark:bg-zinc-700 transition-colors
        `}
    />
);

const JmesEditorForm: React.FC = () => {
    const getNode = useNodesStore((state) => state.getNode);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const closeForm = useEditorStore((state) => state.closeForm);
    const formEditVariable = useEditorStore((state) => state.formEditVariable);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const [node, setNode] = useState<Node>();
    const [query, setQuery] = useState("");
    const [inputJson, setInputJson] = useState("");
    const [initialQuery, setInitialQuery] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(true);
    const [output, setOutput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const {resolvedTheme} = useTheme();
    const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "light";

    const hasChanges = query !== initialQuery;

    // Resizable panels
    const leftPanel = useResizable("horizontal", 500, 200, 1200);
    const rightPanel = useResizable("horizontal", 500, 200, 1200, true);
    const queryHeight = useResizable("vertical", 250, 80, 600);

    // Load node
    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId as string));
    }, [formEditRecordId, getNode]);

    // Load query from variable
    useEffect(() => {
        if (formEditVariable?.value) {
            const val = typeof formEditVariable.value === "string" ? formEditVariable.value : JSON.stringify(formEditVariable.value, null, 2);
            setQuery(val);
            setInitialQuery(val);
        }
    }, [formEditVariable]);

    // Load input/output examples from node variables
    useEffect(() => {
        if (!node) return;

        const inputExVar = node.variables?.find((v) => v.handle === "input_example");
        if (inputExVar?.value) {
            try {
                const val = typeof inputExVar.value === "string" ? inputExVar.value : JSON.stringify(inputExVar.value, null, 2);
                const parsed = JSON.parse(val);
                if (parsed && (typeof parsed === "object")) {
                    setInputJson(JSON.stringify(parsed, null, 2));
                }
            } catch {
                if (typeof inputExVar.value === "string" && inputExVar.value.trim()) {
                    setInputJson(inputExVar.value);
                }
            }
        } else {
            const jsonVar = node.variables?.find(
                (v) => v.handle === "json_input_as_dict" || v.handle === "json_input_as_string"
            );
            if (jsonVar?.value) {
                try {
                    const val = typeof jsonVar.value === "string" ? jsonVar.value : JSON.stringify(jsonVar.value, null, 2);
                    const parsed = JSON.parse(val);
                    if (parsed && Object.keys(parsed).length > 0) {
                        setInputJson(JSON.stringify(parsed, null, 2));
                    }
                } catch {
                    // skip
                }
            }
        }
    }, [node]);

    // Call backend API to evaluate JMESPath query
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!inputJson.trim()) {
            setOutput("");
            setError(null);
            return;
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(inputJson);
        } catch (e) {
            setOutput("");
            setError(`Invalid JSON: ${(e as Error).message}`);
            return;
        }

        if (!query.trim()) {
            setOutput(JSON.stringify(parsed, null, 2));
            setError(null);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`${config.LOCAL_API_URL}/utility/jmes`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getIdToken()}`,
                    },
                    body: JSON.stringify({data: parsed, expression: query}),
                });

                const result = await response.json();
                if (result.error) {
                    setError(`Query error: ${result.error}`);
                    setOutput("");
                } else {
                    setOutput(result.result || "null");
                    setError(null);
                }
            } catch (e) {
                setError(`API error: ${(e as Error).message}`);
                setOutput("");
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [inputJson, query]);

    // Output type badge
    const outputTypeBadge = (() => {
        if (!output || error) return null;
        try {
            const parsed = JSON.parse(output);
            if (Array.isArray(parsed)) return `Array[${parsed.length}]`;
            if (parsed === null) return "null";
            return typeof parsed;
        } catch {
            return null;
        }
    })();

    // Save query + input/output examples
    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!formEditRecordId || !formEditVariable) return;

            const nodeId = formEditRecordId as string;
            updateNodeVariable(nodeId, formEditVariable.handle, query);

            // Only persist examples if they contain valid JSON
            if (inputJson.trim()) {
                try {
                    JSON.parse(inputJson);
                    updateNodeVariable(nodeId, "input_example", inputJson);
                } catch {
                    // Don't save invalid JSON as example
                }
            }
            if (output.trim() && !error) {
                updateNodeVariable(nodeId, "output_example", output);
            }

            setInitialQuery(query);
            closeForm();
        },
        [formEditRecordId, formEditVariable, query, inputJson, output, updateNodeVariable, closeForm]
    );

    const handleClose = useCallback(() => {
        if (hasChanges) {
            if (confirm("You have unsaved changes. Are you sure you want to close?")) {
                closeForm();
            }
        } else {
            closeForm();
        }
    }, [hasChanges, closeForm]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                const form = document.querySelector("form[data-jmes-editor]") as HTMLFormElement;
                if (form) form.requestSubmit();
            }
            if (e.key === "Escape" && isFullscreen) {
                setIsFullscreen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullscreen]);

    const formContent = (
        <form onSubmit={handleSubmit} method="post" data-jmes-editor className={isFullscreen ? "h-full flex flex-col" : ""}>
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <div className="flex items-center gap-3">
                    <Heading className="text-lg">{node?.name || "JMESPath"}: {formEditVariable?.handle}</Heading>
                    {hasChanges && (
                        <span className="text-xs text-amber-500 dark:text-amber-400">Unsaved changes</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        color="zinc"
                        title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
                    >
                        {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
                    </Button>
                    <Button type="button" onClick={handleClose} plain>
                        Cancel
                    </Button>
                    <Button type="submit">Save Query</Button>
                </div>
            </div>

            {/* Three-panel layout with resizable dividers */}
            <div className={`flex-1 flex min-h-0 ${isFullscreen ? "" : "h-[600px]"}`}>
                {/* Left panel: Input JSON */}
                <div style={{width: leftPanel.size}} className="flex-shrink-0 min-w-0 flex flex-col">
                    <div className="h-9 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center px-3">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Input JSON</span>
                    </div>
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            language="json"
                            theme={monacoTheme}
                            value={inputJson}
                            onChange={(val) => setInputJson(val || "")}
                            options={{
                                minimap: {enabled: false},
                                fontSize: 13,
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                wordWrap: "on",
                                tabSize: 2,
                                padding: {top: 8},
                            }}
                        />
                    </div>
                </div>

                <DragHandle direction="horizontal" onMouseDown={leftPanel.onMouseDown} />

                {/* Middle panel: Query + Error */}
                <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-zinc-800">
                    {/* Query editor - resizable height */}
                    <div className="flex flex-col" style={{height: queryHeight.size}}>
                        <div className="h-9 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center px-3">
                            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">JMESPath Query</span>
                        </div>
                        <div className="flex-1 min-h-0">
                            <Editor
                                height="100%"
                                language="plaintext"
                                theme={monacoTheme}
                                value={query}
                                onChange={(val) => setQuery(val || "")}
                                options={{
                                    minimap: {enabled: false},
                                    fontSize: 13,
                                    lineNumbers: "off",
                                    scrollBeyondLastLine: false,
                                    wordWrap: "on",
                                    tabSize: 2,
                                    padding: {top: 8},
                                    renderLineHighlight: "none",
                                    folding: false,
                                    glyphMargin: false,
                                }}
                            />
                        </div>
                    </div>

                    <DragHandle direction="vertical" onMouseDown={queryHeight.onMouseDown} />

                    {/* Error display or helpful info */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {error ? (
                            <div className="px-3 py-3 bg-red-50 dark:bg-red-900/20 h-full">
                                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Error</p>
                                <p className="text-xs text-red-600 dark:text-red-400 font-mono">{error}</p>
                            </div>
                        ) : (
                            <div className="px-3 py-3 text-xs text-zinc-400 dark:text-zinc-500">
                                <p className="font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">JMESPath Reference</p>
                                <div className="space-y-1 font-mono text-[11px]">
                                    <p><span className="text-cyan-500">field</span> - Select a field</p>
                                    <p><span className="text-cyan-500">nested.field</span> - Nested access</p>
                                    <p><span className="text-cyan-500">[0]</span> - Array index</p>
                                    <p><span className="text-cyan-500">[*]</span> - All array elements</p>
                                    <p><span className="text-cyan-500">[*].field</span> - Project from array</p>
                                    <p><span className="text-cyan-500">[?field==`val`]</span> - Filter</p>
                                    <p><span className="text-cyan-500">{"{"}</span><span className="text-green-500">alias</span><span className="text-cyan-500">: path{"}"}</span> - Rename fields</p>
                                    <p><span className="text-cyan-500">@</span> - Current element</p>
                                    <p><span className="text-cyan-500">`literal`</span> - Literal value (string, number)</p>
                                    <p><span className="text-cyan-500">&amp;&amp; / ||</span> - Logical operators</p>
                                    <p><span className="text-cyan-500">join(`,`, arr)</span> - Join array</p>
                                    <p><span className="text-cyan-500">length(arr)</span> - Array length</p>
                                    <p><span className="text-cyan-500">not_null(a, b)</span> - First non-null</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DragHandle direction="horizontal" onMouseDown={rightPanel.onMouseDown} />

                {/* Right panel: Output */}
                <div style={{width: rightPanel.size}} className="flex-shrink-0 min-w-0 flex flex-col">
                    <div className="h-9 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-3">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Output Preview</span>
                        {outputTypeBadge && (
                            <span className="text-[10px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
                                {outputTypeBadge}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            language="json"
                            theme={monacoTheme}
                            value={output || (error ? "" : "// Query result will appear here")}
                            options={{
                                readOnly: true,
                                minimap: {enabled: false},
                                fontSize: 13,
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                wordWrap: "on",
                                tabSize: 2,
                                padding: {top: 8},
                                renderLineHighlight: "none",
                            }}
                        />
                    </div>
                </div>
            </div>
        </form>
    );

    if (isFullscreen) {
        return createPortal(
            <div className="fixed inset-0 z-[200] bg-zinc-100 dark:bg-zinc-900 flex flex-col">
                {formContent}
            </div>,
            document.body
        );
    }

    return formContent;
};

export default JmesEditorForm;
