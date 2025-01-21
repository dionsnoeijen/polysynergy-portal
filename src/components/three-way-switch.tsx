import * as Headless from '@headlessui/react';
import { Node } from '@/types/types';
import clsx from 'clsx';
import React from 'react';
import useNodesStore from "@/stores/nodesStore";

type ThreeWaySwitchProps = {
  node: Node;
  disabled?: boolean;
  className?: string;
};

export const ThreeWaySwitch: React.FC<ThreeWaySwitchProps> = ({
  node,
  className,
  disabled = false
}) => {

  const { enableNode, disableNode } = useNodesStore();

  const handleClick = () => {
    if (node.driven) return;

    if (node.enabled) {
        disableNode(node.id);
        return;
    }

    if (!node.enabled) {
        enableNode(node.id);
    }
  };

  return (
    <Headless.Switch
      as="button"
      type="button"
      onClick={handleClick}
      disabled={disabled || node.driven}
      className={clsx(
        'relative inline-flex h-6 w-11 cursor-pointer rounded-full p-1 transition-colors',
        {
          'cursor-not-allowed bg-yellow-500': node.driven,
          'bg-red-500': !node.enabled && !node.driven,
          'bg-green-500': node.enabled && !node.driven,
        },
        className
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          {
            'translate-x-0': !node.enabled && !node.driven,
            'translate-x-5': node.enabled && !node.driven,
            'translate-x-2.5': node.driven,
          }
        )}
      />
    </Headless.Switch>
  );
};