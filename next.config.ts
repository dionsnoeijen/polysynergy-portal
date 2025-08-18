import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    devIndicators: false,
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    env: {
        NEXT_PUBLIC_AWS_COGNITO_AUTHORITY: process.env.NEXT_PUBLIC_AWS_COGNITO_AUTHORITY,
        NEXT_PUBLIC_AWS_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN,
        NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID,
        NEXT_PUBLIC_AWS_COGNITO_LOGOUT_URL: process.env.NEXT_PUBLIC_AWS_COGNITO_LOGOUT_URL,
        NEXT_PUBLIC_AWS_COGNITO_REDIRECT_URL: process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_URL,
        NEXT_PUBLIC_POLYSYNERGY_API: process.env.NEXT_PUBLIC_POLYSYNERGY_API,
        NEXT_PUBLIC_POLYSYNERGY_WEBSOCKET_URL: process.env.NEXT_PUBLIC_POLYSYNERGY_WEBSOCKET_URL,
    },
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            canvas: false,
        };
        return config;
    },
};

export default nextConfig;
