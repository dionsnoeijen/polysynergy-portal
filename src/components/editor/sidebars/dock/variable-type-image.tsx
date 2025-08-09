import React, { useState, useCallback } from "react";
import { VariableTypeProps } from "@/types/types";
import { Field, FieldGroup, Fieldset } from "@/components/fieldset";
import { Text } from "@/components/text";
import { Button } from "@/components/button";
import LabelPublish from "@/components/editor/sidebars/dock/label-publish";
import useConnectionsStore from "@/stores/connectionsStore";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { nodeHistoryActions } from "@/stores/history";

const VariableTypeImage: React.FC<VariableTypeProps> = ({
    nodeId,
    variable,
    publishedButton = true,
    onChange,
    categoryBorder = 'border border-sky-200 dark:border-zinc-700',
    categoryMainTextColor = 'text-sky-500 dark:text-white/70',
    categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        typeof variable.value === 'string' && variable.value ? variable.value : null
    );
    
    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
                setPreviewUrl(result);
                if (onChange) {
                    onChange(result);
                } else {
                    // Use history-enabled variable update
                    nodeHistoryActions.updateNodeVariableWithHistory(nodeId, variable.handle, result);
                }
            }
        };
        reader.readAsDataURL(file);
    }, [variable, onChange]);

    const clearImage = useCallback(() => {
        setPreviewUrl(null);
        if (onChange) {
            onChange('');
        } else {
            // Use history-enabled variable update
            nodeHistoryActions.updateNodeVariableWithHistory(nodeId, variable.handle, '');
        }
    }, [variable, onChange]);

    return (
        <div className={`rounded p-6 relative ${categoryBorder} ${categoryBackgroundColor}`}>
            <Fieldset>
                <FieldGroup>
                    <Field>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <PhotoIcon className={`w-4 h-4 mr-2 ${categoryMainTextColor}`} />
                                <Text className={`font-semibold ${categoryMainTextColor}`}>
                                    {variable.name}:
                                </Text>
                            </div>
                            {publishedButton && (
                                <LabelPublish
                                    nodeId={nodeId}
                                    variable={variable}
                                    categoryMainTextColor={categoryMainTextColor}
                                />
                            )}
                        </div>

                        {!isValueConnected && (
                            <div className="mt-4 space-y-3">
                                {/* File input */}
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id={`image-input-${nodeId}-${variable.handle}`}
                                    />
                                    <label
                                        htmlFor={`image-input-${nodeId}-${variable.handle}`}
                                        className="inline-block"
                                    >
                                        <Button type="button" color="dark/zinc">
                                            Select Image
                                        </Button>
                                    </label>
                                </div>

                                {/* Image preview */}
                                {previewUrl && (
                                    <div className="space-y-2">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-w-full max-h-32 object-contain rounded border border-zinc-300 dark:border-zinc-600"
                                            onError={() => setPreviewUrl(null)}
                                        />
                                        <Button 
                                            type="button" 
                                            color="red" 
                                            onClick={clearImage}
                                        >
                                            Clear Image
                                        </Button>
                                    </div>
                                )}

                                {!previewUrl && (
                                    <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg">
                                        <div className="text-center">
                                            <PhotoIcon className="mx-auto h-8 w-8 text-zinc-400" />
                                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                                No image selected
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {isValueConnected && (
                            <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                Value is connected from another node
                            </div>
                        )}
                    </Field>
                </FieldGroup>
            </Fieldset>
        </div>
    );
};

export default VariableTypeImage;