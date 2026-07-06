/** Client-safe API path — always uses same origin (correct port in dev). */
export function apiPath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}
