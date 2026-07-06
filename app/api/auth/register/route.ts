import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { authController } from "@/server/controllers/auth.controller";
import { errorResponse } from "@/server/middleware/validatePayload";

export async function POST(req: Request) {
  const body = await req.json() as { email: string; password: string; name: string };

  const registerReq = new Request(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const registerResponse = await authController.register(registerReq);
  if (!registerResponse.ok) {
    return registerResponse;
  }

  try {
    await signIn("credentials", {
      email: body.email,
      password: body.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(
        "Account created but sign-in failed. Please log in manually.",
        201
      );
    }
    throw error;
  }

  return registerResponse;
}
