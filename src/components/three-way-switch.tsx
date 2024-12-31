import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import React from 'react';

type ThreeWaySwitchProps = {
  value: 'disabled' | 'driven' | 'enabled';
  onChange: (value: 'disabled' | 'driven' | 'enabled') => void;
  className?: string;
};

export const ThreeWaySwitch: React.FC<ThreeWaySwitchProps> = ({
  value,
  onChange,
  className,
}) => {
  const handleClick = () => {
    if (value === 'driven') return;

    const nextState = value === 'disabled' ? 'enabled' : 'disabled';
    onChange(nextState);
  };

  return (
    <Headless.Switch
      as="button"
      type="button"
      onClick={handleClick}
      disabled={value === 'driven'}
      className={clsx(
        'relative inline-flex h-6 w-11 cursor-pointer rounded-full p-1 transition-colors',
        {
          'cursor-not-allowed bg-yellow-500': value === 'driven',
          'bg-red-500': value === 'disabled',
          'bg-green-500': value === 'enabled',
        },
        className
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          {
            'translate-x-0': value === 'disabled',
            'translate-x-5': value === 'enabled',
            'translate-x-2.5': value === 'driven',
          }
        )}
      />
    </Headless.Switch>
  );
};