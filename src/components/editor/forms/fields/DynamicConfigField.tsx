import React from 'react';
import {Input} from "@/components/input";
import {Checkbox, CheckboxField} from "@/components/checkbox";
import {Text} from "@/components/text";
import {Select} from "@/components/select";
import {JSONSchemaProperty} from "@/types/types";
import useSectionsStore from "@/stores/sectionsStore";

interface DynamicConfigFieldProps {
    fieldKey: string;
    property: JSONSchemaProperty;
    value: unknown;
    onChange: (value: unknown) => void;
}

export function DynamicConfigField({ fieldKey, property, value, onChange }: DynamicConfigFieldProps) {
    const label = property.title || fieldKey;
    const description = property.description;

    // Get sections from store for section reference fields
    const sections = useSectionsStore((state) => state.sections);

    // Detect if this is a section reference field
    const isSectionReference = property.type === 'string' &&
                                property.format === 'uuid' &&
                                (fieldKey.toLowerCase().includes('section') ||
                                 fieldKey === 'relatedSection' ||
                                 fieldKey === 'related_section_id');

    // Render section selector for section reference fields
    if (isSectionReference) {
        return (
            <div>
                <label htmlFor={fieldKey} className="block text-sm font-medium mb-1">
                    {label}
                </label>
                <Select
                    id={fieldKey}
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">Select a section...</option>
                    {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                            {section.label} ({section.handle})
                        </option>
                    ))}
                </Select>
                {description && (
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {description}
                    </Text>
                )}
            </div>
        );
    }

    // Check for enum first (most specific)
    if (property.enum && Array.isArray(property.enum)) {
        return (
            <div>
                <label htmlFor={fieldKey} className="block text-sm font-medium mb-1">
                    {label}
                </label>
                <Select
                    id={fieldKey}
                    value={String(value ?? property.default ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">Select...</option>
                    {property.enum.map((enumValue) => (
                        <option key={enumValue} value={enumValue}>
                            {enumValue.charAt(0).toUpperCase() + enumValue.slice(1)}
                        </option>
                    ))}
                </Select>
                {description && (
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {description}
                    </Text>
                )}
            </div>
        );
    }

    // Render different inputs based on type
    switch (property.type) {
        case 'integer':
        case 'number':
            return (
                <div>
                    <label htmlFor={fieldKey} className="block text-sm font-medium mb-1">
                        {label}
                    </label>
                    <Input
                        id={fieldKey}
                        type="number"
                        value={value !== null && value !== undefined ? String(value) : ''}
                        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                        min={property.minimum}
                        max={property.maximum}
                        step={property.type === 'integer' ? 1 : 'any'}
                    />
                    {description && (
                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {description}
                        </Text>
                    )}
                </div>
            );

        case 'boolean':
            return (
                <CheckboxField>
                    <Checkbox
                        checked={Boolean(value ?? property.default ?? false)}
                        onChange={(checked) => onChange(checked)}
                    />
                    <div>
                        <Text className="font-medium">{label}</Text>
                        {description && (
                            <Text className="text-xs text-gray-500 dark:text-gray-400">
                                {description}
                            </Text>
                        )}
                    </div>
                </CheckboxField>
            );

        case 'string':
        default:
            return (
                <div>
                    <label htmlFor={fieldKey} className="block text-sm font-medium mb-1">
                        {label}
                    </label>
                    <Input
                        id={fieldKey}
                        value={String(value ?? '')}
                        onChange={(e) => onChange(e.target.value)}
                    />
                    {description && (
                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {description}
                        </Text>
                    )}
                </div>
            );
    }
}
