import type { ApiErrorBody } from '../../src/types.ts';

export function apiError(
  code: ApiErrorBody['code'],
  missing: string[],
  message: string,
): ApiErrorBody {
  return { status: 'error', code, missing, message };
}

export function isApiError(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<ApiErrorBody>;
  return candidate.status === 'error' && typeof candidate.code === 'string';
}
