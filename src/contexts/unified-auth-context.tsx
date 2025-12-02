'use client';

import React, { createContext } from 'react';

/**
 * Unified Authentication Context
 *
 * This provides a common authentication interface that works with both:
 * - Cognito mode (OIDC via react-oidc-context)
 * - Standalone mode (Custom JWT auth)
 */

export interface UnifiedAuthUser {
    id_token: string;
    access_token?: string;
    refresh_token?: string;
    profile: {
        sub: string;
        email: string;
        [key: string]: unknown;
    };
}

export interface UnifiedAuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: UnifiedAuthUser | null;
    error: Error | null;
}

export interface UnifiedAuthActions {
    signinRedirect: () => Promise<void>;
    signoutRedirect: () => Promise<void>;
    removeUser: () => Promise<void>;
    signinSilent?: () => Promise<void>;
}

export type UnifiedAuth = UnifiedAuthState & UnifiedAuthActions;

export const UnifiedAuthContext = createContext<UnifiedAuth | null>(null);

/**
 * UnifiedAuthProvider
 *
 * Detects auth mode from environment and loads the appropriate provider:
 * - 'cognito': Uses CognitoAuthAdapter (wraps react-oidc-context)
 * - 'standalone': Uses StandaloneAuthProvider (custom JWT)
 */
export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || 'cognito';

    if (authMode === 'standalone') {
        // Import Standalone provider (will be tree-shaken in cognito mode)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { StandaloneAuthProvider } = require('./standalone-auth-provider');
        return <StandaloneAuthProvider>{children}</StandaloneAuthProvider>;
    }

    if (authMode === 'cognito') {
        // Import Cognito adapter (will be tree-shaken in standalone mode)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CognitoAuthAdapter } = require('./cognito-auth-adapter');
        return <CognitoAuthAdapter>{children}</CognitoAuthAdapter>;
    }

    throw new Error(`Unknown auth mode "${authMode}". Must be "cognito" or "standalone".`);
}
