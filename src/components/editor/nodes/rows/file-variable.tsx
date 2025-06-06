import React from "react";
import {NodeVariable} from "@/types/types";
import {Bars3Icon, ChevronDownIcon, ChevronLeftIcon} from "@heroicons/react/24/outline";
import Connector from "@/components/editor/nodes/connector";
import FakeConnector from "@/components/editor/nodes/fake-connector";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";
import useConnectionsStore from "@/stores/connectionsStore";
import {shortenFileName} from "@/utils/shortenFileName";

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
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    isInService?: boolean;
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
    categoryMainTextColor = 'text-sky-600 dark:text-white',
    categorySubTextColor = 'text-sky-400 dark:text-slate-400',
    isInService = false
}) => {

    const type = interpretNodeVariableType(variable);
    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    return <>
        <div
            className={`flex items-center justify-between rounded-md w-full pl-4 pr-4 pt-1 relative ${disabled && 'select-none opacity-0'}`}>
            {variable.has_in && isMirror && !onlyOut && (
                <FakeConnector in/>
            )}
            {variable.has_in && !isMirror && !disabled && !onlyOut && <Connector
                in
                nodeId={nodeId}
                handle={variable.handle}
                disabled={disabled || isInService}
                groupId={groupId}
                nodeVariableType={type.validationType}
            />}
            <div className="flex items-center truncate">
                <h3 className={`font-semibold truncate ${isValueConnected ? 'text-orange-800 dark:text-yellow-300' : `${categoryMainTextColor}`}`}>
                    {(groupId && variable.group_name_override) ? variable.group_name_override : variable.name}:
                </h3>
                <Bars3Icon className={`w-4 h-4 ml-1 ${isValueConnected ? 'text-orange-800 dark:text-yellow-300' : `${categoryMainTextColor}`}`} />
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
                    <ChevronDownIcon className={`w-5 h-5 ${categoryMainTextColor}`} />
                ) : (
                    <ChevronLeftIcon className={`w-5 h-5 ${categoryMainTextColor}`} />
                )}
            </button>
            {variable.has_out && !isMirror && !disabled && !onlyIn && <Connector
                out
                nodeId={nodeId}
                handle={variable.handle}
                disabled={disabled || isInService}
                groupId={groupId}
                nodeVariableType={type.validationType}
            />}
            {variable.has_out && isMirror && !onlyIn && (
                <FakeConnector out/>
            )}
        </div>

        {!isValueConnected && isOpen && (
            Array.isArray(variable.value) &&
            (variable.value as string[]).map((item, index) => {
                return <div key={'list-' + index} className="flex items-center pl-6 pr-6 pt-1 relative">
                    <div className="flex items-center truncate text-sky-200 dark:text-white" title={`${variable.handle}.${item}`}>
                        <span className="text-sky-400 dark:text-slate-400">
                            {index === (variable.value as string[]).length - 1 ? (
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
                        <span>filename: {shortenFileName(item as string)}</span>
                    </div>
                </div>
            }))}
    </>
};

export default FileVariable;
