'use client';

import CustomPopover from './custom-popover';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CustomPopoverHome(props: unknown) {
    return <CustomPopover {...props} storageKey="intro_home_seen" />;
}