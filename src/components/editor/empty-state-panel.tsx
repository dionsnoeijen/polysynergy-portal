import React from 'react';
import {
    GlobeAltIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    CubeIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';
import useEditorStore from '@/stores/editorStore';
import {FormType} from '@/types/types';

const EmptyStatePanel: React.FC = () => {
    const openForm = useEditorStore((state) => state.openForm);

    const items = [
        {
            title: 'Create Route',
            description: 'HTTP endpoint for your workflow',
            icon: GlobeAltIcon,
            color: 'bg-sky-500 hover:bg-sky-600',
            action: () => openForm(FormType.AddRoute),
            dataTourId: 'empty-create-route'
        },
        {
            title: 'Create Schedule',
            description: 'Run workflows on a schedule',
            icon: ClockIcon,
            color: 'bg-purple-500 hover:bg-purple-600',
            action: () => openForm(FormType.AddSchedule),
            dataTourId: 'empty-create-schedule'
        },
        {
            title: 'Create Chat Window',
            description: 'Interactive chat interface',
            icon: ChatBubbleLeftRightIcon,
            color: 'bg-green-500 hover:bg-green-600',
            action: () => openForm(FormType.AddChatWindow),
            dataTourId: 'empty-create-chat-window'
        },
        {
            title: 'Create Blueprint',
            description: 'Reusable workflow template',
            icon: CubeIcon,
            color: 'bg-orange-500 hover:bg-orange-600',
            action: () => openForm(FormType.AddBlueprint),
            dataTourId: 'empty-create-blueprint'
        }
    ];

    return (
        <div className="flex justify-center items-start h-full p-8 overflow-y-auto">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-sky-600 dark:text-white mb-2">
                        Get Started
                    </h2>
                </div>

                {/* Quick Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.title}
                                onClick={item.action}
                                data-tour-id={item.dataTourId}
                                className="group relative bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg p-6 text-left hover:border-sky-500 dark:hover:border-sky-500 transition-all hover:shadow-lg"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`${item.color} p-3 rounded-lg transition-transform group-hover:scale-110`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className="text-zinc-400 group-hover:text-sky-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Getting Started Link */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <AcademicCapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                            New to PolySynergy?
                        </h3>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-6 text-center">
                        Learn the basics with our step-by-step tutorials
                    </p>

                    {/* Video Tutorial 1 */}
                    <div className="mb-6">
                        <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            1. Getting Started with PolySynergy | Flow Basics Explained
                        </h4>
                        <div className="rounded-lg overflow-hidden shadow-lg">
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/VcUy17H1uRc"
                                    title="Getting Started with PolySynergy | Flow Basics Explained"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>

                    {/* Video Tutorial 2 */}
                    <div className="mb-6">
                        <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            2. Grouping Basics | Organize Your Flows Like a Pro
                        </h4>
                        <div className="rounded-lg overflow-hidden shadow-lg">
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/30w3T7Xxtz0"
                                    title="Grouping Basics | Organize Your Flows Like a Pro"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>

                    {/* Video Tutorial 3 */}
                    <div className="mb-6">
                        <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            3. Agent Basics | How to Build Smart Agents in PolySynergy
                        </h4>
                        <div className="rounded-lg overflow-hidden shadow-lg">
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/evgV7HefDQ0"
                                    title="Agent Basics | How to Build Smart Agents in PolySynergy"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>

                    {/* Video Tutorial 4 */}
                    <div className="mb-6">
                        <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            4. RAG Basics | How to Use Retrieval in Your PolySynergy Flows
                        </h4>
                        <div className="rounded-lg overflow-hidden shadow-lg">
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/fSOgC79wRSo"
                                    title="RAG Basics | How to Use Retrieval in Your PolySynergy Flows"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>

                    {/* Video Tutorial 5 */}
                    <div className="mb-6">
                        <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            5. Agent Tool Basics | Empower Your Agents with Useful Tools
                        </h4>
                        <div className="rounded-lg overflow-hidden shadow-lg">
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/Q2OUCCy572w"
                                    title="Agent Tool Basics | Empower Your Agents with Useful Tools"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <a
                            href="https://www.polysynergy.com/ams/documentation/general/tutorials"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                        >
                            <AcademicCapIcon className="w-5 h-5" />
                            View Getting Started Tutorials
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmptyStatePanel;
