import { z, type ZodSchema } from "zod";

export interface ValidationError {
  field: string;
  message: string;
}

export function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));
}

export function validationErrorResponse(errors: ValidationError[]): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Validation failed",
      message: errors.map((e) => `${e.field}: ${e.message}`).join("; "),
      data: { errors },
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function parseJsonBody<T>(req: Request): Promise<T | Response> {
  try {
    const body = await req.json();
    return body as T;
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export function validateBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      response: validationErrorResponse(formatZodErrors(result.error)),
    };
  }
  return { success: true, data: result.data };
}

export function validateQuery<T>(
  schema: ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; response: Response } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return validateBody(schema, params);
}

export function validateParams<T>(
  schema: ZodSchema<T>,
  params: Record<string, string>
): { success: true; data: T } | { success: false; response: Response } {
  return validateBody(schema, params);
}

export function successResponse<T>(
  data: T,
  status = 200,
  message?: string
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      ...(message ? { message } : {}),
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function errorResponse(
  error: string,
  status = 400,
  message?: string
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      ...(message ? { message } : {}),
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function handleServiceError(error: unknown): Response {
  if (error instanceof Error) {
    if (error.name === "CastError" || error.name === "BSONError") {
      return errorResponse("Invalid resource identifier", 400);
    }

    const statusCode =
      "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    return errorResponse(error.message, statusCode);
  }
  return errorResponse("Internal server error", 500);
}
