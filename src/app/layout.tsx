import '@/styles/tailwind.css';
import type { Metadata } from 'next';
import type React from 'react';
import {ThemeProvider} from "@/contexts/theme-context";

export const metadata: Metadata = {
    title: {
        template: '%s - PolySynergy',
        default: 'PolySynergy',
    },
    description: '',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://rsms.me/" />
                <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
            </head>
            <body>
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
