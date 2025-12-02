import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { CodeBracketIcon, EyeIcon } from '@heroicons/react/24/outline';

interface HtmlInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    config?: {
        defaultMode?: 'edit' | 'preview';
        theme?: 'vs-dark' | 'vs-light';
        maxLength?: number;
    };
}

const HtmlInput: React.FC<HtmlInputProps> = ({
    value,
    onChange,
    disabled,
    config
}) => {
    const { resolvedTheme } = useTheme();
    const [mode, setMode] = useState<'edit' | 'preview'>(config?.defaultMode || 'preview');

    const editorTheme = config?.theme || (resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light');
    const maxLength = config?.maxLength;
    const currentLength = (value || '').length;
    const isOverLimit = maxLength ? currentLength > maxLength : false;

    return (
        <div className="w-full">
            {/* Toggle Button */}
            <div className="flex justify-end mb-2">
                <button
                    type="button"
                    onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
                    disabled={disabled}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                >
                    {mode === 'edit' ? (
                        <>
                            <EyeIcon className="w-4 h-4" />
                            Preview
                        </>
                    ) : (
                        <>
                            <CodeBracketIcon className="w-4 h-4" />
                            Edit
                        </>
                    )}
                </button>
            </div>

            {/* Preview Mode - Using iframe to isolate CSS */}
            {mode === 'preview' && (
                <iframe
                    srcDoc={value || '<p style="color: #9ca3af; font-style: italic;">No content</p>'}
                    className="w-full min-h-[200px] border border-gray-300 dark:border-gray-600 rounded-md bg-white"
                    style={{ height: '300px' }}
                    sandbox="allow-same-origin"
                    title="HTML Preview"
                />
            )}

            {/* Edit Mode - Monaco */}
            {mode === 'edit' && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                    <Editor
                        height="300px"
                        language="html"
                        theme={editorTheme}
                        value={value || ''}
                        onChange={(val) => onChange(val || '')}
                        options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            folding: true,
                            automaticLayout: true,
                            readOnly: disabled,
                            scrollbar: {
                                alwaysConsumeMouseWheel: false
                            }
                        }}
                    />
                </div>
            )}

            {/* Character count / max length */}
            {maxLength && (
                <div className={`text-xs mt-1 text-right ${isOverLimit ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {currentLength} / {maxLength}
                </div>
            )}
        </div>
    );
};

export default HtmlInput;
