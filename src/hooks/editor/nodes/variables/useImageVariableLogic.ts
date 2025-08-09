import { NodeVariable } from '@/types/types';
import { useInterpretedVariableLogic } from './useInterpretedVariableLogic';

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

export const useImageVariableLogic = (props: Props) => {
    const interpretedLogic = useInterpretedVariableLogic(props);

    // Image-specific logic can be added here
    const getImageData = () => {
        const value = interpretedLogic.valueText;
        
        // Handle string values (URLs or base64)
        if (typeof value === 'string') {
            if (value.startsWith('data:image/') || value.startsWith('http')) {
                return value;
            }
            // Try to parse as JSON in case it's a stringified object
            try {
                const parsed = JSON.parse(value);
                if (parsed && typeof parsed === 'object' && parsed.url) {
                    return parsed.url;
                }
            } catch {
                // Not JSON, continue
            }
        }
        
        // Handle object values (Image dict structure)
        if (value && typeof value === 'object' && 'url' in value) {
            const obj = value as { url?: unknown };
            if (typeof obj.url === 'string') {
                return obj.url;
            }
        }
        
        return null;
    };

    const getImageMetadata = () => {
        const value = interpretedLogic.valueText;
        let imageData = null;
        
        // Try to extract metadata from the value itself
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (parsed && typeof parsed === 'object') {
                    imageData = parsed as Record<string, unknown>;
                }
            } catch {
                // Not JSON, use variable metadata
            }
        } else if (value && typeof value === 'object') {
            imageData = value as Record<string, unknown>;
        }
        
        // Fall back to variable metadata
        const metadata = props.variable.metadata as Record<string, unknown> | undefined;
        
        return {
            width: typeof (imageData?.width || metadata?.width) === 'number' ? (imageData?.width || metadata?.width) as number : undefined,
            height: typeof (imageData?.height || metadata?.height) === 'number' ? (imageData?.height || metadata?.height) as number : undefined,
            format: String(imageData?.format || metadata?.format || 'unknown'),
            size: typeof (imageData?.size || metadata?.size) === 'number' ? (imageData?.size || metadata?.size) as number : undefined
        };
    };

    const isValidImage = () => {
        const imageData = getImageData();
        return imageData !== null;
    };

    return {
        ...interpretedLogic,
        getImageData,
        getImageMetadata,
        isValidImage
    };
};