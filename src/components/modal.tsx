import React, { ReactNode } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg max-w-2xl w-full relative z-[99999]">
                {/* Header with title and close button */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700 px-6 py-4">
                    {title && (
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-zinc-700 transition-colors"
                        title="Close"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 text-sm">{children}</div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default Modal;