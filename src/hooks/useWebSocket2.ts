"use client";
import { useEffect, useRef, useState } from "react";

interface WSMessage {
  type?: string;
  data?: unknown;
  [key: string]: unknown;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useWebSocket(url: string, token: string | null, onMessage: (msg: WSMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "open" | "closed">("idle");
  const status = token ? connectionStatus : "idle";
  const retryDelayRef = useRef(1000);
  const reconnectTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Close socket on tab close / refresh / mobile background
  useEffect(() => {
    function handleTabClose() {
      if (wsRef.current) {
        wsRef.current.close(1000, "Tab closed or refreshed");
        wsRef.current = null;
      }
    }

    window.addEventListener("beforeunload", handleTabClose);
    window.addEventListener("pagehide", handleTabClose);

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
      window.removeEventListener("pagehide", handleTabClose);
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // If no token → ensure socket is closed
    if (!token) {
      if (wsRef.current) {
        wsRef.current.close(1000, "Token missing - closing");
        wsRef.current = null;
      }
      return;
    }

    const fullUrl = `wss://${API_URL}/ws/${url}/?token=${token}`;

    function connect() {
      if (!token || !isMountedRef.current) return;

      setConnectionStatus("connecting");
      const ws = new WebSocket(fullUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setConnectionStatus("open");
        retryDelayRef.current = 1000;
      };

      ws.onmessage = (ev) => {
        if (!isMountedRef.current) return;

        try {
          const parsed: WSMessage = JSON.parse(ev.data);
          onMessage(parsed);
        } catch (err) {
          console.error("Failed to parse WS message:", err, ev.data);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;

        setConnectionStatus("closed");
        wsRef.current = null;

        // If user logged out → do NOT reconnect
        if (!token) return;

        const delay = retryDelayRef.current;
        retryDelayRef.current = Math.min(delay * 2, 30000);

        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };
    }

    connect();

    // Cleanup on component unmount or route switch
    return () => {
      isMountedRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (wsRef.current) {
        try {
          wsRef.current.close(1000, "Component unmounted");
        } catch {
          /* ignore close errors */
        }
        wsRef.current = null;
      }

      setConnectionStatus("idle");
      retryDelayRef.current = 1000;
    };
  }, [url, token]);

  return { status };
}
