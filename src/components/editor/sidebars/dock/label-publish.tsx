import {FormType, NodeVariable} from "@/types/types";
import {Label, LabelGroup} from "@/components/fieldset";
import {ArrowRightCircleIcon, InformationCircleIcon} from "@heroicons/react/24/outline";
import React, {useState} from "react";
import {ConfirmDialog} from "@/components/confirm-dialog";
import useEditorStore from "@/stores/editorStore";

type Props = {
    nodeId: string;
    variable: NodeVariable;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    categoryBackgroundColor?: string;
    categoryGradientBackgroundColor?: string;
};

const LabelPublish: React.FC<Props> = ({
    nodeId,
    variable,
    categoryMainTextColor = 'text-gray-500 hover:text-gray-700 dark:text-white/80 dark:hover:text-white',
}) => {
    const openForm =
        useEditorStore((state) => state.openForm);
    const [showInfo, setShowInfo] = useState(false);

    return (
        <LabelGroup
            actions={
                <>
                    {variable?.info && (
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            className={`p-1 mb-1 rounded-md hover:bg-sky-500 ${showInfo && 'bg-sky-500 !hover:bg-sky-600'}`}
                            title={'Info'}
                        >
                            <InformationCircleIcon className={`w-4 h-4 !m-0 ${categoryMainTextColor}`}/>
                        </button>
                    )}
                    <button
                        onClick={() =>
                            openForm(FormType.PublishedVariableSettings, {
                                nodeId,
                                variable
                            })
                        }
                        className={`p-1 -mr-2 mb-1 rounded-md hover:bg-sky-500 ${variable.published && 'bg-sky-500 !hover:bg-sky-600'}`}
                        title={'Publish variable'}
                    >
                        <ArrowRightCircleIcon
                            className={`w-4 h-4 !m-0 ${categoryMainTextColor} ${variable.published && '!text-white'}`} />
                    </button>
                </>
            }
        >
            <Label>
                {variable.name} <span
                className="text-zinc-500 dark:text-zinc-400 text-xs">{'{'}{variable.handle}{'}'}</span>
            </Label>

            {variable?.info && (
                <ConfirmDialog
                    open={showInfo}
                    onClose={() => setShowInfo(false)}
                    title={'Info'}
                    description={variable.info}
                />
            )}
        </LabelGroup>
    );
};

export default LabelPublish;