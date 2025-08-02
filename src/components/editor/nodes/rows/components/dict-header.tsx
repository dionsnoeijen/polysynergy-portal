import React from 'react';
import {ChevronDownIcon, ChevronLeftIcon, Squares2X2Icon} from '@heroicons/react/24/outline';

interface DictHeaderProps {
    logic?: {
        displayName?: string;
        textColor: string;
        iconColor: string;
        isOpen: boolean;
    };
    onToggle?: () => void;
}

const DictHeader: React.FC<DictHeaderProps> = ({ logic, onToggle }) => {
    if (!logic) return null;

    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName || 'Unknown'}:
            </h3>
            <Squares2X2Icon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
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
                    <ChevronDownIcon className={`w-4 h-4 ${logic.textColor}`} />
                ) : (
                    <ChevronLeftIcon className={`w-4 h-4 ${logic.textColor}`} />
                )}
            </button>
        </>
    );
};

export default DictHeader;