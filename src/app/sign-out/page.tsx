'use client';

import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export default function SignOutPage() {

  const auth = useAuth();

  useEffect(() => {
      auth.removeUser();
  }, [auth]);

  return <div>Signed out</div>;
}