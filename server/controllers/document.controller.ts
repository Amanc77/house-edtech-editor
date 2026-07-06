import {
  createDocumentSchema,
  updateDocumentSchema,
  shareDocumentSchema,
  listDocumentsSchema,
  documentIdParamSchema,
} from "@/schemas/document.schema";
import { documentService } from "@/server/services/document.service";
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

export const documentController = {
  async create(req: Request): Promise<Response> {
    const rateLimit = applyRateLimit(req);
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    try {
      const session = await requireAuth();
      const body = await parseJsonBody(req);
      if (body instanceof Response) return body;

      const validated = validateBody(createDocumentSchema, body);
      if (!validated.success) return validated.response;

      const document = await documentService.create(session.userId, validated.data);
      return successResponse(document, 201, "Document created");
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async getById(
    _req: Request,
    params: { documentId: string }
  ): Promise<Response> {
    try {
      const session = await requireAuth();
      const validated = validateParams(documentIdParamSchema, params);
      if (!validated.success) return validated.response;

      const document = await documentService.getById(
        validated.data.documentId,
        session.userId
      );
      return successResponse(document);
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async update(
    req: Request,
    params: { documentId: string }
  ): Promise<Response> {
    try {
      const session = await requireAuth();
      const paramValidation = validateParams(documentIdParamSchema, params);
      if (!paramValidation.success) return paramValidation.response;

      const body = await parseJsonBody(req);
      if (body instanceof Response) return body;

      const validated = validateBody(updateDocumentSchema, body);
      if (!validated.success) return validated.response;

      const document = await documentService.update(
        paramValidation.data.documentId,
        session.userId,
        validated.data
      );
      return successResponse(document, 200, "Document updated");
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async delete(
    _req: Request,
    params: { documentId: string }
  ): Promise<Response> {
    try {
      const session = await requireAuth();
      const validated = validateParams(documentIdParamSchema, params);
      if (!validated.success) return validated.response;

      await documentService.delete(validated.data.documentId, session.userId);
      return successResponse(null, 200, "Document deleted");
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async list(req: Request): Promise<Response> {
    try {
      const session = await requireAuth();
      const url = new URL(req.url);
      const validated = validateQuery(listDocumentsSchema, url.searchParams);
      if (!validated.success) return validated.response;

      const result = await documentService.list(session.userId, validated.data);
      return successResponse(result);
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async share(
    req: Request,
    params: { documentId: string }
  ): Promise<Response> {
    try {
      const session = await requireAuth();
      const paramValidation = validateParams(documentIdParamSchema, params);
      if (!paramValidation.success) return paramValidation.response;

      const body = await parseJsonBody(req);
      if (body instanceof Response) return body;

      const validated = validateBody(shareDocumentSchema, body);
      if (!validated.success) return validated.response;

      const permission = await documentService.share(
        paramValidation.data.documentId,
        session.userId,
        validated.data
      );
      return successResponse(permission, 200, "Document shared");
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async listPermissions(
    _req: Request,
    params: { documentId: string }
  ): Promise<Response> {
    try {
      const session = await requireAuth();
      const validated = validateParams(documentIdParamSchema, params);
      if (!validated.success) return validated.response;

      const permissions = await documentService.listPermissions(
        validated.data.documentId,
        session.userId
      );
      return successResponse(permissions);
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },

  async archive(
    _req: Request,
    params: { documentId: string }
  ): Promise<Response> {
    try {
      const session = await requireAuth();
      const validated = validateParams(documentIdParamSchema, params);
      if (!validated.success) return validated.response;

      const document = await documentService.archive(
        validated.data.documentId,
        session.userId
      );
      return successResponse(document, 200, "Document archived");
    } catch (error) {
      if (error instanceof Error && error.name === "UnauthorizedError") {
        return errorResponse("Unauthorized", 401);
      }
      return handleServiceError(error);
    }
  },
};
