import {
  createVersionSchema,
  restoreVersionSchema,
  listVersionsSchema,
  versionIdParamSchema,
} from "@/schemas/version.schema";
import { documentIdParamSchema } from "@/schemas/document.schema";
import { versionService } from "@/server/services/version.service";
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

export const versionController = {
  async create(
    req: Request,
    params: { documentId: string }
  ): Promise<Response> {
    try {
      const session = await requireAuth();
      const paramValidation = validateParams(documentIdParamSchema, params);
      if (!paramValidation.success) return paramValidation.response;

      const body = await parseJsonBody(req);
      if (body instanceof Response) return body;

      const validated = validateBody(createVersionSchema, body);
      if (!validated.success) return validated.response;

      const version = await versionService.createSnapshot(
        paramValidation.data.documentId,
        session.userId,
        validated.data
      );
      return successResponse(version, 201, "Snapshot created");
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async list(
    req: Request,
    params: { documentId: string }
  ): Promise<Response> {
    try {
      const session = await requireAuth();
      const paramValidation = validateParams(documentIdParamSchema, params);
      if (!paramValidation.success) return paramValidation.response;

      const url = new URL(req.url);
      const validated = validateQuery(listVersionsSchema, url.searchParams);
      if (!validated.success) return validated.response;

      const result = await versionService.listVersions(
        paramValidation.data.documentId,
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

  async getById(
    _req: Request,
    params: { documentId: string; versionId: string }
  ): Promise<Response> {
    try {
      const session = await requireAuth();
      const validated = validateParams(versionIdParamSchema, params);
      if (!validated.success) return validated.response;

      const version = await versionService.getVersion(
        validated.data.documentId,
        validated.data.versionId,
        session.userId
      );
      return successResponse(version);
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async restore(
    req: Request,
    params: { documentId: string }
  ): Promise<Response> {
    try {
      const session = await requireAuth();
      const paramValidation = validateParams(documentIdParamSchema, params);
      if (!paramValidation.success) return paramValidation.response;

      const body = await parseJsonBody(req);
      if (body instanceof Response) return body;

      const validated = validateBody(restoreVersionSchema, body);
      if (!validated.success) return validated.response;

      const result = await versionService.restoreVersion(
        paramValidation.data.documentId,
        session.userId,
        validated.data.versionId
      );
      return successResponse(result, 200, "Version restored");
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },
};
