import React from "react";
import {NodeVariable} from "@/types/types";
import {ChevronDownIcon, ChevronLeftIcon, Squares2X2Icon} from "@heroicons/react/24/outline";
import Connector from "@/components/editor/nodes/connector";
import FakeConnector from "@/components/editor/nodes/fake-connector";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";

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

const FileVariable: React.FC<Props> = ({
   variable,
   isOpen,
   onToggle,
   nodeId,
   onlyIn = false,
   onlyOut = false,
   disabled = false,
   groupId,
   isMirror = false,
}) => {

    const type = interpretNodeVariableType(variable);

    return <>
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
                nodeVariableType={type.baseType}
            />}
            <div className="flex items-center truncate">
                <h3 className="font-semibold truncate text-sky-600 dark:text-white">{variable.name}:</h3>
                <Squares2X2Icon className="w-4 h-4 ml-1 text-sky-400 dark:text-slate-400"/>
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
                nodeVariableType={type.baseType}
            />}
            {variable.has_out && isMirror && !onlyIn && (
                <FakeConnector out/>
            )}
        </div>

        {isOpen &&
            Array.isArray(variable.value) &&
            (variable.value as NodeVariable[]).map((item, index) => {
                const type = interpretNodeVariableType(item);

                return <div key={item.handle} className="flex items-center pl-6 pr-6 pt-1 relative">
                    {item.has_in && isMirror && !onlyOut && (
                        <FakeConnector in/>
                    )}
                    {item.has_in && !isMirror && !disabled && !onlyOut && <Connector
                        in
                        nodeId={nodeId}
                        handle={`${variable.handle}.${item.handle}`}
                        disabled={disabled}
                        groupId={groupId}
                        nodeVariableType={type.baseType}
                    />}
                    <div className="flex items-center truncate text-sky-200 dark:text-white" title={`${variable.handle}.${item.handle}`}>
                        <span className="text-sky-400 dark:text-slate-400">
                            {index === (variable.value as NodeVariable[]).length - 1 ? (
                                <div className={"w-4 h-4"}>
                                    <div className="w-2 h-2 border-l border-b border-dotted border-white"></div>
                                </div>
                            ) : (
                                <div className={"w-4 h-4"}>
                                    <div className="w-2 h-2 border-l border-b border-dotted border-white"></div>
                                    <div className="w-2 h-2 border-l border-dotted border-white"></div>
                                </div>
                            )}
                        </span>
                        {' ' + item.handle}: {item.value as string}
                    </div>
                    {item.has_out && !isMirror && !disabled && !onlyIn && <Connector
                        out
                        nodeId={nodeId}
                        handle={`${variable.handle}.${item.handle}`}
                        disabled={disabled}
                        groupId={groupId}
                        nodeVariableType={type.baseType}
                    />}
                    {item.has_out && isMirror && !onlyIn && (
                        <FakeConnector out/>
                    )}
                </div>
            })}
    </>
};

export default FileVariable;
