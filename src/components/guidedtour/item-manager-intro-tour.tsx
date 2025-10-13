'use client';

import {useEffect} from 'react';
import {TourProvider, useTour} from '@reactour/tour';
import CustomPopoverItemManager from "@/components/guidedtour/custom-popover-item-manager-tour";

const steps = [
    {
        selector: '[data-tour-id="add-route-button"]',
        content: 'Add a new route to your project, available through an endpoint.',
    },
    {
        selector: '[data-tour-id="add-schedule-button"]',
        content: 'Add a new schedule to your project, which can be used to trigger workflows at specific times.',
    },
    {
        selector: '[data-tour-id="add-blueprint-button"]',
        content: 'Add a new blueprint to your project, which can be used to create reusable workflows.',
    },
    {
        selector: '[data-tour-id="add-service-button"]',
        content: 'Add a new service to your project, which can be reused across projects.',
    },
    {
        selector: '[data-tour-id="add-secret-button"]',
        content: 'Add a new secret to your project, which can be used to store sensitive information securely, separated per environment.'
    },
    {
        selector: '[data-tour-id="add-environment-variable-button"]',
        content: 'Add a new environment variable to your project, which can be used to store configuration values that are unique per environment.'
    }
];

function InnerTour() {
    const {setIsOpen} = useTour();

    useEffect(() => {
        const seen = localStorage.getItem('intro_item_manager_seen');
        if (!seen) {
            setTimeout(() => {
                setIsOpen(true);
            }, 300);
        }
    }, [setIsOpen]);

    return null;
}

export default function ItemManagerIntroTour() {
    return (
        <TourProvider
            steps={steps}
            ContentComponent={CustomPopoverItemManager}
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