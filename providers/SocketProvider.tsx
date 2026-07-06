"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useSocket, type UseSocketOptions } from "@/hooks/useSocket";
import type { Socket } from "socket.io-client";
import type { Operation, PresenceUser } from "@/types";

interface SocketContextValue {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  socket: Socket | null;
  connect: () => Socket;
  disconnect: () => void;
  emitOperation: (operation: Operation) => void;
  emitCursor: (cursor: { from: number; to: number } | null) => void;
  emitTyping: (isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps extends UseSocketOptions {
  children: ReactNode;
}

export function SocketProvider({
  children,
  documentId,
  autoConnect = true,
  onOperation,
  onPresenceUpdate,
}: SocketProviderProps) {
  const socketState = useSocket({
    documentId,
    autoConnect,
    onOperation,
    onPresenceUpdate,
  });

  const value = useMemo<SocketContextValue>(
    () => ({
      connected: socketState.connected,
      connecting: socketState.connecting,
      error: socketState.error,
      socket: socketState.socket,
      connect: socketState.connect,
      disconnect: socketState.disconnect,
      emitOperation: socketState.emitOperation,
      emitCursor: socketState.emitCursor,
      emitTyping: socketState.emitTyping,
    }),
    [
      socketState.connected,
      socketState.connecting,
      socketState.error,
      socketState.socket,
      socketState.connect,
      socketState.disconnect,
      socketState.emitOperation,
      socketState.emitCursor,
      socketState.emitTyping,
    ]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within SocketProvider");
  }
  return context;
}

export type { PresenceUser };
