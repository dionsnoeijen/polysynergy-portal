import React, {useEffect, useState} from "react";
import {Heading, Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import {Text} from "@/components/text";
import {useEditorStore} from "@/stores/editorStore";
import useSchedulesStore from "@/stores/schedulesStore";
import {FormType, Schedule} from "@/types/types";
import {Alert, AlertActions, AlertDescription, AlertTitle} from "@/components/alert";
import {Button} from "@/components/button";
import {Input} from "@/components/input";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {CalendarDateRangeIcon} from "@heroicons/react/16/solid";
import {Switch} from "@/components/switch";
import {Select} from "@/components/select";
import {Fieldset, Label} from "@/components/fieldset";

const ScheduleForm: React.FC = () => {
    const { closeForm, formType, formEditRecordId } = useEditorStore();
    const { getSchedule, storeSchedule, updateSchedule } = useSchedulesStore();

    const [name, setName] = useState('');
    const [start_time, setStartTime] = useState<Date | null>(new Date());
    const [end_time, setEndTime] = useState<Date | null>(null);
    const [is_active, setIsActive] = useState(true);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const [minute, setMinute] = useState('*');
    const [minuteStep, setMinuteStep] = useState('');
    const [hour, setHour] = useState('*');
    const [hourRangeStart, setHourRangeStart] = useState('');
    const [hourRangeEnd, setHourRangeEnd] = useState('');
    const [dayOfMonth, setDayOfMonth] = useState('*');
    const [dayOfMonthStart, setDayOfMonthStart] = useState('');
    const [dayOfMonthEnd, setDayOfMonthEnd] = useState('');
    const [month, setMonth] = useState('*');
    const [monthStart, setMonthStart] = useState('');
    const [monthEnd, setMonthEnd] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState('*');
    const [dayOfWeekStart, setDayOfWeekStart] = useState('');
    const [dayOfWeekEnd, setDayOfWeekEnd] = useState('');

    const [errors, setErrors] = useState<string[]>([]);

    const generateCronExpression = (): string => {
        const minutePart = minute === "*/" ? `*/${minuteStep}` : minute;
        const hourPart = hour === "-" ? `${hourRangeStart}-${hourRangeEnd}` : hour;
        const dayOfMonthPart = dayOfMonth === "-" ? `${dayOfMonthStart}-${dayOfMonthEnd}` : dayOfMonth;
        const monthPart = month === "-" ? `${monthStart}-${monthEnd}` : month;
        const dayOfWeekPart = dayOfWeek === "-" ? `${dayOfWeekStart}-${dayOfWeekEnd}` : dayOfWeek;
        return `${minutePart} ${hourPart} ${dayOfMonthPart} ${monthPart} ${dayOfWeekPart}`;
    };

    const cronExpression = generateCronExpression();

    const interpretCron = (
        minute: string,
        hour: string,
        dayOfMonth: string,
        month: string,
        dayOfWeek: string
    ): string => {
        const minuteText = minute === '*'
            ? 'every minute'
            : minute.startsWith('*/')
            ? `every ${minute.slice(2)} minutes`
            : `at minute ${minute}`;
        const hourText = hour === '*'
            ? 'every hour'
            : hour.includes('-')
            ? `between ${hour.split('-')[0]}:00 and ${hour.split('-')[1]}:00`
            : `at hour ${hour}:00`;
        const dayOfMonthText = dayOfMonth === '*'
            ? 'every day of the month'
            : dayOfMonth.includes('-')
            ? `from day ${dayOfMonth.split('-')[0]} to day ${dayOfMonth.split('-')[1]}`
            : `on day ${dayOfMonth} of the month`;
        const monthText = month === '*'
            ? 'every month'
            : month.includes('-')
            ? `from month ${month.split('-')[0]} to month ${month.split('-')[1]}`
            : `in month ${month}`;
        const dayOfWeekText = dayOfWeek === '*'
            ? 'every day of the week'
            : dayOfWeek.includes('-')
            ? `from ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][parseInt(dayOfWeek.split('-')[0])]} to ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][parseInt(dayOfWeek.split('-')[1])]}`
            : `on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][parseInt(dayOfWeek)]}`;
        return `Scheduled ${minuteText}, ${hourText}, ${dayOfMonthText}, ${monthText}, and ${dayOfWeekText}.`;
    };

    useEffect(() => {
        if (formType === FormType.EditSchedule && formEditRecordId) {
            const schedule = getSchedule(formEditRecordId);
            if (schedule) {
                setName(schedule.name);
                setStartTime(schedule.start_time ? new Date(schedule.start_time) : null);
                setEndTime(schedule.end_time ? new Date(schedule.end_time) : null);
                setIsActive(schedule.is_active);
                if (schedule.cron_expression) {
                    const parts = schedule.cron_expression.split(" ");
                    if (parts.length === 5) {
                        const [m, h, dom, mo, dow] = parts;
                        if (m.startsWith("*/")) {
                            setMinute("*/");
                            setMinuteStep(m.split("/")[1]);
                        } else {
                            setMinute(m);
                        }
                        if (h.includes("-")) {
                            setHour("-");
                            const range = h.split("-");
                            setHourRangeStart(range[0]);
                            setHourRangeEnd(range[1]);
                        } else {
                            setHour(h);
                        }
                        if (dom.includes("-")) {
                            setDayOfMonth("-");
                            const range = dom.split("-");
                            setDayOfMonthStart(range[0]);
                            setDayOfMonthEnd(range[1]);
                        } else {
                            setDayOfMonth(dom);
                        }
                        if (mo.includes("-")) {
                            setMonth("-");
                            const range = mo.split("-");
                            setMonthStart(range[0]);
                            setMonthEnd(range[1]);
                        } else {
                            setMonth(mo);
                        }
                        if (dow.includes("-")) {
                            setDayOfWeek("-");
                            const range = dow.split("-");
                            setDayOfWeekStart(range[0]);
                            setDayOfWeekEnd(range[1]);
                        } else {
                            setDayOfWeek(dow);
                        }
                    }
                }
            }
        }
    }, [formEditRecordId, formType, getSchedule]);

    const validateForm = () => {
        const newErrors: string[] = [];
        if (minute === "*/" && (!minuteStep || isNaN(Number(minuteStep)))) {
            newErrors.push("Minute step must be a valid number.");
        }
        if (hour === "-" && (hourRangeStart === "" || hourRangeEnd === "" || Number(hourRangeStart) >= Number(hourRangeEnd))) {
            newErrors.push("Hour range must have valid start and end values (start < end).");
        }
        if (dayOfMonth === "-" && (dayOfMonthStart === "" || dayOfMonthEnd === "" || Number(dayOfMonthStart) >= Number(dayOfMonthEnd))) {
            newErrors.push("Day of Month range must have valid start and end values (start < end).");
        }
        if (month === "-" && (monthStart === "" || monthEnd === "" || Number(monthStart) >= Number(monthEnd))) {
            newErrors.push("Month range must have valid start and end values (start < end).");
        }
        if (dayOfWeek === "-" && (dayOfWeekStart === "" || dayOfWeekEnd === "" || Number(dayOfWeekStart) >= Number(dayOfWeekEnd))) {
            newErrors.push("Day of Week range must have valid start and end values (start < end).");
        }
        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
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
            storeSchedule(newSchedule);
            closeForm('Schedule created successfully');
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
            updateSchedule(updatedSchedule);
            closeForm('Schedule updated successfully');
        }
    };

    const handleDelete = () => {
        closeForm('Schedule deleted successfully');
        setShowDeleteAlert(false);
    };

    return (
        <form onSubmit={handleSubmit} method={'post'} className={'p-10'}>
            <Heading>{formType === FormType.AddSchedule ? 'Add ' : 'Edit '}Schedule</Heading>
            <Divider className="my-10" soft bleed/>
            {errors.length > 0 && (
                <div className="text-red-500 mb-4">
                    {errors.map((error, idx) => <p key={idx}>{error}</p>)}
                </div>
            )
            }
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
                        <Label>
                            Minute:
                            <div className="flex gap-2">
                                <Select
                                    value={minute}
                                    onChange={(e) => setMinute(e.target.value)}
                                    className="w-full mt-1"
                                >
                                    <option value="*">Every Minute</option>
                                    <option value="*/">Every N Minutes</option>
                                    {[...Array(60).keys()].map((i) => (
                                        <option key={i} value={i}>
                                            {i}
                                        </option>
                                    ))}
                                </Select>
                                {minute === "*/" && (
                                    <Input
                                        aria-label="Minute Step"
                                        placeholder="Step (e.g., 15)"
                                        value={minuteStep}
                                        onChange={(e) => setMinuteStep(e.target.value)}
                                        className="w-1/2"
                                    />
                                )}
                            </div>
                        </Label>
                        <Label>
                            Hour:
                            <div className="flex gap-2">
                                <Select
                                    value={hour}
                                    onChange={(e) => setHour(e.target.value)}
                                    className="w-full mt-1"
                                >
                                    <option value="*">Every Hour</option>
                                    <option value="-">Range (e.g., 8-18)</option>
                                    {[...Array(24).keys()].map((i) => (
                                        <option key={i} value={i}>
                                            {i}
                                        </option>
                                    ))}
                                </Select>
                                {hour === "-" && (
                                    <div className="flex gap-2 w-full">
                                        <Select
                                            value={hourRangeStart}
                                            onChange={(e) => setHourRangeStart(e.target.value)}
                                            className="w-1/2"
                                        >
                                            <option value="">Start Hour</option>
                                            {[...Array(24).keys()].map((i) => (
                                                <option key={i} value={i}>
                                                    {i}
                                                </option>
                                            ))}
                                        </Select>
                                        <Select
                                            value={hourRangeEnd}
                                            onChange={(e) => setHourRangeEnd(e.target.value)}
                                            className="w-1/2"
                                        >
                                            <option value="">End Hour</option>
                                            {[...Array(24).keys()].map((i) => (
                                                <option key={i} value={i}>
                                                    {i}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </Label>
                        <Label>
                            Day of Month:
                            <div className="flex gap-2">
                                <Select
                                    value={dayOfMonth}
                                    onChange={(e) => setDayOfMonth(e.target.value)}
                                    className="w-full mt-1"
                                >
                                    <option value="*">Every Day</option>
                                    <option value="-">Range</option>
                                    {[...Array(31).keys()].map((i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {i + 1}
                                        </option>
                                    ))}
                                </Select>
                                {dayOfMonth === "-" && (
                                    <div className="flex gap-2 w-full">
                                        <Select
                                            value={dayOfMonthStart}
                                            onChange={(e) => setDayOfMonthStart(e.target.value)}
                                            className="w-1/2"
                                        >
                                            <option value="">Start Day</option>
                                            {[...Array(31).keys()].map((i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {i + 1}
                                                </option>
                                            ))}
                                        </Select>
                                        <Select
                                            value={dayOfMonthEnd}
                                            onChange={(e) => setDayOfMonthEnd(e.target.value)}
                                            className="w-1/2"
                                        >
                                            <option value="">End Day</option>
                                            {[...Array(31).keys()].map((i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {i + 1}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </Label>
                        <Label>
                            Month:
                            <div className="flex gap-2">
                                <Select
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="w-full mt-1"
                                >
                                    <option value="*">Every Month</option>
                                    <option value="-">Range</option>
                                    {[...Array(12).keys()].map((i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {i + 1}
                                        </option>
                                    ))}
                                </Select>
                                {month === "-" && (
                                    <div className="flex gap-2 w-full">
                                        <Select
                                            value={monthStart}
                                            onChange={(e) => setMonthStart(e.target.value)}
                                            className="w-1/2"
                                        >
                                            <option value="">Start Month</option>
                                            {[...Array(12).keys()].map((i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {i + 1}
                                                </option>
                                            ))}
                                        </Select>
                                        <Select
                                            value={monthEnd}
                                            onChange={(e) => setMonthEnd(e.target.value)}
                                            className="w-1/2"
                                        >
                                            <option value="">End Month</option>
                                            {[...Array(12).keys()].map((i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {i + 1}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </Label>
                        <Label>
                            Day of Week:
                            <div className="flex gap-2">
                                <Select
                                    value={dayOfWeek}
                                    onChange={(e) => setDayOfWeek(e.target.value)}
                                    className="w-full mt-1"
                                >
                                    <option value="*">Every Day</option>
                                    <option value="-">Range</option>
                                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
                                        (day, i) => (
                                            <option key={i} value={i}>
                                                {day}
                                            </option>
                                        )
                                    )}
                                </Select>
                                {dayOfWeek === "-" && (
                                    <div className="flex gap-2 w-full">
                                        <Select
                                            value={dayOfWeekStart}
                                            onChange={(e) => setDayOfWeekStart(e.target.value)}
                                            className="w-1/2"
                                        >
                                            <option value="">Start Day</option>
                                            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
                                                (day, i) => (
                                                    <option key={i} value={i}>
                                                        {day}
                                                    </option>
                                                )
                                            )}
                                        </Select>
                                        <Select
                                            value={dayOfWeekEnd}
                                            onChange={(e) => setDayOfWeekEnd(e.target.value)}
                                            className="w-1/2"
                                        >
                                            <option value="">End Day</option>
                                            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
                                                (day, i) => (
                                                    <option key={i} value={i}>
                                                        {day}
                                                    </option>
                                                )
                                            )}
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </Label>
                    </Fieldset>
                    <p className="mt-4 font-mono text-sm text-gray-200">CRON Expression: {cronExpression}</p>
                    <p className="mt-2 text-sm text-gray-200">{interpretCron(minute, hour, dayOfMonth, month, dayOfWeek)}</p>
                </div>
            </section>
            <Divider className="my-10" soft bleed/>
            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Start date and time</Subheading>
                    <Text>This cron should run from this date on</Text>
                </div>
                <div>
                    <CalendarDateRangeIcon
                        className={'w-6 h-6 inline-block mr-2 text-zinc-500 dark:text-white/50'}/>
                    <DatePicker
                        selected={start_time}
                        onChange={(date) => setStartTime(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        className={'relative block w-full appearance-none rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing[3])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white border border-zinc-950/10 data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20 bg-transparent dark:bg-white/5 focus:outline-none data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-500 data-[invalid]:data-[hover]:dark:border-red-500 data-[disabled]:border-zinc-950/20 dark:data-[hover]:data-[disabled]:border-white/15 data-[disabled]:dark:border-white/15 data-[disabled]:dark:bg-white/[2.5%] dark:[color-scheme:dark]'}
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
                    <CalendarDateRangeIcon
                        className={'w-6 h-6 inline-block mr-2 text-zinc-500 dark:text-white/50'}/>
                    <DatePicker
                        selected={end_time}
                        onChange={(date) => setEndTime(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        className={'relative block w-full appearance-none rounded-lg px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing[3])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white border border-zinc-950/10 data-[hover]:border-zinc-950/20 dark:border-white/10 dark:data-[hover]:border-white/20 bg-transparent dark:bg-white/5 focus:outline-none data-[invalid]:border-red-500 data-[invalid]:data-[hover]:border-red-500 data-[invalid]:dark:border-red-500 data-[invalid]:data-[hover]:dark:border-red-500 data-[disabled]:border-zinc-950/20 dark:data-[hover]:data-[disabled]:border-white/15 data-[disabled]:dark:border-white/15 data-[disabled]:dark:bg-white/[2.5%] dark:[color-scheme:dark]'}
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
                    <Switch
                        checked={is_active}
                        onChange={() => setIsActive(!is_active)}
                    />
                </div>
            </section>

            <Divider className="my-10" soft bleed />

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
                    {formType === FormType.AddSchedule ? 'Create schedule' : 'Update schedule'}
                </Button>
            </div>

            {showDeleteAlert && (
                <Alert size="md" className="text-center" open={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
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