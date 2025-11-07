import React, { useEffect, useState } from 'react';
import { Select } from '@/components/select';
import useEditorStore from '@/stores/editorStore';
import { fetchSectionRecords } from '@/api/sectionsApi';

interface RelationInputProps {
    value: string | null;
    onChange: (value: string | null) => void;
    required?: boolean;
    config: {
        relatedSection?: string;
        displayField?: string;
    };
}

const RelationInput: React.FC<RelationInputProps> = ({
    value,
    onChange,
    required = false,
    config
}) => {
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const [relatedRecords, setRelatedRecords] = useState<Record<string, unknown>[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const relatedSectionId = config.relatedSection;
    const displayField = config.displayField || 'title';

    useEffect(() => {
        if (!relatedSectionId || !activeProjectId) return;

        const loadRelatedRecords = async () => {
            setIsLoading(true);
            try {
                const response = await fetchSectionRecords(relatedSectionId, activeProjectId, {
                    limit: 100, // Fetch more records for dropdown
                    offset: 0
                });
                setRelatedRecords(response.records);
            } catch (error) {
                console.error('Failed to load related records:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadRelatedRecords();
    }, [relatedSectionId, activeProjectId]);

    return (
        <Select
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            required={required}
            disabled={isLoading}
        >
            <option value="">
                {isLoading ? 'Loading...' : 'Select...'}
            </option>
            {relatedRecords.map((record) => (
                <option key={record.id as string} value={record.id as string}>
                    {String(record[displayField] || record.id)}
                </option>
            ))}
        </Select>
    );
};

export default RelationInput;
