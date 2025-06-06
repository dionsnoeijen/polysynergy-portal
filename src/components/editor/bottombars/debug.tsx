'use client';

import React, {useEffect, useState} from "react";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {useTheme} from 'next-themes';
import dynamic from "next/dynamic";
import useEditorStore from "@/stores/editorStore";
import {Divider} from "@/components/divider";

const ReactJson = dynamic(() => import('react-json-view'), {ssr: false});

const Debug: React.FC = (): React.ReactElement => {
    const nodes = useNodesStore((state) => state.nodes);
    const groupStack = useNodesStore((state) => state.groupStack);
    const openedGroup = useNodesStore((state) => state.openedGroup);

    const connections = useConnectionsStore((state) => state.connections);
    const editor = useEditorStore();

    const {theme} = useTheme();

    const [nodesSnapshot, setNodesSnapshot] = useState(nodes);
    const [connectionsSnapshot, setConnectionsSnapshot] = useState(connections);
    const [editorSnapshot, setEditorSnapshot] = useState(editor);
    const [groupSnapshot, setGroupSnapshot] = useState({
        groupStack: groupStack,
        openedGroup: openedGroup,
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setNodesSnapshot(nodes);
            setConnectionsSnapshot(connections);
            setEditorSnapshot(editor);
            setGroupSnapshot({
                groupStack: groupStack,
                openedGroup: openedGroup,
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [nodes, connections, editor, groupStack, openedGroup]);

    return (
        <div className="flex h-full">
            <div className="w-1/3 min-w-[300px] border-r border-sky-500/50 dark:border-white/10 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3 className="text-sky-500 dark:text-white/70">Nodes</h3>
                </div>
                <div className="flex-1 overflow-auto">
                    <ReactJson
                        src={nodesSnapshot}
                        theme={theme === 'dark' ? 'monokai' : 'rjv-default'}
                        collapsed={false}
                        displayDataTypes={true}
                        indentWidth={2}
                    />
                </div>
            </div>
            <div className="w-1/3 min-w-[300px] border-r border-sky-500/50 dark:border-white/10 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3 className="text-sky-500 dark:text-white/70">Connections</h3>
                </div>
                <div className="flex-1 overflow-auto">
                    <ReactJson
                        src={connectionsSnapshot}
                        theme={theme === 'dark' ? 'monokai' : 'rjv-default'}
                        collapsed={false}
                        displayDataTypes={true}
                        indentWidth={2}
                    />
                </div>
            </div>
            <div className="w-1/3 min-w-[300px] border-r border-sky-500/50 dark:border-white/10 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3 className="text-sky-500 dark:text-white/70">Editor</h3>
                </div>
                <div className="flex-1 overflow-auto">
                    <ReactJson
                        src={groupSnapshot}
                        theme={theme === 'dark' ? 'monokai' : 'rjv-default'}
                        collapsed={false}
                        displayDataTypes={true}
                        indentWidth={2}
                    />
                    <Divider bleed/>
                    <ReactJson
                        src={editorSnapshot}
                        theme={theme === 'dark' ? 'monokai' : 'rjv-default'}
                        collapsed={false}
                        displayDataTypes={true}
                        indentWidth={2}
                    />
                </div>
            </div>
        </div>
    );
};

export default Debug;
