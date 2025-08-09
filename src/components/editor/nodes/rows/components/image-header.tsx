import React from 'react';
import {ChevronDownIcon, ChevronLeftIcon} from '@heroicons/react/24/outline';

interface ImageHeaderProps {
    logic?: {
        displayName?: string;
        textColor: string;
        iconColor: string;
        isOpen: boolean;
        categoryMainTextColor?: string;
        getImageData: () => string | null;
        isValidImage: () => boolean;
        getImageMetadata: () => {
            width?: number;
            height?: number;
            format: string;
            size?: number;
        };
    };
    onToggle?: () => void;
}

const ImageHeader: React.FC<ImageHeaderProps> = ({ logic, onToggle }) => {
    if (!logic) return null;

    const metadata = logic.getImageMetadata();
    const hasValidImage = logic.isValidImage();

    const getDisplayText = () => {
        if (!hasValidImage) {
            return 'No image';
        }
        
        const parts: string[] = [];
        if (metadata.format !== 'unknown') {
            parts.push(metadata.format.toUpperCase());
        }
        if (metadata.width && metadata.height) {
            parts.push(`${metadata.width}x${metadata.height}`);
        }
        
        return parts.length > 0 ? parts.join(' • ') : 'Image';
    };

    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName || 'Unknown'}:
            </h3>
            <svg
                className={`w-4 h-4 ml-1 ${logic.iconColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
            </svg>
            <span className={`text-xs ml-2 ${logic.categoryMainTextColor}`}>
                {getDisplayText()}
            </span>
            {/* Only show toggle button if there's no valid image data */}
            {!hasValidImage && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onToggle?.();
                    }}
                    data-toggle="true"
                    className="ml-2"
                >
                    {logic.isOpen ? (
                        <ChevronDownIcon className={`w-5 h-5 ${logic.textColor}`} />
                    ) : (
                        <ChevronLeftIcon className={`w-5 h-5 ${logic.textColor}`} />
                    )}
                </button>
            )}
        </>
    );
};

export default ImageHeader;