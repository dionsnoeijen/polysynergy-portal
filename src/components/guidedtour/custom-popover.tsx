import {PopoverContentProps} from '@reactour/tour';
import {XMarkIcon} from '@heroicons/react/24/outline';

type CustomPopoverProps = PopoverContentProps & {
    storageKey?: string;
};

export default function CustomPopover({
    currentStep,
    setCurrentStep,
    steps,
    setIsOpen,
    storageKey = 'intro_home_seen',
}: CustomPopoverProps) {
    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;
    const step = steps[currentStep];
    const content = typeof step?.content === 'function' ? step.content({ currentStep, steps, setCurrentStep, setIsOpen }) : step?.content;

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem(storageKey, 'true');
    };

    const handleNext = () => {
        if (isLastStep) {
            handleClose();
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (!isFirstStep) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-300 dark:border-zinc-600 rounded-lg shadow-2xl backdrop-blur-sm max-w-xs p-4 relative">
            <button
                onClick={handleClose}
                className="absolute top-2 right-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100"
            >
                <XMarkIcon className="w-5 h-5"/>
            </button>

            <div className="text-sm mb-4 font-medium">
                {content ?? null}
            </div>

            <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-700 pt-3 text-xs">
                <button
                    onClick={handleBack}
                    disabled={isFirstStep}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-30 font-semibold"
                >
                    Back
                </button>
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                    {currentStep + 1} / {steps.length}
                </span>
                <button
                    onClick={handleNext}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                >
                    {isLastStep ? 'Close' : 'Next'}
                </button>
            </div>
        </div>
    );
}