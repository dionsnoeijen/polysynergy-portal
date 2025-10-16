import React, {useCallback, useEffect, useState} from 'react';
import useEditorStore from "@/stores/editorStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useEditorTabsStore from "@/stores/editorTabsStore";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Text} from "@/components/text";
import {Input} from "@/components/input";
import {Textarea} from "@/components/textarea";
import {Button} from "@/components/button";
import {FormType, HttpMethod, Route, RouteSegment, RouteSegmentType} from "@/types/types";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/table";
import {ArrowDownIcon, ArrowUpIcon, MinusCircleIcon, XMarkIcon} from "@heroicons/react/24/outline";
import {Select} from "@/components/select";
import {Checkbox, CheckboxField} from "@/components/checkbox";
import {formatSegments} from "@/utils/formatters";
import {Alert, AlertActions, AlertDescription, AlertTitle} from '@/components/alert';
import {useRouter, useParams} from 'next/navigation';
import useStagesStore from "@/stores/stagesStore";

const DynamicRouteForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const stages = useStagesStore((state) => state.stages);

    const getDynamicRoute = useDynamicRoutesStore((state) => state.getDynamicRoute);
    const storeDynamicRoute = useDynamicRoutesStore((state) => state.storeDynamicRoute);
    const updateDynamicRoute = useDynamicRoutesStore((state) => state.updateDynamicRoute);
    const deleteDynamicRoute = useDynamicRoutesStore((state) => state.deleteDynamicRoute);

    const params = useParams();
    const router = useRouter();

    const [description, setDescription] = useState('');
    const [method, setMethod] = useState<HttpMethod>(HttpMethod.Get);
    const [segments, setSegments] = useState<RouteSegment[]>([]);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (formType === FormType.EditRoute && formEditRecordId) {
            const route = getDynamicRoute(formEditRecordId as string);
            if (route) {
                setDescription(route.description);
                setMethod(route.method);
                setSegments(route.segments);
            }
        }
    }, [formEditRecordId, formType, getDynamicRoute]);

    const addSegment = () => {
        const newSegment: RouteSegment = {
            id: String(Math.random()),
            segment_order: segments.length,
            type: RouteSegmentType.Static,
            name: '',
            default_value: null,
            variable_type: null,
        };
        setSegments([...segments, newSegment]);
    };

    const moveSegmentUp = (index: number) => {
        if (index > 0) {
            const newSegments = [...segments];
            [newSegments[index - 1], newSegments[index]] = [newSegments[index], newSegments[index - 1]];
            const updatedSegments = newSegments.map((segment, i) => ({
                ...segment,
                segment_order: i,
            }));

            setSegments(updatedSegments);
        }
    };

    const removeSegment = (index: number) => {
        const newSegments = segments.filter((_, i) => i !== index);
        const updatedSegments = newSegments.map((segment, i) => ({
            ...segment,
            segment_order: i,
        }));
        setSegments(updatedSegments);
    };

    const moveSegmentDown = (index: number) => {
        if (index < segments.length - 1) {
            const newSegments = [...segments];
            [newSegments[index], newSegments[index + 1]] = [newSegments[index + 1], newSegments[index]];
            const updatedSegments = newSegments.map((segment, i) => ({
                ...segment,
                segment_order: i,
            }));
            setSegments(updatedSegments);
        }
    };

    const toggleSegmentType = (index: number) => {
        setSegments((prevSegments) =>
            prevSegments.map((segment, i) =>
                i === index
                    ? {
                        ...segment,
                        type: segment.type === RouteSegmentType.Static ? RouteSegmentType.Variable : RouteSegmentType.Static,
                        variable_type: segment.type === RouteSegmentType.Static ? 'string' : null,
                    }
                    : segment
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (formType === FormType.AddRoute) {
                // Set loading state before creation
                useEditorStore.getState().setIsLoadingFlow(true);

                const newRoute: Route = {
                    description,
                    segments,
                    method,
                };
                const createdRoute: Route | undefined = await storeDynamicRoute(newRoute);

                if (createdRoute && createdRoute.id) {
                    closeForm('Route created successfully');
                    router.push(`/project/${params.projectUuid}/route/${createdRoute.id}`);
                }
            }

            if (formType === FormType.EditRoute && formEditRecordId) {
                const updatedRoute: Route = {
                    id: formEditRecordId as string,
                    description,
                    segments,
                    method,
                };
                await updateDynamicRoute(updatedRoute);
                closeForm('Route updated successfully');
            }
        } catch (error) {
            // Clear loading state on error
            useEditorStore.getState().setIsLoadingFlow(false);
            setErrorMessage((error as Error).message);
        }
    };

    const handleDelete = useCallback(async () => {
        await deleteDynamicRoute(formEditRecordId as string);

        // Close the tab for this route
        const tab = useEditorTabsStore.getState().getTabByFundamentalId(
            params.projectUuid as string,
            formEditRecordId as string
        );
        if (tab) {
            useEditorTabsStore.getState().removeTab(params.projectUuid as string, tab.id);
        }

        closeForm('Route deleted successfully');
        setShowDeleteAlert(false);
        router.push(`/project/${params.projectUuid}`);
    }, [formEditRecordId, deleteDynamicRoute, closeForm, router, params.projectUuid]);

    useEffect(() => {
        if (!showDeleteAlert) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                handleDelete();
            }
            if (event.key === "Escape") {
                setShowDeleteAlert(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showDeleteAlert, handleDelete, setShowDeleteAlert]);

    const basePath = `https://${activeProjectId}{{stage}}`;

    return (
        <form onSubmit={handleSubmit} method={'post'} className={'p-10'}>
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>{formType === FormType.AddRoute ? 'Add ' : 'Edit '}Route</Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>
            <Divider className="my-4" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Description</Subheading>
                    <Text>This is optional, but it might be useful if you want to provide information</Text>
                </div>
                <div>
                    <Textarea
                        aria-label="Description"
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Method</Subheading>
                    <Text>HTTP Method for the route</Text>
                </div>
                <div>
                    <Select
                        aria-label="Method"
                        name="method"
                        value={method}
                        onChange={(e) => setMethod(e.target.value as HttpMethod)}
                    >
                        <option value={HttpMethod.Get}>GET</option>
                        <option value={HttpMethod.Post}>POST</option>
                        <option value={HttpMethod.Put}>PUT</option>
                        <option value={HttpMethod.Patch}>PATCH</option>
                        <option value={HttpMethod.Delete}>DELETE</option>
                    </Select>
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-1">
                <div className="space-y-1">
                    <Subheading>URL Segments</Subheading>
                    <div className="space-y-1">
                        {stages.map((stage) => {
                            const isProd = stage.is_production;
                            const stagePrefix = isProd ? '' : `-${stage.name}`;
                            const fullUrl = `${basePath.replace('{{stage}}', stagePrefix)}.polysynergy.com/${formatSegments(segments)}`;

                            return (
                                <div key={stage.name} className="flex items-start gap-2">
                                    <span className="w-24 shrink-0 font-semibold text-sky-600 dark:text-white">
                                        {stage.name}
                                    </span>
                                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                    <span className="uppercase font-medium">{method}</span>: {fullUrl}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]" dense bleed
                           grid>
                        <TableHead>
                            <TableRow>
                                <TableHeader></TableHeader>
                                <TableHeader>Order</TableHeader>
                                <TableHeader>Name</TableHeader>
                                <TableHeader>Variable</TableHeader>
                                <TableHeader>Validation</TableHeader>
                                <TableHeader>Default Value</TableHeader>
                                <TableHeader className="text-right">Actions</TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {segments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-gray-500">
                                        Click {'"'}Add Segment{'"'} to configure your URL
                                    </TableCell>
                                </TableRow>
                            ) : (
                                segments.map((segment, index) => (
                                    <TableRow key={segment.id} title={`Segment #${index}`}>
                                        <TableCell>
                                            {index > 0 && (
                                                <button type="button" onClick={() => moveSegmentUp(index)}>
                                                    <ArrowUpIcon className="w-4 h-4"/>
                                                </button>
                                            )}
                                            {index < segments.length - 1 && (
                                                <button type="button" onClick={() => moveSegmentDown(index)}>
                                                    <ArrowDownIcon className="w-4 h-4"/>
                                                </button>
                                            )}
                                        </TableCell>
                                        <TableCell>{segment.segment_order}</TableCell>
                                        <TableCell className="text-zinc-500">
                                            <Input
                                                value={segment.name}
                                                onChange={(e) => {
                                                    const inputValue = e.target.value;
                                                    const validValue = inputValue.replace(/[^a-z0-9-_]/g, '');
                                                    const updatedSegment = {...segment, name: validValue};
                                                    const updatedSegments = [...segments];
                                                    updatedSegments[index] = updatedSegment;
                                                    setSegments(updatedSegments);
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell className="text-zinc-500">
                                            <CheckboxField>
                                                <Checkbox
                                                    name="type"
                                                    checked={segment.type === RouteSegmentType.Variable}
                                                    onChange={() => toggleSegmentType(index)}
                                                />
                                            </CheckboxField>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Select
                                                aria-label="Variable type"
                                                name="variable_type"
                                                value={segment.variable_type || "string"}
                                                disabled={segment.type === RouteSegmentType.Static}
                                                onChange={(e) => {
                                                    const updatedSegment = {
                                                        ...segment,
                                                        variable_type: e.target.value,
                                                    };
                                                    const updatedSegments = [...segments];
                                                    updatedSegments[index] = updatedSegment;
                                                    setSegments(updatedSegments);
                                                }}
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Input
                                                type={segment.variable_type === 'number' ? 'number' : 'text'}
                                                value={segment.default_value || ''}
                                                disabled={segment.type === RouteSegmentType.Static}
                                                onChange={(e) => {
                                                    const updatedSegment = {
                                                        ...segment,
                                                        default_value: e.target.value,
                                                    };
                                                    const updatedSegments = [...segments];
                                                    updatedSegments[index] = updatedSegment;
                                                    setSegments(updatedSegments);
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button type="button" plain onClick={() => removeSegment(index)}>
                                                <MinusCircleIcon className="w-4 h-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex justify-end mt-2">
                        <Button type="button" plain onClick={addSegment}>Add Segment</Button>
                    </div>
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            {formType === FormType.EditRoute && (
                <>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Delete</Subheading>
                            <Text>After deletion, the route is recoverable through versions</Text>
                        </div>
                        <div className="flex justify-end self-center">
                            <Button color="red" type="button" onClick={() => setShowDeleteAlert(true)}>
                                Delete route
                            </Button>
                        </div>
                    </section>
                    <Divider className="my-10" soft bleed/>
                </>
            )}

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button color={'sky'} type="submit">
                    {formType === FormType.AddRoute ? 'Create route' : 'Update route'}
                </Button>
            </div>

            {showDeleteAlert && (
                <Alert size="md" className="text-center" open={showDeleteAlert}
                       onClose={() => setShowDeleteAlert(false)}>
                    <AlertTitle>Are you sure you want to delete this route?</AlertTitle>
                    <AlertDescription>This action cannot be undone.</AlertDescription>
                    <AlertActions>
                        <Button onClick={() => setShowDeleteAlert(false)} plain>
                            Cancel
                        </Button>
                        <Button color="red" onClick={handleDelete}>
                            Yes, delete
                        </Button>
                    </AlertActions>
                </Alert>
            )}

            {errorMessage && (
                <Alert size="md" className="text-center" open={true} onClose={() => setErrorMessage(null)}>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                    <AlertActions>
                        <Button onClick={() => setErrorMessage(null)} plain>Close</Button>
                    </AlertActions>
                </Alert>
            )}
        </form>
    );
};

export default DynamicRouteForm;
