'use client';

import { useAuth } from "react-oidc-context";
import React, { useEffect, useState } from "react";
import CompleteAccount from "@/components/auth/complete-account";
import { fetchClientAccount } from "@/api/clientAccountsApi";
import useAccountsStore from "@/stores/accountsStore";
import {LoggedInAccount} from "@/types/types";
import dynamic from 'next/dynamic';

const WelcomeSplashScreen = dynamic(() => import('@/components/welcome/WelcomeSplashScreen'), {
    ssr: false,
});

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const [isAccountSynced, setIsAccountSynced] = useState<boolean | null>(null);
    const [isAccountActive, setIsAccountActive] = useState<boolean>(false);
    const [showWelcome, setShowWelcome] = useState<boolean>(false);
    const { setLoggedInAccount } = useAccountsStore();

    useEffect(() => {
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
                    setIsAccountSynced(false); // The account is not yet in the api database
                    setIsAccountActive(true); // The account will be activated upon creation
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
    }, [auth]);

    const handleCloseWelcome = () => {
        const welcomeKey = `hasSeenWelcome_${auth.user?.profile.sub}`;
        localStorage.setItem(welcomeKey, 'true');
        setShowWelcome(false);
    };

    if (auth.isLoading || isAccountSynced === null) {
        return <div className="fixed inset-0 flex items-center justify-center bg-gray-100">Loading...</div>;
    }

    if (!auth.isAuthenticated) {
        return <div className="fixed inset-0 flex items-center justify-center bg-gray-100">Redirecting to login...</div>;
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