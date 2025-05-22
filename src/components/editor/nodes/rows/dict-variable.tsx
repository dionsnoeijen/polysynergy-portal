import React from "react";
import {NodeVariable} from "@/types/types";
import {BoltIcon, ChevronDownIcon, ChevronLeftIcon, Squares2X2Icon} from "@heroicons/react/24/outline";
import Connector from "@/components/editor/nodes/connector";
import FakeConnector from "@/components/editor/nodes/fake-connector";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";
import useConnectionsStore from "@/stores/connectionsStore";

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

const DictVariable: React.FC<Props> = ({
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
    const isSubValueConnected = useConnectionsStore((state) => state.isValueConnected);
    const isMainValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

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
                nodeVariableType={variable.in_type_override || type.validationType}
            />}
            <div className="flex items-center truncate">
                <h3 className={`font-semibold truncate ${isMainValueConnected ? 'text-yellow-300 dark:text-yellow-300' : 'text-sky-600 dark:text-white'}`}>
                    {(groupId && variable.group_name_override) ? variable.group_name_override : variable.name}:
                </h3>
                <Squares2X2Icon className={`w-4 h-4 ml-1 ${isMainValueConnected ? 'text-yellow-300 dark:text-yellow-300' : 'text-sky-400 dark:text-slate-400'}`} />
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
                    <ChevronDownIcon className={`w-4 h-4 ml-1 ${isMainValueConnected ? 'text-yellow-300 dark:text-yellow-300' : 'text-sky-400 dark:text-slate-400'}`} />
                ) : (
                    <ChevronLeftIcon className={`w-4 h-4 ml-1 ${isMainValueConnected ? 'text-yellow-300 dark:text-yellow-300' : 'text-sky-400 dark:text-slate-400'}`} />
                )}
            </button>
            {variable.has_out && !isMirror && !disabled && !onlyIn && <Connector
                out
                nodeId={nodeId}
                handle={variable.handle}
                disabled={disabled}
                groupId={groupId}
                nodeVariableType={variable.out_type_override || type.validationType}
            />}
            {variable.has_out && isMirror && !onlyIn && (
                <FakeConnector out/>
            )}
        </div>

        {!isMainValueConnected && isOpen && (
            Array.isArray(variable.value) &&
            (variable.value as NodeVariable[]).map((item: NodeVariable, index: number) => {
                const type = interpretNodeVariableType(item);
                const subVariableConnected = isSubValueConnected(nodeId, `${variable.handle}.${item.handle}`);
                return <div key={item.handle + '-' + index} className="flex items-center pl-6 pr-6 pt-1 relative">
                    {item.has_in && isMirror && !onlyOut && (
                        <FakeConnector in/>
                    )}
                    {item.has_in && !isMirror && !disabled && !onlyOut && <Connector
                        in
                        nodeId={nodeId}
                        handle={`${variable.handle}.${item.handle}`}
                        disabled={disabled}
                        groupId={groupId}
                        nodeVariableType={variable.dock?.in_type_override ?? type.validationType}
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
                        <span className={`${subVariableConnected ? 'text-yellow-300 flex items-center' : ''}`}>
                            {' ' + item.handle}: {subVariableConnected ? <BoltIcon className={'w-4 h-4 text-yellow-300'} /> : item.value as string}
                        </span>
                    </div>
                    {item.has_out && !isMirror && !disabled && !onlyIn && <Connector
                        out
                        nodeId={nodeId}
                        handle={`${variable.handle}.${item.handle}`}
                        disabled={disabled}
                        groupId={groupId}
                        nodeVariableType={variable.dock?.out_type_override ?? type.validationType}
                    />}
                    {item.has_out && isMirror && !onlyIn && (
                        <FakeConnector out/>
                    )}
                </div>
            }))}
    </>
};

export default DictVariable;
