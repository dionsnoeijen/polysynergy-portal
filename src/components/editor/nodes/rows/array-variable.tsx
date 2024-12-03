import React from "react";
import { NodeVariable } from "@/types/types";
import { ChevronDownIcon, ChevronLeftIcon, Squares2X2Icon } from "@heroicons/react/16/solid";
import Connector from "@/components/editor/nodes/connector";

type Props = {
    variable: NodeVariable;
    isOpen: boolean;
    onToggle: () => void;
    nodeId: string;
    onlyIn?: boolean;
    onlyOut?: boolean;
    disabled?: boolean;
};

const ArrayVariable: React.FC<Props> = ({ variable, isOpen, onToggle, nodeId, onlyIn = false, onlyOut = false, disabled = false }) => (
    <div>
        <div className={`flex items-center justify-between rounded-md w-full pl-5 pr-3 pt-1 relative ${disabled && 'select-none opacity-0'}`}>
            {variable.has_in && !disabled && !onlyOut && <Connector in nodeId={nodeId} handle={variable.handle} />}
            <div className="flex items-center truncate">
                <h3 className="font-semibold truncate text-sky-600 dark:text-white">{variable.name}:</h3>
                <Squares2X2Icon className="w-4 h-4 ml-1 text-sky-400 dark:text-slate-400" />
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    onToggle();
                }}
                data-toggle="true"
            >
                {isOpen ? (
                    <ChevronDownIcon className="w-5 h-5 text-sky-400 dark:text-slate-400" />
                ) : (
                    <ChevronLeftIcon className="w-5 h-5 text-sky-400 dark:text-slate-400" />
                )}
            </button>
            {variable.has_out && !disabled && !onlyIn && <Connector out nodeId={nodeId} handle={variable.handle} />}
        </div>

        {isOpen &&
            Array.isArray(variable.value) &&
            (variable.value as NodeVariable[]).map((item, index) => (
                <div key={item.handle} className="flex items-center pl-10 pr-3 pt-1 relative">
                    {item.has_in && !disabled && !onlyOut && (
                        <Connector
                            in
                            nodeId={nodeId}
                            handle={`${variable.handle}.${item.handle}`}
                            disabled={disabled}
                        />
                    )}
                    <div className="flex items-center truncate text-sky-200 dark:text-white">
                        <span className="text-sky-400 dark:text-slate-400">
                            {index === (variable.value as NodeVariable[]).length - 1 ? "└─" : "├─"}
                        </span>{" "}
                        {item.name}
                        {item.default_value && (
                            <span className="ml-1 text-sky-400">
                                {"{default: " + item.default_value + "}"}
                            </span>
                        )}
                    </div>
                    {item.has_out && !disabled && !onlyIn && (
                        <Connector
                            out
                            nodeId={nodeId}
                            handle={`${variable.handle}.${item.handle}`}
                            disabled={disabled}
                        />
                    )}
                </div>
            ))}
    </div>
);

export default ArrayVariable;
