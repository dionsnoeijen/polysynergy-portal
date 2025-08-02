import React from 'react';
import {Bars3Icon, ChevronDownIcon, ChevronLeftIcon} from '@heroicons/react/24/outline';

interface FileHeaderProps {
    logic?: {
        displayName?: string;
        textColor: string;
        iconColor: string;
        isOpen: boolean;
        categoryMainTextColor?: string;
    };
    onToggle?: () => void;
}

const FileHeader: React.FC<FileHeaderProps> = ({ logic, onToggle }) => {
    if (!logic) return null;

    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName || 'Unknown'}:
            </h3>
            <Bars3Icon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
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
        </>
    );
};

export default FileHeader;