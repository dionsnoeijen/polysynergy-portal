'use client';

import React from "react";
import {ClipboardDocumentCheckIcon} from "@heroicons/react/24/outline";

type Props = {
  x: number;
  y: number;
};

export default function ClipboardIndicator({ x, y }: Props) {
  return (
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{
        top: y + 16,
        left: x + 16,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="px-2 py-1 text-xs rounded bg-green-500 text-white shadow-lg">
        <ClipboardDocumentCheckIcon className={'w-5 h-5 text-white'} />
      </div>
    </div>
  );
}