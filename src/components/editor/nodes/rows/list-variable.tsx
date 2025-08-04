import React from "react";
import {NodeVariable} from "@/types/types";
import {useListVariableLogic} from '@/hooks/editor/nodes/variables/useListVariableLogic';
import ListVariableContainer from '@/components/editor/nodes/rows/containers/list-variable-container';
import ListHeader from '@/components/editor/nodes/rows/components/list-header';
import ListItems from '@/components/editor/nodes/rows/components/list-items';

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

const ListVariable: React.FC<Props> = (props) => {
    const logic = useListVariableLogic(props);

    return (
        <>
            <ListVariableContainer {...props}>
                {(containerLogic) => <ListHeader logic={containerLogic} />}
            </ListVariableContainer>
            <ListItems logic={logic} />
        </>
    );
};

export default ListVariable;
