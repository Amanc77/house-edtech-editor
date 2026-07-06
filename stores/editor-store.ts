import { create } from "zustand";
import type { SyncStatus } from "@/types";
import { computeCharCount, computeWordCount } from "@/utils/content";

interface EditorState {
  documentId: string | null;
  title: string;
  content: string;
  version: number;
  wordCount: number;
  charCount: number;
  isDirty: boolean;
  isSaving: boolean;
  syncStatus: SyncStatus;
  lastSavedAt: string | null;
  clientId: string;
  lamportClock: number;
  vectorClock: Record<string, number>;
  setDocumentId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setVersion: (version: number) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSavedAt: (timestamp: string) => void;
  incrementLamportClock: () => number;
  setVectorClock: (clock: Record<string, number>) => void;
  bumpVectorClock: (clientId: string) => void;
  loadDocument: (params: {
    documentId: string;
    title: string;
    content: string;
    version: number;
    clientId: string;
  }) => void;
  reset: () => void;
}

function deriveCounts(content: string) {
  return {
    wordCount: computeWordCount(content),
    charCount: computeCharCount(content),
  };
}

const initialState = {
  documentId: null as string | null,
  title: "",
  content: "",
  version: 0,
  wordCount: 0,
  charCount: 0,
  isDirty: false,
  isSaving: false,
  syncStatus: "synced" as SyncStatus,
  lastSavedAt: null as string | null,
  clientId: "",
  lamportClock: 0,
  vectorClock: {} as Record<string, number>,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,
  setDocumentId: (documentId) => set({ documentId }),
  setTitle: (title) => set({ title, isDirty: true }),
  setContent: (content) =>
    set({ content, isDirty: true, ...deriveCounts(content) }),
  setVersion: (version) => set({ version }),
  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (isSaving) => set({ isSaving }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setLastSavedAt: (lastSavedAt) =>
    set({ lastSavedAt, isDirty: false, isSaving: false }),
  incrementLamportClock: () => {
    const next = get().lamportClock + 1;
    set({ lamportClock: next });
    return next;
  },
  setVectorClock: (vectorClock) => set({ vectorClock }),
  bumpVectorClock: (clientId) =>
    set((state) => ({
      vectorClock: {
        ...state.vectorClock,
        [clientId]: (state.vectorClock[clientId] ?? 0) + 1,
      },
    })),
  loadDocument: ({ documentId, title, content, version, clientId }) =>
    set({
      documentId,
      title,
      content,
      version,
      clientId,
      lamportClock: version,
      vectorClock: { [clientId]: version },
      isDirty: false,
      isSaving: false,
      syncStatus: "synced",
      ...deriveCounts(content),
    }),
  reset: () => set(initialState),
}));
