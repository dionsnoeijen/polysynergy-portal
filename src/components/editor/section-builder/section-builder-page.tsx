import React, {useEffect, useState, useImperativeHandle, forwardRef} from 'react';
import {Button} from "@/components/button";
// import {Heading} from "@/components/heading";
// import {Divider} from "@/components/divider";
import {Text} from "@/components/text";
import useSectionsStore from "@/stores/sectionsStore";
import useSectionFieldsStore from "@/stores/sectionFieldsStore";
import useFieldAssignmentsStore from "@/stores/fieldAssignmentsStore";
import useEditorStore from "@/stores/editorStore";
import {SectionLayoutConfig, FieldAssignment} from "@/types/types";
import FieldLibrary from './field-library';
import ElementsLibrary from './elements-library';
import GridBuilder from './grid-builder';

interface PendingChanges {
    newAssignments: { tempId: string; assignment: Omit<FieldAssignment, 'id'> }[];
    updatedAssignments: { id: string; changes: Partial<FieldAssignment> }[];
    deletedAssignmentIds: string[];
    layoutChanged: boolean;
}

export interface BuilderPendingChanges {
    newAssignments: { tempId: string; assignment: Omit<FieldAssignment, 'id'> }[];
    updatedAssignments: { id: string; changes: Partial<FieldAssignment> }[];
    deletedAssignmentIds: string[];
    layoutChanged: boolean;
    layout: SectionLayoutConfig;
}

interface SectionBuilderPageProps {
    sectionId: string;
    onClose?: () => void;
    hideSaveButton?: boolean;
    onPendingChangesUpdate?: (changes: BuilderPendingChanges | null) => void;
}

export interface SectionBuilderRef {
    save: () => Promise<void>;
    getPendingChanges: () => BuilderPendingChanges | null;
}

