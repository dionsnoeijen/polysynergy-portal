import React, {useState} from 'react';
import {SectionLayoutConfig, FieldAssignment, SectionField} from "@/types/types";
// import {Text} from "@/components/text";
import {Button} from "@/components/button";
import {XMarkIcon, PlusIcon} from "@heroicons/react/24/outline";
import {Alert, AlertActions, AlertDescription, AlertTitle} from '@/components/alert';
import VisualGridBuilder from './visual-grid-builder';

interface GridBuilderProps {
    layout: SectionLayoutConfig;
    activeTab: string;
    assignments: FieldAssignment[];
    pendingAssignments: { tempId: string; assignment: Omit<FieldAssignment, 'id'> }[];
    fields: SectionField[];
    onLayoutChange: (layout: SectionLayoutConfig) => void;
    onTabChange: (tabName: string) => void;
    onAssignmentUpdate: (assignmentId: string, changes: Partial<FieldAssignment>) => void;
    onAssignmentCreate: (fieldId: string, tempAssignmentId: string) => void;
    onAssignmentDelete: (assignmentId: string) => void;
}

const GridBuilder: React.FC<GridBuilderProps> = ({
    layout,
    activeTab,
    assignments,
    pendingAssignments,
    fields,
    onLayoutChange,
    onTabChange,
    onAssignmentUpdate,
    onAssignmentCreate,
    onAssignmentDelete
}) => {
    const [editingTabName, setEditingTabName] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [newTabName, setNewTabName] = useState('');
    const [showDeleteTabAlert, setShowDeleteTabAlert] = useState(false);
    const [tabToDelete, setTabToDelete] = useState<string | null>(null);

    const tabNames = layout.tabs ? Object.keys(layout.tabs) : [];

    const handleAddTab = () => {
        const newTabName = `Tab ${tabNames.length + 1}`;
        const updatedLayout = {
            ...layout,
            tabs: {
                ...(layout.tabs || {}),
                [newTabName]: {rows: []}
            }
        };
        onLayoutChange(updatedLayout);
        onTabChange(newTabName);
    };

    const handleRenameTab = (oldName: string, newName: string) => {
        if (!newName.trim() || newName === oldName) {
            setEditingTabName(null);
            setNewTabName('');
            return;
        }

        // Check if name already exists
        if (layout.tabs?.[newName]) {
            alert('A tab with this name already exists');
            return;
        }

        // Create new layout with renamed tab
        const updatedTabs = {...(layout.tabs || {})};
        updatedTabs[newName] = updatedTabs[oldName];
        delete updatedTabs[oldName];

        onLayoutChange({
            ...layout,
            tabs: updatedTabs
        });

        // Update active tab if we renamed the active one
        if (activeTab === oldName) {
            onTabChange(newName);
        }

        setEditingTabName(null);
        setNewTabName('');
    };

    const handleDeleteTabClick = (tabName: string) => {
        if (tabNames.length === 1) {
            alert('Cannot delete the last tab');
            return;
        }

        setTabToDelete(tabName);
        setShowDeleteTabAlert(true);
    };

    const handleDeleteTab = () => {
        if (!tabToDelete) return;

        const updatedTabs = {...(layout.tabs || {})};
        delete updatedTabs[tabToDelete];

        onLayoutChange({
            ...layout,
            tabs: updatedTabs
        });

        // Switch to first available tab if we deleted the active one
        if (activeTab === tabToDelete) {
            const remainingTabs = Object.keys(updatedTabs);
            if (remainingTabs.length > 0) {
                onTabChange(remainingTabs[0]);
            }
        }

        setShowDeleteTabAlert(false);
        setTabToDelete(null);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tab List */}
            <div className="border-b border-gray-200 dark:border-white/10 px-6">
                <div className="flex items-center gap-2 -mb-px">
                    {tabNames.map((tabName) => (
                        <div
                            key={tabName}
                            className={`group flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                                activeTab === tabName
                                    ? 'border-sky-500 dark:border-white'
                                    : 'border-transparent hover:border-gray-300 dark:hover:border-white/20'
                            }`}
                        >
                            {editingTabName === tabName ? (
                                <input
                                    type="text"
                                    defaultValue={tabName}
                                    autoFocus
                                    className="px-2 py-1 text-sm border border-sky-500 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-zinc-800"
                                    onBlur={(e) => handleRenameTab(tabName, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleRenameTab(tabName, e.currentTarget.value);
                                        } else if (e.key === 'Escape') {
                                            setEditingTabName(null);
                                        }
                                    }}
                                />
                            ) : (
                                <button
                                    onClick={() => onTabChange(tabName)}
                                    onDoubleClick={() => {
                                        setEditingTabName(tabName);
                                        setNewTabName(tabName);
                                    }}
                                    className={`text-sm font-medium transition-colors ${
                                        activeTab === tabName
                                            ? 'text-sky-500 dark:text-white'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {tabName}
                                </button>
                            )}

                            {tabNames.length > 1 && (
                                <button
                                    onClick={() => handleDeleteTabClick(tabName)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                    title="Delete tab"
                                >
                                    <XMarkIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={handleAddTab}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        title="Add tab"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Tab</span>
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                <VisualGridBuilder
                    layout={layout}
                    activeTab={activeTab}
                    assignments={assignments}
                    pendingAssignments={pendingAssignments}
                    fields={fields}
                    onLayoutChange={onLayoutChange}
                    onTabChange={onTabChange}
                    onAssignmentUpdate={onAssignmentUpdate}
                    onAssignmentCreate={onAssignmentCreate}
                    onAssignmentDelete={onAssignmentDelete}
                />
            </div>

            {/* Delete Tab Alert */}
            <Alert open={showDeleteTabAlert} onClose={() => setShowDeleteTabAlert(false)}>
                <AlertTitle>Delete Tab?</AlertTitle>
                <AlertDescription>
                    Are you sure you want to delete the &quot;{tabToDelete}&quot; tab? All fields in this tab will be removed from the layout.
                </AlertDescription>
                <AlertActions>
                    <Button plain onClick={() => setShowDeleteTabAlert(false)}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDeleteTab}>
                        Delete
                    </Button>
                </AlertActions>
            </Alert>
        </div>
    );
};

export default GridBuilder;
