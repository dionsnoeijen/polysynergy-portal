import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogActions, DialogBody, DialogTitle } from '@/components/dialog';
import { Button } from '@/components/button';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';

interface JsonEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    value: object | null;
    onSave?: (value: object) => void;
    readOnly?: boolean;
    title?: string;
}

const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
    isOpen,
    onClose,
    value,
    onSave,
    readOnly = false,
    title = 'JSON Editor'
}) => {
    const { theme } = useTheme();
    const editorRef = useRef<unknown>(null);

    const [jsonString, setJsonString] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Initialize JSON string when modal opens
            try {
                const formatted = value ? JSON.stringify(value, null, 2) : '{\n  \n}';
                setJsonString(formatted);
                setError(null);
            } catch {
                setJsonString('{}');
                setError('Failed to parse initial value');
            }
        }
    }, [isOpen, value]);

    const handleEditorChange = (newValue: string | undefined) => {
        if (newValue === undefined) return;

        setJsonString(newValue);

        // Validate JSON
        if (!newValue.trim()) {
            setError(null);
            return;
        }

        try {
            JSON.parse(newValue);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON');
        }
    };

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(jsonString);
            const formatted = JSON.stringify(parsed, null, 2);
            setJsonString(formatted);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Cannot format invalid JSON');
        }
    };

    const handleSave = () => {
        if (error || !onSave) return;

        try {
            const parsed = JSON.parse(jsonString);
            onSave(parsed);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON');
        }
    };

    const handleEditorMount = (editor: unknown) => {
        editorRef.current = editor;
    };

    return (
        <Dialog open={isOpen} onClose={onClose} size="3xl">
            <DialogTitle>{title}</DialogTitle>
            <DialogBody>
                <div className="space-y-3">
                    {/* Monaco Editor */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                        <Editor
                            height="400px"
                            language="json"
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            value={jsonString}
                            onChange={handleEditorChange}
                            onMount={handleEditorMount}
                            options={{
                                readOnly: readOnly,
                                minimap: { enabled: false },
                                fontSize: 13,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: 'on',
                                formatOnPaste: true,
                                formatOnType: true,
                            }}
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
                            <span className="font-medium">Error:</span> {error}
                        </div>
                    )}

                    {/* Field count info */}
                    {!error && jsonString && (() => {
                        try {
                            const parsed = JSON.parse(jsonString);
                            const count = typeof parsed === 'object' && parsed !== null
                                ? Object.keys(parsed).length
                                : 0;
                            return (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {count} {count === 1 ? 'field' : 'fields'}
                                </div>
                            );
                        } catch {
                            return null;
                        }
                    })()}
                </div>
            </DialogBody>
            <DialogActions>
                {!readOnly && (
                    <Button
                        onClick={handleFormat}
                        outline
                        className="mr-auto"
                    >
                        Format
                    </Button>
                )}
                <Button onClick={onClose} plain>
                    {readOnly ? 'Close' : 'Cancel'}
                </Button>
                {!readOnly && onSave && (
                    <Button
                        onClick={handleSave}
                        disabled={!!error}
                    >
                        Save
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default JsonEditorModal;
