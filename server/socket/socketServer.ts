import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { getToken } from "next-auth/jwt";
import { PRESENCE_COLORS, CURSOR_THROTTLE_MS } from "@/constants";
import { connectDB } from "@/server/db/connection";
import { documentRepository } from "@/server/repositories/document.repository";
import { permissionService } from "@/server/services/permission.service";
import { syncService } from "@/server/services/sync.service";
import { syncPayloadSchema } from "@/schemas/sync.schema";
import type { DocumentRole, PresenceUser } from "@/types";

interface SocketData {
  userId: string;
  name: string;
  image?: string | null;
  color: string;
}

interface DocumentRoomState {
  users: Map<string, PresenceUser>;
}

const documentRooms = new Map<string, DocumentRoomState>();
const userColors = new Map<string, string>();
let colorIndex = 0;

function getUserColor(userId: string): string {
  const existing = userColors.get(userId);
  if (existing) return existing;

  const color = PRESENCE_COLORS[colorIndex % PRESENCE_COLORS.length]!;
  colorIndex++;
  userColors.set(userId, color);
  return color;
}

function getRoomState(documentId: string): DocumentRoomState {
  let state = documentRooms.get(documentId);
  if (!state) {
    state = { users: new Map() };
    documentRooms.set(documentId, state);
  }
  return state;
}

function broadcastPresence(io: Server, documentId: string): void {
  const state = documentRooms.get(documentId);
  if (!state) return;

  const users = Array.from(state.users.values());
  io.to(`document:${documentId}`).emit("presence:state", { users });
}

function removeUserFromRoom(
  io: Server,
  socket: Socket,
  documentId: string
): void {
  const state = documentRooms.get(documentId);
  if (!state) return;

  state.users.delete(socket.data.userId);
  if (state.users.size === 0) {
    documentRooms.delete(documentId);
  }

  socket.to(`document:${documentId}`).emit("presence:leave", {
    userId: socket.data.userId,
  });
  broadcastPresence(io, documentId);
}

