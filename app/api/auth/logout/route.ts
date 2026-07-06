import { signOut } from "@/lib/auth";

export async function POST() {
  await signOut({ redirect: false });
  return Response.json({ success: true, message: "Logged out" });
}
