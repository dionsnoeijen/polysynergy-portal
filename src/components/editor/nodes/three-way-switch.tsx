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
                'inline-block h-5 w-5 rounded-full transition-colors duration-200',
                disabled && 'opacity-50',
                node.driven
                    ? 'bg-green-400 ring-2 ring-green-500/50 shadow-[0_0_8px_rgba(158,243,196,0.5)]'
                    : 'bg-green-950'
            )}
        />
    );
};

export default ThreeWaySwitch;