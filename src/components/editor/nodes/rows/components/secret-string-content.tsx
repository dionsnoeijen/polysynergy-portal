import React from 'react';
import {useSecretStringVariableLogic} from '@/hooks/editor/nodes/variables/useSecretStringVariableLogic';
import {DocumentTextIcon} from "@heroicons/react/24/outline";

interface SecretStringContentProps {
    logic: ReturnType<typeof useSecretStringVariableLogic>;
}

const SecretStringContent: React.FC<SecretStringContentProps> = ({ logic }) => {
    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName}:
            </h3>
            <DocumentTextIcon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
            {logic.variable.value ? (
                <span className={`ml-1 ${logic.categorySubTextColor}`}>********</span>
            ) : (
                <span className={`ml-1 ${logic.categorySubTextColor}`}></span>
            )}
        </>
    );
};

export default SecretStringContent;