import React, {useState} from "react";
import useMockStore from "@/stores/mockStore";
import ReactJson from "react-json-view";
import {useTheme} from "next-themes";
import {ChevronLeftIcon} from "@heroicons/react/24/outline";
import {Button} from "@/components/button";

const Output: React.FC = (): React.ReactElement => {
    const mockNodes = useMockStore(state => state.mockNodes);
    const {theme} = useTheme();

    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => ({...prev, [id]: !prev[id]}));
    };

    const reversedNodes = [...mockNodes].reverse(); // ✅ veilig kopiëren

    return (
        <div className="flex h-full">

            <div className="w-1/2 min-w-[300px] border-r border-white/10 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3>Node</h3>
                </div>
                <div className="flex-1 overflow-auto">
                    {reversedNodes.map((node, index) => (
                        <div key={node.id} className="border-b border-white/10 p-2">
                            <div className="flex justify-between items-center">
                                <span className="inline-flex items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500 text-white">
                                        {reversedNodes.length - index}
                                    </span>
                                    <span className="text-sm font-bold">{node.type}</span>:
                                    <span className="text-[0.5rem] font-light">{node.id}</span>
                                </span>
                                <Button plain onClick={() => toggleNode(node.id)}>
                                    <ChevronLeftIcon
                                        className={`w-4 h-4 transition-transform ${
                                            expandedNodes[node.id] ? "-rotate-90" : ""
                                        }`}
                                    />
                                </Button>
                            </div>
                            {expandedNodes[node.id] && (
                                <ReactJson
                                    src={node}
                                    theme={theme === "dark" ? "monokai" : "rjv-default"}
                                    collapsed={false}
                                    displayDataTypes={true}
                                    indentWidth={2}
                                    style={{backgroundColor: "transparent"}}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-1/2 min-w-[300px] border-r border-white/10 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3>Result</h3>
                </div>
                <div className="flex-1 overflow-auto">
                    <ReactJson
                        src={mockNodes[mockNodes.length - 1]}
                        theme={theme === "dark" ? "monokai" : "rjv-default"}
                        collapsed={false}
                        displayDataTypes={true}
                        indentWidth={2}
                        style={{backgroundColor: "transparent"}}
                    />
                </div>
            </div>
        </div>
    );
};

export default Output;