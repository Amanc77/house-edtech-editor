"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { HEARTBEAT_INTERVAL_MS } from "@/constants";
import type { Operation, PresenceUser } from "@/types";
import { isSocketEnabled, getSocketUrl } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import { usePresenceStore } from "@/stores/presence-store";
import { useNetwork } from "./useNetwork";

export interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  socket: Socket | null;
}

export interface UseSocketOptions {
  documentId?: string;
  autoConnect?: boolean;
  onOperation?: (operation: Operation) => void;
  onPresenceUpdate?: (users: PresenceUser[]) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { documentId, autoConnect = true, onOperation, onPresenceUpdate } =
    options;

  const user = useAuthStore((s) => s.user);
  const { online } = useNetwork();
  const setUser = usePresenceStore((s) => s.setUser);
  const removeUser = usePresenceStore((s) => s.removeUser);
  const updateCursor = usePresenceStore((s) => s.updateCursor);
  const setTyping = usePresenceStore((s) => s.setTyping);
  const setDocumentId = usePresenceStore((s) => s.setDocumentId);
  const setLocalUserId = usePresenceStore((s) => s.setLocalUserId);

  const socketRef = useRef<Socket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onOperationRef = useRef(onOperation);
  const onPresenceUpdateRef = useRef(onPresenceUpdate);

  const [state, setState] = useState<SocketState>({
    connected: false,
    connecting: false,
    error: null,
    socket: null,
  });

  useEffect(() => {
    onOperationRef.current = onOperation;
    onPresenceUpdateRef.current = onPresenceUpdate;
  }, [onOperation, onPresenceUpdate]);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(
    (socket: Socket) => {
      clearHeartbeat();
      heartbeatRef.current = setInterval(() => {
        if (socket.connected && documentId) {
          socket.emit("presence:heartbeat", documentId);
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    [clearHeartbeat, documentId]
  );

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return socketRef.current;

    const socketUrl = getSocketUrl();
    if (!socketUrl || !isSocketEnabled()) {
      setState({
        connected: false,
        connecting: false,
        error: null,
        socket: null,
      });
      return null;
    }

    setState((s) => ({ ...s, connecting: true, error: null }));

    const socket = io(socketUrl, {
      autoConnect: false,
      path: "/api/socket",
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      setState({
        connected: true,
        connecting: false,
        error: null,
        socket,
      });
      startHeartbeat(socket);

      if (documentId) {
        socket.emit("document:join", documentId);
      }
    });

    socket.on("disconnect", (reason) => {
      setState((s) => ({
        ...s,
        connected: false,
        connecting: false,
        error:
          reason === "io server disconnect" ? "Disconnected by server" : null,
      }));
      clearHeartbeat();
    });

    socket.on("connect_error", (err) => {
      if (!isSocketEnabled()) return;
      setState({
        connected: false,
        connecting: false,
        error: err.message,
        socket,
      });
    });

    socket.on("operation", (operation: Operation) => {
      onOperationRef.current?.(operation);
    });

    socket.on("sync:applied", (payload: { operations?: Operation[] }) => {
      if (payload.operations) {
        for (const op of payload.operations) {
          onOperationRef.current?.(op);
        }
      }
    });

    socket.on("presence:join", ({ user: presenceUser }: { user: PresenceUser }) => {
      setUser(presenceUser);
    });

    socket.on("presence:leave", ({ userId }: { userId: string }) => {
      removeUser(userId);
    });

    socket.on("presence:state", ({ users }: { users: PresenceUser[] }) => {
      for (const u of users) {
        setUser(u);
      }
      onPresenceUpdateRef.current?.(users);
    });

    socket.on(
      "cursor:update",
      (payload: { userId: string; from: number; to: number }) => {
        updateCursor(payload.userId, { from: payload.from, to: payload.to });
      }
    );

    socket.on("typing:start", ({ userId }: { userId: string }) => {
      setTyping(userId, true);
    });

    socket.on("typing:stop", ({ userId }: { userId: string }) => {
      setTyping(userId, false);
    });

    socket.on("pong", () => {
      // heartbeat acknowledged
    });

    socketRef.current = socket;
    socket.connect();
    return socket;
  }, [
    user,
    documentId,
    startHeartbeat,
    clearHeartbeat,
    setUser,
    removeUser,
    updateCursor,
    setTyping,
  ]);

  const disconnect = useCallback(() => {
    clearHeartbeat();
    if (socketRef.current) {
      if (documentId) {
        socketRef.current.emit("document:leave", documentId);
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState({
      connected: false,
      connecting: false,
      error: null,
      socket: null,
    });
  }, [documentId, clearHeartbeat]);

  const emitOperation = useCallback((operation: Operation) => {
    socketRef.current?.emit("operation", operation);
  }, []);

  const emitCursor = useCallback(
    (cursor: { from: number; to: number } | null) => {
      if (!documentId || !user) return;
      socketRef.current?.emit("cursor:update", {
        documentId,
        from: cursor?.from ?? 0,
        to: cursor?.to ?? 0,
      });
    },
    [documentId, user]
  );

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!documentId || !user) return;
      socketRef.current?.emit(isTyping ? "typing:start" : "typing:stop", {
        documentId,
      });
    },
    [documentId, user]
  );

  useEffect(() => {
    if (user) {
      setLocalUserId(user.id);
    }
  }, [user, setLocalUserId]);

  useEffect(() => {
    setDocumentId(documentId ?? null);
  }, [documentId, setDocumentId]);

  useEffect(() => {
    if (!autoConnect || !online || !user || !isSocketEnabled()) return;
    const socket = connect();
    if (!socket) return;
    return () => {
      if (documentId) {
        socket.emit("document:leave", documentId);
      }
      disconnect();
    };
  }, [autoConnect, online, user, connect, disconnect, documentId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !documentId) return;

    socket.emit("document:join", documentId);
    return () => {
      socket.emit("document:leave", documentId);
    };
  }, [documentId]);

  return {
    ...state,
    connect,
    disconnect,
    emitOperation,
    emitCursor,
    emitTyping,
  };
}
