import React, { useState } from 'react';
import { PauseMessageData } from '@/stores/chatViewStore';
import { Button } from '@/components/button';
import { Field, Fieldset, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';

interface PauseInteractionProps {
    pauseData: PauseMessageData;
    onResume: (userInput: unknown) => void;
}

export const PauseInteraction: React.FC<PauseInteractionProps> = ({ pauseData, onResume }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Confirmation UI - for tool execution approval
    if (pauseData.pause_type === 'confirmation') {
        return (
            <div className="pause-interaction confirmation bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 my-3">
                <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 mt-1">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                            {pauseData.pause_message}
                        </h4>
                        {pauseData.pause_data.tools && pauseData.pause_data.tools.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                                    Tools to execute:
                                </p>
                                {pauseData.pause_data.tools.map((tool, idx) => (
                                    <div key={idx} className="bg-white dark:bg-zinc-800 rounded border border-amber-200 dark:border-amber-700/50 p-3">
                                        <div className="font-mono text-xs font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                            {tool.tool_name}
                                        </div>
                                        <pre className="text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                                            {JSON.stringify(tool.tool_args, null, 2)}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <Button
                        color="red"
                        onClick={() => {
                            setIsSubmitting(true);
                            onResume(false);
                        }}
                        disabled={isSubmitting}
                        className="text-sm"
                    >
                        {isSubmitting ? 'Submitting...' : 'Reject'}
                    </Button>
                    <Button
                        color="emerald"
                        onClick={() => {
                            setIsSubmitting(true);
                            onResume(true);
                        }}
                        disabled={isSubmitting}
                        className="text-sm"
                    >
                        {isSubmitting ? 'Submitting...' : 'Approve'}
                    </Button>
                </div>
            </div>
        );
    }

    // User Input Form UI - for collecting structured data
    if (pauseData.pause_type === 'user_input') {
        return (
            <div className="pause-interaction user-input bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 rounded-lg p-4 my-3">
                <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 mt-1">
                        <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-sky-900 dark:text-sky-100 mb-3">
                            {pauseData.pause_message}
                        </h4>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setIsSubmitting(true);
                            onResume(formData);
                        }}>
                            <Fieldset disabled={isSubmitting}>
                                {pauseData.pause_data.schema?.map((field) => (
                                    <Field key={field.name}>
                                        <Label>
                                            {field.description || field.name}
                                            {field.required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
                                        </Label>
                                        {field.type === 'text' || !field.type ? (
                                            <Textarea
                                                required={field.required}
                                                value={formData[field.name] || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    [field.name]: e.target.value
                                                })}
                                                rows={3}
                                                className="dark:text-white"
                                            />
                                        ) : (
                                            <Input
                                                type="text"
                                                required={field.required}
                                                value={formData[field.name] || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    [field.name]: e.target.value
                                                })}
                                                className="dark:text-white"
                                            />
                                        )}
                                    </Field>
                                ))}
                                <div className="flex justify-end mt-4">
                                    <Button type="submit" color="sky" disabled={isSubmitting}>
                                        {isSubmitting ? 'Submitting...' : 'Submit'}
                                    </Button>
                                </div>
                            </Fieldset>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // External tool or unknown pause types - show basic message
    return (
        <div className="pause-interaction unknown bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-4 my-3">
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
                <p className="font-semibold mb-2">{pauseData.pause_message}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Pause type: {pauseData.pause_type}
                </p>
            </div>
        </div>
    );
};
