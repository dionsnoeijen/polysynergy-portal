import React, {ReactNode} from 'react';
import {useBooleanVariableLogic, BooleanVariableLogicProps} from '@/hooks/editor/nodes/variables/useBooleanVariableLogic';
import Connector from '@/components/editor/nodes/connector';
import FakeConnector from '@/components/editor/nodes/fake-connector';

interface BooleanVariableContainerProps extends BooleanVariableLogicProps {
    children: (logic: ReturnType<typeof useBooleanVariableLogic>) => ReactNode;
}

const BooleanVariableContainer: React.FC<BooleanVariableContainerProps> = ({
    children,
    ...booleanProps
}) => {
    const logic = useBooleanVariableLogic(booleanProps);

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

export default BooleanVariableContainer;