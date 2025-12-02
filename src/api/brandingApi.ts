import config from '@/config';
import { getIdToken } from '@/api/auth/authToken';

/**
 * Branding API Client
 *
 * Manages whitelabeling settings for the entire installation.
 * Logo and accent color settings are global (not per tenant/project).
 */

export interface BrandingSettings {
    logo_url: string | null;
    accent_color: string;
}

/**
 * Get branding settings (public endpoint, no auth required)
 */
export async function getBrandingSettings(): Promise<BrandingSettings> {
    const response = await fetch(`${config.LOCAL_API_URL}/settings/branding/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        // Return defaults if endpoint fails
        return {
            logo_url: null,
            accent_color: '#0ea5e9', // sky-500
        };
    }

    return response.json();
}

/**
 * Update branding settings (admin only)
 */
export async function updateBrandingSettings(settings: BrandingSettings): Promise<BrandingSettings> {
    const idToken = getIdToken();

    const response = await fetch(`${config.LOCAL_API_URL}/settings/branding/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(settings),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update branding settings' }));
        throw new Error(error.message || 'Failed to update branding settings');
    }

    return response.json();
}

/**
 * Upload logo file (admin only)
 * Accepts: image/png, image/jpeg, image/svg+xml
 */
export async function uploadLogo(file: File): Promise<BrandingSettings> {
    const idToken = getIdToken();

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.LOCAL_API_URL}/settings/branding/logo`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to upload logo' }));
        throw new Error(error.message || 'Failed to upload logo');
    }

    return response.json();
}
