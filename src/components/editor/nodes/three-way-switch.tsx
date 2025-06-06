import React from 'react';
import clsx from 'clsx';
import {Node} from '@/types/types';

type ThreeWaySwitchProps = {
    node: Node;
    disabled?: boolean;
};

const ThreeWaySwitch: React.FC<ThreeWaySwitchProps> = ({
    node,
    disabled = false,
}) => {
    return (
        <span
            className={clsx(
                'w-3 aspect-square rounded-full flex-shrink-0 transition-colors duration-200',
                disabled && 'opacity-50',
                node.driven
                    ? 'bg-green-300 ring-2 ring-green-400/50 border border-black/50 shadow-[0_0_8px_rgba(158,243,196,0.5)]'
                    : 'bg-green-500/50 ring-2 ring-green-400/50 border border-black/50'
            )}
        />
    );
};

export default ThreeWaySwitch;