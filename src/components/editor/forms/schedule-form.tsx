import React, {useEffect, useState} from "react";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Text} from "@/components/text";
import useEditorStore from "@/stores/editorStore";
import useSchedulesStore from "@/stores/schedulesStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {CalendarDateRangeIcon} from "@heroicons/react/24/outline";
import {Switch} from "@/components/switch";
import {Fieldset} from "@/components/fieldset";
import {CronField} from '@/components/editor/forms/cron/cron-field';
import {Input} from "@/components/input";
import {Button} from "@/components/button";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {FormType, Schedule} from "@/types/types";
import {useParams, useRouter} from "next/navigation";

const dayOfWeekLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ScheduleForm: React.FC = () => {
    const closeForm = useEditorStore((state) => state.closeForm);
    const formType = useEditorStore((state) => state.formType);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const getSchedule = useSchedulesStore((state) => state.getSchedule);
    const storeSchedule = useSchedulesStore((state) => state.storeSchedule);
    const updateSchedule = useSchedulesStore((state) => state.updateSchedule);
    const deleteSchedule = useSchedulesStore((state) => state.deleteSchedule);

    const params = useParams();
    const router = useRouter();

    const [name, setName] = useState("");
    const [start_time, setStartTime] = useState<Date | null>(new Date());
    const [end_time, setEndTime] = useState<Date | null>(null);
    const [is_active, setIsActive] = useState(true);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const [minutePart, setMinutePart] = useState("*");
    const [hourPart, setHourPart] = useState("*");
    const [dayOfMonthPart, setDayOfMonthPart] = useState("*");
    const [monthPart, setMonthPart] = useState("*");
    const [dayOfWeekPart, setDayOfWeekPart] = useState("*");

    const [errors, setErrors] = useState<string[]>([]);

    function generateCronExpression() {
        return `${minutePart} ${hourPart} ${dayOfMonthPart} ${monthPart} ${dayOfWeekPart}`;
    }

    const cronExpression = generateCronExpression();

    function interpretCron(
        minute: string,
        hour: string,
        dom: string,
        mo: string,
        dow: string
    ): string {
        function interpretPart(part: string, label: string, isDayOfWeek = false) {
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

            if (part.match(/^(\d+)-(\d+)\/(\d+)$/)) {
                // eslint-disable-next-line
                const [_, start, end, step] = part.match(/^(\d+)-(\d+)\/(\d+)$/)!;
                if (isDayOfWeek) {
                    return `from ${days[parseInt(start)]} to ${days[parseInt(end)]}, every ${step} ${label}s`;
                }
                return `starting at ${start}, every ${step} ${label}s until ${end}`;
            }

            if (part.match(/^(\d+)-(\d+)$/)) {
                // eslint-disable-next-line
                const [_, start, end] = part.match(/^(\d+)-(\d+)$/)!;
                if (isDayOfWeek) {
                    return `from ${days[parseInt(start)]} to ${days[parseInt(end)]}`;
                }
                return `from ${start} to ${end} ${label}s`;
            }

            if (part.match(/^\*\/(\d+)$/)) {
                const step = part.split("/")[1];
                return `every ${step} ${label}s`;
            }

            if (part.match(/^\d+$/)) {
                if (isDayOfWeek) {
                    return `on ${days[parseInt(part)]}`;
                }
                return `at every ${part}th ${label}${label.endsWith("s") ? "" : ""}`;
            }

            if (part === "*") {
                return `every possible ${label}`;
            }

            return part;
        }

        const minuteText = interpretPart(minute, "minute");
        const hourText = interpretPart(hour, "hour");
        const domText = interpretPart(dom, "day of the month");
        const moText = interpretPart(mo, "month");
        const dowText = interpretPart(dow, "day of the week", true);

        return `This cron runs at ${minuteText}, ${hourText}, on ${domText}, in ${moText}, and on ${dowText}.`;
    }

    useEffect(() => {
        if (formType === FormType.EditSchedule && formEditRecordId) {
            const schedule = getSchedule(formEditRecordId);
            if (schedule) {
                setName(schedule.name);
                setStartTime(schedule.start_time ? new Date(schedule.start_time) : null);
                setEndTime(schedule.end_time ? new Date(schedule.end_time) : null);
                setIsActive(schedule.is_active);

                // Als je de oude cron_expression wilt parsen in
                // minutePart/hourPart etc., moet je hier de logica updaten
                if (schedule.cron_expression) {
                    const [m, h, dom, mo, dow] = schedule.cron_expression.split(" ");
                    setMinutePart(m);
                    setHourPart(h);
                    setDayOfMonthPart(dom);
                    setMonthPart(mo);
                    setDayOfWeekPart(dow);
                }
            }
        }
    }, [formEditRecordId, formType, getSchedule]);

    const validateForm = () => {
        const newErrors: string[] = [];
        // event. checks
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        if (!start_time) return;
        if (!validateForm()) return;

        if (formType === FormType.AddSchedule) {
            const newSchedule: Schedule = {
                name,
                cron_expression: cronExpression,
                start_time,
                end_time,
                is_active
            };
            const createdSchedule = await storeSchedule(newSchedule);
            closeForm("Schedule created successfully");
            if (createdSchedule && createdSchedule.id) {
                router.push(`/project/${params.projectUuid}/schedule/${createdSchedule.id}`);
            }
        }
        if (formType === FormType.EditSchedule && formEditRecordId) {
            const updatedSchedule: Schedule = {
                id: formEditRecordId,
                name,
                cron_expression: cronExpression,
                start_time,
                end_time,
                is_active
            };
            const updated = await updateSchedule(updatedSchedule);
            if (updated) {
                router.push(`/project/${params.projectUuid}/schedule/${formEditRecordId}`);
                closeForm("Schedule updated successfully");
            }
        }
    };

    const handleDelete = async () => {
        await deleteSchedule(formEditRecordId as string);
        closeForm("Schedule deleted successfully");
        setShowDeleteAlert(false);
        router.push(`/project/${params.projectUuid}`);
    };

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

    return (
        <form onSubmit={handleSubmit} method={"post"} className={"p-10"}>
            <Heading>{formType === FormType.AddSchedule ? "Add " : "Edit "} Schedule</Heading>
            <Divider className="my-10" soft bleed />
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
                    <Input
                        aria-label="Name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
            </section>
            <Divider className="my-10" soft bleed/>

            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Cron</h3>
                    <p className="text-sm text-gray-600">Set the frequency of the cron job.</p>
                </div>
                <div>
                    <Fieldset className="space-y-4">
                        <CronField
                            label="Minutes"
                            minValue={0}
                            maxValue={59}
                            onChange={(val) => setMinutePart(val)}
                        />
                        <CronField
                            label="Hours"
                            minValue={0}
                            maxValue={23}
                            onChange={(val) => setHourPart(val)}
                        />
                        <CronField
                            label="Day of Month"
                            minValue={1}
                            maxValue={31}
                            onChange={(val) => setDayOfMonthPart(val)}
                        />
                        <CronField
                            label="Month"
                            minValue={1}
                            maxValue={12}
                            onChange={(val) => setMonthPart(val)}
                        />
                        <CronField
                            label="Day of Week"
                            minValue={0}
                            maxValue={6}
                            onChange={(val) => setDayOfWeekPart(val)}
                            dayOfWeekLabels={dayOfWeekLabels} // Optioneel
                        />
                    </Fieldset>
                    <p className="mt-4 font-mono text-sm text-gray-200">
                        CRON Expression: {cronExpression}
                    </p>
                    <p className="mt-2 text-sm text-gray-200">
                        {interpretCron(minutePart, hourPart, dayOfMonthPart, monthPart, dayOfWeekPart)}
                    </p>
                </div>
            </section>

            <Divider className="my-10" soft bleed/>
            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Start date and time</Subheading>
                    <Text>This cron should run from this date on</Text>
                </div>
                <div>
                    <CalendarDateRangeIcon className={"w-6 h-6 inline-block mr-2 text-zinc-500 dark:text-white/50"}/>
                    <DatePicker
                        selected={start_time}
                        onChange={(date) => setStartTime(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        className={
                            "relative block w-full appearance-none rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing[3])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white border border-zinc-950/10 data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20 bg-transparent dark:bg-white/5 focus:outline-none data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-500 data-[invalid]:data-[hover]:dark:border-red-500 data-[disabled]:border-zinc-950/20 dark:data-[hover]:data-[disabled]:border-white/15 data-[disabled]:dark:border-white/15 data-[disabled]:dark:bg-white/[2.5%] dark:[color-scheme:dark]"
                        }
                    />
                </div>
            </section>
            <Divider className="my-10" soft bleed/>
            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>End date and time</Subheading>
                    <Text>This cron should run until this date</Text>
                </div>
                <div>
                    <CalendarDateRangeIcon className={"w-6 h-6 inline-block mr-2 text-zinc-500 dark:text-white/50"}/>
                    <DatePicker
                        selected={end_time}
                        onChange={(date) => setEndTime(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        className={
                            "relative block w-full appearance-none rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing[3])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white border border-zinc-950/10 data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20 bg-transparent dark:bg-white/5 focus:outline-none data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-500 data-[invalid]:data-[hover]:dark:border-red-500 data-[disabled]:border-zinc-950/20 dark:data-[hover]:data-[disabled]:border-white/15 data-[disabled]:dark:border-white/15 data-[disabled]:dark:bg-white/[2.5%] dark:[color-scheme:dark]"
                        }
                    />
                </div>
            </section>
            <Divider className="my-10" soft bleed/>
            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Active</Subheading>
                    <Text>Is the schedule activated?</Text>
                </div>
                <div>
                    <Switch checked={is_active} onChange={() => setIsActive(!is_active)}/>
                </div>
            </section>

            <Divider className="my-10" soft bleed/>

            {formType === FormType.EditSchedule && (
                <>
                    <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Subheading>Delete</Subheading>
                            <Text>After deletion, the schedule is recoverable through versions</Text>
                        </div>
                        <div className="flex justify-end self-center">
                            <Button color="red" type="button" onClick={() => setShowDeleteAlert(true)}>
                                Delete schedule
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
                <Button type="submit">
                    {formType === FormType.AddSchedule ? "Create schedule" : "Update schedule"}
                </Button>
            </div>

            {showDeleteAlert && (
                <Alert size="md" className="text-center" open={showDeleteAlert}
                       onClose={() => setShowDeleteAlert(false)}>
                    <AlertTitle>Are you sure you want to delete this schedule?</AlertTitle>
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
        </form>
    );
};

export default ScheduleForm;