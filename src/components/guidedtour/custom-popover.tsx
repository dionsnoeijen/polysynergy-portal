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
        <div className="bg-zinc-900 text-white border border-white/10 rounded-sm shadow-xl max-w-xs p-4 relative">
            <button
                onClick={handleClose}
                className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-100"
            >
                <XMarkIcon className="w-5 h-5"/>
            </button>

            <div className="text-sm mb-4">
                {content ?? null}
            </div>

            <div className="flex justify-between items-center border-t border-zinc-800 pt-3 text-xs">
                <button
                    onClick={handleBack}
                    disabled={isFirstStep}
                    className="text-blue-400 hover:text-blue-300 disabled:opacity-30"
                >
                    Back
                </button>
                <span className="text-zinc-400">
                    {currentStep + 1} / {steps.length}
                </span>
                <button
                    onClick={handleNext}
                    className="text-blue-400 hover:text-blue-300"
                >
                    {isLastStep ? 'Close' : 'Next'}
                </button>
            </div>
        </div>
    );
}