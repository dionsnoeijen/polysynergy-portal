'use client';

import React, { useEffect, useState } from "react";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import { useTheme } from 'next-themes';
import dynamic from "next/dynamic";

const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

const Debug: React.FC = (): React.ReactElement => {
    const { nodes } = useNodesStore();
    const { connections } = useConnectionsStore();

    const { theme } = useTheme();

    const [nodesSnapshot, setNodesSnapshot] = useState(nodes);
    const [connectionsSnapshot, setConnectionsSnapshot] = useState(connections);

    useEffect(() => {
        const interval = setInterval(() => {
            setNodesSnapshot(nodes);
            setConnectionsSnapshot(connections);
        }, 2000);

        return () => clearInterval(interval);
    }, [nodes, connections]);

    return (
        <div className="flex h-full">
            <div className="flex-1 border-r border-white/10 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3>Nodes</h3>
                </div>
                <div className="flex-1 overflow-scroll">
                    <ReactJson
                        src={nodesSnapshot}
                        theme={theme === 'dark' ? 'monokai' : 'rjv-default'}
                        collapsed={false}
                        displayDataTypes={true}
                        indentWidth={2}
                    />
                </div>
            </div>
            <div className="flex-1 border-r border-white/10 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3>Connections</h3>
                </div>
                <div className="flex-1 overflow-scroll">
                    <ReactJson
                        src={connectionsSnapshot}
                        theme={theme === 'dark' ? 'monokai' : 'rjv-default'}
                        collapsed={false}
                        displayDataTypes={true}
                        indentWidth={2}
                    />
                </div>
            </div>
            <div className="flex-1 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3>Groups</h3>
                </div>
                <div className="flex-1 overflow-scroll">

                </div>
            </div>
        </div>
    );
};

export default Debug;
