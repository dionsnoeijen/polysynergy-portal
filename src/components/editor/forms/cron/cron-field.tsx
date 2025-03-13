import React, { useState, useEffect } from "react";
import { Select } from "@/components/select";
import { Input } from "@/components/input";
import { Label } from "@/components/fieldset";

type CronFieldProps = {
  label: string;
  minValue: number;
  maxValue: number;
  defaultValue?: string;
  onChange: (val: string) => void;
  dayOfWeekLabels?: string[];
};

export function CronField({
  label,
  minValue,
  maxValue,
  defaultValue = "*",
  onChange,
  dayOfWeekLabels
}: CronFieldProps) {
  const [useRange, setUseRange] = useState(false);
  const [useStep, setUseStep] = useState(false);

  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [step, setStep] = useState("");
  const [singleValue, setSingleValue] = useState(defaultValue);

  function getCronValue() {
    if (useRange && rangeStart !== "" && rangeEnd !== "") {
      if (useStep && step !== "") {
        return `${rangeStart}-${rangeEnd}/${step}`;
      }
      return `${rangeStart}-${rangeEnd}`;
    }
    if (useStep && step !== "") {
      return `*/${step}`;
    }
    return singleValue;
  }

  useEffect(() => {
    onChange(getCronValue());
  // eslint-disable-next-line
  }, [useRange, useStep, rangeStart, rangeEnd, step, singleValue]);

  const options = [];
  for (let i = minValue; i <= maxValue; i++) {
    if (dayOfWeekLabels) {
      options.push(
        <option key={i} value={i}>
          {dayOfWeekLabels[i]}
        </option>
      );
    } else {
      options.push(
        <option key={i} value={i}>
          {i}
        </option>
      );
    }
  }

  return (
    <div className="mt-4">
      <Label>
        {label}
        <div className="flex items-center gap-3 mt-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={useRange}
              onChange={(e) => {
                setUseRange(e.target.checked);
                if (!e.target.checked) {
                  setRangeStart("");
                  setRangeEnd("");
                }
              }}
            />
            <span>Range</span>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={useStep}
              onChange={(e) => {
                setUseStep(e.target.checked);
                if (!e.target.checked) {
                  setStep("");
                }
              }}
            />
            <span>Step</span>
          </label>
        </div>

        {/* Als je geen range en geen step hebt, toon je “singleValue” */}
        {!useRange && !useStep && (
          <Select
            value={singleValue}
            onChange={(e) => setSingleValue(e.target.value)}
            className="w-full mt-2"
          >
            <option value="*">Every {label}</option>
            {options}
          </Select>
        )}

        {/* Range = start tot end */}
        {useRange && (
          <div className="flex gap-2 items-center mt-2">
            <Select
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
            >
              <option value="">Start</option>
              {options}
            </Select>
            <Select
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
            >
              <option value="">End</option>
              {options}
            </Select>
          </div>
        )}

        {/* Step veld */}
        {useStep && (
          <Input
            type="number"
            placeholder="Step"
            value={step}
            onChange={(e) => setStep(e.target.value)}
            className="mt-2"
          />
        )}
      </Label>
    </div>
  );
}