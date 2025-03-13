import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    devIndicators: {
        appIsrStatus: false, // Disable the "isr" indicator (icon bottom left during dev)
    },
    env: {
        NEXT_PUBLIC_AWS_COGNITO_AUTHORITY: process.env.NEXT_PUBLIC_AWS_COGNITO_AUTHORITY,
        NEXT_PUBLIC_AWS_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN,
        NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID,
        NEXT_PUBLIC_AWS_COGNITO_LOGOUT_URL: process.env.NEXT_PUBLIC_AWS_COGNITO_LOGOUT_URL,
        NEXT_PUBLIC_AWS_COGNITO_REDIRECT_URL: process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_URL,
        NEXT_PUBLIC_POLYSYNERGY_API: process.env.NEXT_PUBLIC_POLYSYNERGY_API,
    },
    publicRuntimeConfig: {
        NEXT_PUBLIC_POLYSYNERGY_API: process.env.NEXT_PUBLIC_POLYSYNERGY_API,
    },
};

export default nextConfig;
