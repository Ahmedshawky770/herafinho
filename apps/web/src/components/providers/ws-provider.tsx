"use client";

import * as React from "react";
import type { ID } from "@herafino/types";

export interface WSLocation {
  lat: string;
  lng: string;
  isAvailable: boolean;
}

export interface WSNotification {
  id?: string;
  title: string;
  body: string;
  createdAt?: string;
}

interface WebSocketContextValue {
  isConnected: boolean;
  lastLocation?: WSLocation;
  notifications: WSNotification[];
  send: (message: unknown) => void;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = React.createContext<WebSocketContextValue | null>(null);

async function fetchToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/ws-token");
    if (!res.ok) return null;
    const json = await res.json();
    return json.token ?? null;
  } catch {
    return null;
  }
}

export function WSProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: ID;
}) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastLocation, setLastLocation] = React.useState<WSLocation>();
  const [notifications, setNotifications] = React.useState<WSNotification[]>([]);
  const wsRef = React.useRef<WebSocket | null>(null);
  const reconnectRef = React.useRef<number | null>(null);
  const userIdRef = React.useRef<ID | undefined>(userId);
  const connectRef = React.useRef<() => void>(() => {});

  const connect = React.useCallback(() => {
    const currentUserId = userIdRef.current;
    if (!currentUserId || typeof window === "undefined") return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    let cancelled = false;
    void fetchToken().then((token) => {
      if (cancelled || !token) return;
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        // Server requires an auth:login message as the first frame.
        ws.send(JSON.stringify({ type: "auth:login", payload: { token } }));
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 3s if the user is still present.
        if (userIdRef.current && reconnectRef.current === null) {
          reconnectRef.current = window.setTimeout(() => {
            reconnectRef.current = null;
            connectRef.current();
          }, 3000);
        }
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "location:update" || data.type === "location:updated") {
            setLastLocation(data.payload ?? data);
          } else if (
            data.type === "notification:new" ||
            data.type === "notification"
          ) {
            setNotifications((prev) => [data.payload ?? data, ...prev].slice(0, 50));
          }
        } catch {
          // ignore parse errors
        }
      };

      wsRef.current = ws;
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Expose the latest connect implementation to non-React callbacks (onclose)
  // without capturing a stale closure.
  React.useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = React.useCallback(() => {
    if (reconnectRef.current !== null) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const send = React.useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  React.useEffect(() => {
    if (userId) connect();
    return () => disconnect();
  }, [userId, connect, disconnect]);

  return (
    <WebSocketContext.Provider
      value={{ isConnected, lastLocation, notifications, send, connect, disconnect }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWS() {
  const context = React.useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWS must be used within WSProvider");
  }
  return context;
}
