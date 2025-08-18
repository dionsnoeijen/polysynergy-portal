'use client';

import CustomPopover from './custom-popover';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CustomPopoverItemManager(props: unknown) {
    return <CustomPopover {...props} storageKey="intro_item_manager_seen" />;
}