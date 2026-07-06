import { aiRequestSchema, aiBatchRequestSchema } from "@/schemas/ai.schema";
import { aiService } from "@/server/services/ai.service";
import { applyRateLimit, rateLimitResponse } from "@/server/middleware/rateLimiter";
import { requireAuth } from "@/server/middleware/authMiddleware";
import {
  parseJsonBody,
  validateBody,
  successResponse,
  handleServiceError,
  errorResponse,
} from "@/server/middleware/validatePayload";

export const aiController = {
  async process(req: Request): Promise<Response> {
    const rateLimit = applyRateLimit(req);
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    try {
      const session = await requireAuth();
      const body = await parseJsonBody(req);
      if (body instanceof Response) return body;

      const validated = validateBody(aiRequestSchema, body);
      if (!validated.success) return validated.response;

      const result = await aiService.process(session.userId, validated.data);
      return successResponse(result);
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async processBatch(req: Request): Promise<Response> {
    const rateLimit = applyRateLimit(req);
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    try {
      const session = await requireAuth();
      const body = await parseJsonBody(req);
      if (body instanceof Response) return body;

      const validated = validateBody(aiBatchRequestSchema, body);
      if (!validated.success) return validated.response;

      const results = await aiService.processBatch(
        session.userId,
        validated.data.requests
      );
      return successResponse(results);
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },
};
