import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useEditorStore from "@/stores/editorStore";
import { Button } from "@/components/button";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Divider } from "@/components/divider";
import { Heading } from "@/components/heading";
import Editor from "@monaco-editor/react";

const Docs: React.FC = () => {
    const docsMarkdown = useEditorStore((state) => state.docsMarkdown);
    const closeDocs = useEditorStore((state) => state.closeDocs);
    const [editorTheme, setEditorTheme] = useState<"vs-dark" | "vs-light">("vs-dark");

    useEffect(() => {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setEditorTheme(isDark ? "vs-dark" : "vs-light");
    }, []);

    return (
        <div className="relative prose prose-invert dark:prose-dark !overflow-scroll bg-white dark:bg-zinc-800 max-w-none p-10 leading-relaxed">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>Documentation</Heading>
                <Button type="button" onClick={() => { closeDocs() }} color="sky">
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>
            <Divider className="my-4" soft bleed />
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ className, children }) {
                        const isBlock = className?.includes("language-");
                        const language = className ? className.replace("language-", "") : "plaintext";
                        const codeText = String(children).trim();
                        const lineCount = codeText.split("\n").length;
                        const dynamicHeight = Math.max(150, lineCount * 20) + "px";

                        return isBlock ? (
                            <div className="my-4 rounded-md overflow-hidden border border-zinc-300 dark:border-zinc-700">
                                <Editor
                                    height={dynamicHeight}
                                    defaultLanguage={language}
                                    value={codeText}
                                    theme={editorTheme}
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        lineNumbers: "off",
                                        fontSize: 14,
                                        padding: { top: 10, bottom: 10 },
                                        overviewRulerLanes: 0,
                                        wordWrap: "on",
                                    }}
                                />
                            </div>
                        ) : (
                            <code className="bg-zinc-200 dark:bg-zinc-800 text-sky-700 dark:text-sky-400 px-1 py-0.5 rounded-md font-mono text-sm border border-zinc-400 dark:border-zinc-500/50 leading-tight">
                                {children}
                            </code>
                        );
                    },
                    a: ({ ...props }) => <a className="text-sky-600 dark:text-sky-400 hover:underline" {...props} />,
                    h1: ({ ...props }) => <h1 className="text-3xl font-bold mt-0 mb-2 leading-snug" {...props} />,
                    h2: ({ ...props }) => <h2 className="text-2xl font-semibold mt-5 mb-2 leading-snug" {...props} />,
                    h3: ({ ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2 leading-snug" {...props} />,
                    ul: ({ ...props }) => <ul className="list-disc pl-5 mb-2 leading-relaxed" {...props} />,
                    ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-2 leading-relaxed" {...props} />,
                    blockquote: ({ ...props }) => <blockquote className="border-l-4 border-zinc-400 dark:border-zinc-500 pl-4 italic leading-relaxed" {...props} />,
                    table: ({ ...props }) => (
                        <table className="w-full border-collapse border border-zinc-300 dark:border-zinc-600">
                            {props.children}
                        </table>
                    ),
                    th: ({ ...props }) => (
                        <th className="text-left p-3 border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-700 font-semibold">
                            {props.children}
                        </th>
                    ),
                    td: ({ ...props }) => (
                        <td className="p-3 border border-zinc-300 dark:border-zinc-600">
                            {props.children}
                        </td>
                    ),
                    hr: ({ ...props }) => (
                        <hr className="border-t border-sky-300 dark:border-zinc-600 my-6" {...props} />
                    )
                }}
            >
                {docsMarkdown}
            </ReactMarkdown>
        </div>
    );
};

export default Docs;