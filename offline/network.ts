export type NetworkEvent = "online" | "offline" | "change";

type NetworkListener = (online: boolean) => void;
type EventMap = {
  online: NetworkListener[];
  offline: NetworkListener[];
  change: NetworkListener[];
};

class NetworkMonitor {
  private listeners = new Set<NetworkListener>();
  private eventMap: EventMap = { online: [], offline: [], change: [] };
  private _online: boolean;

  constructor() {
    this._online = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  get online(): boolean {
    return this._online;
  }

  /** Subscribe to boolean online state changes. */
  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Typed event emitter for online/offline/change events. */
  on(event: NetworkEvent, listener: NetworkListener): () => void {
    this.eventMap[event].push(listener);
    return () => {
      this.eventMap[event] = this.eventMap[event].filter((l) => l !== listener);
    };
  }

  /** Emit to typed event listeners and generic subscribers. */
  emit(event: NetworkEvent, online: boolean): void {
    for (const listener of this.eventMap[event]) {
      listener(online);
    }
    if (event === "change") return;
    for (const listener of this.eventMap.change) {
      listener(online);
    }
  }

  async checkConnectivity(): Promise<boolean> {
    if (typeof navigator === "undefined") return true;
    if (!navigator.onLine) {
      this.setOnline(false);
      return false;
    }

    try {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${appUrl}/api/health`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const reachable = response.ok || response.status === 404;
      this.setOnline(reachable);
      return reachable;
    } catch {
      this.setOnline(navigator.onLine);
      return navigator.onLine;
    }
  }

  destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    this.listeners.clear();
    this.eventMap = { online: [], offline: [], change: [] };
  }

  private handleOnline = (): void => {
    this.setOnline(true);
  };

  private handleOffline = (): void => {
    this.setOnline(false);
  };

  private setOnline(online: boolean): void {
    if (this._online === online) return;
    this._online = online;

    for (const listener of this.listeners) {
      listener(online);
    }

    if (online) {
      this.emit("online", true);
    } else {
      this.emit("offline", false);
    }
    this.emit("change", online);
  }
}

export const networkMonitor = new NetworkMonitor();

export function isOnline(): boolean {
  return networkMonitor.online;
}

export function onNetworkChange(listener: NetworkListener): () => void {
  return networkMonitor.subscribe(listener);
}
