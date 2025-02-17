import * as Headless from '@headlessui/react';
import {FlowState, Node} from '@/types/types';
import React from 'react';
import useNodesStore from "@/stores/nodesStore";
import clsx from "clsx";

type ThreeWaySwitchProps = { node: Node, disabled?: boolean };

/**
 * States:
 * - Driven and enabled: -> Data is flowing in the node -> flowIn
 * - Driven and disabled: -> Data is not flowing in the node -> flowStop
 * - Not driven and enabled: -> Node is enabled but not driven -> enabled
 * - Node driven and disabled: -> Node is disabled and not driven -> disabled -> impossible scenario
 * @param node
 * @param disabled
 * @constructor
 */
const ThreeWaySwitch: React.FC<ThreeWaySwitchProps> = ({
    node,
    disabled = false
}: ThreeWaySwitchProps) => {

    const {setNodeFlowState} = useNodesStore();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();

        console.log('CLICK', node.driven, disabled, node.flowState);

        if (node.driven) {
            setNodeFlowState(node.id, node.flowState === FlowState.FlowStop ? FlowState.FlowIn : FlowState.FlowStop);
        }
    };

    return (
        <Headless.Switch
            as="button"
            type="button"
            onClick={handleClick}
            onDoubleClick={(e) => e.preventDefault()}
            disabled={disabled || !node.driven}
            className={clsx(
                'relative inline-flex h-6 w-11 cursor-pointer rounded-full p-1 transition-colors',
                {
                    'bg-yellow-500': node.driven,
                    'bg-red-500': node.flowState === FlowState.Disabled && !node.driven,
                    'bg-green-500': node.flowState === FlowState.Enabled && !node.driven,
                }
            )}
            style={{minWidth: '2.75rem'}}
        >
      <span
          aria-hidden="true"
          className={clsx(
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
              {
                  'translate-x-0': node.flowState === FlowState.Disabled || node.flowState === FlowState.FlowStop,
                  'translate-x-5': node.flowState === FlowState.Enabled || node.flowState === FlowState.FlowIn,
              }
          )}
      />
        </Headless.Switch>
    );
};

export default ThreeWaySwitch;