import React, {useEffect, useState, useRef} from 'react';
import useEditorStore from "@/stores/editorStore";
import useSectionsStore from "@/stores/sectionsStore";
import useDatabaseConnectionsStore from "@/stores/databaseConnectionsStore";
// import useSectionFieldsStore from "@/stores/sectionFieldsStore";
// import useFieldAssignmentsStore from "@/stores/fieldAssignmentsStore";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Text} from "@/components/text";
import {Input} from "@/components/input";
import {Textarea} from "@/components/textarea";
import {Button} from "@/components/button";
import {FormType, Section, VectorizationConfig} from "@/types/types";
import {Alert, AlertActions, AlertDescription, AlertTitle} from '@/components/alert';
import {XMarkIcon} from "@heroicons/react/24/outline";
import SectionBuilderPage, { SectionBuilderRef, BuilderPendingChanges } from "@/components/editor/section-builder/section-builder-page";
import VectorizationTab from "@/components/editor/forms/vectorization-tab";

const SectionForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const getSection = useSectionsStore((state) => state.getSection);
    const createSection = useSectionsStore((state) => state.createSection);
    const updateSection = useSectionsStore((state) => state.updateSection);
    const deleteSection = useSectionsStore((state) => state.deleteSection);

    const connections = useDatabaseConnectionsStore((state) => state.connections);
    const fetchDatabaseConnections = useDatabaseConnectionsStore((state) => state.fetchDatabaseConnections);

    const builderRef = useRef<SectionBuilderRef>(null);

    const [activeTab, setActiveTab] = useState<'info' | 'builder' | 'vectorization'>('info');
    const [handle, setHandle] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [vectorizationConfig, setVectorizationConfig] = useState<VectorizationConfig | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [builderHasChanges, setBuilderHasChanges] = useState(false);

    useEffect(() => {
        fetchDatabaseConnections();
    }, [fetchDatabaseConnections]);

    useEffect(() => {
        if (formType === FormType.EditSection && formEditRecordId) {
            const section = getSection(formEditRecordId as string);
            if (section) {
                setHandle(section.handle);
                setLabel(section.label);
                setDescription(section.description || '');
                setVectorizationConfig(section.vectorization_config || null);
            }
        } else {
            // Reset form for add mode
            setHandle('');
            setLabel('');
            setDescription('');
            setVectorizationConfig(null);
        }
    }, [formEditRecordId, formType, getSection]);

    const validateHandle = (value: string): boolean => {
        const pattern = /^[a-z_]+$/;
        return pattern.test(value);
    };

    const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setHandle(value);

        if (value && !validateHandle(value)) {
            setErrorMessage('Handle must contain only lowercase letters and underscores');
        } else {
            setErrorMessage(null);
        }
    };

    const handleSaveAll = async () => {
        if (!validateHandle(handle)) {
            setErrorMessage('Handle must contain only lowercase letters and underscores');
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);

        try {
            // Use first available database connection (max 1 per project)
            const databaseConnectionId = connections.length > 0 ? connections[0].id : undefined;

            // Step 1: Save or create the section with basic info
            if (formType === FormType.AddSection) {
                const newSection: Omit<Section, 'id'> = {
                    handle,
                    label,
                    description: description || undefined,
                    database_connection_id: databaseConnectionId,
                    layout_config: {
                        tabs: {
                            'Content': {
                                rows: []
                            }
                        }
                    }
                };
                await createSection(newSection);
                closeForm('Section created successfully');
            } else if (formType === FormType.EditSection && formEditRecordId) {
                // Save basic info and vectorization config
                const updatedSection: Partial<Section> = {
                    handle,
                    label,
                    description: description || undefined,
                    database_connection_id: databaseConnectionId,
                    vectorization_config: vectorizationConfig,
                };
                await updateSection(formEditRecordId as string, updatedSection);

                // Step 2: Save builder changes if any
                if (builderRef.current) {
                    const pendingChanges = builderRef.current.getPendingChanges();
                    if (pendingChanges) {
                        await builderRef.current.save();
                    }
                }

                closeForm('Section saved successfully');
            }
        } catch (error) {
            setErrorMessage((error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBuilderChanges = (changes: BuilderPendingChanges | null) => {
        setBuilderHasChanges(changes !== null);
    };

    const handleDelete = async () => {
        if (formEditRecordId) {
            try {
                await deleteSection(formEditRecordId as string);
                setShowDeleteAlert(false);
                closeForm('Section deleted successfully');
            } catch (error) {
                setErrorMessage((error as Error).message);
            }
        }
    };

    return (
        <section className="p-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>
                    {formType === FormType.AddSection ? 'Add Section' : 'Edit Section'}
                </Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>

            <Divider className="my-4" soft bleed />

            {/* Tabs */}
            <div className="mb-4 flex gap-2 border-b border-sky-500/50 dark:border-white/10">
                <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === 'info'
                            ? 'border-b-2 border-sky-500 dark:border-white text-sky-500 dark:text-white'
                            : 'text-sky-500/60 hover:text-sky-500 dark:text-white/60 dark:hover:text-white'
                    }`}
                    onClick={() => setActiveTab('info')}
                >
                    Basic Info
                </button>
                {formType === FormType.EditSection && (
                    <>
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium transition ${
                                activeTab === 'builder'
                                    ? 'border-b-2 border-sky-500 dark:border-white text-sky-500 dark:text-white'
                                    : 'text-sky-500/60 hover:text-sky-500 dark:text-white/60 dark:hover:text-white'
                            }`}
                            onClick={() => setActiveTab('builder')}
                        >
                            Builder
                        </button>
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium transition ${
                                activeTab === 'vectorization'
                                    ? 'border-b-2 border-sky-500 dark:border-white text-sky-500 dark:text-white'
                                    : 'text-sky-500/60 hover:text-sky-500 dark:text-white/60 dark:hover:text-white'
                            }`}
                            onClick={() => setActiveTab('vectorization')}
                        >
                            Vectorization
                        </button>
                    </>
                )}
            </div>

            {errorMessage && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-4">
                    <Text className="text-sm text-red-800 dark:text-red-200">
                        {errorMessage}
                    </Text>
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'info' && (
                <div className="space-y-6">
                    <Subheading>Basic Information</Subheading>

                    <div>
                        <label htmlFor="handle" className="block text-sm font-medium mb-1">
                            Handle <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="handle"
                            type="text"
                            value={handle}
                            onChange={handleHandleChange}
                            placeholder="section_name"
                            required
                            pattern="[a-z_]+"
                        />
                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Unique identifier (lowercase letters and underscores only)
                        </Text>
                    </div>

                    <div>
                        <label htmlFor="label" className="block text-sm font-medium mb-1">
                            Label <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="label"
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Section Name"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1">
                            Description
                        </label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={2}
                        />
                    </div>

                    <Divider />

                    <Subheading>Database Storage</Subheading>

                    <div className="rounded-lg border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-sky-500 dark:text-sky-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                {connections.length === 0 ? (
                                    <>
                                        <Text className="font-medium text-sm">Internal PolySynergy Database</Text>
                                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Data will be stored in the main PolySynergy database
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Text className="font-medium text-sm">
                                            External: {connections[0].label}
                                        </Text>
                                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {connections[0].database_type.toUpperCase()} • {connections[0].database_name}
                                        </Text>
                                    </>
                                )}
                                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Configure in Project Settings (rocket icon)
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Builder Tab */}
            {activeTab === 'builder' && formEditRecordId && (
                <SectionBuilderPage
                    ref={builderRef}
                    sectionId={formEditRecordId as string}
                    hideSaveButton={true}
                    onPendingChangesUpdate={handleBuilderChanges}
                />
            )}

            {/* Vectorization Tab */}
            {activeTab === 'vectorization' && formEditRecordId && (
                <VectorizationTab
                    section={getSection(formEditRecordId as string)!}
                    config={vectorizationConfig}
                    onChange={setVectorizationConfig}
                />
            )}

            {/* Unified Save Button - shown for all tabs */}
            <Divider className="my-6" />

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button
                        onClick={handleSaveAll}
                        color="dark/white"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : (formType === FormType.AddSection ? 'Create Section' : 'Save Section')}
                    </Button>
                    <Button plain onClick={() => closeForm()}>
                        Cancel
                    </Button>
                </div>
                {formType === FormType.EditSection && (
                    <Button color="red" onClick={() => setShowDeleteAlert(true)}>
                        Delete
                    </Button>
                )}
            </div>

            <Alert open={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
                <AlertTitle>Delete Section?</AlertTitle>
                <AlertDescription>
                    Are you sure you want to delete this section? This action cannot be undone and all
                    field assignments and data in this section will be permanently removed.
                </AlertDescription>
                <AlertActions>
                    <Button plain onClick={() => setShowDeleteAlert(false)}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDelete}>
                        Delete
                    </Button>
                </AlertActions>
            </Alert>
        </section>
    );
};

export default SectionForm;
