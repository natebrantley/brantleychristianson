/**
 * Typed API error codes and user-facing messages.
 * Never expose Repliers error text or stack traces to the client.
 */

export const API_ERROR_CODES = {
  REPLIERS_UNAVAILABLE: 'REPLIERS_UNAVAILABLE',
  REPLIERS_RATE_LIMIT: 'REPLIERS_RATE_LIMIT',
  REPLIERS_406_SAVED_SEARCH: 'REPLIERS_406_SAVED_SEARCH',
  REPLIERS_NLP_NOT_SEARCH: 'REPLIERS_NLP_NOT_SEARCH',
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL: 'INTERNAL',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

const USER_MESSAGES: Record<ApiErrorCode, string> = {
  [API_ERROR_CODES.REPLIERS_UNAVAILABLE]:
    'Listing data is temporarily unavailable. Please try again in a moment.',
  [API_ERROR_CODES.REPLIERS_RATE_LIMIT]:
    'Too many requests. Please wait a moment and try again.',
  [API_ERROR_CODES.REPLIERS_406_SAVED_SEARCH]:
    'Narrow your search (e.g. add city or price range) and try again.',
  [API_ERROR_CODES.REPLIERS_NLP_NOT_SEARCH]:
    'Try a search like "3 bed condo in Portland" or add a location or property type.',
  [API_ERROR_CODES.INVALID_INPUT]: 'Invalid request. Please check your search or filters.',
  [API_ERROR_CODES.UNAUTHORIZED]: 'Please sign in to continue.',
  [API_ERROR_CODES.NOT_FOUND]: 'The requested listing was not found.',
  [API_ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action.',
  [API_ERROR_CODES.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later.',
  [API_ERROR_CODES.INTERNAL]:
    'Something went wrong. Please try again or contact us if the problem persists.',
};

const HTTP_STATUS: Record<ApiErrorCode, number> = {
  [API_ERROR_CODES.REPLIERS_UNAVAILABLE]: 503,
  [API_ERROR_CODES.REPLIERS_RATE_LIMIT]: 429,
  [API_ERROR_CODES.REPLIERS_406_SAVED_SEARCH]: 400,
  [API_ERROR_CODES.REPLIERS_NLP_NOT_SEARCH]: 400,
  [API_ERROR_CODES.INVALID_INPUT]: 400,
  [API_ERROR_CODES.UNAUTHORIZED]: 401,
  [API_ERROR_CODES.NOT_FOUND]: 404,
  [API_ERROR_CODES.FORBIDDEN]: 403,
  [API_ERROR_CODES.TOO_MANY_REQUESTS]: 429,
  [API_ERROR_CODES.INTERNAL]: 500,
};

export interface ApiErrorResponse {
  error: string;
  code?: ApiErrorCode;
}

export function getMessage(code: ApiErrorCode): string {
  return USER_MESSAGES[code] ?? USER_MESSAGES[API_ERROR_CODES.INTERNAL];
}

export function getStatus(code: ApiErrorCode): number {
  return HTTP_STATUS[code] ?? 500;
}

export function apiErrorResponse(
  code: ApiErrorCode,
  options?: { includeCode?: boolean }
): { body: ApiErrorResponse; status: number } {
  return {
    body: {
      error: getMessage(code),
      ...(options?.includeCode !== false && { code }),
    },
    status: getStatus(code),
  };
}
