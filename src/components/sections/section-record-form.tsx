import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/button';
import { Heading } from '@/components/heading';
// import { Text } from '@/components/text';
import useSectionDataStore from '@/stores/sectionDataStore';
import useSectionsStore from '@/stores/sectionsStore';
import useEditorStore from '@/stores/editorStore';
import { fetchFormConfig, fetchSingleRecord, fetchSection, FormConfig, FormField } from '@/api/sectionsApi';
import { Section } from '@/types/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

// Import all input components
import TextInput from '@/components/sections/form-inputs/text-input';
import TextareaInput from '@/components/sections/form-inputs/textarea-input';
import SelectInput from '@/components/sections/form-inputs/select-input';
import MultiSelectInput from '@/components/sections/form-inputs/multi-select-input';
import NumberInput from '@/components/sections/form-inputs/number-input';
import DateInput from '@/components/sections/form-inputs/date-input';
import DateTimeInput from '@/components/sections/form-inputs/datetime-input';
import CheckboxInput from '@/components/sections/form-inputs/checkbox-input';
import RelationInput from '@/components/sections/form-inputs/relation-input';
import JsonInput from '@/components/sections/form-inputs/json-input';

const SectionRecordForm: React.FC = () => {
    const isFormOpen = useSectionDataStore((state) => state.isFormOpen);
    const formMode = useSectionDataStore((state) => state.formMode);
    const editingRecordId = useSectionDataStore((state) => state.editingRecordId);
    const activeSectionId = useSectionDataStore((state) => state.activeSectionId);
    const closeForm = useSectionDataStore((state) => state.closeForm);
    const createRecord = useSectionDataStore((state) => state.createRecord);
    const updateRecord = useSectionDataStore((state) => state.updateRecord);
    const refreshRecords = useSectionDataStore((state) => state.refreshRecords);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sections = useSectionsStore((state) => state.sections);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
    const [fullSection, setFullSection] = useState<Section | null>(null);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('');

    // Fetch form config and record data when form opens
    useEffect(() => {
        if (!isFormOpen || !activeSectionId || !activeProjectId) return;

        const loadForm = async () => {
            setIsLoading(true);
            try {
                // Fetch full section data with layout_config and field_assignments
                const sectionData = await fetchSection(activeSectionId, activeProjectId);
                setFullSection(sectionData);

                // Fetch form config
                const config = await fetchFormConfig(activeSectionId, activeProjectId);
                setFormConfig(config);

                // Set first tab as active (from layout_config tabs)
                if (sectionData?.layout_config?.tabs) {
                    const tabNames = Object.keys(sectionData.layout_config.tabs);
                    if (tabNames.length > 0) {
                        setActiveTab(tabNames[0]);
                    }
                }

                // If editing, fetch the record
                if (formMode === 'edit' && editingRecordId) {
                    const record = await fetchSingleRecord(activeSectionId, editingRecordId, activeProjectId);
                    setFormData(record);
                } else {
                    setFormData({});
                }
            } catch (error) {
                console.error('Failed to load form:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadForm();
    }, [isFormOpen, activeSectionId, activeProjectId, formMode, editingRecordId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSectionId) return;

        // Filter out metadata fields - only send field handles with values
        const metadataFields = ['id', 'created_at', 'updated_at', 'deleted_at'];
        const cleanFormData = Object.keys(formData)
            .filter(key => !metadataFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = formData[key];
                return obj;
            }, {} as Record<string, unknown>);

        setIsSaving(true);
        try {
            if (formMode === 'create') {
                await createRecord(activeSectionId, cleanFormData);
            } else if (formMode === 'edit' && editingRecordId) {
                await updateRecord(activeSectionId, editingRecordId, cleanFormData);
            }

            await refreshRecords();
            closeForm();
        } catch (error) {
            console.error('Failed to save record:', error);
            alert(`Failed to save record: ${error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFieldChange = (fieldHandle: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [fieldHandle]: value }));
    };

    // Render field based on field_assignment (which has field data flat)
    const renderFieldByType = (fieldHandle: string, fieldTypeHandle: string, required: boolean, fieldSettings?: object) => {
        const value = formData[fieldHandle];
        const onChange = (val: unknown) => handleFieldChange(fieldHandle, val);

        // Simple type mapping based on field_type_handle - extend as needed
        const placeholder = (fieldSettings as { placeholder?: string })?.placeholder || '';

        switch (fieldTypeHandle) {
            case 'text':
            case 'string':
                return (
                    <TextInput
                        value={value as string}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        config={{}}
                    />
                );
            case 'textarea':
                return (
                    <TextareaInput
                        value={value as string}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        config={{}}
                    />
                );
            case 'number':
            case 'integer':
                return (
                    <NumberInput
                        value={value as number | string}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        config={{}}
                    />
                );
            case 'boolean':
                return (
                    <CheckboxInput
                        value={value as boolean}
                        onChange={onChange}
                        required={required}
                        config={{}}
                    />
                );
            case 'select':
                return (
                    <SelectInput
                        value={value as string}
                        onChange={onChange}
                        required={required}
                        config={fieldSettings as Record<string, unknown>}
                    />
                );
            case 'multi_select':
                return (
                    <MultiSelectInput
                        value={value as string[] | null}
                        onChange={onChange}
                        required={required}
                        config={fieldSettings as { options?: Array<{value: string; label: string}>; minSelections?: number; maxSelections?: number; searchable?: boolean }}
                    />
                );
            case 'relation_many_to_one':
            case 'relation_one_to_many':
            case 'relation_many_to_many':
                return (
                    <RelationInput
                        value={value as string | null}
                        onChange={onChange}
                        required={required}
                        config={fieldSettings as { relatedSection?: string; displayField?: string }}
                    />
                );
            case 'json':
            case 'jsonb':
                return (
                    <JsonInput
                        value={value as object | null}
                        onChange={onChange}
                        required={required}
                        config={fieldSettings}
                    />
                );
            default:
                return (
                    <TextInput
                        value={value as string}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        config={{}}
                    />
                );
        }
    };

    // Render the appropriate input component based on form_input_config.component (legacy, not used)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const renderField = (field: FormField) => {
        const value = formData[field.field_handle];
        const onChange = (val: unknown) => handleFieldChange(field.field_handle, val);
        const config = field.form_input_config.props;

        switch (field.form_input_config.component) {
            case 'TextInput':
                return (
                    <TextInput
                        value={value as string}
                        onChange={onChange}
                        placeholder={config.placeholder as string}
                        required={field.required}
                        config={config}
                    />
                );
            case 'TextareaInput':
                return (
                    <TextareaInput
                        value={value as string}
                        onChange={onChange}
                        placeholder={config.placeholder as string}
                        required={field.required}
                        config={config}
                    />
                );
            case 'SelectInput':
                return (
                    <SelectInput
                        value={value as string}
                        onChange={onChange}
                        required={field.required}
                        config={config}
                    />
                );
            case 'NumberInput':
                return (
                    <NumberInput
                        value={value as number | string}
                        onChange={onChange}
                        placeholder={config.placeholder as string}
                        required={field.required}
                        config={config}
                    />
                );
            case 'DateInput':
                return (
                    <DateInput
                        value={value as string}
                        onChange={onChange}
                        required={field.required}
                        config={config}
                    />
                );
            case 'DateTimeInput':
                return (
                    <DateTimeInput
                        value={value as string}
                        onChange={onChange}
                        required={field.required}
                        config={config}
                    />
                );
            case 'CheckboxInput':
                return (
                    <CheckboxInput
                        value={value as boolean}
                        onChange={onChange}
                        required={field.required}
                        config={config}
                    />
                );
            default:
                // Fallback to text input
                return (
                    <TextInput
                        value={value as string}
                        onChange={onChange}
                        placeholder={config.placeholder as string}
                        required={field.required}
                        config={config}
                    />
                );
        }
    };

    if (!isFormOpen) return null;

    return (
        <div className="h-full bg-white dark:bg-zinc-800 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                    <Heading className="truncate">
                        {formMode === 'create' ? 'Add' : 'Edit'} {fullSection?.label || 'Record'}
                    </Heading>
                    <button
                        onClick={closeForm}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0 ml-2"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 min-w-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : formConfig ? (
                        <form onSubmit={handleSubmit} id="record-form">
                            {/* Tabs */}
                            {fullSection?.layout_config?.tabs && Object.keys(fullSection.layout_config.tabs).length > 1 && (
                                <div className="border-b border-gray-200 dark:border-white/10 mb-6">
                                    <div className="flex gap-2 -mb-px">
                                        {Object.keys(fullSection.layout_config.tabs).map((tabName) => (
                                            <button
                                                key={tabName}
                                                type="button"
                                                onClick={() => setActiveTab(tabName)}
                                                className={`px-4 py-3 border-b-2 transition-colors ${
                                                    activeTab === tabName
                                                        ? 'border-sky-500 dark:border-white text-sky-500 dark:text-white font-medium'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                                }`}
                                            >
                                                {tabName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fields rendered from layout_config */}
                            {fullSection?.layout_config?.tabs && fullSection.layout_config.tabs[activeTab] ? (() => {
                                const rows = fullSection.layout_config.tabs[activeTab].rows.filter(row => row.cells && row.cells.length > 0);
                                const numRows = rows.length;

                                // Get all cells from all rows
                                const allCells = rows.flatMap(row => row.cells);

                                return (
                                    <div
                                        className="grid grid-cols-12 gap-4"
                                        style={{
                                            gridTemplateRows: `repeat(${numRows}, auto)`,
                                        }}
                                    >
                                        {allCells.map((cell) => {
                                                // Render different cell types
                                            if (cell.type === 'field' && cell.fieldAssignmentId) {
                                                // Find the field assignment by fieldAssignmentId
                                                const fieldAssignment = fullSection.field_assignments?.find(
                                                    fa => fa.id === cell.fieldAssignmentId
                                                );

                                                if (!fieldAssignment || !fieldAssignment.field_handle || !fieldAssignment.field_type_handle) return null;

                                                // Field data is flat in fieldAssignment
                                                const isRequired = fieldAssignment.is_required_override || !!fieldAssignment.is_required;

                                                return (
                                                    <div
                                                        key={cell.id}
                                                        className="min-w-0"
                                                        style={{
                                                            gridColumn: `${cell.col_start} / ${cell.col_end}`,
                                                            gridRow: `${cell.row_start + 1} / ${cell.row_end + 1}`
                                                        }}
                                                    >
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                {fieldAssignment.field_label}
                                                                {isRequired && <span className="text-red-500 ml-1">*</span>}
                                                            </label>
                                                            {renderFieldByType(
                                                                fieldAssignment.field_handle,
                                                                fieldAssignment.field_type_handle,
                                                                isRequired,
                                                                fieldAssignment.field_settings
                                                            )}
                                                        </div>
                                                    );
                                            } else if (cell.type === 'divider') {
                                                // Render divider
                                                return (
                                                    <div
                                                        key={cell.id}
                                                        className="flex items-center"
                                                        style={{
                                                            gridColumn: `${cell.col_start} / ${cell.col_end}`,
                                                            gridRow: `${cell.row_start + 1} / ${cell.row_end + 1}`
                                                        }}
                                                    >
                                                        <div className="w-full border-t-2 border-gray-300 dark:border-gray-600"></div>
                                                    </div>
                                                );
                                            } else if (cell.type === 'heading') {
                                                // Render heading
                                                return (
                                                    <div
                                                        key={cell.id}
                                                        className="flex items-center"
                                                        style={{
                                                            gridColumn: `${cell.col_start} / ${cell.col_end}`,
                                                            gridRow: `${cell.row_start + 1} / ${cell.row_end + 1}`
                                                        }}
                                                    >
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                            {cell.content || 'Heading'}
                                                        </h3>
                                                    </div>
                                                );
                                            } else if (cell.type === 'info_text') {
                                                // Render info text with markdown
                                                return (
                                                    <div
                                                        key={cell.id}
                                                        className="flex items-start"
                                                        style={{
                                                            gridColumn: `${cell.col_start} / ${cell.col_end}`,
                                                            gridRow: `${cell.row_start + 1} / ${cell.row_end + 1}`
                                                        }}
                                                    >
                                                        <div className="prose dark:prose-invert max-w-none prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100">
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                                            >
                                                                {cell.content || ''}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Skip empty cells
                                            return null;
                                        })}
                                    </div>
                                );
                            })() : (
                                /* Fallback: Simple vertical layout if no tabs configured */
                                <div className="space-y-6">
                                    {fullSection?.field_assignments?.map((fieldAssignment) => {
                                        if (!fieldAssignment.field_handle || !fieldAssignment.field_type_handle) return null;

                                        const isRequired = fieldAssignment.is_required_override || !!fieldAssignment.is_required;

                                        return (
                                            <div key={fieldAssignment.id}>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {fieldAssignment.field_label}
                                                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                                                </label>
                                                {renderFieldByType(
                                                    fieldAssignment.field_handle,
                                                    fieldAssignment.field_type_handle,
                                                    isRequired,
                                                    fieldAssignment.field_settings
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </form>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-white/10 flex-shrink-0">
                    <Button
                        type="button"
                        onClick={closeForm}
                        outline
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="record-form"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : (formMode === 'create' ? 'Create' : 'Update')}
                    </Button>
                </div>
        </div>
    );
};

export default SectionRecordForm;
