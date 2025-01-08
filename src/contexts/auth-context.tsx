'use client';

import { AuthProvider } from "react-oidc-context";
import React from "react";

const cognitoAuthConfig = {
    authority: process.env.NEXT_PUBLIC_COGNITO_AUTHORITY,
    client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    redirect_uri: process.env.NEXT_PUBLIC_AWS_COGNITO_REDIRECT_URL,
    response_type: "code",
    scope: "phone openid email",
};

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
    return <AuthProvider {...cognitoAuthConfig}>{children}</AuthProvider>;
}