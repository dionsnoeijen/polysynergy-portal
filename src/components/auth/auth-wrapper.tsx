'use client';

import { useAuth } from "react-oidc-context";
import React, { useEffect, useState } from "react";
import CompleteAccount from "@/components/auth/complete-account";
import { fetchClientAccount } from "@/api/clientAccountsApi";
import useAccountsStore from "@/stores/accountsStore";
import {LoggedInAccount} from "@/types/types";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const [isAccountSynced, setIsAccountSynced] = useState<boolean | null>(null);
    const { setLoggedInAccount } = useAccountsStore();

    useEffect(() => {
        const checkAccount = async () => {
            try {
                const response = await fetchClientAccount(auth.user?.profile.sub as string);
                if (response.status === 200) {
                    const user = await response.json() as LoggedInAccount;
                    setLoggedInAccount(user);
                    setIsAccountSynced(true);
                } else if (response.status === 404) {
                    setIsAccountSynced(false);
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
    }, [auth]);

    if (auth.isLoading || isAccountSynced === null) {
        return <div>Loading...</div>;
    }

    if (!auth.isAuthenticated) {
        return <div className="fixed inset-0 flex items-center justify-center bg-gray-100">Redirecting to login...</div>;
    }

    if (!isAccountSynced) {
        return <CompleteAccount />;
    }

    return <>{children}</>;
}