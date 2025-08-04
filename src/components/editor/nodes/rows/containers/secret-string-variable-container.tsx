import React, {ReactNode} from 'react';
import {useSecretStringVariableLogic, SecretStringVariableLogicProps} from '@/hooks/editor/nodes/variables/useSecretStringVariableLogic';
import Connector from '@/components/editor/nodes/connector';
import FakeConnector from '@/components/editor/nodes/fake-connector';

interface SecretStringVariableContainerProps extends SecretStringVariableLogicProps {
    children: (logic: ReturnType<typeof useSecretStringVariableLogic>) => ReactNode;
}

const SecretStringVariableContainer: React.FC<SecretStringVariableContainerProps> = ({
    children,
    ...secretStringProps
}) => {
    const logic = useSecretStringVariableLogic(secretStringProps);

    return (
        <div className={logic.containerClassName}>
            {/* Input Connectors */}
            {logic.showFakeInConnector && <FakeConnector in />}
            {logic.showInConnector && !logic.isMirror && (
                <Connector in {...logic.inConnectorProps} />
            )}
            
            {/* Variable Content */}
            <div className="flex items-center truncate">
                {children(logic)}
            </div>
            
            {/* Output Connectors */}
            {logic.showOutConnector && !logic.isMirror && (
                <Connector out {...logic.outConnectorProps} />
            )}
            {logic.showFakeOutConnector && <FakeConnector out />}
        </div>
    );
};

export default SecretStringVariableContainer;