import React from 'react';
import {NodeVariable} from '@/types/types';
import {useFileVariableLogic} from '@/hooks/editor/nodes/variables/useFileVariableLogic';
import InterpretedVariableContainer from '@/components/editor/nodes/rows/containers/interpreted-variable-container';
import FileHeader from '@/components/editor/nodes/rows/components/file-header';
import FileList from '@/components/editor/nodes/rows/components/file-list';

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

const FileVariable: React.FC<Props> = (props) => {
    const logic = useFileVariableLogic(props);

    return (
        <>
            <InterpretedVariableContainer
                variable={props.variable}
                nodeId={props.nodeId}
                onlyIn={props.onlyIn}
                onlyOut={props.onlyOut}
                disabled={props.disabled}
                groupId={props.groupId}
                isMirror={props.isMirror}
                categoryMainTextColor={props.categoryMainTextColor}
                categorySubTextColor={props.categorySubTextColor}
                isInService={props.isInService}
            >
                {(containerLogic) => <FileHeader logic={containerLogic} onToggle={props.onToggle} />}
            </InterpretedVariableContainer>
            <FileList logic={logic} />
        </>
    );
};

export default FileVariable;
