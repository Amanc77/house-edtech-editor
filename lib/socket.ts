/**
 * Socket.io is only available with the custom Node server (local dev / Railway / Render).
 * Vercel serverless cannot host WebSockets — disable in production unless a socket URL is set.
 */
export function isSocketEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_SOCKET_ENABLED === "false") {
    return false;
  }

  const url = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (!url) {
    return false;
  }

  if (typeof window !== "undefined") {
    const originHost = window.location.hostname;
    const isLocalOrigin =
      originHost === "localhost" || originHost === "127.0.0.1";
    const isLocalSocket =
      url.includes("localhost") || url.includes("127.0.0.1");

    // Never connect to localhost from a deployed origin
    if (isLocalSocket && !isLocalOrigin) {
      return false;
    }

    // Vercel/Netlify serverless cannot host Socket.io on the same origin
    if (!isLocalOrigin) {
      try {
        const socketHost = new URL(url).hostname;
        if (socketHost === originHost) {
          return false;
        }
      } catch {
        return false;
      }
    }
  }

  return true;
}

export function getSocketUrl(): string | null {
  if (!isSocketEnabled()) return null;
  return process.env.NEXT_PUBLIC_SOCKET_URL!.trim();
}
