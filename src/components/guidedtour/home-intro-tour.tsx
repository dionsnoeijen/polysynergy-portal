'use client';

import {useEffect} from 'react';
import {TourProvider, useTour} from '@reactour/tour';
import useProjectsStore from '@/stores/projectsStore';
import CustomPopoverHome from "@/components/guidedtour/custom-popover-home";

const steps = [
    {
        selector: '[data-tour-id="create-project"]',
        content: 'This is where you can create a project.',
    },
    {
        selector: '[data-tour-id="trash-toggle"]',
        content: 'Removed projects are here, they can be restored.',
    },
];

function InnerTour() {
    const {setIsOpen} = useTour();
    const {projects} = useProjectsStore();

    useEffect(() => {
        // Wait a bit to ensure projects are loaded before checking
        const timer = setTimeout(() => {
            // Only show tour if user has NO projects yet (first time)
            if (projects.length > 0) return;

            const seen = localStorage.getItem('intro_home_seen');
            if (!seen) {
                setIsOpen(true);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [projects.length, setIsOpen]);

    return null;
}

export default function HomeIntroTour() {
    return (
        <TourProvider
            steps={steps}
            ContentComponent={CustomPopoverHome}
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