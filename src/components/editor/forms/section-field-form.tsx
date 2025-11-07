import React, {useEffect, useState} from 'react';
import useEditorStore from "@/stores/editorStore";
import useSectionFieldsStore from "@/stores/sectionFieldsStore";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Text} from "@/components/text";
import {Input} from "@/components/input";
import {Button} from "@/components/button";
import {FormType, SectionField} from "@/types/types";
import {Checkbox, CheckboxField} from "@/components/checkbox";
import {Alert, AlertActions, AlertDescription, AlertTitle} from '@/components/alert';
import {Select} from "@/components/select";
import {XMarkIcon} from "@heroicons/react/24/outline";
import {DynamicConfigFields} from "@/components/editor/forms/fields/DynamicConfigFields";

const SectionFieldForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const getSectionField = useSectionFieldsStore((state) => state.getSectionField);
    const createSectionField = useSectionFieldsStore((state) => state.createSectionField);
    const updateSectionField = useSectionFieldsStore((state) => state.updateSectionField);
    const deleteSectionField = useSectionFieldsStore((state) => state.deleteSectionField);
    const fieldTypes = useSectionFieldsStore((state) => state.fieldTypes);

    const [handle, setHandle] = useState('');
    const [label, setLabel] = useState('');
    const [fieldTypeHandle, setFieldTypeHandle] = useState('');
    const [isRequired, setIsRequired] = useState(false);
    const [isUnique, setIsUnique] = useState(false);
    const [relatedSectionId, setRelatedSectionId] = useState('');
    const [fieldSettings, setFieldSettings] = useState<Record<string, unknown>>({});
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Group field types by category
    const fieldTypesByCategory = fieldTypes.reduce((acc, fieldType) => {
        if (!acc[fieldType.category]) {
            acc[fieldType.category] = [];
        }
        acc[fieldType.category].push(fieldType);
        return acc;
    }, {} as Record<string, typeof fieldTypes>);

    useEffect(() => {
        if (formType === FormType.EditSectionField && formEditRecordId) {
            const field = getSectionField(formEditRecordId as string);
            if (field) {
                setHandle(field.handle);
                setLabel(field.label);
                setFieldTypeHandle(field.field_type_handle);
                setIsRequired(field.is_required || false);
                setIsUnique(field.is_unique || false);
                setRelatedSectionId(field.related_section_id || '');
                setFieldSettings((field.field_settings as Record<string, unknown>) || {});
            }
        } else {
            // Reset form for add mode
            setHandle('');
            setLabel('');
            setFieldTypeHandle('');
            setIsRequired(false);
            setIsUnique(false);
            setRelatedSectionId('');
            setFieldSettings({});
        }
    }, [formEditRecordId, formType, getSectionField]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateHandle(handle)) {
            setErrorMessage('Handle must contain only lowercase letters and underscores');
            return;
        }

        if (!fieldTypeHandle) {
            setErrorMessage('Please select a field type');
            return;
        }

        try {
            if (formType === FormType.AddSectionField) {
                const newField: Omit<SectionField, 'id'> = {
                    handle,
                    label,
                    field_type_handle: fieldTypeHandle,
                    field_settings: Object.keys(fieldSettings).length > 0 ? fieldSettings : undefined,
                    is_required: isRequired,
                    is_unique: isUnique,
                    related_section_id: relatedSectionId || undefined,
                };
                await createSectionField(newField);
                closeForm('Field created successfully');
            }

            if (formType === FormType.EditSectionField && formEditRecordId) {
                const updatedField: Partial<SectionField> = {
                    handle,
                    label,
                    field_type_handle: fieldTypeHandle,
                    field_settings: Object.keys(fieldSettings).length > 0 ? fieldSettings : undefined,
                    is_required: isRequired,
                    is_unique: isUnique,
                    related_section_id: relatedSectionId || undefined,
                };
                await updateSectionField(formEditRecordId as string, updatedField);
                closeForm('Field updated successfully');
            }
        } catch (error) {
            setErrorMessage((error as Error).message);
        }
    };

    const handleDelete = async () => {
        if (formEditRecordId) {
            try {
                await deleteSectionField(formEditRecordId as string);
                setShowDeleteAlert(false);
                closeForm('Field deleted successfully');
            } catch (error) {
                setErrorMessage((error as Error).message);
            }
        }
    };

    const selectedFieldType = fieldTypes.find(ft => ft.handle === fieldTypeHandle);
    const isRelationalField = selectedFieldType?.category === 'relational';

    return (
        <form className="p-10 space-y-6" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>
                    {formType === FormType.AddSectionField ? 'Add Field' : 'Edit Field'}
                </Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>

            <Divider className="my-4" soft bleed />

            {errorMessage && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                    <Text className="text-sm text-red-800 dark:text-red-200">
                        {errorMessage}
                    </Text>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <Subheading>Field Type</Subheading>
                    <Select
                        name="field_type"
                        value={fieldTypeHandle}
                        onChange={(e) => setFieldTypeHandle(e.target.value)}
                        disabled={formType === FormType.EditSectionField}
                        required
                    >
                        <option value="">Select a field type...</option>
                        {Object.entries(fieldTypesByCategory).map(([category, types]) => (
                            <optgroup key={category} label={category.toUpperCase()}>
                                {types.map((fieldType) => (
                                    <option key={fieldType.handle} value={fieldType.handle}>
                                        {fieldType.label}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </Select>
                    {formType === FormType.EditSectionField && (
                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Field type cannot be changed after creation
                        </Text>
                    )}
                </div>

                <Divider />

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
                        placeholder="field_name"
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
                        placeholder="Field Name"
                        required
                    />
                </div>

                {selectedFieldType?.settings_schema && (
                    <>
                        <Divider />
                        <Subheading>{selectedFieldType.label} Settings</Subheading>
                        <DynamicConfigFields
                            schema={selectedFieldType.settings_schema}
                            value={fieldSettings}
                            onChange={setFieldSettings}
                        />
                    </>
                )}

                <Divider />

                <Subheading>Options</Subheading>

                <CheckboxField>
                    <Checkbox
                        checked={isRequired}
                        onChange={(checked) => setIsRequired(checked)}
                    />
                    <Text>Required field</Text>
                </CheckboxField>

                <CheckboxField>
                    <Checkbox
                        checked={isUnique}
                        onChange={(checked) => setIsUnique(checked)}
                    />
                    <Text>Unique values only</Text>
                </CheckboxField>

                {isRelationalField && (
                    <>
                        <Divider />
                        <Subheading>Relation Settings</Subheading>
                        <div>
                            <label htmlFor="related_section_id" className="block text-sm font-medium mb-1">
                                Related Section ID
                            </label>
                            <Input
                                id="related_section_id"
                                type="text"
                                value={relatedSectionId}
                                onChange={(e) => setRelatedSectionId(e.target.value)}
                                placeholder="UUID of related section"
                            />
                            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                For relational fields, specify the section to link to
                            </Text>
                        </div>
                    </>
                )}
            </div>

            <Divider />

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button type="submit" color="dark/white">
                        {formType === FormType.AddSectionField ? 'Create Field' : 'Update Field'}
                    </Button>
                    <Button type="button" plain onClick={() => closeForm()}>
                        Cancel
                    </Button>
                </div>
                {formType === FormType.EditSectionField && (
                    <Button type="button" color="red" onClick={() => setShowDeleteAlert(true)}>
                        Delete
                    </Button>
                )}
            </div>

            <Alert open={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
                <AlertTitle>Delete Field?</AlertTitle>
                <AlertDescription>
                    Are you sure you want to delete this field? This action cannot be undone and all data in this field will be permanently removed.
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
        </form>
    );
};

export default SectionFieldForm;
