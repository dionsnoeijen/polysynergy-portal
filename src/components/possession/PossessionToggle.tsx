"use client";

import { useState } from "react";
import { PossessionPanel } from "./PossessionPanel";

/**
 * Floating toggle that opens the possession assistant panel.
 * Drop it once near the top of the app tree; it positions itself.
 */
export function PossessionToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center"
        title="Assistant"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
      </button>
      <PossessionPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
