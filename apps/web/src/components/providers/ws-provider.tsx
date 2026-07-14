"use client";

import * as React from "react";
import type { ID } from "@herafino/types";

interface WebSocketContextValue {
  isConnected: boolean;
  lastLocation?: {
    lat: string;
    lng: string;
    isAvailable: boolean;
  };
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = React.createContext<WebSocketContextValue | null>(null);

export function WSProvider({ 
  children, 
  userId, 
  token 
}: { 
  children: React.ReactNode;
  userId?: ID;
  token?: string;
}) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastLocation, setLastLocation] = React.useState<WebSocketContextValue["lastLocation"]>();
  const wsRef = React.useRef<WebSocket | null>(null);

  const connect = React.useCallback(() => {
    if (!userId || !token) return;
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const ws = new WebSocket(`${wsUrl}?userId=${userId}&token=${token}`);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "location_update") {
          setLastLocation(data.payload);
        }
      } catch {
        // ignore parse error
      }
    };
    
    wsRef.current = ws;
  }, [userId, token]);

  const disconnect = React.useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  React.useEffect(() => {
    if (userId && token) {
      connect();
    }
    return () => disconnect();
  }, [userId, token, connect, disconnect]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastLocation, connect, disconnect }}>
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