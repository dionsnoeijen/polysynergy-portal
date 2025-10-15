'use client';

import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
    PlusIcon,
    GlobeAltIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    CubeIcon
} from '@heroicons/react/24/outline';
import useEditorStore from '@/stores/editorStore';
import { FormType } from '@/types/types';

const TabCreateDropdown: React.FC = () => {
    const openForm = useEditorStore((state) => state.openForm);

    const menuItems = [
        {
            title: 'Create Route',
            icon: GlobeAltIcon,
            color: 'text-sky-500',
            action: () => openForm(FormType.AddRoute),
        },
        {
            title: 'Create Schedule',
            icon: ClockIcon,
            color: 'text-purple-500',
            action: () => openForm(FormType.AddSchedule),
        },
        {
            title: 'Create Chat Window',
            icon: ChatBubbleLeftRightIcon,
            color: 'text-green-500',
            action: () => openForm(FormType.AddChatWindow),
        },
        {
            title: 'Create Blueprint',
            icon: CubeIcon,
            color: 'text-orange-500',
            action: () => openForm(FormType.AddBlueprint),
        },
    ];

    return (
        <Menu as="div" className="relative">
            <MenuButton className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                <PlusIcon className="w-4 h-4" />
            </MenuButton>

            <MenuItems
                anchor="bottom start"
                className="z-[300] mt-1 min-w-[200px] rounded-md bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <MenuItem key={item.title}>
                            {({ focus }) => (
                                <button
                                    onClick={item.action}
                                    className={`${
                                        focus ? 'bg-sky-50 dark:bg-zinc-700' : ''
                                    } group flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-200`}
                                >
                                    <Icon className={`w-5 h-5 ${item.color}`} />
                                    <span>{item.title}</span>
                                </button>
                            )}
                        </MenuItem>
                    );
                })}
            </MenuItems>
        </Menu>
    );
};

export default TabCreateDropdown;
