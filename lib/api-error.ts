import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorStatus = 400 | 401 | 403 | 404 | 429 | 500;

export type ApiErrorOptions = {
  code?: string;
  details?: Record<string, unknown>;
  headers?: HeadersInit;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly status: ApiErrorStatus;
  readonly code?: string;
  readonly details?: Record<string, unknown>;
  readonly headers?: HeadersInit;

  constructor(status: ApiErrorStatus, message: string, options: ApiErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "ApiError";
    this.status = status;
    this.code = options.code;
    this.details = options.details;
    this.headers = options.headers;
  }

  static badRequest(message = "Invalid request", options?: ApiErrorOptions) {
    return new ApiError(400, message, options);
  }

  static unauthorized(message = "Unauthorized", options?: ApiErrorOptions) {
    return new ApiError(401, message, options);
  }

  static notFound(message = "Resource not found", options?: ApiErrorOptions) {
    return new ApiError(404, message, options);
  }

  static tooManyRequests(
    message = "Too many requests. Please try again later.",
    options?: ApiErrorOptions,
  ) {
    return new ApiError(429, message, options);
  }

  static internal(
    message = "Something went wrong. Please try again.",
    options?: ApiErrorOptions,
  ) {
    return new ApiError(500, message, options);
  }
}

export function errorResponse(
  status: ApiErrorStatus,
  message: string,
  options: Omit<ApiErrorOptions, "cause"> = {},
) {
  const body: Record<string, unknown> = {
    error: message,
    ...(options.code ? { code: options.code } : {}),
    ...(options.details ?? {}),
  };

  return NextResponse.json(body, {
    status,
    ...(options.headers ? { headers: options.headers } : {}),
  });
}

export async function parseJsonBody(
  request: Request,
  invalidMessage = "Invalid request body",
): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw ApiError.badRequest(invalidMessage);
  }
}

function isPostgrestRangeError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "PGRST103"
  );
}

export type HandleApiErrorOptions = {
  context?: string;
  fallbackMessage?: string;
  headers?: HeadersInit;
};

export function handleApiError(
  error: unknown,
  options: HandleApiErrorOptions = {},
) {
  const mergedHeaders =
    error instanceof ApiError ? (error.headers ?? options.headers) : options.headers;

  if (error instanceof ApiError) {
    if (error.status >= 500) {
      console.error(
        options.context ? `${options.context}:` : "API server error:",
        error.cause ?? error,
      );
    }

    return errorResponse(error.status, error.message, {
      code: error.code,
      details: error.details,
      headers: mergedHeaders,
    });
  }

  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Invalid request";
    return errorResponse(400, message, { headers: mergedHeaders });
  }

  if (isPostgrestRangeError(error)) {
    return errorResponse(400, "Page is out of range", { headers: mergedHeaders });
  }

  console.error(
    options.context ? `${options.context}:` : "Unhandled API error:",
    error,
  );

  return errorResponse(
    500,
    options.fallbackMessage ?? "Something went wrong. Please try again.",
    { headers: mergedHeaders },
  );
}
