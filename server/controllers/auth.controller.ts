import { registerSchema, loginSchema } from "@/schemas/auth.schema";
import { authService } from "@/server/services/auth.service";
import {
  applyRateLimit,
  rateLimitResponse,
  rateLimitHeaders,
} from "@/server/middleware/rateLimiter";
import {
  parseJsonBody,
  validateBody,
  successResponse,
  handleServiceError,
} from "@/server/middleware/validatePayload";
import { requireAuth } from "@/server/middleware/authMiddleware";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  image: z.string().url().nullable().optional(),
});

export const authController = {
  async register(req: Request): Promise<Response> {
    const rateLimit = applyRateLimit(req);
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    const body = await parseJsonBody(req);
    if (body instanceof Response) return body;

    const validated = validateBody(registerSchema, body);
    if (!validated.success) return validated.response;

    try {
      const user = await authService.register(validated.data);
      return new Response(
        JSON.stringify({ success: true, data: user, message: "Registration successful" }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            ...rateLimitHeaders(rateLimit),
          },
        }
      );
    } catch (error) {
      return handleServiceError(error);
    }
  },

  async login(req: Request): Promise<Response> {
    const rateLimit = applyRateLimit(req);
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    const body = await parseJsonBody(req);
    if (body instanceof Response) return body;

    const validated = validateBody(loginSchema, body);
    if (!validated.success) return validated.response;

    try {
      const user = await authService.validateCredentials(validated.data);
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid email or password" }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              ...rateLimitHeaders(rateLimit),
            },
          }
        );
      }
      return successResponse(user, 200, "Credentials valid");
    } catch (error) {
      return handleServiceError(error);
    }
  },

  async getProfile(): Promise<Response> {
    try {
      const session = await requireAuth();
      const profile = await authService.getProfile(session.userId);
      if (!profile) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      return successResponse(profile);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  async updateProfile(req: Request): Promise<Response> {
    try {
      const session = await requireAuth();
      const body = await parseJsonBody(req);
      if (body instanceof Response) return body;

      const validated = validateBody(updateProfileSchema, body);
      if (!validated.success) return validated.response;

      const profile = await authService.updateProfile(
        session.userId,
        validated.data
      );
      if (!profile) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      return successResponse(profile, 200, "Profile updated");
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
