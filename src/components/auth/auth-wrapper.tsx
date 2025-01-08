'use client';

import { useAuth } from "react-oidc-context";
import React from "react";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const auth = useAuth();

    if (auth.isLoading) {
        return <div>Loading...</div>;
    }

    if (!auth.isAuthenticated) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
                <button
                    onClick={() => auth.signinRedirect()}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    Sign in
                </button>
            </div>
        );
    }

    return <>{children}</>;
}