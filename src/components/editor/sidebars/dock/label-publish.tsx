import {NodeVariable} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import {Label, LabelGroup} from "@/components/fieldset";
import {Button} from "@/components/button";
import {ArrowRightCircleIcon} from "@heroicons/react/24/outline";
import React from "react";

type Props = {
    nodeId: string;
    variable: NodeVariable;
};

const LabelPublish: React.FC<Props> = ({ nodeId, variable }) => {
    const toggleNodeVariablePublished = useNodesStore((state) => state.toggleNodeVariablePublished);

    return (
        <LabelGroup
            actions={
                <Button
                    plain
                    onClick={() => toggleNodeVariablePublished(nodeId, variable.handle)}
                    className={`!p-1 !px-1 !py-1 -mr-2 mb-1 ${variable.published && 'bg-sky-500 hover:bg-sky-600'}`}
                    title={'Publish variable'}
                >
                    <ArrowRightCircleIcon className={`w-4 h-4 !m-0 text-gray-500 hover:text-gray-700 ${variable.published && '!text-white'}`} />
                </Button>
            }
        >
            <Label>{variable.name} <span className="text-zinc-500 dark:text-zinc-400 text-xs">{'{'}{variable.handle}{'}'}</span></Label>
        </LabelGroup>
    );
};

export default LabelPublish;