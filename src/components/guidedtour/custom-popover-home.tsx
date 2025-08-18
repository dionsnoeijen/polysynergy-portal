'use client';

import CustomPopover from './custom-popover';
import {PopoverContentProps} from '@reactour/tour';

export default function CustomPopoverHome(props: PopoverContentProps) {
    return <CustomPopover {...props} storageKey="intro_home_seen" />;
}