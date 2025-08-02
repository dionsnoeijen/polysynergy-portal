import React, {ReactNode} from 'react';
import {useStringVariableLogic, StringVariableLogicProps} from '@/hooks/editor/nodes/variables/useStringVariableLogic';
import Connector from '@/components/editor/nodes/connector';
import FakeConnector from '@/components/editor/nodes/fake-connector';

interface StringVariableContainerProps extends StringVariableLogicProps {
    children: (logic: ReturnType<typeof useStringVariableLogic>) => ReactNode;
}

const StringVariableContainer: React.FC<StringVariableContainerProps> = ({
    children,
    ...stringProps
}) => {
    const logic = useStringVariableLogic(stringProps);

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

export default StringVariableContainer;