import { authController } from "@/server/controllers/auth.controller";

export async function GET() {
  return authController.getProfile();
}

export async function PATCH(req: Request) {
  return authController.updateProfile(req);
}
