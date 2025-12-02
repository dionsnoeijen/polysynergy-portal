'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Subheading } from '@/components/heading';
import { Text } from '@/components/text';
import { useBranding } from '@/contexts/branding-context';
import { updateBrandingSettings, uploadLogo } from '@/api/brandingApi';
import useAccountsStore from '@/stores/accountsStore';
import config from '@/config';

export default function BrandingSettings() {
    const { logo_url, accent_color, reload } = useBranding();
    const loggedInAccount = useAccountsStore((state) => state.loggedInAccount);

    // Branding is only available for standalone/self-hosted mode
    const isStandalone = config.AUTH_MODE === 'standalone';

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(logo_url);
    const [accentColor, setAccentColor] = useState(accent_color);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Check if user is admin - role is in loggedInAccount, not in JWT
    const isAdmin = loggedInAccount?.role === 'admin';

    useEffect(() => {
        console.log('[Branding Settings] Logged in account:', loggedInAccount);
        console.log('[Branding Settings] Role:', loggedInAccount?.role);
        console.log('[Branding Settings] Is admin:', isAdmin);
        console.log('[Branding Settings] Accent color from context:', accent_color);
        console.log('[Branding Settings] Logo URL from context:', logo_url);
    }, [loggedInAccount, isAdmin, accent_color, logo_url]);

    useEffect(() => {
        setLogoPreview(logo_url);
        setAccentColor(accent_color);
    }, [logo_url, accent_color]);

    const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
            setError('Please upload a PNG, JPEG, or SVG file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        setLogoFile(file);
        setError(null);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!isAdmin) {
            setError('Only administrators can change branding settings');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Upload logo if changed
            if (logoFile) {
                await uploadLogo(logoFile);
            }

            // Update accent color
            await updateBrandingSettings({
                logo_url: logo_url, // Keep existing logo_url
                accent_color: accentColor,
            });

            // Reload branding context
            await reload();

            setSuccess(true);
            setLogoFile(null);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save branding settings');
        } finally {
            setIsLoading(false);
        }
    };

    // Hide branding settings in SaaS/Cognito mode
    if (!isStandalone) {
        return null;
    }

    if (!isAdmin) {
        return (
            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-1">
                    <Subheading>Branding</Subheading>
                    <Text>Only administrators can modify branding settings.</Text>
                </div>
                <div>
                    <Text className="text-zinc-500">Access restricted</Text>
                </div>
            </section>
        );
    }

    return (
        <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div className="space-y-1">
                <Subheading>Branding</Subheading>
                <Text>Customize logo and accent color</Text>
            </div>
            <div className="space-y-6">
                {/* Logo */}
                <div className="space-y-2">
                    <Text className="text-sm font-medium">Logo</Text>
                    <div className="flex items-center gap-4">
                        {logoPreview && (
                            <div className="flex items-center justify-center w-16 h-16 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                    src={logoPreview}
                                    alt="Logo"
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml"
                            onChange={handleLogoChange}
                            disabled={isLoading}
                            className="flex-1 text-sm text-zinc-600 dark:text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700"
                        />
                    </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                    <Text className="text-sm font-medium">Accent Color</Text>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            disabled={isLoading}
                            className="w-20 h-12 rounded-md border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                        />
                        <Input
                            type="text"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            placeholder="#0ea5e9"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-200">
                        Settings saved!
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button
                        color="sky"
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </section>
    );
}
