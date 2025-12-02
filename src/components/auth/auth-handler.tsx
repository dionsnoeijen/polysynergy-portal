'use client';

import { useEffect } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { setIdToken } from "@/api/auth/authToken";

const AuthHandler = () => {
    const auth = useUnifiedAuth();

    useEffect(() => {
        if (auth?.user?.id_token) {
            setIdToken(auth.user.id_token);
        }
    }, [auth]);

    return null;
};

export default AuthHandler;