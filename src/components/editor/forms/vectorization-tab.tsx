import React, { useState, useEffect } from 'react';
import { Subheading } from '@/components/heading';
import { Text } from '@/components/text';
import { Input } from '@/components/input';
import { Select } from '@/components/select';
import { Alert, AlertDescription, AlertTitle, AlertActions } from '@/components/alert';
import { Button } from '@/components/button';
import { VectorizationConfig, Section, Secret } from '@/types/types';
import { fetchProjectSecretsAPI } from '@/api/secretsApi';
import useEditorStore from '@/stores/editorStore';
import useSectionsStore from '@/stores/sectionsStore';

interface VectorizationTabProps {
    section: Section;
    config: VectorizationConfig | null;
    onChange: (config: VectorizationConfig | null) => void;
}

// Model configuration with dimensions
const MODEL_CONFIG: Record<string, Record<string, number>> = {
    openai: {
        'text-embedding-3-small': 1536,
        'text-embedding-3-large': 3072,
        'text-embedding-ada-002': 1536,
    },
    mistral: {
        'mistral-embed': 1024,
    },
};

// Field types that can be vectorized (text-based + JSON)
const TEXT_FIELD_TYPES = ['text', 'textarea', 'email', 'url', 'json'];

const VectorizationTab: React.FC<VectorizationTabProps> = ({ section, config, onChange }) => {
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const fetchSection = useSectionsStore((state) => state.fetchSection);

    // Local state
    const [enabled, setEnabled] = useState(config?.enabled || false);
    const [provider, setProvider] = useState<'openai' | 'mistral'>(config?.provider || 'openai');
    const [apiKeySecretId, setApiKeySecretId] = useState(config?.api_key_secret_id || '');
    const [model, setModel] = useState(config?.model || 'text-embedding-3-small');
    const [dimensions, setDimensions] = useState(config?.dimensions || 1536);
    const [sourceFields, setSourceFields] = useState<string[]>(config?.source_fields || []);
    const [metadataFields, setMetadataFields] = useState<string[]>(config?.metadata_fields || ['id', 'created_at', 'updated_at']);
    const [searchType, setSearchType] = useState<'vector' | 'keyword' | 'hybrid'>(config?.search_type || 'hybrid');
    const [distance, setDistance] = useState<'cosine' | 'l2' | 'max_inner_product'>(config?.distance || 'cosine');

    // Section data with field_assignments
    const [fullSection, setFullSection] = useState<Section>(section);
    const [loadingSection, setLoadingSection] = useState(false);

    // Secrets
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [loadingSecrets, setLoadingSecrets] = useState(false);

    // UI state
    const [showDisableAlert, setShowDisableAlert] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Fetch full section data with field_assignments
    useEffect(() => {
        if (section.id) {
            setLoadingSection(true);
            fetchSection(section.id)
                .then((fetchedSection) => {
                    if (fetchedSection) {
                        setFullSection(fetchedSection);
                    }
                })
                .catch((error) => {
                    console.error('Failed to load section:', error);
                })
                .finally(() => {
                    setLoadingSection(false);
                });
        }
    }, [section.id, fetchSection]);

    // Load secrets on mount
    useEffect(() => {
        if (activeProjectId) {
            setLoadingSecrets(true);
            fetchProjectSecretsAPI(activeProjectId)
                .then((fetchedSecrets) => {
                    // Filter for API-related secrets and ensure they have required fields
                    const apiSecrets = (fetchedSecrets || [])
                        .filter((s: Secret) => s && s.key && s.id)
                        .filter((s: Secret) => {
                            const keyLower = s.key.toLowerCase();
                            return keyLower.includes('api') ||
                                   keyLower.includes('openai') ||
                                   keyLower.includes('mistral') ||
                                   keyLower.includes('key');
                        });
                    setSecrets(apiSecrets);
                })
                .catch((error) => {
                    console.error('Failed to load secrets:', error);
                    setSecrets([]);
                })
                .finally(() => {
                    setLoadingSecrets(false);
                });
        }
    }, [activeProjectId]);

    // Update config whenever local state changes
    useEffect(() => {
        if (enabled) {
            onChange({
                enabled,
                provider,
                api_key_secret_id: apiKeySecretId,
                model,
                dimensions,
                source_fields: sourceFields,
                metadata_fields: metadataFields,
                search_type: searchType,
                distance,
            });
        } else {
            onChange(null);
        }
    }, [enabled, provider, apiKeySecretId, model, dimensions, sourceFields, metadataFields, searchType, distance, onChange]);

    // Get available fields
    // Note: field_assignments from API have field data as direct properties (field_handle, field_label, field_type_handle)
    const textBasedFields = fullSection.field_assignments
        ?.filter((fa) => fa && fa.field_handle && fa.field_type_handle && TEXT_FIELD_TYPES.includes(fa.field_type_handle))
        .map((fa) => ({
            handle: fa.field_handle!,
            label: fa.field_label!,
            type: fa.field_type_handle!,
        })) || [];

    const allFields = fullSection.field_assignments
        ?.filter((fa) => fa && fa.field_handle && fa.field_type_handle)
        .map((fa) => ({
            handle: fa.field_handle!,
            label: fa.field_label!,
            type: fa.field_type_handle!,
        })) || [];

    // Add system fields to all fields
    const systemFields = [
        { handle: 'id', label: 'ID', type: 'system' },
        { handle: 'created_at', label: 'Created At', type: 'system' },
        { handle: 'updated_at', label: 'Updated At', type: 'system' },
    ];
    const allFieldsWithSystem = [...systemFields, ...allFields];

    const handleEnableToggle = () => {
        if (enabled) {
            setShowDisableAlert(true);
        } else {
            setEnabled(true);
        }
    };

    const handleDisableConfirm = () => {
        setEnabled(false);
        setShowDisableAlert(false);
    };

    const handleProviderChange = (newProvider: 'openai' | 'mistral') => {
        setProvider(newProvider);

        // Auto-select default model for provider
        const defaultModel = Object.keys(MODEL_CONFIG[newProvider])[0];
        setModel(defaultModel);
        setDimensions(MODEL_CONFIG[newProvider][defaultModel]);
    };

    const handleModelChange = (newModel: string) => {
        setModel(newModel);
        setDimensions(MODEL_CONFIG[provider][newModel]);
    };

    const handleSourceFieldToggle = (fieldHandle: string) => {
        setSourceFields((prev) =>
            prev.includes(fieldHandle)
                ? prev.filter((h) => h !== fieldHandle)
                : [...prev, fieldHandle]
        );
    };

    const handleMetadataFieldToggle = (fieldHandle: string) => {
        setMetadataFields((prev) =>
            prev.includes(fieldHandle)
                ? prev.filter((h) => h !== fieldHandle)
                : [...prev, fieldHandle]
        );
    };

    // Validation
    useEffect(() => {
        if (enabled) {
            if (!apiKeySecretId) {
                setValidationError('Please select an API key');
            } else if (sourceFields.length === 0) {
                setValidationError('Please select at least one source field');
            } else {
                setValidationError(null);
            }
        } else {
            setValidationError(null);
        }
    }, [enabled, apiKeySecretId, sourceFields]);

    // Show loading state while fetching section data
    if (loadingSection) {
        return (
            <div className="space-y-6">
                <div className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-zinc-900 p-4">
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                        Loading section data...
                    </Text>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Enable Toggle */}
            <div className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-zinc-900 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={handleEnableToggle}
                        className="mt-1 rounded border-gray-300 dark:border-gray-600"
                    />
                    <div className="flex-1">
                        <Text className="font-medium text-sm">Enable semantic/hybrid search for this section</Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            When enabled, records will be automatically vectorized and searchable by AI agents.
                        </Text>
                    </div>
                </label>
            </div>

            {/* Vectorization Stats (shown when enabled and stats available) */}
            {enabled && fullSection.vectorization_stats && (
                <div className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <Text className="font-medium text-blue-900 dark:text-blue-100">
                                Vector Search Active
                            </Text>
                            <Text className="text-xs text-blue-700 dark:text-blue-300">
                                {fullSection.vectorization_stats.provider} • {fullSection.vectorization_stats.model}
                            </Text>
                        </div>
                        <div className="text-right">
                            <Text className="font-bold text-blue-900 dark:text-blue-100">
                                {fullSection.vectorization_stats.vectorized_records || 0} / {fullSection.vectorization_stats.total_records}
                            </Text>
                            <Text className="text-xs text-blue-700 dark:text-blue-300">
                                {fullSection.vectorization_stats.vectorization_percentage || 0}% indexed
                            </Text>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${
                                (fullSection.vectorization_stats.vectorization_percentage || 0) >= 90
                                    ? 'bg-green-500'
                                    : (fullSection.vectorization_stats.vectorization_percentage || 0) >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                            }`}
                            style={{width: `${fullSection.vectorization_stats.vectorization_percentage || 0}%`}}
                        />
                    </div>
                </div>
            )}

            {/* Configuration (only shown when enabled) */}
            {enabled && (
                <>
                    {/* Validation Error */}
                    {validationError && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                            <Text className="text-sm text-red-800 dark:text-red-200">
                                {validationError}
                            </Text>
                        </div>
                    )}

                    {/* Embedding Provider */}
                    <div>
                        <Subheading>Embedding Provider</Subheading>
                        <div className="space-y-4 mt-4">
                            {/* Provider Selection */}
                            <div>
                                <label htmlFor="provider" className="block text-sm font-medium mb-1">
                                    Provider
                                </label>
                                <Select
                                    id="provider"
                                    value={provider}
                                    onChange={(e) => handleProviderChange(e.target.value as 'openai' | 'mistral')}
                                >
                                    <option value="openai">OpenAI</option>
                                    <option value="mistral">Mistral</option>
                                </Select>
                            </div>

                            {/* API Key Selection */}
                            <div>
                                <label htmlFor="api-key" className="block text-sm font-medium mb-1">
                                    API Key Secret
                                </label>
                                {loadingSecrets ? (
                                    <Text className="text-sm text-gray-500">Loading secrets...</Text>
                                ) : secrets.length === 0 ? (
                                    <div className="rounded-lg border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 p-4">
                                        <Text className="text-sm text-gray-600 dark:text-gray-400">
                                            No API key secrets found. Please create a secret in Project Settings.
                                        </Text>
                                    </div>
                                ) : (
                                    <Select
                                        id="api-key"
                                        value={apiKeySecretId}
                                        onChange={(e) => setApiKeySecretId(e.target.value)}
                                    >
                                        <option value="">Select secret...</option>
                                        {secrets.map((secret) => (
                                            <option key={secret.id} value={secret.id}>
                                                {secret.key}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            </div>

                            {/* Model Selection */}
                            <div>
                                <label htmlFor="model" className="block text-sm font-medium mb-1">
                                    Model
                                </label>
                                <Select
                                    id="model"
                                    value={model}
                                    onChange={(e) => handleModelChange(e.target.value)}
                                >
                                    {Object.keys(MODEL_CONFIG[provider]).map((modelName) => (
                                        <option key={modelName} value={modelName}>
                                            {modelName} ({MODEL_CONFIG[provider][modelName]} dims)
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            {/* Dimensions (read-only) */}
                            <div>
                                <label htmlFor="dimensions" className="block text-sm font-medium mb-1">
                                    Dimensions
                                </label>
                                <Input
                                    id="dimensions"
                                    type="number"
                                    value={dimensions}
                                    readOnly
                                    disabled
                                    className="bg-gray-50 dark:bg-zinc-800"
                                />
                                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Auto-set based on model
                                </Text>
                            </div>
                        </div>
                    </div>

                    {/* Source Fields */}
                    <div>
                        <Subheading>Source Fields (What to Embed)</Subheading>
                        <Text className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Select which fields to combine and vectorize:
                        </Text>

                        {textBasedFields.length === 0 ? (
                            <div className="mt-4 rounded-lg border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 p-4">
                                <Text className="text-sm text-gray-600 dark:text-gray-400">
                                    No embeddable fields available in this section. Add text, textarea, email, url, or json fields to enable vectorization.
                                </Text>
                            </div>
                        ) : (
                            <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-zinc-900">
                                {textBasedFields.map((field) => (
                                    <label
                                        key={field.handle}
                                        className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={sourceFields.includes(field.handle)}
                                            onChange={() => handleSourceFieldToggle(field.handle)}
                                            className="rounded border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                            {field.label}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            ({field.type})
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <Text className="text-xs text-gray-500 dark:text-gray-400">
                                    Text-based and JSON fields can be embedded (text, textarea, email, url, json)
                                </Text>
                            </div>
                            <div className="flex items-start gap-2 pl-6">
                                <Text className="text-xs text-gray-500 dark:text-gray-400">
                                    JSON fields will be stringified before embedding
                                </Text>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Fields */}
                    <div>
                        <Subheading>Metadata Fields (Searchable Attributes)</Subheading>
                        <Text className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Select fields to include as metadata for filtering:
                        </Text>

                        <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-zinc-900">
                            {allFieldsWithSystem.map((field) => (
                                <label
                                    key={field.handle}
                                    className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={metadataFields.includes(field.handle)}
                                        onChange={() => handleMetadataFieldToggle(field.handle)}
                                        className="rounded border-gray-300 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-900 dark:text-gray-100">
                                        {field.label}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        ({field.type})
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <Text className="text-xs text-gray-500 dark:text-gray-400">
                                Metadata is used for filtering search results
                            </Text>
                        </div>
                    </div>

                    {/* Search Settings */}
                    <div>
                        <Subheading>Search Settings</Subheading>

                        {/* Search Type */}
                        <div className="mt-4">
                            <Text className="text-sm font-medium mb-2">Search Type</Text>
                            <div className="space-y-2">
                                {(['hybrid', 'vector', 'keyword'] as const).map((type) => (
                                    <label key={type} className="flex items-start gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="search-type"
                                            value={type}
                                            checked={searchType === type}
                                            onChange={(e) => setSearchType(e.target.value as typeof searchType)}
                                            className="mt-0.5"
                                        />
                                        <div>
                                            <Text className="text-sm font-medium capitalize">{type}</Text>
                                            <Text className="text-xs text-gray-500 dark:text-gray-400">
                                                {type === 'hybrid' && 'Combines semantic + keyword search (best)'}
                                                {type === 'vector' && 'Pure semantic similarity search'}
                                                {type === 'keyword' && 'Full-text search only'}
                                            </Text>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Distance Metric */}
                        <div className="mt-4">
                            <Text className="text-sm font-medium mb-2">Distance Metric</Text>
                            <div className="space-y-2">
                                {([
                                    { value: 'cosine', label: 'Cosine', desc: 'Normalized similarity (recommended)' },
                                    { value: 'l2', label: 'L2', desc: 'Euclidean distance' },
                                    { value: 'max_inner_product', label: 'Inner Product', desc: 'Dot product similarity' },
                                ] as const).map((metric) => (
                                    <label key={metric.value} className="flex items-start gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="distance"
                                            value={metric.value}
                                            checked={distance === metric.value}
                                            onChange={(e) => setDistance(e.target.value as typeof distance)}
                                            className="mt-0.5"
                                        />
                                        <div>
                                            <Text className="text-sm font-medium">{metric.label}</Text>
                                            <Text className="text-xs text-gray-500 dark:text-gray-400">
                                                {metric.desc}
                                            </Text>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <Text className="text-sm font-medium text-sky-900 dark:text-sky-100">
                                    After enabling vectorization:
                                </Text>
                                <ul className="mt-2 space-y-1 text-xs text-sky-800 dark:text-sky-200">
                                    <li>• New/updated records are automatically vectorized</li>
                                    <li>• Embeddings stored in separate table</li>
                                    <li>• Searchable by Agno AI agents</li>
                                    <li>• Use Section Vector Search nodes in workflows</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Disable Confirmation Alert */}
            <Alert open={showDisableAlert} onClose={() => setShowDisableAlert(false)}>
                <AlertTitle>Disable Vectorization?</AlertTitle>
                <AlertDescription>
                    Existing embeddings will be preserved but new records won&apos;t be vectorized.
                </AlertDescription>
                <AlertActions>
                    <Button plain onClick={() => setShowDisableAlert(false)}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDisableConfirm}>
                        Disable
                    </Button>
                </AlertActions>
            </Alert>
        </div>
    );
};

export default VectorizationTab;
