const config = {
    API_URL: process.env.NEXT_PUBLIC_POLYSYNERGY_API_URL,
    LOCAL_API_URL: process.env.NEXT_PUBLIC_POLYSYNERGY_LOCAL_API_URL,
    WEBSOCKET_URL: process.env.NEXT_PUBLIC_POLYSYNERGY_WEBSOCKET_URL,

    // Auth mode: 'cognito' (SAAS with AWS Cognito) or 'standalone' (self-hosted with custom JWT)
    AUTH_MODE: (process.env.NEXT_PUBLIC_AUTH_MODE || 'cognito') as 'cognito' | 'standalone',

    // Support links for alpha users
    SUPPORT_DISCORD_URL: 'https://discord.gg/g3atXten',
    SUPPORT_GITHUB_ISSUES_URL: 'https://github.com/dionsnoeijen/polysynergy/issues',
    SUPPORT_EMAIL: 'dion@polysynergy.com',
};

export default config;