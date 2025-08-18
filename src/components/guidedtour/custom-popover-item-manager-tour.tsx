'use client';

import CustomPopover from './custom-popover';
import {PopoverContentProps} from '@reactour/tour';

export default function CustomPopoverItemManager(props: PopoverContentProps) {
    return <CustomPopover {...props} storageKey="intro_item_manager_seen" />;
}