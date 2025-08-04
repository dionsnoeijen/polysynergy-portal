import React, {ReactNode} from 'react';
import {useDictVariableLogic, DictVariableLogicProps} from '@/hooks/editor/nodes/variables/useDictVariableLogic';
import Connector from '@/components/editor/nodes/connector';
import FakeConnector from '@/components/editor/nodes/fake-connector';

interface DictVariableContainerProps extends DictVariableLogicProps {
    children: (logic: ReturnType<typeof useDictVariableLogic>) => ReactNode;
}

const DictVariableContainer: React.FC<DictVariableContainerProps> = ({
    children,
    ...dictProps
}) => {
    const logic = useDictVariableLogic(dictProps);

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
            
            {/* Toggle Button - positioned between content and out connector */}
            
            {/* Output Connectors */}
            {logic.showOutConnector && !logic.isMirror && (
                <Connector out {...logic.outConnectorProps} />
            )}
            {logic.showFakeOutConnector && <FakeConnector out />}
        </div>
    );
};

export default DictVariableContainer;