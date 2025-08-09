import React, { ReactNode } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
                {title && (
                    <div className="border-b border-gray-200 dark:border-zinc-700 pb-4 mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
                    </div>
                )}
                <div className="text-sm">{children}</div>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default Modal;