export function initSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket",
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use(async (socket, next) => {
    try {
      const authToken =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      const decoded = await getToken({
        req: authToken
          ? ({
              headers: { authorization: `Bearer ${authToken}` },
              cookies: { "authjs.session-token": authToken },
            } as never)
          : (socket.request as never),
        secret: process.env.AUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production",
      });

      if (!decoded?.sub && !decoded?.id) {
        return next(new Error("Invalid token"));
      }

      const userId = (decoded.id ?? decoded.sub) as string;
      socket.data = {
        userId,
        name: (decoded.name as string) ?? "Anonymous",
        image: (decoded.picture as string) ?? null,
        color: getUserColor(userId),
      } satisfies SocketData;

      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, name, image, color } = socket.data as SocketData;
    const joinedDocuments = new Set<string>();
    const cursorThrottle = new Map<string, number>();

    socket.on("document:join", async (documentId: string, callback?) => {
      try {
        await connectDB();

        const document = await documentRepository.findById(documentId);
        if (!document) {
          callback?.({ success: false, error: "Document not found" });
          return;
        }

        const role = await permissionService.getUserRole(
          documentId,
          userId,
          document.ownerId
        );

        if (!role) {
          callback?.({ success: false, error: "Access denied" });
          return;
        }

        const room = `document:${documentId}`;
        await socket.join(room);
        joinedDocuments.add(documentId);

        const state = getRoomState(documentId);
        const presence: PresenceUser = {
          userId,
          name,
          image,
          color,
          role,
          cursor: null,
          isTyping: false,
          lastSeen: Date.now(),
        };
        state.users.set(userId, presence);

        socket.to(room).emit("presence:join", { user: presence });
        broadcastPresence(io, documentId);

        callback?.({
          success: true,
          role,
          users: Array.from(state.users.values()),
        });
      } catch (error) {
        callback?.({
          success: false,
          error: error instanceof Error ? error.message : "Join failed",
        });
      }
    });

    socket.on("document:leave", (documentId: string) => {
      if (!joinedDocuments.has(documentId)) return;

      socket.leave(`document:${documentId}`);
      joinedDocuments.delete(documentId);
      removeUserFromRoom(io, socket, documentId);
    });

    socket.on(
      "cursor:update",
      (payload: { documentId: string; from: number; to: number }) => {
        const { documentId, from, to } = payload;
        if (!joinedDocuments.has(documentId)) return;

        const now = Date.now();
        const lastUpdate = cursorThrottle.get(documentId) ?? 0;
        if (now - lastUpdate < CURSOR_THROTTLE_MS) return;
        cursorThrottle.set(documentId, now);

        const state = documentRooms.get(documentId);
        const user = state?.users.get(userId);
        if (user) {
          user.cursor = { from, to };
          user.lastSeen = now;
        }

        socket.to(`document:${documentId}`).emit("cursor:update", {
          userId,
          from,
          to,
        });
      }
    );

    socket.on(
      "typing:start",
      (payload: { documentId: string }) => {
        const { documentId } = payload;
        if (!joinedDocuments.has(documentId)) return;

        const state = documentRooms.get(documentId);
        const user = state?.users.get(userId);
        if (user) {
          user.isTyping = true;
          user.lastSeen = Date.now();
        }

        socket.to(`document:${documentId}`).emit("typing:start", { userId });
      }
    );

    socket.on(
      "typing:stop",
      (payload: { documentId: string }) => {
        const { documentId } = payload;
        if (!joinedDocuments.has(documentId)) return;

        const state = documentRooms.get(documentId);
        const user = state?.users.get(userId);
        if (user) {
          user.isTyping = false;
          user.lastSeen = Date.now();
        }

        socket.to(`document:${documentId}`).emit("typing:stop", { userId });
      }
    );

    socket.on("sync:operations", async (payload, callback?) => {
      try {
        const validated = syncPayloadSchema.safeParse(payload);
        if (!validated.success) {
          callback?.({ success: false, error: "Invalid sync payload" });
          return;
        }

        const { documentId } = validated.data;

        if (!joinedDocuments.has(documentId)) {
          callback?.({ success: false, error: "Not joined to document" });
          return;
        }

        const document = await documentRepository.findById(documentId);
        if (!document) {
          callback?.({ success: false, error: "Document not found" });
          return;
        }

        const canWrite = await permissionService.canWrite(
          documentId,
          userId,
          document.ownerId
        );

        if (!canWrite) {
          callback?.({
            success: false,
            error: "Viewers cannot submit write operations",
          });
          return;
        }

        const result = await syncService.syncOperations(
          userId,
          validated.data
        );

        io.to(`document:${documentId}`).emit("sync:applied", {
          documentId,
          version: result.version,
          lamportClock: result.lamportClock,
          appliedBy: userId,
          appliedCount: result.appliedOperations.length,
        });

        callback?.({ success: true, data: result });
      } catch (error) {
        callback?.({
          success: false,
          error: error instanceof Error ? error.message : "Sync failed",
        });
      }
    });

    socket.on("presence:heartbeat", (documentId: string) => {
      if (!joinedDocuments.has(documentId)) return;

      const state = documentRooms.get(documentId);
      const user = state?.users.get(userId);
      if (user) {
        user.lastSeen = Date.now();
      }
    });

    socket.on("disconnect", () => {
      for (const documentId of joinedDocuments) {
        removeUserFromRoom(io, socket, documentId);
      }
      joinedDocuments.clear();
    });
  });

  return io;
}

export function getPresenceForDocument(documentId: string): PresenceUser[] {
  const state = documentRooms.get(documentId);
  if (!state) return [];
  return Array.from(state.users.values());
}

export function getUserRoleInRoom(
  documentId: string,
  userId: string
): DocumentRole | null {
  const state = documentRooms.get(documentId);
  return state?.users.get(userId)?.role ?? null;
}
