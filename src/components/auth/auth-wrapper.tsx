'use client';

import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import CompleteAccount from "@/components/auth/complete-account";
import { fetchClientAccount } from "@/api/clientAccountsApi";
import useAccountsStore from "@/stores/accountsStore";
import {LoggedInAccount} from "@/types/types";
import dynamic from 'next/dynamic';

const WelcomeSplashScreen = dynamic(() => import('@/components/welcome/WelcomeSplashScreen'), {
    ssr: false,
});

// Pages that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/password-reset'];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const auth = useUnifiedAuth();
    const [isAccountSynced, setIsAccountSynced] = useState<boolean | null>(null);
    const [isAccountActive, setIsAccountActive] = useState<boolean>(false);
    const [showWelcome, setShowWelcome] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { setLoggedInAccount } = useAccountsStore();

    // If on a public route, skip auth checks
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // useEffect MUST be before the early return to maintain consistent hook order
    useEffect(() => {
        // Skip auth checks for public routes
        if (isPublicRoute) {
            return;
        }
        const checkAccount = async () => {
            try {
                const response = await fetchClientAccount(auth.user?.profile.sub as string);
                if (response.status === 200) {
                    const user = await response.json() as LoggedInAccount;
                    if (user.active) {
                        setLoggedInAccount(user);
                        setIsAccountSynced(true); // The account is in the api database
                        setIsAccountActive(true); // The account is already activated

                        // Check if this is the first login
                        const welcomeKey = `hasSeenWelcome_${auth.user?.profile.sub}`;
                        const hasSeenWelcome = localStorage.getItem(welcomeKey);
                        if (!hasSeenWelcome) {
                            setShowWelcome(true);
                        }
                    } else {
                        setIsAccountSynced(true); // The account is in the api database
                        setIsAccountActive(false); // The account is not yet activated, so it must be completed
                    }
                } else if (response.status === 404) {
                    // Account not found in database
                    // In Cognito mode: Show complete account form
                    // In Standalone mode: This is an error (account should exist from registration)
                    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'cognito';
                    if (authMode === 'standalone') {
                        console.error('Account not found in database. This should not happen in standalone mode.');
                        setError('Account setup error. Please contact support.');
                        setIsAccountSynced(false);
                        setIsAccountActive(false);
                    } else {
                        // Cognito mode: allow account creation
                        setIsAccountSynced(false); // The account is not yet in the api database
                        setIsAccountActive(true); // The account will be activated upon creation
                    }
                } else {
                    console.error("Unexpected response from API:", response.status);
                }
            } catch (error) {
                console.error("Error checking account in API:", error);
            }
        };

        if (!auth.isLoading) {
            if (auth.isAuthenticated) {
                checkAccount();
            } else {
                auth.signinRedirect();
            }
        }
    // eslint-disable-next-line
    }, [auth, isPublicRoute]);

    const handleCloseWelcome = () => {
        const welcomeKey = `hasSeenWelcome_${auth.user?.profile.sub}`;
        localStorage.setItem(welcomeKey, 'true');
        setShowWelcome(false);
    };

    // Early return for public routes - AFTER all hooks
    if (isPublicRoute) {
        return <>{children}</>;
    }

    if (auth.isLoading) {
        return <div className="fixed inset-0 flex items-center justify-center bg-gray-100">Loading...</div>;
    }

    if (!auth.isAuthenticated) {
        return <div className="fixed inset-0 flex items-center justify-center bg-gray-100">Redirecting to login...</div>;
    }

    if (error) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
                <div className="max-w-md p-8 bg-white rounded-lg shadow-xl text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-700 mb-4">{error}</p>
                    <button
                        onClick={() => auth.signoutRedirect()}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    if (isAccountSynced === null) {
        return <div className="fixed inset-0 flex items-center justify-center bg-gray-100">Loading...</div>;
    }

    if (!isAccountSynced || !isAccountActive) {
        return <CompleteAccount isAccountSynced={isAccountSynced} isAccountActive={isAccountActive} />;
    }

    return (
        <>
            {showWelcome && <WelcomeSplashScreen onClose={handleCloseWelcome} />}
            {children}
        </>
    );
}