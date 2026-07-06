import { auth } from "@/lib/auth";
import type { AuthenticatedSession } from "@/types";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function getAuthSession(): Promise<AuthenticatedSession | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
    image: session.user.image,
  };
}

export async function requireAuth(): Promise<AuthenticatedSession> {
  const session = await getAuthSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

export function unauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ success: false, error: "Unauthorized" }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function forbiddenResponse(message = "Forbidden"): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function withAuth<T>(
  handler: (session: AuthenticatedSession) => Promise<T>
): Promise<T | Response> {
  try {
    const session = await requireAuth();
    return handler(session);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse();
    }
    throw error;
  }
}
