/** Error returned by the backend (`{ error: { message, fields } }`) or a network failure. */
export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;
  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

/**
 * JSON request to the backend. `/api` is proxied by Vite, so the session
 * cookie is same-origin and sent automatically.
 */
export async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "Não foi possível conectar ao servidor. Verifique sua conexão.",
    );
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status,
      data?.error?.message ?? "Algo deu errado. Tente novamente.",
      data?.error?.fields,
    );
  return data as T;
}

/** User-facing message for a failed API call. */
export function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Algo deu errado. Tente novamente.";
}
