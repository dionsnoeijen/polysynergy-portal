'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from '@/components/dialog';

export function Global401Handler({ children }: { children: ReactNode }) {
  const [showKickout, setShowKickout] = useState(false);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401) {
        setShowKickout(true);
      }
      return res;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <>
      {children}

      <Dialog
        open={showKickout}
        onClose={() => {}}
        size="sm"
        className="z-50"
      >
        <DialogTitle>Je bent uitgelogd</DialogTitle>
        <DialogDescription>
          Je sessie is verlopen. Klik op “Login” om opnieuw in te loggen.
        </DialogDescription>
        <DialogBody>
          {/* eventueel extra uitleg of een icoon */}
        </DialogBody>
        <DialogActions>
          <button
            className="px-4 py-2 rounded bg-brand text-white"
            onClick={() => {
              window.location.reload();
            }}
          >
            Login
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
}