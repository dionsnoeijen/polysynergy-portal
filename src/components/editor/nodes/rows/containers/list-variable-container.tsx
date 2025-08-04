import React, {ReactNode} from 'react';
import {useListVariableLogic, ListVariableLogicProps} from '@/hooks/editor/nodes/variables/useListVariableLogic';
import Connector from '@/components/editor/nodes/connector';
import FakeConnector from '@/components/editor/nodes/fake-connector';
import {ChevronDownIcon, ChevronLeftIcon} from "@heroicons/react/24/outline";

interface ListVariableContainerProps extends ListVariableLogicProps {
    children: (logic: ReturnType<typeof useListVariableLogic>) => ReactNode;
    onToggle: () => void;
}

const ListVariableContainer: React.FC<ListVariableContainerProps> = ({
    children,
    onToggle,
    ...listProps
}) => {
    const logic = useListVariableLogic(listProps);

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
            {logic.showToggle && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onToggle();
                    }}
                    data-toggle="true"
                >
                    {logic.isOpen ? (
                        <ChevronDownIcon className={`w-5 h-5 ${logic.textColor}`} />
                    ) : (
                        <ChevronLeftIcon className={`w-5 h-5 ${logic.textColor}`} />
                    )}
                </button>
            )}
            
            {/* Output Connectors */}
            {logic.showOutConnector && !logic.isMirror && (
                <Connector out {...logic.outConnectorProps} />
            )}
            {logic.showFakeOutConnector && <FakeConnector out />}
        </div>
    );
};

export default ListVariableContainer;