"use client";

import React, {useEffect, useState} from "react";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Text} from "@/components/text";
import useEditorStore from "@/stores/editorStore";
import useSchedulesStore from "@/stores/schedulesStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {CalendarDateRangeIcon, XMarkIcon} from "@heroicons/react/24/outline";
import {Switch} from "@/components/switch";
import {Input} from "@/components/input";
import {Button} from "@/components/button";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {FormType, Schedule} from "@/types/types";
import {useParams, useRouter} from "next/navigation";
import cronstrue from "cronstrue";

const ScheduleForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);
    const setActiveScheduleId = useEditorStore((state) => state.setActiveScheduleId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    const getSchedule = useSchedulesStore((state) => state.getSchedule);
    const storeSchedule = useSchedulesStore((state) => state.storeSchedule);
    const updateSchedule = useSchedulesStore((state) => state.updateSchedule);
    const deleteSchedule = useSchedulesStore((state) => state.deleteSchedule);

    const params = useParams();
    const router = useRouter();

    const [name, setName] = useState("");
    const [cronExpression, setCronExpression] = useState("0 0 * * *");
    const [start_time, setStartTime] = useState<Date | null>(new Date());
    const [end_time, setEndTime] = useState<Date | null>(null);
    const [is_active, setIsActive] = useState(true);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        if (formType === FormType.EditSchedule && formEditRecordId) {
            const schedule = getSchedule(formEditRecordId as string);
            if (schedule) {
                setName(schedule.name);
                setCronExpression(schedule.cron_expression || "");
                setStartTime(schedule.start_time ? new Date(schedule.start_time) : null);
                setEndTime(schedule.end_time ? new Date(schedule.end_time) : null);
                setIsActive(schedule.is_active);
            }
        }
    }, [formEditRecordId, formType, getSchedule]);

    const validateForm = () => {
        const newErrors: string[] = [];
        if (!cronExpression || cronExpression.trim() === "") {
            newErrors.push("Cron expression is required.");
        }
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        if (!start_time) return;
        if (!validateForm()) return;

        // Set loading state for new schedules
        if (formType === FormType.AddSchedule) {
            useEditorStore.getState().setIsLoadingFlow(true);
        }

        const payload: Schedule = {
            id: formEditRecordId as string ?? undefined,
            name,
            cron_expression: cronExpression,
            start_time,
            end_time,
            is_active,
        };

        const action = formType === FormType.AddSchedule ? storeSchedule : updateSchedule;
        const result = await action(payload);

        if (result) {
            closeForm(`${formType === FormType.AddSchedule ? "Created" : "Updated"} successfully`);
            setActiveScheduleId(result.id as string);
            setIsExecuting("Loading Schedule");
            router.push(`/project/${params.projectUuid}/schedule/${result.id || formEditRecordId}`);

            // Clear executing state after navigation completes
            setTimeout(() => setIsExecuting(null), 100);
        }
    };

    const handleDelete = async () => {
        await deleteSchedule(activeProjectId, formEditRecordId as string);
        setActiveScheduleId('');
        closeForm("Schedule deleted");
        setShowDeleteAlert(false);
        setIsExecuting("Deleting Schedule");
        router.push(`/project/${params.projectUuid}`);

        // Clear executing state after navigation completes
        setTimeout(() => setIsExecuting(null), 100);
    };

    return (
        <form onSubmit={handleSubmit} className="p-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <Heading>{formType === FormType.AddSchedule ? "Add" : "Edit"} Schedule</Heading>
                <Button type="button" onClick={() => closeForm()} color="sky">
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
            </div>
            <Divider className="my-4" soft bleed/>

            {errors.length > 0 && (
                <div className="text-red-500 mb-4">
                    {errors.map((error, idx) => (
                        <p key={idx}>{error}</p>
                    ))}
                </div>
            )}

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Name</Subheading>
                    <Text>Give a meaningful, descriptive name</Text>
                </div>
                <div>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Cron expression</Subheading>
                    <Text>Provide a 6-part AWS cron expression</Text>
                </div>
                <div>
                    <Input
                        value={cronExpression}
                        onChange={(e) => setCronExpression(e.target.value)}
                        placeholder="0 0 * * *"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                        {cronExpression ? cronstrue.toString(cronExpression, { throwExceptionOnParseError: false }) : ""}
                    </p>
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Start time</Subheading>
                    <Text>This cron should run from this time</Text>
                </div>
                <div>
                    <CalendarDateRangeIcon className="w-6 h-6 inline-block mr-2 text-zinc-500 dark:text-white/50" />
                    <DatePicker
                        selected={start_time}
                        onChange={(date) => setStartTime(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        className="w-full border border-zinc-300 p-2 rounded-md"
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>End time</Subheading>
                    <Text>This cron should run until this time</Text>
                </div>
                <div>
                    <CalendarDateRangeIcon className="w-6 h-6 inline-block mr-2 text-zinc-500 dark:text-white/50" />
                    <DatePicker
                        selected={end_time}
                        onChange={(date) => setEndTime(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        className="w-full border border-zinc-300 p-2 rounded-md"
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Active</Subheading>
                    <Text>Is this schedule currently enabled?</Text>
                </div>
                <div>
                    <Switch checked={is_active} onChange={() => setIsActive(!is_active)} />
                </div>
            </section>

            <Divider className="my-10" soft bleed />

            {formType === FormType.EditSchedule && (
                <>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Delete schedule</Subheading>
                            <Text>This action is permanent</Text>
                        </div>
                        <div className="flex justify-end self-center">
                            <Button color="red" type="button" onClick={() => setShowDeleteAlert(true)}>
                                Delete
                            </Button>
                        </div>
                    </section>
                    <Divider className="my-10" soft bleed />
                </>
            )}

            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => closeForm()} plain>
                    Cancel
                </Button>
                <Button type="submit">
                    {formType === FormType.AddSchedule ? "Create schedule" : "Update schedule"}
                </Button>
            </div>

            {showDeleteAlert && (
                <Alert open={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
                    <AlertTitle>Are you sure?</AlertTitle>
                    <AlertDescription>This schedule will be removed.</AlertDescription>
                    <AlertActions>
                        <Button plain onClick={() => setShowDeleteAlert(false)}>Cancel</Button>
                        <Button color="red" onClick={handleDelete}>Delete</Button>
                    </AlertActions>
                </Alert>
            )}
        </form>
    );
};

export default ScheduleForm;