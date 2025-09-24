import React from 'react';
import {LockClosedIcon, LockOpenIcon} from '@heroicons/react/24/outline';

interface OAuthContentProps {
    logic?: {
        nodeId: string;
        isAuthorizing: boolean;
        hasValue: boolean;
        value: unknown;
        oauthState: 'authorizing' | 'authorized' | 'unauthorized';
    };
}

const OAuthContent: React.FC<OAuthContentProps> = ({ logic }) => {
    if (!logic) return null;

    const renderOAuth = () => {
        switch (logic.oauthState) {
            case 'authorizing':
                return (
                    <div className="w-8 h-8 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
                    </div>
                );

            case 'unauthorized':
                return (
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <LockClosedIcon className="w-6 h-6 text-red-600 dark:text-red-400"/>
                    </div>
                );

            case 'authorized':
                return (
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <LockOpenIcon className="w-6 h-6 text-green-600 dark:text-green-400"/>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {renderOAuth()}
        </>
    );
};

export default OAuthContent;