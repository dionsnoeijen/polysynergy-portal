import {NodeVariable} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import {Label, LabelGroup} from "@/components/fieldset";
import {Button} from "@/components/button";
import {ArrowRightCircleIcon, InformationCircleIcon} from "@heroicons/react/24/outline";
import React, {useState} from "react";
import {ConfirmDialog} from "@/components/confirm-dialog";

type Props = {
    nodeId: string;
    variable: NodeVariable;
};

const LabelPublish: React.FC<Props> = ({nodeId, variable}) => {
    const toggleNodeVariablePublished = useNodesStore((state) => state.toggleNodeVariablePublished);
    const [showInfo, setShowInfo] = useState(false);

    return (
        <LabelGroup
            actions={
                <>
                    {variable?.dock?.info && (
                        <Button
                            plain
                            onClick={() => setShowInfo(!showInfo)}
                            className={`!p-1 !px-1 !py-1 -mr-2 mb-1`}
                            title={'Info'}
                        >
                            <InformationCircleIcon className={`w-4 h-4 !m-0 text-gray-500 hover:text-gray-700`}/>
                        </Button>
                    )}
                    <Button
                        plain
                        onClick={() => toggleNodeVariablePublished(nodeId, variable.handle)}
                        className={`!p-1 !px-1 !py-1 -mr-2 mb-1 ${variable.published && 'bg-sky-500 hover:bg-sky-600'}`}
                        title={'Publish variable'}
                    >
                        <ArrowRightCircleIcon
                            className={`w-4 h-4 !m-0 text-gray-500 hover:text-gray-700 ${variable.published && '!text-white'}`}/>
                    </Button>
                </>
            }
        >
            <Label>{variable.name} <span
                className="text-zinc-500 dark:text-zinc-400 text-xs">{'{'}{variable.handle}{'}'}</span></Label>

            {variable?.dock?.info && (
                <ConfirmDialog
                    open={showInfo}
                    onClose={() => setShowInfo(false)}
                    title={'Info'}
                    description={variable.dock.info}
                />
            )}
        </LabelGroup>
    );
};

export default LabelPublish;