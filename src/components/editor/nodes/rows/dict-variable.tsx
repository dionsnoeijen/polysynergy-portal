import React from 'react';
import {NodeVariable} from '@/types/types';
import {useDictVariableLogic} from '@/hooks/editor/nodes/variables/useDictVariableLogic';
import DictVariableContainer from '@/components/editor/nodes/rows/containers/dict-variable-container';
import DictHeader from '@/components/editor/nodes/rows/components/dict-header';
import DictSubItems from '@/components/editor/nodes/rows/components/dict-sub-items';

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

const DictVariable: React.FC<Props> = (props) => {
    const logic = useDictVariableLogic(props);

    return (
        <>
            <DictVariableContainer {...props}>
                {(containerLogic) => <DictHeader logic={containerLogic} onToggle={props.onToggle} />}
            </DictVariableContainer>
            <DictSubItems logic={logic} />
        </>
    );
};

export default DictVariable;
