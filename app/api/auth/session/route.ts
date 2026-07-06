import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  return Response.json({
    success: true,
    data: { user: session?.user ?? null },
  });
}
