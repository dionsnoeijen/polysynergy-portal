import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/button';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';

type CodeComponentData = {
    id: string;
    type: 'code';
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

type CodeEditorModalProps = {
    component: CodeComponentData | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (component: CodeComponentData) => void;
};

const CodeEditorModal: React.FC<CodeEditorModalProps> = ({
    component,
    isOpen,
    onClose,
    onSave,
}) => {
    const { theme } = useTheme();
    const [content, setContent] = useState('');

    useEffect(() => {
        if (component) {
            setContent(component.content || '');
        }
    }, [component]);

    const handleSave = () => {
        if (component) {
            onSave({
                ...component,
                content,
            });
        }
        onClose();
    };

    if (!isOpen || !component) return null;

    return createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-[800px] max-w-[90vw] h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
                    <div>
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                            Edit Code Block
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Write Jinja2 template code
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                        <XMarkIcon className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                {/* Editor */}
                <div className="flex-1 min-h-0">
                    <Editor
                        height="100%"
                        defaultLanguage="html"
                        value={content}
                        onChange={(value) => setContent(value || '')}
                        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            tabSize: 2,
                        }}
                    />
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t border-zinc-200 dark:border-zinc-700">
                    <Button type="button" onClick={onClose} plain>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave}>
                        Save Code
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CodeEditorModal;
