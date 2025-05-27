'use client';

import {useEffect} from 'react';
import {TourProvider, useTour} from '@reactour/tour';
import useProjectsStore from '@/stores/projectsStore';
import CustomPopoverHome from "@/components/guidedtour/custom-popover-home";

const steps = [
    {
        selector: '[data-tour-id="create-project"]',
        content: 'Hier begin je met het aanmaken van je project.',
    },
    {
        selector: '[data-tour-id="trash-toggle"]',
        content: 'Hier kun je verwijderde projecten bekijken of terugzetten.',
    },
];

function InnerTour() {
    const {setIsOpen} = useTour();
    const {projects} = useProjectsStore();

    useEffect(() => {
        if (projects.length === 0) return;

        const seen = localStorage.getItem('intro_home_seen');
        if (!seen) {
            setTimeout(() => {
                setIsOpen(true);
            }, 300);
        }
    }, [projects, setIsOpen]);

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