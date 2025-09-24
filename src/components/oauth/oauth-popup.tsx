import React, { useEffect, useState, useRef } from 'react';
import useInteractionStore from '@/stores/interactionStore';
import config from '@/config';

const OAuthPopup: React.FC = () => {
    const {
        activeInteraction,
        isPopupOpen,
        popupWindow,
        closePopup,
        setPopupWindow,
        clearInteraction
    } = useInteractionStore();

    const [error, setError] = useState<string | null>(null);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Check if authorization is completed by polling the API
    const checkAuthorizationStatus = async () => {
        if (!activeInteraction) return;

        try {
            const response = await fetch(`${config.LOCAL_API_URL}/oauth/check-code/${activeInteraction.node_id}`);
            const data = await response.json();

            if (data.status === 'completed') {
                console.log('🔑 [OAuth] Authorization completed successfully');
                clearInteraction();
            } else if (data.status === 'error') {
                setError('Authorization failed. Please try again.');
            }
            // Don't update isChecking state to avoid re-renders that cause jumping
        } catch (err) {
            console.error('🔑 [OAuth] Error checking authorization status:', err);
        }
    };

    // Start polling when popup opens
    useEffect(() => {
        if (isPopupOpen && activeInteraction) {
            // Start polling every 3 seconds to reduce jumps
            checkIntervalRef.current = setInterval(checkAuthorizationStatus, 3000);

            return () => {
                if (checkIntervalRef.current) {
                    clearInterval(checkIntervalRef.current);
                }
            };
        }
    }, [isPopupOpen, activeInteraction]);

    // Monitor popup window close
    useEffect(() => {
        if (popupWindow && isPopupOpen) {
            const checkClosed = setInterval(() => {
                if (popupWindow.closed) {
                    console.log('🔑 [OAuth] Popup window was closed by user');
                    closePopup();
                    clearInterval(checkClosed);
                }
            }, 1000);

            return () => clearInterval(checkClosed);
        }
    }, [popupWindow, isPopupOpen]);

    const handleAuthorize = () => {
        if (!activeInteraction?.data.auth_url) {
            setError('No authorization URL provided');
            return;
        }

        console.log('🔑 [OAuth] Opening authorization window:', activeInteraction.data.auth_url);

        // Open popup window
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            activeInteraction.data.auth_url,
            'oauth-authorization',
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        if (popup) {
            setPopupWindow(popup);
            setError(null);
        } else {
            setError('Failed to open authorization window. Please check your popup blocker settings.');
        }
    };

    const handleCancel = () => {
        console.log('🔑 [OAuth] User cancelled authorization');
        clearInteraction();
    };

    if (!isPopupOpen || !activeInteraction) {
        return null;
    }

    const { data } = activeInteraction;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
                <div className="border-b border-gray-200 dark:border-zinc-700 pb-4 mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Authorization Required</h2>
                </div>
                <div className="text-sm">
            <div className="space-y-4">
                <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Authorize {data.service_name || 'Service'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Authentication required to continue
                        </p>
                    </div>
                </div>

                {data.message && (
                    <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            {data.message}
                        </p>
                    </div>
                )}

                {data.redirect_uri && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Redirect URI:
                        </p>
                        <code className="text-xs text-gray-600 dark:text-gray-400 break-all">
                            {data.redirect_uri}
                        </code>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm text-red-800 dark:text-red-200">
                            {error}
                        </p>
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        onClick={handleAuthorize}
                        disabled={!data.auth_url}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        {popupWindow && !popupWindow.closed ? 'Authorization Window Open...' : 'Authorize'}
                    </button>
                    <button
                        onClick={handleCancel}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>

                {popupWindow && !popupWindow.closed && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Waiting for authorization...</span>
                    </div>
                )}
            </div>
                </div>
                <button
                    onClick={handleCancel}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default OAuthPopup;