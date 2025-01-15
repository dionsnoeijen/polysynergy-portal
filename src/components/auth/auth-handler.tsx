'use client';

import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { setIdToken } from "@/api/auth/authToken";

const AuthHandler = () => {
    const auth = useAuth();

    useEffect(() => {
        if (auth?.user?.id_token) {
            setIdToken(auth.user.id_token);
        }
    }, [auth]);

    return null;
};

export default AuthHandler;