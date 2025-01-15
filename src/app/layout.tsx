import '@/styles/tailwind.css';
import type { Metadata } from 'next';
import type React from 'react';
import { ThemeProvider } from "@/contexts/theme-context";
import { AuthContextProvider } from "@/contexts/auth-context";
import AuthWrapper from "@/components/auth/auth-wrapper";
import AuthHandler from "@/components/auth/auth-handler";

export const metadata: Metadata = {
    title: {
        template: '%s - PolySynergy',
        default: 'PolySynergy',
    },
    description: '',
    icons: {
        icon: "/favicon.svg?v=2",
        apple: "/apple-touch-icon.png"
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://rsms.me/" />
                <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
                <title>PolySynergy</title>
            </head>
            <body>
                <ThemeProvider>
                    <AuthContextProvider>
                        <AuthHandler />
                        <AuthWrapper>{children}</AuthWrapper>
                    </AuthContextProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}