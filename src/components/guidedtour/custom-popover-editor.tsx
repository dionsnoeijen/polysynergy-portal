'use client';

import CustomPopover from './custom-popover';
import {PopoverContentProps} from '@reactour/tour';

export default function CustomPopoverEditor(props: PopoverContentProps) {
    return <CustomPopover {...props} storageKey="intro_editor_seen" />;
}