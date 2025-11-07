import React from 'react';
import {DynamicConfigField} from './DynamicConfigField';
import {Text} from "@/components/text";
import {JSONSchema} from "@/types/types";

interface DynamicConfigFieldsProps {
    schema?: JSONSchema;
    value: Record<string, unknown>;
    onChange: (value: Record<string, unknown>) => void;
}

export function DynamicConfigFields({ schema, value = {}, onChange }: DynamicConfigFieldsProps) {
    if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
        return (
            <Text className="text-sm text-gray-500 dark:text-gray-400">
                No additional settings for this field type.
            </Text>
        );
    }

    const handleFieldChange = (key: string, fieldValue: unknown) => {
        onChange({
            ...value,
            [key]: fieldValue
        });
    };

    return (
        <div className="space-y-4">
            {Object.entries(schema.properties).map(([key, property]) => (
                <DynamicConfigField
                    key={key}
                    fieldKey={key}
                    property={property}
                    value={value[key] ?? property.default}
                    onChange={(val) => handleFieldChange(key, val)}
                />
            ))}
        </div>
    );
}