const SectionBuilderPage = forwardRef<SectionBuilderRef, SectionBuilderPageProps>(({
    sectionId,
    onClose,
    hideSaveButton = false,
    onPendingChangesUpdate
}, ref) => {
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    const section = useSectionsStore((state) => state.getSection(sectionId!));
    const fetchSection = useSectionsStore((state) => state.fetchSection);
    const updateSectionLayout = useSectionsStore((state) => state.updateSectionLayout);

    const fields = useSectionFieldsStore((state) => state.fields);
    const fetchSectionFields = useSectionFieldsStore((state) => state.fetchSectionFields);

    const assignmentsBySectionId = useFieldAssignmentsStore((state) => state.assignmentsBySectionId);
    const assignments = sectionId ? (assignmentsBySectionId[sectionId] || []) : [];
    const fetchAssignmentsBySection = useFieldAssignmentsStore((state) => state.fetchAssignmentsBySection);
    const createAssignmentsBulk = useFieldAssignmentsStore((state) => state.createAssignmentsBulk);
    const updateAssignment = useFieldAssignmentsStore((state) => state.updateAssignment);
    const deleteAssignment = useFieldAssignmentsStore((state) => state.deleteAssignment);

    const [layout, setLayout] = useState<SectionLayoutConfig>({
        tabs: {
            'Content': {rows: []}
        }
    });
    const [activeTab, setActiveTab] = useState('Content');
    const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
        newAssignments: [],
        updatedAssignments: [],
        deletedAssignmentIds: [],
        layoutChanged: false
    });

    // Notify parent of pending changes
    useEffect(() => {
        if (onPendingChangesUpdate) {
            const hasPendingChanges =
                pendingChanges.newAssignments.length > 0 ||
                pendingChanges.updatedAssignments.length > 0 ||
                pendingChanges.deletedAssignmentIds.length > 0 ||
                pendingChanges.layoutChanged;

            if (hasPendingChanges) {
                onPendingChangesUpdate({
                    ...pendingChanges,
                    layout
                });
            } else {
                onPendingChangesUpdate(null);
            }
        }
    }, [pendingChanges, layout, onPendingChangesUpdate]);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Load data
    useEffect(() => {
        if (!sectionId || !activeProjectId) return;

        const loadData = async () => {
            try {
                await Promise.all([
                    fetchSection(sectionId),
                    fetchSectionFields(),
                    fetchAssignmentsBySection(sectionId)
                ]);
            } catch (error) {
                setErrorMessage((error as Error).message);
            }
        };

        loadData();
    }, [sectionId, activeProjectId, fetchSection, fetchSectionFields, fetchAssignmentsBySection]);

    // Initialize layout from section
    useEffect(() => {
        if (section?.layout_config) {
            // If tabs don't exist, initialize with default
            if (!section.layout_config.tabs || Object.keys(section.layout_config.tabs).length === 0) {
                setLayout({
                    ...section.layout_config,
                    tabs: {
                        'Content': { rows: [] }
                    }
                });
                setActiveTab('Content');
            } else {
                setLayout(section.layout_config);
                // Set first available tab as active
                const tabs = Object.keys(section.layout_config.tabs);
                if (tabs.length > 0) {
                    setActiveTab(tabs[0]);
                }
            }
        }
    }, [section]);

    const handleSave = async () => {
        if (!sectionId) return;

        setIsSaving(true);
        setErrorMessage(null);

        try {
            // 1. Create new field assignments in bulk
            if (pendingChanges.newAssignments.length > 0) {
                const assignmentsToCreate = pendingChanges.newAssignments.map(item => item.assignment);
                const createdAssignments = await createAssignmentsBulk(assignmentsToCreate);

                // Verify we got back the same number of assignments
                if (createdAssignments.length !== pendingChanges.newAssignments.length) {
                    throw new Error(`Expected ${pendingChanges.newAssignments.length} assignments but got ${createdAssignments.length}`);
                }

                // Update layout with real assignment IDs
                const tempToRealMap: Record<string, string> = {};
                pendingChanges.newAssignments.forEach((item, index) => {
                    const tempId = item.tempId;
                    const createdAssignment = createdAssignments[index];

                    if (!createdAssignment || !createdAssignment.id) {
                        console.error('Missing assignment at index', index, createdAssignments);
                        throw new Error(`Failed to create assignment at index ${index}`);
                    }

                    const realId = createdAssignment.id;
                    tempToRealMap[tempId] = realId;
                });

                // Replace temp IDs in layout
                const updatedLayout = replaceTemporaryIds(layout, tempToRealMap);
                setLayout(updatedLayout);
            }

            // 2. Update modified assignments
            for (const update of pendingChanges.updatedAssignments) {
                await updateAssignment(update.id, update.changes);
            }

            // 3. Delete removed assignments
            for (const assignmentId of pendingChanges.deletedAssignmentIds) {
                await deleteAssignment(assignmentId);
            }

            // 4. Save layout configuration
            if (pendingChanges.layoutChanged) {
                await updateSectionLayout(sectionId, layout);
            }

            // Reset pending changes
            setPendingChanges({
                newAssignments: [],
                updatedAssignments: [],
                deletedAssignmentIds: [],
                layoutChanged: false
            });

            // Close or navigate after successful save
            if (onClose) {
                onClose();
            }

        } catch (error) {
            setErrorMessage((error as Error).message);
            throw error; // Re-throw so parent can handle
        } finally {
            setIsSaving(false);
        }
    };

    // Expose save function to parent via ref
    useImperativeHandle(ref, () => ({
        save: handleSave,
        getPendingChanges: () => {
            const hasPendingChanges =
                pendingChanges.newAssignments.length > 0 ||
                pendingChanges.updatedAssignments.length > 0 ||
                pendingChanges.deletedAssignmentIds.length > 0 ||
                pendingChanges.layoutChanged;

            return hasPendingChanges ? { ...pendingChanges, layout } : null;
        }
    }));

    const replaceTemporaryIds = (layout: SectionLayoutConfig, tempToRealMap: Record<string, string>): SectionLayoutConfig => {
        const updated = {...layout};

        for (const tabName in updated.tabs) {
            updated.tabs[tabName].rows = updated.tabs[tabName].rows.map(row => ({
                ...row,
                cells: row.cells.map(cell => {
                    // Only update fieldAssignmentId for field cells
                    if (cell.type === 'field' && cell.fieldAssignmentId) {
                        return {
                            ...cell,
                            fieldAssignmentId: tempToRealMap[cell.fieldAssignmentId] || cell.fieldAssignmentId
                        };
                    }
                    return cell;
                })
            }));
        }

        return updated;
    };

    if (!section) {
        return (
            <div className="p-10">
                <Text>Loading section...</Text>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {/* Save button and error message */}
            {!hideSaveButton && (
                <div className="mb-4">
                    <div className="flex items-center justify-between">
                        <Text className="text-sm text-gray-500 dark:text-gray-400">
                            Drag fields from the library into the grid to build your form layout
                        </Text>
                        <Button
                            onClick={handleSave}
                            color="dark/white"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Layout'}
                        </Button>
                    </div>

                    {errorMessage && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mt-4">
                            <Text className="text-sm text-red-800 dark:text-red-200">
                                {errorMessage}
                            </Text>
                        </div>
                    )}
                </div>
            )}

            {hideSaveButton && (
                <div className="mb-4">
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                        Drag fields from the library into the grid to build your form layout
                    </Text>
                    {errorMessage && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mt-4">
                            <Text className="text-sm text-red-800 dark:text-red-200">
                                {errorMessage}
                            </Text>
                        </div>
                    )}
                </div>
            )}

            {/* Two column layout */}
            <div className="flex border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden" style={{height: '600px'}}>
                {/* Left: Libraries */}
                <div className="w-80 border-r border-gray-200 dark:border-white/10 overflow-y-auto">
                    <FieldLibrary
                        fields={fields}
                        onDragStart={() => {
                            // Store field data for drop
                        }}
                    />
                    <ElementsLibrary />
                </div>

                {/* Right: Grid Builder */}
                <div className="flex-1 overflow-y-auto">
                    <GridBuilder
                        layout={layout}
                        activeTab={activeTab}
                        assignments={assignments}
                        pendingAssignments={pendingChanges.newAssignments}
                        fields={fields}
                        onLayoutChange={(newLayout: SectionLayoutConfig) => {
                            setLayout(newLayout);
                            setPendingChanges(prev => ({...prev, layoutChanged: true}));
                        }}
                        onTabChange={setActiveTab}
                        onAssignmentUpdate={(assignmentId: string, changes: Partial<FieldAssignment>) => {
                            setPendingChanges(prev => ({
                                ...prev,
                                updatedAssignments: [
                                    ...prev.updatedAssignments.filter(u => u.id !== assignmentId),
                                    {id: assignmentId, changes}
                                ]
                            }));
                        }}
                        onAssignmentCreate={(fieldId: string, tempAssignmentId: string) => {
                            const newAssignment: Omit<FieldAssignment, 'id'> = {
                                field_id: fieldId,
                                section_id: sectionId,
                                tab_name: activeTab,
                                sort_order: 0,
                                is_visible: true,
                                is_required_override: false
                            };

                            setPendingChanges(prev => ({
                                ...prev,
                                newAssignments: [...prev.newAssignments, { tempId: tempAssignmentId, assignment: newAssignment }]
                            }));
                        }}
                        onAssignmentDelete={(assignmentId: string) => {
                            // Only track deletion if it's not a temporary ID
                            if (!assignmentId.startsWith('temp-')) {
                                setPendingChanges(prev => ({
                                    ...prev,
                                    deletedAssignmentIds: [...prev.deletedAssignmentIds, assignmentId]
                                }));
                            } else {
                                // If it's a temp ID, remove it from newAssignments
                                setPendingChanges(prev => ({
                                    ...prev,
                                    newAssignments: prev.newAssignments.filter(item => item.tempId !== assignmentId)
                                }));
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
});

SectionBuilderPage.displayName = 'SectionBuilderPage';

export default SectionBuilderPage;
