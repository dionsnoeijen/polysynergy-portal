'use client';

import {useEffect} from 'react';
import {TourProvider, useTour} from '@reactour/tour';
import CustomPopoverEditor from "@/components/guidedtour/custom-popover-editor";

const steps = [
    {
        selector: '[data-tour-id="add-node-button"]',
        content: 'Add a new node to your project. This is where you can start building your workflow. Shortcut: a',
    },
    {
        selector: '[data-tour-id="clear-mock-data-button"]',
        content: 'After a test run, you can clear the mock data. This will reset the state of your project. Shortcut: c',
    },
    {
        selector: '[data-tour-id="main-play-button"]',
        content: 'Run your project to see how it works. This will execute the workflow you have built. Shortcut: p',
    },
    {
        selector: '[data-tour-id="published-variable-button"]',
        content: 'Configure published variables and secrets for your flow.'
    },
    {
        selector: '[data-tour-id="box-select-button"]',
        content: 'Select multiple nodes by dragging a box around them. Shortcut: b'
    },
    {
        selector: '[data-tour-id="pointer-select-button"]',
        content: 'Select a single node by clicking on it. Shortcut: s'
    }
];

function InnerTour() {
    const {setIsOpen} = useTour();

    useEffect(() => {
        const seen = localStorage.getItem('intro_editor_seen');
        if (!seen) {
            setTimeout(() => {
                setIsOpen(true);
            }, 300);
        }
    }, [setIsOpen]);

    return null;
}

export default function EditorIntroTour() {
    return (
        <TourProvider
            steps={steps}
            ContentComponent={CustomPopoverEditor}
            showDots={false}
            showBadge={false}
            styles={{
                popover: (base) => ({
                    ...base,
                    background: 'transparent',
                    padding: 0,
                    boxShadow: 'none',
                    border: 'none',
                    zIndex: 999999,
                }),
            }}
            showNavigation={false}
            showCloseButton={false}
            scrollSmooth
        >
            <InnerTour/>
        </TourProvider>
    );
}