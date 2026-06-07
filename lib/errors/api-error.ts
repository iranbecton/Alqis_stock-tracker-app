import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "PROVIDER_UNAVAILABLE"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type NormalizedApiError = {
  error: string;
  code: string;
  retryable: boolean;
  resetAt?: string;
} & Record<string, unknown>;

const defaultMessages: Record<ApiErrorCode, string> = {
  AUTH_REQUIRED: "Authentication required.",
  VALIDATION_ERROR: "Request could not be validated.",
  NOT_FOUND: "Requested resource was not found.",
  PROVIDER_UNAVAILABLE: "Provider unavailable. Please retry.",
  RATE_LIMITED: "Provider temporarily rate limited. Please retry.",
  DATABASE_UNAVAILABLE: "Database unavailable. Please retry.",
  INTERNAL_ERROR: "Something went wrong. Please retry.",
};

const statusByCode: Record<ApiErrorCode, number> = {
  AUTH_REQUIRED: 401,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  PROVIDER_UNAVAILABLE: 502,
  RATE_LIMITED: 503,
  DATABASE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

const publicCodeByCode: Record<ApiErrorCode, string> = {
  AUTH_REQUIRED: "auth_required",
  VALIDATION_ERROR: "validation_error",
  NOT_FOUND: "not_found",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  RATE_LIMITED: "rate_limited",
  DATABASE_UNAVAILABLE: "database_unavailable",
  INTERNAL_ERROR: "internal_error",
};

export function safeErrorMessage(
  code: ApiErrorCode,
  fallback = defaultMessages[code]
) {
  return fallback || defaultMessages[code];
}

export function normalizedApiError({
  code,
  message,
  status,
  resetAt,
  extra,
}: {
  code: ApiErrorCode;
  message?: string;
  status?: number;
  resetAt?: string;
  extra?: Record<string, unknown>;
}) {
  const body: NormalizedApiError = {
    ...(extra ?? {}),
    error: safeErrorMessage(code, message),
    code: publicCodeByCode[code],
    retryable:
      code === "PROVIDER_UNAVAILABLE" ||
      code === "RATE_LIMITED" ||
      code === "DATABASE_UNAVAILABLE" ||
      code === "INTERNAL_ERROR",
    ...(resetAt ? { resetAt } : {}),
  };

  return NextResponse.json(body, {
    status: status ?? statusByCode[code],
  });
}

export function sanitizeProviderError(error: unknown) {
  void error;
  return "Provider request failed.";
}

export function providerUnavailableResponse(message = "Provider unavailable. Please retry.") {
  return normalizedApiError({
    code: "PROVIDER_UNAVAILABLE",
    message,
  });
}

export function validationErrorResponse(message = "Request could not be validated.") {
  return normalizedApiError({
    code: "VALIDATION_ERROR",
    message,
  });
}

export function logServerError(
  label: string,
  context: Record<string, unknown>
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.error(label, context);
}

export function rateLimitedResponse(resetAt: string) {
  return normalizedApiError({
    code: "RATE_LIMITED",
    message: "Too many requests. Please wait and try again.",
    status: 429,
    resetAt,
  });
}
