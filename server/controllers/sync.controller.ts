import { syncPayloadSchema, fetchOperationsSchema } from "@/schemas/sync.schema";
import { documentIdParamSchema } from "@/schemas/document.schema";
import { syncService } from "@/server/services/sync.service";
import { applyRateLimit, rateLimitResponse } from "@/server/middleware/rateLimiter";
import { requireAuth } from "@/server/middleware/authMiddleware";
import {
  parseJsonBody,
  validateBody,
  validateQuery,
  validateParams,
  successResponse,
  handleServiceError,
  errorResponse,
} from "@/server/middleware/validatePayload";

export const syncController = {
  async sync(req: Request): Promise<Response> {
    const rateLimit = applyRateLimit(req);
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    try {
      const session = await requireAuth();
      const body = await parseJsonBody(req);
      if (body instanceof Response) return body;

      const validated = validateBody(syncPayloadSchema, body);
      if (!validated.success) return validated.response;

      const result = await syncService.syncOperations(
        session.userId,
        validated.data
      );
      return successResponse(result, 200, "Sync completed");
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async fetchOperations(req: Request): Promise<Response> {
    try {
      const session = await requireAuth();
      const url = new URL(req.url);
      const validated = validateQuery(fetchOperationsSchema, url.searchParams);
      if (!validated.success) return validated.response;

      const result = await syncService.fetchOperations(
        session.userId,
        validated.data
      );
      return successResponse(result);
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async getState(
    _req: Request,
    params: { documentId: string }
  ): Promise<Response> {
    try {
      const session = await requireAuth();
      const validated = validateParams(documentIdParamSchema, params);
      if (!validated.success) return validated.response;

      const state = await syncService.getDocumentState(
        validated.data.documentId,
        session.userId
      );
      return successResponse(state);
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },
};
