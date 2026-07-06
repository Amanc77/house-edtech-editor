import { create } from "zustand";
import type { PresenceUser } from "@/types";
import { PRESENCE_COLORS } from "@/constants";

interface PresenceState {
  documentId: string | null;
  users: Record<string, PresenceUser>;
  localUserId: string | null;
  setDocumentId: (id: string | null) => void;
  setLocalUserId: (userId: string | null) => void;
  setUser: (user: PresenceUser) => void;
  removeUser: (userId: string) => void;
  updateCursor: (
    userId: string,
    cursor: { from: number; to: number } | null
  ) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  clearStaleUsers: (maxAgeMs?: number) => void;
  getActiveUsers: () => PresenceUser[];
  reset: () => void;
}

const initialState = {
  documentId: null as string | null,
  users: {} as Record<string, PresenceUser>,
  localUserId: null as string | null,
};

export function assignPresenceColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length];
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  ...initialState,
  setDocumentId: (documentId) => set({ documentId, users: {} }),
  setLocalUserId: (localUserId) => set({ localUserId }),
  setUser: (user) =>
    set((state) => ({
      users: {
        ...state.users,
        [user.userId]: {
          ...user,
          color: user.color || assignPresenceColor(user.userId),
          lastSeen: Date.now(),
        },
      },
    })),
  removeUser: (userId) =>
    set((state) => {
      const rest = { ...state.users };
      delete rest[userId];
      return { users: rest };
    }),
  updateCursor: (userId, cursor) =>
    set((state) => {
      const existing = state.users[userId];
      if (!existing) return state;
      return {
        users: {
          ...state.users,
          [userId]: { ...existing, cursor, lastSeen: Date.now() },
        },
      };
    }),
  setTyping: (userId, isTyping) =>
    set((state) => {
      const existing = state.users[userId];
      if (!existing) return state;
      return {
        users: {
          ...state.users,
          [userId]: { ...existing, isTyping, lastSeen: Date.now() },
        },
      };
    }),
  clearStaleUsers: (maxAgeMs = 60000) =>
    set((state) => {
      const now = Date.now();
      const users: Record<string, PresenceUser> = {};
      for (const [id, user] of Object.entries(state.users)) {
        if (now - user.lastSeen <= maxAgeMs) {
          users[id] = user;
        }
      }
      return { users };
    }),
  getActiveUsers: () => {
    const { users, localUserId } = get();
    return Object.values(users).filter((u) => u.userId !== localUserId);
  },
  reset: () => set(initialState),
}));
