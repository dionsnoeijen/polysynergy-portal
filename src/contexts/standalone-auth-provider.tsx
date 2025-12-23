'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedAuthContext, UnifiedAuth, UnifiedAuthUser } from './unified-auth-context';
import { standaloneRefreshToken, standaloneLogout } from '@/api/standaloneAuthApi';

/**
 * Token Storage Keys
 */
const TOKEN_STORAGE_KEYS = {
    ACCESS_TOKEN: 'standalone_access_token',
    REFRESH_TOKEN: 'standalone_refresh_token',
    ID_TOKEN: 'standalone_id_token',
    EXPIRES_AT: 'standalone_expires_at',
    USER_PROFILE: 'standalone_user_profile',
} as const;

/**
 * StandaloneAuthProvider
 *
 * Manages authentication for standalone mode using JWT tokens.
 * Stores tokens in localStorage and handles automatic token refresh.
 */
export function StandaloneAuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UnifiedAuthUser | null>(null);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Clear all tokens from storage
     */
    const clearTokens = useCallback(() => {
        if (typeof window === 'undefined') return;

        Object.values(TOKEN_STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }, []);

    /**
     * Load tokens from localStorage
     */
    const loadStoredTokens = useCallback((): UnifiedAuthUser | null => {
        if (typeof window === 'undefined') return null;

        try {
            const idToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ID_TOKEN);
            const accessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
            const refreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
            const expiresAt = localStorage.getItem(TOKEN_STORAGE_KEYS.EXPIRES_AT);
            const profileJson = localStorage.getItem(TOKEN_STORAGE_KEYS.USER_PROFILE);

            if (!idToken || !accessToken || !profileJson) {
                return null;
            }

            // Check if token is expired
            if (expiresAt && Date.now() >= parseInt(expiresAt)) {
                // Clear expired tokens
                clearTokens();
                return null;
            }

            // Parse profile JSON with error handling
            let profile;
            try {
                profile = JSON.parse(profileJson);
            } catch (parseErr) {
                console.error('Failed to parse user profile JSON:', parseErr);
                // Clear corrupted data
                clearTokens();
                return null;
            }

            return {
                id_token: idToken,
                access_token: accessToken,
                refresh_token: refreshToken || undefined,
                profile,
            };
        } catch (err) {
            console.error('Failed to load stored tokens:', err);
            // Clear corrupted data
            clearTokens();
            return null;
        }
    }, [clearTokens]);

    /**
     * Save tokens to localStorage
     */
    const saveTokens = useCallback((
        idToken: string,
        accessToken: string,
        refreshToken: string | undefined,
        expiresIn: number,
        profile: UnifiedAuthUser['profile']
    ) => {
        if (typeof window === 'undefined') return;

        // Validate inputs to prevent storing "undefined" as string
        if (!idToken || idToken === 'undefined') {
            // This is normal during token refresh - refresh endpoint doesn't return id_token
            idToken = accessToken;
        }
        if (!accessToken || accessToken === 'undefined') {
            console.error('Invalid access_token');
            return;
        }
        if (!profile || typeof profile !== 'object') {
            console.error('Invalid profile');
            return;
        }

        localStorage.setItem(TOKEN_STORAGE_KEYS.ID_TOKEN, idToken);
        localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        if (refreshToken && refreshToken !== 'undefined') {
            localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }

        const expiresAt = Date.now() + (expiresIn * 1000);
        if (!isNaN(expiresAt)) {
            localStorage.setItem(TOKEN_STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
        }

        console.log('[Auth] Tokens saved:', {
            expiresIn: expiresIn + 's',
            expiresInMinutes: Math.floor(expiresIn / 60) + 'm',
            expiresAt: new Date(expiresAt),
        });

        localStorage.setItem(TOKEN_STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    }, []);

    /**
     * Refresh access token
     */
    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        const refreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken || refreshToken === 'undefined') {
            console.error('[Auth Refresh] No refresh token available');
            return false;
        }

        try {
            console.log('[Auth Refresh] Calling refresh API...');
            const response = await standaloneRefreshToken({ refresh_token: refreshToken });
            console.log('[Auth Refresh] API response:', response);

            const profileJson = localStorage.getItem(TOKEN_STORAGE_KEYS.USER_PROFILE);
            const profile = profileJson ? JSON.parse(profileJson) : { sub: '', email: '' };

            // Calculate expires_in from JWT token if not provided
            let expiresIn = response.expires_in;
            if (!expiresIn) {
                try {
                    const payload = JSON.parse(atob(response.access_token.split('.')[1]));
                    const exp = payload.exp;
                    const iat = payload.iat || Math.floor(Date.now() / 1000);
                    expiresIn = exp - iat;
                    console.log('[Auth Refresh] Calculated expires_in from JWT:', expiresIn);
                } catch (err) {
                    console.error('[Auth Refresh] Failed to decode JWT, using default 1800s:', err);
                    expiresIn = 1800; // Default 30 minutes
                }
            }

            // Use new refresh_token if provided, otherwise keep the old one
            const newRefreshToken = response.refresh_token || refreshToken;

            saveTokens(
                response.access_token, // Use access_token as id_token if id_token is missing
                response.access_token,
                newRefreshToken,
                expiresIn,
                profile
            );

            return true;
        } catch (err) {
            console.error('[Auth Refresh] Failed:', err);
            console.error('[Auth Refresh] Error details:', err instanceof Error ? err.message : err);
            clearTokens();
            return false;
        }
    }, [saveTokens, clearTokens]);

    /**
     * Initialize auth state from storage
     */
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);

            const storedUser = loadStoredTokens();

            if (storedUser) {
                // Try to refresh token if close to expiry
                const expiresAt = localStorage.getItem(TOKEN_STORAGE_KEYS.EXPIRES_AT);
                const timeUntilExpiry = expiresAt ? parseInt(expiresAt) - Date.now() : 0;

                console.log('[Auth] Init with stored tokens:', {
                    expiresAt: expiresAt ? new Date(parseInt(expiresAt)) : 'unknown',
                    timeUntilExpiry: Math.floor(timeUntilExpiry / 1000) + 's',
                });

                // Refresh if expires in less than 1 minute or already expired
                if (timeUntilExpiry < 60 * 1000) {
                    const refreshed = await refreshAccessToken();
                    if (refreshed) {
                        const refreshedUser = loadStoredTokens();
                        setUser(refreshedUser);
                        setIsAuthenticated(!!refreshedUser);
                    } else {
                        // Refresh failed, user needs to login again
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } else {
                    setUser(storedUser);
                    setIsAuthenticated(true);
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }

            setIsLoading(false);
        };

        initAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    /**
     * Auto-refresh token before expiry
     */
    useEffect(() => {
        if (!isAuthenticated) return;

        const checkAndRefresh = async () => {
            const expiresAt = localStorage.getItem(TOKEN_STORAGE_KEYS.EXPIRES_AT);
            if (!expiresAt) return;

            const timeUntilExpiry = parseInt(expiresAt) - Date.now();
            const timeInSeconds = Math.floor(timeUntilExpiry / 1000);

            // Only log when close to expiry or expired
            if (timeUntilExpiry < 120 * 1000) {
                console.log('[Auth] Token check:', {
                    now: new Date(),
                    expiresAt: new Date(parseInt(expiresAt)),
                    timeUntilExpiry: timeInSeconds + 's',
                    willRefresh: timeUntilExpiry < 60 * 1000 && timeUntilExpiry > 0
                });
            }

            // Refresh 1 minute before expiry
            if (timeUntilExpiry < 60 * 1000 && timeUntilExpiry > 0) {
                console.log('[Auth] Refreshing token (expires in ' + timeInSeconds + 's)...');
                const refreshed = await refreshAccessToken();

                if (refreshed) {
                    // CRITICAL: Update user state with new tokens
                    const refreshedUser = loadStoredTokens();
                    setUser(refreshedUser);
                    console.log('[Auth] ✅ Token refreshed successfully, new expiry:', localStorage.getItem(TOKEN_STORAGE_KEYS.EXPIRES_AT));
                } else {
                    console.error('[Auth] ❌ Token refresh failed');
                }
            } else if (timeUntilExpiry <= 0) {
                console.warn('[Auth] ⚠️ Token expired (' + Math.abs(timeInSeconds) + 's ago), logging out');
                clearTokens();
                setUser(null);
                setIsAuthenticated(false);
            }
        };

        // Check every 30 seconds
        const interval = setInterval(checkAndRefresh, 30 * 1000);

        // Also check immediately
        checkAndRefresh();

        return () => clearInterval(interval);
    }, [isAuthenticated, refreshAccessToken, loadStoredTokens, clearTokens]);

    /**
     * Sign in redirect - navigate to login page
     */
    const signinRedirect = useCallback(async () => {
        router.push('/login');
    }, [router]);

    /**
     * Sign out - clear tokens and redirect
     */
    const signoutRedirect = useCallback(async () => {
        if (user?.id_token) {
            await standaloneLogout(user.id_token);
        }
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        router.push('/login');
    }, [user, clearTokens, router]);

    /**
     * Remove user - same as signout for standalone
     */
    const removeUser = useCallback(async () => {
        await signoutRedirect();
    }, [signoutRedirect]);

    /**
     * Export login function for use by login page
     */
    const standaloneLogin = useCallback((
        idToken: string,
        accessToken: string,
        refreshToken: string | undefined,
        expiresIn: number,
        profile: UnifiedAuthUser['profile']
    ) => {
        saveTokens(idToken, accessToken, refreshToken, expiresIn, profile);

        const newUser: UnifiedAuthUser = {
            id_token: idToken,
            access_token: accessToken,
            refresh_token: refreshToken,
            profile,
        };

        setUser(newUser);
        setIsAuthenticated(true);
        setError(null);
    }, [saveTokens]);

    // Attach login function to window for use by login page
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as unknown as { standaloneLogin?: typeof standaloneLogin }).standaloneLogin = standaloneLogin;
        }
    }, [standaloneLogin]);

    const unifiedAuth: UnifiedAuth = {
        isLoading,
        isAuthenticated,
        user,
        error,
        signinRedirect,
        signoutRedirect,
        removeUser,
    };

    return (
        <UnifiedAuthContext.Provider value={unifiedAuth}>
            {children}
        </UnifiedAuthContext.Provider>
    );
}
