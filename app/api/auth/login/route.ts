import { AuthError } from "next-auth";
import { auth, signIn } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json() as { email: string; password: string };

    await signIn("credentials", {
      email: body.email,
      password: body.password,
      redirect: false,
    });

    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      data: { user: session.user },
      message: "Login successful",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }
    return Response.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
