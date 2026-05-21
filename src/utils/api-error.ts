export type ApiErrorBody = {
  statusCode: number;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pushMessage(messages: string[], value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    messages.push(value.trim());
  }
}

function pushMessagesFromValue(messages: string[], value: unknown) {
  if (Array.isArray(value)) {
    value.forEach((item) => pushMessagesFromValue(messages, item));
    return;
  }

  if (isRecord(value)) {
    const before = messages.length;
    pushMessagesFromValue(messages, value.description);
    pushMessagesFromValue(messages, value.message);
    pushMessagesFromValue(messages, value.errors);
    pushMessagesFromValue(messages, value.title);

    if (messages.length > before) {
      return;
    }

    Object.values(value).forEach((item) => pushMessagesFromValue(messages, item));
    return;
  }

  pushMessage(messages, value);
}

export function parseApiErrorMessages(data: unknown): string[] {
  const messages: string[] = [];

  if (typeof data === 'string') {
    pushMessage(messages, data);
  }

  if (Array.isArray(data)) {
    pushMessagesFromValue(messages, data);
  }

  if (isRecord(data)) {
    pushMessagesFromValue(messages, data.description);
    pushMessagesFromValue(messages, data.message);
    pushMessagesFromValue(messages, data.errors);

    if (messages.length === 0) {
      pushMessage(messages, data.title);
    }
  }

  return Array.from(new Set(messages));
}

export function parseApiErrorMessage(data: unknown): string | undefined {
  return parseApiErrorMessages(data)[0];
}

export function parseRejectedApiErrorMessages(error: unknown): string[] {
  if (isRecord(error)) {
    const dataMessages = parseApiErrorMessages(error.data);

    if (dataMessages.length > 0) {
      return dataMessages;
    }

    const fallbackMessages = parseApiErrorMessages(error);

    if (fallbackMessages.length > 0) {
      return fallbackMessages;
    }

    pushMessage(fallbackMessages, error.error);
    return fallbackMessages;
  }

  return parseApiErrorMessages(error);
}

export function parseApiErrorStatusCode(
  data: unknown,
  httpStatus?: number
): number | undefined {
  if (isRecord(data) && typeof data.statusCode === 'number') {
    return data.statusCode;
  }
  return httpStatus;
}
