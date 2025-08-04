import React, {ReactNode} from 'react';
import {useSimpleVariableLogic, SimpleVariableLogicProps} from '@/hooks/editor/nodes/variables/useSimpleVariableLogic';
import Connector from '@/components/editor/nodes/connector';
import FakeConnector from '@/components/editor/nodes/fake-connector';

interface SimpleVariableContainerProps extends SimpleVariableLogicProps {
    children: (logic: ReturnType<typeof useSimpleVariableLogic>) => ReactNode;
}

const SimpleVariableContainer: React.FC<SimpleVariableContainerProps> = ({
    children,
    ...simpleProps
}) => {
    const logic = useSimpleVariableLogic(simpleProps);

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

export default SimpleVariableContainer;