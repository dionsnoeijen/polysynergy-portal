import config from '@/config';

/**
 * Standalone Authentication API Client
 *
 * Handles all authentication-related API calls for standalone mode.
 * Uses the LOCAL_API_URL for self-hosted installations.
 */

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    id_token: string;
    expires_in: number;
    user: {
        sub: string;
        email: string;
        name?: string;
        [key: string]: unknown;
    };
}

export interface RegisterRequest {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
}

export interface RegisterResponse {
    message: string;
    user: {
        sub: string;
        email: string;
        [key: string]: unknown;
    };
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface RefreshTokenResponse {
    access_token: string;
    id_token: string;
    expires_in: number;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetResponse {
    message: string;
}

/**
 * Login with email and password
 */
export async function standaloneLogin(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${config.LOCAL_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Login failed');
    }

    return response.json();
}

/**
 * Register a new user
 */
export async function standaloneRegister(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${config.LOCAL_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(error.message || 'Registration failed');
    }

    return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function standaloneRefreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await fetch(`${config.LOCAL_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Token refresh failed' }));
        throw new Error(error.message || 'Token refresh failed');
    }

    return response.json();
}

/**
 * Request password reset email
 */
export async function standalonePasswordReset(data: PasswordResetRequest): Promise<PasswordResetResponse> {
    const response = await fetch(`${config.LOCAL_API_URL}/auth/password-reset`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Password reset request failed' }));
        throw new Error(error.message || 'Password reset request failed');
    }

    return response.json();
}

/**
 * Logout (clears server-side session if applicable)
 */
export async function standaloneLogout(idToken: string): Promise<void> {
    await fetch(`${config.LOCAL_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${idToken}`,
        },
    });
    // Don't throw on error - always allow local logout
}
