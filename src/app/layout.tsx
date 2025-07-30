import '@/styles/tailwind.css';
import Script from 'next/script'
import {ThemeProvider} from '@/contexts/theme-context'
import {AuthContextProvider} from '@/contexts/auth-context'
import AuthHandler from '@/components/auth/auth-handler'
import AuthWrapper from '@/components/auth/auth-wrapper'
import type {ReactNode} from 'react'
import {Global401Handler} from "@/components/global-401-handler";

export default function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <Script
                id="theme-init"
                strategy="beforeInteractive"
                dangerouslySetInnerHTML={{
                    __html: `(function(){
  const saved = localStorage.getItem('theme');
  const useDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (useDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();`
                }}
            />
            <style
                dangerouslySetInnerHTML={{
                    __html: `
  html, body { margin:0; padding:0; height:100%; }
  html[data-theme="light"] { background: #ffffff !important; }
  html[data-theme="dark"]  { background: #0a0a0a !important; }
  body { background: transparent !important; }
`
                }}
            />
            <link rel="preconnect" href="https://rsms.me/"/>
            <link rel="stylesheet" href="https://rsms.me/inter/inter.css"/>
            <title>PolySynergy</title>
        </head>
        <body>
            <ThemeProvider>
                <AuthContextProvider>
                    <AuthHandler/>
                    <AuthWrapper><Global401Handler>{children}</Global401Handler></AuthWrapper>
                </AuthContextProvider>
            </ThemeProvider>
        </body>
        </html>
    )
}