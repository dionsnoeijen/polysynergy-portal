'use client';

import { useEffect, useState, ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from '@/components/dialog';
import {Button} from "@/components/button";

export function Global401Handler({ children }: { children: ReactNode }) {
  const [showKickout, setShowKickout] = useState(false);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        setShowKickout(true);
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <>
      {children}

      <Dialog open={showKickout} onClose={() => {}} size="sm" className="z-50">
        <DialogTitle>Session expired</DialogTitle>
        <DialogDescription>
          Your session has ended. Click below to sign in again.
        </DialogDescription>
        <DialogBody />
        <DialogActions>
          <Button
              color={"sky"}
              onClick={() => window.location.reload()}
          >
            Sign In
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}