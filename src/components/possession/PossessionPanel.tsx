"use client";

import { useEffect, useState } from "react";
import {
  Chat,
  PossessionProvider,
  PossessionZone,
  useWebSocket,
} from "possession-react";
import { getIdToken } from "@/api/auth/authToken";

const WS_BASE = process.env.NEXT_PUBLIC_API_WS_URL ?? "ws://localhost:8090";

function PanelInner() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getIdToken());
  }, []);

  const ws = useWebSocket(
    token ? `${WS_BASE}/ws/v1/possession/chat` : "",
    { token: token ?? undefined }
  );

  useEffect(() => {
    if (!ws.pendingNavigate) return;
    // TODO: wire ws.pendingNavigate.view + params to the editor stores.
    // For now we just log so you can see the agent's intent.
    // eslint-disable-next-line no-console
    console.log("[possession] navigate:", ws.pendingNavigate);
    ws.clearPendingNavigate();
  }, [ws]);

  return (
    <div className="flex flex-col h-full bg-white border-l border-zinc-200">
      <div className="h-[30%] border-b border-zinc-200 overflow-y-auto flex-shrink-0">
        <PossessionZone
          name="inspector"
          components={ws.components}
          className="p-2 space-y-1"
          empty={
            <div className="flex items-center justify-center h-full">
              <p className="text-zinc-400 text-sm">Inspector empty</p>
            </div>
          }
        />
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        <Chat
          theme="light"
          messages={ws.chat}
          streaming={ws.streaming}
          connected={ws.connected}
          onSend={ws.sendMessage}
          onReconnect={ws.reconnect}
          placeholder="Talk to orchestrator..."
          emptyMessage="Try: 'list my projects'"
        />
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  width?: number;
}

export function PossessionPanel({ open, onClose, width = 480 }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed right-0 top-0 h-screen shadow-xl z-50 flex flex-col"
      style={{ width }}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-l border-zinc-200">
        <span className="text-sm font-medium text-zinc-800">Assistant</span>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-800 text-sm"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <PossessionProvider>
          <PanelInner />
        </PossessionProvider>
      </div>
    </div>
  );
}
