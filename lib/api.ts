import type { ApiResponse } from "@/types";

/** Client-safe API path — always uses same origin (correct port in dev). */
export function apiPath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/** Parse JSON API responses; avoids "Unexpected token '<'" when server returns HTML errors. */
export async function parseJsonResponse<T = unknown>(
  response: Response
): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    const snippet = text.replace(/\s+/g, " ").slice(0, 120);
    throw new Error(
      response.ok
        ? "Server returned a non-JSON response"
        : `Request failed (${response.status}): ${snippet || response.statusText}`
    );
  }

  return response.json() as Promise<ApiResponse<T>>;
}
