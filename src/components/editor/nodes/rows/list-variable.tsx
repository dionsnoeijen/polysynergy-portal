import React from "react";
import {NodeVariable} from "@/types/types";
import {Bars3Icon, ChevronDownIcon, ChevronLeftIcon} from "@heroicons/react/24/outline";
import Connector from "@/components/editor/nodes/connector";
import FakeConnector from "@/components/editor/nodes/fake-connector";

type Props = {
    variable: NodeVariable;
    isOpen: boolean;
    onToggle: () => void;
    nodeId: string;
    onlyIn?: boolean;
    onlyOut?: boolean;
    disabled?: boolean;
    groupId?: string;
    isMirror?: boolean;
};

const ListVariable: React.FC<Props> = ({
                                           variable,
                                           isOpen,
                                           onToggle,
                                           nodeId,
                                           onlyIn = false,
                                           onlyOut = false,
                                           disabled = false,
                                           groupId,
                                           isMirror = false,
                                       }) => (
    <div>
        <div
            className={`flex items-center justify-between rounded-md w-full pl-5 pr-3 pt-1 relative ${disabled && 'select-none opacity-0'}`}>
            {variable.has_in && isMirror && !onlyOut && (
                <FakeConnector in/>
            )}
            {variable.has_in && !isMirror && !disabled && !onlyOut && <Connector
                in
                nodeId={nodeId}
                handle={variable.handle}
                disabled={disabled}
                groupId={groupId}
            />}
            <div className="flex items-center truncate">
                <h3 className="font-semibold truncate text-sky-600 dark:text-white">{variable.name}:</h3>
                <Bars3Icon className="w-4 h-4 ml-1 text-sky-400 dark:text-slate-400"/>
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
                    <ChevronDownIcon className="w-5 h-5 text-sky-400 dark:text-slate-400"/>
                ) : (
                    <ChevronLeftIcon className="w-5 h-5 text-sky-400 dark:text-slate-400"/>
                )}
            </button>
            {variable.has_out && !isMirror && !disabled && !onlyIn && <Connector
                out
                nodeId={nodeId}
                handle={variable.handle}
                disabled={disabled}
                groupId={groupId}
            />}
            {variable.has_out && isMirror && !onlyIn && (
                <FakeConnector out/>
            )}
        </div>

        {isOpen &&
            Array.isArray(variable.value) &&
            (variable.value as NodeVariable[]).map((item, index) => (
                <div key={item.handle} className="flex items-center pl-10 pr-3 pt-1 relative">
                    {item.has_in && isMirror && !onlyOut && (
                        <FakeConnector in/>
                    )}
                    {item.has_in && !isMirror && !disabled && !onlyOut && <Connector
                        in
                        nodeId={nodeId}
                        handle={`${variable.handle}.${item.handle}`}
                        disabled={disabled}
                        groupId={groupId}
                    />}
                    <div className="flex items-center truncate text-sky-200 dark:text-white">
                        <span className="text-sky-400 dark:text-slate-400">
                            {index === (variable.value as NodeVariable[]).length - 1 ? "└ " : "├ "}
                        </span>
                        {item.value as string}
                    </div>
                    {item.has_out && !isMirror && !disabled && !onlyIn && <Connector
                        out
                        nodeId={nodeId}
                        handle={`${variable.handle}.${item.handle}`}
                        disabled={disabled}
                        groupId={groupId}
                    />}
                    {item.has_out && isMirror && !onlyIn && (
                        <FakeConnector out/>
                    )}
                </div>
            ))}
    </div>
);

export default ListVariable;
