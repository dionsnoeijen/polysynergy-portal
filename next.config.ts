import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    devIndicators: {
        appIsrStatus: false, // Disable the "isr" indicator (icon bottom left during dev)
    },
};

export default nextConfig;
