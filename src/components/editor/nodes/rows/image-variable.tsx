import React, { useLayoutEffect, useRef } from 'react';
import { NodeVariable } from '@/types/types';
import { useImageVariableLogic } from '@/hooks/editor/nodes/variables/useImageVariableLogic';
import { useConnectionPositionUpdater } from '@/hooks/editor/nodes/useConnectionPositionUpdater';
import InterpretedVariableContainer from '@/components/editor/nodes/rows/containers/interpreted-variable-container';
import ImageHeader from '@/components/editor/nodes/rows/components/image-header';
import ImagePreview from '@/components/editor/nodes/rows/components/image-preview';

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

const ImageVariable: React.FC<Props> = (props) => {
    const logic = useImageVariableLogic(props);
    const { triggerConnectionUpdate } = useConnectionPositionUpdater();
    const previousShouldShowPreview = useRef(false);
    
    // Auto-expand if image data is present, otherwise use the provided isOpen state
    const shouldShowPreview = logic.isValidImage() || props.isOpen;
    
    // Trigger connection position updates when image auto-expands or image data changes
    useLayoutEffect(() => {
        // Check if the preview is being shown due to auto-expansion (not manual toggle)
        const isAutoExpanding = shouldShowPreview && logic.isValidImage() && !previousShouldShowPreview.current;
        
        if (isAutoExpanding) {
            // Give the DOM time to update with the new image preview before updating connections
            // Use a double requestAnimationFrame to ensure the layout has settled
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    triggerConnectionUpdate();
                });
            });
        }
        
        previousShouldShowPreview.current = shouldShowPreview;
    }, [shouldShowPreview, logic.isValidImage(), triggerConnectionUpdate]);
    
    // Separate effect for image data changes to avoid excessive updates
    useLayoutEffect(() => {
        // Only trigger updates if we have a valid image showing and image data might have changed
        if (shouldShowPreview && logic.isValidImage()) {
            triggerConnectionUpdate();
        }
    }, [logic.getImageData(), shouldShowPreview, logic.isValidImage(), triggerConnectionUpdate]);

    return (
        <>
            <InterpretedVariableContainer
                variable={props.variable}
                nodeId={props.nodeId}
                onlyIn={props.onlyIn}
                onlyOut={props.onlyOut}
                disabled={props.disabled}
                groupId={props.groupId}
                isMirror={props.isMirror}
                categoryMainTextColor={props.categoryMainTextColor}
                categorySubTextColor={props.categorySubTextColor}
                isInService={props.isInService}
            >
                {(containerLogic) => (
                    <ImageHeader 
                        logic={{...containerLogic, ...logic, isOpen: shouldShowPreview}} 
                        onToggle={logic.isValidImage() ? undefined : props.onToggle}
                    />
                )}
            </InterpretedVariableContainer>
            {shouldShowPreview && <ImagePreview logic={logic} />}
        </>
    );
};

export default ImageVariable;