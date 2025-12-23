import React from 'react';
import Editor from '@monaco-editor/react';
import {useTheme} from 'next-themes';
import {getLanguageFromPath} from './types';

interface CodePanelProps {
    code: string;
    filePath: string;
    onChange: (code: string) => void;
}

const CodePanel: React.FC<CodePanelProps> = ({
    code,
    filePath,
    onChange
}) => {
    const {resolvedTheme} = useTheme();
    const language = getLanguageFromPath(filePath);

    const handleEditorChange = (value: string | undefined) => {
        onChange(value || '');
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* File tab */}
            <div className="h-9 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center px-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-900 rounded-t border-t border-l border-r border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300">
                    <span>{filePath.split('/').pop()}</span>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={language}
                    value={code}
                    onChange={handleEditorChange}
                    theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
                    options={{
                        minimap: { enabled: true, scale: 0.75 },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        formatOnPaste: true,
                        formatOnType: true,
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: true,
                        folding: true,
                        bracketPairColorization: { enabled: true },
                        renderLineHighlight: 'all',
                        scrollbar: {
                            vertical: 'auto',
                            horizontal: 'auto',
                            alwaysConsumeMouseWheel: false
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default CodePanel;
