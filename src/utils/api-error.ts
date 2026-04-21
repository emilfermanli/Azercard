export type ApiErrorBody = {
  statusCode: number;
  message: string;
};

export function parseApiErrorMessage(data: unknown): string | undefined {
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof (data as { message: unknown }).message === 'string'
  ) {
    return (data as { message: string }).message;
  }
  return undefined;
}

export function parseApiErrorStatusCode(
  data: unknown,
  httpStatus?: number
): number | undefined {
  if (
    typeof data === 'object' &&
    data !== null &&
    'statusCode' in data &&
    typeof (data as { statusCode: unknown }).statusCode === 'number'
  ) {
    return (data as { statusCode: number }).statusCode;
  }
  return httpStatus;
}
