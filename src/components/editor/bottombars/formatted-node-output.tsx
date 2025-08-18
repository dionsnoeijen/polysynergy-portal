import React from "react";
import {useTheme} from "next-themes";
import dynamic from "next/dynamic";

const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

interface FormattedNodeOutputProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variables: Record<string, any>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RenderValue = ({label, value}: { label: string; value: unknown }) => {
    const {theme} = useTheme();
    
    // Debug logging to see what values we're receiving
    console.log('RenderValue DEBUG:', { label, value, type: typeof value });

    const isProbablyHtml = (value: string) => {
        const htmlTagRegex = /<\/?[a-z][^>]*>/i;
        const customPlaceholderRegex = /^<[^>]+>$/;
        return htmlTagRegex.test(value) && !customPlaceholderRegex.test(value);
    };

    // Handle null and undefined
    if (value === null || value === undefined) {
        return (
            <div className="mb-2">
                <div className="text-xs font-bold text-black/70 dark:text-white/70">{label}</div>
                <p className="text-sm text-black/40 dark:text-white/40 bg-gray-200 dark:bg-white/10 rounded p-3 italic">
                    {value === null ? 'null' : 'undefined'}
                </p>
            </div>
        );
    }

    // Handle numbers (integers, floats)
    if (typeof value === "number") {
        return (
            <div className="mb-2">
                <div className="text-xs font-bold text-black/70 dark:text-white/70">{label}</div>
                <p className="text-sm text-black/70 dark:text-white bg-blue-200 dark:bg-blue-900/20 rounded p-3 font-mono">
                    {value}
                </p>
            </div>
        );
    }

    // Handle booleans
    if (typeof value === "boolean") {
        return (
            <div className="mb-2">
                <div className="text-xs font-bold text-black/70 dark:text-white/70">{label}</div>
                <p className={`text-sm font-semibold rounded p-3 ${
                    value 
                        ? 'text-green-700 dark:text-green-300 bg-green-200 dark:bg-green-900/20' 
                        : 'text-red-700 dark:text-red-300 bg-red-200 dark:bg-red-900/20'
                }`}>
                    {value ? 'true' : 'false'}
                </p>
            </div>
        );
    }

    // Handle arrays
    if (Array.isArray(value)) {
        return (
            <div className="mb-2">
                <div className="text-xs font-bold text-black/70 dark:text-white/70">{label}</div>
                <div className="bg-purple-200 dark:bg-purple-900/20 rounded p-3">
                    <div className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                        Array ({value.length} items)
                    </div>
                    <div className="space-y-1">
                        {value.map((item, index) => (
                            <div key={index} className="text-sm text-black/70 dark:text-white bg-white/50 dark:bg-black/20 rounded p-2">
                                <span className="text-xs text-purple-600 dark:text-purple-400 mr-2">[{index}]</span>
                                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (typeof value === "string") {
        const isHtml = isProbablyHtml(value);
        return (
            <div className="mb-2">
                <div className="text-xs font-bold text-black/70 dark:text-white/70">{label}</div>
                {isHtml ? (
                    <div
                        className="bg-sky-200 dark:bg-white/10 p-3 rounded text-sm text-black/70 dark:text-white leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:ml-2"
                        dangerouslySetInnerHTML={{__html: value}}
                    />
                ) : (
                    <p className="text-sm text-black/70 dark:text-white bg-sky-200 dark:bg-white/10 rounded p-3 whitespace-pre-wrap break-words">
                        {value}
                    </p>
                )}
            </div>
        );
    }

    if (typeof value === "object" && value !== null) {
        try {
            const stringified = JSON.stringify(value);
            JSON.parse(stringified);
            return (
                <div className="mb-2">
                    <div className="text-xs font-bold text-black/70 dark:text-white/70 mb-1">{label}</div>
                    <div className="bg-white/5 rounded p-3">
                        <div className="relative overflow-y-auto">
                            <ReactJson
                                src={value}
                                name={false}
                                theme={theme === "dark" ? "monokai" : "rjv-default"}
                                collapsed={false}
                                displayDataTypes={false}
                                indentWidth={2}
                                style={{backgroundColor: "transparent"}}
                            />
                        </div>
                    </div>
                </div>
            );
        } catch {
            // If JSON parsing fails, fall through to the final fallback
        }
    }

    // Fallback for any other types (functions, symbols, etc.)
    return (
        <div className="mb-2">
            <div className="text-xs font-bold text-black/70 dark:text-white/70">{label}</div>
            <p className="text-sm text-black/50 dark:text-white/50 bg-gray-200 dark:bg-white/10 rounded p-3 italic">
                {typeof value} ({String(value)})
            </p>
        </div>
    );
};

const FormattedNodeOutput: React.FC<FormattedNodeOutputProps> = ({variables}) => {
    const specialKeys = ["true_path", "false_path"];
    const remainingEntries = Object.entries(variables).filter(([key]) => !specialKeys.includes(key));
    const {theme} = useTheme();
    
    // Debug logging to see what data we're receiving
    console.log('FormattedNodeOutput DEBUG:', { 
        variables, 
        true_path: variables.true_path,
        true_path_type: typeof variables.true_path,
        remainingEntries 
    });


    return (
        <div className="p-4 space-y-4">
            {variables.true_path && (
                <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-200 dark:bg-green-900/30 rounded">
                    <div className="text-sm font-bold text-green-500 dark:text-green-300 mb-1">Result (true_path)</div>
                    <div className="pr-4">
                        <RenderValue label="" value={variables.true_path}/>
                    </div>
                </div>
            )}

            {variables.false_path && (
                <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-200 dark:bg-red-900/30 rounded">
                    <div className="text-sm font-bold text-red-300 mb-1">Error (false_path)</div>
                    <div className="pr-4">
                        <RenderValue label="" value={variables.false_path}/>
                    </div>
                </div>
            )}

            {remainingEntries.map(([key, value]) => (
                <RenderValue key={key} label={key} value={value}/>
            ))}

            <details className="mt-6">
                <summary className="cursor-pointer text-sm text-sky-500">Show raw result</summary>
                <div className="mt-2">
                    <div className="relative h-[400px] overflow-y-auto rounded border border-sky-500/50 dark:border-white/10 bg-white/5 p-3">
                        <ReactJson
                            src={variables}
                            name={false}
                            theme={theme === "dark" ? "monokai" : "rjv-default"}
                            collapsed={false}
                            displayDataTypes={false}
                            indentWidth={2}
                            style={{
                                backgroundColor: "transparent",
                                overflow: "visible",
                            }}
                        />
                    </div>
                </div>
            </details>
        </div>
    );
};

export default FormattedNodeOutput;