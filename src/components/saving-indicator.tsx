import { ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function SavingIndicator({ isSaving }: { isSaving: boolean }) {
    return (
        <div className="flex items-center gap-2">
            {isSaving ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
            )}
        </div>
    );
}