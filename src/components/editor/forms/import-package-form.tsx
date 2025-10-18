import React, {useState} from "react";
import useEditorStore from "@/stores/editorStore";
import useBlueprintsStore from "@/stores/blueprintsStore";
import useServicesStore from "@/stores/servicesStore";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {Text} from "@/components/text";
import {XMarkIcon, ArrowUpTrayIcon, CheckCircleIcon, ExclamationTriangleIcon} from "@heroicons/react/24/outline";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {Badge} from "@/components/badge";
import {Input} from "@/components/input";
import {
    previewImport,
    confirmImport,
    ImportPreviewResponse,
    ImportItemConflict,
    ImportItemResolution,
    ImportResult
} from "@/api/packageApi";

type ImportStep = 'upload' | 'preview' | 'result';

const ImportPackageForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const fetchBlueprints = useBlueprintsStore((state) => state.fetchBlueprints);
    const fetchServices = useServicesStore((state) => state.fetchServices);

    const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
    const [resolutions, setResolutions] = useState<Map<string, ImportItemResolution>>(new Map());
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.psy')) {
                alert('Please select a .psy file');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handlePreview = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        try {
            const {activeProjectId} = useEditorStore.getState();
            if (!activeProjectId) {
                alert("No active project selected.");
                return;
            }

            const preview = await previewImport(activeProjectId, selectedFile);
            setPreviewData(preview);

            // Initialize resolutions for conflicts
            const initialResolutions = new Map<string, ImportItemResolution>();
            preview.conflicts.forEach(conflict => {
                const key = `${conflict.item_type}-${conflict.item_name}`;
                initialResolutions.set(key, {
                    item_type: conflict.item_type,
                    item_name: conflict.item_name,
                    resolution: conflict.conflict_type === 'exact_duplicate' ? 'skip' : 'skip',
                    new_name: undefined
                });
            });
            setResolutions(initialResolutions);

            setCurrentStep('preview');
        } catch (error) {
            console.error("Preview failed:", error);
            alert(`Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolutionChange = (conflict: ImportItemConflict, resolution: 'overwrite' | 'rename' | 'skip') => {
        const key = `${conflict.item_type}-${conflict.item_name}`;
        setResolutions(prev => {
            const newMap = new Map(prev);
            newMap.set(key, {
                item_type: conflict.item_type,
                item_name: conflict.item_name,
                resolution,
                new_name: resolution === 'rename' ? conflict.suggested_names[0] : undefined
            });
            return newMap;
        });
    };

    const handleRenameChange = (conflict: ImportItemConflict, newName: string) => {
        const key = `${conflict.item_type}-${conflict.item_name}`;
        setResolutions(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(key);
            if (existing) {
                newMap.set(key, {...existing, new_name: newName});
            }
            return newMap;
        });
    };

    const handleConfirmImport = async () => {
        if (!previewData) return;

        setIsLoading(true);
        try {
            const {activeProjectId} = useEditorStore.getState();
            if (!activeProjectId) {
                alert("No active project selected.");
                return;
            }

            const result = await confirmImport(activeProjectId, {
                resolutions: Array.from(resolutions.values()),
                file_content: previewData.file_content_b64,
                import_details: previewData.items
            });

            setImportResult(result);
            setCurrentStep('result');

            // Refresh blueprints and services
            if (result.total_successful > 0) {
                await fetchBlueprints();
                await fetchServices();
            }
        } catch (error) {
            console.error("Import failed:", error);
            alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderUploadStep = () => (
        <>
            <section className="space-y-6">
                <div className="space-y-1">
                    <Subheading>Select Package File</Subheading>
                    <Text>Choose a .psy file to import blueprints and services</Text>
                </div>

                <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center">
                    <input
                        type="file"
                        accept=".psy"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                    />
                    <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                    >
                        <ArrowUpTrayIcon className="w-12 h-12 text-zinc-400"/>
                        <Text className="font-medium">Click to select a .psy file</Text>
                        {selectedFile && (
                            <Text className="text-sm text-zinc-500">{selectedFile.name}</Text>
                        )}
                    </label>
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button
                    type="button"
                    color="sky"
                    disabled={!selectedFile || isLoading}
                    onClick={handlePreview}
                >
                    {isLoading ? 'Analyzing...' : 'Continue'}
                </Button>
            </div>
        </>
    );

    const renderPreviewStep = () => {
        if (!previewData) return null;

        const hasConflicts = previewData.conflicts.length > 0;

        return (
            <>
                <section className="space-y-6">
                    <div className="space-y-1">
                        <Subheading>Package Contents</Subheading>
                        <Text>
                            {(typeof previewData.export_info.export_name === 'string' ? previewData.export_info.export_name : 'Unnamed Package')} - {previewData.items.length} items
                        </Text>
                    </div>

                    {previewData.warnings.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0"/>
                                <div>
                                    <Text className="font-medium text-yellow-800 dark:text-yellow-200">Warnings</Text>
                                    {previewData.warnings.map((warning, idx) => (
                                        <Text key={idx} className="text-sm text-yellow-700 dark:text-yellow-300">{warning}</Text>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {hasConflicts && (
                    <>
                        <Divider className="my-10" soft bleed/>
                        <section className="space-y-6">
                            <div className="space-y-1">
                                <Subheading>Conflicts Detected</Subheading>
                                <Text>Choose how to handle items that already exist</Text>
                            </div>

                            <Table className="[--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]" dense bleed>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader>Type</TableHeader>
                                        <TableHeader>Name</TableHeader>
                                        <TableHeader>Conflict</TableHeader>
                                        <TableHeader>Action</TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewData.conflicts.map((conflict, idx) => {
                                        const key = `${conflict.item_type}-${conflict.item_name}`;
                                        const resolution = resolutions.get(key);

                                        return (
                                            <TableRow key={idx}>
                                                <TableCell>
                                                    <Badge color={conflict.item_type === 'blueprint' ? 'blue' : 'green'}>
                                                        {conflict.item_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{conflict.item_name}</TableCell>
                                                <TableCell>
                                                    <Badge color={conflict.conflict_type === 'exact_duplicate' ? 'zinc' : 'amber'}>
                                                        {conflict.conflict_type === 'exact_duplicate' ? 'Exact Duplicate' : 'Name Exists'}
                                                    </Badge>
                                                    <Text className="text-xs text-zinc-500 mt-1">{conflict.description}</Text>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-2">
                                                        <select
                                                            className="block w-full rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                                            value={resolution?.resolution || 'skip'}
                                                            onChange={(e) => handleResolutionChange(conflict, e.target.value as 'overwrite' | 'rename' | 'skip')}
                                                        >
                                                            <option value="skip">Skip</option>
                                                            {conflict.conflict_type !== 'exact_duplicate' && (
                                                                <>
                                                                    <option value="overwrite">Overwrite Existing</option>
                                                                    <option value="rename">Rename New Item</option>
                                                                </>
                                                            )}
                                                        </select>

                                                        {resolution?.resolution === 'rename' && (
                                                            <Input
                                                                value={resolution.new_name || ''}
                                                                onChange={(e) => handleRenameChange(conflict, e.target.value)}
                                                                placeholder="Enter new name"
                                                            />
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </section>
                    </>
                )}

                <Divider className="my-10" soft bleed/>

                <div className="flex justify-end gap-4">
                    <Button type="button" onClick={() => setCurrentStep('upload')} plain>
                        Back
                    </Button>
                    <Button
                        type="button"
                        color="sky"
                        disabled={isLoading}
                        onClick={handleConfirmImport}
                    >
                        {isLoading ? 'Importing...' : 'Import Package'}
                    </Button>
                </div>
            </>
        );
    };

    const renderResultStep = () => {
        if (!importResult) return null;

        return (
            <>
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        {importResult.success ? (
                            <CheckCircleIcon className="w-8 h-8 text-green-600"/>
                        ) : (
                            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600"/>
                        )}
                        <div>
                            <Subheading>{importResult.message}</Subheading>
                            <Text className="text-sm">
                                {importResult.total_successful} imported, {importResult.total_skipped} skipped, {importResult.total_failed} failed
                            </Text>
                        </div>
                    </div>

                    <Table className="[--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]" dense bleed>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Type</TableHeader>
                                <TableHeader>Name</TableHeader>
                                <TableHeader>Status</TableHeader>
                                <TableHeader>Message</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {importResult.items.map((item, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>
                                        <Badge color={item.item_type === 'blueprint' ? 'blue' : 'green'}>
                                            {item.item_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{item.final_name}</TableCell>
                                    <TableCell>
                                        <Badge
                                            color={
                                                item.status === 'created' ? 'green' :
                                                    item.status === 'updated' ? 'blue' :
                                                        item.status === 'skipped' ? 'zinc' : 'red'
                                            }
                                        >
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-zinc-500">{item.message}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </section>

                <Divider className="my-10" soft bleed/>

                <div className="flex justify-end">
                    <Button type="button" color="sky" onClick={() => closeForm()}>
                        Done
                    </Button>
                </div>
            </>
        );
    };

    return (
        <div className="p-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>Import Package</Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>
            <Divider className="my-4" soft bleed/>

            {currentStep === 'upload' && renderUploadStep()}
            {currentStep === 'preview' && renderPreviewStep()}
            {currentStep === 'result' && renderResultStep()}
        </div>
    );
};

export default ImportPackageForm;
