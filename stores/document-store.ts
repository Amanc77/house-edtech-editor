import { create } from "zustand";
import type { DocumentMeta, DocumentPermission } from "@/types";

interface DocumentState {
  documents: DocumentMeta[];
  permissions: Record<string, DocumentPermission[]>;
  selectedDocumentId: string | null;
  isLoading: boolean;
  error: string | null;
  setDocuments: (documents: DocumentMeta[]) => void;
  addDocument: (document: DocumentMeta) => void;
  updateDocument: (id: string, updates: Partial<DocumentMeta>) => void;
  removeDocument: (id: string) => void;
  setPermissions: (documentId: string, permissions: DocumentPermission[]) => void;
  setSelectedDocumentId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getDocumentById: (id: string) => DocumentMeta | undefined;
  reset: () => void;
}

const initialState = {
  documents: [] as DocumentMeta[],
  permissions: {} as Record<string, DocumentPermission[]>,
  selectedDocumentId: null as string | null,
  isLoading: false,
  error: null as string | null,
};

export const useDocumentStore = create<DocumentState>((set, get) => ({
  ...initialState,
  setDocuments: (documents) => set({ documents, isLoading: false, error: null }),
  addDocument: (document) =>
    set((state) => ({
      documents: [document, ...state.documents.filter((d) => d.id !== document.id)],
    })),
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
    })),
  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
      selectedDocumentId:
        state.selectedDocumentId === id ? null : state.selectedDocumentId,
    })),
  setPermissions: (documentId, permissions) =>
    set((state) => ({
      permissions: { ...state.permissions, [documentId]: permissions },
    })),
  setSelectedDocumentId: (selectedDocumentId) => set({ selectedDocumentId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  getDocumentById: (id) => get().documents.find((doc) => doc.id === id),
  reset: () => set(initialState),
}));
