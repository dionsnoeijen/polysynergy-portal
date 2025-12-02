'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getBrandingSettings, BrandingSettings } from '@/api/brandingApi';

interface BrandingContextType extends BrandingSettings {
    isLoading: boolean;
    reload: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | null>(null);

const DEFAULT_BRANDING: BrandingSettings = {
    logo_url: null,
    accent_color: '#0ea5e9', // sky-500
};

export function BrandingProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<BrandingSettings>(DEFAULT_BRANDING);
    const [isLoading, setIsLoading] = useState(true);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const brandingSettings = await getBrandingSettings();
            console.log('[Branding Context] Loaded settings from API:', brandingSettings);
            setSettings(brandingSettings);
        } catch (error) {
            console.error('[Branding Context] Failed to load settings, using defaults:', error);
            setSettings(DEFAULT_BRANDING);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const value: BrandingContextType = {
        ...settings,
        isLoading,
        reload: loadSettings,
    };

    return (
        <BrandingContext.Provider value={value}>
            {children}
        </BrandingContext.Provider>
    );
}

/**
 * Hook to access branding settings
 * Returns logo URL and accent color for whitelabeling
 */
export function useBranding(): BrandingContextType {
    const context = useContext(BrandingContext);
    if (!context) {
        throw new Error('useBranding must be used within BrandingProvider');
    }
    return context;
}
