import React, {ReactNode} from 'react';
import {useInterpretedVariableLogic, InterpretedVariableLogicProps} from '@/hooks/editor/nodes/variables/useInterpretedVariableLogic';
import Connector from '@/components/editor/nodes/connector';
import FakeConnector from '@/components/editor/nodes/fake-connector';

interface InterpretedVariableContainerProps extends InterpretedVariableLogicProps {
    children: (logic: ReturnType<typeof useInterpretedVariableLogic>) => ReactNode;
    fullWidth?: boolean;
}

const InterpretedVariableContainer: React.FC<InterpretedVariableContainerProps> = ({
    children,
    fullWidth = false,
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
            <div className={fullWidth ? "w-full" : "flex items-center truncate"}>
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