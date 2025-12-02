'use client';

import React, { useMemo } from 'react';
import { AuthProvider, useAuth as useOidcAuth } from 'react-oidc-context';
import { UnifiedAuthContext, UnifiedAuth } from './unified-auth-context';

/**
 * Cognito Auth Configuration
 */
const cognitoAuthConfig = {
    authority: process.env.NEXT_PUBLIC_AWS_COGNITO_AUTHORITY,
    client_id: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID,
    redirect_uri: process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_URL,
    response_type: "code",
    scope: "phone openid email",
};

/**
 * CognitoAuthAdapter
 *
 * Wraps react-oidc-context's AuthProvider and maps it to the unified auth interface.
 * This keeps OIDC implementation details isolated to this file only.
 */
export function CognitoAuthAdapter({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider {...cognitoAuthConfig}>
            <CognitoAuthMapper>{children}</CognitoAuthMapper>
        </AuthProvider>
    );
}

/**
 * CognitoAuthMapper
 *
 * Internal component that maps OIDC auth state to the unified auth interface.
 */
function CognitoAuthMapper({ children }: { children: React.ReactNode }) {
    const oidcAuth = useOidcAuth();

    // Map OIDC auth state to unified interface
    const unifiedAuth: UnifiedAuth = useMemo(() => ({
        // State
        isLoading: oidcAuth.isLoading,
        isAuthenticated: oidcAuth.isAuthenticated,
        user: oidcAuth.user ? {
            id_token: oidcAuth.user.id_token || '',
            access_token: oidcAuth.user.access_token,
            refresh_token: oidcAuth.user.refresh_token,
            profile: {
                ...oidcAuth.user.profile,
                sub: oidcAuth.user.profile.sub,
                email: oidcAuth.user.profile.email as string
            }
        } : null,
        error: oidcAuth.error ? new Error(oidcAuth.error.message || 'Authentication error') : null,

        // Actions
        signinRedirect: async () => {
            await oidcAuth.signinRedirect();
        },
        signoutRedirect: async () => {
            await oidcAuth.signoutRedirect();
        },
        removeUser: async () => {
            await oidcAuth.removeUser();
        },
        signinSilent: async () => {
            await oidcAuth.signinSilent();
        }
    }), [oidcAuth]);

    return (
        <UnifiedAuthContext.Provider value={unifiedAuth}>
            {children}
        </UnifiedAuthContext.Provider>
    );
}
