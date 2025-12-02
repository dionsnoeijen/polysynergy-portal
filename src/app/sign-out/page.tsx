'use client';

import { useEffect } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

export default function SignOutPage() {

  const auth = useUnifiedAuth();

  useEffect(() => {
      auth.removeUser();
  }, [auth]);

  return <div>Signed out</div>;
}