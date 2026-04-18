"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Chat,
  PossessionProvider,
  PossessionZone,
  useWebSocket,
} from "possession-react";
import { ArrowRightEndOnRectangleIcon, ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";
import { getIdToken } from "@/api/auth/authToken";
import { useBranding } from "@/contexts/branding-context";
import { hexToRgba } from "@/utils/colorUtils";
import usePossessionPanelStore, { MIN_WIDTH, MAX_WIDTH } from "@/stores/possessionPanelStore";

const WS_BASE = process.env.NEXT_PUBLIC_API_WS_URL ?? "ws://localhost:8090";

function PanelInner({ token }: { token: string }) {
  const { accent_color } = useBranding();
  const toggle = usePossessionPanelStore((s) => s.toggle);

  const wsOptions = useMemo(() => ({ token }), [token]);
  const ws = useWebSocket(`${WS_BASE}/ws/v1/possession/chat`, wsOptions);

  useEffect(() => {
    if (!ws.pendingNavigate) return;
    // eslint-disable-next-line no-console
    console.log("[possession] navigate:", ws.pendingNavigate);
    ws.clearPendingNavigate();
  }, [ws]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-800">
      <div
        className="flex items-center gap-1 p-1 border-b dark:border-white/20"
        style={{ borderBottomColor: hexToRgba(accent_color, 0.5) }}
      >
        <button
          onClick={toggle}
          title="Collapse assistant"
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          style={{ color: accent_color }}
        >
          <ArrowRightEndOnRectangleIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600" />
        <button
          onClick={ws.connected ? undefined : ws.reconnect}
          className="flex-1 flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-zinc-100 dark:hover:bg-zinc-700/40 transition-colors"
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${ws.connected ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`}
          />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {ws.connected ? "Assistant connected" : "Disconnected · click to connect"}
          </span>
        </button>
      </div>

      <div
        className="h-[30%] border-b dark:border-white/20 overflow-y-auto flex-shrink-0"
        style={{ borderBottomColor: hexToRgba(accent_color, 0.5) }}
      >
        <PossessionZone
          name="inspector"
          components={ws.components}
          className="p-2 space-y-1"
          empty={
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 dark:text-gray-500 text-xs">Inspector empty</p>
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
          showStatus={false}
        />
      </div>
    </div>
  );
}

export function PossessionPanel() {
  const { accent_color } = useBranding();
  const [token, setToken] = useState<string | null>(null);

  const isOpen = usePossessionPanelStore((s) => s.isOpen);
  const width = usePossessionPanelStore((s) => s.width);
  const setWidth = usePossessionPanelStore((s) => s.setWidth);
  const toggle = usePossessionPanelStore((s) => s.toggle);

  useEffect(() => {
    setToken(getIdToken());
  }, []);

  const isResizingRef = useRef(false);

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizingRef.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev: MouseEvent) => {
        if (!isResizingRef.current) return;
        const next = window.innerWidth - ev.clientX;
        setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, next)));
      };
      const onUp = () => {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [setWidth]
  );

  if (!isOpen) {
    return (
      <button
        onClick={toggle}
        title="Open assistant"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 p-3 bg-white dark:bg-zinc-800 border border-r-0 dark:border-white/20 rounded-l shadow-sm"
        style={{ borderColor: hexToRgba(accent_color, 0.5) }}
      >
        <ArrowLeftEndOnRectangleIcon className="w-4 h-4" style={{ color: accent_color }} />
      </button>
    );
  }

  return (
    <div
      className="fixed right-0 top-0 h-screen z-40 border-l dark:border-white/20"
      style={{ width, borderLeftColor: hexToRgba(accent_color, 0.5) }}
    >
      <div
        onMouseDown={startResize}
        className="absolute left-0 top-0 bottom-0 w-[6px] -ml-[3px] cursor-col-resize z-10 hover:bg-zinc-300/50 dark:hover:bg-zinc-600/50"
      />
      <PossessionProvider>
        {token ? (
          <PanelInner token={token} />
        ) : (
          <div className="flex items-center justify-center h-full bg-white dark:bg-zinc-800">
            <p className="text-xs text-gray-400 dark:text-gray-500">Waiting for authentication...</p>
          </div>
        )}
      </PossessionProvider>
    </div>
  );
}
