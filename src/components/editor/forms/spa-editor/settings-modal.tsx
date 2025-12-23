import React from 'react';
import {Button} from '@/components/button';
import {XMarkIcon} from '@heroicons/react/24/outline';
import {SPASettings} from './types';

interface SettingsModalProps {
    settings: SPASettings;
    onSettingsChange: (settings: SPASettings) => void;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    settings,
    onSettingsChange,
    onClose
}) => {
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-[400px] max-h-[80vh] overflow-auto">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Project Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1">
                            App Title
                        </label>
                        <input
                            type="text"
                            value={settings.title}
                            onChange={(e) => onSettingsChange({
                                ...settings,
                                title: e.target.value
                            })}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            placeholder="My App"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1">
                            Entry Point
                        </label>
                        <input
                            type="text"
                            value={settings.entryPoint}
                            onChange={(e) => onSettingsChange({
                                ...settings,
                                entryPoint: e.target.value
                            })}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded text-zinc-900 dark:text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            placeholder="src/index.jsx"
                        />
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                            The file that mounts your React app
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-end">
                    <Button
                        type="button"
                        onClick={onClose}
                    >
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
