import { useContext } from 'react';
import { UnifiedAuthContext, UnifiedAuth } from '@/contexts/unified-auth-context';

/**
 * useUnifiedAuth Hook
 *
 * This is the ONLY auth hook that components should use.
 * It works with both Cognito and Standalone auth modes.
 *
 * Usage:
 * ```tsx
 * const auth = useUnifiedAuth();
 *
 * // Access auth state
 * auth.isLoading
 * auth.isAuthenticated
 * auth.user?.profile.email
 * auth.user?.id_token
 *
 * // Perform actions
 * auth.signinRedirect()
 * auth.signoutRedirect()
 * auth.removeUser()
 * ```
 */
export function useUnifiedAuth(): UnifiedAuth {
    const context = useContext(UnifiedAuthContext);

    if (!context) {
        throw new Error(
            'useUnifiedAuth must be used within UnifiedAuthProvider. ' +
            'Make sure your component is wrapped with <UnifiedAuthProvider> in layout.tsx'
        );
    }

    return context;
}
