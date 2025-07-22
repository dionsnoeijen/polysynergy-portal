import { useEffect, useRef } from "react";

export default function useWebSocket(
    url: string,
    onMessage: (msg: MessageEvent) => void
) {
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log("🔌 WebSocket verbonden");
        };

        ws.current.onmessage = onMessage;

        ws.current.onerror = (e) => {
            console.error("❌ WebSocket error", e);
        };

        ws.current.onclose = () => {
            console.log("🔌 WebSocket gesloten");
        };

        return () => {
            ws.current?.close();
        };
    }, [url, onMessage]);
}