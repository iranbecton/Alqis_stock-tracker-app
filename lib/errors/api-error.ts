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
  code: ApiErrorCode;
  retryable: boolean;
};

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
}: {
  code: ApiErrorCode;
  message?: string;
  status?: number;
}) {
  const body: NormalizedApiError = {
    error: safeErrorMessage(code, message),
    code,
    retryable:
      code === "PROVIDER_UNAVAILABLE" ||
      code === "RATE_LIMITED" ||
      code === "DATABASE_UNAVAILABLE" ||
      code === "INTERNAL_ERROR",
  };

  return NextResponse.json(body, {
    status: status ?? statusByCode[code],
  });
}

export function sanitizeProviderError(error: unknown) {
  if (process.env.NODE_ENV === "development") {
    return error instanceof Error ? error.message : String(error);
  }

  return "Provider request failed.";
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
