import React, {ReactNode} from 'react';
import {useInterpretedVariableLogic, InterpretedVariableLogicProps} from '@/hooks/editor/nodes/variables/useInterpretedVariableLogic';
import Connector from '@/components/editor/nodes/connector';
import FakeConnector from '@/components/editor/nodes/fake-connector';

interface InterpretedVariableContainerProps extends InterpretedVariableLogicProps {
    children: (logic: ReturnType<typeof useInterpretedVariableLogic>) => ReactNode;
}

const InterpretedVariableContainer: React.FC<InterpretedVariableContainerProps> = ({
    children,
    ...interpretedProps
}) => {
    const logic = useInterpretedVariableLogic(interpretedProps);

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

export default InterpretedVariableContainer;