import React, {useEffect, useState} from "react";
import useEditorStore from "@/stores/editorStore";
import useBlueprintsStore from "@/stores/blueprintsStore";
import useServicesStore from "@/stores/servicesStore";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {Text} from "@/components/text";
import {Input} from "@/components/input";
import {Textarea} from "@/components/textarea";
import {Checkbox, CheckboxField} from "@/components/checkbox";
import {XMarkIcon, ArrowDownTrayIcon} from "@heroicons/react/24/outline";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {exportPackage, ExportItem} from "@/api/packageApi";

const ExportSharingForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    
    const blueprints = useBlueprintsStore((state) => state.blueprints);
    const services = useServicesStore((state) => state.services);
    const fetchBlueprints = useBlueprintsStore((state) => state.fetchBlueprints);
    const fetchServices = useServicesStore((state) => state.fetchServices);
    const blueprintsInitialFetched = useBlueprintsStore((state) => state.hasInitialFetched);
    const servicesInitialFetched = useServicesStore((state) => state.hasInitialFetched);

    const [exportName, setExportName] = useState("");
    const [exportDescription, setExportDescription] = useState("");
    const [selectedBlueprints, setSelectedBlueprints] = useState<Set<string>>(new Set());
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (!blueprintsInitialFetched) {
            fetchBlueprints();
        }
        if (!servicesInitialFetched) {
            fetchServices();
        }
    }, [blueprintsInitialFetched, servicesInitialFetched, fetchBlueprints, fetchServices]);

    const handleBlueprintToggle = (blueprintId: string) => {
        setSelectedBlueprints(prev => {
            const newSet = new Set(prev);
            if (newSet.has(blueprintId)) {
                newSet.delete(blueprintId);
            } else {
                newSet.add(blueprintId);
            }
            return newSet;
        });
    };

    const handleServiceToggle = (serviceId: string) => {
        setSelectedServices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(serviceId)) {
                newSet.delete(serviceId);
            } else {
                newSet.add(serviceId);
            }
            return newSet;
        });
    };

    const handleSelectAllBlueprints = () => {
        if (selectedBlueprints.size === blueprints.length) {
            setSelectedBlueprints(new Set());
        } else {
            setSelectedBlueprints(new Set(blueprints.map(bp => bp.id!)));
        }
    };

    const handleSelectAllServices = () => {
        if (selectedServices.size === services.length) {
            setSelectedServices(new Set());
        } else {
            setSelectedServices(new Set(services.map(service => service.id!)));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedBlueprints.size === 0 && selectedServices.size === 0) {
            alert("Please select at least one blueprint or service to export.");
            return;
        }

        setIsExporting(true);

        try {
            const { activeProjectId } = useEditorStore.getState();

            if (!activeProjectId) {
                alert("No active project selected.");
                return;
            }

            // Build export items array
            const items: ExportItem[] = [
                ...Array.from(selectedBlueprints).map(id => ({
                    item_type: "blueprint" as const,
                    item_id: id
                })),
                ...Array.from(selectedServices).map(id => ({
                    item_type: "service" as const,
                    item_id: id
                }))
            ];

            // Call export API
            const blob = await exportPackage(activeProjectId, {
                items,
                export_name: exportName || undefined
            });

            // Trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exportName || 'PolySynergy_Export'}.psy`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            closeForm("Export package created successfully");
        } catch (error) {
            console.error("Export failed:", error);
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsExporting(false);
        }
    };

    const totalSelected = selectedBlueprints.size + selectedServices.size;

    return (
        <form onSubmit={handleSubmit} method={'post'} className={'p-10'}>
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>Export Sharing Package</Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>
            <Divider className="my-4" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Package Name</Subheading>
                    <Text>Give your export package a descriptive name</Text>
                </div>
                <div>
                    <Input
                        value={exportName}
                        onChange={(e) => setExportName(e.target.value)}
                        placeholder="My Automation Package"
                        required
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Description</Subheading>
                    <Text>Optional description of what this package contains</Text>
                </div>
                <div>
                    <Textarea
                        value={exportDescription}
                        onChange={(e) => setExportDescription(e.target.value)}
                        placeholder="This package contains workflows for..."
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <section className="space-y-6">
                <div className="space-y-1">
                    <Subheading>Select Blueprints to Export</Subheading>
                    <Text>Choose which blueprints to include in your sharing package</Text>
                </div>
                
                {blueprints.length > 0 ? (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <Text className="font-medium">
                                {selectedBlueprints.size} of {blueprints.length} blueprints selected
                            </Text>
                            <Button 
                                type="button" 
                                plain 
                                onClick={handleSelectAllBlueprints}
                            >
                                {selectedBlueprints.size === blueprints.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>
                        
                        <Table className="[--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]" dense bleed>
                            <TableHead>
                                <TableRow>
                                    <TableHeader></TableHeader>
                                    <TableHeader>Name</TableHeader>
                                    <TableHeader>Category</TableHeader>
                                    <TableHeader>Description</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {blueprints.map((blueprint) => (
                                    <TableRow key={blueprint.id}>
                                        <TableCell>
                                            <CheckboxField>
                                                <Checkbox
                                                    checked={selectedBlueprints.has(blueprint.id!)}
                                                    onChange={() => handleBlueprintToggle(blueprint.id!)}
                                                />
                                            </CheckboxField>
                                        </TableCell>
                                        <TableCell className="font-medium">{blueprint.name}</TableCell>
                                        <TableCell className="text-zinc-500">{blueprint.meta?.category}</TableCell>
                                        <TableCell className="text-zinc-500">{blueprint.meta?.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <Text className="text-zinc-500">No blueprints available in this project.</Text>
                )}
            </section>

            <Divider className="my-10" soft bleed/>

            <section className="space-y-6">
                <div className="space-y-1">
                    <Subheading>Select Services to Export</Subheading>
                    <Text>Choose which services to include in your sharing package</Text>
                </div>
                
                {services.length > 0 ? (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <Text className="font-medium">
                                {selectedServices.size} of {services.length} services selected
                            </Text>
                            <Button 
                                type="button" 
                                plain 
                                onClick={handleSelectAllServices}
                            >
                                {selectedServices.size === services.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>
                        
                        <Table className="[--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]" dense bleed>
                            <TableHead>
                                <TableRow>
                                    <TableHeader></TableHeader>
                                    <TableHeader>Name</TableHeader>
                                    <TableHeader>Category</TableHeader>
                                    <TableHeader>Description</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {services.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell>
                                            <CheckboxField>
                                                <Checkbox
                                                    checked={selectedServices.has(service.id!)}
                                                    onChange={() => handleServiceToggle(service.id!)}
                                                />
                                            </CheckboxField>
                                        </TableCell>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell className="text-zinc-500">{service.meta?.category}</TableCell>
                                        <TableCell className="text-zinc-500">{service.meta?.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <Text className="text-zinc-500">No services available in this project.</Text>
                )}
            </section>

            <Divider className="my-10" soft bleed/>

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    color="sky" 
                    disabled={totalSelected === 0 || isExporting}
                >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2"/>
                    {isExporting ? 'Creating Package...' : `Export ${totalSelected} Item${totalSelected !== 1 ? 's' : ''}`}
                </Button>
            </div>
        </form>
    );
};

export default ExportSharingForm;